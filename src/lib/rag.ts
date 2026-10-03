import occupanciesData from '@/data/occupancies.json';
import tariffData from '@/data/tariff_rules.json';
import eqZonesData from '@/data/earthquake_zones.json';

export interface OccupancyCandidate {
  code: string;
  description: string;
  category: string | number;
  section?: string;
  flexa_rate?: number;
  loss_cost?: number;
  baseLossCostBuilding?: number;
  baseLossCostPM?: number;
  baseLossCostStock?: number;
  hazardRating?: string;
  confidence: number;
  reason: string;
  sourceDocument: string;
}

export interface RAGClassificationResult {
  topCandidates: OccupancyCandidate[];
  primaryCandidate: OccupancyCandidate | null;
  confidenceTier: 'auto_select' | 'top_three' | 'requires_clarification';
  clarificationQuestion?: string;
  matchedKeywords: string[];
  eqZoneMatch?: {
    district: string;
    state: string;
    zone: string;
    eqRatePerMille: number;
    confidence: number;
  };
}

// Stopwords: strictly pure grammatical particles — NEVER filter commercial words like trading, goods, retail, wholesale, etc.
const GENERIC_STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'of', 'in', 'on', 'at', 'to', 'for', 'with', 'by',
  'from', 'as', 'is', 'was', 'are', 'were', 'be', 'this', 'that', 'these', 'those',
  'into', 'onto', 'upon', 'about', 'above', 'below', 'under', 'etc'
]);

/**
 * Normalizes text for token search, filtering non-distinctive generic terms
 */
function tokenize(text: unknown): string[] {
  if (text === null || text === undefined) return [];
  const str = typeof text === 'string' ? text : String(text);
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !GENERIC_STOPWORDS.has(t));
}

/**
 * Hybrid Statutory & Semantic Search over IIB Schedule 3 (AIFT 2001)
 */
export function searchOccupanciesRAG(businessDescription: string, limit: number = 5): RAGClassificationResult {
  const queryTokens = tokenize(businessDescription || '');
  const matchedKeywordsSet = new Set<string>();
  const queryDesc = (businessDescription || '').toLowerCase();

  // Commercial Activity Intent Signals
  const isStorage = /storage|warehouse|godown|depot|silo|stocking/i.test(queryDesc);
  const isTrading = /trading|trade|wholesale|retail|dealer|distributor|shop|showroom|merchant/i.test(queryDesc);
  const isManufacturing = /manufactur|factory|plant|fabricat|processing|refiner|mill|foundry|workshop|stamping|extruding|smelting/i.test(queryDesc);
  const isOffice = /office|it\b|software|bpo|call center|bank|consulting|corporate/i.test(queryDesc);

  const scored = occupanciesData.map((occ: any) => {
    let score = 0;
    const descLower = (occ.description || '').toLowerCase();
    const descTokens = tokenize(descLower);
    const catTokens = tokenize(occ.category_tag || occ.category || '');
    const keywords = (occ.keywords || []).map((k: any) => String(k).toLowerCase()).filter((k: string) => !GENERIC_STOPWORDS.has(k));

    // 1. Exact phrase matches in description
    if (descLower && queryDesc && queryDesc.length >= 5 && descLower.includes(queryDesc.slice(0, 30))) {
      score += 40;
    }

    // 2. Distinctive token overlap
    for (const qt of queryTokens) {
      if (descTokens.includes(qt)) {
        score += 25;
        matchedKeywordsSet.add(qt);
      }
      if (catTokens.includes(qt)) {
        score += 10;
        matchedKeywordsSet.add(qt);
      }
      for (const kw of keywords) {
        if (kw === qt) {
          score += 30;
          matchedKeywordsSet.add(kw);
        } else if (kw.includes(qt) || qt.includes(kw)) {
          score += 15;
          matchedKeywordsSet.add(kw);
        }
      }
      if (descLower.includes(qt)) {
        score += 15;
      }
    }

    // 3. Section & Intent Alignment (AIFT 2001 Structure)
    if (isStorage && !isManufacturing) {
      if (occ.section === 'VI') score += 70;
      if (descLower.includes('godowns') || descLower.includes('storage of')) score += 40;
      if (occ.section === 'IV') score -= 90; // Strictly penalize manufacturing for storage trade
    }

    if (isTrading && !isManufacturing) {
      if (occ.section === 'III') score += 45;
      if (descLower.includes('shop') || descLower.includes('otherwise not provided')) score += 35;
      if (occ.section === 'IV') score -= 70;
    }

    if (isManufacturing) {
      if (occ.section === 'IV') score += 50;
      if (occ.section === 'VI') score -= 40;
    }

    if (isOffice) {
      if (occ.code === '1001' || descLower.includes('office')) score += 60;
      if (occ.section === 'IV') score -= 80;
    }    // 4. Domain Specific Trade Rules (Statutory AIFT 2001 Section VI & III)
    // Oils / Almond Oil / Cosmetics / Category 1 Hazardous Storage
    const hasCategory1Goods = queryDesc.includes('oil') || queryDesc.includes('almond') || queryDesc.includes('cosmetic') || queryDesc.includes('perfume') || queryDesc.includes('paint');
    if (hasCategory1Goods) {
      if (occ.code === '4002') score += 120; // Category I Hazardous Goods (Godowns & Silos)
      if (occ.code === '4001') score -= 70;  // Precluded from Non-hazardous godowns under AIFT warranty
      if (occ.code === '1023') score += 35;
    } else if (queryDesc.includes('food') || queryDesc.includes('nestle') || queryDesc.includes('fmcg') || queryDesc.includes('grocery')) {
      if (occ.code === '4001') score += 75; // Non-hazardous storage (pure dry food items)
      if (descLower.includes('non-hazardous')) score += 30;
      if (occ.code === '1023') score += 35;
    }

    // Retail shops and showrooms
    if (queryDesc.includes('retail') || queryDesc.includes('shop') || queryDesc.includes('readymade') || queryDesc.includes('garments') || queryDesc.includes('clothes')) {
      if (occ.code === '1023') score += 80; // Shops dealing in goods otherwise not provided for
      if (occ.code === '1011') score += 40; // Showrooms
    }

    // Engineering / CNC / Tooling / Auto Parts
    if (queryDesc.includes('metal') || queryDesc.includes('cnc') || queryDesc.includes('machin') || queryDesc.includes('stamping') || queryDesc.includes('lathe') || queryDesc.includes('workshop')) {
      if (occ.code === '2212' || descLower.includes('automobile') || descLower.includes('engineering workshop')) score += 50;
      if (occ.code === '1023') score += 20;
    }

    // Pharma Cleanroom
    if (queryDesc.includes('pharma') || queryDesc.includes('tablet') || queryDesc.includes('cleanroom') || queryDesc.includes('api')) {
      if (descLower.includes('pharmaceutical')) score += 70;
    }

    // Textiles / Weaving / Spinning
    if (queryDesc.includes('textile') || queryDesc.includes('cotton') || queryDesc.includes('spinning') || queryDesc.includes('weaving')) {
      if (descLower.includes('cotton') || descLower.includes('spinning') || descLower.includes('weaving')) score += 70;
    }

    // Negative filtering for specific hazardous materials NOT in query
    if (!queryDesc.includes('cold') && descLower.includes('cold storage')) score -= 80;
    if (!queryDesc.includes('coir') && descLower.includes('coir')) score -= 80;
    if (!queryDesc.includes('waste') && descLower.includes('waste')) score -= 60;
    if (!queryDesc.includes('open') && descLower.includes('(open)')) score -= 40;
    if (!queryDesc.includes('transporter') && descLower.includes('transporter')) score -= 30;

    return {
      occ,
      score,
    };
  });

  scored.sort((a, b) => b.score - a.score);

  // Normalize confidence percentage as a decimal (0.75 - 0.98)
  const maxScore = Math.max(scored[0]?.score || 1, 1);
  const topMatches = scored.slice(0, limit).map(({ occ, score }) => {
    let confidence = 0.85;
    if (score >= 45) {
      confidence = Number((Math.min(0.98, 0.88 + (score / (maxScore + 10)) * 0.09)).toFixed(2));
    } else if (score >= 20) {
      confidence = Number((0.75 + (score / 45) * 0.12).toFixed(2));
    } else {
      confidence = Number((0.55 + (score / 20) * 0.18).toFixed(2));
    }

    const rate = occ.flexa_rate || occ.loss_cost || 0.65;
    const secName =
      occ.section === 'VI'
        ? 'Storage & Warehousing'
        : occ.section === 'III'
        ? 'Commercial & Mercantile'
        : occ.section === 'V'
        ? 'Utilities & Labs'
        : 'Industrial Manufacturing';

    const reason = `Statutory rating under AIFT 2001 Section ${occ.section || 'VI'} (${secName}). Base peril rate: ${rate.toFixed(4)}‰ (Risk Category ${occ.category || 1}). Conforms to IIB Schedule 3 loss cost metrics.`;

    return {
      code: occ.code,
      description: occ.description,
      category: occ.category,
      section: occ.section,
      flexa_rate: occ.flexa_rate,
      loss_cost: occ.loss_cost,
      hazardRating: occ.category > 2 ? 'High' : 'Normal',
      confidence,
      reason,
      sourceDocument: 'IIB Loss Cost - Schedule 3 (AIFT 2001 Tariff)',
    } as OccupancyCandidate;
  });

  const primaryCandidate = topMatches[0] || null;
  const primaryConfidence = primaryCandidate?.confidence || 0;

  let confidenceTier: 'auto_select' | 'top_three' | 'requires_clarification' = 'top_three';
  let clarificationQuestion: string | undefined = undefined;

  if (primaryConfidence >= 0.95) {
    confidenceTier = 'auto_select';
  } else if (primaryConfidence >= 0.80) {
    confidenceTier = 'top_three';
  } else {
    confidenceTier = 'requires_clarification';
  }

  if (queryDesc.includes('oil') || queryDesc.includes('cosmetic')) {
    clarificationQuestion =
      'Are the almond oils and cosmetic items stored in sealed retail packaging inside a pucca godown, or is there open storage / bulk dispensing of flammable liquids?';
  } else if (!clarificationQuestion) {
    clarificationQuestion = `Does the facility have certified fire hydrant systems or automatic sprinkler protection compliant with TAC guidelines?`;
  }

  return {
    topCandidates: topMatches.slice(0, 3),
    primaryCandidate,
    confidenceTier,
    clarificationQuestion,
    matchedKeywords: Array.from(matchedKeywordsSet).slice(0, 8),
  };
}

const PINCODE_PREFIX_MAP: Array<{
  prefix: RegExp;
  district: string;
  state: string;
  zone: string;
  zoneCode: string;
  rateSecIII: number;
  hazard: string;
}> = [
  // Delhi NCR (Zone IV / Tariff Zone 2)
  { prefix: /^11/, district: 'Delhi NCR', state: 'Delhi', zone: 'Zone IV', zoneCode: 'Zone 2', rateSecIII: 0.15, hazard: 'High Damage Risk' },
  { prefix: /^12[12]/, district: 'Faridabad / Gurugram', state: 'Haryana (Delhi NCR)', zone: 'Zone IV', zoneCode: 'Zone 2', rateSecIII: 0.15, hazard: 'High Damage Risk' },
  { prefix: /^201/, district: 'Gautam Buddha Nagar (Noida) / Ghaziabad', state: 'Uttar Pradesh (Delhi NCR)', zone: 'Zone IV', zoneCode: 'Zone 2', rateSecIII: 0.15, hazard: 'High Damage Risk' },
  
  // Haryana / Punjab / Chandigarh (Zone IV / Tariff Zone 2)
  { prefix: /^12|^13/, district: 'Ambala / Sonipat / Rohtak', state: 'Haryana', zone: 'Zone IV', zoneCode: 'Zone 2', rateSecIII: 0.15, hazard: 'High Damage Risk' },
  { prefix: /^14|^15|^16/, district: 'Ludhiana / Amritsar / Chandigarh', state: 'Punjab / Chandigarh', zone: 'Zone IV', zoneCode: 'Zone 2', rateSecIII: 0.15, hazard: 'High Damage Risk' },
  
  // Himachal / J&K / Uttarakhand (Zone IV - V / Zone 1 - 2)
  { prefix: /^17[567]/, district: 'Kangra / Kullu / Mandi', state: 'Himachal Pradesh', zone: 'Zone V', zoneCode: 'Zone 1', rateSecIII: 0.25, hazard: 'Very High Damage Risk' },
  { prefix: /^17/, district: 'Shimla / Solan', state: 'Himachal Pradesh', zone: 'Zone IV', zoneCode: 'Zone 2', rateSecIII: 0.15, hazard: 'High Damage Risk' },
  { prefix: /^19/, district: 'Srinagar / Baramulla', state: 'Jammu & Kashmir', zone: 'Zone V', zoneCode: 'Zone 1', rateSecIII: 0.25, hazard: 'Very High Damage Risk' },
  { prefix: /^18/, district: 'Jammu / Udhampur', state: 'Jammu & Kashmir', zone: 'Zone IV', zoneCode: 'Zone 2', rateSecIII: 0.15, hazard: 'High Damage Risk' },
  { prefix: /^246|^249/, district: 'Chamoli / Uttarkashi / Pithoragarh', state: 'Uttarakhand', zone: 'Zone V', zoneCode: 'Zone 1', rateSecIII: 0.25, hazard: 'Very High Damage Risk' },
  { prefix: /^248|^263/, district: 'Dehradun / Nainital', state: 'Uttarakhand', zone: 'Zone IV', zoneCode: 'Zone 2', rateSecIII: 0.15, hazard: 'High Damage Risk' },

  // Gujarat
  { prefix: /^370/, district: 'Kutch (Bhuj, Gandhidham, Mundra)', state: 'Gujarat', zone: 'Zone V', zoneCode: 'Zone 1', rateSecIII: 0.25, hazard: 'Very High Damage Risk' },
  { prefix: /^380|^382/, district: 'Ahmedabad / Gandhinagar', state: 'Gujarat', zone: 'Zone IV', zoneCode: 'Zone 2', rateSecIII: 0.15, hazard: 'High Damage Risk' },
  { prefix: /^395/, district: 'Surat', state: 'Gujarat', zone: 'Zone IV', zoneCode: 'Zone 2', rateSecIII: 0.15, hazard: 'High Damage Risk' },
  { prefix: /^360/, district: 'Rajkot', state: 'Gujarat', zone: 'Zone IV', zoneCode: 'Zone 2', rateSecIII: 0.15, hazard: 'High Damage Risk' },
  { prefix: /^390/, district: 'Vadodara', state: 'Gujarat', zone: 'Zone III', zoneCode: 'Zone 3', rateSecIII: 0.10, hazard: 'Moderate Damage Risk' },
  { prefix: /^3[6-9]/, district: 'Gujarat Region', state: 'Gujarat', zone: 'Zone III', zoneCode: 'Zone 3', rateSecIII: 0.10, hazard: 'Moderate Damage Risk' },

  // Maharashtra / Mumbai / Pune (Zone III / Tariff Zone 3)
  { prefix: /^400|^401/, district: 'Mumbai / Thane / Navi Mumbai', state: 'Maharashtra', zone: 'Zone III', zoneCode: 'Zone 3', rateSecIII: 0.10, hazard: 'Moderate Damage Risk' },
  { prefix: /^411|^412/, district: 'Pune', state: 'Maharashtra', zone: 'Zone III', zoneCode: 'Zone 3', rateSecIII: 0.10, hazard: 'Moderate Damage Risk' },
  { prefix: /^422/, district: 'Nashik', state: 'Maharashtra', zone: 'Zone III', zoneCode: 'Zone 3', rateSecIII: 0.10, hazard: 'Moderate Damage Risk' },
  { prefix: /^431/, district: 'Chhatrapati Sambhajinagar (Aurangabad)', state: 'Maharashtra', zone: 'Zone III', zoneCode: 'Zone 3', rateSecIII: 0.10, hazard: 'Moderate Damage Risk' },
  { prefix: /^440/, district: 'Nagpur', state: 'Maharashtra', zone: 'Zone III', zoneCode: 'Zone 3', rateSecIII: 0.10, hazard: 'Moderate Damage Risk' },
  { prefix: /^403/, district: 'Goa', state: 'Goa', zone: 'Zone III', zoneCode: 'Zone 3', rateSecIII: 0.10, hazard: 'Moderate Damage Risk' },
  { prefix: /^4[0-4]/, district: 'Maharashtra / Goa', state: 'Maharashtra', zone: 'Zone III', zoneCode: 'Zone 3', rateSecIII: 0.10, hazard: 'Moderate Damage Risk' },

  // Karnataka / Bengaluru (Zone II / Tariff Zone 4)
  { prefix: /^560|^561|^562/, district: 'Bengaluru Urban & Rural', state: 'Karnataka', zone: 'Zone II', zoneCode: 'Zone 4', rateSecIII: 0.05, hazard: 'Low Damage Risk' },
  { prefix: /^575|^576/, district: 'Mangalore / Udupi', state: 'Karnataka', zone: 'Zone III', zoneCode: 'Zone 3', rateSecIII: 0.10, hazard: 'Moderate Damage Risk' },
  { prefix: /^5[6-9]/, district: 'Karnataka Interior', state: 'Karnataka', zone: 'Zone II', zoneCode: 'Zone 4', rateSecIII: 0.05, hazard: 'Low Damage Risk' },

  // Telangana / Hyderabad (Zone II / Tariff Zone 4)
  { prefix: /^500|^501|^502/, district: 'Hyderabad / Secunderabad / Rangareddy', state: 'Telangana', zone: 'Zone II', zoneCode: 'Zone 4', rateSecIII: 0.05, hazard: 'Low Damage Risk' },
  { prefix: /^50/, district: 'Telangana', state: 'Telangana', zone: 'Zone II', zoneCode: 'Zone 4', rateSecIII: 0.05, hazard: 'Low Damage Risk' },

  // Andhra Pradesh (Visakhapatnam, Vijayawada Zone III)
  { prefix: /^530|^531/, district: 'Visakhapatnam', state: 'Andhra Pradesh', zone: 'Zone III', zoneCode: 'Zone 3', rateSecIII: 0.10, hazard: 'Moderate Damage Risk' },
  { prefix: /^520|^521/, district: 'Vijayawada (NTR)', state: 'Andhra Pradesh', zone: 'Zone III', zoneCode: 'Zone 3', rateSecIII: 0.10, hazard: 'Moderate Damage Risk' },
  { prefix: /^5[1-3]/, district: 'Andhra Pradesh', state: 'Andhra Pradesh', zone: 'Zone III', zoneCode: 'Zone 3', rateSecIII: 0.10, hazard: 'Moderate Damage Risk' },

  // Tamil Nadu (Chennai Zone III, Madurai Zone II)
  { prefix: /^600|^601|^602|^603/, district: 'Chennai / Kanchipuram / Thiruvallur', state: 'Tamil Nadu', zone: 'Zone III', zoneCode: 'Zone 3', rateSecIII: 0.10, hazard: 'Moderate Damage Risk' },
  { prefix: /^641/, district: 'Coimbatore', state: 'Tamil Nadu', zone: 'Zone III', zoneCode: 'Zone 3', rateSecIII: 0.10, hazard: 'Moderate Damage Risk' },
  { prefix: /^625/, district: 'Madurai', state: 'Tamil Nadu', zone: 'Zone II', zoneCode: 'Zone 4', rateSecIII: 0.05, hazard: 'Low Damage Risk' },
  { prefix: /^6[0-4]/, district: 'Tamil Nadu', state: 'Tamil Nadu', zone: 'Zone III', zoneCode: 'Zone 3', rateSecIII: 0.10, hazard: 'Moderate Damage Risk' },

  // Kerala (Zone III / Tariff Zone 3)
  { prefix: /^682/, district: 'Kochi (Ernakulam)', state: 'Kerala', zone: 'Zone III', zoneCode: 'Zone 3', rateSecIII: 0.10, hazard: 'Moderate Damage Risk' },
  { prefix: /^695/, district: 'Thiruvananthapuram', state: 'Kerala', zone: 'Zone III', zoneCode: 'Zone 3', rateSecIII: 0.10, hazard: 'Moderate Damage Risk' },
  { prefix: /^6[7-9]/, district: 'Kerala', state: 'Kerala', zone: 'Zone III', zoneCode: 'Zone 3', rateSecIII: 0.10, hazard: 'Moderate Damage Risk' },

  // West Bengal & Kolkata (Zone IV / Tariff Zone 2)
  { prefix: /^700|^711/, district: 'Kolkata / Howrah', state: 'West Bengal', zone: 'Zone IV', zoneCode: 'Zone 2', rateSecIII: 0.15, hazard: 'High Damage Risk' },
  { prefix: /^734/, district: 'Siliguri / Darjeeling', state: 'West Bengal', zone: 'Zone IV', zoneCode: 'Zone 2', rateSecIII: 0.15, hazard: 'High Damage Risk' },
  { prefix: /^7[0-4]/, district: 'West Bengal', state: 'West Bengal', zone: 'Zone IV', zoneCode: 'Zone 2', rateSecIII: 0.15, hazard: 'High Damage Risk' },

  // Northeast (Zone V / Tariff Zone 1)
  { prefix: /^781/, district: 'Guwahati (Kamrup)', state: 'Assam', zone: 'Zone V', zoneCode: 'Zone 1', rateSecIII: 0.25, hazard: 'Very High Damage Risk' },
  { prefix: /^78|^79/, district: 'Northeast Region (Assam / Meghalaya / Tripura / Mizoram / Manipur / Nagaland / Arunachal)', state: 'Northeast States', zone: 'Zone V', zoneCode: 'Zone 1', rateSecIII: 0.25, hazard: 'Very High Damage Risk' },

  // Bihar
  { prefix: /^846|^847|^854/, district: 'Darbhanga / Madhubani / Saharsa', state: 'Bihar', zone: 'Zone V', zoneCode: 'Zone 1', rateSecIII: 0.25, hazard: 'Very High Damage Risk' },
  { prefix: /^800/, district: 'Patna', state: 'Bihar', zone: 'Zone IV', zoneCode: 'Zone 2', rateSecIII: 0.15, hazard: 'High Damage Risk' },
  { prefix: /^8[0-5]/, district: 'Bihar', state: 'Bihar', zone: 'Zone IV', zoneCode: 'Zone 2', rateSecIII: 0.15, hazard: 'High Damage Risk' },

  // Rajasthan
  { prefix: /^302/, district: 'Jaipur', state: 'Rajasthan', zone: 'Zone III', zoneCode: 'Zone 3', rateSecIII: 0.10, hazard: 'Moderate Damage Risk' },
  { prefix: /^342/, district: 'Jodhpur', state: 'Rajasthan', zone: 'Zone III', zoneCode: 'Zone 3', rateSecIII: 0.10, hazard: 'Moderate Damage Risk' },
  { prefix: /^3[0-4]/, district: 'Rajasthan', state: 'Rajasthan', zone: 'Zone III', zoneCode: 'Zone 3', rateSecIII: 0.10, hazard: 'Moderate Damage Risk' },

  // Odisha / Jharkhand / Chhattisgarh (Zone II / Zone 4)
  { prefix: /^751/, district: 'Bhubaneswar', state: 'Odisha', zone: 'Zone II', zoneCode: 'Zone 4', rateSecIII: 0.05, hazard: 'Low Damage Risk' },
  { prefix: /^7[5-7]/, district: 'Odisha', state: 'Odisha', zone: 'Zone II', zoneCode: 'Zone 4', rateSecIII: 0.05, hazard: 'Low Damage Risk' },
  { prefix: /^834/, district: 'Ranchi', state: 'Jharkhand', zone: 'Zone II', zoneCode: 'Zone 4', rateSecIII: 0.05, hazard: 'Low Damage Risk' },
  { prefix: /^8[23]/, district: 'Jharkhand', state: 'Jharkhand', zone: 'Zone II', zoneCode: 'Zone 4', rateSecIII: 0.05, hazard: 'Low Damage Risk' },
  { prefix: /^492/, district: 'Raipur', state: 'Chhattisgarh', zone: 'Zone II', zoneCode: 'Zone 4', rateSecIII: 0.05, hazard: 'Low Damage Risk' },
  { prefix: /^49/, district: 'Chhattisgarh', state: 'Chhattisgarh', zone: 'Zone II', zoneCode: 'Zone 4', rateSecIII: 0.05, hazard: 'Low Damage Risk' },
];

/**
 * Searches Earthquake Zone from official EQ zoning dataset + Indian Postal PIN Code Engine
 */
export function matchDistrictEQZone(districtQuery: string): { district: string; state: string; zone: string; eqRatePerMille: number; confidence: number; hazardLevel?: string } | null {
  if (!districtQuery || typeof districtQuery !== 'string') return null;
  const query = districtQuery.trim().toLowerCase();

  // 1. PIN code matching
  const pinMatch = query.match(/\b([1-9][0-9]{5})\b/);
  if (pinMatch) {
    const pin = pinMatch[1];
    for (const entry of PINCODE_PREFIX_MAP) {
      if (entry.prefix.test(pin)) {
        return {
          district: `${entry.district} (PIN: ${pin})`,
          state: entry.state,
          zone: entry.zoneCode,
          eqRatePerMille: entry.rateSecIII,
          confidence: 99,
          hazardLevel: `${entry.zone} - ${entry.hazard}`,
        };
      }
    }
  }

  // 2. City & District keyword aliases
  const CITY_KEYWORDS: Array<{ keywords: string[]; district: string; state: string; zone: string; zoneCode: string; rate: number; hazard: string }> = [
    { keywords: ['delhi', 'new delhi', 'noida', 'gurgaon', 'gurugram', 'faridabad', 'ghaziabad', 'sonipat', 'ncr'], district: 'Delhi NCR', state: 'Delhi NCR', zone: 'Zone IV', zoneCode: 'Zone 2', rate: 0.15, hazard: 'High Damage Risk' },
    { keywords: ['kutch', 'bhuj', 'gandhidham', 'mundra', 'anjar'], district: 'Kutch', state: 'Gujarat', zone: 'Zone V', zoneCode: 'Zone 1', rate: 0.25, hazard: 'Very High Damage Risk' },
    { keywords: ['ahmedabad', 'surat', 'rajkot', 'bhavnagar', 'morbi', 'surendranagar'], district: 'Ahmedabad / Saurashtra', state: 'Gujarat', zone: 'Zone IV', zoneCode: 'Zone 2', rate: 0.15, hazard: 'High Damage Risk' },
    { keywords: ['mumbai', 'bombay', 'thane', 'navi mumbai', 'pune', 'nashik', 'aurangabad', 'sambhajinagar', 'solapur', 'nagpur', 'ratnagiri'], district: 'Mumbai / MMR / Pune', state: 'Maharashtra', zone: 'Zone III', zoneCode: 'Zone 3', rate: 0.10, hazard: 'Moderate Damage Risk' },
    { keywords: ['bengaluru', 'bangalore', 'mysore', 'mysuru', 'tumkur', 'ballari', 'davangere'], district: 'Bengaluru Urban & Rural', state: 'Karnataka', zone: 'Zone II', zoneCode: 'Zone 4', rate: 0.05, hazard: 'Low Damage Risk' },
    { keywords: ['mangalore', 'mangaluru', 'udupi', 'karwar'], district: 'Coastal Karnataka', state: 'Karnataka', zone: 'Zone III', zoneCode: 'Zone 3', rate: 0.10, hazard: 'Moderate Damage Risk' },
    { keywords: ['hyderabad', 'secunderabad', 'warangal', 'cyberabad', 'karimnagar', 'nizamabad'], district: 'Hyderabad Urban', state: 'Telangana', zone: 'Zone II', zoneCode: 'Zone 4', rate: 0.05, hazard: 'Low Damage Risk' },
    { keywords: ['chennai', 'madras', 'coimbatore', 'kanchipuram', 'vellore', 'salem', 'thiruvallur'], district: 'Chennai / North TN', state: 'Tamil Nadu', zone: 'Zone III', zoneCode: 'Zone 3', rate: 0.10, hazard: 'Moderate Damage Risk' },
    { keywords: ['madurai', 'trichy', 'tirunelveli', 'thoothukudi', 'dindigul', 'erode'], district: 'South Tamil Nadu', state: 'Tamil Nadu', zone: 'Zone II', zoneCode: 'Zone 4', rate: 0.05, hazard: 'Low Damage Risk' },
    { keywords: ['kolkata', 'calcutta', 'howrah', 'darjeeling', 'siliguri', 'jalpaiguri', 'hooghly'], district: 'Kolkata / North Bengal', state: 'West Bengal', zone: 'Zone IV', zoneCode: 'Zone 2', rate: 0.15, hazard: 'High Damage Risk' },
    { keywords: ['kochi', 'cochin', 'ernakulam', 'trivandrum', 'thiruvananthapuram', 'calicut', 'kozhikode', 'thrissur', 'kollam', 'palakkad'], district: 'Kochi / Central Kerala', state: 'Kerala', zone: 'Zone III', zoneCode: 'Zone 3', rate: 0.10, hazard: 'Moderate Damage Risk' },
    { keywords: ['guwahati', 'assam', 'shillong', 'meghalaya', 'tripura', 'agartala', 'manipur', 'mizoram', 'nagaland', 'arunachal', 'itanagar', 'aizawl', 'imphal', 'kohima', 'dibrugarh', 'jorhat', 'silchar'], district: 'Northeast Region', state: 'Assam & NE States', zone: 'Zone V', zoneCode: 'Zone 1', rate: 0.25, hazard: 'Very High Damage Risk' },
    { keywords: ['darbhanga', 'madhubani', 'sitamarhi', 'supaul', 'araria', 'kishanganj', 'saharsa'], district: 'North Bihar Belt', state: 'Bihar', zone: 'Zone V', zoneCode: 'Zone 1', rate: 0.25, hazard: 'Very High Damage Risk' },
    { keywords: ['patna', 'muzaffarpur', 'bhagalpur', 'gaya', 'vaishali', 'samastipur', 'begusarai', 'purnia', 'saran'], district: 'Patna / Central Bihar', state: 'Bihar', zone: 'Zone IV', zoneCode: 'Zone 2', rate: 0.15, hazard: 'High Damage Risk' },
    { keywords: ['ludhiana', 'amritsar', 'jalandhar', 'chandigarh', 'patiala', 'gurdaspur', 'hoshiarpur'], district: 'Punjab Belt', state: 'Punjab', zone: 'Zone IV', zoneCode: 'Zone 2', rate: 0.15, hazard: 'High Damage Risk' },
    { keywords: ['jaipur', 'jodhpur', 'bikaner', 'udaipur', 'kota', 'ajmer', 'alwar'], district: 'Jaipur / Western Rajasthan', state: 'Rajasthan', zone: 'Zone III', zoneCode: 'Zone 3', rate: 0.10, hazard: 'Moderate Damage Risk' },
    { keywords: ['bhopal', 'indore', 'gwalior', 'jabalpur', 'ujjain', 'rewa'], district: 'Indore / MP Belt', state: 'Madhya Pradesh', zone: 'Zone III', zoneCode: 'Zone 3', rate: 0.10, hazard: 'Moderate Damage Risk' },
    { keywords: ['bhubaneswar', 'cuttack', 'puri', 'rourkela', 'sambalpur', 'balasore'], district: 'Odisha Coastal & Interior', state: 'Odisha', zone: 'Zone II', zoneCode: 'Zone 4', rate: 0.05, hazard: 'Low Damage Risk' },
    { keywords: ['ranchi', 'jamshedpur', 'dhanbad', 'bokaro', 'deoghar'], district: 'Jharkhand Industrial Belt', state: 'Jharkhand', zone: 'Zone II', zoneCode: 'Zone 4', rate: 0.05, hazard: 'Low Damage Risk' },
    { keywords: ['raipur', 'bhilai', 'bilaspur', 'durg', 'korba'], district: 'Chhattisgarh Belt', state: 'Chhattisgarh', zone: 'Zone II', zoneCode: 'Zone 4', rate: 0.05, hazard: 'Low Damage Risk' },
    { keywords: ['srinagar', 'baramulla', 'anantnag', 'kupwara', 'budgam'], district: 'Kashmir Valley', state: 'Jammu & Kashmir', zone: 'Zone V', zoneCode: 'Zone 1', rate: 0.25, hazard: 'Very High Damage Risk' },
    { keywords: ['jammu', 'udhampur', 'katra'], district: 'Jammu Belt', state: 'Jammu & Kashmir', zone: 'Zone IV', zoneCode: 'Zone 2', rate: 0.15, hazard: 'High Damage Risk' },
    { keywords: ['kangra', 'kullu', 'mandi', 'chamba', 'hamirpur'], district: 'Kangra Valley', state: 'Himachal Pradesh', zone: 'Zone V', zoneCode: 'Zone 1', rate: 0.25, hazard: 'Very High Damage Risk' },
    { keywords: ['shimla', 'solan', 'dharamsala'], district: 'Himachal Hills', state: 'Himachal Pradesh', zone: 'Zone IV', zoneCode: 'Zone 2', rate: 0.15, hazard: 'High Damage Risk' },
    { keywords: ['chamoli', 'uttarkashi', 'pithoragarh', 'bageshwar', 'rudraprayag'], district: 'Uttarakhand High Hills', state: 'Uttarakhand', zone: 'Zone V', zoneCode: 'Zone 1', rate: 0.25, hazard: 'Very High Damage Risk' },
    { keywords: ['dehradun', 'haridwar', 'rishikesh', 'nainital', 'meerut', 'moradabad', 'bareilly', 'saharanpur', 'muzaffarnagar'], district: 'Terai / Western UP', state: 'Uttar Pradesh / UK', zone: 'Zone IV', zoneCode: 'Zone 2', rate: 0.15, hazard: 'High Damage Risk' },
  ];

  for (const c of CITY_KEYWORDS) {
    for (const kw of c.keywords) {
      if (query.includes(kw)) {
        return {
          district: c.district,
          state: c.state,
          zone: c.zoneCode,
          eqRatePerMille: c.rate,
          confidence: 96,
          hazardLevel: `${c.zone} - ${c.hazard}`,
        };
      }
    }
  }

  // 3. Fallback traversal through raw earthquake_zones.json
  const zones = (eqZonesData as unknown as {
    zones: Array<{
      zone: string;
      zone_code: string;
      base_loading_section_iii: number;
      states: Array<{ state: string; districts: string[] }>;
    }>;
  }).zones || [];

  for (const z of zones) {
    for (const s of z.states) {
      if (query.includes(s.state.toLowerCase())) {
        return {
          district: s.state,
          state: s.state,
          zone: z.zone_code || z.zone,
          eqRatePerMille: z.base_loading_section_iii,
          confidence: 85,
        };
      }
      for (const d of s.districts) {
        const dLower = d.toLowerCase();
        const dTokens = dLower.replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(t => t.length > 3);
        if (dLower === query || query.includes(dLower) || dTokens.some(t => query.includes(t))) {
          return {
            district: d,
            state: s.state,
            zone: z.zone_code || z.zone,
            eqRatePerMille: z.base_loading_section_iii,
            confidence: 92,
          };
        }
      }
    }
  }

  return null;
}
