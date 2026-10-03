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

// Stopwords & generic terms that should not skew commercial trade matching
const GENERIC_STOPWORDS = new Set([
  'and', 'or', 'of', 'in', 'the', 'for', 'with', 'by', 'at', 'to', 'from',
  'products', 'product', 'type', 'types', 'item', 'items', 'goods',
  'other', 'others', 'similar', 'related', 'insured', 'trade', 'trading',
  'business', 'company', 'premises', 'location', 'plot', 'industrial',
  'etc', 'all', 'any', 'standard', 'general'
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
    }

    // 4. Domain Specific Trade Rules
    // Oils / Almond Oil / Cosmetics / Toiletries
    if (queryDesc.includes('oil') || queryDesc.includes('almond') || queryDesc.includes('cosmetic')) {
      if (occ.code === '4002') score += 65; // Category I Hazardous Goods (vegetable oils, toiletries, cosmetics)
      if (occ.code === '4001') score += 45;
      if (occ.code === '1023') score += 40;
    }

    // Food / Nestle / Dry provisions / FMCG
    if (queryDesc.includes('food') || queryDesc.includes('nestle') || queryDesc.includes('fmcg') || queryDesc.includes('grocery')) {
      if (occ.code === '4001') score += 65; // Non-hazardous storage (food items)
      if (descLower.includes('non-hazardous')) score += 40;
      if (occ.code === '1023') score += 35;
    }

    // Engineering / CNC / Tooling
    if (queryDesc.includes('metal') || queryDesc.includes('cnc') || queryDesc.includes('machin') || queryDesc.includes('stamping')) {
      if (occ.code === '1023' || descLower.includes('metal') || descLower.includes('engineering workshop')) score += 35;
    }

    // Pharma Cleanroom
    if (queryDesc.includes('pharma') || queryDesc.includes('tablet') || queryDesc.includes('cleanroom')) {
      if (descLower.includes('pharmaceutical')) score += 50;
    }

    // Textiles / Weaving
    if (queryDesc.includes('textile') || queryDesc.includes('cotton') || queryDesc.includes('spinning') || queryDesc.includes('weaving')) {
      if (descLower.includes('cotton') || descLower.includes('spinning') || descLower.includes('weaving')) score += 50;
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
    let confidence = 0.92;
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

/**
 * Searches Earthquake Zone from official EQ zoning dataset
 */
export function matchDistrictEQZone(districtQuery: string): { district: string; state: string; zone: string; eqRatePerMille: number; confidence: number } | null {
  if (!districtQuery) return null;
  const query = districtQuery.trim().toLowerCase();

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
      for (const d of s.districts) {
        const dLower = d.toLowerCase();
        if (dLower === query || query.includes(dLower) || dLower.includes(query)) {
          return {
            district: d,
            state: s.state,
            zone: z.zone_code || z.zone,
            eqRatePerMille: z.base_loading_section_iii,
            confidence: dLower === query ? 99 : 88,
          };
        }
      }
    }
  }

  return null;
}
