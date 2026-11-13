/**
 * Empirical Adversarial Challenger Test Suite: Milestone 16 Liability Insurance
 *
 * Comprehensive stress-testing, boundary analysis, invariant checking, and fuzzing for:
 * 1. StandardQuoteBreakdown Financial Contract (GST 18%, rounding, non-negative, integer invariants)
 * 2. 100-Run Seeded Pseudo-Random Parameter Fuzzing across all 5 sub-lines and unified package
 * 3. Exhaustive Multi-Line Package Combinations (1, 2, 3, 4, 5 lines, 31 non-empty subsets)
 * 4. Algorithmic Explainability & Statutory Clauses Completeness
 * 5. Floating-point Precision, Integer Rounding Stability & Extreme Range Boundaries
 * 6. Studio Package Validator Adversarial Fuzzing (Whitespace, NaN, undefined, negative turnover)
 */

import assert from 'node:assert';
import {
  calculateCglPremium,
  calculateProfessionalIndemnity,
  calculateDirectorsOfficersPremium,
  evaluateCyberPosture,
  calculateCommercialCrimePremium,
  validateLiabilityStudioPackage,
  calculateCglQuote,
  calculatePiQuote,
  calculateDoQuote,
  calculateCyberQuote,
  calculateCrimeQuote,
  calculateCorporateLiabilityQuote,
  CGL_HAZARD_RATES_PER_MILLE,
  CGL_LIMIT_RATIO_MULTIPLIERS,
  CGL_TERRITORY_MULTIPLIERS,
  PI_PROFESSION_RATES,
  DO_SIDE_RATES,
  DO_LISTING_MULTIPLIERS,
  CRIME_PER_HEAD_RATE,
  CRIME_LOI_RATE,
  CRIME_DUAL_AUTH_DISCOUNT_PERCENT,
  CRIME_SINGLE_SIGNOFF_LOADING_PERCENT,
  STATUTORY_GST_RATE,
  STATUTORY_LIABILITY_CLAUSES,
  CglInput,
  PiInput,
  DoInput,
  CyberPostureAnswers,
  CrimeFidelityInput,
  LiabilityStudioInput,
  CorporateLiabilityPackageInput,
} from '../liability-engine';
import { StandardQuoteBreakdown } from '@/types/database';

// Test counters and logging
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failureLog: Array<{ test: string; error: string; severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' }> = [];

function challenge(
  name: string,
  fn: () => void,
  options?: { expectBug?: boolean; severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'; bugDescription?: string }
) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ PASS: ${name}`);
  } catch (err: any) {
    failedTests++;
    const severity = options?.severity || 'HIGH';
    const msg = options?.bugDescription || err.message || String(err);
    console.error(`  ✗ FAIL [${severity}]: ${name}`);
    console.error(`         Reason: ${msg}`);
    failureLog.push({ test: name, error: msg, severity });
  }
}

// Seeded PRNG (Mulberry32) for 100% reproducible pseudo-random fuzzing
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function runAdversarialLiabilitySuite() {
  console.log('\n======================================================================');
  console.log('  EMPIRICAL ADVERSARIAL CHALLENGER SUITE: LIABILITY INSURANCE (M16)');
  console.log('======================================================================\n');

  // ============================================================================
  // SUITE 1: StandardQuoteBreakdown Financial Contract Invariants
  // ============================================================================
  console.log('--- Suite 1: StandardQuoteBreakdown Financial Contract Invariants ---');

  const verifyStandardBreakdownContract = (
    breakdown: StandardQuoteBreakdown,
    expectedLine: string,
    expectedSumInsured: number
  ) => {
    assert.strictEqual(breakdown.lob_category, 'liability', 'lob_category must be liability');
    assert.strictEqual(breakdown.insurance_line, expectedLine, `insurance_line must be ${expectedLine}`);
    assert.strictEqual(breakdown.sum_insured, expectedSumInsured, 'sum_insured must match');
    assert.strictEqual(Number.isInteger(breakdown.net_premium), true, 'net_premium must be integer');
    assert.strictEqual(breakdown.gst_rate_percent, 18, 'gst_rate_percent must be exactly 18');
    assert.strictEqual(
      breakdown.gst_amount,
      Math.round(breakdown.net_premium * 0.18),
      'gst_amount must be Math.round(net_premium * 0.18)'
    );
    assert.strictEqual(
      breakdown.total_premium,
      breakdown.net_premium + breakdown.gst_amount,
      'total_premium must strictly equal net_premium + gst_amount'
    );
    assert.strictEqual(Array.isArray(breakdown.statutory_clauses), true, 'statutory_clauses must be an array');
    assert.strictEqual(breakdown.statutory_clauses.length, 6, 'Must contain all 6 statutory clauses');

    // Mandatory clause checks
    const clausesText = breakdown.statutory_clauses.join(' ');
    assert.ok(clausesText.includes('Section 64VB of Insurance Act, 1938'), 'Must cite Section 64VB');
    assert.ok(clausesText.includes('Claims-Made Basis & Retroactive Date'), 'Must cite Claims-Made');
    assert.ok(clausesText.includes('Defense Costs & Legal Expenses'), 'Must cite Defense Costs');
    assert.ok(clausesText.includes('Digital Personal Data Protection Act (DPDPA), 2023'), 'Must cite DPDPA');
    assert.ok(clausesText.includes('IRDAI (Insurance Brokers) Regulations, 2018'), 'Must cite IRDAI Brokers Regs');
    assert.ok(clausesText.includes('Dual Authorization Internal Financial Controls'), 'Must cite Dual Authorization');

    // Algorithmic explainability checks
    assert.strictEqual(Array.isArray(breakdown.algorithmic_explainability), true, 'explainability must be array');
    assert.ok(breakdown.algorithmic_explainability.length >= 3, 'explainability must have at least 3 steps');
    for (const step of breakdown.algorithmic_explainability) {
      assert.ok(typeof step.step === 'string' && step.step.length > 0, 'step name required');
      assert.ok(typeof step.description === 'string' && step.description.length > 0, 'step description required');
      assert.ok(
        (typeof step.value === 'string' && step.value.length > 0) || typeof step.value === 'number',
        'step value required'
      );
    }
  };

  challenge('SQB-01: CGL StandardQuoteBreakdown contract verification', () => {
    const quote = calculateCglQuote({
      annual_turnover: 100_00_00_000,
      aoa_limit: 10_00_00_000,
      aoy_limit: 20_00_00_000,
      ratio: '1:2',
      hazard_category: 2,
      territory: 'worldwide_ex_usa',
    });
    verifyStandardBreakdownContract(quote, 'cgl', 20_00_00_000);
    assert.strictEqual(quote.line_specific_breakdown.sub_line, 'cgl');
  });

  challenge('SQB-02: PI StandardQuoteBreakdown contract verification', () => {
    const quote = calculatePiQuote({
      annual_fee_income: 15_00_00_000,
      limit_of_indemnity: 45_00_00_000,
      profession: 'insurance_broker',
      prior_clean_years: 3,
    });
    verifyStandardBreakdownContract(quote, 'pi', 45_00_00_000);
    assert.strictEqual(quote.line_specific_breakdown.sub_line, 'pi');
    assert.strictEqual(quote.line_specific_breakdown.statutory_minimum_met, true);
  });

  challenge('SQB-03: D&O StandardQuoteBreakdown contract verification', () => {
    const quote = calculateDoQuote({
      limit_of_indemnity: 50_00_00_000,
      entity_listing_status: 'public_listed_india',
      debt_to_equity_ratio: 3.5,
    });
    verifyStandardBreakdownContract(quote, 'do', 50_00_00_000);
    assert.strictEqual(quote.line_specific_breakdown.sub_line, 'do');
    assert.strictEqual(quote.line_specific_breakdown.financial_distress_loading_percent, 25);
  });

  challenge('SQB-04: Cyber (Mature Tier) StandardQuoteBreakdown contract verification', () => {
    const quote = calculateCyberQuote({
      base_premium: 500_000,
      limit_of_indemnity: 25_00_00_000,
      answers: {
        has_mfa_everywhere: true,
        has_edr_endpoints: true,
        has_airgapped_backups: true,
        has_annual_vapt: true,
        has_247_soc: true,
        has_employee_training: true,
      },
    });
    verifyStandardBreakdownContract(quote, 'cyber', 25_00_00_000);
    assert.strictEqual(quote.line_specific_breakdown.posture_tier, 'mature');
    assert.strictEqual(quote.line_specific_breakdown.rate_adjustment_percent, -20);
    assert.strictEqual(quote.net_premium, 400_000);
  });

  challenge('SQB-05: Cyber (Uninsurable Missing MFA) contract verification', () => {
    const quote = calculateCyberQuote({
      base_premium: 500_000,
      limit_of_indemnity: 25_00_00_000,
      answers: {
        has_mfa_everywhere: false, // Hard gate failure
        has_edr_endpoints: true,
        has_airgapped_backups: true,
        has_annual_vapt: true,
        has_247_soc: true,
        has_employee_training: true,
      },
    });
    verifyStandardBreakdownContract(quote, 'cyber', 25_00_00_000);
    assert.strictEqual(quote.line_specific_breakdown.posture_tier, 'uninsurable');
    assert.strictEqual(quote.line_specific_breakdown.can_issue_quote, false);
    assert.strictEqual(quote.net_premium, 0);
    assert.strictEqual(quote.gst_amount, 0);
    assert.strictEqual(quote.total_premium, 0);
  });

  challenge('SQB-06: Crime StandardQuoteBreakdown contract verification', () => {
    const quote = calculateCrimeQuote({
      employees_with_funds_access: 50,
      limit_of_liability: 10_00_00_000,
      has_dual_authorization_above_50k: true,
    });
    verifyStandardBreakdownContract(quote, 'crime', 10_00_00_000);
    assert.strictEqual(quote.line_specific_breakdown.sub_line, 'crime');
    assert.strictEqual(quote.line_specific_breakdown.per_head_premium, 12500);
    assert.strictEqual(quote.line_specific_breakdown.limit_premium, 500000);
  });

  challenge('SQB-07: Corporate Liability Multi-Line Package Quote contract verification', () => {
    const quote = calculateCorporateLiabilityQuote({
      corporate_name: 'Adani Enterprises Ltd',
      annual_turnover: 5000_00_00_000,
      opt_cgl: true,
      cgl: {
        annual_turnover: 5000_00_00_000,
        aoa_limit: 100_00_00_000,
        aoy_limit: 100_00_00_000,
        ratio: '1:1',
        hazard_category: 3,
        territory: 'india_only',
      },
      opt_do: true,
      do: {
        limit_of_indemnity: 100_00_00_000,
        entity_listing_status: 'public_listed_india',
        debt_to_equity_ratio: 2.1,
      },
      opt_cyber: true,
      cyber: {
        limit_of_indemnity: 50_00_00_000,
        base_premium: 2000000,
        answers: {
          has_mfa_everywhere: true,
          has_edr_endpoints: true,
          has_airgapped_backups: true,
          has_annual_vapt: true,
          has_247_soc: true,
          has_employee_training: false,
        },
      },
    });
    verifyStandardBreakdownContract(quote, 'liability_package', 250_00_00_000);
    assert.strictEqual(quote.line_specific_breakdown.sub_line, 'liability_package');
    assert.deepStrictEqual(quote.line_specific_breakdown.active_lines, ['CGL', 'D&O', 'Cyber']);
  });

  // ============================================================================
  // SUITE 2: 100-Run Seeded Pseudo-Random Parameter Fuzzing
  // ============================================================================
  console.log('\n--- Suite 2: 100-Run Seeded Pseudo-Random Parameter Fuzzing ---');

  challenge('FUZZ-100: 100 deterministic pseudo-random configurations verify GST 18% & integer rounding invariants', () => {
    const rand = mulberry32(1337); // Fixed seed for reproducible stress test
    const hazardKeys: Array<1 | 2 | 3 | 4> = [1, 2, 3, 4];
    const ratioKeys: Array<'1:1' | '1:2' | '1:3' | '1:4'> = ['1:1', '1:2', '1:3', '1:4'];
    const territoryKeys: Array<'india_only' | 'worldwide_ex_usa' | 'worldwide_inc_usa'> = [
      'india_only',
      'worldwide_ex_usa',
      'worldwide_inc_usa',
    ];
    const professionKeys: Array<'tech_software' | 'consultants_ca' | 'insurance_broker' | 'medical_doctor'> = [
      'tech_software',
      'consultants_ca',
      'insurance_broker',
      'medical_doctor',
    ];
    const listingKeys: Array<'private_unlisted' | 'public_listed_india' | 'public_listed_us_adr'> = [
      'private_unlisted',
      'public_listed_india',
      'public_listed_us_adr',
    ];

    for (let i = 0; i < 100; i++) {
      // 1. CGL Fuzzing
      const turnover = Math.floor(rand() * 100_000_000_000) + 1000;
      const aoyLimit = Math.floor(rand() * 50_000_000_000) + 1000;
      const aoaLimit = Math.floor(rand() * aoyLimit) + 1; // Always <= aoyLimit
      const hazard = hazardKeys[Math.floor(rand() * hazardKeys.length)];
      const ratio = ratioKeys[Math.floor(rand() * ratioKeys.length)];
      const territory = territoryKeys[Math.floor(rand() * territoryKeys.length)];

      const cglQuote = calculateCglQuote({
        annual_turnover: turnover,
        aoa_limit: aoaLimit,
        aoy_limit: aoyLimit,
        ratio,
        hazard_category: hazard,
        territory,
      });

      assert.strictEqual(Number.isInteger(cglQuote.net_premium), true, `CGL Run ${i}: net_premium must be integer`);
      assert.strictEqual(cglQuote.gst_rate_percent, 18, `CGL Run ${i}: gst_rate must be 18`);
      assert.strictEqual(
        cglQuote.gst_amount,
        Math.round(cglQuote.net_premium * 0.18),
        `CGL Run ${i}: gst_amount rounding mismatch`
      );
      assert.strictEqual(
        cglQuote.total_premium,
        cglQuote.net_premium + cglQuote.gst_amount,
        `CGL Run ${i}: total !== net + gst`
      );

      // 2. PI Fuzzing
      const feeIncome = Math.floor(rand() * 1_000_000_000) + 1000;
      const piLimit = Math.floor(rand() * 10_000_000_000) + 1000;
      const profession = professionKeys[Math.floor(rand() * professionKeys.length)];
      const priorYears = Math.floor(rand() * 15);

      const piQuote = calculatePiQuote({
        annual_fee_income: feeIncome,
        limit_of_indemnity: piLimit,
        profession,
        prior_clean_years: priorYears,
      });

      assert.strictEqual(Number.isInteger(piQuote.net_premium), true, `PI Run ${i}: net_premium must be integer`);
      assert.strictEqual(piQuote.gst_rate_percent, 18, `PI Run ${i}: gst_rate must be 18`);
      assert.strictEqual(
        piQuote.gst_amount,
        Math.round(piQuote.net_premium * 0.18),
        `PI Run ${i}: gst_amount rounding mismatch`
      );
      assert.strictEqual(
        piQuote.total_premium,
        piQuote.net_premium + piQuote.gst_amount,
        `PI Run ${i}: total !== net + gst`
      );

      // 3. D&O Fuzzing
      const doLimit = Math.floor(rand() * 20_000_000_000) + 1000;
      const listing = listingKeys[Math.floor(rand() * listingKeys.length)];
      const deRatio = rand() * 8.0;

      const doQuote = calculateDoQuote({
        limit_of_indemnity: doLimit,
        entity_listing_status: listing,
        debt_to_equity_ratio: deRatio,
      });

      assert.strictEqual(Number.isInteger(doQuote.net_premium), true, `D&O Run ${i}: net_premium must be integer`);
      assert.strictEqual(
        doQuote.gst_amount,
        Math.round(doQuote.net_premium * 0.18),
        `D&O Run ${i}: gst_amount rounding mismatch`
      );
      assert.strictEqual(
        doQuote.total_premium,
        doQuote.net_premium + doQuote.gst_amount,
        `D&O Run ${i}: total !== net + gst`
      );

      // 4. Cyber Fuzzing
      const cyberBase = Math.floor(rand() * 10_000_000) + 5000;
      const cyberLimit = Math.floor(rand() * 50_000_000_000) + 1000;
      const cyberAnswers: CyberPostureAnswers = {
        has_mfa_everywhere: rand() > 0.3,
        has_edr_endpoints: rand() > 0.4,
        has_airgapped_backups: rand() > 0.4,
        has_annual_vapt: rand() > 0.5,
        has_247_soc: rand() > 0.5,
        has_employee_training: rand() > 0.3,
      };

      const cyberQuote = calculateCyberQuote({
        base_premium: cyberBase,
        limit_of_indemnity: cyberLimit,
        answers: cyberAnswers,
      });

      assert.strictEqual(Number.isInteger(cyberQuote.net_premium), true, `Cyber Run ${i}: net_premium must be integer`);
      assert.strictEqual(
        cyberQuote.gst_amount,
        Math.round(cyberQuote.net_premium * 0.18),
        `Cyber Run ${i}: gst_amount rounding mismatch`
      );
      assert.strictEqual(
        cyberQuote.total_premium,
        cyberQuote.net_premium + cyberQuote.gst_amount,
        `Cyber Run ${i}: total !== net + gst`
      );

      // 5. Crime Fuzzing
      const employees = Math.floor(rand() * 10_000);
      const crimeLimit = Math.floor(rand() * 5_000_000_000) + 1000;
      const dualAuth = rand() > 0.5;

      const crimeQuote = calculateCrimeQuote({
        employees_with_funds_access: employees,
        limit_of_liability: crimeLimit,
        has_dual_authorization_above_50k: dualAuth,
      });

      assert.strictEqual(Number.isInteger(crimeQuote.net_premium), true, `Crime Run ${i}: net_premium must be integer`);
      assert.strictEqual(
        crimeQuote.gst_amount,
        Math.round(crimeQuote.net_premium * 0.18),
        `Crime Run ${i}: gst_amount rounding mismatch`
      );
      assert.strictEqual(
        crimeQuote.total_premium,
        crimeQuote.net_premium + crimeQuote.gst_amount,
        `Crime Run ${i}: total !== net + gst`
      );
    }
  });

  // ============================================================================
  // SUITE 3: Multi-Line Package Stress Testing (All 31 Combinations of 1..5 Lines)
  // ============================================================================
  console.log('\n--- Suite 3: Multi-Line Package Stress Testing (All 31 Combinations) ---');

  const baseCgl: CglInput = {
    annual_turnover: 200_00_00_000,
    aoa_limit: 10_00_00_000,
    aoy_limit: 20_00_00_000,
    ratio: '1:2',
    hazard_category: 1,
    territory: 'india_only',
  };
  const basePi: PiInput = {
    annual_fee_income: 10_00_00_000,
    limit_of_indemnity: 30_00_00_000,
    profession: 'tech_software',
    prior_clean_years: 2,
  };
  const baseDo: DoInput = {
    limit_of_indemnity: 25_00_00_000,
    entity_listing_status: 'private_unlisted',
    debt_to_equity_ratio: 1.5,
  };
  const baseCyber = {
    limit_of_indemnity: 15_00_00_000,
    base_premium: 1000000,
    answers: {
      has_mfa_everywhere: true,
      has_edr_endpoints: true,
      has_airgapped_backups: true,
      has_annual_vapt: true,
      has_247_soc: true,
      has_employee_training: true,
    },
  };
  const baseCrime: CrimeFidelityInput = {
    employees_with_funds_access: 20,
    limit_of_liability: 5_00_00_000,
    has_dual_authorization_above_50k: true,
  };

  const expectedStandalone = {
    cgl: calculateCglPremium(baseCgl).net_cgl_premium,
    pi: calculateProfessionalIndemnity(basePi).net_pi_premium,
    do: calculateDirectorsOfficersPremium(baseDo).net_do_premium,
    cyber: evaluateCyberPosture(baseCyber.answers, baseCyber.base_premium).final_cyber_premium,
    crime: calculateCommercialCrimePremium(baseCrime).net_crime_premium,
  };

  const limits = {
    cgl: baseCgl.aoy_limit,
    pi: basePi.limit_of_indemnity,
    do: baseDo.limit_of_indemnity,
    cyber: baseCyber.limit_of_indemnity,
    crime: baseCrime.limit_of_liability,
  };

  challenge('PKG-01: Exhaustive combinatorial test across all 31 non-empty subsets of 5 lines', () => {
    let testedCount = 0;

    for (let mask = 1; mask < 32; mask++) {
      const opt_cgl = (mask & 1) !== 0;
      const opt_pi = (mask & 2) !== 0;
      const opt_do = (mask & 4) !== 0;
      const opt_cyber = (mask & 8) !== 0;
      const opt_crime = (mask & 16) !== 0;

      const pkgInput: CorporateLiabilityPackageInput = {
        corporate_name: `Combo Corp Mask ${mask}`,
        annual_turnover: 500_00_00_000,
        opt_cgl,
        cgl: opt_cgl ? baseCgl : undefined,
        opt_pi,
        pi: opt_pi ? basePi : undefined,
        opt_do,
        do: opt_do ? baseDo : undefined,
        opt_cyber,
        cyber: opt_cyber ? baseCyber : undefined,
        opt_crime,
        crime: opt_crime ? baseCrime : undefined,
      };

      const result = calculateCorporateLiabilityQuote(pkgInput);

      let expectedNet = 0;
      let expectedLimit = 0;
      const expectedLines: string[] = [];

      if (opt_cgl) {
        expectedNet += expectedStandalone.cgl;
        expectedLimit += limits.cgl;
        expectedLines.push('CGL');
      }
      if (opt_pi) {
        expectedNet += expectedStandalone.pi;
        expectedLimit += limits.pi;
        expectedLines.push('PI');
      }
      if (opt_do) {
        expectedNet += expectedStandalone.do;
        expectedLimit += limits.do;
        expectedLines.push('D&O');
      }
      if (opt_cyber) {
        expectedNet += expectedStandalone.cyber;
        expectedLimit += limits.cyber;
        expectedLines.push('Cyber');
      }
      if (opt_crime) {
        expectedNet += expectedStandalone.crime;
        expectedLimit += limits.crime;
        expectedLines.push('Crime');
      }

      assert.strictEqual(result.net_premium, expectedNet, `Mask ${mask}: net_premium mismatch`);
      assert.strictEqual(result.sum_insured, expectedLimit, `Mask ${mask}: sum_insured mismatch`);
      assert.strictEqual(result.gst_amount, Math.round(expectedNet * 0.18), `Mask ${mask}: gst_amount mismatch`);
      assert.strictEqual(result.total_premium, expectedNet + result.gst_amount, `Mask ${mask}: total mismatch`);
      assert.deepStrictEqual(
        result.line_specific_breakdown.active_lines,
        expectedLines,
        `Mask ${mask}: active lines mismatch`
      );

      testedCount++;
    }

    assert.strictEqual(testedCount, 31, 'Exactly 31 package combinations must be evaluated');
  });

  challenge('PKG-02: Package quote throws when 0 lines are enabled (mask 0)', () => {
    assert.throws(
      () => {
        calculateCorporateLiabilityQuote({
          corporate_name: 'Empty Corp',
          annual_turnover: 10_00_00_000,
          opt_cgl: false,
          opt_pi: false,
          opt_do: false,
          opt_cyber: false,
          opt_crime: false,
        });
      },
      /Select at least one liability line/,
      'Must throw when no lines selected'
    );
  });

  challenge('PKG-03: Package quote ignores enabled flags when corresponding object is undefined', () => {
    // opt_cgl is true, but cgl object is undefined => effectively 0 valid lines
    assert.throws(
      () => {
        calculateCorporateLiabilityQuote({
          corporate_name: 'Mismatched Corp',
          annual_turnover: 10_00_00_000,
          opt_cgl: true,
          cgl: undefined,
        });
      },
      /Select at least one liability line/,
      'Must throw when enabled line has no config object'
    );
  });

  challenge('PKG-04: Package quote throws when corporate_name is empty string', () => {
    assert.throws(
      () => {
        calculateCorporateLiabilityQuote({
          corporate_name: '',
          annual_turnover: 10_00_00_000,
          opt_cgl: true,
          cgl: baseCgl,
        });
      },
      /Corporate name is required/,
      'Must require corporate name'
    );
  });

  challenge('PKG-05: Package quote throws when turnover is 0 or negative', () => {
    assert.throws(
      () => {
        calculateCorporateLiabilityQuote({
          corporate_name: 'Zero Corp',
          annual_turnover: 0,
          opt_cgl: true,
          cgl: baseCgl,
        });
      },
      /Annual turnover must be positive/,
      'Must reject 0 turnover'
    );

    assert.throws(
      () => {
        calculateCorporateLiabilityQuote({
          corporate_name: 'Negative Corp',
          annual_turnover: -50000,
          opt_cgl: true,
          cgl: baseCgl,
        });
      },
      /Annual turnover must be positive/,
      'Must reject negative turnover'
    );
  });

  // ============================================================================
  // SUITE 4: Boundary & Numerical Stability Testing
  // ============================================================================
  console.log('\n--- Suite 4: Boundary & Numerical Stability Testing ---');

  challenge('BOUND-01: Extremely large turnover and limits (₹100,000 Cr) stay within safe integer bounds', () => {
    const hugeTurnover = 100_000_00_00_000; // ₹1 Lakh Crore
    const hugeLimit = 10_000_00_00_000; // ₹10,000 Crore

    const cgl = calculateCglPremium({
      annual_turnover: hugeTurnover,
      aoa_limit: hugeLimit,
      aoy_limit: hugeLimit,
      ratio: '1:1',
      hazard_category: 4, // 2.50‰
      territory: 'worldwide_inc_usa', // 2.5x
    });

    // gross = (100_000_00_00_000 * 2.5) / 1000 = 2,500,000,000
    // net = 2,500,000,000 * 1.0 * 2.5 = 6,250,000,000
    assert.strictEqual(cgl.net_cgl_premium, 6_250_000_000);
    assert.ok(Number.isSafeInteger(cgl.net_cgl_premium));

    const quote = calculateCglQuote({
      annual_turnover: hugeTurnover,
      aoa_limit: hugeLimit,
      aoy_limit: hugeLimit,
      ratio: '1:1',
      hazard_category: 4,
      territory: 'worldwide_inc_usa',
    });

    assert.strictEqual(quote.gst_amount, Math.round(6_250_000_000 * 0.18));
    assert.strictEqual(quote.total_premium, 6_250_000_000 + quote.gst_amount);
  });

  challenge('BOUND-02: Micro values (₹1 turnover / limit) produce consistent zero/micro integers', () => {
    const cgl = calculateCglPremium({
      annual_turnover: 1,
      aoa_limit: 1,
      aoy_limit: 1,
      ratio: '1:1',
      hazard_category: 1,
      territory: 'india_only',
    });
    assert.strictEqual(cgl.gross_cgl_premium, 0);
    assert.strictEqual(cgl.net_cgl_premium, 0);

    const pi = calculateProfessionalIndemnity({
      annual_fee_income: 1,
      limit_of_indemnity: 1,
      profession: 'tech_software',
      prior_clean_years: 0,
    });
    assert.strictEqual(pi.base_pi_premium, 0);
    assert.strictEqual(pi.net_pi_premium, 0);
  });

  challenge('BOUND-03: CGL AOA > AOY strictly throws exact error', () => {
    assert.throws(
      () => {
        calculateCglPremium({
          annual_turnover: 10_00_00_000,
          aoa_limit: 20_00_00_000, // Invalid: AOA > AOY
          aoy_limit: 10_00_00_000,
          ratio: '1:1',
          hazard_category: 1,
          territory: 'india_only',
        });
      },
      /Any One Accident \(AOA\) limit cannot exceed Any One Year \(AOY\) aggregate limit/,
      'Must strictly enforce AOA <= AOY'
    );
  });

  challenge('BOUND-04: D&O D/E ratio threshold boundary (3.0 vs 3.0001)', () => {
    const atBoundary = calculateDirectorsOfficersPremium({
      limit_of_indemnity: 10_00_00_000,
      entity_listing_status: 'private_unlisted',
      debt_to_equity_ratio: 3.0, // <= 3.0: 0% loading
    });
    assert.strictEqual(atBoundary.financial_distress_loading_percent, 0);
    // Base: 10Cr * (0.0040 + 0.0035 + 0.0050) = 10Cr * 0.0125 = 1,250,000
    assert.strictEqual(atBoundary.net_do_premium, 1250000);

    const aboveBoundary = calculateDirectorsOfficersPremium({
      limit_of_indemnity: 10_00_00_000,
      entity_listing_status: 'private_unlisted',
      debt_to_equity_ratio: 3.0001, // > 3.0: +25% loading
    });
    assert.strictEqual(aboveBoundary.financial_distress_loading_percent, 25);
    // Net: 1,250,000 * 1.25 = 1,562,500
    assert.strictEqual(aboveBoundary.net_do_premium, 1562500);
  });

  challenge('BOUND-05: Cyber Posture Scoring Score Boundaries (45 vs 50, 69 vs 70, 84 vs 85)', () => {
    const base = 100_000;

    // Score 45 (MFA 25 + EDR 20) -> Score < 50 => UNINSURABLE
    const s45 = evaluateCyberPosture(
      {
        has_mfa_everywhere: true,
        has_edr_endpoints: true,
        has_airgapped_backups: false,
        has_annual_vapt: false,
        has_247_soc: false,
        has_employee_training: false,
      },
      base
    );
    assert.strictEqual(s45.score, 45);
    assert.strictEqual(s45.posture_tier, 'uninsurable');
    assert.strictEqual(s45.final_cyber_premium, 0);
    assert.strictEqual(s45.can_issue_quote, false);

    // Score 50 (MFA 25 + VAPT 15 + Training 10) -> Score 50..69 => DEFICIENT (+30%)
    const s50 = evaluateCyberPosture(
      {
        has_mfa_everywhere: true,
        has_edr_endpoints: false,
        has_airgapped_backups: false,
        has_annual_vapt: true,
        has_247_soc: false,
        has_employee_training: true,
      },
      base
    );
    assert.strictEqual(s50.score, 50);
    assert.strictEqual(s50.posture_tier, 'deficient');
    assert.strictEqual(s50.rate_adjustment_percent, 30);
    assert.strictEqual(s50.final_cyber_premium, 130000);
    assert.strictEqual(s50.can_issue_quote, true);

    // Score 65 (MFA 25 + EDR 20 + Backups 20) -> Score 65 => DEFICIENT (+30%)
    const s65 = evaluateCyberPosture(
      {
        has_mfa_everywhere: true,
        has_edr_endpoints: true,
        has_airgapped_backups: true,
        has_annual_vapt: false,
        has_247_soc: false,
        has_employee_training: false,
      },
      base
    );
    assert.strictEqual(s65.score, 65);
    assert.strictEqual(s65.posture_tier, 'deficient');
    assert.strictEqual(s65.rate_adjustment_percent, 30);

    // Score 70 (MFA 25 + Backups 20 + VAPT 15 + SOC 10) -> Score 70..84 => ADEQUATE (0%)
    const s70 = evaluateCyberPosture(
      {
        has_mfa_everywhere: true,
        has_edr_endpoints: false,
        has_airgapped_backups: true,
        has_annual_vapt: true,
        has_247_soc: true,
        has_employee_training: false,
      },
      base
    );
    assert.strictEqual(s70.score, 70);
    assert.strictEqual(s70.posture_tier, 'adequate');
    assert.strictEqual(s70.rate_adjustment_percent, 0);
    assert.strictEqual(s70.final_cyber_premium, 100000);

    // Score 85 (MFA 25 + EDR 20 + Backups 20 + SOC 10 + Training 10) -> Score >= 85 => MATURE (-20%)
    const s85 = evaluateCyberPosture(
      {
        has_mfa_everywhere: true,
        has_edr_endpoints: true,
        has_airgapped_backups: true,
        has_annual_vapt: false,
        has_247_soc: true,
        has_employee_training: true,
      },
      base
    );
    assert.strictEqual(s85.score, 85);
    assert.strictEqual(s85.posture_tier, 'mature');
    assert.strictEqual(s85.rate_adjustment_percent, -20);
    assert.strictEqual(s85.final_cyber_premium, 80000);
  });

  challenge('BOUND-06: PI Retroactive clean years capping (0% up to 50% max at 5+ years)', () => {
    const calc = (years: number) =>
      calculateProfessionalIndemnity({
        annual_fee_income: 10_000_000,
        limit_of_indemnity: 10_000_000,
        profession: 'tech_software',
        prior_clean_years: years,
      });

    assert.strictEqual(calc(0).retroactive_loading_percent, 0);
    assert.strictEqual(calc(1).retroactive_loading_percent, 10);
    assert.strictEqual(calc(2).retroactive_loading_percent, 20);
    assert.strictEqual(calc(3).retroactive_loading_percent, 30);
    assert.strictEqual(calc(4).retroactive_loading_percent, 40);
    assert.strictEqual(calc(5).retroactive_loading_percent, 50);
    assert.strictEqual(calc(6).retroactive_loading_percent, 50); // Capped at 50%
    assert.strictEqual(calc(20).retroactive_loading_percent, 50); // Capped at 50%
  });

  // ============================================================================
  // SUITE 5: Adversarial Probing & Failure Mode Analysis (The Challenger Findings)
  // ============================================================================
  console.log('\n--- Suite 5: Adversarial Probing & Failure Mode Analysis ---');

  challenge(
    'VULN-01: Studio Package Validator: Whitespace-only corporate name bypasses validation',
    () => {
      const res = validateLiabilityStudioPackage({
        corporate_name: '    ', // Only spaces
        turnover: 10_00_000,
        opt_cgl: true,
        opt_cyber: false,
        opt_do: false,
        opt_crime: false,
      });
      // A robust validator MUST reject whitespace-only corporate name
      assert.strictEqual(
        res.is_valid,
        false,
        'Whitespace-only corporate name must be rejected as invalid (lacks .trim() check)'
      );
    },
    {
      severity: 'HIGH',
      bugDescription: 'validateLiabilityStudioPackage accepts whitespace-only corporate name ("   ") because !input.corporate_name does not check .trim()',
    }
  );

  challenge(
    'VULN-02: Studio Package Validator: NaN turnover bypasses validation',
    () => {
      const res = validateLiabilityStudioPackage({
        corporate_name: 'Legit Corp',
        turnover: NaN, // NaN <= 0 is false in JavaScript!
        opt_cgl: true,
        opt_cyber: false,
        opt_do: false,
        opt_crime: false,
      });
      // A robust validator MUST reject NaN turnover
      assert.strictEqual(
        res.is_valid,
        false,
        'NaN turnover must be rejected as invalid (NaN <= 0 evaluates to false in JS)'
      );
    },
    {
      severity: 'HIGH',
      bugDescription: 'validateLiabilityStudioPackage accepts NaN turnover because (NaN <= 0) is false in JavaScript, bypassing positive turnover validation',
    }
  );

  challenge(
    'VULN-03: Studio Package Validator: undefined turnover bypasses validation',
    () => {
      const res = validateLiabilityStudioPackage({
        corporate_name: 'Legit Corp',
        turnover: undefined as any, // undefined <= 0 is false in JavaScript!
        opt_cgl: true,
        opt_cyber: false,
        opt_do: false,
        opt_crime: false,
      });
      assert.strictEqual(
        res.is_valid,
        false,
        'undefined turnover must be rejected as invalid (undefined <= 0 evaluates to false in JS)'
      );
    },
    {
      severity: 'HIGH',
      bugDescription: 'validateLiabilityStudioPackage accepts undefined turnover because (undefined <= 0) evaluates to false in JS',
    }
  );

  challenge(
    'VULN-04: Package Quote: NaN annual_turnover propagates NaN to premiums without throwing',
    () => {
      let threw = false;
      try {
        const quote = calculateCorporateLiabilityQuote({
          corporate_name: 'Faulty Corp',
          annual_turnover: NaN,
          opt_cgl: true,
          cgl: {
            annual_turnover: NaN,
            aoa_limit: 1000,
            aoy_limit: 1000,
            ratio: '1:1',
            hazard_category: 1,
            territory: 'india_only',
          },
        });
        if (isNaN(quote.net_premium)) {
          threw = false;
        }
      } catch (e) {
        threw = true;
      }
      assert.strictEqual(
        threw,
        true,
        'calculateCorporateLiabilityQuote must throw an error when annual_turnover is NaN instead of propagating NaN premiums'
      );
    },
    {
      severity: 'MEDIUM',
      bugDescription: 'calculateCorporateLiabilityQuote allows NaN annual_turnover because (NaN <= 0) is false, generating NaN premium breakdown without throwing',
    }
  );

  challenge(
    'VULN-05: PI Engine: Negative prior clean years produces negative loading (unauthorized discount)',
    () => {
      const res = calculateProfessionalIndemnity({
        annual_fee_income: 10_000_000,
        limit_of_indemnity: 10_000_000,
        profession: 'tech_software',
        prior_clean_years: -3, // Adversarial negative value
      });
      // Math.min(50, -3 * 10) produces -30%, giving a 30% DISCOUNT instead of 0% or error
      assert.ok(
        res.retroactive_loading_percent >= 0,
        `Negative clean years must not produce negative loading discount (got ${res.retroactive_loading_percent}%)`
      );
    },
    {
      severity: 'MEDIUM',
      bugDescription: 'calculateProfessionalIndemnity computes Math.min(50, prior_clean_years * 10) without Math.max(0, ...), granting unauthorized discounts for negative clean years',
    }
  );

  challenge('VULN-06: Studio Package Validator: Null input crashes with unhandled TypeError', () => {
    let threwTypeError = false;
    try {
      validateLiabilityStudioPackage(null as any);
    } catch (e: any) {
      if (e instanceof TypeError) threwTypeError = true;
    }
    // A production validator should either safely return { is_valid: false } or throw a structured error
    assert.strictEqual(
      threwTypeError,
      true,
      'Documented finding: null input triggers unhandled TypeError: Cannot read properties of null'
    );
  });

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('\n======================================================================');
  console.log(`  EXECUTION SUMMARY: ${passedTests}/${totalTests} Passed (${((passedTests / totalTests) * 100).toFixed(1)}%)`);
  console.log(`  EMPIRICAL BUGS / VULNERABILITIES DETECTED: ${failedTests}`);
  if (failedTests > 0) {
    console.log('\n  DETECTED CHALLENGE FAILURES (EVIDENCE CHAIN):');
    failureLog.forEach((f, idx) => {
      console.log(`    ${idx + 1}. [${f.severity}] ${f.test}`);
      console.log(`       Evidence: ${f.error}`);
    });
  }
  console.log('======================================================================\n');
}

// Auto-run if invoked directly
runAdversarialLiabilitySuite();
