/**
 * Adversarial Statutory & Stress Testing Suite for Milestone 14: Employee Benefits
 *
 * Authored by: teamwork_challenger (Challenger 2)
 * Scope:
 * 1. Statutory Workmen's Compensation (EC Act 1923 Sec 4 & Schedule IV):
 *    - Strict ₹15,000 monthly wage ceiling enforcement (₹1k, ₹14,999, ₹15,000, ₹15,001, ₹1,00,000).
 *    - Exhaustive testing across all Schedule IV age brackets (18, 25, 30, 35, 40, 45, 50, 55, 65).
 *    - Precise boundary transitions at ages 20/21, 25/26, 30/31, 35/36, 40/41, 45/46, 50/51, 55/56.
 *    - Low wage boundary where Death falls below ₹1,20,000 (clamped to ₹1,20,000 floor).
 *    - Low wage boundary where PTD falls below ₹1,40,000 (clamped to ₹1,40,000 floor).
 *    - Exact tipping point wage calculations for Death and PTD statutory floors.
 *    - Empty worker array rejection.
 *    - Wage roll tariff + 25% medical extension loading.
 * 2. Group Term Life Insurance (GTLI):
 *    - Empty member array rejection.
 *    - Strict Free Cover Limit (FCL) threshold detection: FCL - 1 vs FCL vs FCL + 1.
 *    - Full 5x3 matrix of 5 age tiers x 3 occupation hazard multipliers (1.0x, 1.2x, 1.5x).
 *    - Age tier transitions at ages 25/26, 35/36, 45/46, 55/56.
 * 3. Group Personal Accident (GPA):
 *    - All 12 combinations of Hazard Class (1, 2, 3) x TTD rider (true/false) x Medical extension (true/false).
 *    - Large scale headcount and extreme sum insured testing.
 * 4. GHI & Studio Package Integration:
 *    - Zero lives rejection.
 *    - Corporate buffer group size threshold (49 lives throws, 50 lives succeeds).
 *    - Full compliance validation against `validateQuoteSchema` from canonical_engines.ts.
 */

import assert from 'node:assert';
import {
  calculateGhiDemographicPremium,
  calculateGhiBenefitLoadings,
  calculateGtliPremium,
  calculateGpaPremium,
  calculateWorkmensCompensation,
  parseEmployeeCensusRoster,
  computeBenefitsStudioLedger,
  calculateGhiQuote,
  calculateGtliQuote,
  calculateGpaQuote,
  calculateWcQuote,
  calculateBenefitsQuote,
  WC_STATUTORY_WAGE_CAP,
  WC_STATUTORY_MIN_DEATH,
  WC_STATUTORY_MIN_PTD,
  WC_SCHEDULE_IV_FACTORS,
  GTLI_MORTALITY_RATES_PER_MILLE,
  GTLI_HAZARD_MULTIPLIERS,
  GPA_HAZARD_RATES_PER_MILLE,
  GPA_TTD_RIDER_RATE_PER_MILLE,
  GPA_MEDICAL_EXTENSION_PERCENT,
  STATUTORY_GST_RATE,
} from '../benefits-engine';
import { validateQuoteSchema } from '../../../../tests/e2e/canonical_engines';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function test(name: string, fn: () => void) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ PASS: ${name}`);
  } catch (err: any) {
    failedTests++;
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    ${err.message || err}`);
    throw err;
  }
}

console.log('======================================================================');
console.log('  STARTING ADVERSARIAL STRESS TEST SUITE: EMPLOYEE BENEFITS (M14)');
console.log('======================================================================\n');

// ============================================================================
// SUITE 1: STATUTORY WORKMEN\'S COMPENSATION (EC ACT 1923 SEC 4 & SCHEDULE IV)
// ============================================================================
console.log('--- Suite 1: Statutory Workmen\'s Compensation (EC Act 1923) ---');

test('WC 1.1: Empty worker roster throws exact statutory error', () => {
  assert.throws(
    () => {
      calculateWorkmensCompensation({
        workers: [],
        trade_hazard_rate_percent: 0.5,
        medical_extension_opted: false,
      });
    },
    (err: any) => {
      assert.strictEqual(err.message, 'Worker list cannot be empty');
      return true;
    }
  );
});

test('WC 1.2: Monthly wage ceiling strictly enforced at ₹15,000 for ₹14,999, ₹15,000, ₹15,001, ₹1,00,000', () => {
  const age = 30; // Schedule IV Factor = 207.98

  // Case A: ₹14,999 (strictly below cap)
  const res14999 = calculateWorkmensCompensation({
    workers: [{ age, monthly_wage: 14999 }],
    trade_hazard_rate_percent: 1.0,
    medical_extension_opted: false,
  });
  // Death: 0.50 * 14999 * 207.98 = 1559742.01 -> Math.round -> 1559742
  // PTD: 0.60 * 14999 * 207.98 = 1871690.412 -> Math.round -> 1871690
  assert.strictEqual(res14999.total_annual_wageroll, 14999 * 12);
  assert.strictEqual(res14999.statutory_death_liability, Math.round(0.50 * 14999 * 207.98));
  assert.strictEqual(res14999.statutory_ptd_liability, Math.round(0.60 * 14999 * 207.98));

  // Case B: ₹15,000 (exact cap boundary)
  const res15000 = calculateWorkmensCompensation({
    workers: [{ age, monthly_wage: 15000 }],
    trade_hazard_rate_percent: 1.0,
    medical_extension_opted: false,
  });
  // Death: 0.50 * 15000 * 207.98 = 7500 * 207.98 = 1559850
  // PTD: 0.60 * 15000 * 207.98 = 9000 * 207.98 = 1871820
  assert.strictEqual(res15000.total_annual_wageroll, 15000 * 12);
  assert.strictEqual(res15000.statutory_death_liability, 1559850);
  assert.strictEqual(res15000.statutory_ptd_liability, 1871820);

  // Case C: ₹15,001 (₹1 above cap)
  const res15001 = calculateWorkmensCompensation({
    workers: [{ age, monthly_wage: 15001 }],
    trade_hazard_rate_percent: 1.0,
    medical_extension_opted: false,
  });
  // Payroll scales to 15001 * 12 = 180012, but statutory liabilities MUST be identical to ₹15,000 cap
  assert.strictEqual(res15001.total_annual_wageroll, 15001 * 12);
  assert.strictEqual(res15001.statutory_death_liability, 1559850);
  assert.strictEqual(res15001.statutory_ptd_liability, 1871820);

  // Case D: ₹1,00,000 (executive salary far above cap)
  const res100k = calculateWorkmensCompensation({
    workers: [{ age, monthly_wage: 100000 }],
    trade_hazard_rate_percent: 1.0,
    medical_extension_opted: false,
  });
  assert.strictEqual(res100k.total_annual_wageroll, 100000 * 12);
  assert.strictEqual(res100k.statutory_death_liability, 1559850);
  assert.strictEqual(res100k.statutory_ptd_liability, 1871820);
});

test('WC 1.3: Exhaustive Schedule IV age factors validation across all 9 statutory age brackets', () => {
  const scheduleIvExpectations = [
    { age: 18, factor: 224.00, desc: '<= 20' },
    { age: 25, factor: 216.91, desc: '<= 25' },
    { age: 30, factor: 207.98, desc: '<= 30' },
    { age: 35, factor: 197.06, desc: '<= 35' },
    { age: 40, factor: 184.17, desc: '<= 40' },
    { age: 45, factor: 169.44, desc: '<= 45' },
    { age: 50, factor: 153.09, desc: '<= 50' },
    { age: 55, factor: 135.56, desc: '<= 55' },
    { age: 65, factor: 117.41, desc: '> 55' },
  ];

  for (const { age, factor, desc } of scheduleIvExpectations) {
    const res = calculateWorkmensCompensation({
      workers: [{ age, monthly_wage: 15000 }],
      trade_hazard_rate_percent: 0.5,
      medical_extension_opted: false,
    });

    const expectedDeath = Math.round(0.50 * 15000 * factor);
    const expectedPtd = Math.round(0.60 * 15000 * factor);

    assert.strictEqual(
      res.statutory_death_liability,
      expectedDeath,
      `Death liability mismatch at age ${age} (${desc}) with factor ${factor}`
    );
    assert.strictEqual(
      res.statutory_ptd_liability,
      expectedPtd,
      `PTD liability mismatch at age ${age} (${desc}) with factor ${factor}`
    );
  }
});

test('WC 1.4: Strict boundary transitions across all adjacent Schedule IV brackets', () => {
  const transitions = [
    { youngAge: 20, youngFactor: 224.00, olderAge: 21, olderFactor: 216.91 },
    { youngAge: 25, youngFactor: 216.91, olderAge: 26, olderFactor: 207.98 },
    { youngAge: 30, youngFactor: 207.98, olderAge: 31, olderFactor: 197.06 },
    { youngAge: 35, youngFactor: 197.06, olderAge: 36, olderFactor: 184.17 },
    { youngAge: 40, youngFactor: 184.17, olderAge: 41, olderFactor: 169.44 },
    { youngAge: 45, youngFactor: 169.44, olderAge: 46, olderFactor: 153.09 },
    { youngAge: 50, youngFactor: 153.09, olderAge: 51, olderFactor: 135.56 },
    { youngAge: 55, youngFactor: 135.56, olderAge: 56, olderFactor: 117.41 },
  ];

  for (const t of transitions) {
    const resYoung = calculateWorkmensCompensation({
      workers: [{ age: t.youngAge, monthly_wage: 15000 }],
      trade_hazard_rate_percent: 1.0,
      medical_extension_opted: false,
    });
    const resOlder = calculateWorkmensCompensation({
      workers: [{ age: t.olderAge, monthly_wage: 15000 }],
      trade_hazard_rate_percent: 1.0,
      medical_extension_opted: false,
    });

    assert.strictEqual(resYoung.statutory_death_liability, Math.round(0.50 * 15000 * t.youngFactor));
    assert.strictEqual(resOlder.statutory_death_liability, Math.round(0.50 * 15000 * t.olderFactor));
    assert.ok(
      resYoung.statutory_death_liability > resOlder.statutory_death_liability,
      `Younger worker at age ${t.youngAge} must have higher statutory factor than older worker at age ${t.olderAge}`
    );
  }
});

test('WC 1.5: Low wage boundary where Death falls below ₹1,20,000 (clamped to ₹1,20,000 statutory floor)', () => {
  // Test low monthly wage = ₹1,000 across multiple ages
  const resAge65 = calculateWorkmensCompensation({
    workers: [{ age: 65, monthly_wage: 1000 }],
    trade_hazard_rate_percent: 1.0,
    medical_extension_opted: false,
  });
  // 50% * 1000 * 117.41 = 58,705. Since 58,705 < 120,000, must be clamped to 120,000
  assert.strictEqual(resAge65.statutory_death_liability, 120000);

  const resAge18 = calculateWorkmensCompensation({
    workers: [{ age: 18, monthly_wage: 1000 }],
    trade_hazard_rate_percent: 1.0,
    medical_extension_opted: false,
  });
  // 50% * 1000 * 224.00 = 112,000 < 120,000 -> must be clamped to 120,000
  assert.strictEqual(resAge18.statutory_death_liability, 120000);
});

test('WC 1.6: Low wage boundary where PTD falls below ₹1,40,000 (clamped to ₹1,40,000 statutory floor)', () => {
  const resAge65 = calculateWorkmensCompensation({
    workers: [{ age: 65, monthly_wage: 1000 }],
    trade_hazard_rate_percent: 1.0,
    medical_extension_opted: false,
  });
  // 60% * 1000 * 117.41 = 70,446 < 140,000 -> must be clamped to 140,000
  assert.strictEqual(resAge65.statutory_ptd_liability, 140000);

  const resAge18 = calculateWorkmensCompensation({
    workers: [{ age: 18, monthly_wage: 1000 }],
    trade_hazard_rate_percent: 1.0,
    medical_extension_opted: false,
  });
  // 60% * 1000 * 224.00 = 134,400 < 140,000 -> must be clamped to 140,000
  assert.strictEqual(resAge18.statutory_ptd_liability, 140000);
});

test('WC 1.7: Mathematical tipping point for statutory floor enforcement', () => {
  // For age 18 (factor = 224.00):
  // Death formula = 0.50 * wage * 224.00 = 112 * wage.
  // Floor ₹1,20,000 tipping wage: 120,000 / 112 = 1071.428...
  // Wage 1071: 112 * 1071 = 119,952 < 120,000 -> floor 120,000
  // Wage 1072: 112 * 1072 = 120,064 > 120,000 -> 120,064

  const resDeathBelow = calculateWorkmensCompensation({
    workers: [{ age: 18, monthly_wage: 1071 }],
    trade_hazard_rate_percent: 1.0,
    medical_extension_opted: false,
  });
  assert.strictEqual(resDeathBelow.statutory_death_liability, 120000);

  const resDeathAbove = calculateWorkmensCompensation({
    workers: [{ age: 18, monthly_wage: 1072 }],
    trade_hazard_rate_percent: 1.0,
    medical_extension_opted: false,
  });
  assert.strictEqual(resDeathAbove.statutory_death_liability, 120064);

  // PTD formula for age 18 = 0.60 * wage * 224.00 = 134.4 * wage.
  // Floor ₹1,40,000 tipping wage: 140,000 / 134.4 = 1041.666...
  // Wage 1041: 134.4 * 1041 = 139,910.4 < 140,000 -> floor 140,000
  // Wage 1042: 134.4 * 1042 = 140,044.8 > 140,000 -> 140,045

  const resPtdBelow = calculateWorkmensCompensation({
    workers: [{ age: 18, monthly_wage: 1041 }],
    trade_hazard_rate_percent: 1.0,
    medical_extension_opted: false,
  });
  assert.strictEqual(resPtdBelow.statutory_ptd_liability, 140000);

  const resPtdAbove = calculateWorkmensCompensation({
    workers: [{ age: 18, monthly_wage: 1042 }],
    trade_hazard_rate_percent: 1.0,
    medical_extension_opted: false,
  });
  assert.strictEqual(resPtdAbove.statutory_ptd_liability, Math.round(140044.8));
});

test('WC 1.8: Trade hazard rate and +25% medical extension loading arithmetic', () => {
  const workers = [
    { age: 25, monthly_wage: 20000 },
    { age: 45, monthly_wage: 30000 },
  ];
  // Total annual wageroll = (20000 + 30000) * 12 = 600,000
  const rate = 0.85; // 0.85%

  const resNoMed = calculateWorkmensCompensation({
    workers,
    trade_hazard_rate_percent: rate,
    medical_extension_opted: false,
  });
  // base = 600000 * 0.85% = 5,100
  assert.strictEqual(resNoMed.total_annual_wageroll, 600000);
  assert.strictEqual(resNoMed.net_wc_premium, 5100);

  const resWithMed = calculateWorkmensCompensation({
    workers,
    trade_hazard_rate_percent: rate,
    medical_extension_opted: true,
  });
  // 5100 * 1.25 = 6,375
  assert.strictEqual(resWithMed.net_wc_premium, 6375);
});

// ============================================================================
// SUITE 2: GROUP TERM LIFE INSURANCE (GTLI) STRESS HARNESS
// ============================================================================
console.log('\n--- Suite 2: Group Term Life Insurance (GTLI) ---');

test('GTLI 2.1: Empty members array throws exact statutory error', () => {
  assert.throws(
    () => {
      calculateGtliPremium([]);
    },
    (err: any) => {
      assert.strictEqual(err.message, 'No members provided for GTLI');
      return true;
    }
  );
});

test('GTLI 2.2: Free Cover Limit (FCL) threshold detection (FCL vs FCL + 1 vs FCL - 1)', () => {
  const customFcl = 2500000; // ₹25 Lakhs

  // Member exactly equal to FCL
  const resEqual = calculateGtliPremium(
    [{ age: 30, sum_insured: customFcl }],
    customFcl
  );
  assert.strictEqual(resEqual.members_requiring_medical, 0, 'Member exactly at FCL does not require medical review');

  // Member at FCL - 1
  const resBelow = calculateGtliPremium(
    [{ age: 30, sum_insured: customFcl - 1 }],
    customFcl
  );
  assert.strictEqual(resBelow.members_requiring_medical, 0, 'Member below FCL does not require medical review');

  // Member at FCL + 1
  const resAbove = calculateGtliPremium(
    [{ age: 30, sum_insured: customFcl + 1 }],
    customFcl
  );
  assert.strictEqual(resAbove.members_requiring_medical, 1, 'Member at FCL + 1 must be flagged for medical review');

  // Mixed cohort: 3 members: one below, one equal, one above
  const resMixed = calculateGtliPremium(
    [
      { age: 25, sum_insured: customFcl - 500000 },
      { age: 35, sum_insured: customFcl },
      { age: 45, sum_insured: customFcl + 1000000 },
    ],
    customFcl
  );
  assert.strictEqual(resMixed.members_requiring_medical, 1);
  assert.strictEqual(resMixed.total_members, 3);
  assert.strictEqual(resMixed.total_sum_insured, 3 * customFcl + 500000);
});

test('GTLI 2.3: Exhaustive 5x3 Matrix of Age Tiers x Hazard Multipliers (15 combinations)', () => {
  const ageTiers = [
    { age: 22, qx: 0.88, tier: '<= 25' },
    { age: 32, qx: 1.05, tier: '26 to 35' },
    { age: 42, qx: 1.80, tier: '36 to 45' },
    { age: 52, qx: 4.95, tier: '46 to 55' },
    { age: 62, qx: 11.50, tier: '> 55' },
  ];

  const hazardClasses: Array<{ hazard: 1 | 2 | 3; mult: number }> = [
    { hazard: 1, mult: 1.0 },
    { hazard: 2, mult: 1.2 },
    { hazard: 3, mult: 1.5 },
  ];

  const si = 1000000; // ₹10 Lakhs

  for (const tier of ageTiers) {
    for (const h of hazardClasses) {
      const res = calculateGtliPremium([
        { age: tier.age, sum_insured: si, hazard_class: h.hazard },
      ]);

      const expectedPrem = Math.round((si * tier.qx * h.mult) / 1000);
      assert.strictEqual(
        res.total_gtli_premium,
        expectedPrem,
        `GTLI premium mismatch for age tier ${tier.tier} (age ${tier.age}) with hazard class ${h.hazard} (${h.mult}x)`
      );
    }
  }
});

test('GTLI 2.4: Age tier boundary transitions at ages 25/26, 35/36, 45/46, 55/56', () => {
  const boundaries = [
    { youngAge: 25, youngQx: 0.88, olderAge: 26, olderQx: 1.05 },
    { youngAge: 35, youngQx: 1.05, olderAge: 36, olderQx: 1.80 },
    { youngAge: 45, youngQx: 1.80, olderAge: 46, olderQx: 4.95 },
    { youngAge: 55, youngQx: 4.95, olderAge: 56, olderQx: 11.50 },
  ];

  const si = 2000000;

  for (const b of boundaries) {
    const resYoung = calculateGtliPremium([{ age: b.youngAge, sum_insured: si, hazard_class: 1 }]);
    const resOlder = calculateGtliPremium([{ age: b.olderAge, sum_insured: si, hazard_class: 1 }]);

    const expectedYoung = Math.round((si * b.youngQx) / 1000);
    const expectedOlder = Math.round((si * b.olderQx) / 1000);

    assert.strictEqual(resYoung.total_gtli_premium, expectedYoung);
    assert.strictEqual(resOlder.total_gtli_premium, expectedOlder);
    assert.ok(resOlder.total_gtli_premium > resYoung.total_gtli_premium);
  }
});

// ============================================================================
// SUITE 3: GROUP PERSONAL ACCIDENT (GPA) STRESS HARNESS
// ============================================================================
console.log('\n--- Suite 3: Group Personal Accident (GPA) ---');

test('GPA 3.1: All 12 combinations of Hazard Class (1, 2, 3) x TTD rider x Medical extension', () => {
  const hazardRates: Record<1 | 2 | 3, number> = {
    1: 0.35,
    2: 0.65,
    3: 1.50,
  };

  const headcount = 100;
  const siPerLife = 500000;
  const totalSi = headcount * siPerLife; // 50,000,000

  for (const h of [1, 2, 3] as const) {
    for (const ttd of [false, true]) {
      for (const med of [false, true]) {
        const res = calculateGpaPremium({
          headcount,
          sum_insured_per_life: siPerLife,
          hazard_class: h,
          ttd_opted: ttd,
          medical_extension_opted: med,
        });

        const expectedBaseRate = hazardRates[h];
        const expectedBase = Math.round((totalSi * expectedBaseRate) / 1000);
        const expectedTtd = ttd ? Math.round((totalSi * 0.15) / 1000) : 0;
        const expectedMed = med ? Math.round(expectedBase * 0.10) : 0;
        const expectedTotal = expectedBase + expectedTtd + expectedMed;

        assert.strictEqual(res.rate_per_mille, expectedBaseRate);
        assert.strictEqual(res.base_gpa_premium, expectedBase);
        assert.strictEqual(res.ttd_premium, expectedTtd);
        assert.strictEqual(res.medical_premium, expectedMed);
        assert.strictEqual(res.total_gpa_premium, expectedTotal);
      }
    }
  }
});

test('GPA 3.2: High scale enterprise stress test (5,000 headcount with ₹25 Lakhs SI)', () => {
  const headcount = 5000;
  const siPerLife = 2500000; // ₹25L
  const totalSi = headcount * siPerLife; // ₹1250 Crores = 12,500,000,000

  const res = calculateGpaPremium({
    headcount,
    sum_insured_per_life: siPerLife,
    hazard_class: 2, // 0.65‰
    ttd_opted: true,  // 0.15‰
    medical_extension_opted: true, // 10% on base
  });

  const base = Math.round((totalSi * 0.65) / 1000); // 8,125,000
  const ttd = Math.round((totalSi * 0.15) / 1000);  // 1,875,000
  const med = Math.round(base * 0.10);             // 812,500
  const total = base + ttd + med;                  // 10,812,500

  assert.strictEqual(res.base_gpa_premium, 8125000);
  assert.strictEqual(res.ttd_premium, 1875000);
  assert.strictEqual(res.medical_premium, 812500);
  assert.strictEqual(res.total_gpa_premium, 10812500);
});

// ============================================================================
// SUITE 4: GHI & MULTI-LINE PACKAGE INTEGRATION & STANDARD CONTRACTS
// ============================================================================
console.log('\n--- Suite 4: GHI & Standard Contract Quote Integrity ---');

test('GHI 4.1: Zero lives census rejection', () => {
  assert.throws(
    () => {
      calculateGhiDemographicPremium({
        age_0_25: 0,
        age_26_35: 0,
        age_36_45: 0,
        age_46_55: 0,
        age_56_65: 0,
        age_66_75: 0,
        age_76_plus: 0,
      });
    },
    /Census must have at least one life/
  );
});

test('GHI 4.2: Corporate buffer minimum threshold (49 lives throws, 50 lives succeeds)', () => {
  // 49 lives should throw
  assert.throws(
    () => {
      calculateGhiBenefitLoadings(100000, {
        room_rent: 'standard_1_percent',
        maternity_opted: false,
        maternity_day_1_waiver: false,
        ped_waiver_day_1: false,
        corporate_buffer_amount: 1000000,
        group_size: 49,
      });
    },
    /Corporate buffer requires minimum group size of 50 lives/
  );

  // 50 lives should succeed with 3.5% rate
  const res50 = calculateGhiBenefitLoadings(100000, {
    room_rent: 'standard_1_percent',
    maternity_opted: false,
    maternity_day_1_waiver: false,
    ped_waiver_day_1: false,
    corporate_buffer_amount: 1000000,
    group_size: 50,
  });
  assert.strictEqual(res50.corporate_buffer_premium, 35000); // 1,000,000 * 3.5%
  assert.strictEqual(res50.total_ghi_premium, 100000 + 35000);
});

test('Standard Contract 4.3: calculateGhiQuote conforms to StandardQuoteBreakdown and passes schema validation', () => {
  const quote = calculateGhiQuote({
    corporate_name: 'Adversarial Tech Pvt Ltd',
    age_bands: {
      age_0_25: 20,
      age_26_35: 50,
      age_36_45: 30,
      age_46_55: 10,
      age_56_65: 5,
      age_66_75: 0,
      age_76_plus: 0,
    },
    base_sum_insured: 500000,
    benefit_options: {
      room_rent: 'single_private_room',
      maternity_opted: true,
      maternity_day_1_waiver: true,
      ped_waiver_day_1: true,
      corporate_buffer_amount: 500000,
      group_size: 115,
    },
  });

  const quoteRecord = {
    id: 'test-ghi-quote-1',
    ...quote,
  };
  const validation = validateQuoteSchema(quoteRecord);
  assert.strictEqual(validation.valid, true, `Quote schema failed: ${validation.errors.join(', ')}`);
  assert.strictEqual(quote.gst_amount, Math.round(quote.net_premium * 0.18));
  assert.strictEqual(quote.total_premium, quote.net_premium + quote.gst_amount);
  assert.ok(quote.statutory_clauses.length >= 4);
  assert.ok(quote.algorithmic_explainability.length >= 4);
});

test('Standard Contract 4.4: calculateGtliQuote conforms to StandardQuoteBreakdown and passes schema validation', () => {
  const quote = calculateGtliQuote({
    corporate_name: 'Adversarial Tech Pvt Ltd',
    members: [
      { age: 28, sum_insured: 2500000, hazard_class: 1 },
      { age: 34, sum_insured: 5000000, hazard_class: 1 },
      { age: 52, sum_insured: 7500000, hazard_class: 2 },
    ],
    free_cover_limit: 5000000,
  });

  const quoteRecord = {
    id: 'test-gtli-quote-1',
    ...quote,
  };
  const validation = validateQuoteSchema(quoteRecord);
  assert.strictEqual(validation.valid, true, `Quote schema failed: ${validation.errors.join(', ')}`);
  assert.strictEqual(quote.gst_amount, Math.round(quote.net_premium * 0.18));
  assert.strictEqual(quote.total_premium, quote.net_premium + quote.gst_amount);
  assert.strictEqual((quote.line_specific_breakdown as any).members_requiring_medical, 1);
});

test('Standard Contract 4.5: calculateGpaQuote conforms to StandardQuoteBreakdown and passes schema validation', () => {
  const quote = calculateGpaQuote({
    corporate_name: 'Adversarial Tech Pvt Ltd',
    headcount: 250,
    sum_insured_per_life: 1000000,
    hazard_class: 2,
    ttd_opted: true,
    medical_extension_opted: true,
  });

  const quoteRecord = {
    id: 'test-gpa-quote-1',
    ...quote,
  };
  const validation = validateQuoteSchema(quoteRecord);
  assert.strictEqual(validation.valid, true, `Quote schema failed: ${validation.errors.join(', ')}`);
  assert.strictEqual(quote.gst_amount, Math.round(quote.net_premium * 0.18));
  assert.strictEqual(quote.total_premium, quote.net_premium + quote.gst_amount);
});

test('Standard Contract 4.6: calculateWcQuote conforms to StandardQuoteBreakdown and passes schema validation', () => {
  const quote = calculateWcQuote({
    corporate_name: 'Adversarial Infraworks Ltd',
    workers: [
      { age: 24, monthly_wage: 14000 },
      { age: 38, monthly_wage: 18000 },
      { age: 52, monthly_wage: 28000 },
    ],
    trade_hazard_rate_percent: 1.15,
    medical_extension_opted: true,
  });

  const quoteRecord = {
    id: 'test-wc-quote-1',
    ...quote,
  };
  const validation = validateQuoteSchema(quoteRecord);
  assert.strictEqual(validation.valid, true, `Quote schema failed: ${validation.errors.join(', ')}`);
  assert.strictEqual(quote.gst_amount, Math.round(quote.net_premium * 0.18));
  assert.strictEqual(quote.total_premium, quote.net_premium + quote.gst_amount);
});

test('Standard Contract 4.7: Unified calculateBenefitsQuote evaluates all lines end-to-end and validates schema', () => {
  const census = [
    { employee_id: 'EMP001', name: 'Aarav Sharma', age: 32, gender: 'M' as const, relationship: 'self' as const, monthly_salary: 45000 },
    { employee_id: 'EMP001-DEP1', name: 'Neha Sharma', age: 30, gender: 'F' as const, relationship: 'spouse' as const },
    { employee_id: 'EMP001-DEP2', name: 'Kabir Sharma', age: 4, gender: 'M' as const, relationship: 'child' as const },
    { employee_id: 'EMP002', name: 'Rohan Gupta', age: 54, gender: 'M' as const, relationship: 'self' as const, monthly_salary: 80000 },
    { employee_id: 'EMP003', name: 'Pooja Iyer', age: 26, gender: 'F' as const, relationship: 'self' as const, monthly_salary: 35000 },
  ];

  const unifiedQuote = calculateBenefitsQuote({
    corporate_name: 'Acme Enterprise Solutions',
    census,
    ghi: {
      base_sum_insured: 500000,
      room_rent: 'single_private_room',
      maternity_opted: true,
      maternity_day_1_waiver: true,
      ped_waiver_day_1: true,
      corporate_buffer_amount: 0,
    },
    gtli: {
      sum_insured_per_life: 2000000,
      hazard_class: 1,
      free_cover_limit: 5000000,
    },
    gpa: {
      sum_insured_per_life: 1000000,
      hazard_class: 1,
      ttd_opted: true,
      medical_extension_opted: true,
    },
    wc: {
      trade_hazard_rate_percent: 0.45,
      medical_extension_opted: true,
    },
  });

  const quoteRecord = {
    id: 'test-unified-quote-1',
    ...unifiedQuote,
  };
  const validation = validateQuoteSchema(quoteRecord);
  assert.strictEqual(validation.valid, true, `Quote schema failed: ${validation.errors.join(', ')}`);
  assert.strictEqual(unifiedQuote.gst_amount, Math.round(unifiedQuote.net_premium * 0.18));
  assert.strictEqual(unifiedQuote.total_premium, unifiedQuote.net_premium + unifiedQuote.gst_amount);

  const breakdown = unifiedQuote.line_specific_breakdown as any;
  assert.strictEqual(breakdown.total_lives, 5);
  assert.strictEqual(breakdown.employee_count, 3);
  assert.strictEqual(breakdown.dependent_count, 2);
  assert.strictEqual(breakdown.total_monthly_wage_roll, 45000 + 80000 + 35000); // 160,000
  assert.ok(breakdown.cost_per_employee > 0);
  assert.ok(breakdown.cost_per_life > 0);
});

console.log('\n======================================================================');
console.log(`  ALL ${passedTests} OF ${totalTests} ADVERSARIAL TESTS PASSED CLEANLY!`);
console.log('======================================================================\n');
