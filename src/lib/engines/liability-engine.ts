/**
 * Pure Deterministic Corporate Liability & Executive Protection Underwriting Engine
 *
 * Implements:
 * 1. Commercial General Liability (CGL) (Feature 26):
 *    - Hazard categories 1 to 4 (0.30‰, 0.60‰, 1.20‰, 2.50‰ on annual turnover).
 *    - Any One Accident (AOA) to Any One Year (AOY) limit ratios (1:1 [0%], 1:2 [15%], 1:3 [22%], 1:4 [28%]).
 *    - Invariant: AOA limit cannot exceed AOY aggregate limit (throws exact error).
 *    - Territory multipliers: India only (1.0x), Worldwide ex-USA (1.5x), Worldwide inc-USA (2.5x).
 * 2. Professional Indemnity (PI / E&O) (Feature 27):
 *    - Profession rating on Limit of Indemnity (LOI): Tech Software (0.85%), Consultants/CA (1.20%), Insurance Broker (1.50%), Medical Doctor (2.00%).
 *    - Statutory broker minimum indemnity check under IRDAI (Insurance Brokers) Regulations, 2018: Math.max(50_00_000, fee_income * 3).
 *    - Retroactive coverage clean years loading: Math.min(50, prior_clean_years * 10)%.
 * 3. Directors & Officers (D&O) Liability (Feature 28):
 *    - Side A (0.40%), Side B (0.35%), Side C (0.50%) rating on LOI.
 *    - Entity listing multiplier: Private unlisted (1.0x), Public listed India (1.8x), Public listed US ADR (3.5x).
 *    - Financial distress loading: +25% if debt_to_equity_ratio > 3.0; 0% otherwise.
 * 4. Cyber Posture Scoring Matrix (Feature 29):
 *    - 6 core security controls: MFA (25 pts), EDR (20 pts), Airgapped Backups (20 pts), Annual VAPT (15 pts), 24/7 SOC (10 pts), Training (10 pts).
 *    - Hard Gating: If missing MFA or score < 50, tier is 'uninsurable', final premium = 0, can_issue_quote = false.
 *    - Mature tier (>=85 pts, -20% discount), Adequate (70-84 pts, par 0%), Deficient (50-69 pts, +30% loading).
 * 5. Commercial Crime & Employee Fidelity (Feature 30):
 *    - Per-head rating (₹250 per sensitive employee) + LOI rating (0.50% on limit of liability).
 *    - Dual authorization internal controls adjustment: -15% discount if present; +25% loading if absent.
 * 6. Corporate Liability Studio UI Model (Feature 31):
 *    - Validates corporate name, positive turnover, and selection of at least one line.
 * 7. Dual-Tier Architecture:
 *    - Canonical underwriting functions matching Features 26–31 in tests/e2e/canonical_engines.ts.
 *    - Standard contract functions returning StandardQuoteBreakdown with 18% GST and algorithmic explainability vector.
 *
 * Zero external network calls. Zero LLM arithmetic. 100% deterministic pure TypeScript.
 */

import {
  LOBCategory,
  InsuranceLine,
  StandardQuoteBreakdown,
  AlgorithmicExplainabilityStep,
} from '@/types/database';

// ============================================================================
// 1. TARIFF CONSTANTS & BENCHMARKS
// ============================================================================

export const STATUTORY_GST_RATE = 18; // 18% GST

export const CGL_HAZARD_RATES_PER_MILLE: Record<1 | 2 | 3 | 4, number> = {
  1: 0.30, // IT / Consulting / Financial Services
  2: 0.60, // Light Manufacturing / Retail / Logistics
  3: 1.20, // Heavy Engineering / Civil Construction
  4: 2.50, // Hazardous Chemicals / Petrochemicals / Flammables
};

export const CGL_LIMIT_RATIO_MULTIPLIERS: Record<'1:1' | '1:2' | '1:3' | '1:4', { mult: number; disc: number }> = {
  '1:1': { mult: 1.00, disc: 0 },
  '1:2': { mult: 0.85, disc: 15 },
  '1:3': { mult: 0.78, disc: 22 },
  '1:4': { mult: 0.72, disc: 28 },
};

export const CGL_TERRITORY_MULTIPLIERS: Record<'india_only' | 'worldwide_ex_usa' | 'worldwide_inc_usa', number> = {
  india_only: 1.00,
  worldwide_ex_usa: 1.50,
  worldwide_inc_usa: 2.50,
};

export const PI_PROFESSION_RATES = {
  tech_software: 0.0085,    // 0.85% of LOI
  consultants_ca: 0.0120,   // 1.20% of LOI
  insurance_broker: 0.0150, // 1.50% of LOI
  medical_doctor: 0.0200,   // 2.00% of LOI
} as const;

export const DO_SIDE_RATES = {
  side_a: 0.0040, // 0.40%
  side_b: 0.0035, // 0.35%
  side_c: 0.0050, // 0.50%
} as const;

export const DO_LISTING_MULTIPLIERS = {
  private_unlisted: 1.0,
  public_listed_india: 1.8,
  public_listed_us_adr: 3.5,
} as const;

export const CRIME_PER_HEAD_RATE = 250; // ₹250 per sensitive employee
export const CRIME_LOI_RATE = 0.0050;   // 0.50% of limit of liability
export const CRIME_DUAL_AUTH_DISCOUNT_PERCENT = 15; // -15%
export const CRIME_SINGLE_SIGNOFF_LOADING_PERCENT = 25; // +25%

export const CYBER_CONTROL_POINTS = {
  has_mfa_everywhere: 25,
  has_edr_endpoints: 20,
  has_airgapped_backups: 20,
  has_annual_vapt: 15,
  has_247_soc: 10,
  has_employee_training: 10,
} as const;

// ============================================================================
// 2. FEATURE 26: CGL TURNOVER & AOA:AOY LIMIT RATIO ENGINE
// ============================================================================

export type CglHazardCategory = 1 | 2 | 3 | 4;
export type CglLimitRatio = '1:1' | '1:2' | '1:3' | '1:4';
export type CglTerritory = 'india_only' | 'worldwide_ex_usa' | 'worldwide_inc_usa';

export interface CglInput {
  annual_turnover: number;
  aoa_limit: number;
  aoy_limit: number;
  ratio: CglLimitRatio;
  hazard_category: CglHazardCategory;
  territory: CglTerritory;
}

export function calculateCglPremium(input: CglInput): {
  base_turnover_rate_per_mille: number;
  gross_cgl_premium: number;
  ratio_discount_percent: number;
  territory_multiplier: number;
  net_cgl_premium: number;
} {
  if (input.aoa_limit > input.aoy_limit) {
    throw new Error('Any One Accident (AOA) limit cannot exceed Any One Year (AOY) aggregate limit');
  }

  const hazardRates: Record<CglHazardCategory, number> = {
    1: 0.30, // IT / Consulting
    2: 0.60, // Light Mfg / Retail
    3: 1.20, // Heavy Engineering
    4: 2.50, // Hazardous Chemicals
  };

  const ratioMultipliers: Record<CglLimitRatio, { mult: number; disc: number }> = {
    '1:1': { mult: 1.00, disc: 0 },
    '1:2': { mult: 0.85, disc: 15 },
    '1:3': { mult: 0.78, disc: 22 },
    '1:4': { mult: 0.72, disc: 28 },
  };

  const territoryMults: Record<CglTerritory, number> = {
    india_only: 1.00,
    worldwide_ex_usa: 1.50,
    worldwide_inc_usa: 2.50,
  };

  const baseRate = hazardRates[input.hazard_category];
  const gross = (input.annual_turnover * baseRate) / 1000;
  const ratioInfo = ratioMultipliers[input.ratio];
  const territoryMult = territoryMults[input.territory];

  const net = Math.round(gross * ratioInfo.mult * territoryMult);

  return {
    base_turnover_rate_per_mille: baseRate,
    gross_cgl_premium: Math.round(gross),
    ratio_discount_percent: ratioInfo.disc,
    territory_multiplier: territoryMult,
    net_cgl_premium: net,
  };
}

// ============================================================================
// 3. FEATURE 27: PROFESSIONAL INDEMNITY (PI / E&O) ENGINE
// ============================================================================

export type PiProfession = 'tech_software' | 'consultants_ca' | 'insurance_broker' | 'medical_doctor';

export interface PiInput {
  annual_fee_income: number;
  limit_of_indemnity: number;
  profession: PiProfession;
  prior_clean_years: number;
}

export function calculateProfessionalIndemnity(input: PiInput): {
  base_pi_premium: number;
  retroactive_loading_percent: number;
  net_pi_premium: number;
  statutory_minimum_met: boolean;
} {
  const professionRates: Record<PiProfession, number> = {
    tech_software: 0.0085,
    consultants_ca: 0.0120,
    insurance_broker: 0.0150,
    medical_doctor: 0.0200,
  };

  // Statutory requirement check for insurance brokers (IRDAI Broker Regs 2018: 3x brokerage or ₹50L)
  let brokerMinMet = true;
  if (input.profession === 'insurance_broker') {
    const requiredMin = Math.max(5000000, input.annual_fee_income * 3);
    if (input.limit_of_indemnity < requiredMin) {
      brokerMinMet = false;
    }
  }

  const rate = professionRates[input.profession];
  const base = input.limit_of_indemnity * rate;

  // Retroactive coverage loading (+10% per prior clean year, up to 50%)
  const retroPct = Math.min(50, input.prior_clean_years * 10);
  const net = Math.round(base * (1 + retroPct / 100));

  return {
    base_pi_premium: Math.round(base),
    retroactive_loading_percent: retroPct,
    net_pi_premium: net,
    statutory_minimum_met: brokerMinMet,
  };
}

// ============================================================================
// 4. FEATURE 28: DIRECTORS & OFFICERS (D&O) ENGINE
// ============================================================================

export interface DoInput {
  limit_of_indemnity: number;
  entity_listing_status: 'private_unlisted' | 'public_listed_india' | 'public_listed_us_adr';
  debt_to_equity_ratio: number;
}

export function calculateDirectorsOfficersPremium(input: DoInput): {
  side_a_premium: number;
  side_b_premium: number;
  side_c_premium: number;
  financial_distress_loading_percent: number;
  net_do_premium: number;
} {
  const sideABase = input.limit_of_indemnity * 0.0040;
  const sideBBase = input.limit_of_indemnity * 0.0035;
  const sideCBase = input.limit_of_indemnity * 0.0050;

  let entityMult = 1.0;
  if (input.entity_listing_status === 'public_listed_india') entityMult = 1.8;
  else if (input.entity_listing_status === 'public_listed_us_adr') entityMult = 3.5;

  let distressLoadingPct = 0;
  if (input.debt_to_equity_ratio > 3.0) {
    distressLoadingPct = 25; // +25% loading for leveraged balance sheet
  }

  const baseTotal = (sideABase + sideBBase + sideCBase) * entityMult;
  const net = Math.round(baseTotal * (1 + distressLoadingPct / 100));

  return {
    side_a_premium: Math.round(sideABase * entityMult),
    side_b_premium: Math.round(sideBBase * entityMult),
    side_c_premium: Math.round(sideCBase * entityMult),
    financial_distress_loading_percent: distressLoadingPct,
    net_do_premium: net,
  };
}

// ============================================================================
// 5. FEATURE 29: DETERMINISTIC CYBER POSTURE SCORING MATRIX
// ============================================================================

export interface CyberPostureAnswers {
  has_mfa_everywhere: boolean; // 25 pts
  has_edr_endpoints: boolean; // 20 pts
  has_airgapped_backups: boolean; // 20 pts
  has_annual_vapt: boolean; // 15 pts
  has_247_soc: boolean; // 10 pts
  has_employee_training: boolean; // 10 pts
}

export function evaluateCyberPosture(
  answers: CyberPostureAnswers,
  base_premium: number
): {
  score: number;
  posture_tier: 'mature' | 'adequate' | 'deficient' | 'uninsurable';
  rate_adjustment_percent: number;
  final_cyber_premium: number;
  can_issue_quote: boolean;
  reasons: string[];
} {
  let score = 0;
  const reasons: string[] = [];

  if (answers.has_mfa_everywhere) score += 25;
  else reasons.push('CRITICAL: Multi-Factor Authentication is missing on corporate infrastructure');

  if (answers.has_edr_endpoints) score += 20;
  if (answers.has_airgapped_backups) score += 20;
  if (answers.has_annual_vapt) score += 15;
  if (answers.has_247_soc) score += 10;
  if (answers.has_employee_training) score += 10;

  // Rating rules
  if (!answers.has_mfa_everywhere || score < 50) {
    return {
      score,
      posture_tier: 'uninsurable',
      rate_adjustment_percent: 0,
      final_cyber_premium: 0,
      can_issue_quote: false,
      reasons: [...reasons, 'Uninsurable: Score below 50 or absence of MFA requires remediation prior to bind.'],
    };
  }

  let tier: 'mature' | 'adequate' | 'deficient' = 'adequate';
  let adjPct = 0;

  if (score >= 85) {
    tier = 'mature';
    adjPct = -20; // 20% discount
  } else if (score >= 70) {
    tier = 'adequate';
    adjPct = 0; // par
  } else {
    tier = 'deficient';
    adjPct = 30; // +30% loading
  }

  const finalPrem = Math.round(base_premium * (1 + adjPct / 100));
  return {
    score,
    posture_tier: tier,
    rate_adjustment_percent: adjPct,
    final_cyber_premium: finalPrem,
    can_issue_quote: true,
    reasons,
  };
}

// ============================================================================
// 6. FEATURE 30: COMMERCIAL CRIME & FIDELITY ENGINE
// ============================================================================

export interface CrimeFidelityInput {
  employees_with_funds_access: number;
  limit_of_liability: number;
  has_dual_authorization_above_50k: boolean;
}

export function calculateCommercialCrimePremium(input: CrimeFidelityInput): {
  per_head_premium: number;
  limit_premium: number;
  internal_controls_discount_or_loading: number;
  net_crime_premium: number;
} {
  const headPrem = input.employees_with_funds_access * 250;
  const limitPrem = input.limit_of_liability * 0.0050;
  const subtotal = headPrem + limitPrem;

  let controlAdj = 0;
  if (input.has_dual_authorization_above_50k) {
    controlAdj = -Math.round(subtotal * 0.15); // -15% discount for dual authorization
  } else {
    controlAdj = Math.round(subtotal * 0.25); // +25% loading for single signoff
  }

  return {
    per_head_premium: headPrem,
    limit_premium: Math.round(limitPrem),
    internal_controls_discount_or_loading: controlAdj,
    net_crime_premium: Math.round(subtotal + controlAdj),
  };
}

// ============================================================================
// 7. FEATURE 31: CORPORATE LIABILITY STUDIO UI MODEL
// ============================================================================

export interface LiabilityStudioInput {
  corporate_name: string;
  turnover: number;
  opt_cgl: boolean;
  opt_cyber: boolean;
  opt_do: boolean;
  opt_crime: boolean;
}

export function validateLiabilityStudioPackage(input: LiabilityStudioInput): {
  is_valid: boolean;
  lines_selected_count: number;
  error?: string;
} {
  if (!input.corporate_name) return { is_valid: false, lines_selected_count: 0, error: 'Corporate name is required' };
  if (input.turnover <= 0) return { is_valid: false, lines_selected_count: 0, error: 'Annual turnover must be positive' };
  const count = (input.opt_cgl ? 1 : 0) + (input.opt_cyber ? 1 : 0) + (input.opt_do ? 1 : 0) + (input.opt_crime ? 1 : 0);
  if (count === 0) return { is_valid: false, lines_selected_count: 0, error: 'Select at least one liability line' };
  return { is_valid: true, lines_selected_count: count };
}

// ============================================================================
// 8. TIER 2: STANDARD CONTRACT QUOTE FUNCTIONS
// ============================================================================

export const STATUTORY_LIABILITY_CLAUSES = [
  'Section 64VB of Insurance Act, 1938: Premium receipt warranty in advance of risk attachment.',
  'Claims-Made Basis & Retroactive Date: Covers only claims first made in writing during the policy period arising from acts after the retroactive date.',
  'Defense Costs & Legal Expenses: Defense expenses are payable within and subject to the aggregate Limit of Indemnity.',
  'Digital Personal Data Protection Act (DPDPA), 2023 Warranty: Compliance with reasonable security safeguards and prompt data breach notifications.',
  'IRDAI (Insurance Brokers) Regulations, 2018: Statutory professional indemnity minimum limit maintained per Schedule I Form B.',
  'Dual Authorization Internal Financial Controls: Segregation of duties and dual signatory mandate for financial transactions exceeding ₹50,000.',
];

/**
 * Calculates Commercial General Liability (CGL) StandardQuoteBreakdown.
 */
export function calculateCglQuote(input: CglInput): StandardQuoteBreakdown {
  const res = calculateCglPremium(input);
  const netPremium = res.net_cgl_premium;
  const gstAmount = Math.round(netPremium * (STATUTORY_GST_RATE / 100));
  const totalPremium = netPremium + gstAmount;

  const baseRatePerMille = input.annual_turnover > 0
    ? Math.round(((netPremium / input.annual_turnover) * 1000) * 100) / 100
    : 0;

  const algorithmicExplainability: AlgorithmicExplainabilityStep[] = [
    {
      step: 'Step 1: Turnover Base Rating',
      description: `Hazard Category ${input.hazard_category} rating (${res.base_turnover_rate_per_mille.toFixed(2)}‰) on Annual Turnover of ₹${input.annual_turnover.toLocaleString('en-IN')}`,
      value: `Gross CGL Premium = ₹${res.gross_cgl_premium.toLocaleString('en-IN')}`,
    },
    {
      step: 'Step 2: AOA:AOY Ratio Adjustment',
      description: `Limit ratio ${input.ratio} (AOA ₹${input.aoa_limit.toLocaleString('en-IN')} / AOY ₹${input.aoy_limit.toLocaleString('en-IN')}) provides ${res.ratio_discount_percent}% discount`,
      value: `Ratio Multiplier = ${((100 - res.ratio_discount_percent) / 100).toFixed(2)}x`,
    },
    {
      step: 'Step 3: Territorial Jurisdiction',
      description: `Territory: ${input.territory.replace(/_/g, ' ').toUpperCase()}`,
      value: `Territory Multiplier = ${res.territory_multiplier.toFixed(2)}x`,
    },
    {
      step: 'Step 4: Statutory GST & Total Payable',
      description: `Net CGL Premium ₹${netPremium.toLocaleString('en-IN')} + ${STATUTORY_GST_RATE}% GST (₹${gstAmount.toLocaleString('en-IN')})`,
      value: `Total Premium Payable = ₹${totalPremium.toLocaleString('en-IN')}`,
    },
  ];

  return {
    lob_category: 'liability',
    insurance_line: 'cgl',
    sum_insured: input.aoy_limit,
    base_rate_per_mille: baseRatePerMille,
    net_premium: netPremium,
    gst_rate_percent: STATUTORY_GST_RATE,
    gst_amount: gstAmount,
    total_premium: totalPremium,
    statutory_clauses: STATUTORY_LIABILITY_CLAUSES,
    line_specific_breakdown: {
      sub_line: 'cgl',
      annual_turnover: input.annual_turnover,
      hazard_category: input.hazard_category,
      base_rate_per_mille: res.base_turnover_rate_per_mille,
      gross_cgl_premium: res.gross_cgl_premium,
      aoa_limit: input.aoa_limit,
      aoy_limit: input.aoy_limit,
      ratio: input.ratio,
      ratio_discount_percent: res.ratio_discount_percent,
      territory: input.territory,
      territory_multiplier: res.territory_multiplier,
      net_premium: netPremium,
    },
    algorithmic_explainability: algorithmicExplainability,
  };
}

/**
 * Calculates Professional Indemnity (PI / E&O) StandardQuoteBreakdown.
 */
export function calculatePiQuote(input: PiInput): StandardQuoteBreakdown {
  const res = calculateProfessionalIndemnity(input);
  const netPremium = res.net_pi_premium;
  const gstAmount = Math.round(netPremium * (STATUTORY_GST_RATE / 100));
  const totalPremium = netPremium + gstAmount;

  const algorithmicExplainability: AlgorithmicExplainabilityStep[] = [
    {
      step: 'Step 1: Profession Base Rating',
      description: `Profession: ${input.profession.replace(/_/g, ' ').toUpperCase()} rated on Limit of Indemnity (LOI) ₹${input.limit_of_indemnity.toLocaleString('en-IN')}`,
      value: `Base PI Premium = ₹${res.base_pi_premium.toLocaleString('en-IN')}`,
    },
    {
      step: 'Step 2: Retroactive Coverage Loading',
      description: `${input.prior_clean_years} prior clean claim-free years loaded at +10%/year (capped at +50%)`,
      value: `Retroactive Loading = +${res.retroactive_loading_percent}%`,
    },
    {
      step: 'Step 3: Statutory Broker Compliance',
      description: input.profession === 'insurance_broker'
        ? `IRDAI 2018 Regulation (3x Fee ₹${(input.annual_fee_income * 3).toLocaleString('en-IN')} or ₹50L): ${res.statutory_minimum_met ? 'COMPLIANT' : 'NON-COMPLIANT (LIMIT DEFICIENT)'}`
        : 'Standard Commercial Indemnity (Non-Broker Statutory Minimum Not Applicable)',
      value: res.statutory_minimum_met ? 'PASSED' : 'DEFICIENT',
    },
    {
      step: 'Step 4: Statutory GST & Total Payable',
      description: `Net PI Premium ₹${netPremium.toLocaleString('en-IN')} + ${STATUTORY_GST_RATE}% GST (₹${gstAmount.toLocaleString('en-IN')})`,
      value: `Total Premium Payable = ₹${totalPremium.toLocaleString('en-IN')}`,
    },
  ];

  return {
    lob_category: 'liability',
    insurance_line: 'pi',
    sum_insured: input.limit_of_indemnity,
    net_premium: netPremium,
    gst_rate_percent: STATUTORY_GST_RATE,
    gst_amount: gstAmount,
    total_premium: totalPremium,
    statutory_clauses: STATUTORY_LIABILITY_CLAUSES,
    line_specific_breakdown: {
      sub_line: 'pi',
      profession: input.profession,
      annual_fee_income: input.annual_fee_income,
      limit_of_indemnity: input.limit_of_indemnity,
      base_pi_premium: res.base_pi_premium,
      prior_clean_years: input.prior_clean_years,
      retroactive_loading_percent: res.retroactive_loading_percent,
      statutory_minimum_met: res.statutory_minimum_met,
      net_premium: netPremium,
    },
    algorithmic_explainability: algorithmicExplainability,
  };
}

/**
 * Calculates Directors & Officers (D&O) Liability StandardQuoteBreakdown.
 */
export function calculateDoQuote(input: DoInput): StandardQuoteBreakdown {
  const res = calculateDirectorsOfficersPremium(input);
  const netPremium = res.net_do_premium;
  const gstAmount = Math.round(netPremium * (STATUTORY_GST_RATE / 100));
  const totalPremium = netPremium + gstAmount;

  const algorithmicExplainability: AlgorithmicExplainabilityStep[] = [
    {
      step: 'Step 1: Side A, B & C Tri-Partite Structure',
      description: `Side A Non-Indemnified (₹${res.side_a_premium.toLocaleString('en-IN')}) + Side B Corporate Reimbursement (₹${res.side_b_premium.toLocaleString('en-IN')}) + Side C Entity Securities (₹${res.side_c_premium.toLocaleString('en-IN')})`,
      value: `Total LOI = ₹${input.limit_of_indemnity.toLocaleString('en-IN')}`,
    },
    {
      step: 'Step 2: Listing Status Multiplier',
      description: `Entity Listing Profile: ${input.entity_listing_status.replace(/_/g, ' ').toUpperCase()}`,
      value: `Multiplier = ${DO_LISTING_MULTIPLIERS[input.entity_listing_status]}x`,
    },
    {
      step: 'Step 3: Balance Sheet Leverage / Distress Assessment',
      description: `Debt-to-Equity Ratio = ${input.debt_to_equity_ratio.toFixed(2)} (Threshold: > 3.0 triggers distress loading)`,
      value: res.financial_distress_loading_percent > 0 ? `+${res.financial_distress_loading_percent}% Loading` : '0% Par (Healthy Balance Sheet)',
    },
    {
      step: 'Step 4: Statutory GST & Total Payable',
      description: `Net D&O Premium ₹${netPremium.toLocaleString('en-IN')} + ${STATUTORY_GST_RATE}% GST (₹${gstAmount.toLocaleString('en-IN')})`,
      value: `Total Premium Payable = ₹${totalPremium.toLocaleString('en-IN')}`,
    },
  ];

  return {
    lob_category: 'liability',
    insurance_line: 'do',
    sum_insured: input.limit_of_indemnity,
    net_premium: netPremium,
    gst_rate_percent: STATUTORY_GST_RATE,
    gst_amount: gstAmount,
    total_premium: totalPremium,
    statutory_clauses: STATUTORY_LIABILITY_CLAUSES,
    line_specific_breakdown: {
      sub_line: 'do',
      limit_of_indemnity: input.limit_of_indemnity,
      entity_listing_status: input.entity_listing_status,
      debt_to_equity_ratio: input.debt_to_equity_ratio,
      side_a_premium: res.side_a_premium,
      side_b_premium: res.side_b_premium,
      side_c_premium: res.side_c_premium,
      financial_distress_loading_percent: res.financial_distress_loading_percent,
      net_premium: netPremium,
    },
    algorithmic_explainability: algorithmicExplainability,
  };
}

/**
 * Calculates Corporate Cyber Liability StandardQuoteBreakdown.
 */
export function calculateCyberQuote(input: {
  base_premium: number;
  answers: CyberPostureAnswers;
  limit_of_indemnity: number;
}): StandardQuoteBreakdown {
  const res = evaluateCyberPosture(input.answers, input.base_premium);
  const netPremium = res.final_cyber_premium;
  const gstAmount = Math.round(netPremium * (STATUTORY_GST_RATE / 100));
  const totalPremium = netPremium + gstAmount;

  const algorithmicExplainability: AlgorithmicExplainabilityStep[] = [
    {
      step: 'Step 1: Security Controls Evaluation',
      description: `Controls evaluated: MFA (${input.answers.has_mfa_everywhere ? '25' : '0'}/25), EDR (${input.answers.has_edr_endpoints ? '20' : '0'}/20), Backups (${input.answers.has_airgapped_backups ? '20' : '0'}/20), VAPT (${input.answers.has_annual_vapt ? '15' : '0'}/15), SOC (${input.answers.has_247_soc ? '10' : '0'}/10), Training (${input.answers.has_employee_training ? '10' : '0'}/10)`,
      value: `Total Cyber Score = ${res.score}/100`,
    },
    {
      step: 'Step 2: Underwriting Posture Tier & Gating',
      description: res.can_issue_quote
        ? `Tier: ${res.posture_tier.toUpperCase()} (${res.rate_adjustment_percent < 0 ? `${res.rate_adjustment_percent}% Discount` : res.rate_adjustment_percent === 0 ? 'Par' : `+${res.rate_adjustment_percent}% Loading`})`
        : `UNINSURABLE: ${res.reasons.join('; ')}`,
      value: res.posture_tier.toUpperCase(),
    },
    {
      step: 'Step 3: Base to Net Cyber Premium',
      description: `Base Cyber Premium ₹${input.base_premium.toLocaleString('en-IN')} adjusted by ${res.rate_adjustment_percent}%`,
      value: `Net Cyber Premium = ₹${netPremium.toLocaleString('en-IN')}`,
    },
    {
      step: 'Step 4: Statutory GST & Total Payable',
      description: `Net Cyber Premium ₹${netPremium.toLocaleString('en-IN')} + ${STATUTORY_GST_RATE}% GST (₹${gstAmount.toLocaleString('en-IN')})`,
      value: `Total Premium Payable = ₹${totalPremium.toLocaleString('en-IN')}`,
    },
  ];

  return {
    lob_category: 'liability',
    insurance_line: 'cyber',
    sum_insured: input.limit_of_indemnity,
    net_premium: netPremium,
    gst_rate_percent: STATUTORY_GST_RATE,
    gst_amount: gstAmount,
    total_premium: totalPremium,
    statutory_clauses: STATUTORY_LIABILITY_CLAUSES,
    line_specific_breakdown: {
      sub_line: 'cyber',
      limit_of_indemnity: input.limit_of_indemnity,
      base_premium: input.base_premium,
      score: res.score,
      posture_tier: res.posture_tier,
      rate_adjustment_percent: res.rate_adjustment_percent,
      can_issue_quote: res.can_issue_quote,
      reasons: res.reasons,
      answers: input.answers,
      net_premium: netPremium,
    },
    algorithmic_explainability: algorithmicExplainability,
  };
}

/**
 * Calculates Commercial Crime & Employee Fidelity StandardQuoteBreakdown.
 */
export function calculateCrimeQuote(input: CrimeFidelityInput): StandardQuoteBreakdown {
  const res = calculateCommercialCrimePremium(input);
  const netPremium = res.net_crime_premium;
  const gstAmount = Math.round(netPremium * (STATUTORY_GST_RATE / 100));
  const totalPremium = netPremium + gstAmount;

  const algorithmicExplainability: AlgorithmicExplainabilityStep[] = [
    {
      step: 'Step 1: Per-Head & Limit Tariff Pricing',
      description: `${input.employees_with_funds_access} sensitive employees @ ₹${CRIME_PER_HEAD_RATE}/head (₹${res.per_head_premium.toLocaleString('en-IN')}) + Limit ₹${input.limit_of_liability.toLocaleString('en-IN')} @ 0.50% (₹${res.limit_premium.toLocaleString('en-IN')})`,
      value: `Subtotal = ₹${(res.per_head_premium + res.limit_premium).toLocaleString('en-IN')}`,
    },
    {
      step: 'Step 2: Internal Financial Controls Verification',
      description: input.has_dual_authorization_above_50k
        ? 'Dual authorization for transactions > ₹50,000 verified: -15% risk mitigation discount applied'
        : 'Single signatory financial authority: +25% control vulnerability loading applied',
      value: `Adjustment = ${res.internal_controls_discount_or_loading >= 0 ? '+' : ''}₹${res.internal_controls_discount_or_loading.toLocaleString('en-IN')}`,
    },
    {
      step: 'Step 3: Statutory GST & Total Payable',
      description: `Net Crime Premium ₹${netPremium.toLocaleString('en-IN')} + ${STATUTORY_GST_RATE}% GST (₹${gstAmount.toLocaleString('en-IN')})`,
      value: `Total Premium Payable = ₹${totalPremium.toLocaleString('en-IN')}`,
    },
  ];

  return {
    lob_category: 'liability',
    insurance_line: 'crime',
    sum_insured: input.limit_of_liability,
    net_premium: netPremium,
    gst_rate_percent: STATUTORY_GST_RATE,
    gst_amount: gstAmount,
    total_premium: totalPremium,
    statutory_clauses: STATUTORY_LIABILITY_CLAUSES,
    line_specific_breakdown: {
      sub_line: 'crime',
      employees_with_funds_access: input.employees_with_funds_access,
      limit_of_liability: input.limit_of_liability,
      has_dual_authorization_above_50k: input.has_dual_authorization_above_50k,
      per_head_premium: res.per_head_premium,
      limit_premium: res.limit_premium,
      internal_controls_discount_or_loading: res.internal_controls_discount_or_loading,
      net_premium: netPremium,
    },
    algorithmic_explainability: algorithmicExplainability,
  };
}

/**
 * Unified Corporate Liability & Executive Protection Multi-Line Package Input
 */
export interface CorporateLiabilityPackageInput {
  corporate_name: string;
  annual_turnover: number;

  opt_cgl?: boolean;
  cgl?: CglInput;

  opt_pi?: boolean;
  pi?: PiInput;

  opt_do?: boolean;
  do?: DoInput;

  opt_cyber?: boolean;
  cyber?: {
    limit_of_indemnity: number;
    base_premium: number;
    answers: CyberPostureAnswers;
  };

  opt_crime?: boolean;
  crime?: CrimeFidelityInput;
}

/**
 * Calculates Corporate Liability Package StandardQuoteBreakdown aggregating all active lines.
 */
export function calculateCorporateLiabilityQuote(input: CorporateLiabilityPackageInput): StandardQuoteBreakdown {
  if (!input.corporate_name) {
    throw new Error('Corporate name is required');
  }
  if (input.annual_turnover <= 0) {
    throw new Error('Annual turnover must be positive');
  }

  let cglRes: ReturnType<typeof calculateCglPremium> | null = null;
  let piRes: ReturnType<typeof calculateProfessionalIndemnity> | null = null;
  let doRes: ReturnType<typeof calculateDirectorsOfficersPremium> | null = null;
  let cyberRes: ReturnType<typeof evaluateCyberPosture> | null = null;
  let crimeRes: ReturnType<typeof calculateCommercialCrimePremium> | null = null;

  let totalLimit = 0;
  let totalNet = 0;
  const activeLines: string[] = [];

  if (input.opt_cgl && input.cgl) {
    cglRes = calculateCglPremium(input.cgl);
    totalNet += cglRes.net_cgl_premium;
    totalLimit += input.cgl.aoy_limit;
    activeLines.push('CGL');
  }

  if (input.opt_pi && input.pi) {
    piRes = calculateProfessionalIndemnity(input.pi);
    totalNet += piRes.net_pi_premium;
    totalLimit += input.pi.limit_of_indemnity;
    activeLines.push('PI');
  }

  if (input.opt_do && input.do) {
    doRes = calculateDirectorsOfficersPremium(input.do);
    totalNet += doRes.net_do_premium;
    totalLimit += input.do.limit_of_indemnity;
    activeLines.push('D&O');
  }

  if (input.opt_cyber && input.cyber) {
    cyberRes = evaluateCyberPosture(input.cyber.answers, input.cyber.base_premium);
    totalNet += cyberRes.final_cyber_premium;
    totalLimit += input.cyber.limit_of_indemnity;
    activeLines.push('Cyber');
  }

  if (input.opt_crime && input.crime) {
    crimeRes = calculateCommercialCrimePremium(input.crime);
    totalNet += crimeRes.net_crime_premium;
    totalLimit += input.crime.limit_of_liability;
    activeLines.push('Crime');
  }

  if (activeLines.length === 0) {
    throw new Error('Select at least one liability line');
  }

  const gstAmount = Math.round(totalNet * (STATUTORY_GST_RATE / 100));
  const totalPremium = totalNet + gstAmount;

  const algorithmicExplainability: AlgorithmicExplainabilityStep[] = [
    {
      step: 'Step 1: Multi-Line Package Assembly',
      description: `Consolidated coverages: ${activeLines.join(', ')} across ₹${input.annual_turnover.toLocaleString('en-IN')} Corporate Turnover`,
      value: `${activeLines.length} Lines Active (Total Limit: ₹${totalLimit.toLocaleString('en-IN')})`,
    },
    {
      step: 'Step 2: Sub-Line Net Premium Aggregation',
      description: `CGL: ₹${(cglRes?.net_cgl_premium ?? 0).toLocaleString('en-IN')} | PI: ₹${(piRes?.net_pi_premium ?? 0).toLocaleString('en-IN')} | D&O: ₹${(doRes?.net_do_premium ?? 0).toLocaleString('en-IN')} | Cyber: ₹${(cyberRes?.final_cyber_premium ?? 0).toLocaleString('en-IN')} | Crime: ₹${(crimeRes?.net_crime_premium ?? 0).toLocaleString('en-IN')}`,
      value: `Combined Net Premium = ₹${totalNet.toLocaleString('en-IN')}`,
    },
    {
      step: 'Step 3: Statutory GST & Total Payable',
      description: `Total Net Premium ₹${totalNet.toLocaleString('en-IN')} + ${STATUTORY_GST_RATE}% GST (₹${gstAmount.toLocaleString('en-IN')})`,
      value: `Total Premium Payable = ₹${totalPremium.toLocaleString('en-IN')}`,
    },
  ];

  return {
    lob_category: 'liability',
    insurance_line: 'liability_package',
    sum_insured: totalLimit,
    net_premium: totalNet,
    gst_rate_percent: STATUTORY_GST_RATE,
    gst_amount: gstAmount,
    total_premium: totalPremium,
    statutory_clauses: STATUTORY_LIABILITY_CLAUSES,
    line_specific_breakdown: {
      sub_line: 'liability_package',
      corporate_name: input.corporate_name,
      annual_turnover: input.annual_turnover,
      active_lines: activeLines,
      cgl_breakdown: cglRes ? { ...cglRes, aoy_limit: input.cgl?.aoy_limit, aoa_limit: input.cgl?.aoa_limit } : undefined,
      pi_breakdown: piRes ? { ...piRes, profession: input.pi?.profession, limit_of_indemnity: input.pi?.limit_of_indemnity } : undefined,
      do_breakdown: doRes ? { ...doRes, entity_listing_status: input.do?.entity_listing_status, limit_of_indemnity: input.do?.limit_of_indemnity } : undefined,
      cyber_breakdown: cyberRes ? { ...cyberRes, limit_of_indemnity: input.cyber?.limit_of_indemnity } : undefined,
      crime_breakdown: crimeRes ? { ...crimeRes, limit_of_liability: input.crime?.limit_of_liability } : undefined,
      net_premium: totalNet,
    },
    algorithmic_explainability: algorithmicExplainability,
  };
}
