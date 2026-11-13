/**
 * Empirical Challenge Harness for Milestone 17 (Financial & Specialty Lines)
 * Agent: Challenger 2 (Empirical Challenger)
 */

import assert from 'node:assert';
import {
  validateSpecialtyStudioInput,
  calculateSuretyQuote,
  calculateTradeCreditQuote,
  calculateBurglaryQuote,
  calculateSpecialtyPackageQuote,
  calculateSuretyBondPremium,
  calculateTradeCreditPremium,
  calculateBurglaryPremium,
  SuretyBondInput,
  TradeCreditInput,
  BurglaryInput,
  SpecialtyStudioInput,
  STATUTORY_GST_RATE,
} from '../src/lib/engines/specialty-engine';

interface ChallengeResult {
  category: string;
  name: string;
  passed: boolean;
  observation: string;
  detail?: any;
}

const results: ChallengeResult[] = [];

function record(category: string, name: string, passed: boolean, observation: string, detail?: any) {
  results.push({ category, name, passed, observation, detail });
  const status = passed ? 'PASS' : 'WARN/FAIL';
  console.log(`[${status}] [${category}] ${name}: ${observation}`);
}

console.log('======================================================================');
console.log('STARTING EMPIRICAL CHALLENGE SUITE FOR MILESTONE 17');
console.log('======================================================================\n');

// ============================================================================
// CHALLENGE AREA 1: validateSpecialtyStudioInput BOUNDARY STRESS TESTS
// ============================================================================
console.log('--- Area 1: validateSpecialtyStudioInput Boundary Stress Tests ---');

// 1.1 Lowercase PANs and Mixed Case
{
  const lowerValid = validateSpecialtyStudioInput({
    contractor_or_applicant: 'Test Corp',
    pan_number: 'aaaca1234f',
    selected_product: 'surety_bond',
    principal_amount: 1000000,
  });
  record(
    'PAN Case Insensitivity',
    'Lowercase valid PAN aaaca1234f',
    lowerValid.is_valid === true && lowerValid.contract_ready === true,
    `Returned is_valid=${lowerValid.is_valid}, contract_ready=${lowerValid.contract_ready}`
  );

  const mixedValid = validateSpecialtyStudioInput({
    contractor_or_applicant: 'Test Corp',
    pan_number: 'AaAcA1234F',
    selected_product: 'surety_bond',
    principal_amount: 1000000,
  });
  record(
    'PAN Case Insensitivity',
    'Mixed-case valid PAN AaAcA1234F',
    mixedValid.is_valid === true && mixedValid.contract_ready === true,
    `Returned is_valid=${mixedValid.is_valid}, contract_ready=${mixedValid.contract_ready}`
  );
}

// 1.2 Short / Long / Invalid Length PANs
{
  const lengthsToTest = [
    { pan: '', desc: 'Empty PAN' },
    { pan: 'A', desc: '1 char PAN' },
    { pan: 'AAACA', desc: '5 char PAN' },
    { pan: 'AAACA123', desc: '8 char PAN' },
    { pan: 'AAACA1234', desc: '9 char PAN' },
    { pan: 'AAACA1234FA', desc: '11 char PAN' },
    { pan: 'AAACA1234F'.repeat(5), desc: '50 char PAN' },
  ];

  for (const { pan, desc } of lengthsToTest) {
    const res = validateSpecialtyStudioInput({
      contractor_or_applicant: 'Test Corp',
      pan_number: pan,
      selected_product: 'surety_bond',
      principal_amount: 1000000,
    });
    record(
      'PAN Length Boundaries',
      desc,
      res.is_valid === false && res.contract_ready === false && res.error === 'Invalid Indian PAN format',
      `pan="${pan.slice(0, 15)}..." rejected with error="${res.error}"`
    );
  }
}

// 1.3 Invalid Characters, Symbols, Number Position
{
  const invalidPans = [
    { pan: '12345ABCDE', desc: 'Numbers in letter prefix (12345ABCDE)' },
    { pan: 'A1ACA1234F', desc: 'Digit inside 5-letter prefix' },
    { pan: 'AAACABCDEF', desc: 'Letters in 4-digit middle' },
    { pan: 'AAACA12345', desc: 'Digit as 10th character' },
    { pan: 'AAACA1234@', desc: 'Special char @ at end' },
    { pan: 'AAACA 1234F', desc: 'Whitespace embedded' },
    { pan: 'AAACA-1234F', desc: 'Hyphen embedded' },
    { pan: 'AAACA1234F ', desc: 'Trailing space' },
    { pan: ' AAACA1234F', desc: 'Leading space' },
    { pan: 'ÀAACA1234F', desc: 'Unicode diacritic character' },
    { pan: 'AAACA1234\0F', desc: 'Null byte injection' },
    { pan: 'AAACA1234F\n', desc: 'Newline injection' },
  ];

  for (const { pan, desc } of invalidPans) {
    const res = validateSpecialtyStudioInput({
      contractor_or_applicant: 'Test Corp',
      pan_number: pan,
      selected_product: 'surety_bond',
      principal_amount: 1000000,
    });
    record(
      'PAN Structural Rigor',
      desc,
      res.is_valid === false && res.contract_ready === false && res.error === 'Invalid Indian PAN format',
      `pan="${pan.replace(/\0/g, '\\0').replace(/\n/g, '\\n')}" rejected with error="${res.error}"`
    );
  }
}

// 1.4 Applicant Name Boundaries (Empty & Whitespace-only)
{
  const emptyRes = validateSpecialtyStudioInput({
    contractor_or_applicant: '',
    pan_number: 'AAACA1234F',
    selected_product: 'surety_bond',
    principal_amount: 1000000,
  });
  record(
    'Applicant Name Boundaries',
    'Empty string applicant name ""',
    emptyRes.is_valid === false && emptyRes.error === 'Applicant name is required',
    `Returned is_valid=${emptyRes.is_valid}, error="${emptyRes.error}"`
  );

  // Whitespace-only applicant name
  const spaceRes = validateSpecialtyStudioInput({
    contractor_or_applicant: '   ',
    pan_number: 'AAACA1234F',
    selected_product: 'surety_bond',
    principal_amount: 1000000,
  });
  record(
    'Applicant Name Boundaries',
    'Whitespace-only applicant name "   "',
    // Let's observe actual behavior!
    spaceRes.is_valid === false,
    `Observation: is_valid=${spaceRes.is_valid}, error="${spaceRes.error || 'NONE'}". (Note: if true, validateSpecialtyStudioInput does not trim applicant name before checking truthiness)`
  );

  const tabNewlineRes = validateSpecialtyStudioInput({
    contractor_or_applicant: '\t\n  \r\n',
    pan_number: 'AAACA1234F',
    selected_product: 'surety_bond',
    principal_amount: 1000000,
  });
  record(
    'Applicant Name Boundaries',
    'Tab/newline whitespace applicant name',
    tabNewlineRes.is_valid === false,
    `Observation: is_valid=${tabNewlineRes.is_valid}, error="${tabNewlineRes.error || 'NONE'}"`
  );
}

// 1.5 Principal Amount Boundaries (0, Negative, Floats, Extremes)
{
  const amountCases = [
    { amt: 0, desc: 'Zero principal amount', expectValid: false, expectError: 'Principal amount must be positive' },
    { amt: -1, desc: 'Negative -1 principal amount', expectValid: false, expectError: 'Principal amount must be positive' },
    { amt: -1000000, desc: 'Negative -1,000,000 principal amount', expectValid: false, expectError: 'Principal amount must be positive' },
    { amt: -0.0001, desc: 'Negative fractional -0.0001', expectValid: false, expectError: 'Principal amount must be positive' },
    { amt: -0, desc: 'Negative zero (-0)', expectValid: false, expectError: 'Principal amount must be positive' },
    { amt: 0.01, desc: 'Minimal positive amount (0.01)', expectValid: true },
    { amt: 1, desc: 'Positive 1 INR', expectValid: true },
    { amt: 100_000_000_000, desc: 'Extreme 100 Billion INR (10,000 Cr)', expectValid: true },
    { amt: Number.MAX_SAFE_INTEGER, desc: 'MAX_SAFE_INTEGER (9,007,199,254,740,991)', expectValid: true },
    { amt: NaN, desc: 'NaN amount', expectValid: false },
    { amt: -Infinity, desc: '-Infinity amount', expectValid: false },
  ];

  for (const { amt, desc, expectValid, expectError } of amountCases) {
    const res = validateSpecialtyStudioInput({
      contractor_or_applicant: 'Valid Applicant',
      pan_number: 'AAACA1234F',
      selected_product: 'surety_bond',
      principal_amount: amt,
    });
    const passed = res.is_valid === expectValid && (expectError ? res.error === expectError : true);
    record(
      'Principal Amount Boundaries',
      desc,
      passed,
      `amt=${amt} -> is_valid=${res.is_valid}, error="${res.error || 'NONE'}"`
    );
  }
}

// ============================================================================
// CHALLENGE AREA 2: TIER 2 QUOTE CALCULATIONS, GST, AND EXPLAINABILITY
// ============================================================================
console.log('\n--- Area 2: Tier 2 Quote Calculations, GST & Explainability ---');

// 2.1 Surety Quote: GST and Invariant Tests Across Value Sweep
{
  let allSuretyGstExact = true;
  let allSuretyTotalInvariant = true;
  let allSuretyExplainabilityValid = true;

  const bondTypes = ['bid_bond', 'performance_bond', 'advance_payment', 'retention_money'] as const;
  const grades = ['AAA', 'AA', 'A', 'BBB', 'BB'] as const;
  const tenures = [1, 3, 6, 7, 11, 12, 13, 24, 36, 60];
  const testValues = [1000, 12345, 100000, 333333, 10000000, 987654321];

  let combinationsTested = 0;

  for (const bond_type of bondTypes) {
    for (const contractor_grade of grades) {
      for (const tenure_months of tenures) {
        for (const bond_value of testValues) {
          combinationsTested++;
          const quote = calculateSuretyQuote({
            bond_type,
            bond_value,
            tenure_months,
            contractor_grade,
            contractor_net_worth: bond_value * 1.5, // no breach
          });

          // Check GST formula: Math.round(net_premium * 0.18)
          const expectedGst = Math.round(quote.net_premium * 0.18);
          if (quote.gst_amount !== expectedGst) {
            allSuretyGstExact = false;
            console.error(`SURETY GST MISMATCH at ${bond_type}, ${contractor_grade}, ${tenure_months}m, ₹${bond_value}: got ${quote.gst_amount}, expected ${expectedGst}`);
          }

          // Check total invariant: total_premium === net_premium + gst_amount
          if (quote.total_premium !== quote.net_premium + quote.gst_amount) {
            allSuretyTotalInvariant = false;
            console.error(`SURETY TOTAL INVARIANT FAILED: net=${quote.net_premium}, gst=${quote.gst_amount}, total=${quote.total_premium}`);
          }

          // Check explainability vector
          if (
            !Array.isArray(quote.algorithmic_explainability) ||
            quote.algorithmic_explainability.length !== 4 ||
            quote.algorithmic_explainability.some(s => !s.step || !s.description || !s.value)
          ) {
            allSuretyExplainabilityValid = false;
          }
        }
      }
    }
  }

  record(
    'Tier 2 Surety Quote',
    `GST formula across ${combinationsTested} parameter permutations`,
    allSuretyGstExact,
    allSuretyGstExact ? `100% of ${combinationsTested} cases satisfied Math.round(net * 0.18)` : 'GST mismatches detected'
  );
  record(
    'Tier 2 Surety Quote',
    'Total premium invariant (net + gst === total)',
    allSuretyTotalInvariant,
    allSuretyTotalInvariant ? '100% satisfied total_premium === net_premium + gst_amount' : 'Total premium mismatch detected'
  );
  record(
    'Tier 2 Surety Quote',
    'Algorithmic explainability vector integrity',
    allSuretyExplainabilityValid,
    allSuretyExplainabilityValid ? 'Vector contains 4 valid non-empty steps in 100% of cases' : 'Explainability invalid'
  );
}

// 2.2 Trade Credit Quote: GST and Invariant Tests Across Value Sweep
{
  let allTciGstExact = true;
  let allTciTotalInvariant = true;
  let allTciExplainabilityValid = true;

  const creditDays = [30, 60, 90, 120] as const;
  const concentrations = [10, 40, 60, 61, 75, 95];
  const turnoverValues = [1000, 54321, 1000000, 87654321, 500000000];

  let combinationsTested = 0;

  for (const average_credit_days of creditDays) {
    for (const top_10_buyers_turnover_share_percent of concentrations) {
      for (const insurable_turnover of turnoverValues) {
        combinationsTested++;
        const quote = calculateTradeCreditQuote({
          insurable_turnover,
          average_credit_days,
          top_10_buyers_turnover_share_percent,
          requested_indemnity_percent: 85,
        });

        const expectedGst = Math.round(quote.net_premium * 0.18);
        if (quote.gst_amount !== expectedGst) {
          allTciGstExact = false;
          console.error(`TCI GST MISMATCH at ${average_credit_days}d, share=${top_10_buyers_turnover_share_percent}%, TO=₹${insurable_turnover}`);
        }

        if (quote.total_premium !== quote.net_premium + quote.gst_amount) {
          allTciTotalInvariant = false;
          console.error(`TCI TOTAL INVARIANT FAILED: net=${quote.net_premium}, gst=${quote.gst_amount}, total=${quote.total_premium}`);
        }

        if (
          !Array.isArray(quote.algorithmic_explainability) ||
          quote.algorithmic_explainability.length !== 4 ||
          quote.algorithmic_explainability.some(s => !s.step || !s.description || !s.value)
        ) {
          allTciExplainabilityValid = false;
        }
      }
    }
  }

  record(
    'Tier 2 Trade Credit Quote',
    `GST formula across ${combinationsTested} parameter permutations`,
    allTciGstExact,
    allTciGstExact ? `100% of ${combinationsTested} cases satisfied Math.round(net * 0.18)` : 'GST mismatches detected'
  );
  record(
    'Tier 2 Trade Credit Quote',
    'Total premium invariant (net + gst === total)',
    allTciTotalInvariant,
    allTciTotalInvariant ? '100% satisfied total_premium === net_premium + gst_amount' : 'Total premium mismatch detected'
  );
  record(
    'Tier 2 Trade Credit Quote',
    'Algorithmic explainability vector integrity',
    allTciExplainabilityValid,
    allTciExplainabilityValid ? 'Vector contains 4 valid non-empty steps in 100% of cases' : 'Explainability invalid'
  );
}

// 2.3 Burglary Quote: GST and Invariant Tests Across Value Sweep
{
  let allBurglaryGstExact = true;
  let allBurglaryTotalInvariant = true;
  let allBurglaryExplainabilityValid = true;

  const firstLossPercentages = [25, 50, 75, 100] as const;
  const booleanCombos = [
    [false, false, false],
    [true, false, false],
    [false, true, false],
    [false, false, true],
    [true, true, false],
    [true, true, true],
  ];
  const propertyValues = [1000, 45678, 1000000, 25000000, 100000000];

  let combinationsTested = 0;

  for (const first_loss_percentage of firstLossPercentages) {
    for (const [has_cctv, has_247_security_guards, has_burglar_alarm] of booleanCombos) {
      for (const property_sum_insured of propertyValues) {
        combinationsTested++;
        const quote = calculateBurglaryQuote({
          property_sum_insured,
          first_loss_percentage,
          has_cctv,
          has_247_security_guards,
          has_burglar_alarm,
        });

        const expectedGst = Math.round(quote.net_premium * 0.18);
        if (quote.gst_amount !== expectedGst) {
          allBurglaryGstExact = false;
        }

        if (quote.total_premium !== quote.net_premium + quote.gst_amount) {
          allBurglaryTotalInvariant = false;
        }

        if (
          !Array.isArray(quote.algorithmic_explainability) ||
          quote.algorithmic_explainability.length !== 4 ||
          quote.algorithmic_explainability.some(s => !s.step || !s.description || !s.value)
        ) {
          allBurglaryExplainabilityValid = false;
        }
      }
    }
  }

  record(
    'Tier 2 Burglary Quote',
    `GST formula across ${combinationsTested} parameter permutations`,
    allBurglaryGstExact,
    allBurglaryGstExact ? `100% of ${combinationsTested} cases satisfied Math.round(net * 0.18)` : 'GST mismatches detected'
  );
  record(
    'Tier 2 Burglary Quote',
    'Total premium invariant (net + gst === total)',
    allBurglaryTotalInvariant,
    allBurglaryTotalInvariant ? '100% satisfied total_premium === net_premium + gst_amount' : 'Total premium mismatch detected'
  );
  record(
    'Tier 2 Burglary Quote',
    'Algorithmic explainability vector integrity',
    allBurglaryExplainabilityValid,
    allBurglaryExplainabilityValid ? 'Vector contains 4 valid non-empty steps in 100% of cases' : 'Explainability invalid'
  );
}

// 2.4 Multi-Line Specialty Package Quote Tests
{
  // Test 1: Single sublines inside package
  const pkgSuretyOnly = calculateSpecialtyPackageQuote({
    surety: {
      bond_type: 'bid_bond',
      bond_value: 10000000,
      tenure_months: 12,
      contractor_grade: 'AA',
      contractor_net_worth: 50000000,
    },
  });
  const expectedGst1 = Math.round(pkgSuretyOnly.net_premium * 0.18);
  record(
    'Specialty Package Quote',
    'Single-line package (Surety only)',
    pkgSuretyOnly.net_premium === 100000 &&
    pkgSuretyOnly.gst_amount === expectedGst1 &&
    pkgSuretyOnly.total_premium === pkgSuretyOnly.net_premium + expectedGst1 &&
    pkgSuretyOnly.line_specific_breakdown.lines_selected_count === 1 &&
    pkgSuretyOnly.algorithmic_explainability.length === 2, // Section 1 + Section 2 (Total)
    `net=${pkgSuretyOnly.net_premium}, gst=${pkgSuretyOnly.gst_amount}, total=${pkgSuretyOnly.total_premium}, steps=${pkgSuretyOnly.algorithmic_explainability.length}`
  );

  // Test 2: Two sublines (Surety + Trade Credit)
  const pkgTwo = calculateSpecialtyPackageQuote({
    surety: {
      bond_type: 'performance_bond',
      bond_value: 20000000,
      tenure_months: 12,
      contractor_grade: 'A',
      contractor_net_worth: 50000000,
    },
    trade_credit: {
      insurable_turnover: 100000000,
      average_credit_days: 90,
      top_10_buyers_turnover_share_percent: 50,
      requested_indemnity_percent: 90,
    },
  });
  // Surety: 20M * 1.5% * 1.25 = 375,000
  // TCI: 100M * 0.45% = 450,000
  // Total Net: 825,000
  const expectedGst2 = Math.round(825000 * 0.18);
  record(
    'Specialty Package Quote',
    'Two-line package (Surety + Trade Credit)',
    pkgTwo.net_premium === 825000 &&
    pkgTwo.gst_amount === expectedGst2 &&
    pkgTwo.total_premium === 825000 + expectedGst2 &&
    pkgTwo.line_specific_breakdown.lines_selected_count === 2 &&
    pkgTwo.algorithmic_explainability.length === 3,
    `net=${pkgTwo.net_premium}, gst=${pkgTwo.gst_amount}, total=${pkgTwo.total_premium}, steps=${pkgTwo.algorithmic_explainability.length}`
  );

  // Test 3: All three sublines together
  const pkgThree = calculateSpecialtyPackageQuote({
    surety: {
      bond_type: 'retention_money',
      bond_value: 15000000,
      tenure_months: 18,
      contractor_grade: 'BBB',
      contractor_net_worth: 20000000,
    },
    trade_credit: {
      insurable_turnover: 50000000,
      average_credit_days: 120,
      top_10_buyers_turnover_share_percent: 70, // +20% loading
      requested_indemnity_percent: 90,
    },
    burglary: {
      property_sum_insured: 30000000,
      first_loss_percentage: 25,
      has_cctv: true,
      has_247_security_guards: true,
      has_burglar_alarm: true,
    },
  });
  const expectedGst3 = Math.round(pkgThree.net_premium * 0.18);
  record(
    'Specialty Package Quote',
    'Three-line package (Surety + TCI + Burglary)',
    pkgThree.gst_amount === expectedGst3 &&
    pkgThree.total_premium === pkgThree.net_premium + expectedGst3 &&
    pkgThree.line_specific_breakdown.lines_selected_count === 3 &&
    pkgThree.algorithmic_explainability.length === 4,
    `net=${pkgThree.net_premium}, gst=${pkgThree.gst_amount}, total=${pkgThree.total_premium}, steps=${pkgThree.algorithmic_explainability.length}`
  );

  // Test 4: Empty package error
  let emptyPackageThrew = false;
  let emptyPackageErrorMsg = '';
  try {
    calculateSpecialtyPackageQuote({});
  } catch (err: any) {
    emptyPackageThrew = true;
    emptyPackageErrorMsg = err.message;
  }
  record(
    'Specialty Package Quote',
    'Empty package throws error',
    emptyPackageThrew && emptyPackageErrorMsg.includes('At least one specialty line must be selected'),
    `Threw correctly: "${emptyPackageErrorMsg}"`
  );
}

// 2.5 Audit of Explainability Content Fidelity
{
  const suretyQuote = calculateSuretyQuote({
    bond_type: 'performance_bond',
    bond_value: 10000000,
    tenure_months: 12,
    contractor_grade: 'AAA',
    contractor_net_worth: 5000000, // BREACH: 10M > 5M
  });
  const step3 = suretyQuote.algorithmic_explainability.find(s => s.step.includes('Step 3'));
  record(
    'Explainability Content Fidelity',
    'Surety capacity breach flagged in explainability step 3',
    step3 !== undefined && String(step3.description).includes('CAPACITY BREACH'),
    `Step 3 description: "${step3?.description}"`
  );

  const tciQuote = calculateTradeCreditQuote({
    insurable_turnover: 10000000,
    average_credit_days: 60,
    top_10_buyers_turnover_share_percent: 75, // Concentration > 60%
    requested_indemnity_percent: 95, // Clamp to 90%
  });
  const tciStep2 = tciQuote.algorithmic_explainability.find(s => s.step.includes('Step 2'));
  const tciStep3 = tciQuote.algorithmic_explainability.find(s => s.step.includes('Step 3'));
  record(
    'Explainability Content Fidelity',
    'TCI debtor concentration loading noted in explainability step 2',
    tciStep2 !== undefined && String(tciStep2.description).includes('concentration loading applied'),
    `Step 2: "${tciStep2?.description}"`
  );
  record(
    'Explainability Content Fidelity',
    'TCI statutory indemnity clamp noted in explainability step 3',
    tciStep3 !== undefined && String(tciStep3.value).includes('90%'),
    `Step 3 value: "${tciStep3?.value}"`
  );

  const burgQuote = calculateBurglaryQuote({
    property_sum_insured: 50000000,
    first_loss_percentage: 25,
    has_cctv: true,
    has_247_security_guards: true,
    has_burglar_alarm: true,
  });
  const burgStep3 = burgQuote.algorithmic_explainability.find(s => s.step.includes('Step 3'));
  record(
    'Explainability Content Fidelity',
    'Burglary discount cap noted in explainability step 3',
    burgStep3 !== undefined && String(burgStep3.value).includes('-20%'),
    `Step 3 value: "${burgStep3?.value}"`
  );
}

console.log('\n======================================================================');
console.log('CHALLENGE SUMMARY');
console.log('======================================================================');
const passedCount = results.filter(r => r.passed).length;
const totalCount = results.length;
console.log(`Passed: ${passedCount} / ${totalCount} (${Math.round((passedCount / totalCount) * 100)}%)`);

if (passedCount < totalCount) {
  console.log('\nDISCREPANCIES OBSERVED:');
  for (const r of results.filter(r => !r.passed)) {
    console.log(`- [${r.category}] ${r.name}: ${r.observation}`);
  }
}
