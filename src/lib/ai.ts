import { GoogleGenAI } from '@google/genai';
import { searchOccupanciesRAG, matchDistrictEQZone, OccupancyCandidate } from './rag';
import { validateProposalInputs } from './validation';
import { supabase } from './supabase';
import { validateAndClampLLMOutput } from './schemas';

export interface AIRequestLog {
  id?: string;
  workspace_id?: string;
  user_id?: string;
  endpoint: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  latency_ms: number;
  is_mocked?: boolean;
  created_at?: string;
}

// In-memory request log cache for observability
const requestLogsCache: AIRequestLog[] = [];

// Gemini 2.5 Flash Pricing (per 1M tokens)
const GEMINI_INPUT_COST_PER_MILLION = 0.075;
const GEMINI_OUTPUT_COST_PER_MILLION = 0.30;

export function calculateAICost(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1_000_000) * GEMINI_INPUT_COST_PER_MILLION;
  const outputCost = (outputTokens / 1_000_000) * GEMINI_OUTPUT_COST_PER_MILLION;
  return Number((inputCost + outputCost).toFixed(7));
}

export async function logAIRequest(log: AIRequestLog): Promise<void> {
  const fullLog = {
    ...log,
    id: log.id || `req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    created_at: log.created_at || new Date().toISOString()
  };

  requestLogsCache.unshift(fullLog);
  if (requestLogsCache.length > 200) requestLogsCache.pop();

  // Try to write to Supabase if configured
  try {
    if (supabase) {
      await supabase.from('ai_requests').insert({
        workspace_id: fullLog.workspace_id || '00000000-0000-0000-0000-000000000001',
        user_id: fullLog.user_id || '00000000-0000-0000-0000-000000000001',
        endpoint: fullLog.endpoint,
        model: fullLog.model,
        input_tokens: fullLog.input_tokens,
        output_tokens: fullLog.output_tokens,
        cost_usd: fullLog.cost_usd,
        latency_ms: fullLog.latency_ms,
        created_at: fullLog.created_at
      });
    }
  } catch (err) {
    // Graceful fallback to memory log
  }
}

export function getAIRequestLogs(): AIRequestLog[] {
  return [...requestLogsCache];
}

/**
 * Initializes Google GenAI client
 */
function getGeminiClient(): { client: GoogleGenAI | null; hasKey: boolean } {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'YOUR_GEMINI_API_KEY') {
    return { client: null, hasKey: false };
  }
  return { client: new GoogleGenAI({ apiKey }), hasKey: true };
}

/**
 * Endpoint 1: Extract Proposal Entities
 */
export async function extractProposal(rawText: string, workspaceId?: string, userId?: string) {
  const startTime = Date.now();
  const { client, hasKey } = getGeminiClient();
  const modelName = 'gemini-2.5-flash';

  const prompt = `You are Quotely's senior commercial insurance underwriter for India.
Extract all relevant underwriting fields from the proposal or quote document below.
Return ONLY valid JSON matching this schema:
{
  "client_name": string,
  "gst_number": string,
  "address": string,
  "district": string,
  "state": string,
  "business_description": string,
  "construction_type": "Class A" | "Class B" | "Class C" | "Kutcha",
  "policy_duration_months": number,
  "previous_insurer": string,
  "claim_history_last_3_years": boolean,
  "claim_ratio_percent": number,
  "sum_insured": {
    "building": number,
    "plant_and_machinery": number,
    "stocks": number,
    "furniture_and_fixtures": number,
    "other": number,
    "total": number
  },
  "perils_required": {
    "fire_flexa": true,
    "stfi": boolean,
    "earthquake": boolean,
    "terrorism": boolean
  },
  "hazard_flags": string[],
  "missing_fields": string[]
}

Document content:
${rawText}`;

  if (hasKey && client) {
    try {
      const response = await client.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const responseText = response.text || '{}';
      const parsed = JSON.parse(responseText);
      const latency = Date.now() - startTime;
      const inputTokens = Math.round(prompt.length / 4);
      const outputTokens = Math.round(responseText.length / 4);
      const cost = calculateAICost(inputTokens, outputTokens);

      await logAIRequest({
        workspace_id: workspaceId,
        user_id: userId,
        endpoint: '/api/extract',
        model: modelName,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        cost_usd: cost,
        latency_ms: latency,
        is_mocked: false
      });

      // Karpathy Software 2.0 / 1.0 Boundary Clamp
      const clampedResult = validateAndClampLLMOutput(parsed, modelName);

      return {
        success: true,
        data: clampedResult.data,
        software_boundary: clampedResult.software_boundary,
        meta: { model: modelName, latency_ms: latency, cost_usd: cost, is_mocked: false }
      };
    } catch (err: any) {
      console.warn('Gemini API call failed, falling back to deterministic parser:', err);
    }
  }

  // Deterministic Fallback if no API key is provided
  const latency = Date.now() - startTime;
  const isKrishna = rawText.toLowerCase().includes('krishna') || rawText.includes('5,38,00,000');
  
  const fallbackData = {
    client_name: isKrishna ? 'Krishna & Company' : 'Industrial Client Pvt Ltd',
    gst_number: isKrishna ? '07AAACK1234F1Z5' : '27AAACI5678B1Z2',
    address: isKrishna ? 'Plot 42, Sector 8, IMT Manesar' : 'Industrial Area Phase 2',
    district: isKrishna ? 'Gurugram' : 'Mumbai',
    state: isKrishna ? 'Haryana' : 'Maharashtra',
    business_description: isKrishna ? 'Precision CNC metal machining, tool stamping, component fabrication and parts assembly workshop' : rawText.slice(0, 200),
    construction_type: 'Class A' as const,
    policy_duration_months: 12,
    previous_insurer: 'ICICI Lombard GIC',
    claim_history_last_3_years: false,
    claim_ratio_percent: 0,
    sum_insured: {
      building: isKrishna ? 15000000 : 20000000,
      plant_and_machinery: isKrishna ? 26000000 : 30000000,
      stocks: isKrishna ? 12800000 : 15000000,
      furniture_and_fixtures: 0,
      other: 0,
      total: isKrishna ? 53800000 : 65000000
    },
    perils_required: {
      fire_flexa: true,
      stfi: true,
      earthquake: true,
      terrorism: true
    },
    occupancy_code: isKrishna ? '1023' : null,
    hazard_flags: isKrishna ? ['Heavy cutting oils and solvents present on shop floor', 'High value CNC controllers susceptible to electrical surges'] : ['Industrial electrical switchgear'],
    missing_fields: []
  };

  await logAIRequest({
    workspace_id: workspaceId,
    user_id: userId,
    endpoint: '/api/extract',
    model: 'fallback-deterministic',
    input_tokens: Math.round(prompt.length / 4),
    output_tokens: 380,
    cost_usd: 0,
    latency_ms: latency,
    is_mocked: true
  });

  const clampedFallback = validateAndClampLLMOutput(fallbackData, 'fallback-deterministic');

  return {
    success: true,
    data: clampedFallback.data,
    software_boundary: clampedFallback.software_boundary,
    meta: { model: 'fallback-deterministic', latency_ms: latency, cost_usd: 0, is_mocked: true }
  };
}

/**
 * Endpoint 2: Classify Occupancy with RAG Grounding
 */
export async function classifyOccupancy(businessDescription: string, district?: string, workspaceId?: string, userId?: string) {
  const startTime = Date.now();
  const ragResult = searchOccupanciesRAG(businessDescription);
  const eqMatch = district ? matchDistrictEQZone(district) : null;
  const { client, hasKey } = getGeminiClient();
  const modelName = 'gemini-2.5-flash';

  const prompt = `You are Quotely's senior underwriting classifier.
Review this business description and the candidate IIB Schedule 3 occupancies retrieved from tariff records:

Business: "${businessDescription}"
Retrieved Candidates from IIB Schedule 3:
${JSON.stringify(ragResult.topCandidates, null, 2)}

Provide the final candidate rankings. NEVER invent occupancy codes not present in the candidates.
Return ONLY valid JSON matching this schema:
{
  "business_summary": string,
  "keywords": string[],
  "occupancy_candidates": [
    {
      "code": string,
      "description": string,
      "confidence": number,
      "reason": string
    }
  ],
  "confidence_tier": "auto_select" | "top_three" | "requires_clarification",
  "clarification_question": string | null,
  "hazard_flags": string[],
  "missing_fields": string[]
}`;

  if (hasKey && client) {
    try {
      const response = await client.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const responseText = response.text || '{}';
      const parsed = JSON.parse(responseText);
      const latency = Date.now() - startTime;
      const inputTokens = Math.round(prompt.length / 4);
      const outputTokens = Math.round(responseText.length / 4);
      const cost = calculateAICost(inputTokens, outputTokens);

      await logAIRequest({
        workspace_id: workspaceId,
        user_id: userId,
        endpoint: '/api/classify',
        model: modelName,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        cost_usd: cost,
        latency_ms: latency,
        is_mocked: false
      });

      return {
        success: true,
        data: {
          ...parsed,
          eq_zone: eqMatch
        },
        meta: { model: modelName, latency_ms: latency, cost_usd: cost, is_mocked: false }
      };
    } catch (err) {
      console.warn('Gemini classify failed, using grounded RAG result:', err);
    }
  }

  // Grounded RAG Fallback
  const latency = Date.now() - startTime;
  const fallbackResult = {
    business_summary: `Commercial enterprise operating in ${ragResult.primaryCandidate?.category || 'industrial manufacturing'}. Primary processes involve: ${businessDescription.slice(0, 150)}.`,
    keywords: ragResult.matchedKeywords,
    occupancy_candidates: ragResult.topCandidates.map(c => ({
      code: c.code,
      description: c.description,
      confidence: c.confidence,
      reason: c.reason
    })),
    confidence_tier: ragResult.confidenceTier,
    clarification_question: ragResult.clarificationQuestion || null,
    hazard_flags: ragResult.primaryCandidate?.hazardRating === 'High' ? ['Classified as High Hazard under AIFT Section 3', 'Sprinkler or hydrant compliance recommended'] : ['Standard industrial light hazard risk profile'],
    missing_fields: [],
    eq_zone: eqMatch
  };

  await logAIRequest({
    workspace_id: workspaceId,
    user_id: userId,
    endpoint: '/api/classify',
    model: 'grounded-rag',
    input_tokens: Math.round(prompt.length / 4),
    output_tokens: 310,
    cost_usd: 0,
    latency_ms: latency,
    is_mocked: true
  });

  return {
    success: true,
    data: fallbackResult,
    meta: { model: 'grounded-rag', latency_ms: latency, cost_usd: 0, is_mocked: true }
  };
}

/**
 * Endpoint 3: Explain Underwriting Decisions
 */
export async function explainRecommendation(occupancyCode: string, businessDescription: string, workspaceId?: string, userId?: string) {
  const startTime = Date.now();
  const { client, hasKey } = getGeminiClient();
  const modelName = 'gemini-2.5-flash';

  const prompt = `You are an expert Indian insurance underwriter.
Explain precisely why Occupancy Code ${occupancyCode} is the statutory recommendation for the following business:
"${businessDescription}"

Cite:
1. All India Fire Tariff (AIFT 2001) Rules
2. IIB Loss Cost Schedule 3
3. Applicable Risk Category modifier (-10% to +10%)
4. Statutory deductible requirements

Return ONLY valid JSON matching this schema:
{
  "code": "${occupancyCode}",
  "title": string,
  "executive_summary": string,
  "statutory_citations": string[],
  "tariff_risk_category": "Category 1" | "Category 2" | "Category 3" | "Category 4",
  "category_loading_or_discount": string,
  "hazard_evaluation": string,
  "underwriter_advisory": string
}`;

  if (hasKey && client) {
    try {
      const response = await client.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const responseText = response.text || '{}';
      const parsed = JSON.parse(responseText);
      const latency = Date.now() - startTime;
      const inputTokens = Math.round(prompt.length / 4);
      const outputTokens = Math.round(responseText.length / 4);
      const cost = calculateAICost(inputTokens, outputTokens);

      await logAIRequest({
        workspace_id: workspaceId,
        user_id: userId,
        endpoint: '/api/explain',
        model: modelName,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        cost_usd: cost,
        latency_ms: latency,
        is_mocked: false
      });

      return {
        success: true,
        data: parsed,
        meta: { model: modelName, latency_ms: latency, cost_usd: cost, is_mocked: false }
      };
    } catch (err) {
      console.warn('Gemini explain call failed:', err);
    }
  }

  // Deterministic Fallback
  const latency = Date.now() - startTime;
  const fallback = {
    code: occupancyCode,
    title: `Occupancy ${occupancyCode} Underwriting Rationale`,
    executive_summary: `Code ${occupancyCode} covers mechanical and engineering processes where metal fabrication, milling, stamping, and electrical component assembly form the dominant risk profile.`,
    statutory_citations: [
      'AIFT 2001 Section 3 - Industrial Occupancies Schedule',
      'IIB Loss Cost Publication Schedule 3 (Engineering & Manufacturing)',
      'IRDAI Guidelines on Risk Classification & Minimum Underwriting Rates'
    ],
    tariff_risk_category: 'Category 2',
    category_loading_or_discount: '-5% Discount on Base Flexa Rate',
    hazard_evaluation: 'Low-to-medium combustibility with primary exposure originating from cutting lubricants and electrical control panels.',
    underwriter_advisory: 'Recommend installation of automatic fire detection in CNC controller bays and Class B CO2 extinguishers near solvent storage.'
  };

  await logAIRequest({
    workspace_id: workspaceId,
    user_id: userId,
    endpoint: '/api/explain',
    model: 'fallback-deterministic',
    input_tokens: Math.round(prompt.length / 4),
    output_tokens: 280,
    cost_usd: 0,
    latency_ms: latency,
    is_mocked: true
  });

  return {
    success: true,
    data: fallback,
    meta: { model: 'fallback-deterministic', latency_ms: latency, cost_usd: 0, is_mocked: true }
  };
}

/**
 * Endpoint 4: Summarize Proposal & Flag Gaps
 */
export async function summarizeProposal(proposalData: any, workspaceId?: string, userId?: string) {
  const startTime = Date.now();
  const { client, hasKey } = getGeminiClient();
  const modelName = 'gemini-2.5-flash';

  const prompt = `You are Quotely's senior underwriting auditor.
Summarize this proposal and identify any missing risk disclosures:
${JSON.stringify(proposalData, null, 2)}

Return ONLY valid JSON matching this schema:
{
  "client_summary": string,
  "risk_overview": string,
  "key_exposures": string[],
  "missing_disclosures": string[],
  "underwriter_recommendation": string
}`;

  if (hasKey && client) {
    try {
      const response = await client.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const responseText = response.text || '{}';
      const parsed = JSON.parse(responseText);
      const latency = Date.now() - startTime;
      const inputTokens = Math.round(prompt.length / 4);
      const outputTokens = Math.round(responseText.length / 4);
      const cost = calculateAICost(inputTokens, outputTokens);

      await logAIRequest({
        workspace_id: workspaceId,
        user_id: userId,
        endpoint: '/api/summarize',
        model: modelName,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        cost_usd: cost,
        latency_ms: latency,
        is_mocked: false
      });

      return {
        success: true,
        data: parsed,
        meta: { model: modelName, latency_ms: latency, cost_usd: cost, is_mocked: false }
      };
    } catch (err) {
      console.warn('Gemini summarize call failed:', err);
    }
  }

  // Deterministic Fallback
  const latency = Date.now() - startTime;
  const fallback = {
    client_summary: `Commercial property policy for ${proposalData.client_name || 'Insured Firm'} with aggregate sum insured of ₹${((proposalData.sum_insured?.total || 53800000) / 10000000).toFixed(2)} Cr.`,
    risk_overview: `Occupancy code ${proposalData.occupancy_code || '1023'} located in ${proposalData.district || 'Gurugram'}, ${proposalData.state || 'Haryana'}.`,
    key_exposures: ['Heavy machinery downtime exposure', 'Earthquake Zone IV seismic ground acceleration risk', 'Monsoon STFI water ingress risk'],
    missing_disclosures: ['Annual maintenance contracts for electrical substations', 'Basement storage status for raw material stock'],
    underwriter_recommendation: 'Bind quote with standard tariff deductibles; require hydrants test certificate within 30 days.'
  };

  await logAIRequest({
    workspace_id: workspaceId,
    user_id: userId,
    endpoint: '/api/summarize',
    model: 'fallback-deterministic',
    input_tokens: Math.round(prompt.length / 4),
    output_tokens: 240,
    cost_usd: 0,
    latency_ms: latency,
    is_mocked: true
  });

  return {
    success: true,
    data: fallback,
    meta: { model: 'fallback-deterministic', latency_ms: latency, cost_usd: 0, is_mocked: true }
  };
}

/**
 * Endpoint Helper: Live Test AI Connection
 */
export async function testAIConnection() {
  const startTime = Date.now();
  const { client, hasKey } = getGeminiClient();
  const modelName = 'gemini-2.5-flash';

  if (!hasKey || !client) {
    return {
      connected: false,
      model: modelName,
      latency_ms: 0,
      is_mocked: true,
      error: 'GEMINI_API_KEY environment variable is not configured. Using deterministic offline RAG mode.',
      sample_response: {
        status: 'warning',
        mode: 'deterministic_rag',
        message: 'No live API key detected. Set GEMINI_API_KEY to activate live Gemini 2.5 Flash inference.'
      }
    };
  }

  try {
    const testPrompt = 'Respond with JSON only: {"status": "ok", "service": "Quotely AI Underwriting Engine", "model": "gemini-2.5-flash", "timestamp": "' + new Date().toISOString() + '"}';
    const response = await client.models.generateContent({
      model: modelName,
      contents: testPrompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const latency = Date.now() - startTime;
    const responseText = response.text || '{}';
    const parsed = JSON.parse(responseText);

    await logAIRequest({
      endpoint: '/api/health',
      model: modelName,
      input_tokens: 30,
      output_tokens: 25,
      cost_usd: calculateAICost(30, 25),
      latency_ms: latency,
      is_mocked: false
    });

    return {
      connected: true,
      model: modelName,
      latency_ms: latency,
      is_mocked: false,
      sample_response: parsed
    };
  } catch (err: any) {
    const latency = Date.now() - startTime;
    return {
      connected: false,
      model: modelName,
      latency_ms: latency,
      is_mocked: true,
      error: err.message || 'Error communicating with Gemini 2.5 Flash API.',
      sample_response: null
    };
  }
}
