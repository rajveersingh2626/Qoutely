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

export interface ExtractInputPayload {
  content?: string;
  base64?: string;
  mimeType?: string;
  fileName?: string;
}

/**
 * Endpoint 1: Extract Proposal Entities
 */
export async function extractProposal(
  input: string | ExtractInputPayload,
  workspaceId?: string,
  userId?: string
) {
  const startTime = Date.now();
  const { client, hasKey } = getGeminiClient();
  const modelName = 'gemini-2.5-flash';

  const rawText = typeof input === 'string' ? input : (input.content || '');
  const base64 = typeof input === 'object' ? input.base64 : undefined;
  const mimeType = typeof input === 'object' ? input.mimeType : undefined;
  const fileName = typeof input === 'object' ? input.fileName : undefined;

  if (!hasKey || !client) {
    return {
      success: false,
      error: 'Gemini API key is not configured or unavailable. Real AI processing is required.',
    };
  }

  // Pre-check for empty / trivial input
  const textToCheck = rawText.trim();
  if (!base64 && textToCheck.length < 15) {
    return {
      success: false,
      is_valid_proposal: false,
      error: 'The provided text is too short to be an insurance proposal or RFQ. Please provide meaningful commercial risk details.',
    };
  }

  const prompt = `You are Quotely's senior commercial insurance underwriter for India.
Review the following document or text for commercial property, fire, engineering, storage, manufacturing, shop, or industrial insurance underwriting.

STEP 1: RELEVANCE VERIFICATION
Determine whether the document or text is genuinely related to commercial property/fire insurance, an RFQ, a policy schedule, a risk inspection, or an insurance proposal.
- If the text is random gibberish (e.g. "asdf", keyboard mash), spam, unrelated personal text (e.g. cooking recipes, essays, general chat, coding scripts, personal letters, jokes, resumes, non-insurance papers), or does NOT describe a commercial business/property with insurable assets:
  You MUST return:
  {
    "is_insurance_document": false,
    "rejection_reason": "Bro, this document/text is not related to commercial property insurance or an underwriting proposal. Please upload a genuine commercial proposal or policy schedule."
  }
- If it IS genuinely related to commercial insurance, an RFQ, or business property underwriting, set "is_insurance_document": true, and extract the real entities present in the document. Do NOT invent fake company names or fake numbers if they are not in the document.

Return ONLY valid JSON matching this schema:
{
  "is_insurance_document": boolean,
  "rejection_reason": string | null,
  "client_name": string | null,
  "gst_number": string | null,
  "address": string | null,
  "district": string | null,
  "state": string | null,
  "business_description": string | null,
  "occupancy_code": string | null,
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
${rawText ? `\nDocument content / excerpt:\n${rawText}` : ''}
${fileName ? `\nDocument filename: ${fileName}` : ''}`;

  try {
    const contents: any[] = [];
    if (base64 && mimeType) {
      const cleanBase64 = base64.replace(/^data:[^;]+;base64,/, '');
      contents.push({
        inlineData: {
          data: cleanBase64,
          mimeType: mimeType,
        },
      });
    }
    contents.push(prompt);

    const response = await client.models.generateContent({
      model: modelName,
      contents: contents.length === 1 ? contents[0] : contents,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '{}';
    const parsed = JSON.parse(responseText);
    const latency = Date.now() - startTime;
    const inputTokens = Math.max(50, Math.round(prompt.length / 4) + (base64 ? 300 : 0));
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
      is_mocked: false,
    });

    // 1. Check if Gemini rejected the document as unrelated/BS
    if (parsed.is_insurance_document === false) {
      return {
        success: false,
        is_valid_proposal: false,
        error:
          parsed.rejection_reason ||
          'Bro, this document/text is not related to commercial property insurance or an underwriting proposal. Please upload a genuine commercial proposal or policy schedule.',
        meta: { model: modelName, latency_ms: latency, cost_usd: cost, is_mocked: false },
      };
    }

    // 2. Check if minimal required data is present
    if (
      !parsed.client_name &&
      !parsed.business_description &&
      (!parsed.sum_insured || parsed.sum_insured.total === 0)
    ) {
      return {
        success: false,
        is_valid_proposal: false,
        error: 'The document does not contain recognizable client information, business description, or sum insured values. Please provide a valid commercial proposal.',
        meta: { model: modelName, latency_ms: latency, cost_usd: cost, is_mocked: false },
      };
    }

    // Karpathy Software 2.0 / 1.0 Boundary Clamp
    const clampedResult = validateAndClampLLMOutput(parsed, modelName);

    // Perform RAG search on the business description to get statutory IIB Schedule 3 occupancy code
    const searchDesc = `${clampedResult.data.business_description || ''} ${rawText}`.trim();
    const ragResult = searchOccupanciesRAG(searchDesc || 'commercial risk');
    const finalCode = clampedResult.data.occupancy_code || ragResult.primaryCandidate?.code || '1023';

    // Match Earthquake Zone from district/state/address
    const searchLocation = `${clampedResult.data.district || ''} ${clampedResult.data.state || ''} ${clampedResult.data.address || ''}`.trim();
    const eqMatch = matchDistrictEQZone(searchLocation);
    const resolvedZone = eqMatch?.zone || 'Zone 3';
    const confidence = Math.min(0.98, Math.max(0.85, ragResult.primaryCandidate?.confidence || 0.92));

    return {
      success: true,
      data: {
        ...clampedResult.data,
        clamped_occupancy_code: finalCode,
        occupancy_candidates: ragResult.topCandidates,
      },
      software_boundary: {
        ...clampedResult.software_boundary,
        eq_zone: resolvedZone,
        confidence_score: confidence,
      },
      meta: { model: modelName, latency_ms: latency, cost_usd: cost, is_mocked: false },
    };
  } catch (err: any) {
    console.error('Gemini API extraction failed:', err);
    return {
      success: false,
      error: `Gemini extraction failed: ${err.message || 'Unable to process document'}. Please check the document format or try again.`,
    };
  }
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

  const prompt = `You are Quotely's senior underwriting classifier under the All India Fire Tariff (AIFT 2001) and IIB Loss Cost Guidelines.

STEP 1: VALIDATE RELEVANCE
Check if the following business description is a real, legitimate commercial enterprise, manufacturing operation, storage facility, or insurable business risk:
"${businessDescription}"

If the text is gibberish, spam, keyboard smash (e.g. "asdfghjkl", "qwerty"), random words, completely unrelated content (e.g. food recipe, poetry, casual chat), or contains no recognizable business activity:
Set "is_valid_occupancy": false and set "rejection_reason": "Bro, this isn't related to an insurable business or commercial property."

STEP 2: CLASSIFICATION (only if is_valid_occupancy is true)
Review the candidate IIB Schedule 3 occupancies retrieved from tariff records:
Retrieved Candidates from IIB Schedule 3:
${JSON.stringify(ragResult.topCandidates, null, 2)}

Provide the final candidate rankings. NEVER invent occupancy codes not present in the candidates.
Return ONLY valid JSON matching this schema:
{
  "is_valid_occupancy": boolean,
  "rejection_reason": string | null,
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

  if (!hasKey || !client) {
    return {
      success: false,
      error: 'Gemini AI service is unavailable: GEMINI_API_KEY is not configured.',
    };
  }

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

    if (parsed.is_valid_occupancy === false) {
      return {
        success: false,
        is_valid_occupancy: false,
        error: parsed.rejection_reason || "Bro, this isn't related to an insurable business description.",
        meta: { model: modelName, latency_ms: latency, cost_usd: cost, is_mocked: false }
      };
    }

    return {
      success: true,
      data: {
        ...parsed,
        eq_zone: eqMatch
      },
      meta: { model: modelName, latency_ms: latency, cost_usd: cost, is_mocked: false }
    };
  } catch (err: any) {
    console.error('Gemini classify failed:', err);
    return {
      success: false,
      error: `Occupancy classification failed: ${err.message || 'Error processing business description'}`
    };
  }
}

/**
 * Endpoint 3: Explain Underwriting Decisions
 */
export async function explainRecommendation(occupancyCode: string, businessDescription: string, workspaceId?: string, userId?: string) {
  const startTime = Date.now();
  const { client, hasKey } = getGeminiClient();
  const modelName = 'gemini-2.5-flash';

  if (!hasKey || !client) {
    return {
      success: false,
      error: 'Gemini AI service is unavailable: GEMINI_API_KEY is not configured.'
    };
  }

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
  } catch (err: any) {
    console.error('Gemini explain call failed:', err);
    return {
      success: false,
      error: `Underwriting rationale generation failed: ${err.message || 'Gemini AI service error'}`
    };
  }
}

/**
 * Endpoint 4: Summarize Proposal & Flag Gaps
 */
export async function summarizeProposal(proposalData: any, workspaceId?: string, userId?: string) {
  const startTime = Date.now();
  const { client, hasKey } = getGeminiClient();
  const modelName = 'gemini-2.5-flash';

  if (!hasKey || !client) {
    return {
      success: false,
      error: 'Gemini AI service is unavailable: GEMINI_API_KEY is not configured.'
    };
  }

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
  } catch (err: any) {
    console.error('Gemini summarize call failed:', err);
    return {
      success: false,
      error: `Proposal summary generation failed: ${err.message || 'Gemini AI service error'}`
    };
  }
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
