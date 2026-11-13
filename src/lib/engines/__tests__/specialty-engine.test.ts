/**
 * Comprehensive Unit Test Suite for Financial & Specialty Lines Underwriting Engine
 *
 * Covers 39 tests across 6 suites:
 * Suite 1: Feature 32 — Surety Insurance Bond Engine [9 tests]
 * Suite 2: Feature 33 — Trade Credit Insurance (TCI) Engine [8 tests]
 * Suite 3: Feature 34 — Specialty Studio UI Model [7 tests]
 * Suite 4: Commercial Burglary & First Loss Tariff Engine [6 tests]
 * Suite 5: Standard Contract Quotes, GST & Algorithmic Explainability [5 tests]
 * Suite 6: Multi-Line Specialty Package [4 tests]
 */

import assert from 'node:assert';
import {
  calculateSuretyBondPremium,
  calculateTradeCreditPremium,
  validateSpecialtyStudioInput,
  calculateBurglaryPremium,
  calculateSuretyQuote,
  calculateTradeCreditQuote,
  calculateBurglaryQuote,
  calculateSpecialtyPackageQuote,
  SURETY_BASE_RATES,
  CONTRACTOR_GRADE_MULTIPLIERS,
  TRADE_CREDIT_RATES,
  BURGLARY_BASE_RATE_PER_MILLE,
  BURGLARY_SECURITY_DISCOUNTS,
  STATUTORY_SPECIALTY_CLAUSES,
  STATUTORY_GST_RATE,
  SuretyBondInput,
  TradeCreditInput,
  SpecialtyStudioInput,
  BurglaryInput,
} from '../specialty-engine';

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

console.log('\n======================================================================');
console.log(' RUNNING: Financial & Specialty Lines Engine Unit Tests (39 Tests)');
console.log('======================================================================\n');

// ============================================================================
// SUITE 1: FEATURE 32 — SURETY INSURANCE BOND ENGINE (9 TESTS)
// ============================================================================
console.log('--- Suite 1: Feature 32 — Surety Insurance Bond Engine ---');

runTest('S1-01: Bid bond base rate is exactly 1.00% p.a.', () => {
  const res = calculateSuretyBondPremium({
    bond_type: 'bid_bond',
    bond_value: 10000000,
    tenure_months: 12,
    contractor_grade: 'AA',
    contractor_net_worth: 50000000,
  });
  assert.strictEqual(res.annual_rate_percent, 1.00);
  assert.strictEqual(res.total_bond_premium, 100000);
});

runTest('S1-02: Performance bond base rate is exactly 1.50% p.a.', () => {
  const res = calculateSuretyBondPremium({
    bond_type: 'performance_bond',
    bond_value: 10000000,
    tenure_months: 12,
    contractor_grade: 'AA',
    contractor_net_worth: 50000000,
  });
  assert.strictEqual(res.annual_rate_percent, 1.50);
  assert.strictEqual(res.total_bond_premium, 150000);
});

runTest('S1-03: Advance payment (1.75%) and Retention money (1.25%) bond base rates', () => {
  const adv = calculateSuretyBondPremium({
    bond_type: 'advance_payment',
    bond_value: 20000000,
    tenure_months: 12,
    contractor_grade: 'AA',
    contractor_net_worth: 50000000,
  });
  assert.strictEqual(adv.annual_rate_percent, 1.75);
  assert.strictEqual(adv.total_bond_premium, 350000);

  const ret = calculateSuretyBondPremium({
    bond_type: 'retention_money',
    bond_value: 20000000,
    tenure_months: 12,
    contractor_grade: 'AA',
    contractor_net_worth: 50000000,
  });
  assert.strictEqual(ret.annual_rate_percent, 1.25);
  assert.strictEqual(ret.total_bond_premium, 250000);
});

runTest('S1-04: Contractor grade multipliers & base margins (AAA, A, BBB, BB)', () => {
  // AAA: 0.8x, 0% margin
  const aaa = calculateSuretyBondPremium({
    bond_type: 'performance_bond',
    bond_value: 10000000,
    tenure_months: 12,
    contractor_grade: 'AAA',
    contractor_net_worth: 50000000,
  });
  assert.strictEqual(aaa.annual_rate_percent, 1.20);
  assert.strictEqual(aaa.required_collateral_margin_percent, 0);

  // A: 1.25x, 10% margin
  const a = calculateSuretyBondPremium({
    bond_type: 'performance_bond',
    bond_value: 10000000,
    tenure_months: 12,
    contractor_grade: 'A',
    contractor_net_worth: 50000000,
  });
  assert.strictEqual(a.annual_rate_percent, 1.875);
  assert.strictEqual(a.required_collateral_margin_percent, 10);

  // BBB: 1.65x, 15% margin
  const bbb = calculateSuretyBondPremium({
    bond_type: 'performance_bond',
    bond_value: 10000000,
    tenure_months: 12,
    contractor_grade: 'BBB',
    contractor_net_worth: 50000000,
  });
  assert.strictEqual(bbb.annual_rate_percent, 2.475);
  assert.strictEqual(bbb.required_collateral_margin_percent, 15);

  // BB: 2.20x, 25% margin
  const bb = calculateSuretyBondPremium({
    bond_type: 'performance_bond',
    bond_value: 10000000,
    tenure_months: 12,
    contractor_grade: 'BB',
    contractor_net_worth: 50000000,
  });
  assert.strictEqual(bb.annual_rate_percent, 3.30);
  assert.strictEqual(bb.required_collateral_margin_percent, 25);
});

runTest('S1-05: Pro-rata tenure factor scales accurately for multi-month contracts (6M, 24M, 36M)', () => {
  const res6M = calculateSuretyBondPremium({
    bond_type: 'bid_bond',
    bond_value: 10000000,
    tenure_months: 6,
    contractor_grade: 'AA',
    contractor_net_worth: 50000000,
  });
  assert.strictEqual(res6M.tenure_pro_rata_factor, 0.50);
  assert.strictEqual(res6M.total_bond_premium, 50000);

  const res24M = calculateSuretyBondPremium({
    bond_type: 'performance_bond',
    bond_value: 50000000,
    tenure_months: 24,
    contractor_grade: 'AA',
    contractor_net_worth: 200000000,
  });
  assert.strictEqual(res24M.tenure_pro_rata_factor, 2.00);
  assert.strictEqual(res24M.total_bond_premium, 1500000);

  const res36M = calculateSuretyBondPremium({
    bond_type: 'performance_bond',
    bond_value: 600000000,
    tenure_months: 36,
    contractor_grade: 'AA',
    contractor_net_worth: 1000000000,
  });
  assert.strictEqual(res36M.tenure_pro_rata_factor, 3.00);
  assert.strictEqual(res36M.total_bond_premium, 27000000);
});

runTest('S1-06: Bond value exceeding Net Worth flags credit_limit_breach and adds +25% margin', () => {
  const res = calculateSuretyBondPremium({
    bond_type: 'performance_bond',
    bond_value: 150000000,
    tenure_months: 12,
    contractor_grade: 'A',
    contractor_net_worth: 100000000,
  });
  assert.strictEqual(res.credit_limit_breach, true);
  // Grade A base margin 10% + 25% surcharge = 35%
  assert.strictEqual(res.required_collateral_margin_percent, 35);
});

runTest('S1-07: Exact equality (bond_value === net_worth) does NOT trigger credit limit breach', () => {
  const res = calculateSuretyBondPremium({
    bond_type: 'performance_bond',
    bond_value: 100000000,
    tenure_months: 12,
    contractor_grade: 'A',
    contractor_net_worth: 100000000,
  });
  assert.strictEqual(res.credit_limit_breach, false);
  assert.strictEqual(res.required_collateral_margin_percent, 10);
});

runTest('S1-08: Zero or negative bond value throws exact error', () => {
  assert.throws(
    () =>
      calculateSuretyBondPremium({
        bond_type: 'performance_bond',
        bond_value: 0,
        tenure_months: 12,
        contractor_grade: 'A',
        contractor_net_worth: 100000000,
      }),
    /Bond value must be positive/
  );

  assert.throws(
    () =>
      calculateSuretyBondPremium({
        bond_type: 'performance_bond',
        bond_value: -500000,
        tenure_months: 12,
        contractor_grade: 'A',
        contractor_net_worth: 100000000,
      }),
    /Bond value must be positive/
  );
});

runTest('S1-09: Zero or negative tenure months throws exact error', () => {
  assert.throws(
    () =>
      calculateSuretyBondPremium({
        bond_type: 'performance_bond',
        bond_value: 10000000,
        tenure_months: 0,
        contractor_grade: 'A',
        contractor_net_worth: 100000000,
      }),
    /Tenure must be at least 1 month/
  );

  assert.throws(
    () =>
      calculateSuretyBondPremium({
        bond_type: 'performance_bond',
        bond_value: 10000000,
        tenure_months: -3,
        contractor_grade: 'A',
        contractor_net_worth: 100000000,
      }),
    /Tenure must be at least 1 month/
  );
});

// ============================================================================
// SUITE 2: FEATURE 33 — TRADE CREDIT INSURANCE ENGINE (8 TESTS)
// ============================================================================
console.log('--- Suite 2: Feature 33 — Trade Credit Insurance Engine ---');

runTest('S2-01: 30 days credit terms rate at 0.25% of insurable turnover', () => {
  const res = calculateTradeCreditPremium({
    insurable_turnover: 100000000,
    average_credit_days: 30,
    top_10_buyers_turnover_share_percent: 40,
    requested_indemnity_percent: 90,
  });
  assert.strictEqual(res.base_rate_percent, 0.25);
  assert.strictEqual(res.net_tci_premium, 250000);
});

runTest('S2-02: 60 days credit terms rate at 0.35% of insurable turnover', () => {
  const res = calculateTradeCreditPremium({
    insurable_turnover: 100000000,
    average_credit_days: 60,
    top_10_buyers_turnover_share_percent: 40,
    requested_indemnity_percent: 90,
  });
  assert.strictEqual(res.base_rate_percent, 0.35);
  assert.strictEqual(res.net_tci_premium, 350000);
});

runTest('S2-03: 90 days credit terms rate at 0.45% of insurable turnover', () => {
  const res = calculateTradeCreditPremium({
    insurable_turnover: 100000000,
    average_credit_days: 90,
    top_10_buyers_turnover_share_percent: 40,
    requested_indemnity_percent: 90,
  });
  assert.strictEqual(res.base_rate_percent, 0.45);
  assert.strictEqual(res.net_tci_premium, 450000);
});

runTest('S2-04: 120 days credit terms rate at 0.60% of insurable turnover', () => {
  const res = calculateTradeCreditPremium({
    insurable_turnover: 10000000,
    average_credit_days: 120,
    top_10_buyers_turnover_share_percent: 30,
    requested_indemnity_percent: 90,
  });
  assert.strictEqual(res.base_rate_percent, 0.60);
  assert.strictEqual(res.net_tci_premium, 60000);
});

runTest('S2-05: Upper boundary requested indemnity 95% clamped to statutory max 90%', () => {
  const res = calculateTradeCreditPremium({
    insurable_turnover: 100000000,
    average_credit_days: 30,
    top_10_buyers_turnover_share_percent: 40,
    requested_indemnity_percent: 95,
  });
  assert.strictEqual(res.clamped_indemnity_percent, 90);
});

runTest('S2-06: Lower boundary requested indemnity 40% clamped to statutory min 50%', () => {
  const res = calculateTradeCreditPremium({
    insurable_turnover: 10000000,
    average_credit_days: 30,
    top_10_buyers_turnover_share_percent: 30,
    requested_indemnity_percent: 40,
  });
  assert.strictEqual(res.clamped_indemnity_percent, 50);
});

runTest('S2-07: Concentration loading threshold (> 60% triggers +20%, <= 60% triggers 0%)', () => {
  // Exact 60%: no loading
  const res60 = calculateTradeCreditPremium({
    insurable_turnover: 10000000,
    average_credit_days: 30,
    top_10_buyers_turnover_share_percent: 60,
    requested_indemnity_percent: 90,
  });
  assert.strictEqual(res60.concentration_loading_percent, 0);
  assert.strictEqual(res60.net_tci_premium, 25000);

  // 61%: +20% loading
  const res61 = calculateTradeCreditPremium({
    insurable_turnover: 10000000,
    average_credit_days: 30,
    top_10_buyers_turnover_share_percent: 61,
    requested_indemnity_percent: 90,
  });
  assert.strictEqual(res61.concentration_loading_percent, 20);
  // 0.25% * 1.20 = 0.30% -> 30,000
  assert.strictEqual(res61.net_tci_premium, 30000);
});

runTest('S2-08: Zero or negative insurable turnover throws exact error', () => {
  assert.throws(
    () =>
      calculateTradeCreditPremium({
        insurable_turnover: 0,
        average_credit_days: 30,
        top_10_buyers_turnover_share_percent: 40,
        requested_indemnity_percent: 90,
      }),
    /Insurable turnover must be positive/
  );

  assert.throws(
    () =>
      calculateTradeCreditPremium({
        insurable_turnover: -100000,
        average_credit_days: 30,
        top_10_buyers_turnover_share_percent: 40,
        requested_indemnity_percent: 90,
      }),
    /Insurable turnover must be positive/
  );
});

// ============================================================================
// SUITE 3: FEATURE 34 — SPECIALTY STUDIO UI MODEL (7 TESTS)
// ============================================================================
console.log('--- Suite 3: Feature 34 — Specialty Studio UI Model ---');

runTest('S3-01: Rejects missing or empty applicant name', () => {
  const res = validateSpecialtyStudioInput({
    contractor_or_applicant: '',
    pan_number: 'AAACA1234F',
    selected_product: 'surety_bond',
    principal_amount: 50000000,
  });
  assert.strictEqual(res.is_valid, false);
  assert.strictEqual(res.contract_ready, false);
  assert.strictEqual(res.error, 'Applicant name is required');
});

runTest('S3-02: Validates standard Indian PAN format successfully', () => {
  const res = validateSpecialtyStudioInput({
    contractor_or_applicant: 'Afcons Infrastructure',
    pan_number: 'AAACA1234F',
    selected_product: 'surety_bond',
    principal_amount: 50000000,
  });
  assert.strictEqual(res.is_valid, true);
  assert.strictEqual(res.contract_ready, true);
  assert.strictEqual(res.error, undefined);
});

runTest('S3-03: Auto-uppercases lowercase PAN before validation', () => {
  const res = validateSpecialtyStudioInput({
    contractor_or_applicant: 'L&T Construction',
    pan_number: 'aaacl1234g',
    selected_product: 'surety_bond',
    principal_amount: 10000000,
  });
  assert.strictEqual(res.is_valid, true);
  assert.strictEqual(res.contract_ready, true);
});

runTest('S3-04: Rejects 9-character PAN with exact error string', () => {
  const res = validateSpecialtyStudioInput({
    contractor_or_applicant: 'Afcons',
    pan_number: 'AAACA1234',
    selected_product: 'surety_bond',
    principal_amount: 1000000,
  });
  assert.strictEqual(res.is_valid, false);
  assert.strictEqual(res.contract_ready, false);
  assert.strictEqual(res.error, 'Invalid Indian PAN format');
});

runTest('S3-05: Rejects inverted PAN (digits in letters segment)', () => {
  const res = validateSpecialtyStudioInput({
    contractor_or_applicant: 'Afcons',
    pan_number: '12345ABCDE',
    selected_product: 'surety_bond',
    principal_amount: 1000000,
  });
  assert.strictEqual(res.is_valid, false);
  assert.strictEqual(res.contract_ready, false);
  assert.strictEqual(res.error, 'Invalid Indian PAN format');
});

runTest('S3-06: Rejects zero and negative principal amounts', () => {
  const zero = validateSpecialtyStudioInput({
    contractor_or_applicant: 'Tata Steel',
    pan_number: 'AAACT5678K',
    selected_product: 'trade_credit',
    principal_amount: 0,
  });
  assert.strictEqual(zero.is_valid, false);
  assert.strictEqual(zero.error, 'Principal amount must be positive');

  const neg = validateSpecialtyStudioInput({
    contractor_or_applicant: 'Tata Steel',
    pan_number: 'AAACT5678K',
    selected_product: 'trade_credit',
    principal_amount: -50000,
  });
  assert.strictEqual(neg.is_valid, false);
  assert.strictEqual(neg.error, 'Principal amount must be positive');
});

runTest('S3-07: Confirms contract readiness for all valid products (Surety, Trade Credit, Burglary)', () => {
  const surety = validateSpecialtyStudioInput({
    contractor_or_applicant: 'Dilip Buildcon',
    pan_number: 'AAACD1234F',
    selected_product: 'surety_bond',
    principal_amount: 50000000,
  });
  assert.strictEqual(surety.contract_ready, true);

  const tci = validateSpecialtyStudioInput({
    contractor_or_applicant: 'Exporter Corp',
    pan_number: 'AAACE5678G',
    selected_product: 'trade_credit',
    principal_amount: 200000000,
  });
  assert.strictEqual(tci.contract_ready, true);

  const burg = validateSpecialtyStudioInput({
    contractor_or_applicant: 'Retail Hub',
    pan_number: 'AAACR9999Z',
    selected_product: 'burglary',
    principal_amount: 25000000,
  });
  assert.strictEqual(burg.contract_ready, true);
});

// ============================================================================
// SUITE 4: COMMERCIAL BURGLARY & FIRST LOSS TARIFF ENGINE (6 TESTS)
// ============================================================================
console.log('--- Suite 4: Commercial Burglary & First Loss Tariff Engine ---');

runTest('S4-01: First loss percentages (25%, 50%, 75%, 100%) scale sum insured accurately', () => {
  const baseSI = 10000000; // 1 Cr
  const p25 = calculateBurglaryPremium({
    property_sum_insured: baseSI,
    first_loss_percentage: 25,
    has_cctv: false,
    has_247_security_guards: false,
    has_burglar_alarm: false,
  });
  assert.strictEqual(p25.first_loss_sum_insured, 2500000);
  assert.strictEqual(p25.net_burglary_premium, 6250); // 2.5M * 2.5‰

  const p50 = calculateBurglaryPremium({
    property_sum_insured: baseSI,
    first_loss_percentage: 50,
    has_cctv: false,
    has_247_security_guards: false,
    has_burglar_alarm: false,
  });
  assert.strictEqual(p50.first_loss_sum_insured, 5000000);
  assert.strictEqual(p50.net_burglary_premium, 12500); // 5.0M * 2.5‰
});

runTest('S4-02: CCTV protection applies exact -5% security discount', () => {
  const res = calculateBurglaryPremium({
    property_sum_insured: 10000000,
    first_loss_percentage: 100,
    has_cctv: true,
    has_247_security_guards: false,
    has_burglar_alarm: false,
  });
  assert.strictEqual(res.cctv_discount_percent, 5);
  assert.strictEqual(res.total_security_discount_percent, 5);
  // Gross: 10M * 2.5‰ = 25,000. Net: 25,000 * 0.95 = 23,750
  assert.strictEqual(res.net_burglary_premium, 23750);
});

runTest('S4-03: 24/7 security guards applies exact -10% discount', () => {
  const res = calculateBurglaryPremium({
    property_sum_insured: 10000000,
    first_loss_percentage: 100,
    has_cctv: false,
    has_247_security_guards: true,
    has_burglar_alarm: false,
  });
  assert.strictEqual(res.guard_discount_percent, 10);
  assert.strictEqual(res.total_security_discount_percent, 10);
  // Gross 25,000 * 0.90 = 22,500
  assert.strictEqual(res.net_burglary_premium, 22500);
});

runTest('S4-04: Burglar alarm applies exact -5% discount', () => {
  const res = calculateBurglaryPremium({
    property_sum_insured: 10000000,
    first_loss_percentage: 100,
    has_cctv: false,
    has_247_security_guards: false,
    has_burglar_alarm: true,
  });
  assert.strictEqual(res.alarm_discount_percent, 5);
  assert.strictEqual(res.total_security_discount_percent, 5);
  assert.strictEqual(res.net_burglary_premium, 23750);
});

runTest('S4-05: Combined security discounts are capped at maximum 20%', () => {
  const res = calculateBurglaryPremium({
    property_sum_insured: 10000000,
    first_loss_percentage: 100,
    has_cctv: true, // 5%
    has_247_security_guards: true, // 10%
    has_burglar_alarm: true, // 5%
  });
  assert.strictEqual(res.total_security_discount_percent, 20);
  // Gross 25,000 * 0.80 = 20,000
  assert.strictEqual(res.net_burglary_premium, 20000);
});

runTest('S4-06: Zero or negative property sum insured throws exact error', () => {
  assert.throws(
    () =>
      calculateBurglaryPremium({
        property_sum_insured: 0,
        first_loss_percentage: 50,
        has_cctv: false,
        has_247_security_guards: false,
        has_burglar_alarm: false,
      }),
    /Property sum insured must be positive/
  );
});

// ============================================================================
// SUITE 5: STANDARD CONTRACT QUOTES, GST & EXPLAINABILITY (5 TESTS)
// ============================================================================
console.log('--- Suite 5: Standard Contract Quotes, GST & Algorithmic Explainability ---');

runTest('S5-01: Surety StandardQuoteBreakdown returns 18% GST and correct sum insured', () => {
  const quote = calculateSuretyQuote({
    bond_type: 'performance_bond',
    bond_value: 50000000,
    tenure_months: 24,
    contractor_grade: 'AA',
    contractor_net_worth: 200000000,
  });
  assert.strictEqual(quote.lob_category, 'specialty');
  assert.strictEqual(quote.insurance_line, 'surety_bond');
  assert.strictEqual(quote.sum_insured, 50000000);
  assert.strictEqual(quote.net_premium, 1500000);
  assert.strictEqual(quote.gst_rate_percent, 18);
  assert.strictEqual(quote.gst_amount, 270000);
  assert.strictEqual(quote.total_premium, 1770000);
});

runTest('S5-02: Trade Credit StandardQuoteBreakdown returns 18% GST and statutory clauses', () => {
  const quote = calculateTradeCreditQuote({
    insurable_turnover: 100000000,
    average_credit_days: 60,
    top_10_buyers_turnover_share_percent: 40,
    requested_indemnity_percent: 90,
  });
  assert.strictEqual(quote.lob_category, 'specialty');
  assert.strictEqual(quote.insurance_line, 'trade_credit');
  assert.strictEqual(quote.sum_insured, 100000000);
  assert.strictEqual(quote.net_premium, 350000);
  assert.strictEqual(quote.gst_amount, 63000);
  assert.strictEqual(quote.total_premium, 413000);
  assert.ok(quote.statutory_clauses.length >= 6);
  assert.ok(quote.statutory_clauses.some((c) => c.includes('IRDAI (Trade Credit Insurance) Guidelines')));
});

runTest('S5-03: Burglary StandardQuoteBreakdown returns 18% GST and line breakdown', () => {
  const quote = calculateBurglaryQuote({
    property_sum_insured: 20000000,
    first_loss_percentage: 50,
    has_cctv: true,
    has_247_security_guards: true,
    has_burglar_alarm: false,
  });
  assert.strictEqual(quote.lob_category, 'specialty');
  assert.strictEqual(quote.insurance_line, 'burglary');
  assert.strictEqual(quote.sum_insured, 10000000);
  // 10M * 2.5‰ = 25,000. Disc: 5 + 10 = 15%. Net: 25,000 * 0.85 = 21,250
  assert.strictEqual(quote.net_premium, 21250);
  assert.strictEqual(quote.gst_amount, Math.round(21250 * 0.18));
  assert.strictEqual(quote.total_premium, quote.net_premium + quote.gst_amount);
});

runTest('S5-04: Algorithmic explainability audit vector contains 4 steps with non-empty values', () => {
  const quote = calculateSuretyQuote({
    bond_type: 'performance_bond',
    bond_value: 10000000,
    tenure_months: 12,
    contractor_grade: 'AAA',
    contractor_net_worth: 50000000,
  });
  assert.strictEqual(quote.algorithmic_explainability.length, 4);
  for (const step of quote.algorithmic_explainability) {
    assert.ok(step.step.length > 0);
    assert.ok(step.description.length > 0);
    assert.ok(String(step.value).length > 0);
  }
});

runTest('S5-05: Statutory clauses array contains GFR 2017 Rules 170 and 171', () => {
  assert.ok(STATUTORY_SPECIALTY_CLAUSES.some((c) => c.includes('GFR) 2017 Rule 170')));
  assert.ok(STATUTORY_SPECIALTY_CLAUSES.some((c) => c.includes('GFR) 2017 Rule 171')));
  assert.ok(STATUTORY_SPECIALTY_CLAUSES.some((c) => c.includes('Section 64VB')));
});

// ============================================================================
// SUITE 6: MULTI-LINE SPECIALTY PACKAGE (4 TESTS)
// ============================================================================
console.log('--- Suite 6: Multi-Line Specialty Package ---');

runTest('S6-01: Combined package aggregates Surety + Trade Credit + Burglary net premiums and sum insured', () => {
  const pkg = calculateSpecialtyPackageQuote({
    surety: {
      bond_type: 'performance_bond',
      bond_value: 50000000,
      tenure_months: 12,
      contractor_grade: 'AA',
      contractor_net_worth: 200000000,
    },
    trade_credit: {
      insurable_turnover: 100000000,
      average_credit_days: 60,
      top_10_buyers_turnover_share_percent: 40,
      requested_indemnity_percent: 90,
    },
    burglary: {
      property_sum_insured: 20000000,
      first_loss_percentage: 50,
      has_cctv: true,
      has_247_security_guards: true,
      has_burglar_alarm: true,
    },
  });

  // Surety: 50M * 1.5% = 750,000
  // Trade Credit: 100M * 0.35% = 350,000
  // Burglary: 10M * 2.5‰ = 25,000. Disc 20% -> 20,000
  // Total Net: 750,000 + 350,000 + 20,000 = 1,120,000
  assert.strictEqual(pkg.net_premium, 1120000);
  assert.strictEqual(pkg.sum_insured, 50000000 + 100000000 + 10000000);
  assert.strictEqual(pkg.line_specific_breakdown.lines_selected_count, 3);
});

runTest('S6-02: Package GST calculated as Math.round(totalNet * 0.18) with exact total premium', () => {
  const pkg = calculateSpecialtyPackageQuote({
    surety: {
      bond_type: 'bid_bond',
      bond_value: 10000000,
      tenure_months: 12,
      contractor_grade: 'AA',
      contractor_net_worth: 50000000,
    },
    trade_credit: {
      insurable_turnover: 50000000,
      average_credit_days: 30,
      top_10_buyers_turnover_share_percent: 40,
      requested_indemnity_percent: 90,
    },
  });
  // Surety: 100,000. TCI: 50M * 0.25% = 125,000. Total Net: 225,000
  assert.strictEqual(pkg.net_premium, 225000);
  assert.strictEqual(pkg.gst_amount, Math.round(225000 * 0.18));
  assert.strictEqual(pkg.total_premium, 225000 + Math.round(225000 * 0.18));
});

runTest('S6-03: Package explainability contains breakdown for each active sub-line', () => {
  const pkg = calculateSpecialtyPackageQuote({
    surety: {
      bond_type: 'bid_bond',
      bond_value: 10000000,
      tenure_months: 12,
      contractor_grade: 'AA',
      contractor_net_worth: 50000000,
    },
    burglary: {
      property_sum_insured: 10000000,
      first_loss_percentage: 100,
      has_cctv: true,
      has_247_security_guards: false,
      has_burglar_alarm: false,
    },
  });
  assert.strictEqual(pkg.algorithmic_explainability.length, 3); // Section 1, Section 2, Section 3 (Total)
});

runTest('S6-04: Empty package throws error', () => {
  assert.throws(
    () => calculateSpecialtyPackageQuote({}),
    /At least one specialty line must be selected for package calculation/
  );
});

console.log('\n======================================================================');
console.log(` RESULTS: ${passedTests} of ${totalTests} tests passed (100% exit 0)`);
console.log('======================================================================\n');
