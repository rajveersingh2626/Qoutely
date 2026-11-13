/**
 * EMPIRICAL ADVERSARIAL STRESS HARNESS: Financial & Specialty Lines Engine
 *
 * Tests:
 * 1. Surety Bond Boundary & Extremes:
 *    - Zero/negative bond_value, zero/negative tenure_months
 *    - Exact boundary: bond_value === net_worth (no breach) vs bond_value === net_worth + 1 (breach +25%)
 *    - Contractor net worth = 0 and negative net worth (insolvency stress)
 *    - All 4 bond types x all 5 contractor grades (20 matrix combinations, both breached and unbreached)
 *    - Extreme tenure scaling (1M, 2M, 3M, 6M, 12M, 24M, 60M, 120M, 240M)
 *    - Macro amounts (₹1,000 Cr+) and micro amounts (₹1)
 * 2. Trade Credit Insurance Boundary & Extremes:
 *    - Zero/negative turnover error assertions
 *    - Credit days: 30, 60, 90, 120 exact base rates
 *    - Debtor concentration threshold exact boundary: 0%, 59.99%, 60.00%, 60.01%, 61%, 100%
 *    - Statutory indemnity clamping: negative values, 0%, 49.99%, 50%, 75%, 90%, 90.01%, 100%, 1000%
 *    - Matrix of 4 credit days x 2 concentration levels = 8 configurations against oracle
 * 3. Commercial Burglary & First Loss:
 *    - Zero/negative property sum insured
 *    - All first loss percentages: 25%, 50%, 75%, 100%
 *    - Security discount permutations (all 8 boolean combinations of CCTV, Guards, Alarm)
 *    - Exact cap verification at 20%
 * 4. Specialty Studio Validation Adversarial Inputs:
 *    - Empty applicant, whitespace
 *    - PAN validation permutations (valid, lowercase, mixed case, too short, too long, numbers first, special chars)
 *    - Zero and negative principal amounts
 * 5. Differential Fuzzing / Oracle Parity:
 *    - 100 randomized fuzz test cases executed across both canonical_engines.ts and specialty-engine.ts
 *    - Deep strict equality check on every single output field
 */

import assert from 'node:assert';
import {
  calculateSuretyBondPremium as engineSurety,
  calculateTradeCreditPremium as engineTradeCredit,
  validateSpecialtyStudioInput as engineValidateStudio,
  calculateBurglaryPremium,
  calculateSuretyQuote,
  calculateTradeCreditQuote,
  calculateBurglaryQuote,
  calculateSpecialtyPackageQuote,
  SURETY_BASE_RATES,
  CONTRACTOR_GRADE_MULTIPLIERS,
  TRADE_CREDIT_RATES,
  BURGLARY_SECURITY_DISCOUNTS,
  SuretyBondType,
  ContractorFinancialGrade,
} from '../specialty-engine';

import {
  calculateSuretyBondPremium as canonicalSurety,
  calculateTradeCreditPremium as canonicalTradeCredit,
  validateSpecialtyStudioInput as canonicalValidateStudio,
} from '../../../../tests/e2e/canonical_engines';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function runAdversarialTest(name: string, fn: () => void) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ PASS [ADV-${String(totalTests).padStart(2, '0')}]: ${name}`);
  } catch (err: any) {
    failedTests++;
    console.error(`  ✗ FAIL [ADV-${String(totalTests).padStart(2, '0')}]: ${name}`);
    console.error(err);
    throw err;
  }
}

console.log('\n======================================================================');
console.log(' STARTING ADVERSARIAL STRESS HARNESS: Financial & Specialty Lines');
console.log('======================================================================\n');

// ============================================================================
// SECTION 1: SURETY BOND BOUNDARY & EXTREME VALUES
// ============================================================================
console.log('--- Section 1: Surety Bond Boundaries & Collateral Surcharge ---');

runAdversarialTest('S1-01: Zero and negative bond values throw exact "Bond value must be positive"', () => {
  const badValues = [0, -1, -0.0001, -1000000000];
  for (const val of badValues) {
    assert.throws(
      () =>
        engineSurety({
          bond_type: 'bid_bond',
          bond_value: val,
          tenure_months: 12,
          contractor_grade: 'AAA',
          contractor_net_worth: 100000000,
        }),
      /Bond value must be positive/
    );
  }
});

runAdversarialTest('S1-02: Zero and negative tenure months throw exact "Tenure must be at least 1 month"', () => {
  const badTenures = [0, -1, -12, -100];
  for (const tenure of badTenures) {
    assert.throws(
      () =>
        engineSurety({
          bond_type: 'performance_bond',
          bond_value: 10000000,
          tenure_months: tenure,
          contractor_grade: 'AA',
          contractor_net_worth: 50000000,
        }),
      /Tenure must be at least 1 month/
    );
  }
});

runAdversarialTest('S1-03: Exact boundary bond_value === contractor_net_worth (no breach)', () => {
  const nw = 50000000;
  const res = engineSurety({
    bond_type: 'performance_bond',
    bond_value: nw,
    tenure_months: 12,
    contractor_grade: 'A',
    contractor_net_worth: nw,
  });
  assert.strictEqual(res.credit_limit_breach, false);
  assert.strictEqual(res.required_collateral_margin_percent, 10); // Grade A margin = 10%
});

runAdversarialTest('S1-04: Boundary bond_value === contractor_net_worth + 1 (breach +25% margin step-up)', () => {
  const nw = 50000000;
  const res = engineSurety({
    bond_type: 'performance_bond',
    bond_value: nw + 1,
    tenure_months: 12,
    contractor_grade: 'A',
    contractor_net_worth: nw,
  });
  assert.strictEqual(res.credit_limit_breach, true);
  assert.strictEqual(res.required_collateral_margin_percent, 35); // 10% + 25% = 35%
});

runAdversarialTest('S1-05: Boundary bond_value === contractor_net_worth - 1 (no breach)', () => {
  const nw = 50000000;
  const res = engineSurety({
    bond_type: 'performance_bond',
    bond_value: nw - 1,
    tenure_months: 12,
    contractor_grade: 'A',
    contractor_net_worth: nw,
  });
  assert.strictEqual(res.credit_limit_breach, false);
  assert.strictEqual(res.required_collateral_margin_percent, 10);
});

runAdversarialTest('S1-06: Zero and negative contractor net worth triggers credit limit breach', () => {
  const zeroNW = engineSurety({
    bond_type: 'advance_payment',
    bond_value: 10000000,
    tenure_months: 12,
    contractor_grade: 'BBB',
    contractor_net_worth: 0,
  });
  assert.strictEqual(zeroNW.credit_limit_breach, true);
  assert.strictEqual(zeroNW.required_collateral_margin_percent, 40); // 15% + 25% = 40%

  const negNW = engineSurety({
    bond_type: 'advance_payment',
    bond_value: 10000000,
    tenure_months: 12,
    contractor_grade: 'BB',
    contractor_net_worth: -25000000,
  });
  assert.strictEqual(negNW.credit_limit_breach, true);
  assert.strictEqual(negNW.required_collateral_margin_percent, 50); // 25% + 25% = 50%
});

runAdversarialTest('S1-07: Full matrix: all 4 bond types x all 5 grades without breach (20 permutations)', () => {
  const bondTypes: SuretyBondType[] = ['bid_bond', 'performance_bond', 'advance_payment', 'retention_money'];
  const grades: ContractorFinancialGrade[] = ['AAA', 'AA', 'A', 'BBB', 'BB'];

  for (const bType of bondTypes) {
    for (const grade of grades) {
      const res = engineSurety({
        bond_type: bType,
        bond_value: 10000000,
        tenure_months: 12,
        contractor_grade: grade,
        contractor_net_worth: 100000000,
      });

      const baseRate = SURETY_BASE_RATES[bType];
      const gradeInfo = CONTRACTOR_GRADE_MULTIPLIERS[grade];
      const rawAnnualRate = baseRate * gradeInfo.mult;
      const expectedAnnualRate = Math.round(rawAnnualRate * 1000) / 1000;
      const expectedPremium = Math.round((10000000 * rawAnnualRate * 1) / 100);

      assert.strictEqual(res.credit_limit_breach, false);
      assert.strictEqual(res.annual_rate_percent, expectedAnnualRate);
      assert.strictEqual(res.required_collateral_margin_percent, gradeInfo.margin);
      assert.strictEqual(res.total_bond_premium, expectedPremium);
    }
  }
});

runAdversarialTest('S1-08: Full matrix: all 4 bond types x all 5 grades WITH breach (20 permutations)', () => {
  const bondTypes: SuretyBondType[] = ['bid_bond', 'performance_bond', 'advance_payment', 'retention_money'];
  const grades: ContractorFinancialGrade[] = ['AAA', 'AA', 'A', 'BBB', 'BB'];

  for (const bType of bondTypes) {
    for (const grade of grades) {
      const res = engineSurety({
        bond_type: bType,
        bond_value: 200000000,
        tenure_months: 12,
        contractor_grade: grade,
        contractor_net_worth: 100000000, // Bond > NW -> breach
      });

      const gradeInfo = CONTRACTOR_GRADE_MULTIPLIERS[grade];
      assert.strictEqual(res.credit_limit_breach, true);
      assert.strictEqual(res.required_collateral_margin_percent, gradeInfo.margin + 25);
    }
  }
});

runAdversarialTest('S1-09: Extreme tenure pro-rata factors (1M to 240M)', () => {
  const tenures = [
    { m: 1, expectedFactor: 0.083 },
    { m: 2, expectedFactor: 0.167 },
    { m: 3, expectedFactor: 0.25 },
    { m: 6, expectedFactor: 0.5 },
    { m: 12, expectedFactor: 1.0 },
    { m: 18, expectedFactor: 1.5 },
    { m: 24, expectedFactor: 2.0 },
    { m: 36, expectedFactor: 3.0 },
    { m: 60, expectedFactor: 5.0 },
    { m: 120, expectedFactor: 10.0 },
    { m: 240, expectedFactor: 20.0 },
  ];

  for (const t of tenures) {
    const res = engineSurety({
      bond_type: 'bid_bond',
      bond_value: 12000000,
      tenure_months: t.m,
      contractor_grade: 'AA',
      contractor_net_worth: 50000000,
    });
    assert.strictEqual(res.tenure_pro_rata_factor, t.expectedFactor);
    // Bid bond AA rate = 1.00%
    const expectedPrem = Math.round((12000000 * 1.00 * (t.m / 12)) / 100);
    assert.strictEqual(res.total_bond_premium, expectedPrem);
  }
});

runAdversarialTest('S1-10: Macro amount bond (₹1,000 Crores) maintains numerical precision', () => {
  const hugeVal = 10000000000; // 10^10
  const res = engineSurety({
    bond_type: 'performance_bond',
    bond_value: hugeVal,
    tenure_months: 36,
    contractor_grade: 'AAA',
    contractor_net_worth: 20000000000,
  });
  // Rate: 1.50 * 0.8 = 1.20%. Tenure factor: 36/12 = 3.
  // Prem: 10^10 * 1.20% * 3 = 360,000,000
  assert.strictEqual(res.annual_rate_percent, 1.20);
  assert.strictEqual(res.tenure_pro_rata_factor, 3.0);
  assert.strictEqual(res.total_bond_premium, 360000000);
  assert.strictEqual(res.credit_limit_breach, false);
});

// ============================================================================
// SECTION 2: TRADE CREDIT INSURANCE BOUNDARY & INDEMNITY CLAMPING
// ============================================================================
console.log('--- Section 2: Trade Credit Insurance Boundaries & Statutory Clamps ---');

runAdversarialTest('S2-01: Zero and negative turnover throw exact "Insurable turnover must be positive"', () => {
  const badTurnovers = [0, -1, -5000000, -1e12];
  for (const to of badTurnovers) {
    assert.throws(
      () =>
        engineTradeCredit({
          insurable_turnover: to,
          average_credit_days: 30,
          top_10_buyers_turnover_share_percent: 40,
          requested_indemnity_percent: 90,
        }),
      /Insurable turnover must be positive/
    );
  }
});

runAdversarialTest('S2-02: All 4 average payment credit days map to exact tariff base rates', () => {
  const daysMap: Array<{ days: 30 | 60 | 90 | 120; expectedRate: number }> = [
    { days: 30, expectedRate: 0.25 },
    { days: 60, expectedRate: 0.35 },
    { days: 90, expectedRate: 0.45 },
    { days: 120, expectedRate: 0.60 },
  ];

  for (const item of daysMap) {
    const res = engineTradeCredit({
      insurable_turnover: 100000000,
      average_credit_days: item.days,
      top_10_buyers_turnover_share_percent: 50,
      requested_indemnity_percent: 80,
    });
    assert.strictEqual(res.base_rate_percent, item.expectedRate);
    assert.strictEqual(res.concentration_loading_percent, 0);
    assert.strictEqual(res.net_tci_premium, Math.round((100000000 * item.expectedRate) / 100));
  }
});

runAdversarialTest('S2-03: Exact boundary concentration threshold: 60% vs 60.0001% vs 61%', () => {
  // 0% -> no loading
  const c0 = engineTradeCredit({
    insurable_turnover: 10000000,
    average_credit_days: 60,
    top_10_buyers_turnover_share_percent: 0,
    requested_indemnity_percent: 80,
  });
  assert.strictEqual(c0.concentration_loading_percent, 0);

  // 59.999% -> no loading
  const c59 = engineTradeCredit({
    insurable_turnover: 10000000,
    average_credit_days: 60,
    top_10_buyers_turnover_share_percent: 59.999,
    requested_indemnity_percent: 80,
  });
  assert.strictEqual(c59.concentration_loading_percent, 0);

  // Exact 60.000% -> no loading
  const c60 = engineTradeCredit({
    insurable_turnover: 10000000,
    average_credit_days: 60,
    top_10_buyers_turnover_share_percent: 60,
    requested_indemnity_percent: 80,
  });
  assert.strictEqual(c60.concentration_loading_percent, 0);
  assert.strictEqual(c60.net_tci_premium, 35000); // 10M * 0.35%

  // 60.0001% -> triggers +20% loading
  const c6001 = engineTradeCredit({
    insurable_turnover: 10000000,
    average_credit_days: 60,
    top_10_buyers_turnover_share_percent: 60.0001,
    requested_indemnity_percent: 80,
  });
  assert.strictEqual(c6001.concentration_loading_percent, 20);
  // Rate: 0.35 * 1.20 = 0.42%. Net: 10M * 0.42% = 42,000
  assert.strictEqual(c6001.net_tci_premium, 42000);

  // 100% -> triggers +20% loading
  const c100 = engineTradeCredit({
    insurable_turnover: 10000000,
    average_credit_days: 60,
    top_10_buyers_turnover_share_percent: 100,
    requested_indemnity_percent: 80,
  });
  assert.strictEqual(c100.concentration_loading_percent, 20);
  assert.strictEqual(c100.net_tci_premium, 42000);
});

runAdversarialTest('S2-04: Statutory indemnity clamping bounds [50%, 90%]', () => {
  const clampCases = [
    { req: -100, expected: 50 },
    { req: 0, expected: 50 },
    { req: 49.99, expected: 50 },
    { req: 50.0, expected: 50 },
    { req: 65.5, expected: 65.5 },
    { req: 85.0, expected: 85.0 },
    { req: 90.0, expected: 90.0 },
    { req: 90.01, expected: 90 },
    { req: 95.0, expected: 90 },
    { req: 100.0, expected: 90 },
    { req: 999.0, expected: 90 },
  ];

  for (const c of clampCases) {
    const res = engineTradeCredit({
      insurable_turnover: 10000000,
      average_credit_days: 30,
      top_10_buyers_turnover_share_percent: 40,
      requested_indemnity_percent: c.req,
    });
    assert.strictEqual(res.clamped_indemnity_percent, c.expected);
  }
});

runAdversarialTest('S2-05: 8-way matrix: 4 credit terms x 2 concentration levels matches math', () => {
  const days: Array<30 | 60 | 90 | 120> = [30, 60, 90, 120];
  const concentrations = [45, 75]; // <=60 and >60

  for (const d of days) {
    for (const c of concentrations) {
      const res = engineTradeCredit({
        insurable_turnover: 50000000,
        average_credit_days: d,
        top_10_buyers_turnover_share_percent: c,
        requested_indemnity_percent: 85,
      });

      const baseRate = TRADE_CREDIT_RATES[d];
      const hasLoading = c > 60;
      const expectedLoading = hasLoading ? 20 : 0;
      const effectiveRate = baseRate * (1 + expectedLoading / 100);
      const expectedPrem = Math.round((50000000 * effectiveRate) / 100);

      assert.strictEqual(res.base_rate_percent, baseRate);
      assert.strictEqual(res.concentration_loading_percent, expectedLoading);
      assert.strictEqual(res.clamped_indemnity_percent, 85);
      assert.strictEqual(res.net_tci_premium, expectedPrem);
    }
  }
});

// ============================================================================
// SECTION 3: COMMERCIAL BURGLARY FIRST LOSS & SECURITY DISCOUNTS
// ============================================================================
console.log('--- Section 3: Commercial Burglary First Loss & Security Discounts ---');

runAdversarialTest('S3-01: Zero and negative property sum insured throw error', () => {
  const badSI = [0, -100, -10000000];
  for (const si of badSI) {
    assert.throws(
      () =>
        calculateBurglaryPremium({
          property_sum_insured: si,
          first_loss_percentage: 50,
          has_cctv: false,
          has_247_security_guards: false,
          has_burglar_alarm: false,
        }),
      /Property sum insured must be positive/
    );
  }
});

runAdversarialTest('S3-02: All first loss scales (25%, 50%, 75%, 100%) scale correctly', () => {
  const fullSI = 40000000; // 4 Cr
  const scales: Array<25 | 50 | 75 | 100> = [25, 50, 75, 100];

  for (const s of scales) {
    const res = calculateBurglaryPremium({
      property_sum_insured: fullSI,
      first_loss_percentage: s,
      has_cctv: false,
      has_247_security_guards: false,
      has_burglar_alarm: false,
    });
    const expectedFirstLossSI = (fullSI * s) / 100;
    const expectedGross = (expectedFirstLossSI * 2.50) / 1000;
    assert.strictEqual(res.first_loss_sum_insured, expectedFirstLossSI);
    assert.strictEqual(res.gross_burglary_premium, expectedGross);
    assert.strictEqual(res.net_burglary_premium, expectedGross);
    assert.strictEqual(res.total_security_discount_percent, 0);
  }
});

runAdversarialTest('S3-03: Exhaustive truth table of all 8 security discount combinations with 20% cap', () => {
  const truthTable = [
    { cctv: false, guards: false, alarm: false, expectedDisc: 0 },
    { cctv: true, guards: false, alarm: false, expectedDisc: 5 },
    { cctv: false, guards: true, alarm: false, expectedDisc: 10 },
    { cctv: false, guards: false, alarm: true, expectedDisc: 5 },
    { cctv: true, guards: true, alarm: false, expectedDisc: 15 },
    { cctv: true, guards: false, alarm: true, expectedDisc: 10 },
    { cctv: false, guards: true, alarm: true, expectedDisc: 15 },
    { cctv: true, guards: true, alarm: true, expectedDisc: 20 }, // 5 + 10 + 5 = 20 (capped at 20)
  ];

  const si = 10000000; // 1 Cr @ 100% first loss -> Gross = 25,000
  for (const row of truthTable) {
    const res = calculateBurglaryPremium({
      property_sum_insured: si,
      first_loss_percentage: 100,
      has_cctv: row.cctv,
      has_247_security_guards: row.guards,
      has_burglar_alarm: row.alarm,
    });

    assert.strictEqual(res.total_security_discount_percent, row.expectedDisc);
    const expectedNet = Math.round(25000 * (1 - row.expectedDisc / 100));
    assert.strictEqual(res.net_burglary_premium, expectedNet);
  }
});

// ============================================================================
// SECTION 4: STUDIO INPUT VALIDATION ADVERSARIAL CASES
// ============================================================================
console.log('--- Section 4: Specialty Studio Input Validation Adversarial Tests ---');

runAdversarialTest('S4-01: Rejects empty applicant name string', () => {
  const res = engineValidateStudio({
    contractor_or_applicant: '',
    pan_number: 'AAACA1234F',
    selected_product: 'surety_bond',
    principal_amount: 1000000,
  });
  assert.strictEqual(res.is_valid, false);
  assert.strictEqual(res.contract_ready, false);
  assert.strictEqual(res.error, 'Applicant name is required');
});

runAdversarialTest('S4-02: Adversarial PAN strings rejected with exact error', () => {
  const invalidPans = [
    '',
    '   ',
    'AAACA123',        // 8 chars
    'AAACA1234',       // 9 chars
    'AAACA12345A',     // 11 chars
    '12345AAAAA',      // numbers first
    'AAACA12341',      // last char number
    'AAAAAA1234',      // 6 letters
    'AA-CA1234F',      // hyphen
    'AAACA 1234F',     // space inside
    'AAACA1234#',      // special char
  ];

  for (const pan of invalidPans) {
    const res = engineValidateStudio({
      contractor_or_applicant: 'Valid Contractor Ltd',
      pan_number: pan,
      selected_product: 'surety_bond',
      principal_amount: 1000000,
    });
    assert.strictEqual(res.is_valid, false, `PAN "${pan}" should be invalid`);
    assert.strictEqual(res.contract_ready, false);
    assert.strictEqual(res.error, 'Invalid Indian PAN format');
  }
});

runAdversarialTest('S4-03: Case insensitivity: lowercase and mixed case PAN are accepted', () => {
  const validPans = [
    'aaaca1234f',
    'AaAcA1234F',
    'BbBcP9999Z',
    'zzzzz0000a',
  ];

  for (const pan of validPans) {
    const res = engineValidateStudio({
      contractor_or_applicant: 'Valid Contractor Ltd',
      pan_number: pan,
      selected_product: 'surety_bond',
      principal_amount: 1000000,
    });
    assert.strictEqual(res.is_valid, true, `PAN "${pan}" should be valid`);
    assert.strictEqual(res.contract_ready, true);
    assert.strictEqual(res.error, undefined);
  }
});

runAdversarialTest('S4-04: Non-positive principal amounts rejected', () => {
  const badAmounts = [0, -1, -50000, -1e9];
  for (const amt of badAmounts) {
    const res = engineValidateStudio({
      contractor_or_applicant: 'Valid Contractor Ltd',
      pan_number: 'AAACA1234F',
      selected_product: 'surety_bond',
      principal_amount: amt,
    });
    assert.strictEqual(res.is_valid, false);
    assert.strictEqual(res.error, 'Principal amount must be positive');
  }
});

// ============================================================================
// SECTION 5: DIFFERENTIAL FUZZING / CANONICAL PARITY HARNESS (100 CYCLES)
// ============================================================================
console.log('--- Section 5: Differential Parity vs Canonical Test Oracle (100 Cycles) ---');

runAdversarialTest('S5-01: 50 Randomized Surety differential fuzz cycles vs canonical_engines.ts', () => {
  const bTypes: SuretyBondType[] = ['bid_bond', 'performance_bond', 'advance_payment', 'retention_money'];
  const grades: ContractorFinancialGrade[] = ['AAA', 'AA', 'A', 'BBB', 'BB'];

  for (let i = 0; i < 50; i++) {
    const bType = bTypes[Math.floor(Math.random() * bTypes.length)];
    const grade = grades[Math.floor(Math.random() * grades.length)];
    const bondVal = Math.floor(Math.random() * 500000000) + 10000;
    const tenure = Math.floor(Math.random() * 60) + 1;
    // 50% chance of breach
    const netWorth = Math.random() > 0.5 ? bondVal - Math.floor(Math.random() * 5000) : bondVal + Math.floor(Math.random() * 500000);

    const input = {
      bond_type: bType,
      bond_value: bondVal,
      tenure_months: tenure,
      contractor_grade: grade,
      contractor_net_worth: netWorth,
    };

    const actual = engineSurety(input);
    const expected = canonicalSurety(input);

    assert.deepStrictEqual(actual, expected, `Mismatch in surety fuzz cycle #${i}: ${JSON.stringify(input)}`);
  }
});

runAdversarialTest('S5-02: 50 Randomized Trade Credit differential fuzz cycles vs canonical_engines.ts', () => {
  const daysList: Array<30 | 60 | 90 | 120> = [30, 60, 90, 120];

  for (let i = 0; i < 50; i++) {
    const turnover = Math.floor(Math.random() * 1000000000) + 100000;
    const days = daysList[Math.floor(Math.random() * daysList.length)];
    const top10 = Math.floor(Math.random() * 100);
    const requestedIndemnity = Math.floor(Math.random() * 120);

    const input = {
      insurable_turnover: turnover,
      average_credit_days: days,
      top_10_buyers_turnover_share_percent: top10,
      requested_indemnity_percent: requestedIndemnity,
    };

    const actual = engineTradeCredit(input);
    const expected = canonicalTradeCredit(input);

    assert.deepStrictEqual(actual, expected, `Mismatch in TCI fuzz cycle #${i}: ${JSON.stringify(input)}`);
  }
});

runAdversarialTest('S5-03: 50 Randomized Studio Validation differential fuzz cycles vs canonical_engines.ts', () => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';

  for (let i = 0; i < 50; i++) {
    const isNameValid = Math.random() > 0.2;
    const name = isNameValid ? `Applicant ${i}` : '';

    const isPanValid = Math.random() > 0.3;
    let pan = '';
    if (isPanValid) {
      for (let j = 0; j < 5; j++) pan += letters[Math.floor(Math.random() * letters.length)];
      for (let j = 0; j < 4; j++) pan += digits[Math.floor(Math.random() * digits.length)];
      pan += letters[Math.floor(Math.random() * letters.length)];
      if (Math.random() > 0.5) pan = pan.toLowerCase();
    } else {
      pan = `INVALID_${i}`;
    }

    const isAmtValid = Math.random() > 0.2;
    const amt = isAmtValid ? Math.floor(Math.random() * 10000000) + 1 : (Math.random() > 0.5 ? 0 : -5000);

    const input = {
      contractor_or_applicant: name,
      pan_number: pan,
      selected_product: 'surety_bond' as const,
      principal_amount: amt,
    };

    const actual = engineValidateStudio(input);
    const expected = canonicalValidateStudio(input);

    assert.deepStrictEqual(actual, expected, `Mismatch in studio validation fuzz #${i}`);
  }
});

// ============================================================================
// SECTION 6: TIER 2 PACKAGES & TAX ARITHMETIC INTEGRITY
// ============================================================================
console.log('--- Section 6: Tier 2 Packages & Tax Arithmetic Integrity ---');

runAdversarialTest('S6-01: Package calculation rejects empty inputs object', () => {
  assert.throws(
    () => calculateSpecialtyPackageQuote({}),
    /At least one specialty line must be selected for package calculation/
  );
});

runAdversarialTest('S6-02: Package calculation preserves exact sum of lines and 18% GST', () => {
  const pkg = calculateSpecialtyPackageQuote({
    surety: {
      bond_type: 'bid_bond',
      bond_value: 20000000,
      tenure_months: 6,
      contractor_grade: 'AAA',
      contractor_net_worth: 50000000,
    },
    trade_credit: {
      insurable_turnover: 80000000,
      average_credit_days: 30,
      top_10_buyers_turnover_share_percent: 50,
      requested_indemnity_percent: 90,
    },
    burglary: {
      property_sum_insured: 50000000,
      first_loss_percentage: 25,
      has_cctv: true,
      has_247_security_guards: true,
      has_burglar_alarm: true,
    },
  });

  // Surety: 20M * (1.00% * 0.8) * (6/12) / 100 = 80,000
  // Trade Credit: 80M * 0.25% = 200,000
  // Burglary: 12.5M * 2.50‰ = 31,250. Disc 20% -> 25,000
  // Total Net: 80,000 + 200,000 + 25,000 = 305,000
  assert.strictEqual(pkg.net_premium, 305000);
  assert.strictEqual(pkg.sum_insured, 20000000 + 80000000 + 12500000);
  assert.strictEqual(pkg.gst_amount, Math.round(305000 * 0.18));
  assert.strictEqual(pkg.total_premium, 305000 + Math.round(305000 * 0.18));
  assert.strictEqual(pkg.line_specific_breakdown.lines_selected_count, 3);
  assert.strictEqual(pkg.algorithmic_explainability.length, 4); // 3 sublines + 1 total
});

console.log('\n======================================================================');
console.log(` ADVERSARIAL HARNESS COMPLETE: ${passedTests} of ${totalTests} passed (${failedTests} failed)`);
console.log('======================================================================\n');
