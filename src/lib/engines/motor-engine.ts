/**
 * Pure Deterministic Commercial Motor & Fleet Underwriting Engine
 *
 * Implements:
 * 1. AIMT General Regulation 8 (GR.8) statutory IDV age depreciation schedule (5% to 50%, > 5 yrs surveyor alert).
 * 2. Total IDV calculation = Depreciated Chassis + Depreciated Accessories + Depreciated Bi-Fuel (CNG/LPG) Kit.
 * 3. Commercial Vehicle Classification: GCV Public Carrier, GCV Private Carrier, PCV Bus, PCV Taxi, Misc Digger/Crane.
 * 4. Zone Rating: Zone A, Zone B, Zone C base Own Damage (OD) rate slabs.
 * 5. Commercial IMT Add-on Suite: IMT 23 (15% Gross OD), Zero Depreciation (age-tiered), Consumables (0.25% IDV),
 *    Engine Protector (0.35% IDV), Return to Invoice (0.40% IDV, <= 5 yrs), Roadside Assistance (RSA).
 * 6. No Claim Bonus (NCB) ladder: 0%, 20%, 25%, 35%, 45%, 50% applied strictly to Gross OD.
 * 7. Fleet Volume Discounts (5-15: 5%, 16-50: 10%, >50: 15%) and Adverse Incurred Claim Ratio (ICR) loading (>80%: +15% to +35%).
 * 8. IRDAI Gazetted Statutory Third Party (TP) Tariff table: Immutable fixed TP rates across GVW/seating brackets.
 *    STRICT STATUTORY RULE: TP rates cannot be discounted (0% discount enforced).
 * 9. Compulsory PA Owner-Driver (₹275) and Legal Liability to Paid Drivers under IMT 28 (₹50/driver).
 * 10. Net & Gross Premium calculation with 18% GST rounding and algorithmic explainability vector.
 *
 * Zero external network calls. Zero LLM arithmetic. 100% deterministic pure TypeScript.
 */

import { LOBCategory, InsuranceLine, StandardQuoteBreakdown } from '@/types/database';

export type MotorVehicleType =
  | 'gcv_public'
  | 'gcv_private'
  | 'pcv_bus'
  | 'pcv_taxi'
  | 'misc_digger_crane';

export type MotorZone = 'A' | 'B' | 'C';

export type NcbTier = 0 | 20 | 25 | 35 | 45 | 50;

export interface CommercialAddonOptions {
  imt23?: boolean;
  zero_dep?: boolean;
  consumables?: boolean;
  engine_protect?: boolean;
  return_to_invoice?: boolean;
  roadside_assistance?: boolean;
}

export interface VehicleIdvInput {
  ex_showroom_price: number;
  vehicle_age_months?: number;
  purchase_date?: string; // ISO date format YYYY-MM-DD
  reference_date?: string; // ISO date format YYYY-MM-DD (defaults to current date)
  electrical_accessories_value?: number;
  non_electrical_accessories_value?: number;
  cng_lpg_kit_value?: number;
  surveyor_agreed_idv?: number; // Optional agreed valuation when age > 60 months
}

export interface VehicleIdvResult {
  depreciation_rate: number;
  depreciation_percent: number;
  depreciated_chassis: number;
  depreciated_electrical: number;
  depreciated_non_electrical: number;
  depreciated_cng_kit: number;
  total_idv: number;
  age_months: number;
  surveyor_valuation_required: boolean;
  warning?: string;
}

export interface MotorFleetInput {
  vehicle_type: MotorVehicleType;
  zone: MotorZone;
  ex_showroom_price: number;
  vehicle_age_months?: number;
  purchase_date?: string;
  reference_date?: string;
  gvw_kg?: number;
  seating_capacity?: number;
  cubic_capacity?: number;
  electrical_accessories_value?: number;
  non_electrical_accessories_value?: number;
  cng_lpg_kit_value?: number;
  surveyor_agreed_idv?: number;
  ncb_tier?: NcbTier;
  fleet_size?: number;
  past_claims_ratio_percent?: number;
  opted_addons?: CommercialAddonOptions;
  cpa_owner_driver_opted?: boolean;
  paid_drivers_count?: number;
  cleaners_conductors_count?: number;
  registration_number?: string;
  make_model?: string;
}

export interface AddonsBreakdown {
  imt23_inr: number;
  zero_dep_inr: number;
  consumables_inr: number;
  engine_protect_inr: number;
  return_to_invoice_inr: number;
  roadside_assistance_inr: number;
  total_addons_inr: number;
}

export interface TpBreakdown {
  statutory_tp_base_inr: number;
  pa_owner_driver_inr: number;
  paid_drivers_inr: number;
  cleaners_inr: number;
  total_tp_premium: number;
  statutory_discount_percent: 0; // Strictly non-discountable
}

export interface FleetAdjustmentResult {
  fleet_size: number;
  past_claims_ratio_percent: number;
  fleet_discount_percent: number;
  fleet_discount_inr: number;
  fleet_loading_percent: number;
  fleet_loading_inr: number;
  is_loading_applied: boolean;
  notes: string;
}

export interface MotorQuoteLineBreakdown {
  registration_number?: string;
  make_model?: string;
  vehicle_class: MotorVehicleType;
  zone: MotorZone;
  vehicle_age_months: number;
  depreciation_percent: number;
  chassis_idv: number;
  electrical_accessories_idv: number;
  non_electrical_accessories_idv: number;
  cng_kit_idv: number;
  total_idv: number;
  base_od_rate_percent: number;
  gross_od_premium: number;
  ncb_tier: NcbTier;
  ncb_discount_inr: number;
  fleet_size: number;
  fleet_discount_percent: number;
  fleet_discount_inr: number;
  fleet_loading_percent: number;
  fleet_loading_inr: number;
  past_claims_ratio_percent: number;
  addons_breakdown: AddonsBreakdown;
  net_od_premium: number;
  tp_breakdown: TpBreakdown;
  total_net_premium: number;
  gst_rate_percent: 18;
  gst_amount: number;
  total_gross_premium: number;
  surveyor_valuation_required: boolean;
  underwriting_warnings: string[];
}

export interface FleetMetadata {
  fleet_name?: string;
  policyholder_name?: string;
  fleet_size?: number;
  past_claims_ratio_percent?: number;
}

export interface FleetQuoteBreakdown {
  lob_category: LOBCategory;
  insurance_line: InsuranceLine;
  total_vehicles: number;
  total_fleet_idv: number;
  total_gross_od: number;
  total_addons: number;
  total_ncb_discount: number;
  total_fleet_discount: number;
  total_fleet_loading: number;
  total_net_od: number;
  total_tp: number;
  total_net_premium: number;
  gst_rate_percent: 18;
  gst_amount: number;
  total_gross_premium: number;
  vehicles: StandardQuoteBreakdown[];
  fleet_summary: {
    public_carriers_count: number;
    private_carriers_count: number;
    buses_count: number;
    taxis_count: number;
    misc_count: number;
    surveyor_inspection_alerts_count: number;
  };
  statutory_clauses: string[];
}

/**
 * Calculates completed age of the vehicle in months.
 */
export function calculateVehicleAgeInMonths(
  purchaseDateStr?: string,
  referenceDateStr?: string,
  fallbackAgeMonths?: number
): number {
  if (fallbackAgeMonths !== undefined && fallbackAgeMonths !== null && fallbackAgeMonths >= 0) {
    return Math.floor(fallbackAgeMonths);
  }
  if (!purchaseDateStr) {
    return 0;
  }
  const purchase = new Date(purchaseDateStr);
  if (isNaN(purchase.getTime())) {
    return fallbackAgeMonths && fallbackAgeMonths >= 0 ? Math.floor(fallbackAgeMonths) : 0;
  }
  const ref = referenceDateStr ? new Date(referenceDateStr) : new Date();
  if (isNaN(ref.getTime())) {
    return 0;
  }

  const diffYears = ref.getFullYear() - purchase.getFullYear();
  const diffMonths = ref.getMonth() - purchase.getMonth();
  let totalMonths = diffYears * 12 + diffMonths;
  if (ref.getDate() < purchase.getDate()) {
    totalMonths -= 1;
  }
  return Math.max(0, totalMonths);
}

/**
 * AIMT GR.8 Statutory IDV Depreciation Schedule
 */
export function getAimtIdvDepreciation(ageMonths: number): {
  rate: number;
  percent: number;
  surveyorRequired: boolean;
  warning?: string;
} {
  if (ageMonths <= 6) {
    return { rate: 0.05, percent: 5, surveyorRequired: false };
  } else if (ageMonths <= 12) {
    return { rate: 0.15, percent: 15, surveyorRequired: false };
  } else if (ageMonths <= 24) {
    return { rate: 0.20, percent: 20, surveyorRequired: false };
  } else if (ageMonths <= 36) {
    return { rate: 0.30, percent: 30, surveyorRequired: false };
  } else if (ageMonths <= 48) {
    return { rate: 0.40, percent: 40, surveyorRequired: false };
  } else if (ageMonths <= 60) {
    return { rate: 0.50, percent: 50, surveyorRequired: false };
  } else {
    return {
      rate: 0.50,
      percent: 50,
      surveyorRequired: true,
      warning:
        'AIMT GR.8 Alert: Vehicle age exceeds 5 years (60 months). Valuation requires Surveyor inspection and mutually agreed IDV.',
    };
  }
}

/**
 * Computes Insured Declared Value (IDV) for Chassis, Accessories, and Bi-fuel kits.
 */
export function calculateVehicleIdv(input: VehicleIdvInput): VehicleIdvResult {
  const ageMonths = calculateVehicleAgeInMonths(
    input.purchase_date,
    input.reference_date,
    input.vehicle_age_months
  );
  const dep = getAimtIdvDepreciation(ageMonths);

  if (ageMonths > 60 && input.surveyor_agreed_idv !== undefined && input.surveyor_agreed_idv > 0) {
    const totalIdv = Math.round(input.surveyor_agreed_idv);
    return {
      depreciation_rate: dep.rate,
      depreciation_percent: dep.percent,
      depreciated_chassis: totalIdv,
      depreciated_electrical: 0,
      depreciated_non_electrical: 0,
      depreciated_cng_kit: 0,
      total_idv: totalIdv,
      age_months: ageMonths,
      surveyor_valuation_required: true,
      warning: 'Surveyor-agreed IDV applied for vehicle aged > 5 years.',
    };
  }

  const exShowroom = Math.max(0, input.ex_showroom_price || 0);
  const electrical = Math.max(0, input.electrical_accessories_value || 0);
  const nonElectrical = Math.max(0, input.non_electrical_accessories_value || 0);
  const cngKit = Math.max(0, input.cng_lpg_kit_value || 0);

  const depreciated_chassis = Math.round(exShowroom * (1 - dep.rate));
  const depreciated_electrical = Math.round(electrical * (1 - dep.rate));
  const depreciated_non_electrical = Math.round(nonElectrical * (1 - dep.rate));
  const depreciated_cng_kit = Math.round(cngKit * (1 - dep.rate));

  const total_idv =
    depreciated_chassis +
    depreciated_electrical +
    depreciated_non_electrical +
    depreciated_cng_kit;

  return {
    depreciation_rate: dep.rate,
    depreciation_percent: dep.percent,
    depreciated_chassis,
    depreciated_electrical,
    depreciated_non_electrical,
    depreciated_cng_kit,
    total_idv,
    age_months: ageMonths,
    surveyor_valuation_required: dep.surveyorRequired,
    warning: dep.warning,
  };
}

/**
 * Returns base Own Damage (OD) rate percentage based on Vehicle Type, Zone, GVW, Seating, or CC.
 */
export function getBaseOdRate(
  vehicleType: MotorVehicleType,
  zone: MotorZone,
  gvwKg: number = 0,
  seatingCapacity: number = 0,
  cubicCapacity: number = 0
): number {
  const normZone: MotorZone = zone === 'A' || zone === 'B' || zone === 'C' ? zone : 'C';

  switch (vehicleType) {
    case 'gcv_public': {
      if (gvwKg <= 7500) {
        return normZone === 'A' ? 1.72 : normZone === 'B' ? 1.68 : 1.60;
      } else if (gvwKg <= 12000) {
        return normZone === 'A' ? 1.78 : normZone === 'B' ? 1.73 : 1.65;
      } else if (gvwKg <= 20000) {
        return normZone === 'A' ? 1.85 : normZone === 'B' ? 1.80 : 1.70;
      } else if (gvwKg <= 40000) {
        return normZone === 'A' ? 1.95 : normZone === 'B' ? 1.89 : 1.78;
      } else {
        return normZone === 'A' ? 2.05 : normZone === 'B' ? 1.98 : 1.85;
      }
    }
    case 'gcv_private': {
      if (gvwKg <= 7500) {
        return normZone === 'A' ? 1.45 : normZone === 'B' ? 1.40 : 1.35;
      } else if (gvwKg <= 12000) {
        return normZone === 'A' ? 1.50 : normZone === 'B' ? 1.45 : 1.40;
      } else if (gvwKg <= 20000) {
        return normZone === 'A' ? 1.58 : normZone === 'B' ? 1.52 : 1.45;
      } else if (gvwKg <= 40000) {
        return normZone === 'A' ? 1.65 : normZone === 'B' ? 1.60 : 1.52;
      } else {
        return normZone === 'A' ? 1.75 : normZone === 'B' ? 1.68 : 1.60;
      }
    }
    case 'pcv_bus': {
      if (seatingCapacity <= 18) {
        return normZone === 'A' ? 1.50 : normZone === 'B' ? 1.45 : 1.40;
      } else if (seatingCapacity <= 36) {
        return normZone === 'A' ? 1.65 : normZone === 'B' ? 1.60 : 1.52;
      } else {
        return normZone === 'A' ? 1.80 : normZone === 'B' ? 1.72 : 1.65;
      }
    }
    case 'pcv_taxi': {
      if (cubicCapacity <= 1000) {
        return normZone === 'A' ? 1.55 : normZone === 'B' ? 1.50 : 1.45;
      } else if (cubicCapacity <= 1500) {
        return normZone === 'A' ? 1.68 : normZone === 'B' ? 1.62 : 1.55;
      } else {
        return normZone === 'A' ? 1.82 : normZone === 'B' ? 1.75 : 1.68;
      }
    }
    case 'misc_digger_crane': {
      return normZone === 'A' ? 1.40 : normZone === 'B' ? 1.35 : 1.30;
    }
    default:
      return 1.60;
  }
}

/**
 * Calculates commercial endorsements / IMT add-ons.
 */
export function calculateCommercialAddons(
  grossOd: number,
  totalIdv: number,
  ageMonths: number,
  options: CommercialAddonOptions = {}
): {
  breakdown: AddonsBreakdown;
  warnings: string[];
} {
  const warnings: string[] = [];
  let imt23_inr = 0;
  let zero_dep_inr = 0;
  let consumables_inr = 0;
  let engine_protect_inr = 0;
  let return_to_invoice_inr = 0;
  let roadside_assistance_inr = 0;

  // IMT 23: 15% of Gross OD
  if (options.imt23) {
    imt23_inr = Math.round(grossOd * 0.15);
  }

  // Zero Depreciation: Age-tiered % of IDV (disallowed if > 60 months)
  if (options.zero_dep) {
    if (ageMonths > 60) {
      warnings.push(
        'Zero Depreciation is disallowed under commercial underwriting rules for vehicles older than 5 years (60 months).'
      );
    } else {
      let zeroDepRate = 0.0065; // <= 12 months: 0.65%
      if (ageMonths > 48) {
        zeroDepRate = 0.0125; // 48-60 months: 1.25%
      } else if (ageMonths > 36) {
        zeroDepRate = 0.0105; // 36-48 months: 1.05%
      } else if (ageMonths > 24) {
        zeroDepRate = 0.0090; // 24-36 months: 0.90%
      } else if (ageMonths > 12) {
        zeroDepRate = 0.0075; // 12-24 months: 0.75%
      }
      zero_dep_inr = Math.round(totalIdv * zeroDepRate);
    }
  }

  // Consumables: 0.25% of Total IDV
  if (options.consumables) {
    consumables_inr = Math.round(totalIdv * 0.0025);
  }

  // Engine Protector: 0.35% of Total IDV
  if (options.engine_protect) {
    engine_protect_inr = Math.round(totalIdv * 0.0035);
  }

  // Return to Invoice (RTI): 0.40% of Total IDV (disallowed if > 60 months)
  if (options.return_to_invoice) {
    if (ageMonths > 60) {
      warnings.push(
        'Return to Invoice (RTI) is disallowed for vehicles older than 5 years (60 months).'
      );
    } else {
      return_to_invoice_inr = Math.round(totalIdv * 0.0040);
    }
  }

  // Roadside Assistance (RSA): flat ₹500 or 0.1% of IDV, whichever is greater
  if (options.roadside_assistance) {
    roadside_assistance_inr = Math.max(500, Math.round(totalIdv * 0.001));
  }

  const total_addons_inr =
    imt23_inr +
    zero_dep_inr +
    consumables_inr +
    engine_protect_inr +
    return_to_invoice_inr +
    roadside_assistance_inr;

  return {
    breakdown: {
      imt23_inr,
      zero_dep_inr,
      consumables_inr,
      engine_protect_inr,
      return_to_invoice_inr,
      roadside_assistance_inr,
      total_addons_inr,
    },
    warnings,
  };
}

/**
 * Calculates fleet volume discount or adverse claims loading based on past 3-year ICR.
 */
export function calculateFleetAdjustment(
  fleetSize: number = 1,
  pastClaimsRatio: number = 0,
  grossOd: number
): FleetAdjustmentResult {
  const size = Math.max(1, fleetSize);
  const icr = Math.max(0, pastClaimsRatio);

  if (icr > 80) {
    let loadingPercent = 15;
    if (icr > 150) {
      loadingPercent = 35;
    } else if (icr > 100) {
      loadingPercent = 25;
    }
    const loadingInr = Math.round(grossOd * (loadingPercent / 100));
    return {
      fleet_size: size,
      past_claims_ratio_percent: icr,
      fleet_discount_percent: 0,
      fleet_discount_inr: 0,
      fleet_loading_percent: loadingPercent,
      fleet_loading_inr: loadingInr,
      is_loading_applied: true,
      notes: `Adverse Claims Loading: Past 3-year ICR is ${icr}%, exceeding statutory 80% threshold. Surcharge of +${loadingPercent}% applied on Gross OD.`,
    };
  }

  let discountPercent = 0;
  if (size > 50) {
    discountPercent = 15;
  } else if (size >= 16) {
    discountPercent = 10;
  } else if (size >= 5) {
    discountPercent = 5;
  }

  const discountInr = Math.round(grossOd * (discountPercent / 100));
  return {
    fleet_size: size,
    past_claims_ratio_percent: icr,
    fleet_discount_percent: discountPercent,
    fleet_discount_inr: discountInr,
    fleet_loading_percent: 0,
    fleet_loading_inr: 0,
    is_loading_applied: false,
    notes:
      discountPercent > 0
        ? `Fleet Volume Discount: Fleet of ${size} vehicles qualifies for ${discountPercent}% discount.`
        : 'Standard vehicle rating (no fleet volume discount applied).',
  };
}

/**
 * Looks up statutory IRDAI gazetted fixed Third Party (TP) rates.
 */
export function getStatutoryTpPremium(
  vehicleType: MotorVehicleType,
  gvwKg: number = 0,
  seatingCapacity: number = 0,
  cubicCapacity: number = 0
): number {
  switch (vehicleType) {
    case 'gcv_public': {
      if (gvwKg <= 7500) return 16049;
      if (gvwKg <= 12000) return 27486;
      if (gvwKg <= 20000) return 35313;
      if (gvwKg <= 40000) return 44242;
      return 45512;
    }
    case 'gcv_private': {
      if (gvwKg <= 7500) return 10750;
      if (gvwKg <= 12000) return 18416;
      if (gvwKg <= 20000) return 23660;
      if (gvwKg <= 40000) return 29642;
      return 30493;
    }
    case 'pcv_bus': {
      const seats = Math.max(0, seatingCapacity);
      return 14350 + seats * 948;
    }
    case 'pcv_taxi': {
      const seats = Math.max(0, seatingCapacity);
      const perSeat = seats * 948;
      if (cubicCapacity <= 1000) return 6171 + perSeat;
      if (cubicCapacity <= 1500) return 8995 + perSeat;
      return 10480 + perSeat;
    }
    case 'misc_digger_crane': {
      return 7888;
    }
    default:
      return 16049;
  }
}

/**
 * Computes complete statutory TP liability breakdown.
 */
export function calculateTpBreakdown(
  vehicleType: MotorVehicleType,
  gvwKg: number = 0,
  seatingCapacity: number = 0,
  cubicCapacity: number = 0,
  cpaOpted: boolean = false,
  paidDriversCount: number = 1,
  cleanersCount: number = 0
): TpBreakdown {
  const statutoryBase = getStatutoryTpPremium(vehicleType, gvwKg, seatingCapacity, cubicCapacity);
  const paOwnerDriver = cpaOpted ? 275 : 0;
  const paidDrivers = Math.max(0, paidDriversCount) * 50;
  const cleaners = Math.max(0, cleanersCount) * 50;

  return {
    statutory_tp_base_inr: statutoryBase,
    pa_owner_driver_inr: paOwnerDriver,
    paid_drivers_inr: paidDrivers,
    cleaners_inr: cleaners,
    total_tp_premium: statutoryBase + paOwnerDriver + paidDrivers + cleaners,
    statutory_discount_percent: 0,
  };
}

/**
 * Calculates complete Commercial Motor Quote for a single vehicle.
 */
export function calculateCommercialMotorQuote(input: MotorFleetInput): StandardQuoteBreakdown {
  const idvResult = calculateVehicleIdv({
    ex_showroom_price: input.ex_showroom_price,
    vehicle_age_months: input.vehicle_age_months,
    purchase_date: input.purchase_date,
    reference_date: input.reference_date,
    electrical_accessories_value: input.electrical_accessories_value,
    non_electrical_accessories_value: input.non_electrical_accessories_value,
    cng_lpg_kit_value: input.cng_lpg_kit_value,
    surveyor_agreed_idv: input.surveyor_agreed_idv,
  });

  const totalIdv = idvResult.total_idv;
  const baseOdRate = getBaseOdRate(
    input.vehicle_type,
    input.zone,
    input.gvw_kg,
    input.seating_capacity,
    input.cubic_capacity
  );

  const grossOd = Math.round((totalIdv * baseOdRate) / 100);

  const addonsResult = calculateCommercialAddons(
    grossOd,
    totalIdv,
    idvResult.age_months,
    input.opted_addons
  );

  const allowedNcbTiers: NcbTier[] = [0, 20, 25, 35, 45, 50];
  const requestedNcb = input.ncb_tier ?? 0;
  const effectiveNcb: NcbTier = allowedNcbTiers.includes(requestedNcb) ? requestedNcb : 0;
  const ncbDiscountInr = Math.round(grossOd * (effectiveNcb / 100));

  const fleetAdj = calculateFleetAdjustment(
    input.fleet_size ?? 1,
    input.past_claims_ratio_percent ?? 0,
    grossOd
  );

  const netOd = Math.max(
    0,
    grossOd +
      addonsResult.breakdown.total_addons_inr -
      ncbDiscountInr -
      fleetAdj.fleet_discount_inr +
      fleetAdj.fleet_loading_inr
  );

  const tpBreakdown = calculateTpBreakdown(
    input.vehicle_type,
    input.gvw_kg,
    input.seating_capacity,
    input.cubic_capacity,
    input.cpa_owner_driver_opted ?? false,
    input.paid_drivers_count ?? 1,
    input.cleaners_conductors_count ?? 0
  );

  const totalNetPremium = netOd + tpBreakdown.total_tp_premium;
  const gstAmount = Math.round(totalNetPremium * 0.18);
  const totalGrossPremium = totalNetPremium + gstAmount;

  const warnings: string[] = [];
  if (idvResult.warning) warnings.push(idvResult.warning);
  warnings.push(...addonsResult.warnings);

  const statutoryClauses: string[] = [
    'AIMT GR.8: Insured Declared Value (IDV) depreciation applied strictly per statutory schedule.',
    'IRDAI Motor TP Tariff: Third-party liability premium gazetted and non-discountable under Insurance Act, 1938.',
    'AIMT GR.27: No Claim Bonus (NCB) allowable only upon confirmation of claim-free tenure from previous insurer.',
    'IMT 28: Legal Liability to Paid Drivers covered under Employee\'s Compensation Act, 1923.',
  ];
  if (input.opted_addons?.imt23) {
    statutoryClauses.push(
      'IMT 23: Endorsement covers lamps, tyres, tubes, mudguards, and bonnet against accidental damage.'
    );
  }

  const lineBreakdown: MotorQuoteLineBreakdown = {
    registration_number: input.registration_number,
    make_model: input.make_model,
    vehicle_class: input.vehicle_type,
    zone: input.zone,
    vehicle_age_months: idvResult.age_months,
    depreciation_percent: idvResult.depreciation_percent,
    chassis_idv: idvResult.depreciated_chassis,
    electrical_accessories_idv: idvResult.depreciated_electrical,
    non_electrical_accessories_idv: idvResult.depreciated_non_electrical,
    cng_kit_idv: idvResult.depreciated_cng_kit,
    total_idv: totalIdv,
    base_od_rate_percent: baseOdRate,
    gross_od_premium: grossOd,
    ncb_tier: effectiveNcb,
    ncb_discount_inr: ncbDiscountInr,
    fleet_size: fleetAdj.fleet_size,
    fleet_discount_percent: fleetAdj.fleet_discount_percent,
    fleet_discount_inr: fleetAdj.fleet_discount_inr,
    fleet_loading_percent: fleetAdj.fleet_loading_percent,
    fleet_loading_inr: fleetAdj.fleet_loading_inr,
    past_claims_ratio_percent: fleetAdj.past_claims_ratio_percent,
    addons_breakdown: addonsResult.breakdown,
    net_od_premium: netOd,
    tp_breakdown: tpBreakdown,
    total_net_premium: totalNetPremium,
    gst_rate_percent: 18,
    gst_amount: gstAmount,
    total_gross_premium: totalGrossPremium,
    surveyor_valuation_required: idvResult.surveyor_valuation_required,
    underwriting_warnings: warnings,
  };

  const explainability = [
    {
      step: 'Step 1: IDV Calculation',
      description: `Vehicle age ${idvResult.age_months} mos -> AIMT GR.8 depreciation ${idvResult.depreciation_percent}%. Chassis: ₹${idvResult.depreciated_chassis.toLocaleString('en-IN')}, Acc/CNG: ₹${(idvResult.depreciated_electrical + idvResult.depreciated_non_electrical + idvResult.depreciated_cng_kit).toLocaleString('en-IN')}`,
      value: `Total IDV = ₹${totalIdv.toLocaleString('en-IN')}`,
    },
    {
      step: 'Step 2: Base Own Damage Rating',
      description: `Vehicle Class: ${input.vehicle_type}, Zone: ${input.zone} -> Base OD Rate ${baseOdRate}% of Total IDV`,
      value: `Gross OD = ₹${grossOd.toLocaleString('en-IN')}`,
    },
    {
      step: 'Step 3: Commercial IMT Add-on Suite',
      description: `Opted add-ons: IMT 23 (₹${addonsResult.breakdown.imt23_inr}), Zero Dep (₹${addonsResult.breakdown.zero_dep_inr}), Consumables (₹${addonsResult.breakdown.consumables_inr}), Engine Protect (₹${addonsResult.breakdown.engine_protect_inr}), RTI (₹${addonsResult.breakdown.return_to_invoice_inr}), RSA (₹${addonsResult.breakdown.roadside_assistance_inr})`,
      value: `Total Add-ons = ₹${addonsResult.breakdown.total_addons_inr.toLocaleString('en-IN')}`,
    },
    {
      step: 'Step 4: NCB & Fleet Surcharges',
      description: `NCB ${effectiveNcb}% (-₹${ncbDiscountInr.toLocaleString('en-IN')}); Fleet: ${fleetAdj.notes}`,
      value: fleetAdj.is_loading_applied
        ? `+₹${fleetAdj.fleet_loading_inr.toLocaleString('en-IN')} loading`
        : `-₹${fleetAdj.fleet_discount_inr.toLocaleString('en-IN')} discount`,
    },
    {
      step: 'Step 5: Net Own Damage (OD)',
      description: `Gross OD (₹${grossOd.toLocaleString('en-IN')}) + Add-ons (₹${addonsResult.breakdown.total_addons_inr.toLocaleString('en-IN')}) - NCB (₹${ncbDiscountInr.toLocaleString('en-IN')}) - Fleet Disc (₹${fleetAdj.fleet_discount_inr.toLocaleString('en-IN')}) + Fleet Load (₹${fleetAdj.fleet_loading_inr.toLocaleString('en-IN')})`,
      value: `Net OD = ₹${netOd.toLocaleString('en-IN')}`,
    },
    {
      step: 'Step 6: Statutory Third Party (TP) Tariff',
      description: `IRDAI Gazetted Fixed TP (₹${tpBreakdown.statutory_tp_base_inr.toLocaleString('en-IN')}) + CPA Owner-Driver (₹${tpBreakdown.pa_owner_driver_inr}) + Paid Drivers (₹${tpBreakdown.paid_drivers_inr}). Statutory TP discount: 0% strictly enforced.`,
      value: `Total TP = ₹${tpBreakdown.total_tp_premium.toLocaleString('en-IN')}`,
    },
    {
      step: 'Step 7: Final Premium & Taxes',
      description: `Total Net Premium = Net OD (₹${netOd.toLocaleString('en-IN')}) + Total TP (₹${tpBreakdown.total_tp_premium.toLocaleString('en-IN')}) = ₹${totalNetPremium.toLocaleString('en-IN')}; GST @ 18% = ₹${gstAmount.toLocaleString('en-IN')}`,
      value: `Total Gross Premium = ₹${totalGrossPremium.toLocaleString('en-IN')}`,
    },
  ];

  return {
    lob_category: 'motor',
    insurance_line: 'motor_fleet',
    sum_insured: totalIdv,
    base_rate_per_mille: Number((baseOdRate * 10).toFixed(2)),
    net_premium: totalNetPremium,
    gst_rate_percent: 18,
    gst_amount: gstAmount,
    total_premium: totalGrossPremium,
    statutory_clauses: statutoryClauses,
    line_specific_breakdown: lineBreakdown as unknown as Record<string, any>,
    algorithmic_explainability: explainability,
  };
}

/**
 * Calculates consolidated portfolio quote for a multi-vehicle fleet.
 */
export function calculateFleetMotorQuote(
  vehicles: MotorFleetInput[],
  fleetMetadata?: FleetMetadata
): FleetQuoteBreakdown {
  const fleetSize = fleetMetadata?.fleet_size ?? vehicles.length;
  const icr = fleetMetadata?.past_claims_ratio_percent ?? 0;

  let total_fleet_idv = 0;
  let total_gross_od = 0;
  let total_addons = 0;
  let total_ncb_discount = 0;
  let total_fleet_discount = 0;
  let total_fleet_loading = 0;
  let total_net_od = 0;
  let total_tp = 0;
  let total_net_premium = 0;
  let surveyorAlerts = 0;

  let publicCarriers = 0;
  let privateCarriers = 0;
  let buses = 0;
  let taxis = 0;
  let misc = 0;

  const quoteBreakdowns: StandardQuoteBreakdown[] = vehicles.map((v) => {
    const vehicleInput: MotorFleetInput = {
      ...v,
      fleet_size: fleetSize,
      past_claims_ratio_percent: icr,
    };

    const quote = calculateCommercialMotorQuote(vehicleInput);
    const bd = quote.line_specific_breakdown as unknown as MotorQuoteLineBreakdown;

    total_fleet_idv += bd.total_idv;
    total_gross_od += bd.gross_od_premium;
    total_addons += bd.addons_breakdown.total_addons_inr;
    total_ncb_discount += bd.ncb_discount_inr;
    total_fleet_discount += bd.fleet_discount_inr;
    total_fleet_loading += bd.fleet_loading_inr;
    total_net_od += bd.net_od_premium;
    total_tp += bd.tp_breakdown.total_tp_premium;
    total_net_premium += bd.total_net_premium;

    if (bd.surveyor_valuation_required) surveyorAlerts++;
    if (v.vehicle_type === 'gcv_public') publicCarriers++;
    else if (v.vehicle_type === 'gcv_private') privateCarriers++;
    else if (v.vehicle_type === 'pcv_bus') buses++;
    else if (v.vehicle_type === 'pcv_taxi') taxis++;
    else if (v.vehicle_type === 'misc_digger_crane') misc++;

    return quote;
  });

  const gstAmount = Math.round(total_net_premium * 0.18);
  const totalGrossPremium = total_net_premium + gstAmount;

  return {
    lob_category: 'motor',
    insurance_line: 'motor_fleet',
    total_vehicles: vehicles.length,
    total_fleet_idv,
    total_gross_od,
    total_addons,
    total_ncb_discount,
    total_fleet_discount,
    total_fleet_loading,
    total_net_od,
    total_tp,
    total_net_premium,
    gst_rate_percent: 18,
    gst_amount: gstAmount,
    total_gross_premium: totalGrossPremium,
    vehicles: quoteBreakdowns,
    fleet_summary: {
      public_carriers_count: publicCarriers,
      private_carriers_count: privateCarriers,
      buses_count: buses,
      taxis_count: taxis,
      misc_count: misc,
      surveyor_inspection_alerts_count: surveyorAlerts,
    },
    statutory_clauses: [
      'AIMT Section 4 & 5: Commercial Vehicle Fleet Rating Schedule applied.',
      'AIMT GR.8: Statutory IDV depreciation enforced per vehicle registration date.',
      'IRDAI Statutory TP Tariff: Fixed non-discountable third-party liability rating.',
      'AIMT GR.27: Fleet No Claim Bonus (NCB) consolidation.',
      'Section 64VB: Insurance Act 1938 premium payment warranty enforced across entire fleet schedule.',
    ],
  };
}
