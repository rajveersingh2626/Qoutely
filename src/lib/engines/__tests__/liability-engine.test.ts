/**
 * Comprehensive Unit Test Suite for Corporate Liability Underwriting Engine
 *
 * Covers 37 tests across 7 suites:
 * Suite 1: CGL Turnover & AOA:AOY Limit Ratio Engine (Feature 26) [5 tests]
 * Suite 2: Professional Indemnity (PI / E&O) Engine (Feature 27) [5 tests]
 * Suite 3: Directors & Officers (D&O) Engine (Feature 28) [5 tests]
 * Suite 4: Deterministic Cyber Posture Scoring Matrix (Feature 29) [6 tests]
 * Suite 5: Commercial Crime & Fidelity Engine (Feature 30) [5 tests]
 * Suite 6: Corporate Liability Studio UI Model (Feature 31) [5 tests]
 * Suite 7: Standard Contract Quotes, GST & Algorithmic Explainability [6 tests]
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
} from '../liability-engine';

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
console.log('  RUNNING: Liability Engine Unit Tests (37 Tests across 7 Suites)');
console.log('======================================================================\n');

// ============================================================================
// SUITE 1: CGL TURNOVER & AOA:AOY RATIO ENGINE (FEATURE 26) - 5 TESTS
// ============================================================================
console.log('--- Suite 1: CGL Turnover & AOA:AOY Ratio Engine (Feature 26) ---');

runTest('S1-01: Category 1 (0.30‰) turnover rating on ₹100 Cr with 1:1 ratio in India', () => {
  const input: CglInput = {
    annual_turnover: 100_00_00_000,
    aoa_limit: 10_00_00_000,
    aoy_limit: 10_00_00_000,
    ratio: '1:1',
    hazard_category: 1,
    territory: 'india_only',
  };
  const res = calculateCglPremium(input);
  // gross = (100_00_00_000 * 0.30) / 1000 = 300,000
  assert.strictEqual(res.base_turnover_rate_per_mille, 0.30);
  assert.strictEqual(res.gross_cgl_premium, 300000);
  assert.strictEqual(res.ratio_discount_percent, 0);
  assert.strictEqual(res.territory_multiplier, 1.0);
  assert.strictEqual(res.net_cgl_premium, 300000);
});

runTest('S1-02: AOA:AOY ratio discounts (1:1=0%, 1:2=15%, 1:4=28%) applied to Category 2', () => {
  const base: Omit<CglInput, 'ratio' | 'aoa_limit' | 'aoy_limit'> = {
    annual_turnover: 50_00_00_000,
    hazard_category: 2, // 0.60‰ => gross = 300,000
    territory: 'india_only',
  };

  const res11 = calculateCglPremium({ ...base, ratio: '1:1', aoa_limit: 10_00_00_000, aoy_limit: 10_00_00_000 });
  const res12 = calculateCglPremium({ ...base, ratio: '1:2', aoa_limit: 5_00_00_000, aoy_limit: 10_00_00_000 });
  const res14 = calculateCglPremium({ ...base, ratio: '1:4', aoa_limit: 2_50_00_000, aoy_limit: 10_00_00_000 });

  assert.strictEqual(res11.ratio_discount_percent, 0);
  assert.strictEqual(res11.net_cgl_premium, 300000);

  assert.strictEqual(res12.ratio_discount_percent, 15);
  assert.strictEqual(res12.net_cgl_premium, Math.round(300000 * 0.85)); // 255,000

  assert.strictEqual(res14.ratio_discount_percent, 28);
  assert.strictEqual(res14.net_cgl_premium, Math.round(300000 * 0.72)); // 216,000
});

runTest('S1-03: Territorial multipliers (India 1.0x, Worldwide ex-USA 1.5x, Worldwide inc-USA 2.5x)', () => {
  const base: Omit<CglInput, 'territory'> = {
    annual_turnover: 20_00_00_000,
    aoa_limit: 2_00_00_000,
    aoy_limit: 8_00_00_000,
    ratio: '1:4', // 0.72x
    hazard_category: 3, // 1.20‰ => gross = 240,000; with 1:4 => 172,800
  };

  const resIndia = calculateCglPremium({ ...base, territory: 'india_only' });
  const resExUsa = calculateCglPremium({ ...base, territory: 'worldwide_ex_usa' });
  const resIncUsa = calculateCglPremium({ ...base, territory: 'worldwide_inc_usa' });

  assert.strictEqual(resIndia.territory_multiplier, 1.0);
  assert.strictEqual(resIndia.net_cgl_premium, 172800);

  assert.strictEqual(resExUsa.territory_multiplier, 1.5);
  assert.strictEqual(resExUsa.net_cgl_premium, Math.round(172800 * 1.5)); // 259,200

  assert.strictEqual(resIncUsa.territory_multiplier, 2.5);
  assert.strictEqual(resIncUsa.net_cgl_premium, Math.round(172800 * 2.5)); // 432,000
});

runTest('S1-04: Throws exact error when AOA limit exceeds AOY limit', () => {
  const invalidInput: CglInput = {
    annual_turnover: 10_00_00_000,
    aoa_limit: 15_00_00_000, // Greater than AOY!
    aoy_limit: 10_00_00_000,
    ratio: '1:1',
    hazard_category: 1,
    territory: 'india_only',
  };

  assert.throws(
    () => calculateCglPremium(invalidInput),
    /Any One Accident \(AOA\) limit cannot exceed Any One Year \(AOY\) aggregate limit/
  );
});

runTest('S1-05: Zero turnover produces 0 gross and 0 net premium without error', () => {
  const zeroTurnoverInput: CglInput = {
    annual_turnover: 0,
    aoa_limit: 1_00_00_000,
    aoy_limit: 2_00_00_000,
    ratio: '1:2',
    hazard_category: 4,
    territory: 'worldwide_inc_usa',
  };
  const res = calculateCglPremium(zeroTurnoverInput);
  assert.strictEqual(res.gross_cgl_premium, 0);
  assert.strictEqual(res.net_cgl_premium, 0);
});

// ============================================================================
// SUITE 2: PROFESSIONAL INDEMNITY (PI / E&O) ENGINE (FEATURE 27) - 5 TESTS
// ============================================================================
console.log('\n--- Suite 2: Professional Indemnity (PI / E&O) Engine (Feature 27) ---');

runTest('S2-01: Profession base rates (Tech 0.85%, Consultants 1.20%, Broker 1.50%, Doctor 2.00%)', () => {
  const loi = 1_00_00_000; // ₹1 Cr
  const techRes = calculateProfessionalIndemnity({ annual_fee_income: 50_00_000, limit_of_indemnity: loi, profession: 'tech_software', prior_clean_years: 0 });
  const consultRes = calculateProfessionalIndemnity({ annual_fee_income: 50_00_000, limit_of_indemnity: loi, profession: 'consultants_ca', prior_clean_years: 0 });
  const brokerRes = calculateProfessionalIndemnity({ annual_fee_income: 10_00_000, limit_of_indemnity: loi, profession: 'insurance_broker', prior_clean_years: 0 });
  const doctorRes = calculateProfessionalIndemnity({ annual_fee_income: 50_00_000, limit_of_indemnity: loi, profession: 'medical_doctor', prior_clean_years: 0 });

  assert.strictEqual(techRes.base_pi_premium, 85000);
  assert.strictEqual(consultRes.base_pi_premium, 120000);
  assert.strictEqual(brokerRes.base_pi_premium, 150000);
  assert.strictEqual(doctorRes.base_pi_premium, 200000);
});

runTest('S2-02: IRDAI 2018 broker statutory check flags deficient limit when below max(50L, 3x fee)', () => {
  // Fee = ₹20L -> 3x fee = ₹60L (higher than ₹50L). LOI = ₹55L -> deficient!
  const deficientRes = calculateProfessionalIndemnity({
    annual_fee_income: 20_00_000,
    limit_of_indemnity: 55_00_000,
    profession: 'insurance_broker',
    prior_clean_years: 0,
  });
  assert.strictEqual(deficientRes.statutory_minimum_met, false);

  // When LOI = ₹60L -> exactly equal to 3x fee -> passes!
  const compliantRes = calculateProfessionalIndemnity({
    annual_fee_income: 20_00_000,
    limit_of_indemnity: 60_00_000,
    profession: 'insurance_broker',
    prior_clean_years: 0,
  });
  assert.strictEqual(compliantRes.statutory_minimum_met, true);
});

runTest('S2-03: IRDAI 2018 broker statutory check enforces ₹50L minimum floor when 3x fee is low', () => {
  // Fee = ₹5L -> 3x fee = ₹15L. Minimum floor is ₹50L. LOI = ₹40L -> deficient!
  const deficientFloor = calculateProfessionalIndemnity({
    annual_fee_income: 5_00_000,
    limit_of_indemnity: 40_00_000,
    profession: 'insurance_broker',
    prior_clean_years: 0,
  });
  assert.strictEqual(deficientFloor.statutory_minimum_met, false);

  const compliantFloor = calculateProfessionalIndemnity({
    annual_fee_income: 5_00_000,
    limit_of_indemnity: 50_00_000,
    profession: 'insurance_broker',
    prior_clean_years: 0,
  });
  assert.strictEqual(compliantFloor.statutory_minimum_met, true);
});

runTest('S2-04: Non-broker professions always satisfy statutory minimum check', () => {
  const smallLimitTech = calculateProfessionalIndemnity({
    annual_fee_income: 5_00_00_000,
    limit_of_indemnity: 10_00_000, // Below 3x fee or 50L
    profession: 'tech_software',
    prior_clean_years: 1,
  });
  assert.strictEqual(smallLimitTech.statutory_minimum_met, true);
});

runTest('S2-05: Retroactive clean years loading adds +10%/year and caps at +50%', () => {
  const loi = 1_00_00_000;
  // 3 clean years: +30% loading
  const res3y = calculateProfessionalIndemnity({ annual_fee_income: 50_00_000, limit_of_indemnity: loi, profession: 'tech_software', prior_clean_years: 3 });
  assert.strictEqual(res3y.retroactive_loading_percent, 30);
  assert.strictEqual(res3y.net_pi_premium, Math.round(85000 * 1.30)); // 110,500

  // 7 clean years: should cap at 50% max loading
  const res7y = calculateProfessionalIndemnity({ annual_fee_income: 50_00_000, limit_of_indemnity: loi, profession: 'tech_software', prior_clean_years: 7 });
  assert.strictEqual(res7y.retroactive_loading_percent, 50);
  assert.strictEqual(res7y.net_pi_premium, Math.round(85000 * 1.50)); // 127,500

  // 0 clean years: 0% loading
  const res0y = calculateProfessionalIndemnity({ annual_fee_income: 50_00_000, limit_of_indemnity: loi, profession: 'tech_software', prior_clean_years: 0 });
  assert.strictEqual(res0y.retroactive_loading_percent, 0);
  assert.strictEqual(res0y.net_pi_premium, 85000);
});

// ============================================================================
// SUITE 3: DIRECTORS & OFFICERS (D&O) ENGINE (FEATURE 28) - 5 TESTS
// ============================================================================
console.log('\n--- Suite 3: Directors & Officers (D&O) Engine (Feature 28) ---');

runTest('S3-01: Side A (0.40%), Side B (0.35%), Side C (0.50%) sum to 1.25% on unlisted entity', () => {
  const input: DoInput = {
    limit_of_indemnity: 10_00_00_000, // ₹10 Cr
    entity_listing_status: 'private_unlisted',
    debt_to_equity_ratio: 1.5,
  };
  const res = calculateDirectorsOfficersPremium(input);
  assert.strictEqual(res.side_a_premium, 400000);
  assert.strictEqual(res.side_b_premium, 350000);
  assert.strictEqual(res.side_c_premium, 500000);
  assert.strictEqual(res.financial_distress_loading_percent, 0);
  assert.strictEqual(res.net_do_premium, 1250000); // 1.25% of 10 Cr
});

runTest('S3-02: Listing multipliers (Indian listed 1.8x, US ADR 3.5x)', () => {
  const base: Omit<DoInput, 'entity_listing_status'> = {
    limit_of_indemnity: 10_00_00_000,
    debt_to_equity_ratio: 1.0,
  };

  const resIndia = calculateDirectorsOfficersPremium({ ...base, entity_listing_status: 'public_listed_india' });
  const resUsAdr = calculateDirectorsOfficersPremium({ ...base, entity_listing_status: 'public_listed_us_adr' });

  // 12,50,000 * 1.8 = 22,50,000
  assert.strictEqual(resIndia.net_do_premium, 2250000);
  assert.strictEqual(resIndia.side_a_premium, Math.round(400000 * 1.8));
  assert.strictEqual(resIndia.side_b_premium, Math.round(350000 * 1.8));
  assert.strictEqual(resIndia.side_c_premium, Math.round(500000 * 1.8));

  // 12,50,000 * 3.5 = 43,75,000
  assert.strictEqual(resUsAdr.net_do_premium, 4375000);
});

runTest('S3-03: D/E ratio of exactly 3.0 incurs 0% distress loading (boundary test)', () => {
  const input: DoInput = {
    limit_of_indemnity: 1_00_00_000,
    entity_listing_status: 'private_unlisted',
    debt_to_equity_ratio: 3.0,
  };
  const res = calculateDirectorsOfficersPremium(input);
  assert.strictEqual(res.financial_distress_loading_percent, 0);
  assert.strictEqual(res.net_do_premium, 125000);
});

runTest('S3-04: D/E ratio > 3.0 (e.g. 3.2) triggers +25% distress loading', () => {
  const input: DoInput = {
    limit_of_indemnity: 1_00_00_000,
    entity_listing_status: 'private_unlisted',
    debt_to_equity_ratio: 3.2,
  };
  const res = calculateDirectorsOfficersPremium(input);
  assert.strictEqual(res.financial_distress_loading_percent, 25);
  assert.strictEqual(res.net_do_premium, Math.round(125000 * 1.25)); // 156,250
});

runTest('S3-05: Negative D/E ratio (net cash company) incurs 0% distress loading', () => {
  const input: DoInput = {
    limit_of_indemnity: 5_00_00_000,
    entity_listing_status: 'private_unlisted',
    debt_to_equity_ratio: -0.45,
  };
  const res = calculateDirectorsOfficersPremium(input);
  assert.strictEqual(res.financial_distress_loading_percent, 0);
  assert.strictEqual(res.net_do_premium, Math.round(5_00_00_000 * 0.0125));
});

// ============================================================================
// SUITE 4: DETERMINISTIC CYBER POSTURE SCORING MATRIX (FEATURE 29) - 6 TESTS
// ============================================================================
console.log('\n--- Suite 4: Deterministic Cyber Posture Scoring Matrix (Feature 29) ---');

runTest('S4-01: Full 6 controls yields 100 points, mature tier, and 20% discount', () => {
  const answers: CyberPostureAnswers = {
    has_mfa_everywhere: true,     // 25
    has_edr_endpoints: true,       // 20
    has_airgapped_backups: true,   // 20
    has_annual_vapt: true,         // 15
    has_247_soc: true,             // 10
    has_employee_training: true,   // 10
  };
  const res = evaluateCyberPosture(answers, 100000);
  assert.strictEqual(res.score, 100);
  assert.strictEqual(res.posture_tier, 'mature');
  assert.strictEqual(res.rate_adjustment_percent, -20);
  assert.strictEqual(res.final_cyber_premium, 80000);
  assert.strictEqual(res.can_issue_quote, true);
});

runTest('S4-02: Score >= 85 (e.g. 85 pts) qualifies for mature tier (-20% discount)', () => {
  const answers: CyberPostureAnswers = {
    has_mfa_everywhere: true,     // 25
    has_edr_endpoints: true,       // 20
    has_airgapped_backups: true,   // 20
    has_annual_vapt: false,        // 0 (omitted 15)
    has_247_soc: true,             // 10
    has_employee_training: true,   // 10 -> total 85
  };
  const res = evaluateCyberPosture(answers, 100000);
  assert.strictEqual(res.score, 85);
  assert.strictEqual(res.posture_tier, 'mature');
  assert.strictEqual(res.rate_adjustment_percent, -20);
  assert.strictEqual(res.final_cyber_premium, 80000);
});

runTest('S4-03: Score 70–84 (e.g. 75 pts) qualifies for adequate tier (par 0% adjustment)', () => {
  const answers: CyberPostureAnswers = {
    has_mfa_everywhere: true,     // 25
    has_edr_endpoints: true,       // 20
    has_airgapped_backups: true,   // 20
    has_annual_vapt: false,        // 0
    has_247_soc: true,             // 10
    has_employee_training: false,  // 0 -> total 75
  };
  const res = evaluateCyberPosture(answers, 250000);
  assert.strictEqual(res.score, 75);
  assert.strictEqual(res.posture_tier, 'adequate');
  assert.strictEqual(res.rate_adjustment_percent, 0);
  assert.strictEqual(res.final_cyber_premium, 250000);
  assert.strictEqual(res.can_issue_quote, true);
});

runTest('S4-04: Score 50–69 (e.g. 65 pts) qualifies for deficient tier (+30% loading)', () => {
  const answers: CyberPostureAnswers = {
    has_mfa_everywhere: true,     // 25
    has_edr_endpoints: true,       // 20
    has_airgapped_backups: false,  // 0
    has_annual_vapt: false,        // 0
    has_247_soc: true,             // 10
    has_employee_training: true,   // 10 -> total 65
  };
  const res = evaluateCyberPosture(answers, 200000);
  assert.strictEqual(res.score, 65);
  assert.strictEqual(res.posture_tier, 'deficient');
  assert.strictEqual(res.rate_adjustment_percent, 30);
  assert.strictEqual(res.final_cyber_premium, 260000); // 200,000 * 1.30
  assert.strictEqual(res.can_issue_quote, true);
});

runTest('S4-05: Missing MFA immediately forces uninsurable tier even if other 5 controls total 75 pts', () => {
  const answers: CyberPostureAnswers = {
    has_mfa_everywhere: false,    // 0 -> CRITICAL MISSING
    has_edr_endpoints: true,       // 20
    has_airgapped_backups: true,   // 20
    has_annual_vapt: true,         // 15
    has_247_soc: true,             // 10
    has_employee_training: true,   // 10 -> total 75
  };
  const res = evaluateCyberPosture(answers, 500000);
  assert.strictEqual(res.score, 75);
  assert.strictEqual(res.posture_tier, 'uninsurable');
  assert.strictEqual(res.can_issue_quote, false);
  assert.strictEqual(res.final_cyber_premium, 0);
  assert.ok(res.reasons.some((r) => r.includes('Multi-Factor Authentication is missing')));
  assert.ok(res.reasons.some((r) => r.includes('Uninsurable')));
});

runTest('S4-06: Score below 50 (e.g. 45 pts with MFA) forces uninsurable tier', () => {
  const answers: CyberPostureAnswers = {
    has_mfa_everywhere: true,     // 25
    has_edr_endpoints: true,       // 20 -> total 45
    has_airgapped_backups: false,
    has_annual_vapt: false,
    has_247_soc: false,
    has_employee_training: false,
  };
  const res = evaluateCyberPosture(answers, 100000);
  assert.strictEqual(res.score, 45);
  assert.strictEqual(res.posture_tier, 'uninsurable');
  assert.strictEqual(res.can_issue_quote, false);
  assert.strictEqual(res.final_cyber_premium, 0);
  assert.ok(res.reasons.some((r) => r.includes('Uninsurable: Score below 50')));
});

// ============================================================================
// SUITE 5: COMMERCIAL CRIME & FIDELITY ENGINE (FEATURE 30) - 5 TESTS
// ============================================================================
console.log('\n--- Suite 5: Commercial Crime & Fidelity Engine (Feature 30) ---');

runTest('S5-01: Per-head rating of ₹250 per sensitive employee', () => {
  const input: CrimeFidelityInput = {
    employees_with_funds_access: 40,
    limit_of_liability: 0,
    has_dual_authorization_above_50k: true,
  };
  const res = calculateCommercialCrimePremium(input);
  assert.strictEqual(res.per_head_premium, 10000); // 40 * 250
  assert.strictEqual(res.limit_premium, 0);
});

runTest('S5-02: Limit rating of 0.50% on limit of liability', () => {
  const input: CrimeFidelityInput = {
    employees_with_funds_access: 0,
    limit_of_liability: 2_00_00_000, // ₹2 Cr
    has_dual_authorization_above_50k: true,
  };
  const res = calculateCommercialCrimePremium(input);
  assert.strictEqual(res.per_head_premium, 0);
  assert.strictEqual(res.limit_premium, 100000); // 0.50% of 2 Cr
});

runTest('S5-03: Dual authorization discount (-15%) on subtotal', () => {
  const input: CrimeFidelityInput = {
    employees_with_funds_access: 20, // 20 * 250 = 5,000
    limit_of_liability: 1_00_00_000, // 0.50% = 50,000; subtotal = 55,000
    has_dual_authorization_above_50k: true,
  };
  const res = calculateCommercialCrimePremium(input);
  assert.strictEqual(res.internal_controls_discount_or_loading, -Math.round(55000 * 0.15)); // -8,250
  assert.strictEqual(res.net_crime_premium, 55000 - 8250); // 46,750
});

runTest('S5-04: Single signoff loading (+25%) on subtotal', () => {
  const input: CrimeFidelityInput = {
    employees_with_funds_access: 20, // 5,000
    limit_of_liability: 1_00_00_000, // 50,000; subtotal = 55,000
    has_dual_authorization_above_50k: false,
  };
  const res = calculateCommercialCrimePremium(input);
  assert.strictEqual(res.internal_controls_discount_or_loading, Math.round(55000 * 0.25)); // +13,750
  assert.strictEqual(res.net_crime_premium, 55000 + 13750); // 68,750
});

runTest('S5-05: Zero employees and zero limit yields 0 net crime premium', () => {
  const input: CrimeFidelityInput = {
    employees_with_funds_access: 0,
    limit_of_liability: 0,
    has_dual_authorization_above_50k: true,
  };
  const res = calculateCommercialCrimePremium(input);
  assert.strictEqual(res.per_head_premium, 0);
  assert.strictEqual(res.limit_premium, 0);
  assert.strictEqual(res.net_crime_premium, 0);
});

// ============================================================================
// SUITE 6: CORPORATE LIABILITY STUDIO UI MODEL (FEATURE 31) - 5 TESTS
// ============================================================================
console.log('\n--- Suite 6: Corporate Liability Studio UI Model (Feature 31) ---');

runTest('S6-01: Validates corporate name, positive turnover, and selected line count', () => {
  const input: LiabilityStudioInput = {
    corporate_name: 'Acme Technologies Ltd',
    turnover: 150_00_00_000,
    opt_cgl: true,
    opt_cyber: true,
    opt_do: false,
    opt_crime: false,
  };
  const res = validateLiabilityStudioPackage(input);
  assert.strictEqual(res.is_valid, true);
  assert.strictEqual(res.lines_selected_count, 2);
  assert.strictEqual(res.error, undefined);
});

runTest('S6-02: Flags missing corporate name as invalid', () => {
  const input: LiabilityStudioInput = {
    corporate_name: '',
    turnover: 50_00_00_000,
    opt_cgl: true,
    opt_cyber: false,
    opt_do: false,
    opt_crime: false,
  };
  const res = validateLiabilityStudioPackage(input);
  assert.strictEqual(res.is_valid, false);
  assert.strictEqual(res.lines_selected_count, 0);
  assert.strictEqual(res.error, 'Corporate name is required');
});

runTest('S6-03: Flags non-positive turnover as invalid', () => {
  const inputZero: LiabilityStudioInput = {
    corporate_name: 'Acme Ltd',
    turnover: 0,
    opt_cgl: true,
    opt_cyber: false,
    opt_do: false,
    opt_crime: false,
  };
  const inputNegative: LiabilityStudioInput = {
    corporate_name: 'Acme Ltd',
    turnover: -5000,
    opt_cgl: true,
    opt_cyber: false,
    opt_do: false,
    opt_crime: false,
  };

  assert.strictEqual(validateLiabilityStudioPackage(inputZero).error, 'Annual turnover must be positive');
  assert.strictEqual(validateLiabilityStudioPackage(inputNegative).error, 'Annual turnover must be positive');
});

runTest('S6-04: Flags when no liability lines are selected', () => {
  const input: LiabilityStudioInput = {
    corporate_name: 'Acme Ltd',
    turnover: 10_00_00_000,
    opt_cgl: false,
    opt_cyber: false,
    opt_do: false,
    opt_crime: false,
  };
  const res = validateLiabilityStudioPackage(input);
  assert.strictEqual(res.is_valid, false);
  assert.strictEqual(res.lines_selected_count, 0);
  assert.strictEqual(res.error, 'Select at least one liability line');
});

runTest('S6-05: High-value corporate conglomerate (₹10,000 Cr turnover) validates cleanly with 4 lines', () => {
  const input: LiabilityStudioInput = {
    corporate_name: 'Bharat Conglomerate Industries Ltd',
    turnover: 10000_00_00_000, // ₹10,000 Cr
    opt_cgl: true,
    opt_cyber: true,
    opt_do: true,
    opt_crime: true,
  };
  const res = validateLiabilityStudioPackage(input);
  assert.strictEqual(res.is_valid, true);
  assert.strictEqual(res.lines_selected_count, 4);
});

// ============================================================================
// SUITE 7: STANDARD CONTRACT QUOTES, GST & ALGORITHMIC EXPLAINABILITY - 6 TESTS
// ============================================================================
console.log('\n--- Suite 7: Standard Contract Quotes, GST & Algorithmic Explainability ---');

runTest('S7-01: calculateCglQuote returns StandardQuoteBreakdown with 18% GST and statutory clauses', () => {
  const input: CglInput = {
    annual_turnover: 50_00_00_000,
    aoa_limit: 5_00_00_000,
    aoy_limit: 10_00_00_000,
    ratio: '1:2',
    hazard_category: 1,
    territory: 'india_only',
  };
  const quote = calculateCglQuote(input);
  assert.strictEqual(quote.lob_category, 'liability');
  assert.strictEqual(quote.insurance_line, 'cgl');
  assert.strictEqual(quote.gst_rate_percent, STATUTORY_GST_RATE);
  assert.strictEqual(quote.gst_amount, Math.round(quote.net_premium * 0.18));
  assert.strictEqual(quote.total_premium, quote.net_premium + quote.gst_amount);
  assert.ok(quote.statutory_clauses.length >= 4);
  assert.ok(quote.algorithmic_explainability.length >= 3);
});

runTest('S7-02: calculatePiQuote returns StandardQuoteBreakdown and explainability', () => {
  const input: PiInput = {
    annual_fee_income: 1_00_00_000,
    limit_of_indemnity: 3_00_00_000,
    profession: 'insurance_broker',
    prior_clean_years: 2,
  };
  const quote = calculatePiQuote(input);
  assert.strictEqual(quote.insurance_line, 'pi');
  assert.strictEqual(quote.sum_insured, 3_00_00_000);
  assert.strictEqual(quote.line_specific_breakdown.statutory_minimum_met, true);
  assert.strictEqual(quote.total_premium, quote.net_premium + quote.gst_amount);
});

runTest('S7-03: calculateDoQuote returns StandardQuoteBreakdown with Side breakdown', () => {
  const input: DoInput = {
    limit_of_indemnity: 20_00_00_000,
    entity_listing_status: 'public_listed_india',
    debt_to_equity_ratio: 2.1,
  };
  const quote = calculateDoQuote(input);
  assert.strictEqual(quote.insurance_line, 'do');
  assert.strictEqual(quote.gst_amount, Math.round(quote.net_premium * 0.18));
  assert.ok(quote.line_specific_breakdown.side_a_premium > 0);
  assert.ok(quote.line_specific_breakdown.side_b_premium > 0);
  assert.ok(quote.line_specific_breakdown.side_c_premium > 0);
});

runTest('S7-04: calculateCyberQuote returns posture evaluation and gating status', () => {
  const answers: CyberPostureAnswers = {
    has_mfa_everywhere: true,
    has_edr_endpoints: true,
    has_airgapped_backups: true,
    has_annual_vapt: true,
    has_247_soc: true,
    has_employee_training: true,
  };
  const quote = calculateCyberQuote({
    base_premium: 500000,
    answers,
    limit_of_indemnity: 25_00_00_000,
  });
  assert.strictEqual(quote.insurance_line, 'cyber');
  assert.strictEqual(quote.line_specific_breakdown.score, 100);
  assert.strictEqual(quote.line_specific_breakdown.posture_tier, 'mature');
  assert.strictEqual(quote.net_premium, 400000); // 500k - 20%
});

runTest('S7-05: calculateCrimeQuote returns dual authorization explainability', () => {
  const input: CrimeFidelityInput = {
    employees_with_funds_access: 15,
    limit_of_liability: 5_00_00_000,
    has_dual_authorization_above_50k: true,
  };
  const quote = calculateCrimeQuote(input);
  assert.strictEqual(quote.insurance_line, 'crime');
  assert.strictEqual(quote.gst_amount, Math.round(quote.net_premium * 0.18));
  assert.strictEqual(quote.total_premium, quote.net_premium + quote.gst_amount);
});

runTest('S7-06: calculateCorporateLiabilityQuote unifies multi-line package into single breakdown', () => {
  const packageQuote = calculateCorporateLiabilityQuote({
    corporate_name: 'Nexus FinTech Cloud Ltd',
    annual_turnover: 120_00_00_000,
    opt_cgl: true,
    cgl: {
      annual_turnover: 120_00_00_000,
      aoa_limit: 10_00_00_000,
      aoy_limit: 40_00_00_000,
      ratio: '1:4',
      hazard_category: 1,
      territory: 'worldwide_inc_usa',
    },
    opt_pi: true,
    pi: {
      annual_fee_income: 80_00_00_000,
      limit_of_indemnity: 50_00_00_000,
      profession: 'tech_software',
      prior_clean_years: 3,
    },
    opt_do: true,
    do: {
      limit_of_indemnity: 50_00_00_000,
      entity_listing_status: 'private_unlisted',
      debt_to_equity_ratio: 0.8,
    },
    opt_cyber: true,
    cyber: {
      limit_of_indemnity: 50_00_00_000,
      base_premium: 10_00_000,
      answers: {
        has_mfa_everywhere: true,
        has_edr_endpoints: true,
        has_airgapped_backups: true,
        has_annual_vapt: true,
        has_247_soc: true,
        has_employee_training: true,
      },
    },
    opt_crime: true,
    crime: {
      employees_with_funds_access: 25,
      limit_of_liability: 20_00_00_000,
      has_dual_authorization_above_50k: true,
    },
  });

  assert.strictEqual(packageQuote.lob_category, 'liability');
  assert.strictEqual(packageQuote.insurance_line, 'liability_package');
  assert.strictEqual(packageQuote.line_specific_breakdown.active_lines.length, 5);
  assert.strictEqual(packageQuote.gst_amount, Math.round(packageQuote.net_premium * 0.18));
  assert.strictEqual(packageQuote.total_premium, packageQuote.net_premium + packageQuote.gst_amount);
  assert.ok(packageQuote.sum_insured > 0);
  assert.ok(packageQuote.algorithmic_explainability.length >= 3);
});

// ============================================================================
// SUMMARY & VERIFICATION
// ============================================================================
console.log('\n======================================================================');
console.log(`  LIABILITY ENGINE TEST RESULTS: ${passedTests} / ${totalTests} PASSED`);
console.log('======================================================================\n');

if (passedTests === totalTests && totalTests === 37) {
  console.log('✓ ALL 37 UNIT TESTS PASSED WITH 100% SUCCESS\n');
  process.exit(0);
} else {
  console.error(`✗ TEST FAILED: ${totalTests - passedTests} failed`);
  process.exit(1);
}
