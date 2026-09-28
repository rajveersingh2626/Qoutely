import occupanciesData from '@/data/occupancies.json';
import {
  CalculationBreakdown,
  FeatureDiscountOptions,
  Occupancy,
  SumInsuredBreakdown,
} from '@/types/database';

export const OCCUPANCIES: Occupancy[] = occupanciesData as Occupancy[];

export function getOccupancyByCode(code: string): Occupancy | undefined {
  return OCCUPANCIES.find(
    (o) => o.code.toLowerCase() === code.trim().toLowerCase()
  );
}

export interface CalculationInput {
  occupancy_code: string;
  sum_insured: SumInsuredBreakdown;
  eq_zone: string; // 'Zone 1' | 'Zone 2' | 'Zone 3' | 'Zone 4' | 'Zone 5' | 'Zone V' | 'Zone IV' | 'Zone III' | 'Zone II'
  product_type?: 'Flexi_BS' | 'Flexi_BL' | 'BSUS' | 'BLUS';
  kutcha_construction?: boolean;
  feature_discounts?: Partial<FeatureDiscountOptions>;
  discretionary_discount_percent?: number;
  floater_opted?: boolean;
  terrorism_opted?: boolean;
  stfi_opted?: boolean;
  eq_opted?: boolean;
}

export function calculateCommercialPremium(
  input: CalculationInput
): CalculationBreakdown {
  const occ = getOccupancyByCode(input.occupancy_code) || {
    code: input.occupancy_code,
    description: 'General Merchandise / Commercial',
    section: 'III',
    category: 1,
    category_tag: 'General',
    flexa_rate: 0.5,
    stfi_rate: 0.15,
    eq_rate: 0.1,
    terrorism_rate: 0.15,
    loss_cost: 0.4,
    keywords: [],
    source_doc: 'AIFT 2001',
  };

  const product_type = input.product_type || 'Flexi_BS';
  const kutcha = !!input.kutcha_construction;
  const floater = !!input.floater_opted;
  const terrorism_opted = input.terrorism_opted ?? (product_type === 'Flexi_BS' || product_type === 'Flexi_BL' ? false : true);
  const stfi_opted = input.stfi_opted ?? true;
  const eq_opted = input.eq_opted ?? true;

  // Normalize zone name
  let normalizedZone = input.eq_zone || 'Zone 2';
  if (normalizedZone === 'Zone V') normalizedZone = 'Zone 1';
  if (normalizedZone === 'Zone IV') normalizedZone = 'Zone 2';
  if (normalizedZone === 'Zone III') normalizedZone = 'Zone 3';
  if (normalizedZone === 'Zone II') normalizedZone = 'Zone 4';

  const category = occ.category || 1;
  const section = occ.section || 'III';
  const base_flexa_rate = occ.flexa_rate || 0.5;

  // Category adjustment formula (as per Excel Sheet1 Row 3):
  // Cat 1: -25% | Cat 2: -10% | Cat 3: +25% | Cat 4: +160%
  const applyCategoryFactor = (rate: number, cat: number): number => {
    if (cat === 1) return rate * 0.75;
    if (cat === 2) return rate * 0.90;
    if (cat === 3) return rate * 1.25;
    if (cat === 4) return rate * 2.60;
    return rate;
  };

  let nia_adjusted_flexa_rate = applyCategoryFactor(base_flexa_rate, category);
  if (kutcha) {
    nia_adjusted_flexa_rate += 4.0;
  }

  // Base STFI rate by section
  let base_stfi_rate = 0.15;
  if (section !== 'III') {
    base_stfi_rate = occ.stfi_rate || 0.25;
  }
  const nia_adjusted_stfi_rate = applyCategoryFactor(base_stfi_rate, category);

  // Base EQ rate by zone and section
  let base_eq_rate = 0.10;
  if (section === 'III') {
    if (normalizedZone === 'Zone 1') base_eq_rate = 0.25;
    else if (normalizedZone === 'Zone 2') base_eq_rate = 0.15;
    else if (normalizedZone === 'Zone 3') base_eq_rate = 0.10;
    else base_eq_rate = 0.05;
  } else {
    if (normalizedZone === 'Zone 1') base_eq_rate = 0.50;
    else if (normalizedZone === 'Zone 2') base_eq_rate = 0.25;
    else if (normalizedZone === 'Zone 3') base_eq_rate = 0.10;
    else base_eq_rate = 0.05;
  }
  const nia_adjusted_eq_rate = applyCategoryFactor(base_eq_rate, category);

  // Base Terrorism rate
  const terrorism_rate = section === 'III' ? 0.15 : (occ.terrorism_rate || 0.23);

  // Feature Discounts / Loadings calculation
  const fd = input.feature_discounts || {};
  let featureSum = 0;

  // Fire hydrant/sprinklers (-10%)
  if (fd.fire_hydrant_sprinkler) featureSum -= 10;
  // Electrical installations (-10%)
  if (fd.electrical_installations) featureSum -= 10;
  // Storm water drainage (-10%)
  if (fd.storm_water_drainage) featureSum -= 10;
  // Security & CCTV (-10% if YES, +5% if NO)
  if (fd.high_security_cctv === true) {
    featureSum -= 10;
  } else if (fd.high_security_cctv === false) {
    featureSum += 5;
  }
  // Claim ratio
  const claims = fd.past_claims_ratio || '<=70';
  if (category === 3) {
    if (claims === '<30') featureSum -= 30;
    else if (claims === '>=30<=70') featureSum -= 20;
    else if (claims === '>70<=100') featureSum += 0;
    else if (claims === '>100<=200') featureSum += 10;
    else if (claims === '>200') featureSum += 50;
  } else if (category === 4) {
    if (claims === '<30') featureSum -= 55;
    else if (claims === '>=30<=70') featureSum -= 20;
    else if (claims === '>70<=100') featureSum += 0;
    else if (claims === '>100<=200') featureSum += 10;
    else if (claims === '>200') featureSum += 50;
  } else {
    if (claims === '<=70' || claims === '<30' || claims === '>=30<=70') featureSum -= 20;
    else if (claims === '>70<=100') featureSum += 0;
    else if (claims === '>100<=200') featureSum += 10;
    else if (claims === '>200') featureSum += 50;
  }

  // Basement used (+5%)
  if (fd.basement_used) featureSum += 5;
  // Water body within 1km (+5%)
  if (fd.waterbody_within_1km) featureSum += 5;
  // Thickly populated (+10%)
  if (fd.thickly_populated_no_access) featureSum += 10;

  // Maximum feature discount cap: For Cat 1 & 2, max discount is -50%
  let feature_discount_percent = featureSum;
  if (category === 1 || category === 2) {
    feature_discount_percent = Math.max(featureSum, -50);
  }

  // Rate after feature discount applied to adjusted flexa
  const rate_after_discount = Math.max(
    0.0001,
    nia_adjusted_flexa_rate * (1 + feature_discount_percent / 100)
  );

  // Peril components
  const final_stfi_rate = stfi_opted ? nia_adjusted_stfi_rate : 0;
  const final_eq_rate = eq_opted ? nia_adjusted_eq_rate : 0;
  const final_terrorism_rate = terrorism_opted ? terrorism_rate : 0;

  const total_base_rate =
    rate_after_discount + final_stfi_rate + final_eq_rate + final_terrorism_rate;

  // Discretionary broker discount (e.g. 0-20%)
  const discretionary_discount_percent =
    input.discretionary_discount_percent ?? 10;
  const rate_after_discretionary =
    (total_base_rate * (100 - discretionary_discount_percent)) / 100;

  // Floater rate
  const floater_rate = floater
    ? rate_after_discretionary * 1.1
    : rate_after_discretionary;

  const final_policy_rate_per_mille = floater_rate;

  // Sum Insured
  const total_sum_insured =
    (input.sum_insured.building || 0) +
    (input.sum_insured.plant_machinery || 0) +
    (input.sum_insured.furniture_fixtures || 0) +
    (input.sum_insured.stocks || 0) +
    (input.sum_insured.others || 0);

  // Tariff rule: Premium = (Rate per mille * Sum Insured) / 1000
  const net_premium = Math.round(
    (final_policy_rate_per_mille * total_sum_insured) / 1000
  );
  const gst_rate_percent = 18;
  const gst_amount = Math.round(net_premium * 0.18);
  const total_premium = net_premium + gst_amount;

  return {
    occupancy_code: occ.code,
    occupancy_description: occ.description,
    category,
    section,
    product_type,
    eq_zone: normalizedZone,
    kutcha_construction: kutcha,
    base_flexa_rate: Number(base_flexa_rate.toFixed(4)),
    nia_adjusted_flexa_rate: Number(nia_adjusted_flexa_rate.toFixed(4)),
    feature_discount_percent: Number(feature_discount_percent.toFixed(2)),
    rate_after_discount: Number(rate_after_discount.toFixed(4)),
    stfi_opted,
    stfi_rate: Number(final_stfi_rate.toFixed(4)),
    eq_opted,
    eq_rate: Number(final_eq_rate.toFixed(4)),
    terrorism_opted,
    terrorism_rate: Number(final_terrorism_rate.toFixed(4)),
    total_base_rate: Number(total_base_rate.toFixed(4)),
    discretionary_discount_percent,
    rate_after_discretionary: Number(rate_after_discretionary.toFixed(4)),
    floater_opted: floater,
    floater_rate: Number(floater_rate.toFixed(4)),
    final_policy_rate_per_mille: Number(final_policy_rate_per_mille.toFixed(4)),
    total_sum_insured,
    net_premium,
    gst_rate_percent,
    gst_amount,
    total_premium,
  };
}

export function formatINR(val: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
}

export function formatNumberINR(val: number): string {
  return new Intl.NumberFormat('en-IN').format(val);
}
