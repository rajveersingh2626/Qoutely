/**
 * Comprehensive Unit Test Suite for Employee Benefits & Group Underwriting Engine
 *
 * Verifies:
 * Suite 1: GHI Actuarial Demographic Age-Band Matrix (Feature 13)
 * Suite 2: GHI Benefit Loadings & Corporate Buffer (Feature 14)
 * Suite 3: Group Term Life (GTLI) Mortality Engine (Feature 15)
 * Suite 4: Group Personal Accident (GPA) Engine (Feature 16)
 * Suite 5: Statutory Workmen's Compensation (WC) Engine (Feature 17)
 * Suite 6: Bulk Employee Census Roster Ingestion (Feature 18)
 * Suite 7: Studio Ledger & Package Reconciler (Feature 19)
 * Suite 8: High-Level Standard Contract Quotes & Algorithmic Explainability
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
  GHI_AGE_BAND_BASE_RATES,
  GTLI_MORTALITY_RATES_PER_MILLE,
  GTLI_HAZARD_MULTIPLIERS,
  GPA_HAZARD_RATES_PER_MILLE,
  WC_STATUTORY_WAGE_CAP,
  WC_STATUTORY_MIN_DEATH,
  WC_STATUTORY_MIN_PTD,
  CensusRow,
} from '../benefits-engine';

let totalTests = 0;
let passedTests = 0;

function runTest(name: string, fn: () => void) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ PASS: ${name}`);
  } catch (err: any) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(err);
    throw err;
  }
}

console.log('\n============================================================');
console.log('  STARTING EMPLOYEE BENEFITS ACTUARIAL ENGINE TEST SUITE');
console.log('============================================================\n');

// ============================================================================
// SUITE 1: GHI ACTUARIAL DEMOGRAPHIC AGE-BAND MATRIX (FEATURE 13)
// ============================================================================
console.log('--- Suite 1: GHI Demographic Age-Band Matrix ---');

runTest('GHI: Age band 0-25 assigns base rate ₹2,800 per head', () => {
  const res = calculateGhiDemographicPremium(
    { age_0_25: 10, age_26_35: 0, age_36_45: 0, age_46_55: 0, age_56_65: 0, age_66_75: 0, age_76_plus: 0 },
    300000
  );
  assert.strictEqual(res.pure_risk_premium, 28000);
  assert.strictEqual(res.total_lives, 10);
  assert.strictEqual(res.per_life_average, 2800);
});

runTest('GHI: Age band 26-35 assigns base rate ₹4,200 per head', () => {
  const res = calculateGhiDemographicPremium(
    { age_0_25: 0, age_26_35: 10, age_36_45: 0, age_46_55: 0, age_56_65: 0, age_66_75: 0, age_76_plus: 0 },
    300000
  );
  assert.strictEqual(res.pure_risk_premium, 42000);
});

runTest('GHI: Age band 36-45 assigns base rate ₹6,500 per head', () => {
  const res = calculateGhiDemographicPremium(
    { age_0_25: 0, age_26_35: 0, age_36_45: 10, age_46_55: 0, age_56_65: 0, age_66_75: 0, age_76_plus: 0 },
    300000
  );
  assert.strictEqual(res.pure_risk_premium, 65000);
});

runTest('GHI: Age band 46-55 assigns base rate ₹11,200 per head', () => {
  const res = calculateGhiDemographicPremium(
    { age_0_25: 0, age_26_35: 0, age_36_45: 0, age_46_55: 10, age_56_65: 0, age_66_75: 0, age_76_plus: 0 },
    300000
  );
  assert.strictEqual(res.pure_risk_premium, 112000);
});

runTest('GHI: Age band 56-65, 66-75, and 76+ rates match gazetted benchmarks', () => {
  const res56 = calculateGhiDemographicPremium(
    { age_0_25: 0, age_26_35: 0, age_36_45: 0, age_46_55: 0, age_56_65: 1, age_66_75: 0, age_76_plus: 0 },
    300000
  );
  assert.strictEqual(res56.pure_risk_premium, 18500);

  const res66 = calculateGhiDemographicPremium(
    { age_0_25: 0, age_26_35: 0, age_36_45: 0, age_46_55: 0, age_56_65: 0, age_66_75: 1, age_76_plus: 0 },
    300000
  );
  assert.strictEqual(res66.pure_risk_premium, 26000);

  const res76 = calculateGhiDemographicPremium(
    { age_0_25: 0, age_26_35: 0, age_36_45: 0, age_46_55: 0, age_56_65: 0, age_66_75: 0, age_76_plus: 1 },
    300000
  );
  assert.strictEqual(res76.pure_risk_premium, 32000);
});

runTest('GHI: Applies non-linear sum insured scaling `(SI / 3,00,000)^0.65`', () => {
  const res3L = calculateGhiDemographicPremium(
    { age_0_25: 10, age_26_35: 0, age_36_45: 0, age_46_55: 0, age_56_65: 0, age_66_75: 0, age_76_plus: 0 },
    300000
  );
  const res5L = calculateGhiDemographicPremium(
    { age_0_25: 10, age_26_35: 0, age_36_45: 0, age_46_55: 0, age_56_65: 0, age_66_75: 0, age_76_plus: 0 },
    500000
  );
  assert.ok(res5L.pure_risk_premium > res3L.pure_risk_premium);
  const ratio = res5L.pure_risk_premium / res3L.pure_risk_premium;
  assert.ok(Math.abs(ratio - 1.393) < 0.02);
});

runTest('GHI: Zero lives census throws Error', () => {
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

// ============================================================================
// SUITE 2: GHI BENEFIT LOADINGS & CORPORATE BUFFER (FEATURE 14)
// ============================================================================
console.log('\n--- Suite 2: GHI Benefit Loadings & Corporate Buffer ---');

runTest('GHI Loadings: Standard 1% normal / 2% ICU applies 0% loading', () => {
  const res = calculateGhiBenefitLoadings(100000, {
    room_rent: 'standard_1_percent',
    maternity_opted: false,
    maternity_day_1_waiver: false,
    ped_waiver_day_1: false,
    corporate_buffer_amount: 0,
    group_size: 100,
  });
  assert.strictEqual(res.loading_percent, 0);
  assert.strictEqual(res.loaded_premium, 100000);
});

runTest('GHI Loadings: Single Private Room applies +8% loading', () => {
  const res = calculateGhiBenefitLoadings(100000, {
    room_rent: 'single_private_room',
    maternity_opted: false,
    maternity_day_1_waiver: false,
    ped_waiver_day_1: false,
    corporate_buffer_amount: 0,
    group_size: 100,
  });
  assert.strictEqual(res.loading_percent, 8);
  assert.strictEqual(res.loaded_premium, 108000);
});

runTest('GHI Loadings: No Capping room rent applies +15% loading', () => {
  const res = calculateGhiBenefitLoadings(100000, {
    room_rent: 'no_capping',
    maternity_opted: false,
    maternity_day_1_waiver: false,
    ped_waiver_day_1: false,
    corporate_buffer_amount: 0,
    group_size: 100,
  });
  assert.strictEqual(res.loading_percent, 15);
  assert.strictEqual(res.loaded_premium, 115000);
});

runTest('GHI Loadings: Maternity cover with Day 1 waiver applies 15% combined loading', () => {
  const res = calculateGhiBenefitLoadings(100000, {
    room_rent: 'standard_1_percent',
    maternity_opted: true,
    maternity_day_1_waiver: true,
    ped_waiver_day_1: false,
    corporate_buffer_amount: 0,
    group_size: 100,
  });
  assert.strictEqual(res.loading_percent, 15);
  assert.strictEqual(res.loaded_premium, 115000);
});

runTest('GHI Loadings: PED Day 1 waiver adds +12%', () => {
  const res = calculateGhiBenefitLoadings(100000, {
    room_rent: 'standard_1_percent',
    maternity_opted: false,
    maternity_day_1_waiver: false,
    ped_waiver_day_1: true,
    corporate_buffer_amount: 0,
    group_size: 100,
  });
  assert.strictEqual(res.loading_percent, 12);
  assert.strictEqual(res.loaded_premium, 112000);
});

runTest('GHI Loadings: Corporate buffer rates at 3.5% for group >= 50', () => {
  const res = calculateGhiBenefitLoadings(100000, {
    room_rent: 'standard_1_percent',
    maternity_opted: false,
    maternity_day_1_waiver: false,
    ped_waiver_day_1: false,
    corporate_buffer_amount: 1000000,
    group_size: 100,
  });
  assert.strictEqual(res.corporate_buffer_premium, 35000);
  assert.strictEqual(res.total_ghi_premium, 135000);
});

runTest('GHI Loadings: Corporate buffer throws for group size < 50', () => {
  assert.throws(
    () => {
      calculateGhiBenefitLoadings(100000, {
        room_rent: 'standard_1_percent',
        maternity_opted: false,
        maternity_day_1_waiver: false,
        ped_waiver_day_1: false,
        corporate_buffer_amount: 500000,
        group_size: 49,
      });
    },
    /Corporate buffer requires minimum group size of 50 lives/
  );
});

// ============================================================================
// SUITE 3: GROUP TERM LIFE (GTLI) MORTALITY ENGINE (FEATURE 15)
// ============================================================================
console.log('\n--- Suite 3: GTLI Mortality Engine ---');

runTest('GTLI: Empty members array throws Error', () => {
  assert.throws(() => calculateGtliPremium([]), /No members provided for GTLI/);
});

runTest('GTLI: Benchmark IALM rates calculated accurately for ages 25, 35, 45, 55, 60', () => {
  const res25 = calculateGtliPremium([{ age: 25, sum_insured: 1000000 }]);
  assert.strictEqual(res25.total_gtli_premium, 880);

  const res35 = calculateGtliPremium([{ age: 35, sum_insured: 1000000 }]);
  assert.strictEqual(res35.total_gtli_premium, 1050);

  const res45 = calculateGtliPremium([{ age: 45, sum_insured: 1000000 }]);
  assert.strictEqual(res45.total_gtli_premium, 1800);

  const res55 = calculateGtliPremium([{ age: 55, sum_insured: 1000000 }]);
  assert.strictEqual(res55.total_gtli_premium, 4950);

  const res62 = calculateGtliPremium([{ age: 62, sum_insured: 1000000 }]);
  assert.strictEqual(res62.total_gtli_premium, 11500);
});

runTest('GTLI: Hazard multipliers apply (Class 1 = 1.0x, Class 2 = 1.2x, Class 3 = 1.5x)', () => {
  const resC1 = calculateGtliPremium([{ age: 35, sum_insured: 1000000, hazard_class: 1 }]);
  assert.strictEqual(resC1.total_gtli_premium, 1050);

  const resC2 = calculateGtliPremium([{ age: 35, sum_insured: 1000000, hazard_class: 2 }]);
  assert.strictEqual(resC2.total_gtli_premium, 1260);

  const resC3 = calculateGtliPremium([{ age: 35, sum_insured: 1000000, hazard_class: 3 }]);
  assert.strictEqual(resC3.total_gtli_premium, 1575);
});

runTest('GTLI: FCL threshold detection flags members requiring medical review', () => {
  const members = [
    { age: 30, sum_insured: 2000000 },
    { age: 40, sum_insured: 8000000 }, // > 50L
    { age: 50, sum_insured: 5000000 }, // == 50L (not flagged)
  ];
  const res = calculateGtliPremium(members, 5000000);
  assert.strictEqual(res.members_requiring_medical, 1);
  assert.strictEqual(res.total_members, 3);
  assert.strictEqual(res.total_sum_insured, 15000000);
});

// ============================================================================
// SUITE 4: GROUP PERSONAL ACCIDENT (GPA) ENGINE (FEATURE 16)
// ============================================================================
console.log('\n--- Suite 4: GPA Engine ---');

runTest('GPA: Hazard Classes rate at 0.35‰, 0.65‰, 1.50‰', () => {
  const res1 = calculateGpaPremium({ sum_insured_per_life: 1000000, headcount: 10, hazard_class: 1, ttd_opted: false, medical_extension_opted: false });
  assert.strictEqual(res1.rate_per_mille, 0.35);
  assert.strictEqual(res1.total_gpa_premium, 3500);

  const res2 = calculateGpaPremium({ sum_insured_per_life: 1000000, headcount: 10, hazard_class: 2, ttd_opted: false, medical_extension_opted: false });
  assert.strictEqual(res2.rate_per_mille, 0.65);
  assert.strictEqual(res2.total_gpa_premium, 6500);

  const res3 = calculateGpaPremium({ sum_insured_per_life: 1000000, headcount: 10, hazard_class: 3, ttd_opted: false, medical_extension_opted: false });
  assert.strictEqual(res3.rate_per_mille, 1.50);
  assert.strictEqual(res3.total_gpa_premium, 15000);
});

runTest('GPA: TTD rider adds 0.15‰ and medical extension adds 10% on base', () => {
  const res = calculateGpaPremium({
    sum_insured_per_life: 1000000,
    headcount: 10,
    hazard_class: 1,
    ttd_opted: true,
    medical_extension_opted: true,
  });
  // Base = 3500; TTD = 10M * 0.15 / 1000 = 1500; Med = 350; Total = 5350
  assert.strictEqual(res.base_gpa_premium, 3500);
  assert.strictEqual(res.ttd_premium, 1500);
  assert.strictEqual(res.medical_premium, 350);
  assert.strictEqual(res.total_gpa_premium, 5350);
});

// ============================================================================
// SUITE 5: STATUTORY WORKMEN'S COMPENSATION (WC) (FEATURE 17)
// ============================================================================
console.log('\n--- Suite 5: Statutory Workmen\'s Compensation (WC) Engine ---');

runTest('WC: Empty worker list throws Error', () => {
  assert.throws(
    () => calculateWorkmensCompensation({ workers: [], trade_hazard_rate_percent: 0.5, medical_extension_opted: false }),
    /Worker list cannot be empty/
  );
});

runTest('WC: Wage cap of ₹15,000 applies to statutory Death & PTD liabilities', () => {
  const res = calculateWorkmensCompensation({
    workers: [{ age: 25, monthly_wage: 35000 }], // wage > 15k
    trade_hazard_rate_percent: 0.45,
    medical_extension_opted: false,
  });
  // 50% * 15000 * 216.91 = 1626825
  assert.strictEqual(res.statutory_death_liability, 1626825);
  // 60% * 15000 * 216.91 = 1952190
  assert.strictEqual(res.statutory_ptd_liability, 1952190);
});

runTest('WC: Enforces statutory minimum floors (Death ₹1,20,000 and PTD ₹1,40,000)', () => {
  const res = calculateWorkmensCompensation({
    workers: [{ age: 55, monthly_wage: 500 }],
    trade_hazard_rate_percent: 0.45,
    medical_extension_opted: false,
  });
  assert.strictEqual(res.statutory_death_liability, 120000);
  assert.strictEqual(res.statutory_ptd_liability, 140000);
});

runTest('WC: Tariff rated on annual wage roll with 25% medical extension', () => {
  const res = calculateWorkmensCompensation({
    workers: [{ age: 30, monthly_wage: 20000 }],
    trade_hazard_rate_percent: 1.0,
    medical_extension_opted: true,
  });
  // Annual wage roll = 20000 * 12 = 240,000
  // Base WC prem = 240,000 * 1.0% = 2,400; with 25% loading = 3,000
  assert.strictEqual(res.total_annual_wageroll, 240000);
  assert.strictEqual(res.net_wc_premium, 3000);
});

// ============================================================================
// SUITE 6: BULK EMPLOYEE CENSUS ROSTER INGESTION (FEATURE 18)
// ============================================================================
console.log('\n--- Suite 6: Bulk Employee Census Roster Ingestion ---');

runTest('Census: Segregates employees from dependents and aggregates wage roll', () => {
  const rows: CensusRow[] = [
    { employee_id: 'E1', name: 'Aarav Sharma', age: 24, gender: 'M', relationship: 'self', monthly_salary: 50000 },
    { employee_id: 'E1', name: 'Priya Sharma', age: 24, gender: 'F', relationship: 'spouse' },
    { employee_id: 'E2', name: 'Sunil Kumar', age: 38, gender: 'M', relationship: 'self', monthly_salary: 75000 },
    { employee_id: 'E2', name: 'Kid Kumar', age: 5, gender: 'M', relationship: 'child' },
    { employee_id: 'E2', name: 'Senior Kumar', age: 68, gender: 'M', relationship: 'parent' },
  ];
  const parsed = parseEmployeeCensusRoster(rows);
  assert.strictEqual(parsed.employee_count, 2);
  assert.strictEqual(parsed.dependent_count, 3);
  assert.strictEqual(parsed.total_lives, 5);
  assert.strictEqual(parsed.total_monthly_wage_roll, 125000);
  assert.strictEqual(parsed.age_bands.age_0_25, 3); // 24, 24, 5
  assert.strictEqual(parsed.age_bands.age_36_45, 1); // 38
  assert.strictEqual(parsed.age_bands.age_66_75, 1); // 68
  assert.strictEqual(parsed.invalid_rows.length, 0);
});

runTest('Census: Flags invalid ages (<0 or >100)', () => {
  const rows: CensusRow[] = [
    { employee_id: 'INV1', name: 'Negative', age: -2, gender: 'M', relationship: 'child' },
    { employee_id: 'INV2', name: 'Too Old', age: 102, gender: 'F', relationship: 'parent' },
    { employee_id: 'VAL1', name: 'Valid', age: 30, gender: 'M', relationship: 'self', monthly_salary: 40000 },
  ];
  const parsed = parseEmployeeCensusRoster(rows);
  assert.strictEqual(parsed.invalid_rows.length, 2);
  assert.strictEqual(parsed.total_lives, 1);
});

// ============================================================================
// SUITE 7: STUDIO LEDGER & PACKAGE RECONCILER (FEATURE 19)
// ============================================================================
console.log('\n--- Suite 7: Studio Ledger & Multi-Coverage Model ---');

runTest('Studio Ledger: Synchronizes GHI, GTLI, GPA, and WC with 18% GST', () => {
  const ledger = computeBenefitsStudioLedger({
    corporate_name: 'Acme Enterprise Solutions',
    census: [
      { employee_id: 'E1', name: 'John Doe', age: 28, gender: 'M', relationship: 'self', monthly_salary: 40000 },
      { employee_id: 'E2', name: 'Jane Smith', age: 34, gender: 'F', relationship: 'self', monthly_salary: 60000 },
    ],
    ghi_base_si: 500000,
    room_rent: 'single_private_room',
    maternity_opted: true,
    gtli_sum_insured: 2000000,
    gpa_hazard_class: 1,
  });

  assert.ok(ledger.ghi_premium > 0);
  assert.ok(ledger.gtli_premium > 0);
  assert.ok(ledger.gpa_premium > 0);
  assert.ok(ledger.wc_premium > 0);
  assert.strictEqual(
    ledger.package_net_premium,
    ledger.ghi_premium + ledger.gtli_premium + ledger.gpa_premium + ledger.wc_premium
  );
  assert.strictEqual(ledger.package_gst, Math.round(ledger.package_net_premium * 0.18));
  assert.strictEqual(ledger.total_payable, ledger.package_net_premium + ledger.package_gst);
});

// ============================================================================
// SUITE 8: HIGH-LEVEL STANDARD QUOTES & ALGORITHMIC EXPLAINABILITY
// ============================================================================
console.log('\n--- Suite 8: High-Level Standard Contract Quotes & Explainability ---');

runTest('calculateGhiQuote: Returns compliant StandardQuoteBreakdown with explainability', () => {
  const quote = calculateGhiQuote({
    corporate_name: 'Infosys BPM',
    age_bands: { age_0_25: 50, age_26_35: 100, age_36_45: 50, age_46_55: 20, age_56_65: 5, age_66_75: 0, age_76_plus: 0 },
    base_sum_insured: 500000,
    benefit_options: {
      room_rent: 'single_private_room',
      maternity_opted: true,
      maternity_day_1_waiver: true,
      ped_waiver_day_1: true,
      corporate_buffer_amount: 1000000,
      group_size: 225,
    },
  });

  assert.strictEqual(quote.lob_category, 'benefits');
  assert.strictEqual(quote.insurance_line, 'ghi');
  assert.strictEqual(quote.gst_rate_percent, 18);
  assert.strictEqual(quote.gst_amount, Math.round(quote.net_premium * 0.18));
  assert.strictEqual(quote.total_premium, quote.net_premium + quote.gst_amount);
  assert.ok(quote.statutory_clauses.length >= 3);
  assert.strictEqual(quote.algorithmic_explainability.length, 4);
});

runTest('calculateGtliQuote: Returns compliant StandardQuoteBreakdown', () => {
  const quote = calculateGtliQuote({
    corporate_name: 'Tech Mahindra',
    members: [
      { age: 28, sum_insured: 3000000, hazard_class: 1 },
      { age: 48, sum_insured: 6000000, hazard_class: 1 },
    ],
    free_cover_limit: 5000000,
  });

  assert.strictEqual(quote.insurance_line, 'gtli');
  assert.strictEqual(quote.line_specific_breakdown.members_requiring_medical, 1);
  assert.strictEqual(quote.total_premium, quote.net_premium + quote.gst_amount);
});

runTest('calculateGpaQuote: Returns compliant StandardQuoteBreakdown', () => {
  const quote = calculateGpaQuote({
    corporate_name: 'Tata Consultancy Services',
    sum_insured_per_life: 1000000,
    headcount: 50,
    hazard_class: 1,
    ttd_opted: true,
    medical_extension_opted: true,
  });

  assert.strictEqual(quote.insurance_line, 'gpa');
  assert.strictEqual(quote.sum_insured, 50000000);
  assert.strictEqual(quote.total_premium, quote.net_premium + quote.gst_amount);
});

runTest('calculateWcQuote: Returns compliant StandardQuoteBreakdown', () => {
  const quote = calculateWcQuote({
    corporate_name: 'Bharat Forge Ltd',
    workers: [
      { age: 26, monthly_wage: 18000 },
      { age: 42, monthly_wage: 22000 },
    ],
    trade_hazard_rate_percent: 0.85,
    medical_extension_opted: true,
  });

  assert.strictEqual(quote.insurance_line, 'wc');
  assert.strictEqual(quote.line_specific_breakdown.total_workers, 2);
  assert.strictEqual(quote.total_premium, quote.net_premium + quote.gst_amount);
});

runTest('calculateBenefitsQuote: Unified package quote evaluates all lines end-to-end', () => {
  const quote = calculateBenefitsQuote({
    corporate_name: 'HCL Technologies',
    census: [
      { employee_id: 'E1', name: 'Emp 1', age: 29, gender: 'M', relationship: 'self', monthly_salary: 45000 },
      { employee_id: 'E1', name: 'Spouse 1', age: 28, gender: 'F', relationship: 'spouse' },
      { employee_id: 'E2', name: 'Emp 2', age: 36, gender: 'F', relationship: 'self', monthly_salary: 55000 },
    ],
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
    },
    gpa: {
      sum_insured_per_life: 1000000,
      hazard_class: 1,
      ttd_opted: true,
      medical_extension_opted: true,
    },
    wc: {
      trade_hazard_rate_percent: 0.35,
      medical_extension_opted: true,
    },
  });

  assert.strictEqual(quote.lob_category, 'benefits');
  assert.strictEqual(quote.line_specific_breakdown.total_lives, 3);
  assert.strictEqual(quote.line_specific_breakdown.employee_count, 2);
  assert.strictEqual(quote.algorithmic_explainability.length, 6);
  assert.strictEqual(quote.total_premium, quote.net_premium + quote.gst_amount);
});

console.log(`\n============================================================`);
console.log(`  ALL ${passedTests} OF ${totalTests} TESTS PASSED SUCCESSFULLY!`);
console.log(`============================================================\n`);
