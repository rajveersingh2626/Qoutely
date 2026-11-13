/**
 * Qoutely E2E Test Suite - Canonical Underwriting, Tariff & Schema Engines
 * Authoritative mathematical and statutory reference oracle for all 34 commercial insurance features.
 * Derived from AIMT, IRDAI Gazettes, TAC Engineering/Marine/GPA tariffs, EC Act 1923, GFR 2017, and DPDPA 2023.
 */

// ============================================================================
// 1. DATABASE & TYPING SUBSYSTEM (FEATURE 1)
// ============================================================================

export type LOBCategory =
  | 'property'
  | 'motor'
  | 'marine'
  | 'engineering'
  | 'liability'
  | 'benefits'
  | 'specialty';

export type InsuranceLine =
  // Property
  | 'fire'
  | 'business_interruption'
  | 'burglary'
  | 'iar'
  // Motor & Fleet
  | 'motor_fleet'
  | 'motor_gcv'
  | 'motor_pcv'
  | 'motor_misc'
  // Marine
  | 'marine_cargo_inland'
  | 'marine_cargo_ocean'
  | 'marine_open_policy'
  | 'marine_hull'
  // Engineering
  | 'car'
  | 'ear'
  | 'mb'
  | 'eei'
  | 'bpp'
  // Liability
  | 'cgl'
  | 'public_liability'
  | 'product_liability'
  | 'pi'
  | 'do'
  | 'cyber'
  | 'crime_fidelity'
  // Employee Benefits
  | 'ghi'
  | 'gpa'
  | 'wc'
  | 'gtli'
  | 'keyman'
  // Specialty & Financial
  | 'surety_bond'
  | 'trade_credit'
  | 'environmental_liability';

export interface StandardQuoteBreakdown {
  lob_category: LOBCategory;
  insurance_line: InsuranceLine;
  sum_insured: number;
  net_premium: number;
  gst_rate_percent: number; // 18
  gst_amount: number;
  total_premium: number;
  claim_deductible?: string;
  statutory_clauses: string[];
  algorithmic_explainability: {
    statutory_basis: string;
    rating_matrix_applied: string;
    intermediate_factors: Record<string, number | string | boolean>;
  };
}

export function validateQuoteSchema(quote: Partial<Record<string, any>>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!quote.id) errors.push('Missing quote id');
  if (!quote.lob_category) errors.push('Missing lob_category');
  if (!quote.insurance_line) errors.push('Missing insurance_line');
  if (typeof quote.net_premium !== 'number' || quote.net_premium < 0) errors.push('Invalid net_premium');
  if (typeof quote.gst_amount !== 'number' || quote.gst_amount < 0) errors.push('Invalid gst_amount');
  if (typeof quote.total_premium !== 'number' || quote.total_premium < 0) errors.push('Invalid total_premium');

  // Verify mathematical integrity of GST and Total
  if (quote.net_premium !== undefined && quote.gst_amount !== undefined && quote.total_premium !== undefined) {
    const expectedGst = Math.round(quote.net_premium * 0.18);
    if (Math.abs(quote.gst_amount - expectedGst) > 1) {
      errors.push(`GST amount ${quote.gst_amount} does not match 18% of net premium (${expectedGst})`);
    }
    const expectedTotal = quote.net_premium + quote.gst_amount;
    if (quote.total_premium !== expectedTotal) {
      errors.push(`Total premium ${quote.total_premium} != net + gst (${expectedTotal})`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// ============================================================================
// 2. MOTOR VEHICLE IDV DEPRECIATION ENGINE (FEATURE 2)
// ============================================================================

export interface IdvInput {
  ex_showroom_price: number;
  age_months: number;
  electrical_accessories?: number;
  non_electrical_accessories?: number;
  cng_lpg_kit?: number;
  surveyor_agreed_value?: number;
}

export interface IdvOutput {
  depreciation_rate: number;
  chassis_idv: number;
  accessories_idv: number;
  cng_idv: number;
  total_idv: number;
  surveyor_valuation_required: boolean;
}

export function calculateMotorIdv(input: IdvInput): IdvOutput {
  if (input.ex_showroom_price < 0) {
    throw new Error('Ex-showroom price cannot be negative');
  }
  if (input.age_months < 0) {
    throw new Error('Vehicle age cannot be negative');
  }

  let depRate = 0;
  let surveyorRequired = false;

  if (input.age_months <= 6) {
    depRate = 0.05;
  } else if (input.age_months <= 12) {
    depRate = 0.15;
  } else if (input.age_months <= 24) {
    depRate = 0.20;
  } else if (input.age_months <= 36) {
    depRate = 0.30;
  } else if (input.age_months <= 48) {
    depRate = 0.40;
  } else if (input.age_months <= 60) {
    depRate = 0.50;
  } else {
    // Greater than 5 years (60 months)
    surveyorRequired = true;
    depRate = 0.60; // statutory benchmark cap unless surveyor agreed value provided
  }

  const factor = 1 - depRate;
  let chassisIdv = Math.round(input.ex_showroom_price * factor);
  if (surveyorRequired && input.surveyor_agreed_value !== undefined && input.surveyor_agreed_value > 0) {
    chassisIdv = input.surveyor_agreed_value;
  }

  const eleAcc = input.electrical_accessories || 0;
  const nonEleAcc = input.non_electrical_accessories || 0;
  const cngKit = input.cng_lpg_kit || 0;

  const accessoriesIdv = Math.round((eleAcc + nonEleAcc) * factor);
  const cngIdv = Math.round(cngKit * factor);
  const totalIdv = chassisIdv + accessoriesIdv + cngIdv;

  return {
    depreciation_rate: depRate,
    chassis_idv: chassisIdv,
    accessories_idv: accessoriesIdv,
    cng_idv: cngIdv,
    total_idv: totalIdv,
    surveyor_valuation_required: surveyorRequired,
  };
}

// ============================================================================
// 3. MOTOR BASE OWN DAMAGE (OD) RATING (FEATURE 3)
// ============================================================================

export type MotorZone = 'A' | 'B' | 'C';
export type MotorVehicleClass = 'gcv_public' | 'gcv_private' | 'pcv_bus' | 'misc_digger_crane';

export interface MotorBaseOdInput {
  total_idv: number;
  vehicle_class: MotorVehicleClass;
  zone: MotorZone;
}

export interface MotorBaseOdOutput {
  base_od_rate_percent: number;
  gross_od_premium: number;
}

export function calculateMotorBaseOd(input: MotorBaseOdInput): MotorBaseOdOutput {
  if (input.total_idv <= 0) {
    throw new Error('Total IDV must be greater than zero');
  }

  // Tariff rate lookup (AIMT Sections 4 & 5)
  let rate = 1.708; // default Zone C GCV Public
  if (input.vehicle_class === 'gcv_public') {
    if (input.zone === 'A') rate = 1.764;
    else if (input.zone === 'B') rate = 1.756;
    else rate = 1.708;
  } else if (input.vehicle_class === 'gcv_private') {
    if (input.zone === 'A') rate = 1.545;
    else if (input.zone === 'B') rate = 1.537;
    else rate = 1.495;
  } else if (input.vehicle_class === 'pcv_bus') {
    if (input.zone === 'A') rate = 1.850;
    else if (input.zone === 'B') rate = 1.800;
    else rate = 1.750;
  } else if (input.vehicle_class === 'misc_digger_crane') {
    if (input.zone === 'A') rate = 1.400;
    else if (input.zone === 'B') rate = 1.350;
    else rate = 1.300;
  }

  const grossOd = Math.round((input.total_idv * rate) / 100);
  return {
    base_od_rate_percent: rate,
    gross_od_premium: grossOd,
  };
}

// ============================================================================
// 4. MOTOR FLEET DISCOUNT & NCB LADDER (FEATURE 4)
// ============================================================================

export type NcbTier = 0 | 20 | 25 | 35 | 45 | 50;

export interface MotorFleetNcbInput {
  gross_od_premium: number;
  ncb_tier: NcbTier;
  fleet_size: number;
  past_claims_ratio_percent?: number;
}

export interface MotorFleetNcbOutput {
  ncb_percent: number;
  ncb_discount_amount: number;
  fleet_discount_percent: number;
  fleet_loading_percent: number;
  fleet_adjustment_amount: number;
  net_od_premium: number;
}

export function calculateMotorFleetNcb(input: MotorFleetNcbInput): MotorFleetNcbOutput {
  if (input.gross_od_premium < 0) {
    throw new Error('Gross OD premium cannot be negative');
  }
  const ncbPercent = Math.min(Math.max(input.ncb_tier, 0), 50);
  const ncbDiscount = Math.round((input.gross_od_premium * ncbPercent) / 100);
  const odAfterNcb = input.gross_od_premium - ncbDiscount;

  let fleetDiscountPercent = 0;
  let fleetLoadingPercent = 0;
  const claimsRatio = input.past_claims_ratio_percent ?? 50;

  if (claimsRatio > 80) {
    // Adverse claims ratio triggers +25% loading regardless of fleet size
    fleetLoadingPercent = 25;
  } else if (claimsRatio <= 60) {
    if (input.fleet_size > 50) {
      fleetDiscountPercent = 15;
    } else if (input.fleet_size >= 26) {
      fleetDiscountPercent = 10;
    } else if (input.fleet_size >= 10) {
      fleetDiscountPercent = 5;
    }
  }

  let fleetAdjustment = 0;
  if (fleetLoadingPercent > 0) {
    fleetAdjustment = Math.round((odAfterNcb * fleetLoadingPercent) / 100);
  } else if (fleetDiscountPercent > 0) {
    fleetAdjustment = -Math.round((odAfterNcb * fleetDiscountPercent) / 100);
  }

  const netOd = Math.max(0, odAfterNcb + fleetAdjustment);

  return {
    ncb_percent: ncbPercent,
    ncb_discount_amount: ncbDiscount,
    fleet_discount_percent: fleetDiscountPercent,
    fleet_loading_percent: fleetLoadingPercent,
    fleet_adjustment_amount: fleetAdjustment,
    net_od_premium: netOd,
  };
}

// ============================================================================
// 5. MOTOR STATUTORY THIRD PARTY (TP) TARIFF (FEATURE 5)
// ============================================================================

export interface MotorTpInput {
  vehicle_class: MotorVehicleClass;
  gvw_kg?: number;
  seating_capacity?: number;
  include_cpa?: boolean; // compulsory personal accident (₹275)
  paid_drivers_count?: number; // IMT 28 (₹50 each)
}

export interface MotorTpOutput {
  base_statutory_tp: number;
  cpa_premium: number;
  paid_driver_premium: number;
  total_tp_premium: number;
  is_statutory_immutable: true;
}

export function calculateMotorTpTariff(input: MotorTpInput): MotorTpOutput {
  let baseTp = 16049;
  const gvw = input.gvw_kg || 5000;

  if (input.vehicle_class === 'gcv_public' || input.vehicle_class === 'gcv_private') {
    if (gvw <= 7500) {
      baseTp = 16049;
    } else if (gvw <= 12000) {
      baseTp = 27486;
    } else if (gvw <= 20000) {
      baseTp = 35313;
    } else if (gvw <= 40000) {
      baseTp = 44242;
    } else {
      baseTp = 45512;
    }
  } else if (input.vehicle_class === 'pcv_bus') {
    const seats = input.seating_capacity || 30;
    baseTp = seats <= 18 ? 14318 : 22440;
  } else if (input.vehicle_class === 'misc_digger_crane') {
    baseTp = 12762;
  }

  const cpa = input.include_cpa ? 275 : 0;
  const driverCount = input.paid_drivers_count ?? 1;
  const driverPremium = driverCount * 50;

  return {
    base_statutory_tp: baseTp,
    cpa_premium: cpa,
    paid_driver_premium: driverPremium,
    total_tp_premium: baseTp + cpa + driverPremium,
    is_statutory_immutable: true,
  };
}

// ============================================================================
// 6. COMMERCIAL IMT ADD-ON SUITE (FEATURE 6)
// ============================================================================

export interface ImtAddonsInput {
  total_idv: number;
  gross_od_premium: number;
  vehicle_age_months: number;
  opt_imt23?: boolean;
  opt_zero_dep?: boolean;
  opt_consumables?: boolean;
  opt_engine_protect?: boolean;
  opt_rti?: boolean;
  opt_rsa?: boolean;
}

export interface ImtAddonsOutput {
  imt23_premium: number;
  zero_dep_premium: number;
  consumables_premium: number;
  engine_protect_premium: number;
  rti_premium: number;
  rsa_premium: number;
  total_addons_premium: number;
  warnings: string[];
}

export function calculateCommercialImtAddons(input: ImtAddonsInput): ImtAddonsOutput {
  const warnings: string[] = [];
  let imt23 = 0;
  let zeroDep = 0;
  let consumables = 0;
  let engineProtect = 0;
  let rti = 0;
  let rsa = 0;

  if (input.opt_imt23) {
    imt23 = Math.round(input.gross_od_premium * 0.15);
  }

  if (input.opt_zero_dep) {
    if (input.vehicle_age_months > 60) {
      warnings.push('Zero Depreciation is not permissible for vehicles older than 5 years (60 months)');
    } else {
      let zdRate = 0.0075;
      if (input.vehicle_age_months <= 6) zdRate = 0.0075;
      else if (input.vehicle_age_months <= 12) zdRate = 0.0100;
      else if (input.vehicle_age_months <= 24) zdRate = 0.0125;
      else if (input.vehicle_age_months <= 36) zdRate = 0.0150;
      else zdRate = 0.0200;
      zeroDep = Math.round(input.total_idv * zdRate);
    }
  }

  if (input.opt_consumables) {
    consumables = Math.round(input.total_idv * 0.0025);
  }

  if (input.opt_engine_protect) {
    engineProtect = Math.round(input.total_idv * 0.0035);
  }

  if (input.opt_rti) {
    if (input.vehicle_age_months > 36) {
      warnings.push('Return to Invoice (RTI) is restricted to vehicles up to 36 months old');
    } else {
      rti = Math.round(input.total_idv * 0.0040);
    }
  }

  if (input.opt_rsa) {
    rsa = 500;
  }

  const total = imt23 + zeroDep + consumables + engineProtect + rti + rsa;
  return {
    imt23_premium: imt23,
    zero_dep_premium: zeroDep,
    consumables_premium: consumables,
    engine_protect_premium: engineProtect,
    rti_premium: rti,
    rsa_premium: rsa,
    total_addons_premium: total,
    warnings,
  };
}

// ============================================================================
// 7. BULK FLEET VEHICLE ROSTER INGESTION (FEATURE 7)
// ============================================================================

export interface BulkFleetRecord {
  reg_number: string;
  make_model: string;
  mfg_year: number;
  vehicle_class: MotorVehicleClass;
  gvw_kg: number;
  ex_showroom_price: number;
  zone: MotorZone;
  ncb_tier: NcbTier;
}

export interface BulkFleetIngestionResult {
  total_vehicles: number;
  valid_vehicles: number;
  invalid_vehicles: number;
  total_fleet_idv: number;
  total_fleet_net_od: number;
  total_fleet_tp: number;
  total_fleet_net_premium: number;
  total_fleet_gst: number;
  total_fleet_payable: number;
  validation_errors: Array<{ reg_number: string; error: string }>;
}

export function ingestBulkFleetSchedule(records: BulkFleetRecord[]): BulkFleetIngestionResult {
  const indianPlateRegex = /^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}$/;
  const errors: Array<{ reg_number: string; error: string }> = [];

  let validCount = 0;
  let totalIdv = 0;
  let totalNetOd = 0;
  let totalTp = 0;

  const currentYear = 2026;

  for (const rec of records) {
    const cleanPlate = rec.reg_number.replace(/\s+/g, '').toUpperCase();
    if (!indianPlateRegex.test(cleanPlate)) {
      errors.push({ reg_number: rec.reg_number, error: 'Invalid Indian registration plate format' });
      continue;
    }
    if (rec.ex_showroom_price <= 0) {
      errors.push({ reg_number: rec.reg_number, error: 'Ex-showroom price must be positive' });
      continue;
    }
    if (rec.mfg_year < 1990 || rec.mfg_year > currentYear) {
      errors.push({ reg_number: rec.reg_number, error: 'Invalid manufacturing year' });
      continue;
    }

    validCount++;
    const ageMonths = Math.max(0, (currentYear - rec.mfg_year) * 12);
    const idvRes = calculateMotorIdv({ ex_showroom_price: rec.ex_showroom_price, age_months: ageMonths });
    const odRes = calculateMotorBaseOd({ total_idv: idvRes.total_idv, vehicle_class: rec.vehicle_class, zone: rec.zone });
    const ncbRes = calculateMotorFleetNcb({ gross_od_premium: odRes.gross_od_premium, ncb_tier: rec.ncb_tier, fleet_size: records.length });
    const tpRes = calculateMotorTpTariff({ vehicle_class: rec.vehicle_class, gvw_kg: rec.gvw_kg, include_cpa: false, paid_drivers_count: 1 });

    totalIdv += idvRes.total_idv;
    totalNetOd += ncbRes.net_od_premium;
    totalTp += tpRes.total_tp_premium;
  }

  const netPremium = totalNetOd + totalTp;
  const gst = Math.round(netPremium * 0.18);
  const payable = netPremium + gst;

  return {
    total_vehicles: records.length,
    valid_vehicles: validCount,
    invalid_vehicles: errors.length,
    total_fleet_idv: totalIdv,
    total_fleet_net_od: totalNetOd,
    total_fleet_tp: totalTp,
    total_fleet_net_premium: netPremium,
    total_fleet_gst: gst,
    total_fleet_payable: payable,
    validation_errors: errors,
  };
}

// ============================================================================
// 8. COMMERCIAL MOTOR & FLEET STUDIO UI MODEL (FEATURE 8)
// ============================================================================

export interface MotorStudioModelInput {
  client_id: string;
  client_name: string;
  vehicle_type: MotorVehicleClass;
  ex_showroom_price: number;
  age_months: number;
  zone: MotorZone;
  ncb_tier: NcbTier;
  gvw_kg?: number;
  opted_addons?: ImtAddonsInput;
}

export function validateAndComputeMotorStudioLedger(input: MotorStudioModelInput): {
  ledger_rows: Array<{ label: string; amount: number; description?: string }>;
  total_payable: number;
  ready_for_quote_slip: boolean;
} {
  if (!input.client_name) throw new Error('Client name is required');
  if (input.ex_showroom_price <= 0) throw new Error('Ex-showroom price must be positive');

  const idvRes = calculateMotorIdv({ ex_showroom_price: input.ex_showroom_price, age_months: input.age_months });
  const odRes = calculateMotorBaseOd({ total_idv: idvRes.total_idv, vehicle_class: input.vehicle_type, zone: input.zone });
  const ncbRes = calculateMotorFleetNcb({ gross_od_premium: odRes.gross_od_premium, ncb_tier: input.ncb_tier, fleet_size: 1 });
  const tpRes = calculateMotorTpTariff({ vehicle_class: input.vehicle_type, gvw_kg: input.gvw_kg, include_cpa: true, paid_drivers_count: 1 });

  let addOnTotal = 0;
  if (input.opted_addons) {
    const addons = calculateCommercialImtAddons({
      ...input.opted_addons,
      total_idv: idvRes.total_idv,
      gross_od_premium: odRes.gross_od_premium,
      vehicle_age_months: input.age_months,
    });
    addOnTotal = addons.total_addons_premium;
  }

  const netOd = ncbRes.net_od_premium;
  const netTp = tpRes.total_tp_premium;
  const netTotal = netOd + addOnTotal + netTp;
  const gst = Math.round(netTotal * 0.18);
  const payable = netTotal + gst;

  const rows = [
    { label: 'Insured Declared Value (IDV)', amount: idvRes.total_idv, description: `Depreciation ${(idvRes.depreciation_rate * 100).toFixed(0)}%` },
    { label: 'Basic Own Damage (OD)', amount: odRes.gross_od_premium, description: `Zone ${input.zone} rate ${odRes.base_od_rate_percent}%` },
    { label: 'No Claim Bonus (NCB) Discount', amount: -ncbRes.ncb_discount_amount, description: `${input.ncb_tier}% NCB applied` },
    { label: 'Net Own Damage Premium', amount: netOd },
    { label: 'Commercial IMT Add-ons', amount: addOnTotal },
    { label: 'Statutory Third Party (TP)', amount: tpRes.base_statutory_tp, description: 'IRDAI Gazetted Fixed Tariff' },
    { label: 'Compulsory CPA & Paid Driver', amount: tpRes.cpa_premium + tpRes.paid_driver_premium },
    { label: 'Total Statutory TP', amount: netTp },
    { label: 'Net Package Premium', amount: netTotal },
    { label: 'Goods & Services Tax (GST 18%)', amount: gst },
    { label: 'Total Premium Payable', amount: payable },
  ];

  return {
    ledger_rows: rows,
    total_payable: payable,
    ready_for_quote_slip: true,
  };
}

// ============================================================================
// 9. MARINE INLAND TRANSIT (ITC A/B/C) RATING (FEATURE 9)
// ============================================================================

export type MarineItcClause = 'ITC_A' | 'ITC_B' | 'ITC_C';
export type MarineCommodityHazard = 1 | 2 | 3 | 4;

export interface MarineInlandInput {
  invoice_value: number;
  transit_clause: MarineItcClause;
  commodity_hazard_class: MarineCommodityHazard;
  is_certified_common_carrier: boolean;
}

export function calculateMarineInlandTransit(input: MarineInlandInput): {
  base_rate_per_mille: number;
  net_marine_premium: number;
  policy_excess: number;
  deductible_clause: string;
} {
  if (input.invoice_value <= 0) {
    throw new Error('Invoice value must be greater than zero');
  }

  // Base rates in per mille (‰)
  const classRates: Record<MarineCommodityHazard, number> = {
    1: 0.06, // Steel, coal, non-fragile
    2: 0.12, // FMCG, textiles, auto parts
    3: 0.25, // Electronics, fragile glass
    4: 0.55, // Chemicals, pharma, hazardous
  };

  const clauseMultipliers: Record<MarineItcClause, number> = {
    ITC_A: 1.0,
    ITC_B: 0.80,
    ITC_C: 0.60,
  };

  const carrierMultiplier = input.is_certified_common_carrier ? 1.0 : 1.25;
  const ratePerMille = classRates[input.commodity_hazard_class] * clauseMultipliers[input.transit_clause] * carrierMultiplier;
  const rawPremium = (input.invoice_value * ratePerMille) / 1000;
  const netPremium = Math.max(1000, Math.round(rawPremium)); // Minimum statutory premium ₹1,000

  // Excess: 0.5% of value, minimum ₹2,500
  const excess = Math.max(2500, Math.round(input.invoice_value * 0.005));

  return {
    base_rate_per_mille: ratePerMille,
    net_marine_premium: netPremium,
    policy_excess: excess,
    deductible_clause: `0.5% of consignment value subject to minimum of ₹2,500 each and every loss`,
  };
}

// ============================================================================
// 10. MARINE OCEAN CARGO (ICC A/B/C) & INCOTERMS (FEATURE 10)
// ============================================================================

export type OceanIncoterm = 'CIF' | 'FOB' | 'CFR' | 'EXW';
export type OceanIccClause = 'ICC_A' | 'ICC_B' | 'ICC_C';

export interface MarineOceanInput {
  invoice_value_inr: number;
  incoterm: OceanIncoterm;
  icc_clause: OceanIccClause;
  ocean_freight_inr?: number;
  port_charges_inr?: number;
  customs_duty_opted?: boolean;
  customs_duty_rate_percent?: number;
  war_and_strikes_opted?: boolean;
}

export function calculateMarineOceanCargo(input: MarineOceanInput): {
  cargo_sum_insured: number;
  duty_sum_insured: number;
  total_sum_insured: number;
  cargo_premium: number;
  duty_premium: number;
  war_premium: number;
  net_marine_premium: number;
} {
  if (input.invoice_value_inr <= 0) {
    throw new Error('Invoice value must be greater than zero');
  }

  let baseShippableValue = input.invoice_value_inr;
  if (input.incoterm === 'FOB' || input.incoterm === 'CFR') {
    const freight = input.ocean_freight_inr || (input.invoice_value_inr * 0.10);
    const port = input.port_charges_inr || (input.invoice_value_inr * 0.02);
    baseShippableValue = input.invoice_value_inr + freight + port;
  } else if (input.incoterm === 'EXW') {
    const inland = input.invoice_value_inr * 0.05;
    const freight = input.ocean_freight_inr || (input.invoice_value_inr * 0.10);
    baseShippableValue = input.invoice_value_inr + inland + freight;
  }

  // 10% Imaginary Profit Markup
  const cargoSi = Math.round(baseShippableValue * 1.10);

  let dutySi = 0;
  if (input.customs_duty_opted) {
    const dutyRate = (input.customs_duty_rate_percent ?? 30) / 100;
    dutySi = Math.round(cargoSi * dutyRate);
  }

  // Base ocean cargo rate: ICC A = 0.35‰, ICC B = 0.26‰, ICC C = 0.18‰
  const iccRates: Record<OceanIccClause, number> = {
    ICC_A: 0.35,
    ICC_B: 0.26,
    ICC_C: 0.18,
  };
  const baseRate = iccRates[input.icc_clause];
  const cargoPremium = Math.round((cargoSi * baseRate) / 1000);

  // Duty rate is 50% of ocean base rate
  const dutyPremium = dutySi > 0 ? Math.round((dutySi * (baseRate * 0.50)) / 1000) : 0;

  // Institute War & Strikes Clauses: 0.05‰ on total SI
  let warPremium = 0;
  if (input.war_and_strikes_opted) {
    warPremium = Math.round((cargoSi * 0.05) / 1000);
  }

  const netPremium = Math.max(1000, cargoPremium + dutyPremium + warPremium);

  return {
    cargo_sum_insured: cargoSi,
    duty_sum_insured: dutySi,
    total_sum_insured: cargoSi + dutySi,
    cargo_premium: cargoPremium,
    duty_premium: dutyPremium,
    war_premium: warPremium,
    net_marine_premium: netPremium,
  };
}

// ============================================================================
// 11. MARINE OPEN POLICY (MOP) & ATPO DRAWDOWN (FEATURE 11)
// ============================================================================

export interface MopAccount {
  policy_number: string;
  deposit_premium_balance: number;
  total_sum_insured: number;
  utilized_sum_insured: number;
}

export function processMopDeclaration(
  account: MopAccount,
  consignment_value: number,
  rate_per_mille: number
): {
  updated_account: MopAccount;
  debit_amount: number;
  certificate_issued: boolean;
  warning?: string;
} {
  const premiumToDebit = Math.round((consignment_value * rate_per_mille) / 1000);

  if (account.deposit_premium_balance < premiumToDebit) {
    return {
      updated_account: account,
      debit_amount: 0,
      certificate_issued: false,
      warning: `CD_BALANCE_EXHAUSTED: Balance of ₹${account.deposit_premium_balance} is insufficient for debit ₹${premiumToDebit}. Top-up required under Sec 64VB.`,
    };
  }

  const updated: MopAccount = {
    ...account,
    deposit_premium_balance: account.deposit_premium_balance - premiumToDebit,
    utilized_sum_insured: account.utilized_sum_insured + consignment_value,
  };

  let warning: string | undefined;
  if (updated.deposit_premium_balance < 10000) {
    warning = 'LOW_CD_BALANCE_WARNING: Remaining balance is less than ₹10,000.';
  }

  return {
    updated_account: updated,
    debit_amount: premiumToDebit,
    certificate_issued: true,
    warning,
  };
}

// ============================================================================
// 12. MARINE CARGO STUDIO UI & DECLARATION FLOW (FEATURE 12)
// ============================================================================

export interface MarineStudioInput {
  client_name: string;
  policy_type: 'single_voyage' | 'open_policy' | 'atpo';
  origin: string;
  destination: string;
  commodity: string;
  consignment_value: number;
  clause: MarineItcClause | OceanIccClause;
}

export function validateMarineStudioProposal(input: MarineStudioInput): {
  is_valid: boolean;
  declaration_ready: boolean;
  error?: string;
} {
  if (!input.client_name) return { is_valid: false, declaration_ready: false, error: 'Client name is required' };
  if (!input.origin || !input.destination) return { is_valid: false, declaration_ready: false, error: 'Origin and Destination required' };
  if (input.consignment_value <= 0) return { is_valid: false, declaration_ready: false, error: 'Consignment value must be positive' };
  return { is_valid: true, declaration_ready: true };
}

// ============================================================================
// 13. GHI ACTUARIAL DEMOGRAPHIC AGE-BAND MATRIX (FEATURE 13)
// ============================================================================

export interface GhiAgeBandCount {
  age_0_25: number;
  age_26_35: number;
  age_36_45: number;
  age_46_55: number;
  age_56_65: number;
  age_66_75: number;
  age_76_plus: number;
}

export function calculateGhiDemographicPremium(
  bands: GhiAgeBandCount,
  base_sum_insured: number = 300000
): {
  total_lives: number;
  pure_risk_premium: number;
  si_scaling_factor: number;
  per_life_average: number;
} {
  const baseRates = {
    age_0_25: 2800,
    age_26_35: 4200,
    age_36_45: 6500,
    age_46_55: 11200,
    age_56_65: 18500,
    age_66_75: 26000,
    age_76_plus: 32000,
  };

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
  const siScaling = Math.pow(base_sum_insured / 300000, 0.65);
  const adjustedPurePremium = Math.round(rawPurePremium * siScaling);

  return {
    total_lives: totalLives,
    pure_risk_premium: adjustedPurePremium,
    si_scaling_factor: Math.round(siScaling * 1000) / 1000,
    per_life_average: Math.round(adjustedPurePremium / totalLives),
  };
}

// ============================================================================
// 14. GHI BENEFIT CUSTOMIZER & LOADINGS (FEATURE 14)
// ============================================================================

export type RoomRentOption = 'standard_1_percent' | 'single_private_room' | 'no_capping';

export interface GhiBenefitOptions {
  room_rent: RoomRentOption;
  maternity_opted: boolean;
  maternity_day_1_waiver: boolean;
  ped_waiver_day_1: boolean;
  corporate_buffer_amount: number;
  group_size: number;
}

export function calculateGhiBenefitLoadings(
  pure_premium: number,
  options: GhiBenefitOptions
): {
  loading_percent: number;
  loaded_premium: number;
  corporate_buffer_premium: number;
  total_ghi_premium: number;
} {
  let loadingPct = 0;

  if (options.room_rent === 'single_private_room') loadingPct += 8;
  else if (options.room_rent === 'no_capping') loadingPct += 15;

  if (options.maternity_opted) {
    loadingPct += 10;
    if (options.maternity_day_1_waiver) {
      loadingPct += 5; // 9-month waiting period waived
    }
  }

  if (options.ped_waiver_day_1) {
    loadingPct += 12;
  }

  const loadedPremium = Math.round(pure_premium * (1 + loadingPct / 100));

  let bufferPremium = 0;
  if (options.corporate_buffer_amount > 0) {
    if (options.group_size < 50) {
      throw new Error('Corporate buffer requires minimum group size of 50 lives');
    }
    bufferPremium = Math.round(options.corporate_buffer_amount * 0.035);
  }

  return {
    loading_percent: loadingPct,
    loaded_premium: loadedPremium,
    corporate_buffer_premium: bufferPremium,
    total_ghi_premium: loadedPremium + bufferPremium,
  };
}

// ============================================================================
// 15. GROUP TERM LIFE (GTLI) MORTALITY ENGINE (FEATURE 15)
// ============================================================================

export interface GtliMember {
  age: number;
  sum_insured: number;
  hazard_class?: 1 | 2 | 3;
}

export function calculateGtliPremium(
  members: GtliMember[],
  free_cover_limit: number = 5000000
): {
  total_members: number;
  total_sum_insured: number;
  total_gtli_premium: number;
  members_requiring_medical: number;
} {
  if (members.length === 0) throw new Error('No members provided for GTLI');

  // IALM 2012-14 benchmark rates per mille
  const getQx = (age: number): number => {
    if (age <= 25) return 0.88;
    if (age <= 35) return 1.05;
    if (age <= 45) return 1.80;
    if (age <= 55) return 4.95;
    return 11.50;
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

// ============================================================================
// 16. GROUP PERSONAL ACCIDENT (GPA) ENGINE (FEATURE 16)
// ============================================================================

export interface GpaInput {
  sum_insured_per_life: number;
  headcount: number;
  hazard_class: 1 | 2 | 3;
  ttd_opted: boolean;
  medical_extension_opted: boolean;
}

export function calculateGpaPremium(input: GpaInput): {
  rate_per_mille: number;
  base_gpa_premium: number;
  ttd_premium: number;
  medical_premium: number;
  total_gpa_premium: number;
} {
  const rates: Record<1 | 2 | 3, number> = {
    1: 0.35, // IT / Office
    2: 0.65, // Field / Light Mfg
    3: 1.50, // Heavy / Hazardous
  };

  const totalSi = input.sum_insured_per_life * input.headcount;
  const baseRate = rates[input.hazard_class];
  const basePrem = Math.round((totalSi * baseRate) / 1000);

  // TTD: 0.15‰
  const ttdPrem = input.ttd_opted ? Math.round((totalSi * 0.15) / 1000) : 0;
  // Medical: 10% on base
  const medPrem = input.medical_extension_opted ? Math.round(basePrem * 0.10) : 0;

  return {
    rate_per_mille: baseRate,
    base_gpa_premium: basePrem,
    ttd_premium: ttdPrem,
    medical_premium: medPrem,
    total_gpa_premium: basePrem + ttdPrem + medPrem,
  };
}

// ============================================================================
// 17. STATUTORY WORKMEN'S COMPENSATION (WC) ENGINE (FEATURE 17)
// ============================================================================

export interface WcWorker {
  age: number;
  monthly_wage: number;
}

export interface WcInput {
  workers: WcWorker[];
  trade_hazard_rate_percent: number; // e.g. 0.45% for light mfg, 1.10% for foundry
  medical_extension_opted: boolean;
}

export function calculateWorkmensCompensation(input: WcInput): {
  total_workers: number;
  total_annual_wageroll: number;
  statutory_death_liability: number;
  statutory_ptd_liability: number;
  net_wc_premium: number;
} {
  if (input.workers.length === 0) throw new Error('Worker list cannot be empty');

  // Schedule IV EC Act 1923 Age Factors
  const getScheduleIvFactor = (age: number): number => {
    if (age <= 20) return 224.00;
    if (age <= 25) return 216.91;
    if (age <= 30) return 207.98;
    if (age <= 35) return 197.06;
    if (age <= 40) return 184.17;
    if (age <= 45) return 169.44;
    if (age <= 50) return 153.09;
    if (age <= 55) return 135.56;
    return 117.41;
  };

  let totalAnnualWages = 0;
  let totalDeathLiability = 0;
  let totalPtdLiability = 0;

  for (const w of input.workers) {
    totalAnnualWages += w.monthly_wage * 12;
    // Statutory wage ceiling ₹15,000
    const cappedWage = Math.min(w.monthly_wage, 15000);
    const factor = getScheduleIvFactor(w.age);

    // Death: 50% * cappedWage * factor, min ₹1,20,000
    const deathComp = Math.max(120000, 0.50 * cappedWage * factor);
    // PTD: 60% * cappedWage * factor, min ₹1,40,000
    const ptdComp = Math.max(140000, 0.60 * cappedWage * factor);

    totalDeathLiability += deathComp;
    totalPtdLiability += ptdComp;
  }

  // Tariff on total wage roll
  let baseWcPrem = (totalAnnualWages * input.trade_hazard_rate_percent) / 100;
  if (input.medical_extension_opted) {
    baseWcPrem *= 1.25; // +25% loading
  }

  return {
    total_workers: input.workers.length,
    total_annual_wageroll: totalAnnualWages,
    statutory_death_liability: Math.round(totalDeathLiability),
    statutory_ptd_liability: Math.round(totalPtdLiability),
    net_wc_premium: Math.round(baseWcPrem),
  };
}

// ============================================================================
// 18. BULK EMPLOYEE CENSUS SPREADSHEET INGESTION (FEATURE 18)
// ============================================================================

export interface CensusRow {
  employee_id: string;
  name: string;
  age: number;
  gender: 'M' | 'F' | 'O';
  relationship: 'self' | 'spouse' | 'child' | 'parent';
  monthly_salary?: number;
}

export function parseEmployeeCensusRoster(rows: CensusRow[]): {
  total_lives: number;
  employee_count: number;
  dependent_count: number;
  age_bands: GhiAgeBandCount;
  total_monthly_wage_roll: number;
  invalid_rows: Array<{ employee_id: string; reason: string }>;
} {
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

// ============================================================================
// 19. EMPLOYEE BENEFITS STUDIO UI MODEL (FEATURE 19)
// ============================================================================

export interface BenefitsStudioInput {
  corporate_name: string;
  census: CensusRow[];
  ghi_base_si: number;
  room_rent: RoomRentOption;
  maternity_opted: boolean;
  gtli_sum_insured?: number;
  gpa_hazard_class?: 1 | 2 | 3;
}

export function computeBenefitsStudioLedger(input: BenefitsStudioInput): {
  ghi_premium: number;
  gtli_premium: number;
  gpa_premium: number;
  wc_premium: number;
  package_net_premium: number;
  package_gst: number;
  total_payable: number;
} {
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

  const gtliMembers = input.census.filter(c => c.relationship === 'self').map(c => ({
    age: c.age,
    sum_insured: input.gtli_sum_insured || 1000000,
  }));
  const gtliRes = gtliMembers.length > 0 ? calculateGtliPremium(gtliMembers) : { total_gtli_premium: 0 };

  const gpaRes = input.gpa_hazard_class
    ? calculateGpaPremium({
        sum_insured_per_life: 500000,
        headcount: parsed.employee_count,
        hazard_class: input.gpa_hazard_class,
        ttd_opted: true,
        medical_extension_opted: true,
      })
    : { total_gpa_premium: 0 };

  const wcWorkers = input.census.filter(c => c.relationship === 'self').map(c => ({
    age: c.age,
    monthly_wage: c.monthly_salary || 25000,
  }));
  const wcRes = calculateWorkmensCompensation({
    workers: wcWorkers,
    trade_hazard_rate_percent: 0.35,
    medical_extension_opted: true,
  });

  const net = ghiLoaded.total_ghi_premium + gtliRes.total_gtli_premium + gpaRes.total_gpa_premium + wcRes.net_wc_premium;
  const gst = Math.round(net * 0.18);

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
// 20. CAR / EAR PROJECT LIFECYCLE ENGINE (FEATURE 20)
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
  const civilRate = 1.20;
  const plantRate = 1.80;
  const durationFactor = Math.max(1.0, input.contract_period_months / 12);

  const baseCivil = (input.civil_works_value * civilRate * durationFactor) / 1000;
  const basePlant = (input.plant_machinery_value * plantRate * durationFactor) / 1000;
  const baseWorks = Math.round(baseCivil + basePlant);

  // Testing period (EAR): 1 month included, extra at 0.75‰ per month on Plant
  let testingPrem = 0;
  if (input.project_type === 'ear' && (input.testing_period_months ?? 0) > 1) {
    const extraMonths = (input.testing_period_months ?? 0) - 1;
    testingPrem = Math.round((input.plant_machinery_value * (extraMonths * 0.75)) / 1000);
  }

  // Maintenance DLP: 12 mos = 15%, 24 mos = 25% of base
  let maintPrem = 0;
  if ((input.dlp_maintenance_months ?? 0) >= 24) {
    maintPrem = Math.round(baseWorks * 0.25);
  } else if ((input.dlp_maintenance_months ?? 0) >= 12) {
    maintPrem = Math.round(baseWorks * 0.15);
  }

  // Perils: EQ Zone 1: 0.50‰, Zone 2: 0.35‰, Zone 3: 0.25‰, Zone 4: 0.10‰
  const eqRates = { 1: 0.50, 2: 0.35, 3: 0.25, 4: 0.10 };
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
// 21. MACHINERY BREAKDOWN (MB) ENGINE (FEATURE 21)
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
  const groupRates = { 1: 0.0090, 2: 0.0150, 3: 0.0250, 4: 0.0400 };
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
// 22. ELECTRONIC EQUIPMENT INSURANCE (EEI) ENGINE (FEATURE 22)
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

  let s1Rate = 0.0125;
  if (input.is_portable_laptop) {
    s1Rate += 0.0250; // Worldwide portable loading
  }
  const s1Prem = Math.round(input.section1_hardware_crv * s1Rate);

  const s2Si = input.section2_data_media_si || 0;
  const s2Prem = Math.round(s2Si * 0.0300);

  let s3Prem = 0;
  if (input.section3_icow_si && input.section3_icow_months) {
    const icowRates = { 3: 0.0150, 6: 0.0250, 12: 0.0400 };
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
// 23. BOILER & PRESSURE PLANT (BPP) ENGINE (FEATURE 23)
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

  let rate = input.vessel_type === 'water_tube' ? 0.0100 : 0.0075;
  let base = input.replacement_value * rate;

  let surcharge = 0;
  if (input.operating_pressure_bar > 20) {
    surcharge = Math.round(base * 0.20); // +20% high-pressure surcharge
  }

  let tpl = 0;
  if (input.tpl_limit) {
    tpl = Math.round(input.tpl_limit * 0.0050);
  }

  return {
    base_bpp_premium: Math.round(base),
    high_pressure_surcharge: surcharge,
    tpl_premium: tpl,
    total_bpp_premium: Math.round(base) + surcharge + tpl,
  };
}

// ============================================================================
// 24. FIXED ASSET REGISTER (FAR) TABULAR PARSER (FEATURE 24)
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
// 25. ENGINEERING STUDIO UI MODEL (FEATURE 25)
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
// 26. CGL TURNOVER & AOA:AOY LIMIT RATIO ENGINE (FEATURE 26)
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
// 27. PROFESSIONAL INDEMNITY (PI / E&O) ENGINE (FEATURE 27)
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
// 28. DIRECTORS & OFFICERS (D&O) ENGINE (FEATURE 28)
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
// 29. DETERMINISTIC CYBER POSTURE SCORING MATRIX (FEATURE 29)
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
// 30. COMMERCIAL CRIME & FIDELITY ENGINE (FEATURE 30)
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
// 31. CORPORATE LIABILITY STUDIO UI MODEL (FEATURE 31)
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
// 32. SURETY INSURANCE BOND ENGINE (FEATURE 32)
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

export function calculateSuretyBondPremium(input: SuretyBondInput): {
  annual_rate_percent: number;
  required_collateral_margin_percent: number;
  tenure_pro_rata_factor: number;
  total_bond_premium: number;
  credit_limit_breach: boolean;
} {
  if (input.bond_value <= 0) throw new Error('Bond value must be positive');
  if (input.tenure_months <= 0) throw new Error('Tenure must be at least 1 month');

  // Single project capacity limit: max 100% of Net Worth
  const isBreached = input.bond_value > input.contractor_net_worth;

  const baseRates: Record<SuretyBondType, number> = {
    bid_bond: 1.00,
    performance_bond: 1.50,
    advance_payment: 1.75,
    retention_money: 1.25,
  };

  const gradeMultipliers: Record<ContractorFinancialGrade, { mult: number; margin: number }> = {
    AAA: { mult: 0.80, margin: 0 },
    AA: { mult: 1.00, margin: 5 },
    A: { mult: 1.25, margin: 10 },
    BBB: { mult: 1.65, margin: 15 },
    BB: { mult: 2.20, margin: 25 },
  };

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
// 33. TRADE CREDIT INSURANCE (TCI) ENGINE (FEATURE 33)
// ============================================================================

export interface TradeCreditInput {
  insurable_turnover: number;
  average_credit_days: 30 | 60 | 90 | 120;
  top_10_buyers_turnover_share_percent: number;
  requested_indemnity_percent: number; // statutory max 90%
}

export function calculateTradeCreditPremium(input: TradeCreditInput): {
  base_rate_percent: number;
  concentration_loading_percent: number;
  clamped_indemnity_percent: number;
  net_tci_premium: number;
} {
  if (input.insurable_turnover <= 0) throw new Error('Insurable turnover must be positive');

  // Statutory IRDAI TCI regulations cap indemnity at 90%
  const indemnity = Math.min(90, Math.max(50, input.requested_indemnity_percent));

  const creditRates: Record<30 | 60 | 90 | 120, number> = {
    30: 0.25,
    60: 0.35,
    90: 0.45,
    120: 0.60,
  };

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
// 34. FINANCIAL & SPECIALTY STUDIO UI MODEL (FEATURE 34)
// ============================================================================

export interface SpecialtyStudioInput {
  contractor_or_applicant: string;
  pan_number: string;
  selected_product: 'surety_bond' | 'trade_credit';
  principal_amount: number;
}

export function validateSpecialtyStudioInput(input: SpecialtyStudioInput): {
  is_valid: boolean;
  contract_ready: boolean;
  error?: string;
} {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (!input.contractor_or_applicant) return { is_valid: false, contract_ready: false, error: 'Applicant name is required' };
  if (!panRegex.test(input.pan_number.toUpperCase())) return { is_valid: false, contract_ready: false, error: 'Invalid Indian PAN format' };
  if (input.principal_amount <= 0) return { is_valid: false, contract_ready: false, error: 'Principal amount must be positive' };
  return { is_valid: true, contract_ready: true };
}
