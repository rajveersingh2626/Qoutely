import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getAuthenticatedUser } from '@/lib/api-auth';
import { searchOccupanciesRAG, matchDistrictEQZone } from '@/lib/rag';

function getGeminiClient(): { client: GoogleGenAI | null; hasKey: boolean } {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'YOUR_GEMINI_API_KEY') {
    return { client: null, hasKey: false };
  }
  return { client: new GoogleGenAI({ apiKey }), hasKey: true };
}

export async function POST(req: NextRequest) {
  // Optional auth verification with demo fallback
  await getAuthenticatedUser(req);

  try {
    const { query } = await req.json();
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const { client, hasKey } = getGeminiClient();

    // RAG enrichment: check if query mentions a district or occupancy
    const eqMatch = matchDistrictEQZone(query);
    const ragOccupancies = searchOccupanciesRAG(query, 3);

    const systemPrompt = `You are Quotely's expert Indian Commercial Insurance Underwriting AI Copilot.
You specialize in:
1. All India Fire Tariff (AIFT 2001) Rules, Sections III, IV, V, and VI.
2. Insurance Information Bureau (IIB) Schedule 3 Loss Cost occupancy classifications (codes 1001-4020).
3. IS 1893 & TAC Earthquake (EQ) Zoning in India (Zones II, III, IV, V / Tariff Zones 1-4).
4. Feature discounts: -10% for fire hydrants/sprinklers, -10% electrical installation certificate, -10% storm drainage (plinth >= 1.5ft), -10% CCTV/security, -20% claim ratio <= 70% (capped at 50% max discount for Cat 1/2).
5. Category I Godown Warranty: No Category II/III hazardous goods, coir waste, or caddies permitted.

ALWAYS cite the exact source document and rule/section name.
Respond in valid JSON format:
{
  "reply": string (comprehensive, professional underwriter explanation in markdown),
  "citation": {
    "doc": string (e.g. "AIFT 2001" or "IIB Schedule 3" or "TAC EQ Zoning / IS 1893"),
    "section": string (e.g. "Section IV - Industrial Risks" or "Section VI - Storage Risks"),
    "pageOrRule": string (e.g. "Rule 12 - Feature Discounts" or "Code 1023")
  }
}`;

    if (hasKey && client) {
      try {
        const ragContext = `
Contextual Data from Quotely Knowledge Base:
${eqMatch ? `Seismic Lookup: District "${eqMatch.district}" in "${eqMatch.state}" belongs to Seismic Zone "${eqMatch.zone}" with base loading of ${eqMatch.eqRatePerMille}‰.` : ''}
${ragOccupancies.topCandidates.length > 0 ? `Top Matched IIB Occupancies: ${ragOccupancies.topCandidates.map(c => `Code ${c.code} (${c.description}) [Loss cost: ${c.baseLossCostStock}‰, Hazard: ${c.hazardRating}]`).join('; ')}` : ''}
`;

        const response = await client.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `${systemPrompt}\n\n${ragContext}\n\nUser Question: "${query}"`,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const parsed = JSON.parse(response.text || '{}');
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

    if (qLower.includes('1023') || qLower.includes('acme')) {
      reply = `Occupancy Code 1023 ("Engineering Workshops - Metalworking with cold work / machining") applies to Acme Industries Ltd due to precision CNC metal machining, tool stamping, component fabrication, and parts assembly. Under AIFT 2001 Section IV (Industrial Risks), cold metalworking processes qualify for Category 2 loss cost rating (-10% base rate modifier).`;
      citation = {
        doc: 'IIB Loss Cost Schedule 3 & AIFT 2001',
        section: 'Section IV - Industrial Manufacturing',
        pageOrRule: 'Code 1023 / Category 2 Rating',
      };
    } else if (qLower.includes('hydrant') || qLower.includes('discount') || qLower.includes('feature')) {
      reply = `Under statutory broker calculation rules:\n1. Operational Fire Hydrant / Sprinkler system: -10% discount on base flexa rate.\n2. Electrical Installations maintained to Indian Electricity Rules 1956: -10% discount.\n3. Plinth level >= 1.5 ft with storm drainage: -10% discount.\n4. 24x7 Security & CCTV: -10% discount.\n5. Past 3-year claim ratio <= 70%: -20% discount.\nTotal cumulative discount is capped at -50% for Category 1 & 2 risks.`;
      citation = {
        doc: 'Tariff Advisory Committee',
        section: 'Feature Discount Matrix (Rows 20-29)',
        pageOrRule: 'Section III & IV Rating Schedule',
      };
    } else if (qLower.includes('delhi') || qLower.includes('eq') || qLower.includes('earthquake')) {
      reply = `Delhi NCR (New Delhi, Gurugram, Noida, Faridabad, Ghaziabad) is classified in Zone IV (Zone 2 under TAC tariff nomenclature). Under Section III (Commercial occupancies), the standard earthquake base rate is 0.15‰. For Section IV/VI industrial and storage risks, the base EQ rate is 0.25‰. Category 1 occupancies receive a 25% statutory discount, adjusting the EQ rate to 0.1875‰.`;
      citation = {
        doc: 'eq_zoning.pdf & IS 1893',
        section: 'Indian Seismic Zoning Map (Zone IV)',
        pageOrRule: 'Table of Seismic Loadings',
      };
    } else if (qLower.includes('warranty') || qLower.includes('category i')) {
      reply = `Category I Warranty (WARR-CAT1):\n"Warranted that during the currency of this policy, no hazardous goods listed under Category II, Category III, Coir waste, Coir fibre, and Caddies shall be stored or brought into the premises."\nBreach of this warranty invalidates the Category 1 discount (-25%) and triggers Category 3 (+25%) or Category 4 (+160%) punitive rating.`;
      citation = {
        doc: 'AIFT 2001 Section VI',
        section: 'Special Storage Warranties',
        pageOrRule: 'Warranty WARR-CAT1',
      };
    } else {
      reply = `Under the Indian Fire Tariff and IIB Schedule 3, risk evaluation involves looking up the occupancy from 289 statutory codes, applying risk category modifiers (-25% to +160%), adding Earthquake (IS 1893) and STFI perils, and calculating the net premium per thousand (per mille) of total Sum Insured.`;
      citation = {
        doc: 'AIFT 2001 & IIB Schedule 3',
        section: 'General Rules & Rating Scale',
        pageOrRule: 'Part II Clause 4',
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
