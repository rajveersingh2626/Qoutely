/**
 * Exhaustive Standalone Adversarial Test Suite for Corporate Liability Engine
 *
 * Stress-tests and challenges:
 * 1. CGL Extremes, Invariants & Boundaries (AOA > AOY error, AOA == AOY, ratio discounts, territories, zero & mega turnover)
 * 2. Professional Indemnity & IRDAI Broker Minimum LOI Boundaries (fee income transition at 50L/3x, clean years capping)
 * 3. Directors & Officers (D&O) Debt-to-Equity Thresholds (<= 3.0 vs > 3.0, negative D/E net cash)
 * 4. Cyber Posture Scoring Matrix: Complete 64 ($2^6$) Combinations Exhaustive Truth Table Verification
 * 5. Commercial Crime & Employee Fidelity Internal Controls (-15% vs +25%)
 * 6. Corporate Liability Studio Package Validation and Multi-Line Aggregation
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
  CglInput,
  PiInput,
  DoInput,
  CyberPostureAnswers,
  CrimeFidelityInput,
  LiabilityStudioInput,
  CorporateLiabilityPackageInput,
} from '../liability-engine';

let totalTests = 0;
let passedTests = 0;

function runAdvTest(name: string, fn: () => void) {
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
console.log('  RUNNING: Liability Engine ADVERSARIAL Stress & Challenge Suite');
console.log('======================================================================\n');

// ============================================================================
// 1. CGL EXTREMES, INVARIANTS & BOUNDARIES
// ============================================================================
console.log('--- Section 1: CGL Extremes, Invariants & Boundaries ---');

runAdvTest('ADV-CGL-01: AOA > AOY strictly throws exact error for boundary + 1', () => {
  const boundaryPlusOne: CglInput = {
    annual_turnover: 100_00_00_000,
    aoa_limit: 10_00_00_001, // AOY + 1
    aoy_limit: 10_00_00_000,
    ratio: '1:1',
    hazard_category: 1,
    territory: 'india_only',
  };

  assert.throws(
    () => calculateCglPremium(boundaryPlusOne),
    {
      name: 'Error',
      message: 'Any One Accident (AOA) limit cannot exceed Any One Year (AOY) aggregate limit',
    }
  );
});

runAdvTest('ADV-CGL-02: AOA > AOY throws exact error for massive violation', () => {
  const massiveViolation: CglInput = {
    annual_turnover: 50_00_00_000,
    aoa_limit: 500_00_00_000,
    aoy_limit: 10_00_00_000,
    ratio: '1:1',
    hazard_category: 3,
    territory: 'worldwide_inc_usa',
  };

  assert.throws(
    () => calculateCglPremium(massiveViolation),
    (err: any) => err.message === 'Any One Accident (AOA) limit cannot exceed Any One Year (AOY) aggregate limit'
  );
});

runAdvTest('ADV-CGL-03: AOA == AOY (1:1 ratio) boundary succeeds with 0% discount', () => {
  const exactEqual: CglInput = {
    annual_turnover: 10_00_00_000, // ₹10 Cr
    aoa_limit: 5_00_00_000,
    aoy_limit: 5_00_00_000,
    ratio: '1:1',
    hazard_category: 2, // 0.60‰ => gross = 60,000
    territory: 'india_only',
  };

  const res = calculateCglPremium(exactEqual);
  assert.strictEqual(res.ratio_discount_percent, 0);
  assert.strictEqual(res.gross_cgl_premium, 60000);
  assert.strictEqual(res.net_cgl_premium, 60000);
});

runAdvTest('ADV-CGL-04: Full matrix of limit ratio discounts (1:1=0%, 1:2=15%, 1:3=22%, 1:4=28%)', () => {
  const turnover = 100_00_00_000; // ₹100 Cr
  // Cat 4: 2.50‰ => gross = 2,500,000
  const grossExpected = 2500000;

  const ratios: Array<{ ratio: '1:1' | '1:2' | '1:3' | '1:4'; disc: number; mult: number }> = [
    { ratio: '1:1', disc: 0, mult: 1.00 },
    { ratio: '1:2', disc: 15, mult: 0.85 },
    { ratio: '1:3', disc: 22, mult: 0.78 },
    { ratio: '1:4', disc: 28, mult: 0.72 },
  ];

  for (const r of ratios) {
    const res = calculateCglPremium({
      annual_turnover: turnover,
      aoa_limit: 10_00_00_000,
      aoy_limit: 40_00_00_000,
      ratio: r.ratio,
      hazard_category: 4,
      territory: 'india_only',
    });
    assert.strictEqual(res.ratio_discount_percent, r.disc);
    const expectedNet = Math.round(grossExpected * r.mult);
    assert.strictEqual(res.net_cgl_premium, expectedNet);
  }
});

runAdvTest('ADV-CGL-05: Territorial multipliers across all 3 jurisdictions', () => {
  const baseInput: Omit<CglInput, 'territory'> = {
    annual_turnover: 80_00_00_000, // ₹80 Cr
    aoa_limit: 5_00_00_000,
    aoy_limit: 20_00_00_000,
    ratio: '1:4', // 0.72x
    hazard_category: 1, // 0.30‰ => gross = 240,000; 1:4 net = 172,800
  };

  const territories: Array<{ territory: 'india_only' | 'worldwide_ex_usa' | 'worldwide_inc_usa'; mult: number }> = [
    { territory: 'india_only', mult: 1.00 },
    { territory: 'worldwide_ex_usa', mult: 1.50 },
    { territory: 'worldwide_inc_usa', mult: 2.50 },
  ];

  for (const t of territories) {
    const res = calculateCglPremium({ ...baseInput, territory: t.territory });
    assert.strictEqual(res.territory_multiplier, t.mult);
    const expectedNet = Math.round(240000 * 0.72 * t.mult);
    assert.strictEqual(res.net_cgl_premium, expectedNet);
  }
});

runAdvTest('ADV-CGL-06: Zero turnover produces 0 gross and 0 net across all territories without crash', () => {
  for (const terr of ['india_only', 'worldwide_ex_usa', 'worldwide_inc_usa'] as const) {
    const res = calculateCglPremium({
      annual_turnover: 0,
      aoa_limit: 10_00_000,
      aoy_limit: 20_00_000,
      ratio: '1:2',
      hazard_category: 3,
      territory: terr,
    });
    assert.strictEqual(res.gross_cgl_premium, 0);
    assert.strictEqual(res.net_cgl_premium, 0);
  }
});

runAdvTest('ADV-CGL-07: Mega turnover ₹10,000 Cr preserves 64-bit float precision', () => {
  const megaTurnover = 10000_00_00_000; // 100 Billion INR
  // Hazard 4 (2.50‰) -> gross = (100,000,000,000 * 2.5) / 1000 = 250,000,000 (₹25 Cr)
  // Ratio 1:4 (0.72)
  // Worldwide inc USA (2.5x)
  // Net = 250,000,000 * 0.72 * 2.5 = 450,000,000 (₹45 Cr)
  const res = calculateCglPremium({
    annual_turnover: megaTurnover,
    aoa_limit: 100_00_00_000,
    aoy_limit: 400_00_00_000,
    ratio: '1:4',
    hazard_category: 4,
    territory: 'worldwide_inc_usa',
  });

  assert.strictEqual(res.gross_cgl_premium, 250000000);
  assert.strictEqual(res.net_cgl_premium, 450000000);

  const quote = calculateCglQuote({
    annual_turnover: megaTurnover,
    aoa_limit: 100_00_00_000,
    aoy_limit: 400_00_00_000,
    ratio: '1:4',
    hazard_category: 4,
    territory: 'worldwide_inc_usa',
  });

  assert.strictEqual(quote.net_premium, 450000000);
  assert.strictEqual(quote.gst_amount, Math.round(450000000 * 0.18)); // 81,000,000
  assert.strictEqual(quote.total_premium, 531000000);
});

// ============================================================================
// 2. PROFESSIONAL INDEMNITY & IRDAI BROKER MINIMUM BOUNDARY
// ============================================================================
console.log('\n--- Section 2: Professional Indemnity & IRDAI Broker Minimum ---');

runAdvTest('ADV-PI-01: Profession base rates exact mathematical verification', () => {
  const loi = 10_00_00_000; // ₹10 Cr
  const rates = [
    { prof: 'tech_software' as const, rate: 0.0085, expected: 850000 },
    { prof: 'consultants_ca' as const, rate: 0.0120, expected: 1200000 },
    { prof: 'insurance_broker' as const, rate: 0.0150, expected: 1500000 },
    { prof: 'medical_doctor' as const, rate: 0.0200, expected: 2000000 },
  ];

  for (const item of rates) {
    const res = calculateProfessionalIndemnity({
      annual_fee_income: 5_00_00_000,
      limit_of_indemnity: loi,
      profession: item.prof,
      prior_clean_years: 0,
    });
    assert.strictEqual(res.base_pi_premium, item.expected);
    assert.strictEqual(res.net_pi_premium, item.expected);
  }
});

runAdvTest('ADV-PI-02: IRDAI Broker boundary where 3x fee < 50L (Floor is 50L)', () => {
  // fee_income = 16,66,666 -> 3 * 16,66,666 = 4,999,998 (< 50,00,000).
  // Floor is 50,00,000.
  const feeIncome = 16_66_666;

  // LOI = 49,99,999 (boundary - 1) -> Deficient
  const belowFloor = calculateProfessionalIndemnity({
    annual_fee_income: feeIncome,
    limit_of_indemnity: 49_99_999,
    profession: 'insurance_broker',
    prior_clean_years: 0,
  });
  assert.strictEqual(belowFloor.statutory_minimum_met, false);

  // LOI = 50,00,000 (exact floor) -> Compliant
  const exactFloor = calculateProfessionalIndemnity({
    annual_fee_income: feeIncome,
    limit_of_indemnity: 50_00_000,
    profession: 'insurance_broker',
    prior_clean_years: 0,
  });
  assert.strictEqual(exactFloor.statutory_minimum_met, true);

  // LOI = 50,00,001 (floor + 1) -> Compliant
  const aboveFloor = calculateProfessionalIndemnity({
    annual_fee_income: feeIncome,
    limit_of_indemnity: 50_00_001,
    profession: 'insurance_broker',
    prior_clean_years: 0,
  });
  assert.strictEqual(aboveFloor.statutory_minimum_met, true);
});

runAdvTest('ADV-PI-03: IRDAI Broker boundary where 3x fee > 50L (3x fee is requiredMin)', () => {
  // fee_income = 16_66_667 -> 3 * 16,66,667 = 5,000,001 (> 50,00,000).
  // requiredMin is 5,000,001.
  const feeIncome = 16_66_667;

  // LOI = 50,00,000 (which would meet 50L floor, but NOT 3x fee) -> Deficient!
  const below3xFee = calculateProfessionalIndemnity({
    annual_fee_income: feeIncome,
    limit_of_indemnity: 50_00_000,
    profession: 'insurance_broker',
    prior_clean_years: 0,
  });
  assert.strictEqual(below3xFee.statutory_minimum_met, false);

  // LOI = 50,00,001 (exact 3x fee) -> Compliant
  const exact3xFee = calculateProfessionalIndemnity({
    annual_fee_income: feeIncome,
    limit_of_indemnity: 50_00_001,
    profession: 'insurance_broker',
    prior_clean_years: 0,
  });
  assert.strictEqual(exact3xFee.statutory_minimum_met, true);

  // LOI = 50,00,002 (3x fee + 1) -> Compliant
  const above3xFee = calculateProfessionalIndemnity({
    annual_fee_income: feeIncome,
    limit_of_indemnity: 50_00_002,
    profession: 'insurance_broker',
    prior_clean_years: 0,
  });
  assert.strictEqual(above3xFee.statutory_minimum_met, true);
});

runAdvTest('ADV-PI-04: Retroactive clean years loading ladder (0, 1, 4, 5, 6, 10, 50 years)', () => {
  const loi = 2_00_00_000; // ₹2 Cr
  // Tech: 0.85% -> base = 170,000
  const base = 170000;

  const testCases = [
    { years: 0, expectedLoadingPct: 0, factor: 1.00 },
    { years: 1, expectedLoadingPct: 10, factor: 1.10 },
    { years: 2, expectedLoadingPct: 20, factor: 1.20 },
    { years: 3, expectedLoadingPct: 30, factor: 1.30 },
    { years: 4, expectedLoadingPct: 40, factor: 1.40 },
    { years: 5, expectedLoadingPct: 50, factor: 1.50 },
    { years: 6, expectedLoadingPct: 50, factor: 1.50 }, // CAPPED
    { years: 10, expectedLoadingPct: 50, factor: 1.50 }, // CAPPED
    { years: 50, expectedLoadingPct: 50, factor: 1.50 }, // CAPPED
  ];

  for (const tc of testCases) {
    const res = calculateProfessionalIndemnity({
      annual_fee_income: 1_00_00_000,
      limit_of_indemnity: loi,
      profession: 'tech_software',
      prior_clean_years: tc.years,
    });
    assert.strictEqual(res.retroactive_loading_percent, tc.expectedLoadingPct, `Loading mismatch for ${tc.years} years`);
    assert.strictEqual(res.net_pi_premium, Math.round(base * tc.factor), `Net premium mismatch for ${tc.years} years`);
  }
});

// ============================================================================
// 3. DIRECTORS & OFFICERS (D&O) DEBT-TO-EQUITY THRESHOLDS
// ============================================================================
console.log('\n--- Section 3: Directors & Officers (D&O) Debt-to-Equity ---');

runAdvTest('ADV-DO-01: Tri-partite Side A (0.40%), Side B (0.35%), Side C (0.50%) verification', () => {
  const loi = 100_00_00_000; // ₹100 Cr
  const res = calculateDirectorsOfficersPremium({
    limit_of_indemnity: loi,
    entity_listing_status: 'private_unlisted',
    debt_to_equity_ratio: 1.0,
  });

  assert.strictEqual(res.side_a_premium, 4000000); // 40 Lakhs
  assert.strictEqual(res.side_b_premium, 3500000); // 35 Lakhs
  assert.strictEqual(res.side_c_premium, 5000000); // 50 Lakhs
  assert.strictEqual(res.net_do_premium, 12500000); // 1.25 Cr
});

runAdvTest('ADV-DO-02: Listing status multipliers (1.0x, 1.8x, 3.5x)', () => {
  const loi = 10_00_00_000; // ₹10 Cr -> base = 12,50,000
  const unlisted = calculateDirectorsOfficersPremium({
    limit_of_indemnity: loi,
    entity_listing_status: 'private_unlisted',
    debt_to_equity_ratio: 1.0,
  });
  const indiaListed = calculateDirectorsOfficersPremium({
    limit_of_indemnity: loi,
    entity_listing_status: 'public_listed_india',
    debt_to_equity_ratio: 1.0,
  });
  const usAdr = calculateDirectorsOfficersPremium({
    limit_of_indemnity: loi,
    entity_listing_status: 'public_listed_us_adr',
    debt_to_equity_ratio: 1.0,
  });

  assert.strictEqual(unlisted.net_do_premium, 1250000);
  assert.strictEqual(indiaListed.net_do_premium, Math.round(1250000 * 1.8)); // 2,250,000
  assert.strictEqual(usAdr.net_do_premium, Math.round(1250000 * 3.5)); // 4,375,000
});

runAdvTest('ADV-DO-03: Debt-to-Equity ratio boundary tests (negative, 0, 2.99, 3.00, 3.01, 10.0)', () => {
  const loi = 1_00_00_000;
  const basePrem = 125000;

  const testRatios = [
    { ratio: -5.0, expectedLoading: 0, desc: 'deep net cash' },
    { ratio: -1.5, expectedLoading: 0, desc: 'net cash company' },
    { ratio: 0.0, expectedLoading: 0, desc: 'zero debt' },
    { ratio: 2.99, expectedLoading: 0, desc: 'just below boundary' },
    { ratio: 3.00, expectedLoading: 0, desc: 'exact boundary 3.00' },
    { ratio: 3.00001, expectedLoading: 25, desc: 'infinitesimally above 3.00' },
    { ratio: 3.01, expectedLoading: 25, desc: '3.01' },
    { ratio: 5.5, expectedLoading: 25, desc: 'leveraged' },
    { ratio: 10.0, expectedLoading: 25, desc: 'highly distressed' },
  ];

  for (const item of testRatios) {
    const res = calculateDirectorsOfficersPremium({
      limit_of_indemnity: loi,
      entity_listing_status: 'private_unlisted',
      debt_to_equity_ratio: item.ratio,
    });
    assert.strictEqual(
      res.financial_distress_loading_percent,
      item.expectedLoading,
      `Failed loading for D/E ${item.ratio} (${item.desc})`
    );
    const expectedNet = item.expectedLoading === 25 ? Math.round(basePrem * 1.25) : basePrem;
    assert.strictEqual(res.net_do_premium, expectedNet, `Failed net for D/E ${item.ratio} (${item.desc})`);
  }
});

// ============================================================================
// 4. CYBER POSTURE SCORING MATRIX: EXHAUSTIVE 64-STATE TRUTH TABLE
// ============================================================================
console.log('\n--- Section 4: Cyber Posture Scoring Matrix (Full 64 Combinations) ---');

runAdvTest('ADV-CYBER-01: Exhaustive verification of all 64 ($2^6$) cyber posture permutations', () => {
  const basePremium = 100000;
  let uninsurableCount = 0;
  let matureCount = 0;
  let adequateCount = 0;
  let deficientCount = 0;

  for (let i = 0; i < 64; i++) {
    const hasMfa = (i & 32) !== 0;
    const hasEdr = (i & 16) !== 0;
    const hasBackups = (i & 8) !== 0;
    const hasVapt = (i & 4) !== 0;
    const hasSoc = (i & 2) !== 0;
    const hasTraining = (i & 1) !== 0;

    const answers: CyberPostureAnswers = {
      has_mfa_everywhere: hasMfa,
      has_edr_endpoints: hasEdr,
      has_airgapped_backups: hasBackups,
      has_annual_vapt: hasVapt,
      has_247_soc: hasSoc,
      has_employee_training: hasTraining,
    };

    // Calculate expected score mathematically
    let expectedScore = 0;
    if (hasMfa) expectedScore += 25;
    if (hasEdr) expectedScore += 20;
    if (hasBackups) expectedScore += 20;
    if (hasVapt) expectedScore += 15;
    if (hasSoc) expectedScore += 10;
    if (hasTraining) expectedScore += 10;

    const res = evaluateCyberPosture(answers, basePremium);

    // Invariant 1: Score must match exact weighted sum
    assert.strictEqual(res.score, expectedScore, `Score mismatch on state ${i}`);

    // Invariant 2: Gating rule - Missing MFA OR score < 50 => UNINSURABLE with ₹0 premium
    if (!hasMfa || expectedScore < 50) {
      assert.strictEqual(res.posture_tier, 'uninsurable', `State ${i} (MFA=${hasMfa}, Score=${expectedScore}) must be uninsurable`);
      assert.strictEqual(res.final_cyber_premium, 0, `State ${i} final premium must be 0`);
      assert.strictEqual(res.can_issue_quote, false, `State ${i} can_issue_quote must be false`);
      assert.strictEqual(res.rate_adjustment_percent, 0, `State ${i} rate adj must be 0`);
      uninsurableCount++;
    } else {
      // Invariant 3: Insurable states (MFA present AND score >= 50)
      assert.strictEqual(res.can_issue_quote, true, `State ${i} must be quotable`);

      if (expectedScore >= 85) {
        assert.strictEqual(res.posture_tier, 'mature', `State ${i} (score=${expectedScore}) must be mature`);
        assert.strictEqual(res.rate_adjustment_percent, -20, `State ${i} must have -20% discount`);
        assert.strictEqual(res.final_cyber_premium, Math.round(basePremium * 0.80));
        matureCount++;
      } else if (expectedScore >= 70) {
        assert.strictEqual(res.posture_tier, 'adequate', `State ${i} (score=${expectedScore}) must be adequate`);
        assert.strictEqual(res.rate_adjustment_percent, 0, `State ${i} must have 0% adjustment`);
        assert.strictEqual(res.final_cyber_premium, basePremium);
        adequateCount++;
      } else {
        // 50 <= expectedScore <= 69
        assert.strictEqual(res.posture_tier, 'deficient', `State ${i} (score=${expectedScore}) must be deficient`);
        assert.strictEqual(res.rate_adjustment_percent, 30, `State ${i} must have +30% loading`);
        assert.strictEqual(res.final_cyber_premium, Math.round(basePremium * 1.30));
        deficientCount++;
      }
    }
  }

  // Verify that all 32 combinations without MFA are strictly uninsurable
  assert.ok(uninsurableCount >= 32, `Expected at least 32 uninsurable states, found ${uninsurableCount}`);
  console.log(`    -> 64 Cyber Permutations verified: ${uninsurableCount} Uninsurable, ${deficientCount} Deficient, ${adequateCount} Adequate, ${matureCount} Mature`);
});

// ============================================================================
// 5. COMMERCIAL CRIME & EMPLOYEE FIDELITY
// ============================================================================
console.log('\n--- Section 5: Commercial Crime & Employee Fidelity ---');

runAdvTest('ADV-CRIME-01: Formula breakdown (staff * 250 + LOI * 0.0050) with dual auth (-15%)', () => {
  const staff = 80;
  const loi = 10_00_00_000; // ₹10 Cr
  // staffPrem = 80 * 250 = 20,000
  // limitPrem = 10 Cr * 0.0050 = 500,000
  // subtotal = 520,000
  // dual auth (-15%) = -78,000
  // net = 442,000

  const res = calculateCommercialCrimePremium({
    employees_with_funds_access: staff,
    limit_of_liability: loi,
    has_dual_authorization_above_50k: true,
  });

  assert.strictEqual(res.per_head_premium, 20000);
  assert.strictEqual(res.limit_premium, 500000);
  assert.strictEqual(res.internal_controls_discount_or_loading, -78000);
  assert.strictEqual(res.net_crime_premium, 442000);
});

runAdvTest('ADV-CRIME-02: Single signoff (+25% loading) on same risk profile', () => {
  // subtotal = 520,000
  // single signoff (+25%) = +130,000
  // net = 650,000
  const res = calculateCommercialCrimePremium({
    employees_with_funds_access: 80,
    limit_of_liability: 10_00_00_000,
    has_dual_authorization_above_50k: false,
  });

  assert.strictEqual(res.internal_controls_discount_or_loading, 130000);
  assert.strictEqual(res.net_crime_premium, 650000);
});

runAdvTest('ADV-CRIME-03: Large corporate workforce (10,000 sensitive employees)', () => {
  const res = calculateCommercialCrimePremium({
    employees_with_funds_access: 10000, // 2,500,000
    limit_of_liability: 50_00_00_000,   // 50 Cr * 0.0050 = 2,500,000
    has_dual_authorization_above_50k: true, // subtotal = 5,000,000; -15% = -750,000
  });

  assert.strictEqual(res.per_head_premium, 2500000);
  assert.strictEqual(res.limit_premium, 2500000);
  assert.strictEqual(res.internal_controls_discount_or_loading, -750000);
  assert.strictEqual(res.net_crime_premium, 4250000);
});

// ============================================================================
// 6. CORPORATE LIABILITY STUDIO & MULTI-LINE PACKAGE AGGREGATION
// ============================================================================
console.log('\n--- Section 6: Corporate Liability Studio & Multi-Line Package ---');

runAdvTest('ADV-PKG-01: Validation rejects zero turnover, negative turnover, empty corporate name, 0 lines', () => {
  assert.strictEqual(
    validateLiabilityStudioPackage({ corporate_name: '', turnover: 1000, opt_cgl: true, opt_cyber: false, opt_do: false, opt_crime: false }).error,
    'Corporate name is required'
  );
  assert.strictEqual(
    validateLiabilityStudioPackage({ corporate_name: 'Corp', turnover: 0, opt_cgl: true, opt_cyber: false, opt_do: false, opt_crime: false }).error,
    'Annual turnover must be positive'
  );
  assert.strictEqual(
    validateLiabilityStudioPackage({ corporate_name: 'Corp', turnover: -500, opt_cgl: true, opt_cyber: false, opt_do: false, opt_crime: false }).error,
    'Annual turnover must be positive'
  );
  assert.strictEqual(
    validateLiabilityStudioPackage({ corporate_name: 'Corp', turnover: 1000, opt_cgl: false, opt_cyber: false, opt_do: false, opt_crime: false }).error,
    'Select at least one liability line'
  );
});

runAdvTest('ADV-PKG-02: Package calculateCorporateLiabilityQuote throws matching errors on invalid inputs', () => {
  assert.throws(
    () => calculateCorporateLiabilityQuote({ corporate_name: '', annual_turnover: 1000, opt_cgl: true }),
    /Corporate name is required/
  );
  assert.throws(
    () => calculateCorporateLiabilityQuote({ corporate_name: 'Corp', annual_turnover: 0, opt_cgl: true }),
    /Annual turnover must be positive/
  );
  assert.throws(
    () => calculateCorporateLiabilityQuote({ corporate_name: 'Corp', annual_turnover: -100, opt_cgl: true }),
    /Annual turnover must be positive/
  );
  assert.throws(
    () => calculateCorporateLiabilityQuote({ corporate_name: 'Corp', annual_turnover: 1000 }),
    /Select at least one liability line/
  );
});

runAdvTest('ADV-PKG-03: Multi-line package aggregates all 5 lines correctly with 18% GST', () => {
  const pkgInput: CorporateLiabilityPackageInput = {
    corporate_name: 'Tata Consultancy Services Enterprise',
    annual_turnover: 2000_00_00_000, // ₹2,000 Cr
    opt_cgl: true,
    cgl: {
      annual_turnover: 2000_00_00_000,
      aoa_limit: 50_00_00_000,
      aoy_limit: 200_00_00_000,
      ratio: '1:4', // 0.72x
      hazard_category: 1, // 0.30‰ -> gross = 6,000,000
      territory: 'worldwide_inc_usa', // 2.5x -> net = 6,000,000 * 0.72 * 2.5 = 10,800,000
    },
    opt_pi: true,
    pi: {
      annual_fee_income: 500_00_00_000,
      limit_of_indemnity: 100_00_00_000,
      profession: 'tech_software', // 0.85% -> base = 8,500,000
      prior_clean_years: 5, // +50% -> net = 12,750,000
    },
    opt_do: true,
    do: {
      limit_of_indemnity: 100_00_00_000,
      entity_listing_status: 'public_listed_india', // 1.8x; base = 1.25% * 100 Cr = 12,500,000 * 1.8 = 22,500,000
      debt_to_equity_ratio: 0.5, // 0% loading -> net = 22,500,000
    },
    opt_cyber: true,
    cyber: {
      limit_of_indemnity: 100_00_00_000,
      base_premium: 20_00_000,
      answers: {
        has_mfa_everywhere: true,
        has_edr_endpoints: true,
        has_airgapped_backups: true,
        has_annual_vapt: true,
        has_247_soc: true,
        has_employee_training: true,
      }, // 100 pts -> mature -> -20% -> net = 1,600,000
    },
    opt_crime: true,
    crime: {
      employees_with_funds_access: 100, // 25,000
      limit_of_liability: 50_00_00_000, // 2,500,000; subtotal = 2,525,000
      has_dual_authorization_above_50k: true, // -15% = -378,750; net = 2,146,250
    },
  };

  const expectedCglNet = 10800000;
  const expectedPiNet = 12750000;
  const expectedDoNet = 22500000;
  const expectedCyberNet = 1600000;
  const expectedCrimeNet = 2146250;
  const expectedTotalNet = expectedCglNet + expectedPiNet + expectedDoNet + expectedCyberNet + expectedCrimeNet; // 49,796,250
  const expectedGst = Math.round(expectedTotalNet * 0.18); // 8,963,325
  const expectedTotalPremium = expectedTotalNet + expectedGst; // 58,759,575

  const quote = calculateCorporateLiabilityQuote(pkgInput);

  assert.strictEqual(quote.lob_category, 'liability');
  assert.strictEqual(quote.insurance_line, 'liability_package');
  assert.strictEqual(quote.net_premium, expectedTotalNet);
  assert.strictEqual(quote.gst_rate_percent, 18);
  assert.strictEqual(quote.gst_amount, expectedGst);
  assert.strictEqual(quote.total_premium, expectedTotalPremium);
  assert.strictEqual(quote.sum_insured, 200_00_00_000 + 100_00_00_000 + 100_00_00_000 + 100_00_00_000 + 50_00_00_000);
  assert.strictEqual(quote.line_specific_breakdown.active_lines.length, 5);
});

runAdvTest('ADV-PKG-04: Package handling of uninsurable cyber line produces 0 cyber premium in bundle', () => {
  const pkgInput: CorporateLiabilityPackageInput = {
    corporate_name: 'Risky Tech Ventures',
    annual_turnover: 10_00_00_000,
    opt_cgl: true,
    cgl: {
      annual_turnover: 10_00_00_000,
      aoa_limit: 1_00_00_000,
      aoy_limit: 1_00_00_000,
      ratio: '1:1',
      hazard_category: 1, // 0.30‰ -> 3,000
      territory: 'india_only',
    },
    opt_cyber: true,
    cyber: {
      limit_of_indemnity: 5_00_00_000,
      base_premium: 500000,
      answers: {
        has_mfa_everywhere: false, // UNINSURABLE!
        has_edr_endpoints: true,
        has_airgapped_backups: true,
        has_annual_vapt: true,
        has_247_soc: true,
        has_employee_training: true,
      },
    },
  };

  const quote = calculateCorporateLiabilityQuote(pkgInput);
  // CGL: 10 Cr @ 0.30‰ = 30,000; Cyber net = 0 (uninsurable)
  assert.strictEqual(quote.net_premium, 30000);
  assert.strictEqual(quote.line_specific_breakdown.cyber_breakdown.final_cyber_premium, 0);
  assert.strictEqual(quote.line_specific_breakdown.cyber_breakdown.posture_tier, 'uninsurable');
  assert.strictEqual(quote.line_specific_breakdown.cyber_breakdown.can_issue_quote, false);
});

// ============================================================================
// SUMMARY & VERIFICATION
// ============================================================================
console.log('\n======================================================================');
console.log(`  ADVERSARIAL TEST RESULTS: ${passedTests} / ${totalTests} PASSED`);
console.log('======================================================================\n');

if (passedTests === totalTests) {
  console.log(`✓ ALL ${totalTests} ADVERSARIAL STRESS TESTS PASSED WITH 100% SUCCESS\n`);
  process.exit(0);
} else {
  console.error(`✗ TEST FAILED: ${totalTests - passedTests} failed`);
  process.exit(1);
}
