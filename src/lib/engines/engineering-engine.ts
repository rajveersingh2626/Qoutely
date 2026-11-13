/**
 * Pure Deterministic Engineering & Project Underwriting Engine
 *
 * Implements:
 * 1. Contractors All Risk (CAR) & Erection All Risk (EAR):
 *    - Civil works (1.20‰) vs plant erection (1.80‰) rating.
 *    - Pro-rata duration factor: Math.max(1.0, contract_period_months / 12).
 *    - Base works: Math.round(baseCivil + basePlant).
 *    - Testing period (EAR): 1 month included free; extra months loaded at 0.75‰/mo on plant SI.
 *    - Defect Liability Period (DLP) Maintenance: >= 24 mos = 25%, >= 12 mos = 15% of base works.
 *    - Act of God (AOG) EQ Perils: Zone 1 (0.50‰), Zone 2 (0.35‰), Zone 3 (0.25‰), Zone 4 (0.10‰).
 *    - Zero/negative sum insured throws: Error('Project sum insured must be greater than zero').
 * 2. Machinery Breakdown (MB):
 *    - Operational machinery rating across Groups I–IV on Current Replacement Value (CRV):
 *      Group 1 (0.90%), Group 2 (1.50%), Group 3 (2.50%), Group 4 (4.00%).
 *    - Non-positive CRV throws: Error('CRV must be greater than zero').
 * 3. Electronic Equipment Insurance (EEI):
 *    - Section 1 (Hardware): 1.25% base (+2.50% portable laptop loading = 3.75%).
 *    - Section 2 (External Data Media): 3.00% on media sum insured.
 *    - Section 3 (ICOW): 3 months (1.50%), 6 months (2.50%), 12 months (4.00%).
 *    - Non-positive hardware CRV throws: Error('Hardware CRV must be positive').
 * 4. Boiler & Pressure Plant (BPP):
 *    - Indian Boilers Act, 1923 explosion/collapse perils.
 *    - Fire Tube (0.75%) vs Water Tube (1.00%).
 *    - Operating pressure > 20 bar triggers +20% high-pressure surcharge.
 *    - Third Party Liability (TPL) extension: 0.50% of TPL limit.
 *    - Non-positive replacement value throws: Error('Vessel replacement value must be positive').
 * 5. Fixed Asset Register (FAR) Tabular Parser:
 *    - Category rollup (Building, Plant & Machinery, Furniture & Fixtures, Stocks).
 *    - Underinsurance ratio: total_book_value / total_replacement_value rounded to 2 decimals.
 * 6. Studio Input Validator:
 *    - Validates project name, positive works sum insured, duration >= 1 month.
 * 7. Dual-Tier Architecture:
 *    - Canonical underwriting functions matching Features 20–25 in tests/e2e/canonical_engines.ts.
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

export const CAR_CIVIL_RATE_PER_MILLE = 1.20;       // 1.20‰ for civil engineering works
export const EAR_PLANT_RATE_PER_MILLE = 1.80;       // 1.80‰ for plant & machinery erection
export const EAR_TESTING_MONTHLY_RATE_PER_MILLE = 0.75; // 0.75‰/mo on plant SI after 1st free month

export const DLP_MAINTENANCE_RATES = {
  EXTENDED_24_MONTHS: 0.25, // 25% loading on base works
  STANDARD_12_MONTHS: 0.15, // 15% loading on base works
  NONE: 0.0,
} as const;

export const SEISMIC_EQ_RATES_PER_MILLE: Record<1 | 2 | 3 | 4, number> = {
  1: 0.50, // Zone 1 (Severe / Very High Risk)
  2: 0.35, // Zone 2 (High Risk)
  3: 0.25, // Zone 3 (Moderate Risk)
  4: 0.10, // Zone 4 (Low Risk)
};

export const STFI_PERIL_RATE_PER_MILLE = 0.15; // 0.15‰ for Storm, Tempest, Flood & Inundation

export const MB_GROUP_RATES: Record<1 | 2 | 3 | 4, number> = {
  1: 0.0090, // Group 1: 0.90% (Pumps, small motors, fans, transformers <= 100kVA)
  2: 0.0150, // Group 2: 1.50% (Compressors, machine tools, gear boxes, medium transformers)
  3: 0.0250, // Group 3: 2.50% (Turbines, heavy presses, generators, extrusion lines)
  4: 0.0400, // Group 4: 4.00% (High-speed rolling mills, internal combustion engines, heavy kilns)
};

export const EEI_HARDWARE_BASE_RATE = 0.0125;      // 1.25% for stationary electronic hardware
export const EEI_PORTABLE_LAPTOP_LOADING = 0.0250;  // +2.50% for worldwide portable laptop cover (total 3.75%)
export const EEI_DATA_MEDIA_RATE = 0.0300;          // 3.00% for external data media replacement
export const EEI_ICOW_RATES: Record<3 | 6 | 12, number> = {
  3: 0.0150,  // 3 months indemnity: 1.50%
  6: 0.0250,  // 6 months indemnity: 2.50%
  12: 0.0400, // 12 months indemnity: 4.00%
};

export const BPP_VESSEL_RATES = {
  fire_tube: 0.0075,  // 0.75% for fire tube boilers
  water_tube: 0.0100, // 1.00% for water tube boilers
} as const;

export const BPP_HIGH_PRESSURE_SURCHARGE_PERCENT = 0.20; // +20% if operating pressure > 20 bar
export const BPP_TPL_RATE = 0.0050; // 0.50% on Third Party Liability limit
export const SURROUNDING_PROPERTY_RATE_PER_MILLE = 0.25; // 0.25‰ extension
export const STATUTORY_GST_RATE = 18; // 18% GST

// ============================================================================
// 2. CANONICAL FEATURE 20: CAR / EAR PROJECT LIFECYCLE ENGINE
// ============================================================================

export interface CarEarInput {
  project_type: 'car' | 'ear';
  civil_works_value: number;
  plant_machinery_value: number;
  contract_period_months: number;
  testing_period_months?: number; // for EAR
  dlp_maintenance_months?: number; // 12 or 24 months
  eq_zone: 1 | 2 | 3 | 4;
}

export function calculateCarEarPremium(input: CarEarInput): {
  project_sum_insured: number;
  base_works_premium: number;
  testing_premium: number;
  maintenance_premium: number;
  perils_premium: number;
  net_project_premium: number;
} {
  const totalSi = input.civil_works_value + input.plant_machinery_value;
  if (totalSi <= 0) throw new Error('Project sum insured must be greater than zero');

  // Rates in per mille (‰)
  const civilRate = CAR_CIVIL_RATE_PER_MILLE;
  const plantRate = EAR_PLANT_RATE_PER_MILLE;
  const durationFactor = Math.max(1.0, input.contract_period_months / 12);

  const baseCivil = (input.civil_works_value * civilRate * durationFactor) / 1000;
  const basePlant = (input.plant_machinery_value * plantRate * durationFactor) / 1000;
  const baseWorks = Math.round(baseCivil + basePlant);

  // Testing period (EAR): 1 month included, extra at 0.75‰ per month on Plant
  let testingPrem = 0;
  if (input.project_type === 'ear' && (input.testing_period_months ?? 0) > 1) {
    const extraMonths = (input.testing_period_months ?? 0) - 1;
    testingPrem = Math.round((input.plant_machinery_value * (extraMonths * EAR_TESTING_MONTHLY_RATE_PER_MILLE)) / 1000);
  }

  // Maintenance DLP: 12 mos = 15%, 24 mos = 25% of base
  let maintPrem = 0;
  if ((input.dlp_maintenance_months ?? 0) >= 24) {
    maintPrem = Math.round(baseWorks * DLP_MAINTENANCE_RATES.EXTENDED_24_MONTHS);
  } else if ((input.dlp_maintenance_months ?? 0) >= 12) {
    maintPrem = Math.round(baseWorks * DLP_MAINTENANCE_RATES.STANDARD_12_MONTHS);
  }

  // Perils: EQ Zone 1: 0.50‰, Zone 2: 0.35‰, Zone 3: 0.25‰, Zone 4: 0.10‰
  const eqRates = SEISMIC_EQ_RATES_PER_MILLE;
  const perilsPrem = Math.round((totalSi * eqRates[input.eq_zone]) / 1000);

  const net = baseWorks + testingPrem + maintPrem + perilsPrem;

  return {
    project_sum_insured: totalSi,
    base_works_premium: baseWorks,
    testing_premium: testingPrem,
    maintenance_premium: maintPrem,
    perils_premium: perilsPrem,
    net_project_premium: net,
  };
}

// ============================================================================
// 3. CANONICAL FEATURE 21: MACHINERY BREAKDOWN (MB) ENGINE
// ============================================================================

export interface MbMachineItem {
  machine_id: string;
  tariff_group: 1 | 2 | 3 | 4;
  current_replacement_value: number;
}

export function calculateMachineryBreakdown(machines: MbMachineItem[]): {
  total_machines: number;
  total_crv: number;
  net_mb_premium: number;
} {
  const groupRates = MB_GROUP_RATES;
  let totalCrv = 0;
  let totalPrem = 0;

  for (const m of machines) {
    if (m.current_replacement_value <= 0) throw new Error('CRV must be greater than zero');
    totalCrv += m.current_replacement_value;
    totalPrem += m.current_replacement_value * groupRates[m.tariff_group];
  }

  return {
    total_machines: machines.length,
    total_crv: totalCrv,
    net_mb_premium: Math.round(totalPrem),
  };
}

// ============================================================================
// 4. CANONICAL FEATURE 22: ELECTRONIC EQUIPMENT INSURANCE (EEI) ENGINE
// ============================================================================

export interface EeiInput {
  section1_hardware_crv: number;
  section2_data_media_si?: number;
  section3_icow_months?: 3 | 6 | 12;
  section3_icow_si?: number;
  is_portable_laptop?: boolean;
}

export function calculateEeiPremium(input: EeiInput): {
  section1_premium: number;
  section2_premium: number;
  section3_premium: number;
  total_eei_premium: number;
} {
  if (input.section1_hardware_crv <= 0) throw new Error('Hardware CRV must be positive');

  let s1Rate = EEI_HARDWARE_BASE_RATE;
  if (input.is_portable_laptop) {
    s1Rate += EEI_PORTABLE_LAPTOP_LOADING; // Worldwide portable loading (3.75%)
  }
  const s1Prem = Math.round(input.section1_hardware_crv * s1Rate);

  const s2Si = input.section2_data_media_si || 0;
  const s2Prem = Math.round(s2Si * EEI_DATA_MEDIA_RATE);

  let s3Prem = 0;
  if (input.section3_icow_si && input.section3_icow_months) {
    const icowRates = EEI_ICOW_RATES;
    s3Prem = Math.round(input.section3_icow_si * icowRates[input.section3_icow_months]);
  }

  return {
    section1_premium: s1Prem,
    section2_premium: s2Prem,
    section3_premium: s3Prem,
    total_eei_premium: s1Prem + s2Prem + s3Prem,
  };
}

// ============================================================================
// 5. CANONICAL FEATURE 23: BOILER & PRESSURE PLANT (BPP) ENGINE
// ============================================================================

export interface BppInput {
  vessel_type: 'fire_tube' | 'water_tube';
  heating_surface_sqm: number;
  operating_pressure_bar: number;
  replacement_value: number;
  tpl_limit?: number;
}

export function calculateBppPremium(input: BppInput): {
  base_bpp_premium: number;
  high_pressure_surcharge: number;
  tpl_premium: number;
  total_bpp_premium: number;
} {
  if (input.replacement_value <= 0) throw new Error('Vessel replacement value must be positive');

  const rate = input.vessel_type === 'water_tube' ? BPP_VESSEL_RATES.water_tube : BPP_VESSEL_RATES.fire_tube;
  const base = input.replacement_value * rate;

  let surcharge = 0;
  if (input.operating_pressure_bar > 20) {
    surcharge = Math.round(base * BPP_HIGH_PRESSURE_SURCHARGE_PERCENT); // +20% high-pressure surcharge
  }

  let tpl = 0;
  if (input.tpl_limit) {
    tpl = Math.round(input.tpl_limit * BPP_TPL_RATE);
  }

  return {
    base_bpp_premium: Math.round(base),
    high_pressure_surcharge: surcharge,
    tpl_premium: tpl,
    total_bpp_premium: Math.round(base) + surcharge + tpl,
  };
}

// ============================================================================
// 6. CANONICAL FEATURE 24: FIXED ASSET REGISTER (FAR) TABULAR PARSER
// ============================================================================

export interface FarItem {
  asset_code: string;
  category: 'building' | 'plant_machinery' | 'furniture_fixtures' | 'stocks';
  book_value: number;
  current_replacement_value: number;
}

export function parseFixedAssetRegister(items: FarItem[]): {
  building_crv: number;
  plant_machinery_crv: number;
  furniture_crv: number;
  stocks_crv: number;
  total_crv: number;
  underinsurance_ratio: number;
} {
  let b = 0, pm = 0, ff = 0, s = 0, totalBv = 0, totalCrv = 0;
  for (const it of items) {
    totalBv += it.book_value;
    totalCrv += it.current_replacement_value;
    if (it.category === 'building') b += it.current_replacement_value;
    else if (it.category === 'plant_machinery') pm += it.current_replacement_value;
    else if (it.category === 'furniture_fixtures') ff += it.current_replacement_value;
    else if (it.category === 'stocks') s += it.current_replacement_value;
  }

  const ratio = totalCrv > 0 ? Math.round((totalBv / totalCrv) * 100) / 100 : 1.0;
  return {
    building_crv: b,
    plant_machinery_crv: pm,
    furniture_crv: ff,
    stocks_crv: s,
    total_crv: totalCrv,
    underinsurance_ratio: ratio,
  };
}

// ============================================================================
// 7. CANONICAL FEATURE 25: ENGINEERING STUDIO UI MODEL
// ============================================================================

export interface EngineeringStudioInput {
  project_name: string;
  contractor_name: string;
  project_type: 'car' | 'ear';
  civil_si: number;
  plant_si: number;
  duration_months: number;
}

export function validateEngineeringStudioInput(input: EngineeringStudioInput): {
  is_valid: boolean;
  project_summary?: string;
  error?: string;
} {
  if (!input.project_name) return { is_valid: false, error: 'Project name is required' };
  if (input.civil_si <= 0 && input.plant_si <= 0) return { is_valid: false, error: 'Project works sum insured must be positive' };
  if (input.duration_months < 1) return { is_valid: false, error: 'Duration must be at least 1 month' };
  return {
    is_valid: true,
    project_summary: `${input.project_name} (${input.project_type.toUpperCase()}) - ₹${((input.civil_si + input.plant_si) / 10000000).toFixed(2)} Cr`,
  };
}

// ============================================================================
// 8. STANDARD QUOTE CONTRACT BREAKDOWN ADAPTERS (TIER 2)
// ============================================================================

export interface CarEarQuoteInput extends CarEarInput {
  surrounding_property_limit?: number;
  tpl_limit?: number;
  stfi_opted?: boolean;
}

export interface MbQuoteInput {
  machines: MbMachineItem[];
  express_freight_percent?: number;
  air_freight_si?: number;
  surrounding_property_limit?: number;
}

export interface EeiQuoteInput extends EeiInput {
  express_freight_si?: number;
}

export interface BppQuoteInput extends BppInput {
  surrounding_property_limit?: number;
}

export interface UnifiedEngineeringQuoteInput {
  sub_line: 'car' | 'ear' | 'mb' | 'eei' | 'bpp' | 'package';
  car_ear_input?: CarEarQuoteInput;
  mb_input?: MbQuoteInput;
  eei_input?: EeiQuoteInput;
  bpp_input?: BppQuoteInput;
}

/**
 * Calculates CAR/EAR StandardQuoteBreakdown with 18% GST and algorithmic explainability vector.
 */
export function calculateCarEarQuote(input: CarEarQuoteInput): StandardQuoteBreakdown {
  const res = calculateCarEarPremium(input);

  // Optional extensions
  let surroundingPrem = 0;
  if (input.surrounding_property_limit && input.surrounding_property_limit > 0) {
    surroundingPrem = Math.round((input.surrounding_property_limit * SURROUNDING_PROPERTY_RATE_PER_MILLE) / 1000);
  }

  let tplPrem = 0;
  if (input.tpl_limit && input.tpl_limit > 0) {
    tplPrem = Math.round((input.tpl_limit * 0.35) / 1000); // 0.35‰ on TPL limit
  }

  let stfiPrem = 0;
  if (input.stfi_opted) {
    stfiPrem = Math.round((res.project_sum_insured * STFI_PERIL_RATE_PER_MILLE) / 1000);
  }

  const netPremium = res.net_project_premium + surroundingPrem + tplPrem + stfiPrem;
  const gstAmount = Math.round(netPremium * (STATUTORY_GST_RATE / 100));
  const totalPremium = netPremium + gstAmount;

  const durationFactor = Math.max(1.0, input.contract_period_months / 12);
  const totalSi = res.project_sum_insured;
  const baseRatePerMille = totalSi > 0 ? Math.round(((netPremium / totalSi) * 1000) * 100) / 100 : 0;

  const statutoryClauses = [
    'Section 64VB of Insurance Act, 1938: Premium payment warranty required prior to commencement of risk.',
    'Condition of Average / Reinstatement Value Clause: Insured sum insured must represent full replacement value at completion.',
    input.project_type === 'ear'
      ? 'Testing Period Warranty: Commercial production or introduction of feed material terminates testing cover automatically.'
      : 'Contractors All Risk 72-Hour Perils Clause: Claims arising out of flood or earthquake within 72 hours constitute a single occurrence.',
    (input.dlp_maintenance_months ?? 0) >= 12
      ? `Defect Liability Maintenance Cover (${input.dlp_maintenance_months} months): Covers contractor obligations under contract maintenance specifications.`
      : 'Standard DLP: Maintenance liability excluded unless explicitly endorsed.',
    `AOG Seismic Zone ${input.eq_zone} Warranty: Structure designed and executed in accordance with Bureau of Indian Standards IS 1893 seismic codes.`,
  ];

  const algorithmicExplainability: AlgorithmicExplainabilityStep[] = [
    {
      step: 'Step 1: Base Works Rating',
      description: `Civil (₹${input.civil_works_value.toLocaleString('en-IN')} @ 1.20‰) + Plant (₹${input.plant_machinery_value.toLocaleString('en-IN')} @ 1.80‰) x Duration Factor (${durationFactor.toFixed(2)})`,
      value: `Base Works Premium = ₹${res.base_works_premium.toLocaleString('en-IN')}`,
    },
    {
      step: 'Step 2: EAR Testing Loading',
      description: input.project_type === 'ear' && (input.testing_period_months ?? 0) > 1
        ? `${(input.testing_period_months ?? 0) - 1} extra testing month(s) @ 0.75‰/mo on plant value ₹${input.plant_machinery_value.toLocaleString('en-IN')}`
        : '1 month testing included free in base rate or not applicable for CAR',
      value: `Testing Premium = ₹${res.testing_premium.toLocaleString('en-IN')}`,
    },
    {
      step: 'Step 3: Defect Liability Period (DLP) Maintenance',
      description: (input.dlp_maintenance_months ?? 0) >= 24
        ? 'Extended DLP (>=24 mos): 25% loading on base works premium'
        : (input.dlp_maintenance_months ?? 0) >= 12
        ? 'Standard DLP (>=12 mos): 15% loading on base works premium'
        : 'Zero DLP maintenance period selected',
      value: `Maintenance Premium = ₹${res.maintenance_premium.toLocaleString('en-IN')}`,
    },
    {
      step: 'Step 4: Act of God (AOG) Perils',
      description: `Seismic Zone ${input.eq_zone} rated @ ${SEISMIC_EQ_RATES_PER_MILLE[input.eq_zone]}‰ on total project SI ₹${totalSi.toLocaleString('en-IN')}${input.stfi_opted ? ` + STFI (0.15‰ = ₹${stfiPrem.toLocaleString('en-IN')})` : ''}`,
      value: `Perils Premium = ₹${(res.perils_premium + stfiPrem).toLocaleString('en-IN')}`,
    },
    {
      step: 'Step 5: Extensions & Liability',
      description: `Surrounding Property (₹${surroundingPrem.toLocaleString('en-IN')}) + Third Party Liability (₹${tplPrem.toLocaleString('en-IN')})`,
      value: `Extensions Premium = ₹${(surroundingPrem + tplPrem).toLocaleString('en-IN')}`,
    },
    {
      step: 'Step 6: Statutory GST & Net Premium',
      description: `Net Project Premium ₹${netPremium.toLocaleString('en-IN')} + 18% GST (₹${gstAmount.toLocaleString('en-IN')})`,
      value: `Total Premium Payable = ₹${totalPremium.toLocaleString('en-IN')}`,
    },
  ];

  return {
    lob_category: 'engineering',
    insurance_line: input.project_type === 'ear' ? 'ear' : 'car',
    sum_insured: totalSi,
    base_rate_per_mille: baseRatePerMille,
    net_premium: netPremium,
    gst_rate_percent: STATUTORY_GST_RATE,
    gst_amount: gstAmount,
    total_premium: totalPremium,
    statutory_clauses: statutoryClauses,
    line_specific_breakdown: {
      project_type: input.project_type,
      civil_works_value: input.civil_works_value,
      plant_machinery_value: input.plant_machinery_value,
      contract_period_months: input.contract_period_months,
      duration_factor: durationFactor,
      testing_period_months: input.testing_period_months ?? (input.project_type === 'ear' ? 1 : 0),
      dlp_maintenance_months: input.dlp_maintenance_months ?? 0,
      eq_zone: input.eq_zone,
      base_works_premium: res.base_works_premium,
      testing_premium: res.testing_premium,
      maintenance_premium: res.maintenance_premium,
      perils_premium: res.perils_premium,
      stfi_premium: stfiPrem,
      surrounding_property_premium: surroundingPrem,
      tpl_premium: tplPrem,
      net_project_premium: netPremium,
    },
    algorithmic_explainability: algorithmicExplainability,
  };
}

/**
 * Calculates Machinery Breakdown (MB) StandardQuoteBreakdown.
 */
export function calculateMbQuote(input: MbQuoteInput): StandardQuoteBreakdown {
  const res = calculateMachineryBreakdown(input.machines);

  let expressFreightPrem = 0;
  if (input.express_freight_percent && input.express_freight_percent > 0) {
    expressFreightPrem = Math.round(res.net_mb_premium * (input.express_freight_percent / 100));
  }

  let airFreightPrem = 0;
  if (input.air_freight_si && input.air_freight_si > 0) {
    airFreightPrem = Math.round((input.air_freight_si * 0.0250)); // 2.50% air freight rate
  }

  let surroundingPrem = 0;
  if (input.surrounding_property_limit && input.surrounding_property_limit > 0) {
    surroundingPrem = Math.round((input.surrounding_property_limit * SURROUNDING_PROPERTY_RATE_PER_MILLE) / 1000);
  }

  const netPremium = res.net_mb_premium + expressFreightPrem + airFreightPrem + surroundingPrem;
  const gstAmount = Math.round(netPremium * (STATUTORY_GST_RATE / 100));
  const totalPremium = netPremium + gstAmount;

  const totalSi = res.total_crv;
  const baseRatePerMille = totalSi > 0 ? Math.round(((netPremium / totalSi) * 1000) * 100) / 100 : 0;

  const statutoryClauses = [
    'Section 64VB of Insurance Act, 1938: Premium receipt warranty in advance of risk attachment.',
    'Reinstatement Value Clause (CRV): Sum insured must strictly represent Current Replacement Value of new machine of identical capacity.',
    'Condition of Average: Underinsurance deduction applied proportionately if CRV is lower than new machine replacement value at time of loss.',
    'Maintenance Warranty: All insured machinery must be inspected and serviced in line with OEM maintenance schedules.',
  ];

  const algorithmicExplainability: AlgorithmicExplainabilityStep[] = [
    {
      step: 'Step 1: Machine Schedule Classification',
      description: `${res.total_machines} machine(s) evaluated across Tariff Groups I to IV on Current Replacement Value (CRV)`,
      value: `Total CRV = ₹${res.total_crv.toLocaleString('en-IN')}`,
    },
    {
      step: 'Step 2: Base Machinery Breakdown Tariff',
      description: 'Tariff rating: Group 1 (0.90%), Group 2 (1.50%), Group 3 (2.50%), Group 4 (4.00%) applied to individual machine CRVs',
      value: `Base MB Premium = ₹${res.net_mb_premium.toLocaleString('en-IN')}`,
    },
    {
      step: 'Step 3: Freight & Surrounding Extensions',
      description: `Express Freight (₹${expressFreightPrem.toLocaleString('en-IN')}) + Air Freight (₹${airFreightPrem.toLocaleString('en-IN')}) + Surrounding Property (₹${surroundingPrem.toLocaleString('en-IN')})`,
      value: `Add-ons Premium = ₹${(expressFreightPrem + airFreightPrem + surroundingPrem).toLocaleString('en-IN')}`,
    },
    {
      step: 'Step 4: Statutory GST & Total Premium',
      description: `Net MB Premium ₹${netPremium.toLocaleString('en-IN')} + 18% GST (₹${gstAmount.toLocaleString('en-IN')})`,
      value: `Total Premium Payable = ₹${totalPremium.toLocaleString('en-IN')}`,
    },
  ];

  return {
    lob_category: 'engineering',
    insurance_line: 'mb',
    sum_insured: totalSi,
    base_rate_per_mille: baseRatePerMille,
    net_premium: netPremium,
    gst_rate_percent: STATUTORY_GST_RATE,
    gst_amount: gstAmount,
    total_premium: totalPremium,
    statutory_clauses: statutoryClauses,
    line_specific_breakdown: {
      total_machines: res.total_machines,
      total_crv: res.total_crv,
      base_mb_premium: res.net_mb_premium,
      express_freight_premium: expressFreightPrem,
      air_freight_premium: airFreightPrem,
      surrounding_property_premium: surroundingPrem,
      net_premium: netPremium,
      machines_summary: input.machines.map((m) => ({
        machine_id: m.machine_id,
        group: m.tariff_group,
        rate_percent: (MB_GROUP_RATES[m.tariff_group] * 100).toFixed(2),
        crv: m.current_replacement_value,
        premium: Math.round(m.current_replacement_value * MB_GROUP_RATES[m.tariff_group]),
      })),
    },
    algorithmic_explainability: algorithmicExplainability,
  };
}

/**
 * Calculates Electronic Equipment Insurance (EEI) StandardQuoteBreakdown.
 */
export function calculateEeiQuote(input: EeiQuoteInput): StandardQuoteBreakdown {
  const res = calculateEeiPremium(input);

  let expressFreightPrem = 0;
  if (input.express_freight_si && input.express_freight_si > 0) {
    expressFreightPrem = Math.round((input.express_freight_si * 0.0200)); // 2.00%
  }

  const netPremium = res.total_eei_premium + expressFreightPrem;
  const gstAmount = Math.round(netPremium * (STATUTORY_GST_RATE / 100));
  const totalPremium = netPremium + gstAmount;

  const totalSi = input.section1_hardware_crv + (input.section2_data_media_si || 0) + (input.section3_icow_si || 0);
  const baseRatePerMille = totalSi > 0 ? Math.round(((netPremium / totalSi) * 1000) * 100) / 100 : 0;

  const statutoryClauses = [
    'Section 64VB of Insurance Act, 1938: Premium receipt warranty.',
    'External Data Media Backup Warranty: Full system data backups must be generated at least once weekly and kept in a fire-proof separate safe.',
    'Condition of Average / Reinstatement Value: Equipment must be covered at current replacement price including freight, customs duty, and erection costs.',
    input.is_portable_laptop
      ? 'Portable Equipment Worldwide Transit Clause: Covers accidental loss/damage to laptops and mobile devices during worldwide commercial travel.'
      : 'Stationary Equipment Clause: Covers electronic hardware situated at scheduled location.',
  ];

  const algorithmicExplainability: AlgorithmicExplainabilityStep[] = [
    {
      step: 'Step 1: Section 1 Electronic Hardware',
      description: `Hardware CRV ₹${input.section1_hardware_crv.toLocaleString('en-IN')} @ ${input.is_portable_laptop ? '3.75% (incl. portable transit loading)' : '1.25% (stationary)'}`,
      value: `Section 1 Premium = ₹${res.section1_premium.toLocaleString('en-IN')}`,
    },
    {
      step: 'Step 2: Section 2 External Data Media',
      description: input.section2_data_media_si
        ? `Media SI ₹${input.section2_data_media_si.toLocaleString('en-IN')} @ 3.00% media reconstruction cost`
        : 'Section 2 External Data Media not opted',
      value: `Section 2 Premium = ₹${res.section2_premium.toLocaleString('en-IN')}`,
    },
    {
      step: 'Step 3: Section 3 Increased Cost of Working (ICOW)',
      description: input.section3_icow_si && input.section3_icow_months
        ? `ICOW SI ₹${input.section3_icow_si.toLocaleString('en-IN')} (${input.section3_icow_months} mos indemnity @ ${(EEI_ICOW_RATES[input.section3_icow_months] * 100).toFixed(2)}%)`
        : 'Section 3 ICOW not opted',
      value: `Section 3 Premium = ₹${res.section3_premium.toLocaleString('en-IN')}`,
    },
    {
      step: 'Step 4: Statutory GST & Total Premium',
      description: `Net EEI Premium ₹${netPremium.toLocaleString('en-IN')} + 18% GST (₹${gstAmount.toLocaleString('en-IN')})`,
      value: `Total Premium Payable = ₹${totalPremium.toLocaleString('en-IN')}`,
    },
  ];

  return {
    lob_category: 'engineering',
    insurance_line: 'eei',
    sum_insured: totalSi,
    base_rate_per_mille: baseRatePerMille,
    net_premium: netPremium,
    gst_rate_percent: STATUTORY_GST_RATE,
    gst_amount: gstAmount,
    total_premium: totalPremium,
    statutory_clauses: statutoryClauses,
    line_specific_breakdown: {
      section1_hardware_crv: input.section1_hardware_crv,
      is_portable_laptop: !!input.is_portable_laptop,
      section1_premium: res.section1_premium,
      section2_data_media_si: input.section2_data_media_si || 0,
      section2_premium: res.section2_premium,
      section3_icow_si: input.section3_icow_si || 0,
      section3_icow_months: input.section3_icow_months,
      section3_premium: res.section3_premium,
      express_freight_premium: expressFreightPrem,
      net_premium: netPremium,
    },
    algorithmic_explainability: algorithmicExplainability,
  };
}

/**
 * Calculates Boiler & Pressure Plant (BPP) StandardQuoteBreakdown.
 */
export function calculateBppQuote(input: BppQuoteInput): StandardQuoteBreakdown {
  const res = calculateBppPremium(input);

  let surroundingPrem = 0;
  if (input.surrounding_property_limit && input.surrounding_property_limit > 0) {
    surroundingPrem = Math.round((input.surrounding_property_limit * SURROUNDING_PROPERTY_RATE_PER_MILLE) / 1000);
  }

  const netPremium = res.total_bpp_premium + surroundingPrem;
  const gstAmount = Math.round(netPremium * (STATUTORY_GST_RATE / 100));
  const totalPremium = netPremium + gstAmount;

  const totalSi = input.replacement_value + (input.tpl_limit || 0) + (input.surrounding_property_limit || 0);
  const baseRatePerMille = totalSi > 0 ? Math.round(((netPremium / totalSi) * 1000) * 100) / 100 : 0;

  const statutoryClauses = [
    'Section 64VB of Insurance Act, 1938: Advance premium warranty.',
    'Indian Boilers Act, 1923 Statutory Certificate Warranty: Boiler must hold valid certificate of fitness issued by competent Boiler Inspector.',
    'Pressure Vessel Safety Valve Warranty: Working safety valves and pressure gauges must be calibrated annually.',
    'Hydraulic Test Warranty: Boilers must undergo statutory hydraulic tests following major repairs or maintenance shutdowns.',
  ];

  const algorithmicExplainability: AlgorithmicExplainabilityStep[] = [
    {
      step: 'Step 1: Boiler Base Explosion Tariff',
      description: `${input.vessel_type === 'water_tube' ? 'Water Tube (1.00%)' : 'Fire Tube (0.75%)'} applied to Replacement Value ₹${input.replacement_value.toLocaleString('en-IN')}`,
      value: `Base Vessel Premium = ₹${res.base_bpp_premium.toLocaleString('en-IN')}`,
    },
    {
      step: 'Step 2: Operating Pressure Surcharge',
      description: input.operating_pressure_bar > 20
        ? `Operating pressure ${input.operating_pressure_bar} bar (>20 bar threshold) triggers +20% high-pressure surcharge`
        : `Operating pressure ${input.operating_pressure_bar} bar is within standard rating threshold (no surcharge)`,
      value: `Pressure Surcharge = ₹${res.high_pressure_surcharge.toLocaleString('en-IN')}`,
    },
    {
      step: 'Step 3: Third Party Liability & Surrounding Property',
      description: `TPL Limit (₹${(input.tpl_limit || 0).toLocaleString('en-IN')} @ 0.50%) + Surrounding Property (₹${surroundingPrem.toLocaleString('en-IN')})`,
      value: `Liability & Surrounding = ₹${(res.tpl_premium + surroundingPrem).toLocaleString('en-IN')}`,
    },
    {
      step: 'Step 4: Statutory GST & Total Premium',
      description: `Net BPP Premium ₹${netPremium.toLocaleString('en-IN')} + 18% GST (₹${gstAmount.toLocaleString('en-IN')})`,
      value: `Total Premium Payable = ₹${totalPremium.toLocaleString('en-IN')}`,
    },
  ];

  return {
    lob_category: 'engineering',
    insurance_line: 'bpp',
    sum_insured: totalSi,
    base_rate_per_mille: baseRatePerMille,
    net_premium: netPremium,
    gst_rate_percent: STATUTORY_GST_RATE,
    gst_amount: gstAmount,
    total_premium: totalPremium,
    statutory_clauses: statutoryClauses,
    line_specific_breakdown: {
      vessel_type: input.vessel_type,
      heating_surface_sqm: input.heating_surface_sqm,
      operating_pressure_bar: input.operating_pressure_bar,
      replacement_value: input.replacement_value,
      base_bpp_premium: res.base_bpp_premium,
      high_pressure_surcharge: res.high_pressure_surcharge,
      tpl_limit: input.tpl_limit || 0,
      tpl_premium: res.tpl_premium,
      surrounding_property_limit: input.surrounding_property_limit || 0,
      surrounding_property_premium: surroundingPrem,
      net_premium: netPremium,
    },
    algorithmic_explainability: algorithmicExplainability,
  };
}

/**
 * Unified engineering quote calculation entrypoint for polymorphic dispatch or comprehensive multi-line engineering packages.
 */
export function calculateEngineeringQuote(input: UnifiedEngineeringQuoteInput): StandardQuoteBreakdown {
  if (input.sub_line === 'car' || input.sub_line === 'ear') {
    if (!input.car_ear_input) throw new Error('CAR/EAR input parameters required when sub_line is car or ear');
    return calculateCarEarQuote(input.car_ear_input);
  }

  if (input.sub_line === 'mb') {
    if (!input.mb_input) throw new Error('Machinery Breakdown input parameters required when sub_line is mb');
    return calculateMbQuote(input.mb_input);
  }

  if (input.sub_line === 'eei') {
    if (!input.eei_input) throw new Error('EEI input parameters required when sub_line is eei');
    return calculateEeiQuote(input.eei_input);
  }

  if (input.sub_line === 'bpp') {
    if (!input.bpp_input) throw new Error('Boiler & Pressure Plant input parameters required when sub_line is bpp');
    return calculateBppQuote(input.bpp_input);
  }

  if (input.sub_line === 'package') {
    // Multi-Cover Package aggregation: evaluate all opted sections
    let totalSi = 0;
    let netPremium = 0;
    const explainability: AlgorithmicExplainabilityStep[] = [];
    const statutoryClausesSet = new Set<string>();
    const packageBreakdown: Record<string, any> = {};

    if (input.car_ear_input) {
      const carEar = calculateCarEarQuote(input.car_ear_input);
      totalSi += carEar.sum_insured;
      netPremium += carEar.net_premium;
      packageBreakdown.car_ear = carEar.line_specific_breakdown;
      explainability.push({
        step: `Section: ${input.car_ear_input.project_type.toUpperCase()} Project Works`,
        description: `Sum Insured ₹${carEar.sum_insured.toLocaleString('en-IN')}`,
        value: `Net Premium = ₹${carEar.net_premium.toLocaleString('en-IN')}`,
      });
      carEar.statutory_clauses.forEach((c) => statutoryClausesSet.add(c));
    }

    if (input.mb_input && input.mb_input.machines.length > 0) {
      const mb = calculateMbQuote(input.mb_input);
      totalSi += mb.sum_insured;
      netPremium += mb.net_premium;
      packageBreakdown.machinery_breakdown = mb.line_specific_breakdown;
      explainability.push({
        step: 'Section: Operational Machinery Breakdown',
        description: `${input.mb_input.machines.length} machine(s), CRV ₹${mb.sum_insured.toLocaleString('en-IN')}`,
        value: `Net Premium = ₹${mb.net_premium.toLocaleString('en-IN')}`,
      });
      mb.statutory_clauses.forEach((c) => statutoryClausesSet.add(c));
    }

    if (input.eei_input) {
      const eei = calculateEeiQuote(input.eei_input);
      totalSi += eei.sum_insured;
      netPremium += eei.net_premium;
      packageBreakdown.electronic_equipment = eei.line_specific_breakdown;
      explainability.push({
        step: 'Section: Electronic Equipment Insurance',
        description: `Hardware + Media + ICOW SI ₹${eei.sum_insured.toLocaleString('en-IN')}`,
        value: `Net Premium = ₹${eei.net_premium.toLocaleString('en-IN')}`,
      });
      eei.statutory_clauses.forEach((c) => statutoryClausesSet.add(c));
    }

    if (input.bpp_input) {
      const bpp = calculateBppQuote(input.bpp_input);
      totalSi += bpp.sum_insured;
      netPremium += bpp.net_premium;
      packageBreakdown.boiler_pressure_plant = bpp.line_specific_breakdown;
      explainability.push({
        step: 'Section: Boiler & Pressure Plant',
        description: `Vessel SI ₹${bpp.sum_insured.toLocaleString('en-IN')}`,
        value: `Net Premium = ₹${bpp.net_premium.toLocaleString('en-IN')}`,
      });
      bpp.statutory_clauses.forEach((c) => statutoryClausesSet.add(c));
    }

    if (totalSi <= 0 || netPremium <= 0) {
      throw new Error('Comprehensive engineering package must have at least one active section with positive sum insured');
    }

    const gstAmount = Math.round(netPremium * (STATUTORY_GST_RATE / 100));
    const totalPremium = netPremium + gstAmount;
    const baseRate = totalSi > 0 ? Math.round(((netPremium / totalSi) * 1000) * 100) / 100 : 0;

    explainability.push({
      step: 'Package Summary: Statutory GST & Total Payable',
      description: `Combined Net Engineering Premium ₹${netPremium.toLocaleString('en-IN')} + 18% GST (₹${gstAmount.toLocaleString('en-IN')})`,
      value: `Total Premium Payable = ₹${totalPremium.toLocaleString('en-IN')}`,
    });

    return {
      lob_category: 'engineering',
      insurance_line: 'car',
      sum_insured: totalSi,
      base_rate_per_mille: baseRate,
      net_premium: netPremium,
      gst_rate_percent: STATUTORY_GST_RATE,
      gst_amount: gstAmount,
      total_premium: totalPremium,
      statutory_clauses: Array.from(statutoryClausesSet),
      line_specific_breakdown: packageBreakdown,
      algorithmic_explainability: explainability,
    };
  }

  throw new Error(`Unsupported engineering sub-line: ${String(input.sub_line)}`);
}
