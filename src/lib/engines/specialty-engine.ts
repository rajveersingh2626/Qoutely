/**
 * Pure Deterministic Financial & Specialty Lines Underwriting Engine
 *
 * Implements:
 * 1. Surety Insurance Bond Engine (Feature 32):
 *    - Bond types: bid_bond (1.00%), performance_bond (1.50%), advance_payment (1.75%), retention_money (1.25%).
 *    - Contractor financial grades: AAA (0.80x, 0% margin), AA (1.00x, 5% margin), A (1.25x, 10% margin), BBB (1.65x, 15% margin), BB (2.20x, 25% margin).
 *    - Single project capacity limit: max 100% of Net Worth. Breached if bond_value > contractor_net_worth (+25% collateral margin surcharge).
 *    - Input validation: bond_value > 0 ('Bond value must be positive'), tenure_months > 0 ('Tenure must be at least 1 month').
 *    - Pro-rata tenure factor = tenure_months / 12.
 * 2. Trade Credit Insurance (TCI) Engine (Feature 33):
 *    - Credit terms: 30d (0.25%), 60d (0.35%), 90d (0.45%), 120d (0.60%) on insurable turnover.
 *    - Debtor concentration loading: +20% if top_10_buyers_turnover_share_percent > 60; 0% otherwise.
 *    - Statutory IRDAI indemnity clamp: Math.min(90, Math.max(50, requested_indemnity_percent)).
 *    - Input validation: insurable_turnover > 0 ('Insurable turnover must be positive').
 * 3. Commercial Burglary & Housebreaking Engine:
 *    - First loss percentages: 25%, 50%, 75%, 100% on total property sum insured.
 *    - Base tariff rate: 2.50‰ (0.25% of first loss sum insured).
 *    - Physical security discounts: CCTV (-5%), 24/7 security guards (-10%), burglar alarm (-5%), capped at 20% max.
 * 4. Financial & Specialty Studio UI Model (Feature 34):
 *    - Validates contractor/applicant name, Indian statutory PAN format (/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/), and positive principal amount.
 * 5. Dual-Tier Architecture:
 *    - Tier 1: Canonical functions matching canonical_engines.ts exactly.
 *    - Tier 2: Standard contract quote functions returning StandardQuoteBreakdown with 18% GST and step-by-step explainability.
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

export const SURETY_BASE_RATES: Record<SuretyBondType, number> = {
  bid_bond: 1.00,
  performance_bond: 1.50,
  advance_payment: 1.75,
  retention_money: 1.25,
};

export const CONTRACTOR_GRADE_MULTIPLIERS: Record<
  ContractorFinancialGrade,
  { mult: number; margin: number }
> = {
  AAA: { mult: 0.80, margin: 0 },
  AA: { mult: 1.00, margin: 5 },
  A: { mult: 1.25, margin: 10 },
  BBB: { mult: 1.65, margin: 15 },
  BB: { mult: 2.20, margin: 25 },
};

export const TRADE_CREDIT_RATES: Record<30 | 60 | 90 | 120, number> = {
  30: 0.25,
  60: 0.35,
  90: 0.45,
  120: 0.60,
};

export const BURGLARY_BASE_RATE_PER_MILLE = 2.50; // 2.50‰ of first loss sum insured

export const BURGLARY_SECURITY_DISCOUNTS = {
  cctv: 5,
  guards: 10,
  alarm: 5,
  max_discount: 20,
} as const;

export const STATUTORY_SPECIALTY_CLAUSES = [
  'General Financial Rules (GFR) 2017 Rule 170: Bid Security / Earnest Money Deposit (EMD) Surety Bond accepted in lieu of Bank Guarantee for Central Government and CPSE procurements.',
  'General Financial Rules (GFR) 2017 Rule 171: Performance Security Surety Bond guarantee accepted up to 3% to 10% of contract value, unconditional and irrevocable.',
  'IRDAI (Trade Credit Insurance) Guidelines, 2021: Statutory maximum indemnity capped at 90% of gross invoice turnover (Ref: IRDAI/NL/GDL/CRE/207/09/2021).',
  'Whole Turnover & Non-Payment Default Warranty: Insured must declare whole eligible turnover with mandatory notification of buyer insolvency or default exceeding 60 days.',
  'Burglary First Loss Warranty: Cover restricted to agreed first loss percentage; Condition of Average applies if full replacement value at loss date exceeds declared sum insured.',
  'Books of Accounts & Stock Register Warranty: Daily computerized inventory records and stock registers must be maintained in fireproof safe / remote cloud server.',
  'Watch and Ward Security Warranty: Continuous 24/7 security guard presence, active burglar alarm and tamper-evident CCTV recording retained for minimum 30 days.',
  'Section 64VB of Insurance Act, 1938: Statutory premium payment warranty in advance of risk attachment.',
];

// ============================================================================
// 2. FEATURE 32: SURETY INSURANCE BOND ENGINE (CANONICAL TIER 1)
// ============================================================================

export type SuretyBondType = 'bid_bond' | 'performance_bond' | 'advance_payment' | 'retention_money';
export type ContractorFinancialGrade = 'AAA' | 'AA' | 'A' | 'BBB' | 'BB';

export interface SuretyBondInput {
  bond_type: SuretyBondType;
  bond_value: number;
  tenure_months: number;
  contractor_grade: ContractorFinancialGrade;
  contractor_net_worth: number;
}

export interface SuretyBondCalculationResult {
  annual_rate_percent: number;
  required_collateral_margin_percent: number;
  tenure_pro_rata_factor: number;
  total_bond_premium: number;
  credit_limit_breach: boolean;
}

/**
 * Calculates deterministic Surety Bond premium and required collateral margin.
 * Strictly adheres to canonical test oracle in tests/e2e/canonical_engines.ts (lines 1773-1824).
 */
export function calculateSuretyBondPremium(input: SuretyBondInput): SuretyBondCalculationResult {
  if (input.bond_value <= 0) throw new Error('Bond value must be positive');
  if (input.tenure_months <= 0) throw new Error('Tenure must be at least 1 month');

  // Single project capacity limit: max 100% of Net Worth
  const isBreached = input.bond_value > input.contractor_net_worth;

  const baseRates = SURETY_BASE_RATES;
  const gradeMultipliers = CONTRACTOR_GRADE_MULTIPLIERS;

  const gradeInfo = gradeMultipliers[input.contractor_grade];
  const annualRate = baseRates[input.bond_type] * gradeInfo.mult;
  const tenureFactor = input.tenure_months / 12;
  const prem = (input.bond_value * annualRate * tenureFactor) / 100;

  return {
    annual_rate_percent: Math.round(annualRate * 1000) / 1000,
    required_collateral_margin_percent: isBreached ? gradeInfo.margin + 25 : gradeInfo.margin,
    tenure_pro_rata_factor: Math.round(tenureFactor * 1000) / 1000,
    total_bond_premium: Math.round(prem),
    credit_limit_breach: isBreached,
  };
}

// ============================================================================
// 3. FEATURE 33: TRADE CREDIT INSURANCE (TCI) ENGINE (CANONICAL TIER 1)
// ============================================================================

export interface TradeCreditInput {
  insurable_turnover: number;
  average_credit_days: 30 | 60 | 90 | 120;
  top_10_buyers_turnover_share_percent: number;
  requested_indemnity_percent: number; // statutory max 90%
}

export interface TradeCreditCalculationResult {
  base_rate_percent: number;
  concentration_loading_percent: number;
  clamped_indemnity_percent: number;
  net_tci_premium: number;
}

/**
 * Calculates deterministic Trade Credit Insurance premium and statutory indemnity clamping.
 * Strictly adheres to canonical test oracle in tests/e2e/canonical_engines.ts (lines 1830-1870).
 */
export function calculateTradeCreditPremium(input: TradeCreditInput): TradeCreditCalculationResult {
  if (input.insurable_turnover <= 0) throw new Error('Insurable turnover must be positive');

  // Statutory IRDAI TCI regulations cap indemnity at 90%
  const indemnity = Math.min(90, Math.max(50, input.requested_indemnity_percent));

  const creditRates = TRADE_CREDIT_RATES;
  const baseRate = creditRates[input.average_credit_days];
  let concentrationLoading = 0;
  if (input.top_10_buyers_turnover_share_percent > 60) {
    concentrationLoading = 20; // +20% loading for concentrated buyer portfolio
  }

  const effectiveRate = baseRate * (1 + concentrationLoading / 100);
  const netPrem = Math.round((input.insurable_turnover * effectiveRate) / 100);

  return {
    base_rate_percent: baseRate,
    concentration_loading_percent: concentrationLoading,
    clamped_indemnity_percent: indemnity,
    net_tci_premium: netPrem,
  };
}

// ============================================================================
// 4. COMMERCIAL BURGLARY & HOUSEBREAKING ENGINE
// ============================================================================

export interface BurglaryInput {
  property_sum_insured: number;
  first_loss_percentage: 25 | 50 | 75 | 100;
  has_cctv: boolean;
  has_247_security_guards: boolean;
  has_burglar_alarm: boolean;
  occupancy_type?: 'retail_shop' | 'warehouse' | 'industrial_factory' | 'office_premises';
}

export interface BurglaryCalculationResult {
  property_sum_insured: number;
  first_loss_percentage: number;
  first_loss_sum_insured: number;
  base_rate_per_mille: number; // 2.50‰
  gross_burglary_premium: number;
  cctv_discount_percent: number;
  guard_discount_percent: number;
  alarm_discount_percent: number;
  total_security_discount_percent: number;
  net_burglary_premium: number;
}

/**
 * Calculates deterministic Commercial Burglary first loss premium with physical security discounts.
 */
export function calculateBurglaryPremium(input: BurglaryInput): BurglaryCalculationResult {
  if (input.property_sum_insured <= 0) throw new Error('Property sum insured must be positive');

  const firstLossSumInsured = (input.property_sum_insured * input.first_loss_percentage) / 100;
  const baseRatePerMille = BURGLARY_BASE_RATE_PER_MILLE;
  const grossPrem = (firstLossSumInsured * baseRatePerMille) / 1000;

  const cctvDisc = input.has_cctv ? BURGLARY_SECURITY_DISCOUNTS.cctv : 0;
  const guardDisc = input.has_247_security_guards ? BURGLARY_SECURITY_DISCOUNTS.guards : 0;
  const alarmDisc = input.has_burglar_alarm ? BURGLARY_SECURITY_DISCOUNTS.alarm : 0;
  const totalDisc = Math.min(
    BURGLARY_SECURITY_DISCOUNTS.max_discount,
    cctvDisc + guardDisc + alarmDisc
  );

  const netPrem = Math.round(grossPrem * (1 - totalDisc / 100));

  return {
    property_sum_insured: input.property_sum_insured,
    first_loss_percentage: input.first_loss_percentage,
    first_loss_sum_insured: firstLossSumInsured,
    base_rate_per_mille: baseRatePerMille,
    gross_burglary_premium: Math.round(grossPrem),
    cctv_discount_percent: cctvDisc,
    guard_discount_percent: guardDisc,
    alarm_discount_percent: alarmDisc,
    total_security_discount_percent: totalDisc,
    net_burglary_premium: netPrem,
  };
}

// ============================================================================
// 5. FEATURE 34: FINANCIAL & SPECIALTY STUDIO UI MODEL (CANONICAL TIER 1)
// ============================================================================

export interface SpecialtyStudioInput {
  contractor_or_applicant: string;
  pan_number: string;
  selected_product: 'surety_bond' | 'trade_credit' | 'burglary' | 'specialty_package';
  principal_amount: number;
}

export interface SpecialtyStudioValidationResult {
  is_valid: boolean;
  contract_ready: boolean;
  error?: string;
}

/**
 * Validates Specialty Studio inputs against statutory Indian PAN regex and non-empty bounds.
 * Strictly adheres to canonical test oracle in tests/e2e/canonical_engines.ts (lines 1876-1893).
 */
export function validateSpecialtyStudioInput(input: SpecialtyStudioInput): SpecialtyStudioValidationResult {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (!input.contractor_or_applicant) {
    return { is_valid: false, contract_ready: false, error: 'Applicant name is required' };
  }
  if (!panRegex.test(input.pan_number.toUpperCase())) {
    return { is_valid: false, contract_ready: false, error: 'Invalid Indian PAN format' };
  }
  if (input.principal_amount <= 0) {
    return { is_valid: false, contract_ready: false, error: 'Principal amount must be positive' };
  }
  return { is_valid: true, contract_ready: true };
}

// ============================================================================
// 6. TIER 2: STANDARD CONTRACT QUOTE BREAKDOWN CONTRACTS
// ============================================================================

/**
 * Calculates Surety Bond StandardQuoteBreakdown.
 */
export function calculateSuretyQuote(input: SuretyBondInput): StandardQuoteBreakdown {
  const res = calculateSuretyBondPremium(input);
  const netPremium = res.total_bond_premium;
  const gstAmount = Math.round(netPremium * (STATUTORY_GST_RATE / 100));
  const totalPremium = netPremium + gstAmount;

  const bondTypeLabels: Record<SuretyBondType, string> = {
    bid_bond: 'Bid Bond (EMD)',
    performance_bond: 'Performance Bond',
    advance_payment: 'Advance Payment Bond',
    retention_money: 'Retention Money Bond',
  };

  const algorithmicExplainability: AlgorithmicExplainabilityStep[] = [
    {
      step: 'Step 1: Base Rating & Contractor Multiplier',
      description: `${bondTypeLabels[input.bond_type]} base tariff rate ${SURETY_BASE_RATES[input.bond_type]}% p.a. adjusted by Grade ${input.contractor_grade} multiplier (${CONTRACTOR_GRADE_MULTIPLIERS[input.contractor_grade].mult}x)`,
      value: `Effective Annual Rate = ${res.annual_rate_percent}% p.a.`,
    },
    {
      step: 'Step 2: Pro-Rata Contract Tenure Factor',
      description: `Contract tenure of ${input.tenure_months} months divided by 12-month annual base`,
      value: `Tenure Factor = ${res.tenure_pro_rata_factor}`,
    },
    {
      step: 'Step 3: Single Project Net Worth Capacity & Margin',
      description: res.credit_limit_breach
        ? `CAPACITY BREACH: Bond Value (₹${input.bond_value.toLocaleString('en-IN')}) exceeds Net Worth (₹${input.contractor_net_worth.toLocaleString('en-IN')}). Base margin ${CONTRACTOR_GRADE_MULTIPLIERS[input.contractor_grade].margin}% + 25% surcharge mandated.`
        : `Capacity within limits: Bond Value is within Net Worth (₹${input.contractor_net_worth.toLocaleString('en-IN')}). Standard margin applied.`,
      value: `Required Liquid Collateral Margin = ${res.required_collateral_margin_percent}%`,
    },
    {
      step: 'Step 4: Statutory GST & Total Payable',
      description: `Net Surety Bond Premium ₹${netPremium.toLocaleString('en-IN')} + ${STATUTORY_GST_RATE}% GST (₹${gstAmount.toLocaleString('en-IN')})`,
      value: `Total Premium Payable = ₹${totalPremium.toLocaleString('en-IN')}`,
    },
  ];

  return {
    lob_category: 'specialty',
    insurance_line: 'surety_bond',
    sum_insured: input.bond_value,
    net_premium: netPremium,
    gst_rate_percent: STATUTORY_GST_RATE,
    gst_amount: gstAmount,
    total_premium: totalPremium,
    statutory_clauses: STATUTORY_SPECIALTY_CLAUSES,
    line_specific_breakdown: {
      sub_line: 'surety_bond',
      bond_type: input.bond_type,
      bond_value: input.bond_value,
      tenure_months: input.tenure_months,
      contractor_grade: input.contractor_grade,
      contractor_net_worth: input.contractor_net_worth,
      annual_rate_percent: res.annual_rate_percent,
      tenure_pro_rata_factor: res.tenure_pro_rata_factor,
      required_collateral_margin_percent: res.required_collateral_margin_percent,
      credit_limit_breach: res.credit_limit_breach,
      net_premium: netPremium,
    },
    algorithmic_explainability: algorithmicExplainability,
  };
}

/**
 * Calculates Trade Credit Insurance StandardQuoteBreakdown.
 */
export function calculateTradeCreditQuote(input: TradeCreditInput): StandardQuoteBreakdown {
  const res = calculateTradeCreditPremium(input);
  const netPremium = res.net_tci_premium;
  const gstAmount = Math.round(netPremium * (STATUTORY_GST_RATE / 100));
  const totalPremium = netPremium + gstAmount;

  const algorithmicExplainability: AlgorithmicExplainabilityStep[] = [
    {
      step: 'Step 1: Credit Terms Base Rating',
      description: `Average credit terms of ${input.average_credit_days} days rates at ${res.base_rate_percent}% on whole turnover`,
      value: `Base Rate = ${res.base_rate_percent}%`,
    },
    {
      step: 'Step 2: Debtor Concentration Loading',
      description: res.concentration_loading_percent > 0
        ? `Top 10 buyers account for ${input.top_10_buyers_turnover_share_percent}% of turnover (> 60% threshold). +${res.concentration_loading_percent}% concentration loading applied.`
        : `Top 10 buyers account for ${input.top_10_buyers_turnover_share_percent}% of turnover (within 60% threshold). No concentration loading.`,
      value: `Concentration Loading = +${res.concentration_loading_percent}%`,
    },
    {
      step: 'Step 3: Statutory Indemnity Cap & Effective Rate',
      description: `Requested indemnity ${input.requested_indemnity_percent}% clamped to statutory IRDAI 2021 guidelines [50%, 90%] band`,
      value: `Clamped Indemnity = ${res.clamped_indemnity_percent}%`,
    },
    {
      step: 'Step 4: Statutory GST & Total Payable',
      description: `Net TCI Premium ₹${netPremium.toLocaleString('en-IN')} + ${STATUTORY_GST_RATE}% GST (₹${gstAmount.toLocaleString('en-IN')})`,
      value: `Total Premium Payable = ₹${totalPremium.toLocaleString('en-IN')}`,
    },
  ];

  return {
    lob_category: 'specialty',
    insurance_line: 'trade_credit',
    sum_insured: input.insurable_turnover,
    net_premium: netPremium,
    gst_rate_percent: STATUTORY_GST_RATE,
    gst_amount: gstAmount,
    total_premium: totalPremium,
    statutory_clauses: STATUTORY_SPECIALTY_CLAUSES,
    line_specific_breakdown: {
      sub_line: 'trade_credit',
      insurable_turnover: input.insurable_turnover,
      average_credit_days: input.average_credit_days,
      top_10_buyers_turnover_share_percent: input.top_10_buyers_turnover_share_percent,
      requested_indemnity_percent: input.requested_indemnity_percent,
      clamped_indemnity_percent: res.clamped_indemnity_percent,
      base_rate_percent: res.base_rate_percent,
      concentration_loading_percent: res.concentration_loading_percent,
      net_premium: netPremium,
    },
    algorithmic_explainability: algorithmicExplainability,
  };
}

/**
 * Calculates Commercial Burglary StandardQuoteBreakdown.
 */
export function calculateBurglaryQuote(input: BurglaryInput): StandardQuoteBreakdown {
  const res = calculateBurglaryPremium(input);
  const netPremium = res.net_burglary_premium;
  const gstAmount = Math.round(netPremium * (STATUTORY_GST_RATE / 100));
  const totalPremium = netPremium + gstAmount;

  const algorithmicExplainability: AlgorithmicExplainabilityStep[] = [
    {
      step: 'Step 1: First Loss Sum Insured Scale',
      description: `${input.first_loss_percentage}% First Loss scale on total declared property value of ₹${input.property_sum_insured.toLocaleString('en-IN')}`,
      value: `First Loss Sum Insured = ₹${res.first_loss_sum_insured.toLocaleString('en-IN')}`,
    },
    {
      step: 'Step 2: Base Tariff Rating',
      description: `Standard commercial burglary tariff rate of ${res.base_rate_per_mille}‰ (0.25%) applied to first loss sum insured`,
      value: `Gross Premium = ₹${res.gross_burglary_premium.toLocaleString('en-IN')}`,
    },
    {
      step: 'Step 3: Physical Security Posture Discounts',
      description: `Security posture evaluated: CCTV (${res.cctv_discount_percent}%), 24/7 Security Guards (${res.guard_discount_percent}%), Burglar Alarm (${res.alarm_discount_percent}%). Capped at max 20%.`,
      value: `Total Security Discount = -${res.total_security_discount_percent}%`,
    },
    {
      step: 'Step 4: Statutory GST & Total Payable',
      description: `Net Burglary Premium ₹${netPremium.toLocaleString('en-IN')} + ${STATUTORY_GST_RATE}% GST (₹${gstAmount.toLocaleString('en-IN')})`,
      value: `Total Premium Payable = ₹${totalPremium.toLocaleString('en-IN')}`,
    },
  ];

  return {
    lob_category: 'specialty',
    insurance_line: 'burglary',
    sum_insured: res.first_loss_sum_insured,
    net_premium: netPremium,
    gst_rate_percent: STATUTORY_GST_RATE,
    gst_amount: gstAmount,
    total_premium: totalPremium,
    statutory_clauses: STATUTORY_SPECIALTY_CLAUSES,
    line_specific_breakdown: {
      sub_line: 'burglary',
      property_sum_insured: input.property_sum_insured,
      first_loss_percentage: input.first_loss_percentage,
      first_loss_sum_insured: res.first_loss_sum_insured,
      base_rate_per_mille: res.base_rate_per_mille,
      gross_burglary_premium: res.gross_burglary_premium,
      cctv_discount_percent: res.cctv_discount_percent,
      guard_discount_percent: res.guard_discount_percent,
      alarm_discount_percent: res.alarm_discount_percent,
      total_security_discount_percent: res.total_security_discount_percent,
      net_premium: netPremium,
    },
    algorithmic_explainability: algorithmicExplainability,
  };
}

/**
 * Calculates Multi-Line Specialty Package StandardQuoteBreakdown.
 */
export function calculateSpecialtyPackageQuote(input: {
  surety?: SuretyBondInput;
  trade_credit?: TradeCreditInput;
  burglary?: BurglaryInput;
}): StandardQuoteBreakdown {
  let totalNet = 0;
  let totalSumInsured = 0;
  const explainability: AlgorithmicExplainabilityStep[] = [];
  const lineBreakdown: Record<string, any> = {
    sub_line: 'specialty_package',
  };

  let lineCount = 0;

  if (input.surety) {
    lineCount++;
    const suretyQuote = calculateSuretyQuote(input.surety);
    totalNet += suretyQuote.net_premium;
    totalSumInsured += suretyQuote.sum_insured;
    lineBreakdown.surety = suretyQuote.line_specific_breakdown;
    explainability.push({
      step: `Section ${lineCount}: Surety Bond (${input.surety.bond_type.replace('_', ' ').toUpperCase()})`,
      description: `Principal ₹${input.surety.bond_value.toLocaleString('en-IN')} @ Grade ${input.surety.contractor_grade} for ${input.surety.tenure_months}M tenure`,
      value: `Net Surety Premium = ₹${suretyQuote.net_premium.toLocaleString('en-IN')}`,
    });
  }

  if (input.trade_credit) {
    lineCount++;
    const tciQuote = calculateTradeCreditQuote(input.trade_credit);
    totalNet += tciQuote.net_premium;
    totalSumInsured += tciQuote.sum_insured;
    lineBreakdown.trade_credit = tciQuote.line_specific_breakdown;
    explainability.push({
      step: `Section ${lineCount}: Trade Credit Receivables Insurance`,
      description: `Insurable turnover ₹${input.trade_credit.insurable_turnover.toLocaleString('en-IN')} (${input.trade_credit.average_credit_days}d credit terms, top 10 share ${input.trade_credit.top_10_buyers_turnover_share_percent}%)`,
      value: `Net TCI Premium = ₹${tciQuote.net_premium.toLocaleString('en-IN')}`,
    });
  }

  if (input.burglary) {
    lineCount++;
    const burglaryQuote = calculateBurglaryQuote(input.burglary);
    totalNet += burglaryQuote.net_premium;
    totalSumInsured += burglaryQuote.sum_insured;
    lineBreakdown.burglary = burglaryQuote.line_specific_breakdown;
    explainability.push({
      step: `Section ${lineCount}: Commercial Burglary First Loss`,
      description: `Property ₹${input.burglary.property_sum_insured.toLocaleString('en-IN')} (${input.burglary.first_loss_percentage}% First Loss)`,
      value: `Net Burglary Premium = ₹${burglaryQuote.net_premium.toLocaleString('en-IN')}`,
    });
  }

  if (lineCount === 0) {
    throw new Error('At least one specialty line must be selected for package calculation');
  }

  const gstAmount = Math.round(totalNet * (STATUTORY_GST_RATE / 100));
  const totalPremium = totalNet + gstAmount;

  explainability.push({
    step: `Section ${lineCount + 1}: Combined Package Tax & Total`,
    description: `Combined Net Specialty Premium ₹${totalNet.toLocaleString('en-IN')} + ${STATUTORY_GST_RATE}% GST (₹${gstAmount.toLocaleString('en-IN')}) across ${lineCount} sub-lines`,
    value: `Total Premium Payable = ₹${totalPremium.toLocaleString('en-IN')}`,
  });

  lineBreakdown.lines_selected_count = lineCount;
  lineBreakdown.net_premium = totalNet;
  lineBreakdown.gst_amount = gstAmount;
  lineBreakdown.total_premium = totalPremium;

  return {
    lob_category: 'specialty',
    insurance_line: 'specialty_package',
    sum_insured: totalSumInsured,
    net_premium: totalNet,
    gst_rate_percent: STATUTORY_GST_RATE,
    gst_amount: gstAmount,
    total_premium: totalPremium,
    statutory_clauses: STATUTORY_SPECIALTY_CLAUSES,
    line_specific_breakdown: lineBreakdown,
    algorithmic_explainability: explainability,
  };
}
