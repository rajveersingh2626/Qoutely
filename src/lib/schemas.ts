import { z } from 'zod';
import occupanciesData from '@/data/occupancies.json';

/**
 * Karpathy Software 2.0 Boundary Enforcement:
 * The LLM (Software 2.0) is only permitted to perform fuzzy perception (OCR, semantic extraction).
 * Its output MUST be clamped, validated, and normalized by strict deterministic schemas (Software 1.0).
 * Under NO circumstances does the LLM compute premium ratings or invent unscheduled occupancy codes.
 */

export const SumInsuredSchema = z.object({
  building: z.coerce.number().nonnegative().nullable().optional().transform((v) => v || 0),
  plant_and_machinery: z.coerce.number().nonnegative().nullable().optional().transform((v) => v || 0),
  stocks: z.coerce.number().nonnegative().nullable().optional().transform((v) => v || 0),
  furniture_and_fixtures: z.coerce.number().nonnegative().nullable().optional().transform((v) => v || 0),
  other: z.coerce.number().nonnegative().nullable().optional().transform((v) => v || 0),
  total: z.coerce.number().nonnegative().nullable().optional().transform((v) => v || 0),
}).transform((val) => {
  // Software 1.0 Arithmetic Clamp: Guarantee total is mathematically correct
  const sum = (val.building || 0) + (val.plant_and_machinery || 0) + (val.stocks || 0) + (val.furniture_and_fixtures || 0) + (val.other || 0);
  return {
    ...val,
    total: sum > 0 ? sum : (val.total || 0),
  };
});

export const PerilsRequiredSchema = z.object({
  fire_flexa: z.coerce.boolean().nullable().optional().transform((v) => v ?? true),
  stfi: z.coerce.boolean().nullable().optional().transform((v) => v ?? true),
  earthquake: z.coerce.boolean().nullable().optional().transform((v) => v ?? true),
  terrorism: z.coerce.boolean().nullable().optional().transform((v) => v ?? false),
});

export const ProposalExtractionSchema = z.object({
  client_name: z.string().nullable().optional().transform((v) => v || ''),
  gst_number: z.string().nullable().optional().transform((v) => v || ''),
  address: z.string().nullable().optional().transform((v) => v || ''),
  district: z.string().nullable().optional().transform((v) => v || ''),
  state: z.string().nullable().optional().transform((v) => v || ''),
  business_description: z.string().nullable().optional().transform((v) => v || ''),
  construction_type: z.string().nullable().optional().transform((v) => {
    if (!v) return 'Class A';
    if (v.includes('B')) return 'Class B';
    if (v.includes('C')) return 'Class C';
    if (v.toLowerCase().includes('kutcha')) return 'Kutcha';
    return 'Class A';
  }),
  policy_duration_months: z.coerce.number().int().positive().nullable().optional().transform((v) => v || 12),
  previous_insurer: z.string().nullable().optional().transform((v) => v || 'None / Fresh Proposal'),
  claim_history_last_3_years: z.coerce.boolean().nullable().optional().transform((v) => Boolean(v)),
  claim_ratio_percent: z.coerce.number().min(0).max(500).nullable().optional().transform((v) => v || 0),
  sum_insured: SumInsuredSchema.nullable().optional().transform((v) => v || {
    building: 0,
    plant_and_machinery: 0,
    stocks: 0,
    furniture_and_fixtures: 0,
    other: 0,
    total: 0,
  }),
  perils_required: PerilsRequiredSchema.nullable().optional().transform((v) => v || {
    fire_flexa: true,
    stfi: true,
    earthquake: true,
    terrorism: false,
  }),
  occupancy_code: z.string().nullable().optional(),
  hazard_flags: z.array(z.string()).nullable().optional().transform((v) => v || []),
  missing_fields: z.array(z.string()).nullable().optional().transform((v) => v || []),
});

export type ValidatedProposalExtraction = z.infer<typeof ProposalExtractionSchema>;

export interface ClampedExtractionResult {
  data: ValidatedProposalExtraction;
  software_boundary: {
    perception_model: string;
    deterministic_schema_applied: boolean;
    hallucination_detected: boolean;
    rejected_codes: string[];
    zero_ai_math_guaranteed: boolean;
  };
}

/**
 * Validates, normalizes, and clamps raw LLM perception output against deterministic business rules.
 * Strictly verifies occupancy codes against official IIB Schedule 3 database.
 */
export function validateAndClampLLMOutput(rawLLMOutput: unknown, modelName = 'gemini-2.5-flash'): ClampedExtractionResult {
  const parseResult = ProposalExtractionSchema.safeParse(rawLLMOutput);
  
  let data: ValidatedProposalExtraction;
  if (parseResult.success) {
    data = parseResult.data;
  } else {
    console.warn('ProposalExtractionSchema parse warning:', parseResult.error.format());
    // Graceful fallback to default clamped structure with issues flagged
    data = ProposalExtractionSchema.parse({});
    data.missing_fields.push('llm_schema_parsing_warning');
  }

  const rejectedCodes: string[] = [];
  let hallucinationDetected = false;

  // Strict IIB Schedule 3 Taxonomy Validation
  if (data.occupancy_code) {
    const rawCode = data.occupancy_code.trim();
    const isCodeValid = (occupanciesData as Array<{ code: string }>).some(
      (entry) => entry.code === rawCode
    );

    if (!isCodeValid) {
      hallucinationDetected = true;
      rejectedCodes.push(rawCode);
      data.occupancy_code = null;
      data.hazard_flags.push(
        `[KARPATHY SOFTWARE 1.0 CLAMP]: Rejected hallucinated occupancy code '${rawCode}'. Code is not present in official IIB Schedule 3 (289 statutory occupancies).`
      );
      data.missing_fields.push('occupancy_code_clarification_required');
    }
  }

  return {
    data,
    software_boundary: {
      perception_model: modelName,
      deterministic_schema_applied: true,
      hallucination_detected: hallucinationDetected,
      rejected_codes: rejectedCodes,
      zero_ai_math_guaranteed: true,
    },
  };
}
