import occupanciesData from '@/data/occupancies.json';
import {
  CalculationBreakdown,
  FeatureDiscountOptions,
  Occupancy,
  SumInsuredBreakdown,
} from '@/types/database';
import {
  routeCommercialFireProduct,
  calculateInBuiltCovers,
  evaluateBlusUnderinsurance,
  verifyValuationIntegrity,
  trackBrokerPiCompliance,
  PARTNER_INSURERS,
} from './underwriting-engine';

export {
  routeCommercialFireProduct,
  calculateInBuiltCovers,
  evaluateBlusUnderinsurance,
  verifyValuationIntegrity,
  trackBrokerPiCompliance,
  PARTNER_INSURERS,
};

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
  product_type?: 'Flexi_BS' | 'Flexi_BL' | 'BSUS' | 'BLUS' | 'MEGA_RISK_SFSP';
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

  const total_sum_insured_preview =
    (input.sum_insured.building || 0) +
    (input.sum_insured.plant_machinery || 0) +
    (input.sum_insured.furniture_fixtures || 0) +
    (input.sum_insured.stocks || 0) +
    (input.sum_insured.others || 0);

  const autoRouted = routeCommercialFireProduct(total_sum_insured_preview);
  const product_type = input.product_type || autoRouted.product;
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

  let effectiveFramework = autoRouted.regulatoryFramework;
  let effectiveClaimExcess = autoRouted.claimExcessClause;
  let effectiveProductName = autoRouted.productName;

  if (product_type === 'BSUS') {
    effectiveProductName = 'Bharat Sookshma Udyam Suraksha (BSUS)';
    effectiveFramework = 'IRDAI Sookshma Commercial Fire Framework (Max ₹5 Cr)';
    effectiveClaimExcess = 'Standard statutory deductible: ₹5,000 per claim across all covered perils.';
  } else if (product_type === 'BLUS') {
    effectiveProductName = 'Bharat Laghu Udyam Suraksha (BLUS)';
    effectiveFramework = 'IRDAI Laghu Commercial Fire Framework (>₹5 Cr up to ₹50 Cr)';
    effectiveClaimExcess = '5% of claim amount subject to minimum ₹10,000 per occurrence.';
  } else if (product_type === 'MEGA_RISK_SFSP') {
    effectiveProductName = 'Standard Fire & Special Perils (Mega-Risk Framework)';
    effectiveFramework = 'IRDAI Large Industrial Risk / Tariff Advisory De-notification Framework (>₹50 Cr)';
    effectiveClaimExcess = 'Underwriter negotiable excess (standard 5% or minimum ₹25,000 - ₹1,00,000).';
  }

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
    claim_excess: effectiveClaimExcess,
    in_built_covers: calculateInBuiltCovers(input.sum_insured),
    underwriting_framework: effectiveFramework,
    algorithmic_explainability: {
      statutory_basis: `IRDAI De-tariffed Framework: ${effectiveProductName} (${effectiveFramework})`,
      applied_rules: [
        `Risk threshold bound to ${effectiveProductName} (Sum Insured: ${formatINR(total_sum_insured)})`,
        `Claim Excess: ${effectiveClaimExcess}`,
        `Base FLEXA rate: ${base_flexa_rate.toFixed(4)}‰ (Loss Cost: ${occ.loss_cost}‰)`,
        stfi_opted ? `STFI cover: ${final_stfi_rate.toFixed(4)}‰` : 'STFI: Excluded',
        eq_opted ? `EQ Zone ${normalizedZone} rate: ${final_eq_rate.toFixed(4)}‰` : 'EQ: Excluded',
        terrorism_opted ? `Terrorism rate: ${final_terrorism_rate.toFixed(4)}‰` : 'Terrorism: Excluded',
        `GST: ${gst_rate_percent}% statutory indirect tax`,
      ],
      governance_standard: 'MeitY India AI Governance / IRDAI Tariff De-notification 2001',
      input_vector: {
        sum_insured: total_sum_insured,
        occupation_code: occ.code,
        eq_zone: normalizedZone,
        kutcha_construction: kutcha,
        stfi_opted,
        eq_opted,
        terrorism_opted,
      },
    },
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

export function formatINRWithDecimals(val: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
}

/**
 * Pure Deterministic Premium Engine Calculation Function
 *
 * Implements the IRDAI commercial rating formula:
 * 1. Base Rate per mille = (Flexa + STFI + EQ)
 * 2. Adjusted Rate = Base Rate * (1 + Loadings - Discounts)
 * 3. Net Premium = (Sum Insured / 1000) * Adjusted Rate
 * 4. GST = Net Premium * 0.18
 * 5. Total Final Premium = Net Premium + GST
 */
export interface PremiumCalculationInput {
  sumInsured: number;
  flexaRate: number;
  stfiRate: number;
  eqRate: number;
  discounts: number; // percentage (e.g. 5 for 5% or 0.05)
  loadings: number;  // percentage (e.g. 10 for 10% or 0.10)
}

export interface PremiumCalculationResult {
  sumInsured: number;
  flexaRate: number;
  stfiRate: number;
  eqRate: number;
  discounts: number;
  loadings: number;
  discountPercentage: number;
  loadingPercentage: number;
  discountFactor: number;
  loadingFactor: number;
  baseRate: number;
  adjustedRate: number;
  netPremium: number;
  gst: number;
  totalFinalPremium: number;
  totalPremium: number;
}

export function calculatePremium(data: PremiumCalculationInput): PremiumCalculationResult {
  const sumInsured = Math.max(0, Number(data.sumInsured) || 0);
  const flexaRate = Math.max(0, Number(data.flexaRate) || 0);
  const stfiRate = Math.max(0, Number(data.stfiRate) || 0);
  const eqRate = Math.max(0, Number(data.eqRate) || 0);

  const rawDiscounts = Math.max(0, Number(data.discounts) || 0);
  const rawLoadings = Math.max(0, Number(data.loadings) || 0);

  // Normalize percentage vs decimal (e.g., 10 => 0.10, or 0.10 => 0.10)
  const discountDecimal = rawDiscounts > 1 ? rawDiscounts / 100 : rawDiscounts;
  const loadingDecimal = rawLoadings > 1 ? rawLoadings / 100 : rawLoadings;

  // 1. Base Rate per mille = (Flexa + STFI + EQ)
  const baseRate = Number((flexaRate + stfiRate + eqRate).toFixed(4));

  // 2. Adjusted Rate = Base Rate * (1 + Loadings - Discounts)
  const adjustedRate = Number(
    Math.max(0, baseRate * (1 + loadingDecimal - discountDecimal)).toFixed(4)
  );

  // 3. Net Premium = (Sum Insured / 1000) * Adjusted Rate
  const netPremium = Number(
    ((sumInsured / 1000) * adjustedRate).toFixed(2)
  );

  // 4. GST = Net Premium * 0.18
  const gst = Number((netPremium * 0.18).toFixed(2));

  // 5. Total Final Premium = Net Premium + GST
  const totalFinalPremium = Number((netPremium + gst).toFixed(2));

  return {
    sumInsured,
    flexaRate,
    stfiRate,
    eqRate,
    discounts: rawDiscounts,
    loadings: rawLoadings,
    discountPercentage: Number((discountDecimal * 100).toFixed(2)),
    loadingPercentage: Number((loadingDecimal * 100).toFixed(2)),
    discountFactor: discountDecimal,
    loadingFactor: loadingDecimal,
    baseRate,
    adjustedRate,
    netPremium,
    gst,
    totalFinalPremium,
    totalPremium: totalFinalPremium,
  };
}

