import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getAuthenticatedUser } from '@/lib/api-auth';
import { searchOccupanciesRAG, matchDistrictEQZone, searchTariffRules } from '@/lib/rag';

import { getGeminiClient, callGeminiGenerate } from '@/lib/ai';

export async function POST(req: NextRequest) {
  // Optional auth verification with demo fallback
  await getAuthenticatedUser(req);

  try {
    const { query } = await req.json();
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const { client, hasKey } = getGeminiClient();

    // RAG enrichment: check if query mentions a district, occupancy, or tariff rules
    const eqMatch = matchDistrictEQZone(query);
    const ragOccupancies = searchOccupanciesRAG(query, 3);
    const tariffMatch = searchTariffRules(query);

    const systemPrompt = `You are Quotely's expert Indian Commercial Insurance Underwriting AI Copilot.
You specialize strictly in:
1. All India Fire Tariff (AIFT 2001) Rules, Sections I, II, III, IV, V, VI, VII, and VIII.
2. Insurance Information Bureau (IIB) Schedule 3 Loss Cost occupancy classifications (codes 1001-4020).
3. IS 1893 & TAC Earthquake (EQ) Zoning in India (Zones II, III, IV, V / Tariff Zones 1-4).
4. Product Form Thresholds: Bharat Sookshma Udyam Suraksha (BSUS <= ₹5 Cr), Bharat Laghu Udyam Suraksha (BLUS ₹5 Cr - ₹50 Cr), SFSP (> ₹50 Cr).
5. Feature discounts: -10% for fire hydrants/sprinklers, -10% electrical installation certificate, -10% storm drainage (plinth >= 1.5ft), -10% CCTV/security, -20% claim ratio <= 70% (capped at 50% max discount for Cat 1/2, 30% for Cat 3, 55% for Cat 4).
6. Statutory Storage Hazard Warranties (WARR-4001, WARR-4002, WARR-4003, WARR-4004) & 5% tolerance rule (Section VI Rule 3).
7. AIFT Section I Rule 21 Rate Computation Sequence and Voluntary Deductible Scale.

ALWAYS cite the exact source document and rule/section name.
Respond in valid JSON format:
{
  "reply": string (comprehensive, professional underwriter explanation in markdown),
  "citation": {
    "doc": string (e.g. "AIFT 2001" or "IIB Schedule 3" or "TAC EQ Zoning / IS 1893"),
    "section": string (e.g. "Section IV - Industrial Risks" or "Section VI - Storage Risks" or "Section I - General Rules"),
    "pageOrRule": string (e.g. "Rule 21 - Computation of Rate" or "Code 4002 / WARR-4002")
  }
}`;

    if (hasKey && client) {
      try {
        const ragContext = `
Contextual Data from Quotely Knowledge Base:
${eqMatch ? `Seismic Lookup: District "${eqMatch.district}" in "${eqMatch.state}" belongs to Seismic Zone "${eqMatch.zone}" with base loading of ${eqMatch.eqRatePerMille}‰.` : ''}
${ragOccupancies.topCandidates.length > 0 ? `Top Matched IIB Occupancies: ${ragOccupancies.topCandidates.map(c => `Code ${c.code} (${c.description}) [Section ${c.section}, Base Loss Cost: ${c.baseLossCostStock || c.flexa_rate}‰, Hazard: ${c.hazardRating}]`).join('; ')}` : ''}
${tariffMatch.clauses.length > 0 ? `Applicable Clauses: ${tariffMatch.clauses.map(cl => `${cl.title} (${cl.source_doc})`).join('; ')}` : ''}
${tariffMatch.warranties.length > 0 ? `Applicable Warranties: ${tariffMatch.warranties.map(w => `${w.code} (${w.name}): ${w.text}`).join('; ')}` : ''}
${tariffMatch.products.length > 0 ? `Product Guidelines: ${tariffMatch.products.map(p => `${p.name}: ${p.sum_insured_limit} | Deductible: ${p.deductible_scale}`).join('; ')}` : ''}
`;

        const { text: responseText } = await callGeminiGenerate(
          client,
          `${systemPrompt}\n\n${ragContext}\n\nUser Question: "${query}"`,
          { responseMimeType: 'application/json' }
        );

        const parsed = JSON.parse(responseText || '{}');
        return NextResponse.json({
          reply: parsed.reply || 'Underwriting consultation response generated.',
          citation: parsed.citation || { doc: 'AIFT 2001', section: 'General Rules' },
        });
      } catch (err: any) {
        console.warn('Gemini chat error, using grounded fallback:', err);
      }
    }

    // Deterministic Rule-Based Fallback
    const qLower = query.toLowerCase();
    let reply = '';
    let citation = { doc: 'AIFT 2001', section: 'General Rules', pageOrRule: 'Standard Guidance' };

    if (qLower.includes('1023') || qLower.includes('shop')) {
      reply = `Occupancy Code 1023 designates "Shops dealing in goods otherwise not provided for" under AIFT 2001 Section III (Commercial / Mercantile). It has a base tariff rate of 0.50‰ (Risk Category 1). For industrial cold metal fabrication, precision CNC turning, or structural steel workshops, the statutory classification is Code 2075 ("Engineering Workshop - Structural Steel / Sheet Metal Fabricators") or Code 2212 under Section IV.`;
      citation = {
        doc: 'AIFT 2001 & IIB Schedule 3',
        section: 'Section III - Mercantile Risks',
        pageOrRule: 'Code 1023 vs Section IV Code 2075',
      };
    } else if (qLower.includes('2075') || qLower.includes('engineering') || qLower.includes('workshop') || qLower.includes('metal')) {
      reply = `Occupancy Code 2075 applies to "Engineering Workshop - Structural Steel / Sheet Metal Fabricators" under AIFT 2001 Section IV (Industrial Manufacturing). It has a base peril rate of 0.65‰ (Category 2). It covers mechanical fabrication, metal stamping, lathe cutting, and machine tool assembly. Feature discounts (fire hydrants, electrical safety, drainage, CCTV) can reduce this rate up to the -50% statutory cap.`;
      citation = {
        doc: 'IIB Loss Cost Schedule 3 & AIFT 2001',
        section: 'Section IV - Industrial Manufacturing',
        pageOrRule: 'Code 2075 / Risk Category 2',
      };
    } else if (qLower.includes('hydrant') || qLower.includes('discount') || qLower.includes('feature')) {
      reply = `Under Capital Brokers & statutory AIFT calculation guidelines:\n1. Operational Fire Hydrant / Sprinkler system: -10% discount on base flexa rate.\n2. Electrical Installations maintained to Indian Electricity Rules 1956: -10% discount.\n3. Plinth level >= 1.5 ft with storm drainage: -10% discount.\n4. 24x7 Security & CCTV: -10% discount.\n5. Past 3-year claim ratio <= 70%: -20% discount (claim ratio 71-85%: -10%).\nCumulative feature discount is strictly capped at -50% for Category 1 & 2 risks, -30% for Category 3, and -55% for Category 4.`;
      citation = {
        doc: 'Tariff Advisory Committee & Broker Matrix',
        section: 'Feature Discount Matrix (Rows 20-29)',
        pageOrRule: 'Section III & IV Rating Schedule',
      };
    } else if (qLower.includes('delhi') || qLower.includes('eq') || qLower.includes('earthquake')) {
      reply = `Delhi NCR (New Delhi, Gurugram, Noida, Faridabad, Ghaziabad) is classified in Seismic Zone IV (Tariff Zone 2 under TAC nomenclature). Under Section III (Commercial occupancies), the standard earthquake base rate is 0.15‰. For Section IV (Industrial) and Section VI (Storage) risks, the base EQ rate is 0.25‰. Category 1 occupancies receive a 25% statutory discount, adjusting the EQ rate to 0.1875‰.`;
      citation = {
        doc: 'eq_zoning.pdf & IS 1893',
        section: 'Indian Seismic Zoning Map (Zone IV / Zone 2)',
        pageOrRule: 'Table of Seismic Loadings',
      };
    } else if (qLower.includes('warranty') || qLower.includes('category i') || qLower.includes('4002') || qLower.includes('godown')) {
      reply = `Category I Storage Warranty (WARR-4002 / Code 4002):\n"Warranted that during the currency of this policy, no hazardous goods listed under Category II, Category III, Coir waste, Coir fibre, and Caddies shall be stored or brought into the insured premises."\nUnder AIFT 2001 Section VI Rule 3, presence of higher category goods not exceeding 5% of total stock value is permitted without reclassification. Non-hazardous storage is Code 4001 (1.00‰), while Category I Hazardous is Code 4002 (2.50‰).`;
      citation = {
        doc: 'AIFT 2001 Section VI',
        section: 'Storage Risks Outside Industrial Compounds',
        pageOrRule: 'Rule 3 & Code 4002 (WARR-4002)',
      };
    } else if (qLower.includes('deductible') || qLower.includes('excess') || qLower.includes('voluntary')) {
      reply = `Statutory Deductibles under Indian Commercial Fire Regulations:\n• **BSUS (SI <= ₹5 Cr)**: ₹5,000 for SI <= ₹10 Lakhs; ₹10,000 for SI > ₹10 Lakhs up to ₹5 Cr.\n• **BLUS (SI ₹5 Cr - ₹50 Cr)**: 5% of claim amount (min ₹10,000 - ₹25,000 for normal perils; min ₹25,000 for AOG/STFI).\n• **SFSP (SI > ₹50 Cr)**: 5% of claim amount (min ₹5,00,000) for normal perils; 10% (min ₹10,00,000) for AOG perils.\n• **AIFT Voluntary Deductibles (Rule 20)**: ₹10L to ₹100L yielding 2% to 10% premium rebate.`;
      citation = {
        doc: 'IRDAI Guidelines & AIFT 2001',
        section: 'Section I - General Rules',
        pageOrRule: 'Rule 20 - Voluntary Deductibles',
      };
    } else if (qLower.includes('sequence') || qLower.includes('computation') || qLower.includes('rule 21')) {
      reply = `AIFT Section I Rule 21 Mandatory Rate Computation Sequence:\n1. Basic Rate from IIB Schedule 3.\n2. 5% Reduction for Sprinklered blocks (if applicable).\n3. Reduction for deletion of STFI/RSMTD (if opted out).\n4. Tariff extra for 'Kutcha' Construction (+4.00‰).\n5. Discount/loading for claims experience (preceding 36 months).\n6. Discount for Fire Extinguishing Appliances (FEA: 2.5% to 10%).\n7. Discount for voluntary deductible on total premium.`;
      citation = {
        doc: 'AIFT 2001 Section I',
        section: 'General Rules and Regulations',
        pageOrRule: 'Rule 21 - Computation of Rate',
      };
    } else {
      reply = `Under the Indian Fire Tariff (AIFT 2001) and IIB Schedule 3, risk evaluation involves looking up the occupancy from 289 statutory codes across Sections III to VII, applying Risk Category modifiers (-25% to +160%), adding Earthquake (IS 1893 Zones 1-4) and STFI perils, adjusting for feature discounts (up to -50% cap), and calculating net premium per thousand (per mille) of total Sum Insured.`;
      citation = {
        doc: 'AIFT 2001 & IIB Schedule 3',
        section: 'General Rules & Rating Scale',
        pageOrRule: 'Section I & Schedule 3',
      };
    }

    return NextResponse.json({ reply, citation });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Chat generation failed' },
      { status: 500 }
    );
  }
}
