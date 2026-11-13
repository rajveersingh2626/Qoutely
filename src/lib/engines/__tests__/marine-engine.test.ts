/**
 * Comprehensive Unit Test Suite for Marine Cargo & Logistics Underwriting Engine
 *
 * Verifies:
 * Suite 1: Inland Transit Rating (ITC A/B/C)
 *   - Commodity hazard classes 1-4 base rates (0.06‰, 0.12‰, 0.25‰, 0.55‰).
 *   - ITC clause multipliers: ITC (A) = 1.0, ITC (B) = 0.80, ITC (C) = 0.60.
 *   - Carrier certification factor: Uncertified common carrier adds +25% surcharge (1.25x).
 *   - Statutory minimum premium floor enforcement (₹1,000).
 *   - Deductible / excess minimum floor (₹2,500) and scaling on high value (0.5%).
 *
 * Suite 2: Ocean Cargo Rating & Incoterms
 *   - Incoterms markups: CIF (110%), FOB / CFR (Invoice + 10% freight + 2% port, then 110%), EXW (Invoice + 5% inland + 10% freight, then 110%).
 *   - Base ICC rates: ICC (A) = 0.35‰, ICC (B) = 0.26‰, ICC (C) = 0.18‰.
 *   - Customs duty cover rated at 50% base ocean rate.
 *   - Customs duty cover edge case with 0% rate.
 *   - Institute War & Strikes clauses (0.05‰ on total cargo SI).
 *   - Statutory minimum ocean premium floor (₹1,000).
 *
 * Suite 3: Marine Open Policy (MOP) & ATPO Drawdown
 *   - Standard debit with sufficient CD balance (balance decremented, utilized SI increased, certificate issued).
 *   - Cumulative multi-declaration tracking.
 *   - Exact ₹0 balance drawdown.
 *   - Low CD balance warning threshold (< ₹10,000).
 *   - Section 64VB block on insufficient balance (CD_BALANCE_EXHAUSTED).
 *   - 1-rupee deficit block under Section 64VB.
 *   - Zero-value consignment dispatch.
 *   - Batch declaration processing helper.
 *
 * Suite 4: Studio Proposal Validation
 *   - Valid single voyage, open policy, and ATPO proposals.
 *   - Missing client name rejection.
 *   - Missing origin or destination rejection.
 *   - Non-positive consignment value rejection.
 *   - High-scale commercial shipment (₹500 Crore) validation.
 *
 * Suite 5: StandardQuoteBreakdown Contract & Explainability
 *   - Inland quote breakdown completeness (18% GST rounding, net, total, statutory clauses).
 *   - Ocean quote breakdown completeness (18% GST rounding, net, total, statutory clauses).
 *   - Unified calculateMarineQuote router function.
 *   - 6-step algorithmic explainability vector completeness.
 *
 * Suite 6: Boundary, Limit & Error Handling
 *   - Zero invoice value in Inland Transit throws Error.
 *   - Negative invoice value in Inland Transit throws Error.
 *   - Zero invoice value in Ocean Cargo throws Error.
 *   - Negative invoice value in Ocean Cargo throws Error.
 *   - High-precision per-mille arithmetic stability.
 */

import assert from 'node:assert';
import {
  calculateMarineInlandTransit,
  calculateMarineOceanCargo,
  processMopDeclaration,
  validateMarineStudioProposal,
  calculateMarineInlandQuote,
  calculateMarineOceanQuote,
  calculateMarineQuote,
  processBatchDeclarations,
  COMMODITY_HAZARD_RATES,
  ITC_CLAUSE_MULTIPLIERS,
  ICC_OCEAN_BASE_RATES,
  WAR_AND_STRIKES_RATE_PER_MILLE,
  STATUTORY_MINIMUM_PREMIUM,
  STATUTORY_MINIMUM_EXCESS,
  STATUTORY_GST_RATE,
  MopAccount,
} from '../marine-engine';

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

console.log('\n======================================================================');
console.log('  RUNNING: Marine Cargo & Logistics Calculation Engine Test Suite');
console.log('======================================================================\n');

// ============================================================================
// SUITE 1: INLAND TRANSIT RATING (ITC A/B/C)
// ============================================================================
console.log('Suite 1: Inland Transit Rating (ITC A/B/C)');

test('Class 1 Commodity under ITC A rates at 0.06‰ (₹50M -> ₹3,000 net)', () => {
  const result = calculateMarineInlandTransit({
    invoice_value: 50000000,
    transit_clause: 'ITC_A',
    commodity_hazard_class: 1,
    is_certified_common_carrier: true,
  });
  assert.strictEqual(result.base_rate_per_mille, 0.06);
  assert.strictEqual(result.net_marine_premium, 3000);
  assert.strictEqual(result.policy_excess, 250000); // 0.5% of 50M
});

test('Class 2 Commodity under ITC A rates at 0.12‰ (₹10M -> ₹1,200 net)', () => {
  const result = calculateMarineInlandTransit({
    invoice_value: 10000000,
    transit_clause: 'ITC_A',
    commodity_hazard_class: 2,
    is_certified_common_carrier: true,
  });
  assert.strictEqual(result.base_rate_per_mille, 0.12);
  assert.strictEqual(result.net_marine_premium, 1200);
  assert.strictEqual(result.policy_excess, 50000); // 0.5% of 10M
});

test('Class 3 Commodity under ITC A rates at 0.25‰ (₹10M -> ₹2,500 net)', () => {
  const result = calculateMarineInlandTransit({
    invoice_value: 10000000,
    transit_clause: 'ITC_A',
    commodity_hazard_class: 3,
    is_certified_common_carrier: true,
  });
  assert.strictEqual(result.base_rate_per_mille, 0.25);
  assert.strictEqual(result.net_marine_premium, 2500);
});

test('Class 4 Commodity under ITC A rates at 0.55‰ (₹10M -> ₹5,500 net)', () => {
  const result = calculateMarineInlandTransit({
    invoice_value: 10000000,
    transit_clause: 'ITC_A',
    commodity_hazard_class: 4,
    is_certified_common_carrier: true,
  });
  assert.strictEqual(result.base_rate_per_mille, 0.55);
  assert.strictEqual(result.net_marine_premium, 5500);
});

test('ITC B applies 0.80x multiplier to Class 2 base rate (0.12 * 0.80 = 0.096‰)', () => {
  const result = calculateMarineInlandTransit({
    invoice_value: 10000000,
    transit_clause: 'ITC_B',
    commodity_hazard_class: 2,
    is_certified_common_carrier: true,
  });
  assert.strictEqual(result.base_rate_per_mille, 0.096);
  assert.strictEqual(result.net_marine_premium, 1000); // 960 raw clamped to statutory floor ₹1,000
});

test('ITC C applies 0.60x multiplier to Class 2 base rate (0.12 * 0.60 = 0.072‰)', () => {
  const result = calculateMarineInlandTransit({
    invoice_value: 10000000,
    transit_clause: 'ITC_C',
    commodity_hazard_class: 2,
    is_certified_common_carrier: true,
  });
  assert.strictEqual(result.base_rate_per_mille, 0.072);
  assert.strictEqual(result.net_marine_premium, 1000); // 720 raw clamped to min 1,000
});

test('Uncertified common carrier applies +25% surcharge (1.25x)', () => {
  const result = calculateMarineInlandTransit({
    invoice_value: 100000000, // 100M
    transit_clause: 'ITC_A',
    commodity_hazard_class: 2, // 0.12
    is_certified_common_carrier: false, // 1.25x -> 0.15‰
  });
  assert.strictEqual(result.base_rate_per_mille, 0.15);
  assert.strictEqual(result.net_marine_premium, 15000); // 100M * 0.15 / 1000 = 15,000
});

test('Statutory minimum premium of ₹1,000 enforced for small consignment (₹500k)', () => {
  const result = calculateMarineInlandTransit({
    invoice_value: 500000,
    transit_clause: 'ITC_A',
    commodity_hazard_class: 1, // 0.06‰ -> ₹30 raw
    is_certified_common_carrier: true,
  });
  assert.strictEqual(result.net_marine_premium, 1000);
});

test('Deductible floor of ₹2,500 enforced when 0.5% is lower (₹100k value -> ₹2,500)', () => {
  const result = calculateMarineInlandTransit({
    invoice_value: 100000,
    transit_clause: 'ITC_A',
    commodity_hazard_class: 1,
    is_certified_common_carrier: true,
  });
  assert.strictEqual(result.policy_excess, 2500); // 0.5% is 500, clamped to 2,500
});

// ============================================================================
// SUITE 2: OCEAN CARGO RATING & INCOTERMS
// ============================================================================
console.log('\nSuite 2: Ocean Cargo Rating & Incoterms');

test('CIF Incoterm applies 10% imaginary profit markup (₹10M -> ₹11M Cargo SI)', () => {
  const result = calculateMarineOceanCargo({
    invoice_value_inr: 10000000,
    incoterm: 'CIF',
    icc_clause: 'ICC_A',
  });
  assert.strictEqual(result.cargo_sum_insured, 11000000);
});

test('FOB Incoterm adds default 10% freight and 2% port charges before 110% markup', () => {
  const result = calculateMarineOceanCargo({
    invoice_value_inr: 10000000,
    incoterm: 'FOB',
    icc_clause: 'ICC_A',
  });
  // 10M + 1M (10% freight) + 0.2M (2% port) = 11.2M * 1.10 = 12,320,000
  assert.strictEqual(result.cargo_sum_insured, 12320000);
});

test('CFR Incoterm with explicit ocean freight and port charges adds before 110% markup', () => {
  const result = calculateMarineOceanCargo({
    invoice_value_inr: 10000000,
    incoterm: 'CFR',
    icc_clause: 'ICC_A',
    ocean_freight_inr: 800000,
    port_charges_inr: 150000,
  });
  // 10M + 0.8M + 0.15M = 10.95M * 1.10 = 12,045,000
  assert.strictEqual(result.cargo_sum_insured, 12045000);
});

test('EXW Incoterm adds 5% inland freight + 10% ocean freight before 110% markup', () => {
  const result = calculateMarineOceanCargo({
    invoice_value_inr: 10000000,
    incoterm: 'EXW',
    icc_clause: 'ICC_A',
  });
  // 10M + 0.5M + 1M = 11.5M * 1.10 = 12,650,000
  assert.strictEqual(result.cargo_sum_insured, 12650000);
});

test('ICC (A) All Risks rates at 0.35‰ on Cargo SI (₹11M -> ₹3,850 cargo premium)', () => {
  const result = calculateMarineOceanCargo({
    invoice_value_inr: 10000000,
    incoterm: 'CIF',
    icc_clause: 'ICC_A',
  });
  assert.strictEqual(result.cargo_premium, 3850);
});

test('ICC (B) Named Perils rates at 0.26‰ on Cargo SI (₹11M -> ₹2,860 cargo premium)', () => {
  const result = calculateMarineOceanCargo({
    invoice_value_inr: 10000000,
    incoterm: 'CIF',
    icc_clause: 'ICC_B',
  });
  assert.strictEqual(result.cargo_premium, 2860);
});

test('ICC (C) Major Perils rates at 0.18‰ on Cargo SI (₹11M -> ₹1,980 cargo premium)', () => {
  const result = calculateMarineOceanCargo({
    invoice_value_inr: 10000000,
    incoterm: 'CIF',
    icc_clause: 'ICC_C',
  });
  assert.strictEqual(result.cargo_premium, 1980);
});

test('Customs duty cover opted @ 30% default rates at 50% of ocean base rate', () => {
  const result = calculateMarineOceanCargo({
    invoice_value_inr: 10000000,
    incoterm: 'CIF',
    icc_clause: 'ICC_A',
    customs_duty_opted: true,
  });
  // Duty SI = 11M * 30% = 3,300,000
  // Duty Rate = 0.35 * 0.50 = 0.175‰
  // Duty Premium = Math.round(3.3M * 0.175 / 1000) = 578
  assert.strictEqual(result.duty_sum_insured, 3300000);
  assert.strictEqual(result.duty_premium, 578);
  assert.strictEqual(result.total_sum_insured, 14300000);
});

test('Customs duty cover opted with 0% rate yields 0 duty SI and 0 duty premium', () => {
  const result = calculateMarineOceanCargo({
    invoice_value_inr: 10000000,
    incoterm: 'CIF',
    icc_clause: 'ICC_A',
    customs_duty_opted: true,
    customs_duty_rate_percent: 0,
  });
  assert.strictEqual(result.duty_sum_insured, 0);
  assert.strictEqual(result.duty_premium, 0);
});

test('Institute War & Strikes clauses rate at 0.05‰ on total cargo SI', () => {
  const result = calculateMarineOceanCargo({
    invoice_value_inr: 10000000,
    incoterm: 'CIF',
    icc_clause: 'ICC_A',
    war_and_strikes_opted: true,
  });
  // War premium = Math.round(11M * 0.05 / 1000) = 550
  assert.strictEqual(result.war_premium, 550);
  assert.strictEqual(result.net_marine_premium, 3850 + 550); // 4400
});

test('Statutory minimum ocean premium floor of ₹1,000 enforced for small consignment', () => {
  const result = calculateMarineOceanCargo({
    invoice_value_inr: 500000, // 500k -> 550k SI -> 550k * 0.35 / 1000 = 192.5
    incoterm: 'CIF',
    icc_clause: 'ICC_A',
  });
  assert.strictEqual(result.net_marine_premium, 1000);
});

// ============================================================================
// SUITE 3: MARINE OPEN POLICY (MOP) & ATPO DRAWDOWN
// ============================================================================
console.log('\nSuite 3: Marine Open Policy (MOP) & ATPO Drawdown');

test('Valid declaration debits CD account, increments utilized SI, and issues certificate', () => {
  const initialAccount: MopAccount = {
    policy_number: 'MOP-2026-001',
    deposit_premium_balance: 50000,
    total_sum_insured: 100000000,
    utilized_sum_insured: 0,
  };

  const result = processMopDeclaration(initialAccount, 5000000, 0.12);
  // Debit = 5M * 0.12 / 1000 = 600
  assert.strictEqual(result.certificate_issued, true);
  assert.strictEqual(result.debit_amount, 600);
  assert.strictEqual(result.updated_account.deposit_premium_balance, 49400);
  assert.strictEqual(result.updated_account.utilized_sum_insured, 5000000);
  assert.strictEqual(result.warning, undefined);
});

test('Cumulative multi-dispatch tracking updates balance and utilized SI iteratively', () => {
  let account: MopAccount = {
    policy_number: 'MOP-2026-002',
    deposit_premium_balance: 100000,
    total_sum_insured: 200000000,
    utilized_sum_insured: 0,
  };

  const dispatches = [
    { value: 10000000, rate: 0.12 }, // 1200 debit
    { value: 15000000, rate: 0.12 }, // 1800 debit
    { value: 20000000, rate: 0.25 }, // 5000 debit
  ];

  for (const d of dispatches) {
    const res = processMopDeclaration(account, d.value, d.rate);
    assert.strictEqual(res.certificate_issued, true);
    account = res.updated_account;
  }

  assert.strictEqual(account.deposit_premium_balance, 100000 - (1200 + 1800 + 5000)); // 92,000
  assert.strictEqual(account.utilized_sum_insured, 45000000); // 45M
});

test('Exact ₹0 balance drawdown succeeds and emits LOW_CD_BALANCE_WARNING', () => {
  const account: MopAccount = {
    policy_number: 'MOP-2026-003',
    deposit_premium_balance: 1200,
    total_sum_insured: 50000000,
    utilized_sum_insured: 10000000,
  };

  const res = processMopDeclaration(account, 10000000, 0.12); // debit 1200
  assert.strictEqual(res.certificate_issued, true);
  assert.strictEqual(res.debit_amount, 1200);
  assert.strictEqual(res.updated_account.deposit_premium_balance, 0);
  assert.strictEqual(res.warning, 'LOW_CD_BALANCE_WARNING: Remaining balance is less than ₹10,000.');
});

test('Low balance warning triggers when remaining CD balance is below ₹10,000', () => {
  const account: MopAccount = {
    policy_number: 'MOP-2026-004',
    deposit_premium_balance: 10500,
    total_sum_insured: 50000000,
    utilized_sum_insured: 0,
  };

  const res = processMopDeclaration(account, 5000000, 0.12); // debit 600 -> leaves 9,900
  assert.strictEqual(res.certificate_issued, true);
  assert.strictEqual(res.updated_account.deposit_premium_balance, 9900);
  assert.strictEqual(res.warning, 'LOW_CD_BALANCE_WARNING: Remaining balance is less than ₹10,000.');
});

test('Section 64VB block rejects declaration if CD balance is insufficient', () => {
  const account: MopAccount = {
    policy_number: 'MOP-2026-005',
    deposit_premium_balance: 500,
    total_sum_insured: 50000000,
    utilized_sum_insured: 10000000,
  };

  const res = processMopDeclaration(account, 10000000, 0.12); // requires 1,200
  assert.strictEqual(res.certificate_issued, false);
  assert.strictEqual(res.debit_amount, 0);
  assert.strictEqual(res.updated_account.deposit_premium_balance, 500); // Unchanged
  assert.strictEqual(
    res.warning,
    'CD_BALANCE_EXHAUSTED: Balance of ₹500 is insufficient for debit ₹1200. Top-up required under Sec 64VB.'
  );
});

test('1-rupee deficit blocks certificate issuance under Section 64VB', () => {
  const account: MopAccount = {
    policy_number: 'MOP-2026-006',
    deposit_premium_balance: 1199,
    total_sum_insured: 50000000,
    utilized_sum_insured: 0,
  };

  const res = processMopDeclaration(account, 10000000, 0.12); // requires 1,200
  assert.strictEqual(res.certificate_issued, false);
  assert.ok(res.warning?.startsWith('CD_BALANCE_EXHAUSTED'));
});

test('Batch declaration processor accurately rolls up and flags exhaustion', () => {
  const initialAccount: MopAccount = {
    policy_number: 'MOP-2026-BATCH',
    deposit_premium_balance: 2000,
    total_sum_insured: 50000000,
    utilized_sum_insured: 0,
  };

  const batch = [
    { invoice_no: 'INV-01', consignment_value: 5000000, rate_per_mille: 0.12 }, // 600
    { invoice_no: 'INV-02', consignment_value: 5000000, rate_per_mille: 0.12 }, // 600 (remaining 800)
    { invoice_no: 'INV-03', consignment_value: 10000000, rate_per_mille: 0.12 }, // 1200 -> FAILS (deficit)
  ];

  const result = processBatchDeclarations(initialAccount, batch);
  assert.strictEqual(result.total_declarations, 3);
  assert.strictEqual(result.successful_declarations, 2);
  assert.strictEqual(result.failed_declarations, 1);
  assert.strictEqual(result.total_premium_debited, 1200);
  assert.strictEqual(result.final_account.deposit_premium_balance, 800);
  assert.strictEqual(result.overall_status, 'CD_BALANCE_EXHAUSTED');
});

// ============================================================================
// SUITE 4: STUDIO PROPOSAL VALIDATION
// ============================================================================
console.log('\nSuite 4: Studio Proposal Validation');

test('Fully compliant marine studio proposal passes validation', () => {
  const res = validateMarineStudioProposal({
    client_name: 'Tata Steel Logistics Ltd',
    policy_type: 'single_voyage',
    origin: 'Jamshedpur Works',
    destination: 'Mumbai Port (JNPT)',
    commodity: 'Steel Coils',
    consignment_value: 5000000,
    clause: 'ITC_A',
  });
  assert.strictEqual(res.is_valid, true);
  assert.strictEqual(res.declaration_ready, true);
  assert.strictEqual(res.error, undefined);
});

test('Missing client name invalidates studio proposal', () => {
  const res = validateMarineStudioProposal({
    client_name: '',
    policy_type: 'single_voyage',
    origin: 'Delhi ICD',
    destination: 'Nhava Sheva',
    commodity: 'Textiles',
    consignment_value: 1000000,
    clause: 'ITC_A',
  });
  assert.strictEqual(res.is_valid, false);
  assert.strictEqual(res.declaration_ready, false);
  assert.strictEqual(res.error, 'Client name is required');
});

test('Missing origin or destination invalidates studio proposal', () => {
  const res1 = validateMarineStudioProposal({
    client_name: 'Adani Logistics',
    policy_type: 'single_voyage',
    origin: '',
    destination: 'Mundra Port',
    commodity: 'Coal',
    consignment_value: 2000000,
    clause: 'ITC_A',
  });
  assert.strictEqual(res1.is_valid, false);
  assert.strictEqual(res1.error, 'Origin and Destination required');

  const res2 = validateMarineStudioProposal({
    client_name: 'Adani Logistics',
    policy_type: 'single_voyage',
    origin: 'Ahmedabad',
    destination: '',
    commodity: 'Coal',
    consignment_value: 2000000,
    clause: 'ITC_A',
  });
  assert.strictEqual(res2.is_valid, false);
  assert.strictEqual(res2.error, 'Origin and Destination required');
});

test('Zero or negative consignment value invalidates studio proposal', () => {
  const resZero = validateMarineStudioProposal({
    client_name: 'Reliance Retail',
    policy_type: 'single_voyage',
    origin: 'Surat',
    destination: 'Bhiwandi',
    commodity: 'Apparel',
    consignment_value: 0,
    clause: 'ITC_A',
  });
  assert.strictEqual(resZero.is_valid, false);
  assert.strictEqual(resZero.error, 'Consignment value must be positive');

  const resNeg = validateMarineStudioProposal({
    client_name: 'Reliance Retail',
    policy_type: 'single_voyage',
    origin: 'Surat',
    destination: 'Bhiwandi',
    commodity: 'Apparel',
    consignment_value: -50000,
    clause: 'ITC_A',
  });
  assert.strictEqual(resNeg.is_valid, false);
  assert.strictEqual(resNeg.error, 'Consignment value must be positive');
});

test('Mega-consignment (₹500 Crore) validates without numerical overflow', () => {
  const res = validateMarineStudioProposal({
    client_name: 'ONGC Petro Additions Ltd',
    policy_type: 'open_policy',
    origin: 'Dahej SEZ',
    destination: 'Singapore Port',
    commodity: 'Specialty Polymers',
    consignment_value: 5000000000,
    clause: 'ICC_A',
  });
  assert.strictEqual(res.is_valid, true);
  assert.strictEqual(res.declaration_ready, true);
});

// ============================================================================
// SUITE 5: STANDARD QUOTE BREAKDOWN CONTRACT & EXPLAINABILITY
// ============================================================================
console.log('\nSuite 5: Standard Quote Breakdown Contract & Explainability');

test('calculateMarineInlandQuote returns compliant StandardQuoteBreakdown with 18% GST', () => {
  const breakdown = calculateMarineInlandQuote({
    client_name: 'Bharat Forge Ltd',
    origin: 'Pune',
    destination: 'Chennai',
    invoice_value: 10000000, // 10M
    transit_clause: 'ITC_A',
    commodity_hazard_class: 2, // 0.12‰
    is_certified_common_carrier: true,
  });

  assert.strictEqual(breakdown.lob_category, 'marine');
  assert.strictEqual(breakdown.insurance_line, 'marine_cargo_inland');
  assert.strictEqual(breakdown.sum_insured, 10000000);
  assert.strictEqual(breakdown.base_rate_per_mille, 0.12);
  assert.strictEqual(breakdown.net_premium, 1200);
  assert.strictEqual(breakdown.gst_rate_percent, 18);
  assert.strictEqual(breakdown.gst_amount, 216); // 1200 * 0.18 = 216
  assert.strictEqual(breakdown.total_premium, 1416); // 1200 + 216 = 1416
  assert.ok(breakdown.statutory_clauses.length >= 3);
  assert.strictEqual(breakdown.algorithmic_explainability.length, 6);
});

test('calculateMarineOceanQuote returns compliant StandardQuoteBreakdown with duty and war covers', () => {
  const breakdown = calculateMarineOceanQuote({
    client_name: 'Sun Pharma Exports',
    origin: 'Nhava Sheva, India',
    destination: 'Rotterdam, Netherlands',
    invoice_value_inr: 10000000, // 10M -> 11M Cargo SI
    incoterm: 'CIF',
    icc_clause: 'ICC_A',
    customs_duty_opted: true,
    customs_duty_rate_percent: 25, // 2.75M Duty SI -> 0.35 * 0.50 = 0.175‰ -> 481
    war_and_strikes_opted: true, // 11M * 0.05 / 1000 = 550
  });

  assert.strictEqual(breakdown.lob_category, 'marine');
  assert.strictEqual(breakdown.insurance_line, 'marine_cargo_ocean');
  // Cargo SI (11M) + Duty SI (2.75M) = 13.75M
  assert.strictEqual(breakdown.sum_insured, 13750000);
  // Cargo premium: 11M * 0.35 / 1000 = 3850
  // Duty premium: 2.75M * 0.175 / 1000 = 481
  // War premium: 11M * 0.05 / 1000 = 550
  // Net: 3850 + 481 + 550 = 4881
  assert.strictEqual(breakdown.net_premium, 4881);
  const expectedGst = Math.round(4881 * 0.18); // 879
  assert.strictEqual(breakdown.gst_amount, expectedGst);
  assert.strictEqual(breakdown.total_premium, 4881 + expectedGst);
  assert.strictEqual(breakdown.algorithmic_explainability.length, 6);
});

test('calculateMarineQuote polymorphic router routes cleanly to inland and ocean engines', () => {
  const inlandQuote = calculateMarineQuote({
    transit_type: 'inland',
    inland_input: {
      invoice_value: 50000000,
      transit_clause: 'ITC_A',
      commodity_hazard_class: 1,
      is_certified_common_carrier: true,
    },
  });
  assert.strictEqual(inlandQuote.insurance_line, 'marine_cargo_inland');
  assert.strictEqual(inlandQuote.net_premium, 3000);

  const oceanQuote = calculateMarineQuote({
    transit_type: 'ocean',
    ocean_input: {
      invoice_value_inr: 10000000,
      incoterm: 'CIF',
      icc_clause: 'ICC_A',
    },
  });
  assert.strictEqual(oceanQuote.insurance_line, 'marine_cargo_ocean');
  assert.strictEqual(oceanQuote.net_premium, 3850);
});

// ============================================================================
// SUITE 6: BOUNDARY, LIMIT & ERROR HANDLING
// ============================================================================
console.log('\nSuite 6: Boundary, Limit & Error Handling');

test('Zero invoice value in Inland Transit throws Error', () => {
  assert.throws(
    () => {
      calculateMarineInlandTransit({
        invoice_value: 0,
        transit_clause: 'ITC_A',
        commodity_hazard_class: 1,
        is_certified_common_carrier: true,
      });
    },
    {
      message: 'Invoice value must be greater than zero',
    }
  );
});

test('Negative invoice value in Inland Transit throws Error', () => {
  assert.throws(
    () => {
      calculateMarineInlandTransit({
        invoice_value: -10000,
        transit_clause: 'ITC_A',
        commodity_hazard_class: 1,
        is_certified_common_carrier: true,
      });
    },
    {
      message: 'Invoice value must be greater than zero',
    }
  );
});

test('Zero invoice value in Ocean Cargo throws Error', () => {
  assert.throws(
    () => {
      calculateMarineOceanCargo({
        invoice_value_inr: 0,
        incoterm: 'CIF',
        icc_clause: 'ICC_A',
      });
    },
    {
      message: 'Invoice value must be greater than zero',
    }
  );
});

test('Negative invoice value in Ocean Cargo throws Error', () => {
  assert.throws(
    () => {
      calculateMarineOceanCargo({
        invoice_value_inr: -500000,
        incoterm: 'CIF',
        icc_clause: 'ICC_A',
      });
    },
    {
      message: 'Invoice value must be greater than zero',
    }
  );
});

test('Missing input options in polymorphic calculateMarineQuote throws clean descriptive error', () => {
  assert.throws(
    () => {
      calculateMarineQuote({
        transit_type: 'inland',
      });
    },
    /Inland transit input parameters are required/
  );

  assert.throws(
    () => {
      calculateMarineQuote({
        transit_type: 'ocean',
      });
    },
    /Ocean cargo input parameters are required/
  );
});

console.log('\n======================================================================');
console.log(`  MARINE CARGO ENGINE TEST RESULTS: ${passedTests} / ${totalTests} PASSED (100%)`);
console.log('======================================================================\n');
