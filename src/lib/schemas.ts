import { z } from 'zod';
import occupanciesData from '@/data/occupancies.json';

/**
 * Karpathy Software 2.0 Boundary Enforcement:
 * The LLM (Software 2.0) is only permitted to perform fuzzy perception (OCR, semantic extraction).
 * Its output MUST be clamped, validated, and normalized by strict deterministic schemas (Software 1.0).
 * Under NO circumstances does the LLM compute premium ratings or invent unscheduled occupancy codes.
 */

export const SumInsuredSchema = z.object({
  building: z.coerce.number().nonnegative().default(0),
  plant_and_machinery: z.coerce.number().nonnegative().default(0),
  stocks: z.coerce.number().nonnegative().default(0),
  furniture_and_fixtures: z.coerce.number().nonnegative().default(0),
  other: z.coerce.number().nonnegative().default(0),
  total: z.coerce.number().nonnegative().default(0),
}).transform((val) => {
  // Software 1.0 Arithmetic Clamp: Guarantee total is mathematically correct
  const sum = val.building + val.plant_and_machinery + val.stocks + val.furniture_and_fixtures + val.other;
  return {
    ...val,
    total: sum > 0 ? sum : val.total,
  };
});

export const PerilsRequiredSchema = z.object({
  fire_flexa: z.boolean().default(true),
  stfi: z.boolean().default(true),
  earthquake: z.boolean().default(true),
  terrorism: z.boolean().default(false),
});

export const ProposalExtractionSchema = z.object({
  client_name: z.string().min(1, 'Client name is required').default('Commercial Enterprise'),
  gst_number: z.string().optional().default(''),
  address: z.string().optional().default(''),
  district: z.string().optional().default(''),
  state: z.string().optional().default(''),
  business_description: z.string().min(1, 'Business description is required').default(''),
  construction_type: z.enum(['Class A', 'Class B', 'Class C', 'Kutcha', 'Pucca']).default('Class A'),
  policy_duration_months: z.coerce.number().int().positive().default(12),
  previous_insurer: z.string().optional().default('None / Fresh Proposal'),
  claim_history_last_3_years: z.boolean().default(false),
  claim_ratio_percent: z.coerce.number().min(0).max(500).default(0),
  sum_insured: SumInsuredSchema.default({
    building: 0,
    plant_and_machinery: 0,
    stocks: 0,
    furniture_and_fixtures: 0,
    other: 0,
    total: 0,
  }),
  perils_required: PerilsRequiredSchema.default({
    fire_flexa: true,
    stfi: true,
    earthquake: true,
    terrorism: false,
  }),
  occupancy_code: z.string().nullable().optional(),
  hazard_flags: z.array(z.string()).default([]),
  missing_fields: z.array(z.string()).default([]),
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
