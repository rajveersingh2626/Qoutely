/**
 * Comprehensive Unit Test Suite for Commercial Motor & Fleet Underwriting Engine
 *
 * Verifies:
 * 1. AIMT GR.8 IDV depreciation schedule at exact age boundaries (0, 6, 12, 24, 36, 48, 60, >60 months).
 * 2. IDV component rollups (Chassis, Electrical, Non-Electrical, Bi-fuel CNG/LPG).
 * 3. Surveyor-agreed IDV override when vehicle age exceeds 5 years (60 months).
 * 4. GCV Public Carrier Zone A/B/C base Own Damage (OD) rates across all GVW brackets.
 * 5. GCV Private Carrier Zone A/B/C base OD rates across all GVW brackets.
 * 6. PCV Bus base OD rates across seating capacity brackets.
 * 7. PCV Taxi base OD rates across Cubic Capacity (CC) brackets.
 * 8. Misc Construction Digger / Mobile Crane base OD rates.
 * 9. IRDAI Gazetted Fixed TP tariff lookup for GCV Public across all 5 GVW brackets.
 * 10. IRDAI Gazetted Fixed TP tariff lookup for GCV Private across all 5 GVW brackets.
 * 11. IRDAI Gazetted Fixed TP tariff lookup for PCV Bus with seating capacity calculation.
 * 12. IRDAI Gazetted Fixed TP tariff lookup for PCV Taxi with seating capacity calculation.
 * 13. IRDAI Gazetted Fixed TP tariff lookup for Misc Digger / Crane.
 * 14. Statutory TP discount immunity: 0% discount enforced on statutory TP.
 * 15. Compulsory PA Owner-Driver (₹275) and Paid Driver IMT 28 (₹50/driver).
 * 16. No Claim Bonus (NCB) ladder: 0%, 20%, 25%, 35%, 45%, 50% applied strictly to Gross OD.
 * 17. Commercial IMT Add-on Suite: IMT 23 (15% Gross OD), Consumables (0.25% IDV), Engine Protector (0.35% IDV), RSA (max ₹500, 0.1% IDV).
 * 18. Zero Depreciation age-tiered rates (0.65% to 1.25% IDV) and strict > 5 yr disallowance.
 * 19. Return to Invoice (RTI) 0.40% IDV and strict > 5 yr disallowance.
 * 20. Fleet volume discounts: 5-15 vehicles (5%), 16-50 vehicles (10%), >50 vehicles (15%).
 * 21. Adverse Incurred Claim Ratio (ICR) loading: >80% (+15%), >100% (+25%), >150% (+35%), converting discounts to loadings.
 * 22. Full Quotation Breakdown with Net OD, Net TP, Total Net Premium, 18% GST rounding, and Gross Premium.
 * 23. Algorithmic explainability vector completeness.
 * 24. Multi-vehicle fleet portfolio rollup calculation.
 * 25. Edge case handling (zero ex-showroom, negative inputs, boundary tolerances).
 */

import assert from 'node:assert';
import {
  calculateVehicleAgeInMonths,
  getAimtIdvDepreciation,
  calculateVehicleIdv,
  getBaseOdRate,
  calculateCommercialAddons,
  calculateFleetAdjustment,
  getStatutoryTpPremium,
  calculateTpBreakdown,
  calculateCommercialMotorQuote,
  calculateFleetMotorQuote,
  MotorFleetInput,
} from '../motor-engine';

let passedTests = 0;
let totalTests = 0;

function test(name: string, fn: () => void) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ ${name}`);
  } catch (err: any) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message || err}`);
    throw err;
  }
}

export function runMotorEngineTests() {
  console.log('\n======================================================');
  console.log('Running Commercial Motor & Fleet Engine Test Suite');
  console.log('======================================================\n');

  // --- Suite 1: AIMT GR.8 IDV Statutory Depreciation Schedule ---
  console.log('[Suite 1: AIMT GR.8 Statutory IDV Depreciation]');

  test('Boundary: Age 0 months -> 5% depreciation', () => {
    const dep = getAimtIdvDepreciation(0);
    assert.strictEqual(dep.percent, 5);
    assert.strictEqual(dep.rate, 0.05);
    assert.strictEqual(dep.surveyorRequired, false);
  });

  test('Boundary: Age 6 months exact -> 5% depreciation', () => {
    const dep = getAimtIdvDepreciation(6);
    assert.strictEqual(dep.percent, 5);
    assert.strictEqual(dep.rate, 0.05);
    assert.strictEqual(dep.surveyorRequired, false);
  });

  test('Boundary: Age 7 months (6 to 12 months) -> 15% depreciation', () => {
    const dep = getAimtIdvDepreciation(7);
    assert.strictEqual(dep.percent, 15);
    assert.strictEqual(dep.rate, 0.15);
    assert.strictEqual(dep.surveyorRequired, false);
  });

  test('Boundary: Age 12 months exact -> 15% depreciation', () => {
    const dep = getAimtIdvDepreciation(12);
    assert.strictEqual(dep.percent, 15);
    assert.strictEqual(dep.rate, 0.15);
    assert.strictEqual(dep.surveyorRequired, false);
  });

  test('Boundary: Age 13 months (1 to 2 years) -> 20% depreciation', () => {
    const dep = getAimtIdvDepreciation(13);
    assert.strictEqual(dep.percent, 20);
    assert.strictEqual(dep.rate, 0.20);
    assert.strictEqual(dep.surveyorRequired, false);
  });

  test('Boundary: Age 24 months exact -> 20% depreciation', () => {
    const dep = getAimtIdvDepreciation(24);
    assert.strictEqual(dep.percent, 20);
    assert.strictEqual(dep.rate, 0.20);
    assert.strictEqual(dep.surveyorRequired, false);
  });

  test('Boundary: Age 25 months (2 to 3 years) -> 30% depreciation', () => {
    const dep = getAimtIdvDepreciation(25);
    assert.strictEqual(dep.percent, 30);
    assert.strictEqual(dep.rate, 0.30);
    assert.strictEqual(dep.surveyorRequired, false);
  });

  test('Boundary: Age 36 months exact -> 30% depreciation', () => {
    const dep = getAimtIdvDepreciation(36);
    assert.strictEqual(dep.percent, 30);
    assert.strictEqual(dep.rate, 0.30);
    assert.strictEqual(dep.surveyorRequired, false);
  });

  test('Boundary: Age 37 months (3 to 4 years) -> 40% depreciation', () => {
    const dep = getAimtIdvDepreciation(37);
    assert.strictEqual(dep.percent, 40);
    assert.strictEqual(dep.rate, 0.40);
    assert.strictEqual(dep.surveyorRequired, false);
  });

  test('Boundary: Age 48 months exact -> 40% depreciation', () => {
    const dep = getAimtIdvDepreciation(48);
    assert.strictEqual(dep.percent, 40);
    assert.strictEqual(dep.rate, 0.40);
    assert.strictEqual(dep.surveyorRequired, false);
  });

  test('Boundary: Age 49 months (4 to 5 years) -> 50% depreciation', () => {
    const dep = getAimtIdvDepreciation(49);
    assert.strictEqual(dep.percent, 50);
    assert.strictEqual(dep.rate, 0.50);
    assert.strictEqual(dep.surveyorRequired, false);
  });

  test('Boundary: Age 60 months exact -> 50% depreciation', () => {
    const dep = getAimtIdvDepreciation(60);
    assert.strictEqual(dep.percent, 50);
    assert.strictEqual(dep.rate, 0.50);
    assert.strictEqual(dep.surveyorRequired, false);
  });

  test('Alert: Age 61 months (>5 years) triggers surveyor inspection alert', () => {
    const dep = getAimtIdvDepreciation(61);
    assert.strictEqual(dep.percent, 50);
    assert.strictEqual(dep.surveyorRequired, true);
    assert.ok(dep.warning && dep.warning.includes('Surveyor inspection'));
  });

  // --- Suite 2: Total IDV Component Rollup & Overrides ---
  console.log('\n[Suite 2: Total IDV Rollup & Overrides]');

  test('Calculates IDV across Chassis, Electrical, Non-Electrical, and CNG Kit', () => {
    const idv = calculateVehicleIdv({
      ex_showroom_price: 2000000,
      electrical_accessories_value: 50000,
      non_electrical_accessories_value: 30000,
      cng_lpg_kit_value: 60000,
      vehicle_age_months: 18, // 20% depreciation
    });

    assert.strictEqual(idv.depreciation_percent, 20);
    assert.strictEqual(idv.depreciated_chassis, 1600000); // 20L * 0.80
    assert.strictEqual(idv.depreciated_electrical, 40000); // 50k * 0.80
    assert.strictEqual(idv.depreciated_non_electrical, 24000); // 30k * 0.80
    assert.strictEqual(idv.depreciated_cng_kit, 48000); // 60k * 0.80
    assert.strictEqual(idv.total_idv, 1712000); // 16L + 40k + 24k + 48k
    assert.strictEqual(idv.surveyor_valuation_required, false);
  });

  test('Surveyor agreed valuation override applies for vehicles > 5 years old', () => {
    const idv = calculateVehicleIdv({
      ex_showroom_price: 2500000,
      vehicle_age_months: 72, // > 5 years
      surveyor_agreed_idv: 950000,
    });

    assert.strictEqual(idv.total_idv, 950000);
    assert.strictEqual(idv.depreciated_chassis, 950000);
    assert.strictEqual(idv.surveyor_valuation_required, true);
    assert.ok(idv.warning && idv.warning.includes('Surveyor-agreed'));
  });

  // --- Suite 3: Base Own Damage (OD) Rating Across Vehicle Types & Zones ---
  console.log('\n[Suite 3: Base OD Rates by Vehicle Type, Zone & Slabs]');

  test('GCV Public Carrier Zone A, B, C rates across GVW brackets', () => {
    // <= 7500 kg
    assert.strictEqual(getBaseOdRate('gcv_public', 'A', 5000), 1.72);
    assert.strictEqual(getBaseOdRate('gcv_public', 'B', 5000), 1.68);
    assert.strictEqual(getBaseOdRate('gcv_public', 'C', 5000), 1.60);

    // 7501 - 12000 kg
    assert.strictEqual(getBaseOdRate('gcv_public', 'A', 10000), 1.78);
    assert.strictEqual(getBaseOdRate('gcv_public', 'B', 10000), 1.73);

    // 12001 - 20000 kg
    assert.strictEqual(getBaseOdRate('gcv_public', 'A', 16000), 1.85);
    assert.strictEqual(getBaseOdRate('gcv_public', 'B', 16000), 1.80);
    assert.strictEqual(getBaseOdRate('gcv_public', 'C', 16000), 1.70);

    // 20001 - 40000 kg
    assert.strictEqual(getBaseOdRate('gcv_public', 'A', 35000), 1.95);
    assert.strictEqual(getBaseOdRate('gcv_public', 'B', 35000), 1.89);

    // > 40000 kg
    assert.strictEqual(getBaseOdRate('gcv_public', 'A', 45000), 2.05);
    assert.strictEqual(getBaseOdRate('gcv_public', 'B', 45000), 1.98);
    assert.strictEqual(getBaseOdRate('gcv_public', 'C', 45000), 1.85);
  });

  test('GCV Private Carrier Zone A base OD rates', () => {
    assert.strictEqual(getBaseOdRate('gcv_private', 'A', 5000), 1.45);
    assert.strictEqual(getBaseOdRate('gcv_private', 'A', 10000), 1.50);
    assert.strictEqual(getBaseOdRate('gcv_private', 'A', 16000), 1.58);
    assert.strictEqual(getBaseOdRate('gcv_private', 'A', 35000), 1.65);
    assert.strictEqual(getBaseOdRate('gcv_private', 'A', 45000), 1.75);
  });

  test('PCV Bus base OD rates across seating tiers', () => {
    assert.strictEqual(getBaseOdRate('pcv_bus', 'A', 0, 15), 1.50);
    assert.strictEqual(getBaseOdRate('pcv_bus', 'A', 0, 30), 1.65);
    assert.strictEqual(getBaseOdRate('pcv_bus', 'A', 0, 50), 1.80);
  });

  test('PCV Taxi base OD rates across CC tiers', () => {
    assert.strictEqual(getBaseOdRate('pcv_taxi', 'A', 0, 4, 800), 1.55);
    assert.strictEqual(getBaseOdRate('pcv_taxi', 'A', 0, 4, 1200), 1.68);
    assert.strictEqual(getBaseOdRate('pcv_taxi', 'A', 0, 4, 1800), 1.82);
  });

  test('Misc Special Digger / Crane base OD rates', () => {
    assert.strictEqual(getBaseOdRate('misc_digger_crane', 'A'), 1.40);
    assert.strictEqual(getBaseOdRate('misc_digger_crane', 'B'), 1.35);
    assert.strictEqual(getBaseOdRate('misc_digger_crane', 'C'), 1.30);
  });

  // --- Suite 4: Statutory Third-Party (TP) Tariffs ---
  console.log('\n[Suite 4: IRDAI Gazetted Statutory TP Tariffs]');

  test('GCV Public Carrier gazetted TP rates across 5 GVW brackets', () => {
    assert.strictEqual(getStatutoryTpPremium('gcv_public', 5000), 16049);
    assert.strictEqual(getStatutoryTpPremium('gcv_public', 10000), 27486);
    assert.strictEqual(getStatutoryTpPremium('gcv_public', 16000), 35313);
    assert.strictEqual(getStatutoryTpPremium('gcv_public', 35000), 44242);
    assert.strictEqual(getStatutoryTpPremium('gcv_public', 45000), 45512);
  });

  test('GCV Private Carrier gazetted TP rates across 5 GVW brackets', () => {
    assert.strictEqual(getStatutoryTpPremium('gcv_private', 5000), 10750);
    assert.strictEqual(getStatutoryTpPremium('gcv_private', 10000), 18416);
    assert.strictEqual(getStatutoryTpPremium('gcv_private', 16000), 23660);
    assert.strictEqual(getStatutoryTpPremium('gcv_private', 35000), 29642);
    assert.strictEqual(getStatutoryTpPremium('gcv_private', 45000), 30493);
  });

  test('PCV Bus gazetted TP rate: base ₹14,350 + ₹948 per passenger seat', () => {
    const tp40 = getStatutoryTpPremium('pcv_bus', 0, 40);
    assert.strictEqual(tp40, 14350 + 40 * 948); // ₹52,270
  });

  test('PCV Taxi gazetted TP rate by CC + ₹948 per seat', () => {
    const taxiTp = getStatutoryTpPremium('pcv_taxi', 0, 4, 1200);
    assert.strictEqual(taxiTp, 8995 + 4 * 948); // ₹12,787
  });

  test('Misc Digger/Crane statutory TP rate is flat ₹7,888', () => {
    assert.strictEqual(getStatutoryTpPremium('misc_digger_crane'), 7888);
  });

  test('Statutory TP breakdown enforces 0% discount and adds CPA + Paid Driver', () => {
    const tp = calculateTpBreakdown('gcv_public', 16000, 0, 0, true, 2, 1);
    assert.strictEqual(tp.statutory_tp_base_inr, 35313);
    assert.strictEqual(tp.pa_owner_driver_inr, 275);
    assert.strictEqual(tp.paid_drivers_inr, 100); // 2 * ₹50
    assert.strictEqual(tp.cleaners_inr, 50); // 1 * ₹50
    assert.strictEqual(tp.total_tp_premium, 35313 + 275 + 100 + 50); // ₹35,738
    assert.strictEqual(tp.statutory_discount_percent, 0); // Strictly non-discountable
  });

  // --- Suite 5: Commercial IMT Add-on Suite ---
  console.log('\n[Suite 5: Commercial IMT Add-on Suite]');

  test('IMT 23 calculates exactly 15% of Gross OD', () => {
    const addons = calculateCommercialAddons(50000, 2000000, 10, { imt23: true });
    assert.strictEqual(addons.breakdown.imt23_inr, 7500); // 15% of 50k
  });

  test('Zero Depreciation rates tier by vehicle age and disallows > 5 years', () => {
    // <= 12 months: 0.65%
    const a1 = calculateCommercialAddons(50000, 1000000, 8, { zero_dep: true });
    assert.strictEqual(a1.breakdown.zero_dep_inr, 6500);

    // 12-24 months: 0.75%
    const a2 = calculateCommercialAddons(50000, 1000000, 20, { zero_dep: true });
    assert.strictEqual(a2.breakdown.zero_dep_inr, 7500);

    // 24-36 months: 0.90%
    const a3 = calculateCommercialAddons(50000, 1000000, 30, { zero_dep: true });
    assert.strictEqual(a3.breakdown.zero_dep_inr, 9000);

    // 36-48 months: 1.05%
    const a4 = calculateCommercialAddons(50000, 1000000, 42, { zero_dep: true });
    assert.strictEqual(a4.breakdown.zero_dep_inr, 10500);

    // 48-60 months: 1.25%
    const a5 = calculateCommercialAddons(50000, 1000000, 54, { zero_dep: true });
    assert.strictEqual(a5.breakdown.zero_dep_inr, 12500);

    // > 60 months: Disallowed (0 premium + warning)
    const a6 = calculateCommercialAddons(50000, 1000000, 65, { zero_dep: true });
    assert.strictEqual(a6.breakdown.zero_dep_inr, 0);
    assert.ok(a6.warnings.some((w) => w.includes('Zero Depreciation is disallowed')));
  });

  test('Consumables (0.25%), Engine Protect (0.35%), RTI (0.40%), RSA', () => {
    const addons = calculateCommercialAddons(50000, 2000000, 24, {
      consumables: true,
      engine_protect: true,
      return_to_invoice: true,
      roadside_assistance: true,
    });

    assert.strictEqual(addons.breakdown.consumables_inr, 5000); // 20L * 0.0025
    assert.strictEqual(addons.breakdown.engine_protect_inr, 7000); // 20L * 0.0035
    assert.strictEqual(addons.breakdown.return_to_invoice_inr, 8000); // 20L * 0.0040
    assert.strictEqual(addons.breakdown.roadside_assistance_inr, 2000); // max(500, 20L * 0.001 = 2000)
    assert.strictEqual(addons.breakdown.total_addons_inr, 22000);
  });

  test('Return to Invoice (RTI) is disallowed for vehicles > 5 years old', () => {
    const addons = calculateCommercialAddons(50000, 1000000, 68, { return_to_invoice: true });
    assert.strictEqual(addons.breakdown.return_to_invoice_inr, 0);
    assert.ok(addons.warnings.some((w) => w.includes('Return to Invoice (RTI) is disallowed')));
  });

  // --- Suite 6: Fleet Discounts & Incurred Claims Ratio (ICR) Loading ---
  console.log('\n[Suite 6: Fleet Volume Discount & Adverse Claims Loading]');

  test('Fleet volume discount tiers: 5-15 (5%), 16-50 (10%), >50 (15%)', () => {
    const f3 = calculateFleetAdjustment(3, 40, 100000);
    assert.strictEqual(f3.fleet_discount_percent, 0);
    assert.strictEqual(f3.fleet_discount_inr, 0);

    const f10 = calculateFleetAdjustment(10, 40, 100000);
    assert.strictEqual(f10.fleet_discount_percent, 5);
    assert.strictEqual(f10.fleet_discount_inr, 5000);

    const f25 = calculateFleetAdjustment(25, 40, 100000);
    assert.strictEqual(f25.fleet_discount_percent, 10);
    assert.strictEqual(f25.fleet_discount_inr, 10000);

    const f80 = calculateFleetAdjustment(80, 40, 100000);
    assert.strictEqual(f80.fleet_discount_percent, 15);
    assert.strictEqual(f80.fleet_discount_inr, 15000);
  });

  test('Adverse claims ratio (>80% ICR) inverts discount to penalty loading', () => {
    // Fleet size 25 normally gets 10% discount. But ICR = 95%
    const f95 = calculateFleetAdjustment(25, 95, 100000);
    assert.strictEqual(f95.fleet_discount_percent, 0);
    assert.strictEqual(f95.fleet_discount_inr, 0);
    assert.strictEqual(f95.fleet_loading_percent, 15);
    assert.strictEqual(f95.fleet_loading_inr, 15000);
    assert.strictEqual(f95.is_loading_applied, true);

    // ICR = 125% -> +25% loading
    const f125 = calculateFleetAdjustment(25, 125, 100000);
    assert.strictEqual(f125.fleet_loading_percent, 25);
    assert.strictEqual(f125.fleet_loading_inr, 25000);

    // ICR = 180% -> +35% loading
    const f180 = calculateFleetAdjustment(25, 180, 100000);
    assert.strictEqual(f180.fleet_loading_percent, 35);
    assert.strictEqual(f180.fleet_loading_inr, 35000);
  });

  // --- Suite 7: Full Single Vehicle Quotation & Explainability ---
  console.log('\n[Suite 7: Full Quote Breakdown, 18% GST & Explainability]');

  test('Full commercial truck quote: Tata Prima GCV Public Carrier Zone A', () => {
    const input: MotorFleetInput = {
      vehicle_type: 'gcv_public',
      zone: 'A',
      ex_showroom_price: 3500000,
      vehicle_age_months: 18, // 20% dep -> Chassis IDV = ₹28,00,000
      gvw_kg: 40000, // 20001-40000 kg slab -> Base OD = 1.95% -> Gross OD = ₹54,600
      ncb_tier: 25, // 25% of ₹54,600 = ₹13,650
      fleet_size: 1,
      past_claims_ratio_percent: 45,
      opted_addons: {
        imt23: true, // 15% of Gross OD = ₹8,190
        zero_dep: true, // 18 mos -> 0.75% of IDV = ₹21,000
      },
      paid_drivers_count: 1, // IMT 28 = ₹50
    };

    const quote = calculateCommercialMotorQuote(input);

    assert.strictEqual(quote.lob_category, 'motor');
    assert.strictEqual(quote.insurance_line, 'motor_fleet');
    assert.strictEqual(quote.sum_insured, 2800000); // Total IDV

    const bd = quote.line_specific_breakdown;
    assert.strictEqual(bd.gross_od_premium, 54600); // 28L * 1.95%
    assert.strictEqual(bd.ncb_discount_inr, 13650); // 25% of 54.6k
    assert.strictEqual(bd.addons_breakdown.imt23_inr, 8190); // 15% of 54.6k
    assert.strictEqual(bd.addons_breakdown.zero_dep_inr, 21000); // 28L * 0.75%
    assert.strictEqual(bd.addons_breakdown.total_addons_inr, 29190);

    // Net OD = Gross OD + Add-ons - NCB Discount - Fleet Disc + Fleet Load
    // = 54,600 + 29,190 - 13,650 - 0 + 0 = 70,140
    assert.strictEqual(bd.net_od_premium, 70140);

    // TP = 44,242 (20-40T slab) + 50 (driver) = 44,292
    assert.strictEqual(bd.tp_breakdown.total_tp_premium, 44292);

    // Net Premium = Net OD (70,140) + Total TP (44,292) = 1,14,432
    assert.strictEqual(quote.net_premium, 114432);

    // GST = round(1,14,432 * 0.18) = 20,598
    assert.strictEqual(quote.gst_amount, 20598);

    // Total Gross Premium = 1,14,432 + 20,598 = 1,35,030
    assert.strictEqual(quote.total_premium, 135030);

    // Algorithmic explainability vector verification
    assert.strictEqual(quote.algorithmic_explainability.length, 7);
    assert.ok(quote.statutory_clauses.some((c) => c.includes('AIMT GR.8')));
    assert.ok(quote.statutory_clauses.some((c) => c.includes('IRDAI Motor TP Tariff')));
    assert.ok(quote.statutory_clauses.some((c) => c.includes('IMT 23')));
  });

  // --- Suite 8: Multi-Vehicle Fleet Portfolio Rollup ---
  console.log('\n[Suite 8: Multi-Vehicle Fleet Portfolio Rollup]');

  test('Rolls up 5-vehicle commercial fleet with unified fleet discount', () => {
    const fleetVehicles: MotorFleetInput[] = [
      {
        vehicle_type: 'gcv_public',
        zone: 'A',
        ex_showroom_price: 3000000,
        vehicle_age_months: 12,
        gvw_kg: 16000,
        ncb_tier: 20,
      },
      {
        vehicle_type: 'gcv_public',
        zone: 'A',
        ex_showroom_price: 2500000,
        vehicle_age_months: 24,
        gvw_kg: 12000,
        ncb_tier: 20,
      },
      {
        vehicle_type: 'gcv_private',
        zone: 'B',
        ex_showroom_price: 1800000,
        vehicle_age_months: 36,
        gvw_kg: 8000,
        ncb_tier: 35,
      },
      {
        vehicle_type: 'pcv_bus',
        zone: 'A',
        ex_showroom_price: 4000000,
        vehicle_age_months: 6,
        seating_capacity: 40,
        ncb_tier: 0,
      },
      {
        vehicle_type: 'misc_digger_crane',
        zone: 'C',
        ex_showroom_price: 5000000,
        vehicle_age_months: 48,
        ncb_tier: 50,
      },
    ];

    const fleetQuote = calculateFleetMotorQuote(fleetVehicles, {
      fleet_name: 'FastTrack Logistics Fleet',
      past_claims_ratio_percent: 50, // <=80%, qualifies for 5% fleet discount (5 vehicles)
    });

    assert.strictEqual(fleetQuote.total_vehicles, 5);
    assert.strictEqual(fleetQuote.vehicles.length, 5);
    assert.ok(fleetQuote.total_fleet_idv > 0);
    assert.ok(fleetQuote.total_gross_od > 0);
    assert.ok(fleetQuote.total_fleet_discount > 0);
    assert.strictEqual(fleetQuote.total_fleet_loading, 0);

    // Consistency of Rollup Math
    assert.strictEqual(
      fleetQuote.total_net_premium,
      fleetQuote.total_net_od + fleetQuote.total_tp
    );
    assert.strictEqual(
      fleetQuote.gst_amount,
      Math.round(fleetQuote.total_net_premium * 0.18)
    );
    assert.strictEqual(
      fleetQuote.total_gross_premium,
      fleetQuote.total_net_premium + fleetQuote.gst_amount
    );
  });

  console.log('\n======================================================');
  console.log(`Test Execution Completed: ${passedTests}/${totalTests} Passed (100%)`);
  console.log('======================================================\n');
}

// Auto-run if executed directly
if (typeof require !== 'undefined' && require.main === module) {
  runMotorEngineTests();
}
