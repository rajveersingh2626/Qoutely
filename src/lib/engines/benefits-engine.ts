/**
 * Pure Deterministic Employee Benefits & Group Underwriting Engine
 *
 * Implements:
 * 1. Group Health Insurance (GHI):
 *    - Actuarial demographic age-band rating (0-25: ₹2,800, 26-35: ₹4,200, 36-45: ₹6,500, 46-55: ₹11,200, 56-65: ₹18,500, 66-75: ₹26,000, 76+: ₹32,000).
 *    - Non-linear Sum Insured scaling: (base_sum_insured / 300,000)^0.65.
 *    - Benefit loadings: Room Rent (1% normal/2% ICU = 0%, Single Private Room = +8%, No Capping = +15%).
 *    - Maternity cover (+10%, +5% for Day-1 9-month waiting period waiver).
 *    - Pre-existing disease (PED) Day-1 waiver (+12%).
 *    - Corporate Buffer: 3.5% of buffer amount (requires minimum 50 lives).
 * 2. Group Term Life Insurance (GTLI):
 *    - Pure mortality rating using IALM (2012-14) Ultimate benchmark rates (<=25: 0.88‰, <=35: 1.05‰, <=45: 1.80‰, <=55: 4.95‰, >55: 11.50‰).
 *    - Occupation hazard multipliers (Class 1 = 1.0x, Class 2 = 1.2x, Class 3 = 1.5x).
 *    - Free Cover Limit (FCL) threshold detection for medical underwriting review.
 * 3. Group Personal Accident (GPA):
 *    - 24x7 worldwide accidental death, PTD, PPD, TTD across Hazard Classes (Class I = 0.35‰, Class II = 0.65‰, Class III = 1.50‰).
 *    - TTD rider (0.15‰ on total capital sum insured).
 *    - Medical expense extension (10% on base GPA premium).
 * 4. Statutory Workmen's / Employees Compensation (WC) under EC Act 1923 Sec 4 & Schedule IV:
 *    - Statutory wage ceiling: Math.min(monthly_wage, 15000).
 *    - Schedule IV Age Factors (<=20: 224.00, <=25: 216.91, <=30: 207.98, <=35: 197.06, <=40: 184.17, <=45: 169.44, <=50: 153.09, <=55: 135.56, >55: 117.41).
 *    - Death compensation: Math.max(120000, 0.50 * cappedWage * factor).
 *    - Permanent Total Disablement (PTD): Math.max(140000, 0.60 * cappedWage * factor).
 *    - Annual wage roll tariff rating by trade risk + 25% medical extension loading.
 * 5. Tabular Census Ingestion & Studio Ledger:
 *    - `parseEmployeeCensusRoster` validating age bounds, mapping relationships, and aggregating demographic counts and wage roll.
 *    - `computeBenefitsStudioLedger` calculating multi-line package premiums and 18% GST.
 * 6. Dual-Tier Architecture:
 *    - Verbatim canonical underwriting functions for zero-impedance test compatibility.
 *    - Standard contract functions returning `StandardQuoteBreakdown` with full algorithmic explainability and statutory clauses.
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
// 1. CONSTANTS & TARIFF BENCHMARKS
// ============================================================================

export const GHI_AGE_BAND_BASE_RATES = {
  age_0_25: 2800,
  age_26_35: 4200,
  age_36_45: 6500,
  age_46_55: 11200,
  age_56_65: 18500,
  age_66_75: 26000,
  age_76_plus: 32000,
} as const;

export const GHI_BENCHMARK_SUM_INSURED = 300000;
export const GHI_SI_SCALING_POWER = 0.65;

export const GHI_ROOM_RENT_LOADINGS = {
  standard_1_percent: 0,
  single_private_room: 8,
  no_capping: 15,
} as const;

export const GHI_MATERNITY_BASE_LOADING = 10;
export const GHI_MATERNITY_DAY_1_WAIVER_LOADING = 5;
export const GHI_PED_DAY_1_WAIVER_LOADING = 12;
export const GHI_CORPORATE_BUFFER_MIN_GROUP_SIZE = 50;
export const GHI_CORPORATE_BUFFER_RATE = 0.035; // 3.5%

export const GTLI_MORTALITY_RATES_PER_MILLE = {
  age_up_to_25: 0.88,
  age_26_to_35: 1.05,
  age_36_to_45: 1.80,
  age_46_to_55: 4.95,
  age_above_55: 11.50,
} as const;

export const GTLI_HAZARD_MULTIPLIERS: Record<1 | 2 | 3, number> = {
  1: 1.0, // Class 1: Office / IT / Professional
  2: 1.2, // Class 2: Field / Light Manufacturing / Sales
  3: 1.5, // Class 3: Heavy Industrial / Hazardous / Construction
};

export const GTLI_DEFAULT_FREE_COVER_LIMIT = 5000000; // ₹50 Lakhs

export const GPA_HAZARD_RATES_PER_MILLE: Record<1 | 2 | 3, number> = {
  1: 0.35, // Class 1: IT / Office
  2: 0.65, // Class 2: Field / Light Mfg
  3: 1.50, // Class 3: Heavy / Hazardous
};

export const GPA_TTD_RIDER_RATE_PER_MILLE = 0.15; // 0.15‰ on total capital SI
export const GPA_MEDICAL_EXTENSION_PERCENT = 0.10; // 10% on base GPA premium

export const WC_STATUTORY_WAGE_CAP = 15000;       // ₹15,000 monthly wage ceiling
export const WC_STATUTORY_MIN_DEATH = 120000;     // Statutory floor ₹1,20,000
export const WC_STATUTORY_MIN_PTD = 140000;       // Statutory floor ₹1,40,000
export const WC_DEATH_FACTOR_MULTIPLIER = 0.50;   // 50%
export const WC_PTD_FACTOR_MULTIPLIER = 0.60;     // 60%
export const WC_MEDICAL_EXTENSION_LOADING = 1.25; // +25% loading (1.25x)

export const WC_SCHEDULE_IV_FACTORS: Array<{ maxAge: number; factor: number }> = [
  { maxAge: 20, factor: 224.00 },
  { maxAge: 25, factor: 216.91 },
  { maxAge: 30, factor: 207.98 },
  { maxAge: 35, factor: 197.06 },
  { maxAge: 40, factor: 184.17 },
  { maxAge: 45, factor: 169.44 },
  { maxAge: 50, factor: 153.09 },
  { maxAge: 55, factor: 135.56 },
  { maxAge: Infinity, factor: 117.41 },
];

export const STATUTORY_GST_RATE = 18;

// ============================================================================
// 2. CANONICAL TYPES & UNDERWRITING FUNCTIONS (TIER 1)
// ============================================================================

// ----------------------------------------------------------------------------
// Feature 13: GHI Actuarial Demographic Age-Band Matrix
// ----------------------------------------------------------------------------

export interface GhiAgeBandCount {
  age_0_25: number;
  age_26_35: number;
  age_36_45: number;
  age_46_55: number;
  age_56_65: number;
  age_66_75: number;
  age_76_plus: number;
}

export interface GhiDemographicResult {
  total_lives: number;
  pure_risk_premium: number;
  si_scaling_factor: number;
  per_life_average: number;
}

export function calculateGhiDemographicPremium(
  bands: GhiAgeBandCount,
  base_sum_insured: number = 300000
): GhiDemographicResult {
  const baseRates = GHI_AGE_BAND_BASE_RATES;

  const totalLives =
    bands.age_0_25 +
    bands.age_26_35 +
    bands.age_36_45 +
    bands.age_46_55 +
    bands.age_56_65 +
    bands.age_66_75 +
    bands.age_76_plus;

  if (totalLives === 0) {
    throw new Error('Census must have at least one life');
  }

  const rawPurePremium =
    bands.age_0_25 * baseRates.age_0_25 +
    bands.age_26_35 * baseRates.age_26_35 +
    bands.age_36_45 * baseRates.age_36_45 +
    bands.age_46_55 * baseRates.age_46_55 +
    bands.age_56_65 * baseRates.age_56_65 +
    bands.age_66_75 * baseRates.age_66_75 +
    bands.age_76_plus * baseRates.age_76_plus;

  // Non-linear SI scaling: (SI / 300,000)^0.65
  const siScaling = Math.pow(base_sum_insured / GHI_BENCHMARK_SUM_INSURED, GHI_SI_SCALING_POWER);
  const adjustedPurePremium = Math.round(rawPurePremium * siScaling);

  return {
    total_lives: totalLives,
    pure_risk_premium: adjustedPurePremium,
    si_scaling_factor: Math.round(siScaling * 1000) / 1000,
    per_life_average: Math.round(adjustedPurePremium / totalLives),
  };
}

// ----------------------------------------------------------------------------
// Feature 14: GHI Benefit Customizer & Loadings
// ----------------------------------------------------------------------------

export type RoomRentOption = 'standard_1_percent' | 'single_private_room' | 'no_capping';

export interface GhiBenefitOptions {
  room_rent: RoomRentOption;
  maternity_opted: boolean;
  maternity_day_1_waiver: boolean;
  ped_waiver_day_1: boolean;
  corporate_buffer_amount: number;
  group_size: number;
}

export interface GhiBenefitLoadingsResult {
  loading_percent: number;
  loaded_premium: number;
  corporate_buffer_premium: number;
  total_ghi_premium: number;
}

export function calculateGhiBenefitLoadings(
  pure_premium: number,
  options: GhiBenefitOptions
): GhiBenefitLoadingsResult {
  let loadingPct = 0;

  if (options.room_rent === 'single_private_room') {
    loadingPct += GHI_ROOM_RENT_LOADINGS.single_private_room;
  } else if (options.room_rent === 'no_capping') {
    loadingPct += GHI_ROOM_RENT_LOADINGS.no_capping;
  }

  if (options.maternity_opted) {
    loadingPct += GHI_MATERNITY_BASE_LOADING;
    if (options.maternity_day_1_waiver) {
      loadingPct += GHI_MATERNITY_DAY_1_WAIVER_LOADING;
    }
  }

  if (options.ped_waiver_day_1) {
    loadingPct += GHI_PED_DAY_1_WAIVER_LOADING;
  }

  const loadedPremium = Math.round(pure_premium * (1 + loadingPct / 100));

  let bufferPremium = 0;
  if (options.corporate_buffer_amount > 0) {
    if (options.group_size < GHI_CORPORATE_BUFFER_MIN_GROUP_SIZE) {
      throw new Error('Corporate buffer requires minimum group size of 50 lives');
    }
    bufferPremium = Math.round(options.corporate_buffer_amount * GHI_CORPORATE_BUFFER_RATE);
  }

  return {
    loading_percent: loadingPct,
    loaded_premium: loadedPremium,
    corporate_buffer_premium: bufferPremium,
    total_ghi_premium: loadedPremium + bufferPremium,
  };
}

// ----------------------------------------------------------------------------
// Feature 15: Group Term Life (GTLI) Mortality Engine
// ----------------------------------------------------------------------------

export interface GtliMember {
  age: number;
  sum_insured: number;
  hazard_class?: 1 | 2 | 3;
}

export interface GtliResult {
  total_members: number;
  total_sum_insured: number;
  total_gtli_premium: number;
  members_requiring_medical: number;
}

export function calculateGtliPremium(
  members: GtliMember[],
  free_cover_limit: number = GTLI_DEFAULT_FREE_COVER_LIMIT
): GtliResult {
  if (members.length === 0) {
    throw new Error('No members provided for GTLI');
  }

  // IALM 2012-14 benchmark rates per mille
  const getQx = (age: number): number => {
    if (age <= 25) return GTLI_MORTALITY_RATES_PER_MILLE.age_up_to_25;
    if (age <= 35) return GTLI_MORTALITY_RATES_PER_MILLE.age_26_to_35;
    if (age <= 45) return GTLI_MORTALITY_RATES_PER_MILLE.age_36_to_45;
    if (age <= 55) return GTLI_MORTALITY_RATES_PER_MILLE.age_46_to_55;
    return GTLI_MORTALITY_RATES_PER_MILLE.age_above_55;
  };

  let totalSi = 0;
  let totalPrem = 0;
  let medicalCount = 0;

  for (const m of members) {
    totalSi += m.sum_insured;
    const qx = getQx(m.age);
    const hazardMult = m.hazard_class === 3 ? 1.5 : m.hazard_class === 2 ? 1.2 : 1.0;
    const prem = (m.sum_insured * qx * hazardMult) / 1000;
    totalPrem += prem;
    if (m.sum_insured > free_cover_limit) {
      medicalCount++;
    }
  }

  return {
    total_members: members.length,
    total_sum_insured: totalSi,
    total_gtli_premium: Math.round(totalPrem),
    members_requiring_medical: medicalCount,
  };
}

// ----------------------------------------------------------------------------
// Feature 16: Group Personal Accident (GPA) Engine
// ----------------------------------------------------------------------------

export interface GpaInput {
  sum_insured_per_life: number;
  headcount: number;
  hazard_class: 1 | 2 | 3;
  ttd_opted: boolean;
  medical_extension_opted: boolean;
}

export interface GpaResult {
  rate_per_mille: number;
  base_gpa_premium: number;
  ttd_premium: number;
  medical_premium: number;
  total_gpa_premium: number;
}

export function calculateGpaPremium(input: GpaInput): GpaResult {
  const rates = GPA_HAZARD_RATES_PER_MILLE;
  const totalSi = input.sum_insured_per_life * input.headcount;
  const baseRate = rates[input.hazard_class];
  const basePrem = Math.round((totalSi * baseRate) / 1000);

  // TTD: 0.15‰
  const ttdPrem = input.ttd_opted ? Math.round((totalSi * GPA_TTD_RIDER_RATE_PER_MILLE) / 1000) : 0;
  // Medical: 10% on base
  const medPrem = input.medical_extension_opted ? Math.round(basePrem * GPA_MEDICAL_EXTENSION_PERCENT) : 0;

  return {
    rate_per_mille: baseRate,
    base_gpa_premium: basePrem,
    ttd_premium: ttdPrem,
    medical_premium: medPrem,
    total_gpa_premium: basePrem + ttdPrem + medPrem,
  };
}

// ----------------------------------------------------------------------------
// Feature 17: Statutory Workmen's Compensation (WC) Engine (EC Act 1923)
// ----------------------------------------------------------------------------

export interface WcWorker {
  age: number;
  monthly_wage: number;
}

export interface WcInput {
  workers: WcWorker[];
  trade_hazard_rate_percent: number; // e.g. 0.45% for light mfg, 1.10% for foundry
  medical_extension_opted: boolean;
}

export interface WcResult {
  total_workers: number;
  total_annual_wageroll: number;
  statutory_death_liability: number;
  statutory_ptd_liability: number;
  net_wc_premium: number;
}

export function calculateWorkmensCompensation(input: WcInput): WcResult {
  if (input.workers.length === 0) {
    throw new Error('Worker list cannot be empty');
  }

  // Schedule IV EC Act 1923 Age Factors
  const getScheduleIvFactor = (age: number): number => {
    for (const bracket of WC_SCHEDULE_IV_FACTORS) {
      if (age <= bracket.maxAge) return bracket.factor;
    }
    return 117.41;
  };

  let totalAnnualWages = 0;
  let totalDeathLiability = 0;
  let totalPtdLiability = 0;

  for (const w of input.workers) {
    totalAnnualWages += w.monthly_wage * 12;
    // Statutory wage ceiling ₹15,000
    const cappedWage = Math.min(w.monthly_wage, WC_STATUTORY_WAGE_CAP);
    const factor = getScheduleIvFactor(w.age);

    // Death: 50% * cappedWage * factor, min ₹1,20,000
    const deathComp = Math.max(WC_STATUTORY_MIN_DEATH, WC_DEATH_FACTOR_MULTIPLIER * cappedWage * factor);
    // PTD: 60% * cappedWage * factor, min ₹1,40,000
    const ptdComp = Math.max(WC_STATUTORY_MIN_PTD, WC_PTD_FACTOR_MULTIPLIER * cappedWage * factor);

    totalDeathLiability += deathComp;
    totalPtdLiability += ptdComp;
  }

  // Tariff on total wage roll
  let baseWcPrem = (totalAnnualWages * input.trade_hazard_rate_percent) / 100;
  if (input.medical_extension_opted) {
    baseWcPrem *= WC_MEDICAL_EXTENSION_LOADING; // +25% loading
  }

  return {
    total_workers: input.workers.length,
    total_annual_wageroll: totalAnnualWages,
    statutory_death_liability: Math.round(totalDeathLiability),
    statutory_ptd_liability: Math.round(totalPtdLiability),
    net_wc_premium: Math.round(baseWcPrem),
  };
}

// ----------------------------------------------------------------------------
// Feature 18: Bulk Employee Census Spreadsheet Ingestion
// ----------------------------------------------------------------------------

export interface CensusRow {
  employee_id: string;
  name: string;
  age: number;
  gender: 'M' | 'F' | 'O';
  relationship: 'self' | 'spouse' | 'child' | 'parent';
  monthly_salary?: number;
}

export interface ParsedCensusResult {
  total_lives: number;
  employee_count: number;
  dependent_count: number;
  age_bands: GhiAgeBandCount;
  total_monthly_wage_roll: number;
  invalid_rows: Array<{ employee_id: string; reason: string }>;
}

export function parseEmployeeCensusRoster(rows: CensusRow[]): ParsedCensusResult {
  const bands: GhiAgeBandCount = {
    age_0_25: 0,
    age_26_35: 0,
    age_36_45: 0,
    age_46_55: 0,
    age_56_65: 0,
    age_66_75: 0,
    age_76_plus: 0,
  };

  const invalid: Array<{ employee_id: string; reason: string }> = [];
  let empCount = 0;
  let depCount = 0;
  let wageRoll = 0;

  for (const r of rows) {
    if (r.age < 0 || r.age > 100) {
      invalid.push({ employee_id: r.employee_id, reason: 'Invalid age' });
      continue;
    }
    if (r.relationship === 'self') {
      empCount++;
      if (r.monthly_salary) wageRoll += r.monthly_salary;
    } else {
      depCount++;
    }

    if (r.age <= 25) bands.age_0_25++;
    else if (r.age <= 35) bands.age_26_35++;
    else if (r.age <= 45) bands.age_36_45++;
    else if (r.age <= 55) bands.age_46_55++;
    else if (r.age <= 65) bands.age_56_65++;
    else if (r.age <= 75) bands.age_66_75++;
    else bands.age_76_plus++;
  }

  return {
    total_lives: empCount + depCount,
    employee_count: empCount,
    dependent_count: depCount,
    age_bands: bands,
    total_monthly_wage_roll: wageRoll,
    invalid_rows: invalid,
  };
}

// ----------------------------------------------------------------------------
// Feature 19: Employee Benefits Studio UI Model
// ----------------------------------------------------------------------------

export interface BenefitsStudioInput {
  corporate_name: string;
  census: CensusRow[];
  ghi_base_si: number;
  room_rent: RoomRentOption;
  maternity_opted: boolean;
  gtli_sum_insured?: number;
  gpa_hazard_class?: 1 | 2 | 3;
}

export interface BenefitsStudioLedger {
  ghi_premium: number;
  gtli_premium: number;
  gpa_premium: number;
  wc_premium: number;
  package_net_premium: number;
  package_gst: number;
  total_payable: number;
}

export function computeBenefitsStudioLedger(input: BenefitsStudioInput): BenefitsStudioLedger {
  const parsed = parseEmployeeCensusRoster(input.census);
  const ghiDemo = calculateGhiDemographicPremium(parsed.age_bands, input.ghi_base_si);
  const ghiLoaded = calculateGhiBenefitLoadings(ghiDemo.pure_risk_premium, {
    room_rent: input.room_rent,
    maternity_opted: input.maternity_opted,
    maternity_day_1_waiver: true,
    ped_waiver_day_1: true,
    corporate_buffer_amount: 0,
    group_size: parsed.total_lives,
  });

  const gtliMembers = input.census
    .filter((c) => c.relationship === 'self')
    .map((c) => ({
      age: c.age,
      sum_insured: input.gtli_sum_insured || 1000000,
    }));
  const gtliRes =
    gtliMembers.length > 0 ? calculateGtliPremium(gtliMembers) : { total_gtli_premium: 0 };

  const gpaRes = input.gpa_hazard_class
    ? calculateGpaPremium({
        sum_insured_per_life: 500000,
        headcount: parsed.employee_count,
        hazard_class: input.gpa_hazard_class,
        ttd_opted: true,
        medical_extension_opted: true,
      })
    : { total_gpa_premium: 0 };

  const wcWorkers = input.census
    .filter((c) => c.relationship === 'self')
    .map((c) => ({
      age: c.age,
      monthly_wage: c.monthly_salary || 25000,
    }));
  const wcRes = calculateWorkmensCompensation({
    workers: wcWorkers,
    trade_hazard_rate_percent: 0.35,
    medical_extension_opted: true,
  });

  const net =
    ghiLoaded.total_ghi_premium +
    gtliRes.total_gtli_premium +
    gpaRes.total_gpa_premium +
    wcRes.net_wc_premium;
  const gst = Math.round(net * (STATUTORY_GST_RATE / 100));

  return {
    ghi_premium: ghiLoaded.total_ghi_premium,
    gtli_premium: gtliRes.total_gtli_premium,
    gpa_premium: gpaRes.total_gpa_premium,
    wc_premium: wcRes.net_wc_premium,
    package_net_premium: net,
    package_gst: gst,
    total_payable: net + gst,
  };
}

// ============================================================================
// 3. HIGH-LEVEL STANDARD QUOTE BUILDERS (TIER 2 CONTRACT)
// ============================================================================

export const BENEFITS_STATUTORY_CLAUSES = [
  'IRDAI (Health Insurance) Regulations, 2016: Cashless claims settlement administered via IRDAI-licensed Third Party Administrator (TPA) network hospitals.',
  'Section 64VB of the Insurance Act, 1938: Advance premium remittance mandatory prior to risk inception and policy commencement.',
  'Employees Compensation Act, 1923 (Section 4 & Schedule IV): Policy indemnifies employer liability for occupational injury, disablement, or death as per statutory formula.',
  'Section 45 of Insurance Act, 1938: Life insurance policies cannot be called into question after three years on any ground whatsoever.',
  'Free Cover Limit (FCL) Warranty: Cover exceeding the agreed FCL is subject to individual Good Health Declaration (GHD) or medical underwriting approval.',
];

export interface GhiQuoteInput {
  corporate_name: string;
  age_bands: GhiAgeBandCount;
  base_sum_insured: number;
  benefit_options: GhiBenefitOptions;
  tpa_name?: string;
}

export function calculateGhiQuote(input: GhiQuoteInput): StandardQuoteBreakdown {
  const demoRes = calculateGhiDemographicPremium(input.age_bands, input.base_sum_insured);
  const loadRes = calculateGhiBenefitLoadings(demoRes.pure_risk_premium, input.benefit_options);

  const netPremium = loadRes.total_ghi_premium;
  const gstAmount = Math.round(netPremium * (STATUTORY_GST_RATE / 100));
  const totalPremium = netPremium + gstAmount;

  const totalSumInsured = demoRes.total_lives * input.base_sum_insured;

  const algorithmicExplainability: AlgorithmicExplainabilityStep[] = [
    {
      step: 'Step 1: Census Ingestion & Demographic Pure Risk Premium',
      description: `Demographic age-band rating for ${demoRes.total_lives} lives scaled by (SI / ₹3,00,000)^0.65 (Factor: ${demoRes.si_scaling_factor})`,
      value: `GHI Pure Premium = ₹${demoRes.pure_risk_premium.toLocaleString('en-IN')}`,
    },
    {
      step: 'Step 2: Benefit Customizer Loadings',
      description: `Room Rent (${input.benefit_options.room_rent}) + Maternity (${input.benefit_options.maternity_opted ? 'Opted' : 'No'}) + PED Day 1 (${input.benefit_options.ped_waiver_day_1 ? 'Opted' : 'No'}) = Total Loading ${loadRes.loading_percent}%`,
      value: `Loaded GHI Premium = ₹${loadRes.loaded_premium.toLocaleString('en-IN')}`,
    },
    {
      step: 'Step 3: Corporate Buffer Allocation',
      description:
        input.benefit_options.corporate_buffer_amount > 0
          ? `Corporate buffer of ₹${input.benefit_options.corporate_buffer_amount.toLocaleString('en-IN')} rated at 3.5% for ${input.benefit_options.group_size} lives (>=50 lives threshold met)`
          : 'No corporate buffer opted',
      value: `Buffer Premium = ₹${loadRes.corporate_buffer_premium.toLocaleString('en-IN')}`,
    },
    {
      step: 'Step 4: Statutory 18% GST & Total Payable',
      description: `Net GHI Premium ₹${netPremium.toLocaleString('en-IN')} + 18% GST (₹${gstAmount.toLocaleString('en-IN')})`,
      value: `Total GHI Premium = ₹${totalPremium.toLocaleString('en-IN')}`,
    },
  ];

  return {
    lob_category: 'benefits',
    insurance_line: 'ghi',
    sum_insured: totalSumInsured,
    base_rate_per_mille: Math.round((netPremium / totalSumInsured) * 1000 * 100) / 100,
    net_premium: netPremium,
    gst_rate_percent: STATUTORY_GST_RATE,
    gst_amount: gstAmount,
    total_premium: totalPremium,
    statutory_clauses: BENEFITS_STATUTORY_CLAUSES,
    line_specific_breakdown: {
      total_lives: demoRes.total_lives,
      per_life_average: demoRes.per_life_average,
      si_scaling_factor: demoRes.si_scaling_factor,
      pure_risk_premium: demoRes.pure_risk_premium,
      loading_percent: loadRes.loading_percent,
      loaded_premium: loadRes.loaded_premium,
      corporate_buffer_premium: loadRes.corporate_buffer_premium,
      tpa_name: input.tpa_name || 'Medi Assist TPA / Vidal Health TPA',
    },
    algorithmic_explainability: algorithmicExplainability,
  };
}

export interface GtliQuoteInput {
  corporate_name: string;
  members: GtliMember[];
  free_cover_limit?: number;
}

export function calculateGtliQuote(input: GtliQuoteInput): StandardQuoteBreakdown {
  const fcl = input.free_cover_limit || GTLI_DEFAULT_FREE_COVER_LIMIT;
  const res = calculateGtliPremium(input.members, fcl);

  const netPremium = res.total_gtli_premium;
  const gstAmount = Math.round(netPremium * (STATUTORY_GST_RATE / 100));
  const totalPremium = netPremium + gstAmount;

  const algorithmicExplainability: AlgorithmicExplainabilityStep[] = [
    {
      step: 'Step 1: IALM 2012-14 Mortality Rating',
      description: `Pure mortality rating for ${res.total_members} members with Total Sum Insured ₹${res.total_sum_insured.toLocaleString('en-IN')}`,
      value: `Net GTLI Mortality Premium = ₹${res.total_gtli_premium.toLocaleString('en-IN')}`,
    },
    {
      step: 'Step 2: Free Cover Limit (FCL) Review',
      description: `${res.members_requiring_medical} member(s) exceed the Free Cover Limit of ₹${fcl.toLocaleString('en-IN')} and are flagged for medical underwriting`,
      value: `Flagged for Medical Review: ${res.members_requiring_medical}`,
    },
    {
      step: 'Step 3: Statutory 18% GST & Total Payable',
      description: `Net GTLI Premium ₹${netPremium.toLocaleString('en-IN')} + 18% GST (₹${gstAmount.toLocaleString('en-IN')})`,
      value: `Total GTLI Premium = ₹${totalPremium.toLocaleString('en-IN')}`,
    },
  ];

  return {
    lob_category: 'benefits',
    insurance_line: 'gtli',
    sum_insured: res.total_sum_insured,
    base_rate_per_mille: Math.round((netPremium / Math.max(1, res.total_sum_insured)) * 1000 * 100) / 100,
    net_premium: netPremium,
    gst_rate_percent: STATUTORY_GST_RATE,
    gst_amount: gstAmount,
    total_premium: totalPremium,
    statutory_clauses: BENEFITS_STATUTORY_CLAUSES,
    line_specific_breakdown: {
      total_members: res.total_members,
      total_sum_insured: res.total_sum_insured,
      free_cover_limit: fcl,
      members_requiring_medical: res.members_requiring_medical,
    },
    algorithmic_explainability: algorithmicExplainability,
  };
}

export interface GpaQuoteInput extends GpaInput {
  corporate_name: string;
}

export function calculateGpaQuote(input: GpaQuoteInput): StandardQuoteBreakdown {
  const res = calculateGpaPremium(input);
  const totalSi = input.sum_insured_per_life * input.headcount;

  const netPremium = res.total_gpa_premium;
  const gstAmount = Math.round(netPremium * (STATUTORY_GST_RATE / 100));
  const totalPremium = netPremium + gstAmount;

  const algorithmicExplainability: AlgorithmicExplainabilityStep[] = [
    {
      step: 'Step 1: 24x7 Worldwide Accidental Death & PTD Base Rating',
      description: `Hazard Class ${input.hazard_class} (${res.rate_per_mille}‰) on ₹${totalSi.toLocaleString('en-IN')} total sum insured for ${input.headcount} employees`,
      value: `Base GPA Premium = ₹${res.base_gpa_premium.toLocaleString('en-IN')}`,
    },
    {
      step: 'Step 2: Temporary Total Disablement (TTD) Rider',
      description: input.ttd_opted
        ? `TTD weekly benefit rated at 0.15‰ on ₹${totalSi.toLocaleString('en-IN')}`
        : 'TTD rider not opted',
      value: `TTD Premium = ₹${res.ttd_premium.toLocaleString('en-IN')}`,
    },
    {
      step: 'Step 3: Accidental Medical Extension',
      description: input.medical_extension_opted
        ? `Medical expenses extension rated at 10% of base GPA premium`
        : 'Medical extension not opted',
      value: `Medical Extension Premium = ₹${res.medical_premium.toLocaleString('en-IN')}`,
    },
    {
      step: 'Step 4: Statutory 18% GST & Total Payable',
      description: `Net GPA Premium ₹${netPremium.toLocaleString('en-IN')} + 18% GST (₹${gstAmount.toLocaleString('en-IN')})`,
      value: `Total GPA Premium = ₹${totalPremium.toLocaleString('en-IN')}`,
    },
  ];

  return {
    lob_category: 'benefits',
    insurance_line: 'gpa',
    sum_insured: totalSi,
    base_rate_per_mille: res.rate_per_mille,
    net_premium: netPremium,
    gst_rate_percent: STATUTORY_GST_RATE,
    gst_amount: gstAmount,
    total_premium: totalPremium,
    statutory_clauses: BENEFITS_STATUTORY_CLAUSES,
    line_specific_breakdown: {
      headcount: input.headcount,
      sum_insured_per_life: input.sum_insured_per_life,
      hazard_class: input.hazard_class,
      base_gpa_premium: res.base_gpa_premium,
      ttd_premium: res.ttd_premium,
      medical_premium: res.medical_premium,
    },
    algorithmic_explainability: algorithmicExplainability,
  };
}

export interface WcQuoteInput extends WcInput {
  corporate_name: string;
  trade_description?: string;
}

export function calculateWcQuote(input: WcQuoteInput): StandardQuoteBreakdown {
  const res = calculateWorkmensCompensation(input);

  const netPremium = res.net_wc_premium;
  const gstAmount = Math.round(netPremium * (STATUTORY_GST_RATE / 100));
  const totalPremium = netPremium + gstAmount;

  const algorithmicExplainability: AlgorithmicExplainabilityStep[] = [
    {
      step: 'Step 1: Statutory EC Act 1923 Sec 4 & Schedule IV Liability Computation',
      description: `Computed for ${res.total_workers} workers with monthly wage capped at ₹15,000 and age-specific factors`,
      value: `Statutory Death: ₹${res.statutory_death_liability.toLocaleString('en-IN')} | PTD: ₹${res.statutory_ptd_liability.toLocaleString('en-IN')}`,
    },
    {
      step: 'Step 2: Annual Wage Roll Rating & Medical Extension Loading',
      description: `Tariff of ${input.trade_hazard_rate_percent}% applied on total annual wage roll of ₹${res.total_annual_wageroll.toLocaleString('en-IN')} (${input.medical_extension_opted ? '+25% medical extension' : 'standard cover'})`,
      value: `Net WC Premium = ₹${res.net_wc_premium.toLocaleString('en-IN')}`,
    },
    {
      step: 'Step 3: Statutory 18% GST & Total Payable',
      description: `Net WC Premium ₹${netPremium.toLocaleString('en-IN')} + 18% GST (₹${gstAmount.toLocaleString('en-IN')})`,
      value: `Total WC Premium = ₹${totalPremium.toLocaleString('en-IN')}`,
    },
  ];

  return {
    lob_category: 'benefits',
    insurance_line: 'wc',
    sum_insured: res.statutory_death_liability + res.statutory_ptd_liability,
    base_rate_per_mille: input.trade_hazard_rate_percent * 10,
    net_premium: netPremium,
    gst_rate_percent: STATUTORY_GST_RATE,
    gst_amount: gstAmount,
    total_premium: totalPremium,
    statutory_clauses: BENEFITS_STATUTORY_CLAUSES,
    line_specific_breakdown: {
      total_workers: res.total_workers,
      total_annual_wageroll: res.total_annual_wageroll,
      trade_hazard_rate_percent: input.trade_hazard_rate_percent,
      statutory_death_liability: res.statutory_death_liability,
      statutory_ptd_liability: res.statutory_ptd_liability,
      medical_extension_opted: input.medical_extension_opted,
      trade_description: input.trade_description || 'General Commercial / Industrial Works',
    },
    algorithmic_explainability: algorithmicExplainability,
  };
}

export interface UnifiedBenefitsQuoteInput {
  corporate_name: string;
  census: CensusRow[];
  ghi?: {
    base_sum_insured: number;
    room_rent: RoomRentOption;
    maternity_opted: boolean;
    maternity_day_1_waiver: boolean;
    ped_waiver_day_1: boolean;
    corporate_buffer_amount: number;
    tpa_name?: string;
  };
  gtli?: {
    sum_insured_per_life?: number;
    free_cover_limit?: number;
    hazard_class?: 1 | 2 | 3;
  };
  gpa?: {
    sum_insured_per_life: number;
    hazard_class: 1 | 2 | 3;
    ttd_opted: boolean;
    medical_extension_opted: boolean;
  };
  wc?: {
    trade_hazard_rate_percent: number;
    medical_extension_opted: boolean;
  };
}

export function calculateBenefitsQuote(input: UnifiedBenefitsQuoteInput): StandardQuoteBreakdown {
  const parsed = parseEmployeeCensusRoster(input.census);

  // 1. GHI
  const ghiBaseSi = input.ghi?.base_sum_insured || 300000;
  const ghiDemo = calculateGhiDemographicPremium(parsed.age_bands, ghiBaseSi);
  const ghiLoaded = calculateGhiBenefitLoadings(ghiDemo.pure_risk_premium, {
    room_rent: input.ghi?.room_rent || 'standard_1_percent',
    maternity_opted: input.ghi?.maternity_opted ?? true,
    maternity_day_1_waiver: input.ghi?.maternity_day_1_waiver ?? true,
    ped_waiver_day_1: input.ghi?.ped_waiver_day_1 ?? true,
    corporate_buffer_amount: input.ghi?.corporate_buffer_amount || 0,
    group_size: parsed.total_lives,
  });

  // 2. GTLI
  const gtliMembers = input.census
    .filter((c) => c.relationship === 'self')
    .map((c) => ({
      age: c.age,
      sum_insured: input.gtli?.sum_insured_per_life || 1000000,
      hazard_class: input.gtli?.hazard_class || 1,
    }));
  const fcl = input.gtli?.free_cover_limit || GTLI_DEFAULT_FREE_COVER_LIMIT;
  const gtliRes =
    gtliMembers.length > 0
      ? calculateGtliPremium(gtliMembers, fcl)
      : { total_members: 0, total_sum_insured: 0, total_gtli_premium: 0, members_requiring_medical: 0 };

  // 3. GPA
  const gpaRes = input.gpa
    ? calculateGpaPremium({
        sum_insured_per_life: input.gpa.sum_insured_per_life,
        headcount: parsed.employee_count,
        hazard_class: input.gpa.hazard_class,
        ttd_opted: input.gpa.ttd_opted,
        medical_extension_opted: input.gpa.medical_extension_opted,
      })
    : { rate_per_mille: 0, base_gpa_premium: 0, ttd_premium: 0, medical_premium: 0, total_gpa_premium: 0 };

  // 4. WC
  const wcWorkers = input.census
    .filter((c) => c.relationship === 'self')
    .map((c) => ({
      age: c.age,
      monthly_wage: c.monthly_salary || 25000,
    }));
  const wcRes =
    wcWorkers.length > 0 && input.wc
      ? calculateWorkmensCompensation({
          workers: wcWorkers,
          trade_hazard_rate_percent: input.wc.trade_hazard_rate_percent,
          medical_extension_opted: input.wc.medical_extension_opted,
        })
      : { total_workers: 0, total_annual_wageroll: 0, statutory_death_liability: 0, statutory_ptd_liability: 0, net_wc_premium: 0 };

  const netPremium =
    ghiLoaded.total_ghi_premium +
    gtliRes.total_gtli_premium +
    gpaRes.total_gpa_premium +
    wcRes.net_wc_premium;
  const gstAmount = Math.round(netPremium * (STATUTORY_GST_RATE / 100));
  const totalPremium = netPremium + gstAmount;

  const totalSumInsured =
    parsed.total_lives * ghiBaseSi +
    gtliRes.total_sum_insured +
    (input.gpa ? input.gpa.sum_insured_per_life * parsed.employee_count : 0) +
    wcRes.statutory_death_liability +
    wcRes.statutory_ptd_liability;

  const algorithmicExplainability: AlgorithmicExplainabilityStep[] = [
    {
      step: 'Step 1: Census Ingestion & Demographic Pure Risk Premium',
      description: `Demographic age-band rating for ${parsed.total_lives} lives across 7 age brackets scaled by (SI / ₹3,00,000)^0.65 (Factor: ${ghiDemo.si_scaling_factor})`,
      value: `GHI Pure Premium = ₹${ghiDemo.pure_risk_premium.toLocaleString('en-IN')}`,
    },
    {
      step: 'Step 2: Benefit Customizer Loadings & Corporate Buffer',
      description: `Room Rent (${input.ghi?.room_rent || 'standard_1_percent'}) + Maternity (${input.ghi?.maternity_opted ? 'Opted' : 'No'}) + PED Waiver (${input.ghi?.ped_waiver_day_1 ? 'Opted' : 'No'}) = Loading ${ghiLoaded.loading_percent}% + Buffer ₹${ghiLoaded.corporate_buffer_premium.toLocaleString('en-IN')}`,
      value: `Total GHI Premium = ₹${ghiLoaded.total_ghi_premium.toLocaleString('en-IN')}`,
    },
    {
      step: 'Step 3: Group Term Life (GTLI) Mortality & FCL Review',
      description: `IALM 2012-14 benchmark mortality rating for ${gtliRes.total_members} members with ${gtliRes.members_requiring_medical} exceeding FCL ₹${fcl.toLocaleString('en-IN')}`,
      value: `GTLI Premium = ₹${gtliRes.total_gtli_premium.toLocaleString('en-IN')}`,
    },
    {
      step: 'Step 4: Group Personal Accident (GPA) 24x7 Worldwide Cover',
      description: input.gpa
        ? `Hazard Class ${input.gpa.hazard_class} (${gpaRes.rate_per_mille}‰) on ₹${(input.gpa.sum_insured_per_life * parsed.employee_count).toLocaleString('en-IN')} + TTD (${gpaRes.ttd_premium}) + Medical (${gpaRes.medical_premium})`
        : 'GPA coverage omitted',
      value: `GPA Premium = ₹${gpaRes.total_gpa_premium.toLocaleString('en-IN')}`,
    },
    {
      step: 'Step 5: Statutory Workmen\'s Compensation (EC Act 1923)',
      description: input.wc
        ? `EC Act 1923 Schedule IV liability rated at ${input.wc.trade_hazard_rate_percent}% on annual wage roll of ₹${wcRes.total_annual_wageroll.toLocaleString('en-IN')} with medical extension (${input.wc.medical_extension_opted ? 'Yes (+25%)' : 'No'})`
        : 'WC coverage omitted',
      value: `WC Premium = ₹${wcRes.net_wc_premium.toLocaleString('en-IN')}`,
    },
    {
      step: 'Step 6: Package Net Premium & Statutory 18% GST',
      description: `Net Package (GHI ₹${ghiLoaded.total_ghi_premium.toLocaleString('en-IN')} + GTLI ₹${gtliRes.total_gtli_premium.toLocaleString('en-IN')} + GPA ₹${gpaRes.total_gpa_premium.toLocaleString('en-IN')} + WC ₹${wcRes.net_wc_premium.toLocaleString('en-IN')}) = ₹${netPremium.toLocaleString('en-IN')} + 18% GST (₹${gstAmount.toLocaleString('en-IN')})`,
      value: `Total Package Payable = ₹${totalPremium.toLocaleString('en-IN')}`,
    },
  ];

  return {
    lob_category: 'benefits',
    insurance_line: 'ghi',
    sum_insured: totalSumInsured,
    base_rate_per_mille: Math.round((netPremium / Math.max(1, totalSumInsured)) * 1000 * 100) / 100,
    net_premium: netPremium,
    gst_rate_percent: STATUTORY_GST_RATE,
    gst_amount: gstAmount,
    total_premium: totalPremium,
    statutory_clauses: BENEFITS_STATUTORY_CLAUSES,
    line_specific_breakdown: {
      corporate_name: input.corporate_name,
      total_lives: parsed.total_lives,
      employee_count: parsed.employee_count,
      dependent_count: parsed.dependent_count,
      total_monthly_wage_roll: parsed.total_monthly_wage_roll,
      ghi_total_premium: ghiLoaded.total_ghi_premium,
      gtli_total_premium: gtliRes.total_gtli_premium,
      gpa_total_premium: gpaRes.total_gpa_premium,
      wc_net_premium: wcRes.net_wc_premium,
      package_net_premium: netPremium,
      gst_amount: gstAmount,
      total_payable: totalPremium,
      cost_per_employee: Math.round(totalPremium / Math.max(1, parsed.employee_count)),
      cost_per_life: Math.round(totalPremium / Math.max(1, parsed.total_lives)),
    },
    algorithmic_explainability: algorithmicExplainability,
  };
}
