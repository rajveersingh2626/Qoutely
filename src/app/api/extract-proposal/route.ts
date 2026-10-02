import { NextRequest, NextResponse } from 'next/server';

/**
 * AI Proposal Extraction Simulation API Route
 *
 * Endpoint: POST /api/extract-proposal
 * Strict Schema:
 * {
 *   occupancyCode: string,
 *   occupancyDescription: string,
 *   matchedKeywords: string[],
 *   confidenceScore: number
 * }
 */

interface OccupancyRule {
  code: string;
  description: string;
  keywords: string[];
  suggestedFlexa: number;
  suggestedStfi: number;
  suggestedEq: number;
  riskTier: 'Low' | 'Medium' | 'High';
  reasoning: string;
}

const OCCUPANCY_DATABASE: OccupancyRule[] = [
  {
    code: '1023',
    description: 'Engineering Workshops, CNC Metal Machining & Parts Fabrication',
    keywords: ['cnc', 'machining', 'metal', 'tooling', 'lathe', 'stamping', 'fabrication', 'parts', 'workshop', 'assembly', 'engineering'],
    suggestedFlexa: 0.65,
    suggestedStfi: 0.15,
    suggestedEq: 0.10,
    riskTier: 'Medium',
    reasoning: 'Extracted metal cutting, CNC precision tooling, and components assembly operations under AIFT Section III.',
  },
  {
    code: '4002',
    description: 'Storage of Category I Hazardous & Packaged Goods (Godowns & Logistics Warehouses)',
    keywords: ['warehouse', 'storage', 'godown', 'logistics', 'fmcg', 'inventory', 'distribution', 'cold chain', 'cartons', 'pallets'],
    suggestedFlexa: 0.80,
    suggestedStfi: 0.20,
    suggestedEq: 0.12,
    riskTier: 'Medium',
    reasoning: 'Commercial warehousing and packaged goods storage warranting standard IIB Schedule 3 Godown Warranty provisions.',
  },
  {
    code: '1088',
    description: 'Pharmaceutical Formulations, API Processing & Research Laboratories',
    keywords: ['pharma', 'pharmaceutical', 'medicine', 'drug', 'cleanroom', 'laboratory', 'tablet', 'capsule', 'formulation', 'biotech'],
    suggestedFlexa: 0.70,
    suggestedStfi: 0.15,
    suggestedEq: 0.10,
    riskTier: 'Low',
    reasoning: 'Cleanroom facility with controlled environment and GMP compliance standards.',
  },
  {
    code: '2014',
    description: 'Textile Weaving, Garment Manufacturing & Apparel Stitching Mills',
    keywords: ['textile', 'garment', 'fabric', 'cotton', 'weaving', 'yarn', 'stitching', 'apparel', 'cloth', 'knitting'],
    suggestedFlexa: 0.95,
    suggestedStfi: 0.20,
    suggestedEq: 0.12,
    riskTier: 'High',
    reasoning: 'High combustible fiber load requiring fire sprinkler warranty and lint control protocol.',
  },
  {
    code: '3050',
    description: 'Chemical Manufacturing, Synthetic Resins & Industrial Solvents',
    keywords: ['chemical', 'solvent', 'resin', 'paint', 'flammable', 'petrochemical', 'acid', 'polymerization', 'hazardous'],
    suggestedFlexa: 1.85,
    suggestedStfi: 0.25,
    suggestedEq: 0.15,
    riskTier: 'High',
    reasoning: 'High-hazard chemical processing involving volatile organics and exothermic reactions.',
  },
  {
    code: '1001',
    description: 'Corporate Offices, IT Software Development & Financial Services',
    keywords: ['office', 'software', 'it', 'corporate', 'computers', 'consulting', 'tech', 'server', 'datacenter', 'workstations'],
    suggestedFlexa: 0.35,
    suggestedStfi: 0.10,
    suggestedEq: 0.08,
    riskTier: 'Low',
    reasoning: 'Low physical fire load commercial office space with electronic equipment.',
  },
  {
    code: '2067',
    description: 'Plastic Goods Manufacturing, Extrusion & Polymer Injection Molding',
    keywords: ['plastic', 'polymer', 'molding', 'extrusion', 'injection', 'pvc', 'granules', 'polypropylene'],
    suggestedFlexa: 1.25,
    suggestedStfi: 0.20,
    suggestedEq: 0.12,
    riskTier: 'Medium',
    reasoning: 'Polymer thermal processing and thermoplastic molds subject to combustible smoke loading.',
  },
  {
    code: '1045',
    description: 'Commercial Hospitality, Hotels & Fine Dining Facilities',
    keywords: ['hotel', 'restaurant', 'kitchen', 'food', 'hospitality', 'dining', 'cooking', 'lpg', 'banquet'],
    suggestedFlexa: 0.90,
    suggestedStfi: 0.15,
    suggestedEq: 0.10,
    riskTier: 'Medium',
    reasoning: 'Commercial kitchen LPG installation and public occupancy exposure.',
  },
  {
    code: '1028',
    description: 'Food & Beverage Processing, Bakeries & Confectionery Plants',
    keywords: ['bakery', 'confectionery', 'beverage', 'snack', 'grain', 'flour', 'dairy', 'milk', 'processing'],
    suggestedFlexa: 0.75,
    suggestedStfi: 0.15,
    suggestedEq: 0.10,
    riskTier: 'Low',
    reasoning: 'Automated food packing and confectionery manufacture with controlled oven safety systems.',
  },
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawText = (body.description || body.businessDescription || body.text || body.proposal || '').toString().trim();

    if (!rawText) {
      return NextResponse.json(
        {
          error: 'Business description is required for AI risk extraction.',
        },
        { status: 400 }
      );
    }

    const lowerText = rawText.toLowerCase();

    // Match against occupancy profiles
    let bestMatch: OccupancyRule | null = null;
    let highestScore = 0;
    let matchedKeywords: string[] = [];

    for (const rule of OCCUPANCY_DATABASE) {
      const hits = rule.keywords.filter((kw) => lowerText.includes(kw));
      if (hits.length > highestScore) {
        highestScore = hits.length;
        bestMatch = rule;
        matchedKeywords = hits;
      }
    }

    // Default to engineering workshop or general commercial if no direct keyword matches
    if (!bestMatch || highestScore === 0) {
      // Extract words with >= 4 characters from rawText
      const extractedWords = rawText
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w: string) => w.length >= 4 && !['this', 'with', 'from', 'that', 'have', 'were', 'they'].includes(w))
        .slice(0, 5);

      bestMatch = {
        code: '1010',
        description: 'General Commercial Trade & Light Manufacturing Workshop',
        keywords: extractedWords.length ? extractedWords : ['commercial', 'manufacturing', 'trade'],
        suggestedFlexa: 0.75,
        suggestedStfi: 0.15,
        suggestedEq: 0.10,
        riskTier: 'Low',
        reasoning: 'Extracted general commercial business trade from proposal text.',
      };
      matchedKeywords = extractedWords.length ? extractedWords : ['commercial', 'workshop'];
    }

    // Calculate realistic confidence score between 0.88 and 0.98
    const baseConfidence = 0.88;
    const boost = Math.min(0.10, matchedKeywords.length * 0.025);
    const confidenceScore = Number((baseConfidence + boost).toFixed(2));

    // Optional simulated network latency (150ms) to ensure realistic UX feel
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Response strictly follows the schema:
    // { occupancyCode, occupancyDescription, matchedKeywords, confidenceScore }
    // + helpful suggested rates for deterministic engine integration
    return NextResponse.json({
      occupancyCode: bestMatch.code,
      occupancyDescription: bestMatch.description,
      matchedKeywords,
      confidenceScore,
      suggestedFlexaRate: bestMatch.suggestedFlexa,
      suggestedStfiRate: bestMatch.suggestedStfi,
      suggestedEqRate: bestMatch.suggestedEq,
      riskTier: bestMatch.riskTier,
      reasoning: bestMatch.reasoning,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Failed to process AI risk extraction proposal',
        details: error?.message || 'Unknown server error',
      },
      { status: 500 }
    );
  }
}
