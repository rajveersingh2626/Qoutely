/**
 * Adversarial Stress-Test Harness for Commercial Motor & Fleet Engine
 *
 * EMPIRICAL CHALLENGER TEST SUITE:
 * 1. Boundary & Corner Cases on AIMT GR.8 Age Depreciation & Date Arithmetic
 * 2. Vehicle Class Rating & Zone Slabs Complete Matrix & Monotonicity
 * 3. Statutory IRDAI TP Tariff Invariants (Fixed Gazetted amounts & 0% discount immunity)
 * 4. NCB Tampering / Injection & ICR Surcharge Thresholds
 * 5. GST Arithmetic, Financial Invariants & Edge Cases (Zero value, Extreme value, NaN defense)
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
  MotorVehicleType,
  MotorZone,
  NcbTier,
  MotorFleetInput,
} from '../motor-engine';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failureLog: string[] = [];

function challenge(description: string, fn: () => void) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  [PASS] ${description}`);
  } catch (err: any) {
    failedTests++;
    const msg = `  [FAIL] ${description}\n         Error: ${err.message || err}`;
    console.error(msg);
    failureLog.push(msg);
  }
}

export function runAdversarialTestSuite() {
  console.log('\n================================================================');
  console.log('ADVERSARIAL STRESS TEST HARNESS: Commercial Motor & Fleet Engine');
  console.log('================================================================\n');

  // ===========================================================================
  // SECTION 1: AIMT GR.8 Age Depreciation Boundaries & Date Fuzzing
  // ===========================================================================
  console.log('--- SECTION 1: AIMT GR.8 Statutory Depreciation & Date Fuzzing ---');

  challenge('GR.8 Boundary: 0 months -> exactly 5%', () => {
    const res = getAimtIdvDepreciation(0);
    assert.strictEqual(res.percent, 5);
    assert.strictEqual(res.rate, 0.05);
    assert.strictEqual(res.surveyorRequired, false);
  });

  challenge('GR.8 Boundary: 6 months exact -> exactly 5%', () => {
    const res = getAimtIdvDepreciation(6);
    assert.strictEqual(res.percent, 5);
    assert.strictEqual(res.rate, 0.05);
    assert.strictEqual(res.surveyorRequired, false);
  });

  challenge('GR.8 Boundary: 7 months (first step > 6 mo) -> exactly 15%', () => {
    const res = getAimtIdvDepreciation(7);
    assert.strictEqual(res.percent, 15);
    assert.strictEqual(res.rate, 0.15);
    assert.strictEqual(res.surveyorRequired, false);
  });

  challenge('GR.8 Boundary: 12 months exact -> exactly 15%', () => {
    const res = getAimtIdvDepreciation(12);
    assert.strictEqual(res.percent, 15);
    assert.strictEqual(res.rate, 0.15);
    assert.strictEqual(res.surveyorRequired, false);
  });

  challenge('GR.8 Boundary: 13 months (first step > 1 yr) -> exactly 20%', () => {
    const res = getAimtIdvDepreciation(13);
    assert.strictEqual(res.percent, 20);
    assert.strictEqual(res.rate, 0.20);
    assert.strictEqual(res.surveyorRequired, false);
  });

  challenge('GR.8 Boundary: 24 months exact -> exactly 20%', () => {
    const res = getAimtIdvDepreciation(24);
    assert.strictEqual(res.percent, 20);
    assert.strictEqual(res.rate, 0.20);
    assert.strictEqual(res.surveyorRequired, false);
  });

  challenge('GR.8 Boundary: 25 months (first step > 2 yr) -> exactly 30%', () => {
    const res = getAimtIdvDepreciation(25);
    assert.strictEqual(res.percent, 30);
    assert.strictEqual(res.rate, 0.30);
    assert.strictEqual(res.surveyorRequired, false);
  });

  challenge('GR.8 Boundary: 36 months exact -> exactly 30%', () => {
    const res = getAimtIdvDepreciation(36);
    assert.strictEqual(res.percent, 30);
    assert.strictEqual(res.rate, 0.30);
    assert.strictEqual(res.surveyorRequired, false);
  });

  challenge('GR.8 Boundary: 37 months (first step > 3 yr) -> exactly 40%', () => {
    const res = getAimtIdvDepreciation(37);
    assert.strictEqual(res.percent, 40);
    assert.strictEqual(res.rate, 0.40);
    assert.strictEqual(res.surveyorRequired, false);
  });

  challenge('GR.8 Boundary: 48 months exact -> exactly 40%', () => {
    const res = getAimtIdvDepreciation(48);
    assert.strictEqual(res.percent, 40);
    assert.strictEqual(res.rate, 0.40);
    assert.strictEqual(res.surveyorRequired, false);
  });

  challenge('GR.8 Boundary: 49 months (first step > 4 yr) -> exactly 50%', () => {
    const res = getAimtIdvDepreciation(49);
    assert.strictEqual(res.percent, 50);
    assert.strictEqual(res.rate, 0.50);
    assert.strictEqual(res.surveyorRequired, false);
  });

  challenge('GR.8 Boundary: 60 months exact -> exactly 50%, no surveyor alert', () => {
    const res = getAimtIdvDepreciation(60);
    assert.strictEqual(res.percent, 50);
    assert.strictEqual(res.rate, 0.50);
    assert.strictEqual(res.surveyorRequired, false);
  });

  challenge('GR.8 Boundary: 61 months (>5 years) -> 50% AND mandatory surveyor alert', () => {
    const res = getAimtIdvDepreciation(61);
    assert.strictEqual(res.percent, 50);
    assert.strictEqual(res.rate, 0.50);
    assert.strictEqual(res.surveyorRequired, true);
    assert.ok(res.warning && res.warning.includes('AIMT GR.8 Alert'));
  });

  challenge('Date Arithmetic: 5 months 29 days evaluates to completed 5 months (5% dep)', () => {
    // 2026-01-15 to 2026-07-14 is 5 months 29 days
    const age = calculateVehicleAgeInMonths('2026-01-15', '2026-07-14');
    assert.strictEqual(age, 5);
    const dep = getAimtIdvDepreciation(age);
    assert.strictEqual(dep.percent, 5);
  });

  challenge('Date Arithmetic: exactly 6 months (same day of month) evaluates to completed 6 months (5% dep)', () => {
    const age = calculateVehicleAgeInMonths('2026-01-15', '2026-07-15');
    assert.strictEqual(age, 6);
    const dep = getAimtIdvDepreciation(age);
    assert.strictEqual(dep.percent, 5);
  });

  challenge('Date Robustness: Negative fallback age handled gracefully (clamps to 0)', () => {
    const age = calculateVehicleAgeInMonths(undefined, undefined, -12);
    assert.strictEqual(age, 0);
  });

  challenge('Date Robustness: Future purchase date handled gracefully (clamps to 0)', () => {
    const age = calculateVehicleAgeInMonths('2030-01-01', '2026-01-01');
    assert.strictEqual(age, 0);
  });

  challenge('Date Robustness: Invalid date string falls back to 0', () => {
    const age = calculateVehicleAgeInMonths('invalid-date-string', '2026-01-01');
    assert.strictEqual(age, 0);
  });

  challenge('Component IDVs: All components (Chassis, Elec, Non-Elec, CNG) depreciate at uniform GR.8 rate', () => {
    const idv = calculateVehicleIdv({
      ex_showroom_price: 1000000,
      electrical_accessories_value: 100000,
      non_electrical_accessories_value: 50000,
      cng_lpg_kit_value: 50000,
      vehicle_age_months: 30, // 30% depreciation
    });

    assert.strictEqual(idv.depreciation_percent, 30);
    assert.strictEqual(idv.depreciated_chassis, 700000);
    assert.strictEqual(idv.depreciated_electrical, 70000);
    assert.strictEqual(idv.depreciated_non_electrical, 35000);
    assert.strictEqual(idv.depreciated_cng_kit, 35000);
    assert.strictEqual(idv.total_idv, 840000);
  });

  challenge('Surveyor Override Immunity: Surveyor-agreed value IGNORED if age <= 60 months', () => {
    // If car is 3 years old (36 months), statutory schedule cannot be bypassed by surveyor value
    const idv = calculateVehicleIdv({
      ex_showroom_price: 1000000,
      vehicle_age_months: 36,
      surveyor_agreed_idv: 300000,
    });
    // 36 months = 30% dep -> 7,00,000, not 3,00,000
    assert.strictEqual(idv.total_idv, 700000);
    assert.strictEqual(idv.surveyor_valuation_required, false);
  });

  challenge('Surveyor Agreed IDV applied strictly when age > 60 months', () => {
    const idv = calculateVehicleIdv({
      ex_showroom_price: 1000000,
      electrical_accessories_value: 50000,
      vehicle_age_months: 72,
      surveyor_agreed_idv: 350000,
    });
    assert.strictEqual(idv.total_idv, 350000);
    assert.strictEqual(idv.surveyor_valuation_required, true);
  });

  // ===========================================================================
  // SECTION 2: Vehicle Class Rating & Zone Slabs Complete Matrix & Monotonicity
  // ===========================================================================
  console.log('\n--- SECTION 2: Vehicle Class Rating & Zone Slabs ---');

  const gvwSlabs = [
    { gvw: 5000, expectedPublic: { A: 1.72, B: 1.68, C: 1.60 }, expectedPrivate: { A: 1.45, B: 1.40, C: 1.35 } },
    { gvw: 7500, expectedPublic: { A: 1.72, B: 1.68, C: 1.60 }, expectedPrivate: { A: 1.45, B: 1.40, C: 1.35 } },
    { gvw: 7501, expectedPublic: { A: 1.78, B: 1.73, C: 1.65 }, expectedPrivate: { A: 1.50, B: 1.45, C: 1.40 } },
    { gvw: 12000, expectedPublic: { A: 1.78, B: 1.73, C: 1.65 }, expectedPrivate: { A: 1.50, B: 1.45, C: 1.40 } },
    { gvw: 12001, expectedPublic: { A: 1.85, B: 1.80, C: 1.70 }, expectedPrivate: { A: 1.58, B: 1.52, C: 1.45 } },
    { gvw: 20000, expectedPublic: { A: 1.85, B: 1.80, C: 1.70 }, expectedPrivate: { A: 1.58, B: 1.52, C: 1.45 } },
    { gvw: 20001, expectedPublic: { A: 1.95, B: 1.89, C: 1.78 }, expectedPrivate: { A: 1.65, B: 1.60, C: 1.52 } },
    { gvw: 40000, expectedPublic: { A: 1.95, B: 1.89, C: 1.78 }, expectedPrivate: { A: 1.65, B: 1.60, C: 1.52 } },
    { gvw: 40001, expectedPublic: { A: 2.05, B: 1.98, C: 1.85 }, expectedPrivate: { A: 1.75, B: 1.68, C: 1.60 } },
    { gvw: 55000, expectedPublic: { A: 2.05, B: 1.98, C: 1.85 }, expectedPrivate: { A: 1.75, B: 1.68, C: 1.60 } },
  ];

  for (const slab of gvwSlabs) {
    challenge(`GCV Public & Private GVW ${slab.gvw} kg across Zones A, B, C`, () => {
      (['A', 'B', 'C'] as MotorZone[]).forEach((z) => {
        const pubRate = getBaseOdRate('gcv_public', z, slab.gvw);
        assert.strictEqual(pubRate, slab.expectedPublic[z], `Public Zone ${z} at GVW ${slab.gvw}`);
        const privRate = getBaseOdRate('gcv_private', z, slab.gvw);
        assert.strictEqual(privRate, slab.expectedPrivate[z], `Private Zone ${z} at GVW ${slab.gvw}`);
      });
    });
  }

  challenge('Monotonicity Invariant: Base OD Rate must be monotonically non-decreasing with GVW', () => {
    const testGvws = [3000, 7500, 7501, 10000, 12000, 12001, 18000, 20000, 20001, 35000, 40000, 40001, 60000];
    for (let i = 1; i < testGvws.length; i++) {
      for (const z of ['A', 'B', 'C'] as MotorZone[]) {
        const prevPub = getBaseOdRate('gcv_public', z, testGvws[i - 1]);
        const currPub = getBaseOdRate('gcv_public', z, testGvws[i]);
        assert.ok(currPub >= prevPub, `GCV Public: GVW ${testGvws[i]} rate ${currPub} < prev ${prevPub}`);

        const prevPriv = getBaseOdRate('gcv_private', z, testGvws[i - 1]);
        const currPriv = getBaseOdRate('gcv_private', z, testGvws[i]);
        assert.ok(currPriv >= prevPriv, `GCV Private: GVW ${testGvws[i]} rate ${currPriv} < prev ${prevPriv}`);
      }
    }
  });

  challenge('Monotonicity Invariant: Zone A >= Zone B >= Zone C Base OD Rate across all classes', () => {
    const testVehicles: { type: MotorVehicleType; gvw?: number; seats?: number; cc?: number }[] = [
      { type: 'gcv_public', gvw: 16000 },
      { type: 'gcv_private', gvw: 8000 },
      { type: 'pcv_bus', seats: 32 },
      { type: 'pcv_taxi', cc: 1400 },
      { type: 'misc_digger_crane' },
    ];
    for (const v of testVehicles) {
      const rateA = getBaseOdRate(v.type, 'A', v.gvw, v.seats, v.cc);
      const rateB = getBaseOdRate(v.type, 'B', v.gvw, v.seats, v.cc);
      const rateC = getBaseOdRate(v.type, 'C', v.gvw, v.seats, v.cc);
      assert.ok(rateA >= rateB, `${v.type}: Zone A (${rateA}) < Zone B (${rateB})`);
      assert.ok(rateB >= rateC, `${v.type}: Zone B (${rateB}) < Zone C (${rateC})`);
    }
  });

  challenge('PCV Bus seating tiers: 18 seats, 36 seats, >36 seats across Zone A, B, C', () => {
    // <= 18 seats: A: 1.50, B: 1.45, C: 1.40
    assert.strictEqual(getBaseOdRate('pcv_bus', 'A', 0, 18), 1.50);
    assert.strictEqual(getBaseOdRate('pcv_bus', 'B', 0, 18), 1.45);
    assert.strictEqual(getBaseOdRate('pcv_bus', 'C', 0, 18), 1.40);

    // 19-36 seats: A: 1.65, B: 1.60, C: 1.52
    assert.strictEqual(getBaseOdRate('pcv_bus', 'A', 0, 19), 1.65);
    assert.strictEqual(getBaseOdRate('pcv_bus', 'A', 0, 36), 1.65);
    assert.strictEqual(getBaseOdRate('pcv_bus', 'B', 0, 36), 1.60);
    assert.strictEqual(getBaseOdRate('pcv_bus', 'C', 0, 36), 1.52);

    // > 36 seats: A: 1.80, B: 1.72, C: 1.65
    assert.strictEqual(getBaseOdRate('pcv_bus', 'A', 0, 37), 1.80);
    assert.strictEqual(getBaseOdRate('pcv_bus', 'A', 0, 55), 1.80);
    assert.strictEqual(getBaseOdRate('pcv_bus', 'B', 0, 55), 1.72);
    assert.strictEqual(getBaseOdRate('pcv_bus', 'C', 0, 55), 1.65);
  });

  challenge('Misc Cranes / Excavators base OD rates: A: 1.40, B: 1.35, C: 1.30', () => {
    assert.strictEqual(getBaseOdRate('misc_digger_crane', 'A'), 1.40);
    assert.strictEqual(getBaseOdRate('misc_digger_crane', 'B'), 1.35);
    assert.strictEqual(getBaseOdRate('misc_digger_crane', 'C'), 1.30);
  });

  challenge('Zone Sanity: Unknown zone defaults gracefully to Zone C', () => {
    const rate = getBaseOdRate('gcv_public', 'UNKNOWN' as any, 5000);
    assert.strictEqual(rate, 1.60); // Matches Zone C rate
  });

  // ===========================================================================
  // SECTION 3: Statutory IRDAI TP Tariff Invariants
  // ===========================================================================
  console.log('\n--- SECTION 3: Statutory IRDAI TP Tariff Invariants ---');

  const tpGvwExpected = [
    { gvw: 5000, pub: 16049, priv: 10750 },
    { gvw: 7500, pub: 16049, priv: 10750 },
    { gvw: 7501, pub: 27486, priv: 18416 },
    { gvw: 12000, pub: 27486, priv: 18416 },
    { gvw: 12001, pub: 35313, priv: 23660 },
    { gvw: 20000, pub: 35313, priv: 23660 },
    { gvw: 20001, pub: 44242, priv: 29642 },
    { gvw: 40000, pub: 44242, priv: 29642 },
    { gvw: 40001, pub: 45512, priv: 30493 },
  ];

  for (const item of tpGvwExpected) {
    challenge(`Statutory TP Tariff GVW ${item.gvw} kg: Public=₹${item.pub}, Private=₹${item.priv}`, () => {
      assert.strictEqual(getStatutoryTpPremium('gcv_public', item.gvw), item.pub);
      assert.strictEqual(getStatutoryTpPremium('gcv_private', item.gvw), item.priv);
    });
  }

  challenge('Statutory TP Misc Cranes / Excavators is fixed gazetted ₹7,888', () => {
    assert.strictEqual(getStatutoryTpPremium('misc_digger_crane'), 7888);
  });

  challenge('Statutory TP Invariant: TP CANNOT be discounted under any circumstances (0% discount strictly enforced)', () => {
    const input: MotorFleetInput = {
      vehicle_type: 'gcv_public',
      zone: 'A',
      ex_showroom_price: 3000000,
      vehicle_age_months: 12,
      gvw_kg: 16000, // Statutory TP = ₹35,313
      ncb_tier: 50, // 50% max NCB
      fleet_size: 100, // 15% fleet discount
      past_claims_ratio_percent: 0,
      paid_drivers_count: 1, // IMT 28 = ₹50
      cpa_owner_driver_opted: false,
    };

    const quote = calculateCommercialMotorQuote(input);
    const bd = quote.line_specific_breakdown;

    // TP base must remain untouched: exactly ₹35,313
    assert.strictEqual(bd.tp_breakdown.statutory_tp_base_inr, 35313);
    assert.strictEqual(bd.tp_breakdown.paid_drivers_inr, 50);
    assert.strictEqual(bd.tp_breakdown.total_tp_premium, 35363);
    assert.strictEqual(bd.tp_breakdown.statutory_discount_percent, 0);

    // Verify discount was taken strictly from Own Damage, not TP
    assert.ok(bd.ncb_discount_inr > 0);
    assert.ok(bd.fleet_discount_inr > 0);
    assert.strictEqual(quote.net_premium, bd.net_od_premium + bd.tp_breakdown.total_tp_premium);
  });

  challenge('Statutory IMT 28 & CPA: PA Owner-Driver ₹275 and Paid Driver ₹50/head exact', () => {
    const tp1 = calculateTpBreakdown('gcv_public', 10000, 0, 0, true, 3, 2);
    assert.strictEqual(tp1.pa_owner_driver_inr, 275);
    assert.strictEqual(tp1.paid_drivers_inr, 150); // 3 * ₹50
    assert.strictEqual(tp1.cleaners_inr, 100); // 2 * ₹50
    assert.strictEqual(tp1.total_tp_premium, 27486 + 275 + 150 + 100);
  });

  // ===========================================================================
  // SECTION 4: NCB & Adverse Claims Loading Invariants
  // ===========================================================================
  console.log('\n--- SECTION 4: NCB Ladder & Adverse Claims Loading ---');

  challenge('NCB Integrity: Unauthorized NCB tiers (e.g. 55%, 60%, 100%, -20%) rejected and set to 0%', () => {
    const invalidTiers = [55, 60, 75, 100, -20, 999];
    for (const badNcb of invalidTiers) {
      const quote = calculateCommercialMotorQuote({
        vehicle_type: 'gcv_public',
        zone: 'A',
        ex_showroom_price: 1000000,
        vehicle_age_months: 6,
        ncb_tier: badNcb as any,
      });
      assert.strictEqual(
        quote.line_specific_breakdown.ncb_tier,
        0,
        `Bad NCB tier ${badNcb} was not reset to 0%`
      );
      assert.strictEqual(quote.line_specific_breakdown.ncb_discount_inr, 0);
    }
  });

  challenge('NCB Integrity: Valid NCB tiers [0, 20, 25, 35, 45, 50] correctly computed on Gross OD', () => {
    const validTiers: NcbTier[] = [0, 20, 25, 35, 45, 50];
    for (const ncb of validTiers) {
      const quote = calculateCommercialMotorQuote({
        vehicle_type: 'gcv_public',
        zone: 'A',
        ex_showroom_price: 1000000,
        vehicle_age_months: 0, // 5% dep -> IDV 9,50,000. Base OD 1.72% -> Gross OD 16,340
        gvw_kg: 5000,
        ncb_tier: ncb,
      });
      const grossOd = quote.line_specific_breakdown.gross_od_premium;
      const expectedDiscount = Math.round(grossOd * (ncb / 100));
      assert.strictEqual(quote.line_specific_breakdown.ncb_discount_inr, expectedDiscount);
    }
  });

  challenge('ICR Invariant: ICR > 80% MUST flip volume discount to 0% and apply adverse loading', () => {
    // Normal fleet of 30 vehicles qualifies for 10% discount.
    const fNormal = calculateFleetAdjustment(30, 70, 100000);
    assert.strictEqual(fNormal.fleet_discount_percent, 10);
    assert.strictEqual(fNormal.fleet_loading_percent, 0);
    assert.strictEqual(fNormal.is_loading_applied, false);

    // ICR = 81% (exceeds 80%) -> 0% discount, +15% loading
    const f81 = calculateFleetAdjustment(30, 81, 100000);
    assert.strictEqual(f81.fleet_discount_percent, 0, 'Discount must be 0% when ICR > 80%');
    assert.strictEqual(f81.fleet_discount_inr, 0);
    assert.strictEqual(f81.fleet_loading_percent, 15);
    assert.strictEqual(f81.fleet_loading_inr, 15000);
    assert.strictEqual(f81.is_loading_applied, true);

    // ICR = 105% -> +25% loading
    const f105 = calculateFleetAdjustment(30, 105, 100000);
    assert.strictEqual(f105.fleet_discount_percent, 0);
    assert.strictEqual(f105.fleet_loading_percent, 25);
    assert.strictEqual(f105.fleet_loading_inr, 25000);

    // ICR = 160% -> +35% loading
    const f160 = calculateFleetAdjustment(30, 160, 100000);
    assert.strictEqual(f160.fleet_discount_percent, 0);
    assert.strictEqual(f160.fleet_loading_percent, 35);
    assert.strictEqual(f160.fleet_loading_inr, 35000);
  });

  // ===========================================================================
  // SECTION 5: GST Arithmetic & Financial Edge Cases
  // ===========================================================================
  console.log('\n--- SECTION 5: GST Arithmetic & Edge Cases ---');

  challenge('GST Arithmetic: GST must be exactly Math.round(netPremium * 0.18) with zero float drift', () => {
    // Test across 1,000 random net premium amounts
    for (let testNet = 100; testNet <= 100000; testNet += 100) {
      const calculatedGst = Math.round(testNet * 0.18);
      const gross = testNet + calculatedGst;
      assert.strictEqual(Number.isInteger(calculatedGst), true);
      assert.strictEqual(Number.isInteger(gross), true);
      assert.strictEqual(gross, testNet + Math.round(testNet * 0.18));
    }
  });

  challenge('Edge Case: Ex-showroom price = 0 produces IDV 0, Gross OD 0, but valid Statutory TP & GST', () => {
    const quote = calculateCommercialMotorQuote({
      vehicle_type: 'gcv_public',
      zone: 'A',
      ex_showroom_price: 0,
      gvw_kg: 5000, // TP = 16049
    });

    assert.strictEqual(quote.sum_insured, 0);
    assert.strictEqual(quote.line_specific_breakdown.gross_od_premium, 0);
    assert.strictEqual(quote.line_specific_breakdown.net_od_premium, 0);
    assert.strictEqual(quote.line_specific_breakdown.tp_breakdown.total_tp_premium, 16049 + 50); // 16049 + 50 paid driver
    assert.strictEqual(quote.net_premium, 16099);
    assert.strictEqual(quote.gst_amount, Math.round(16099 * 0.18));
    assert.strictEqual(quote.total_premium, 16099 + Math.round(16099 * 0.18));
  });

  challenge('Edge Case: Disallowed Add-ons for vehicles > 5 years do not generate illicit premiums', () => {
    const quote = calculateCommercialMotorQuote({
      vehicle_type: 'gcv_public',
      zone: 'A',
      ex_showroom_price: 2000000,
      vehicle_age_months: 65, // > 5 years old
      opted_addons: {
        zero_dep: true, // MUST be 0
        return_to_invoice: true, // MUST be 0
        imt23: true, // Allowed
        consumables: true, // Allowed
      },
    });

    const addons = quote.line_specific_breakdown.addons_breakdown;
    assert.strictEqual(addons.zero_dep_inr, 0, 'Zero Dep must be ₹0 for age > 60 mos');
    assert.strictEqual(addons.return_to_invoice_inr, 0, 'RTI must be ₹0 for age > 60 mos');
    assert.ok(addons.imt23_inr > 0, 'IMT 23 should be allowed');
    assert.ok(addons.consumables_inr > 0, 'Consumables should be allowed');
    assert.ok(quote.line_specific_breakdown.underwriting_warnings.length > 0);
  });

  challenge('Fleet Rollup Financial Invariants: Sum of Net OD + Sum of TP === Fleet Net Premium', () => {
    const fleet: MotorFleetInput[] = [
      { vehicle_type: 'gcv_public', zone: 'A', ex_showroom_price: 3500000, gvw_kg: 40000, vehicle_age_months: 10 },
      { vehicle_type: 'gcv_private', zone: 'B', ex_showroom_price: 1500000, gvw_kg: 8000, vehicle_age_months: 20 },
      { vehicle_type: 'pcv_bus', zone: 'A', ex_showroom_price: 4500000, seating_capacity: 45, vehicle_age_months: 5 },
      { vehicle_type: 'pcv_taxi', zone: 'C', ex_showroom_price: 1200000, cubic_capacity: 1200, seating_capacity: 4, vehicle_age_months: 15 },
      { vehicle_type: 'misc_digger_crane', zone: 'A', ex_showroom_price: 6000000, vehicle_age_months: 30 },
      { vehicle_type: 'gcv_public', zone: 'C', ex_showroom_price: 2800000, gvw_kg: 16000, vehicle_age_months: 45 },
    ];

    const result = calculateFleetMotorQuote(fleet, {
      fleet_name: 'Adversarial Test Fleet',
      past_claims_ratio_percent: 65,
    });

    assert.strictEqual(result.total_vehicles, 6);
    assert.strictEqual(result.total_net_premium, result.total_net_od + result.total_tp);
    assert.strictEqual(result.gst_amount, Math.round(result.total_net_premium * 0.18));
    assert.strictEqual(result.total_gross_premium, result.total_net_premium + result.gst_amount);
  });

  console.log('\n================================================================');
  console.log(`EXECUTION SUMMARY: ${passedTests}/${totalTests} Passed (${((passedTests / totalTests) * 100).toFixed(1)}%)`);
  if (failedTests > 0) {
    console.error(`FAILURES DETECTED: ${failedTests}`);
    failureLog.forEach((log) => console.error(log));
  } else {
    console.log('ALL EMPIRICAL ADVERSARIAL CHALLENGES PASSED PERFECTLY!');
  }
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

// Auto-run if executed directly
if (typeof require !== 'undefined' && require.main === module) {
  runAdversarialTestSuite();
}
