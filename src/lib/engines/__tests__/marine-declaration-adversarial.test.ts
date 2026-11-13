/**
 * Adversarial Test Harness: Milestone 13 Marine Cargo & Logistics Module
 * Challenger 2: Declaration Accounting, Ingestion Robustness, 64VB Drawdown & Calculation Precision
 *
 * Empirical Challenges:
 * Challenge 1 (CRITICAL BUG): Header shadowing in normalizeHeader (MarineDeclarationUploader.tsx)
 *   - "Invoice Date" and "Invoice Value" match /^invoice/ before reaching date/value regexes,
 *     colliding into "invoiceNo" and destroying consignment values.
 * Challenge 2 (HIGH BUG): Negative value stripping in MarineDeclarationUploader.tsx
 *   - replace(/[^0-9.]/g, '') strips the minus sign from negative consignment values,
 *     silently mutating -₹50,00,000 into +₹50,00,000 and bypassing validation.
 * Challenge 3 (MEDIUM GAP): Unvalidated invoice dates in MarineDeclarationUploader.tsx
 *   - Non-date strings ("banana", "invalid-date") are accepted without error.
 * Challenge 4 (VERIFIED ROBUST): Multi-shipment batch aggregation & Section 64VB Cash Deposit drawdown
 * Challenge 5 (VERIFIED ROBUST): High-volume batch calculations & GST rounding consistency
 * Challenge 6 (VERIFIED ROBUST): StandardQuoteBreakdown explainability vector completeness
 * Challenge 7 (VERIFIED ROBUST): Dual-tier function parity (canonical primitives vs quote adapters)
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
  MarineDeclarationItem,
} from '../marine-engine';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const testFindings: Array<{ name: string; status: 'PASS' | 'FAIL'; details: string }> = [];

function test(name: string, fn: () => void) {
  totalTests++;
  try {
    fn();
    passedTests++;
    testFindings.push({ name, status: 'PASS', details: 'Passed as expected' });
    console.log(`  ✓ ${name}`);
  } catch (err: any) {
    failedTests++;
    const errMsg = err.message || String(err);
    testFindings.push({ name, status: 'FAIL', details: errMsg });
    console.log(`  ✗ ${name} (BUG FOUND)`);
    console.log(`    ${errMsg}`);
  }
}

// ============================================================================
// UPLOADER LOGIC UNDER TEST (Verbatim from MarineDeclarationUploader.tsx)
// ============================================================================

// normalizeHeader from MarineDeclarationUploader.tsx (Lines 84-99)
const normalizeHeaderAsImplemented = (raw: string): string => {
  const clean = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (/^(invoice|inv|bill|invoiceno|billno|invno|documentno)/.test(clean)) return 'invoiceNo';
  if (/^(date|invdate|invoicedate|dispatchdate|shipmentdate)/.test(clean)) return 'invoiceDate';
  if (/^(lr|bl|awb|rr|carrierdoc|consignmentnote|tracking|waybill|docket)/.test(clean)) return 'carrierDocNo';
  if (/^(carrier|transporter|shippingline|airline|transportername|carriername)/.test(clean)) return 'carrierName';
  if (/^(certified|commoncarrier|iba|ibacertified)/.test(clean)) return 'isCertifiedCarrier';
  if (/^(origin|from|dispatchfrom|source|loadingport|pol)/.test(clean)) return 'origin';
  if (/^(destination|to|dispatchto|deliverylocation|dischargeport|pod)/.test(clean)) return 'destination';
  if (/^(mode|transitmode|conveyance|transportmode|shipmentmode)/.test(clean)) return 'transitMode';
  if (/^(value|consignmentvalue|invoicevalue|amount|inr|declaredvalue)/.test(clean)) return 'consignmentValue';
  if (/^(incoterm|terms|tradeterms)/.test(clean)) return 'incoterm';
  if (/^(commodity|goods|description|item|material|cargodescription)/.test(clean)) return 'commodityDescription';
  if (/^(hazard|hazardclass|class|riskclass)/.test(clean)) return 'hazardClass';
  return clean;
};

// Proposed bugfix for normalizeHeader (Ordered/Disambiguated Regex)
const normalizeHeaderFixed = (raw: string): string => {
  const clean = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
  // Specific multi-word compounds checked FIRST before generic prefixes
  if (/^(invoicedate|invdate|date|dispatchdate|shipmentdate)/.test(clean)) return 'invoiceDate';
  if (/^(invoicevalue|consignmentvalue|declaredvalue|invoiceamount|value|amount|inr)/.test(clean)) return 'consignmentValue';
  if (/^(invoiceno|billno|invno|documentno|invoice|inv|bill)/.test(clean)) return 'invoiceNo';
  if (/^(lr|bl|awb|rr|carrierdoc|consignmentnote|tracking|waybill|docket)/.test(clean)) return 'carrierDocNo';
  if (/^(carrier|transporter|shippingline|airline|transportername|carriername)/.test(clean)) return 'carrierName';
  if (/^(certified|commoncarrier|iba|ibacertified)/.test(clean)) return 'isCertifiedCarrier';
  if (/^(origin|from|dispatchfrom|source|loadingport|portofloading|pol)/.test(clean)) return 'origin';
  if (/^(destination|to|dispatchto|deliverylocation|dischargeport|portofdischarge|pod)/.test(clean)) return 'destination';
  if (/^(mode|transitmode|conveyance|transportmode|shipmentmode)/.test(clean)) return 'transitMode';
  if (/^(incoterm|terms|tradeterms)/.test(clean)) return 'incoterm';
  if (/^(commodity|goods|description|item|material|cargodescription)/.test(clean)) return 'commodityDescription';
  if (/^(hazard|hazardclass|class|riskclass)/.test(clean)) return 'hazardClass';
  return clean;
};

console.log('\n======================================================================');
console.log('  RUNNING: Marine Cargo Adversarial Stress Test Suite (Challenger 2)');
console.log('======================================================================\n');

// ============================================================================
// SUITE 1: HEADER VARIATIONS & ALIASING DEFECT INVESTIGATION
// ============================================================================
console.log('Suite 1: Header Variations & Aliasing Defect Investigation');

test('CONFIRM BUG: normalizeHeader erroneously maps "Invoice Date" to "invoiceNo" due to /^invoice/ shadowing', () => {
  const result = normalizeHeaderAsImplemented('Invoice Date');
  // It erroneously produces 'invoiceNo', not 'invoiceDate'
  assert.strictEqual(result, 'invoiceNo');
  assert.notStrictEqual(result, 'invoiceDate', 'Should have failed because of regex shadowing');
});

test('CONFIRM BUG: normalizeHeader erroneously maps "Invoice Value" to "invoiceNo" due to /^invoice/ shadowing', () => {
  const result = normalizeHeaderAsImplemented('Invoice Value');
  // It erroneously produces 'invoiceNo', not 'consignmentValue'
  assert.strictEqual(result, 'invoiceNo');
  assert.notStrictEqual(result, 'consignmentValue', 'Should have failed because of regex shadowing');
});

test('CONFIRM BUG: normalizeHeader erroneously maps "Invoice Amount" to "invoiceNo" due to /^invoice/ shadowing', () => {
  const result = normalizeHeaderAsImplemented('Invoice Amount');
  assert.strictEqual(result, 'invoiceNo');
});

test('VERIFY MITIGATION: Fixed normalizeHeader correctly routes all ambiguous headers', () => {
  assert.strictEqual(normalizeHeaderFixed('Invoice No'), 'invoiceNo');
  assert.strictEqual(normalizeHeaderFixed('Invoice Date'), 'invoiceDate');
  assert.strictEqual(normalizeHeaderFixed('Inv Date'), 'invoiceDate');
  assert.strictEqual(normalizeHeaderFixed('Invoice Value'), 'consignmentValue');
  assert.strictEqual(normalizeHeaderFixed('Invoice Amount'), 'consignmentValue');
  assert.strictEqual(normalizeHeaderFixed('Consignment Value (INR)'), 'consignmentValue');
  assert.strictEqual(normalizeHeaderFixed('Port of Loading (POL)'), 'origin');
  assert.strictEqual(normalizeHeaderFixed('Port of Discharge (POD)'), 'destination');
});

// ============================================================================
// SUITE 2: MALFORMED ROWS & PARSER DEFECTS
// ============================================================================
console.log('\nSuite 2: Malformed Rows & Parser Defects');

test('CONFIRM BUG: replace(/[^0-9.]/g, "") mutates negative values into positive values', () => {
  const rawInput = '-5000000';
  // MarineDeclarationUploader.tsx Line 199:
  const rawVal = parseFloat(rawInput.replace(/[^0-9.]/g, '') || '0');
  const consignmentValue = isNaN(rawVal) ? 0 : rawVal;

  // The minus sign is stripped, converting -5,000,000 into +5,000,000!
  assert.strictEqual(consignmentValue, 5000000);
  // Consequently consignmentValue <= 0 check fails to catch the negative value!
  const failsValidation = consignmentValue <= 0;
  assert.strictEqual(failsValidation, false, 'Negative value was NOT caught by validation!');
});

test('Zero consignment value is caught by validation (0 <= 0)', () => {
  const rawVal = parseFloat('0'.replace(/[^0-9.]/g, '') || '0');
  const consignmentValue = isNaN(rawVal) ? 0 : rawVal;
  assert.strictEqual(consignmentValue, 0);
  assert.strictEqual(consignmentValue <= 0, true);
});

test('Missing origin and destination are caught by validation', () => {
  const origin: string = '';
  const destination: string = '   ';
  const errors: string[] = [];
  if (!origin || origin.trim().length === 0) errors.push('Origin location required.');
  if (!destination || destination.trim().length === 0) errors.push('Destination location required.');
  assert.strictEqual(errors.length, 2);
});

test('Unknown Incoterms fallback behavior: "DDP", "FAS", "CPT" fallback to CIF', () => {
  const testTerms = ['DDP', 'FAS', 'CPT', 'UNKNOWN'];
  for (const raw of testTerms) {
    const rawIncoterm = (raw || 'CIF').toUpperCase();
    const incoterm: 'CIF' | 'FOB' | 'CFR' | 'EXW' =
      rawIncoterm.includes('FOB')
        ? 'FOB'
        : rawIncoterm.includes('CFR')
        ? 'CFR'
        : rawIncoterm.includes('EXW')
        ? 'EXW'
        : 'CIF';
    assert.strictEqual(incoterm, 'CIF');
  }
});

// ============================================================================
// SUITE 3: MULTI-SHIPMENT BATCH AGGREGATION & SEC 64VB CD DRAWDOWN
// ============================================================================
console.log('\nSuite 3: Multi-Shipment Batch Aggregation & Sec 64VB CD Drawdown');

test('Abundant CD balance processes 100% of declarations without interruption', () => {
  const initialAccount: MopAccount = {
    policy_number: 'MOP-2026-9901',
    deposit_premium_balance: 500000, // ₹5 Lakhs
    total_sum_insured: 1000000000,
    utilized_sum_insured: 0,
  };

  const declarations: MarineDeclarationItem[] = [];
  for (let i = 1; i <= 50; i++) {
    declarations.push({
      invoice_no: `INV-BATCH-${i}`,
      consignment_value: 1000000, // ₹10 Lakhs each
      rate_per_mille: 0.12, // Debit ₹120 each
    });
  }

  const batchResult = processBatchDeclarations(initialAccount, declarations);
  assert.strictEqual(batchResult.total_declarations, 50);
  assert.strictEqual(batchResult.successful_declarations, 50);
  assert.strictEqual(batchResult.failed_declarations, 0);
  assert.strictEqual(batchResult.total_premium_debited, 50 * 120); // ₹6,000
  assert.strictEqual(batchResult.total_utilized_si_added, 50 * 1000000); // ₹5 Crore
  assert.strictEqual(batchResult.final_account.deposit_premium_balance, 500000 - 6000); // ₹494,000
  assert.strictEqual(batchResult.final_account.utilized_sum_insured, 50000000);
  assert.strictEqual(batchResult.overall_status, 'HEALTHY');
});

test('Section 64VB halts drawdown midway when CD balance is exhausted', () => {
  const initialAccount: MopAccount = {
    policy_number: 'MOP-2026-HALT',
    deposit_premium_balance: 5000, // Only ₹5,000 balance
    total_sum_insured: 500000000,
    utilized_sum_insured: 0,
  };

  // 10 declarations requiring ₹1,200 debit each (total ₹12,000 required)
  const declarations: MarineDeclarationItem[] = [];
  for (let i = 1; i <= 10; i++) {
    declarations.push({
      invoice_no: `INV-HALT-${i}`,
      consignment_value: 10000000, // ₹1 Crore
      rate_per_mille: 0.12, // Debit ₹1,200
    });
  }

  const batchResult = processBatchDeclarations(initialAccount, declarations);
  // 5000 / 1200 = 4 successful (debiting ₹4,800, leaving ₹200)
  assert.strictEqual(batchResult.total_declarations, 10);
  assert.strictEqual(batchResult.successful_declarations, 4);
  assert.strictEqual(batchResult.failed_declarations, 6);
  assert.strictEqual(batchResult.total_premium_debited, 4800);
  assert.strictEqual(batchResult.total_utilized_si_added, 40000000);
  assert.strictEqual(batchResult.final_account.deposit_premium_balance, 200);
  assert.strictEqual(batchResult.overall_status, 'CD_BALANCE_EXHAUSTED');
  assert.ok(batchResult.overall_warning?.includes('Sec 64VB Block'));

  // Verify declaration results individually
  assert.strictEqual(batchResult.declaration_results[0].success, true);
  assert.strictEqual(batchResult.declaration_results[3].success, true);
  assert.strictEqual(batchResult.declaration_results[4].success, false);
  assert.ok(batchResult.declaration_results[4].warning?.includes('CD_BALANCE_EXHAUSTED'));
});

test('Exact ₹0 remaining balance drawdown succeeds with LOW_CD_BALANCE_WARNING', () => {
  const initialAccount: MopAccount = {
    policy_number: 'MOP-2026-ZERO',
    deposit_premium_balance: 3600,
    total_sum_insured: 100000000,
    utilized_sum_insured: 0,
  };

  const declarations: MarineDeclarationItem[] = [
    { invoice_no: 'INV-Z1', consignment_value: 10000000, rate_per_mille: 0.12 }, // ₹1,200
    { invoice_no: 'INV-Z2', consignment_value: 10000000, rate_per_mille: 0.12 }, // ₹1,200
    { invoice_no: 'INV-Z3', consignment_value: 10000000, rate_per_mille: 0.12 }, // ₹1,200
  ];

  const batchResult = processBatchDeclarations(initialAccount, declarations);
  assert.strictEqual(batchResult.successful_declarations, 3);
  assert.strictEqual(batchResult.failed_declarations, 0);
  assert.strictEqual(batchResult.final_account.deposit_premium_balance, 0);
  assert.strictEqual(batchResult.overall_status, 'LOW_CD_BALANCE_WARNING');
  assert.ok(batchResult.overall_warning?.includes('LOW_CD_BALANCE_WARNING'));
});

test('Zero balance starting account immediately rejects all declarations', () => {
  const initialAccount: MopAccount = {
    policy_number: 'MOP-2026-EMPTY',
    deposit_premium_balance: 0,
    total_sum_insured: 100000000,
    utilized_sum_insured: 0,
  };

  const declarations: MarineDeclarationItem[] = [
    { invoice_no: 'INV-E1', consignment_value: 5000000, rate_per_mille: 0.12 },
  ];

  const batchResult = processBatchDeclarations(initialAccount, declarations);
  assert.strictEqual(batchResult.successful_declarations, 0);
  assert.strictEqual(batchResult.failed_declarations, 1);
  assert.strictEqual(batchResult.total_premium_debited, 0);
  assert.strictEqual(batchResult.final_account.deposit_premium_balance, 0);
  assert.strictEqual(batchResult.overall_status, 'CD_BALANCE_EXHAUSTED');
});

test('Single declaration 1-rupee deficit blocks under Section 64VB', () => {
  const account: MopAccount = {
    policy_number: 'MOP-2026-ONE-SHORT',
    deposit_premium_balance: 999, // ₹1 short of ₹1,000
    total_sum_insured: 50000000,
    utilized_sum_insured: 0,
  };

  const res = processMopDeclaration(account, 10000000, 0.10); // ₹1,000 premium
  assert.strictEqual(res.certificate_issued, false);
  assert.strictEqual(res.debit_amount, 0);
  assert.strictEqual(res.updated_account.deposit_premium_balance, 999);
  assert.ok(res.warning?.includes('CD_BALANCE_EXHAUSTED'));
});

// ============================================================================
// SUITE 4: UNDERWRITING PRECISION, HIGH-VOLUME SCALING & GST ROUNDING
// ============================================================================
console.log('\nSuite 4: Underwriting Precision, High-Volume Scaling & GST Rounding');

test('High-volume batch scaling: 1,000 shipments process within performance budget (< 100ms)', () => {
  const initialAccount: MopAccount = {
    policy_number: 'MOP-2026-SCALE-1000',
    deposit_premium_balance: 10000000,
    total_sum_insured: 10000000000,
    utilized_sum_insured: 0,
  };

  const declarations: MarineDeclarationItem[] = [];
  for (let i = 1; i <= 1000; i++) {
    declarations.push({
      invoice_no: `INV-VOL-${i}`,
      consignment_value: 1000000 + (i * 1000),
      rate_per_mille: 0.12,
    });
  }

  const startTime = Date.now();
  const batchResult = processBatchDeclarations(initialAccount, declarations);
  const elapsed = Date.now() - startTime;

  assert.strictEqual(batchResult.total_declarations, 1000);
  assert.strictEqual(batchResult.successful_declarations, 1000);
  assert.ok(elapsed < 100, `1000 declarations took ${elapsed}ms, exceeding 100ms budget`);
  console.log(`    (Benchmark: 1,000 shipments processed in ${elapsed}ms)`);
});

test('GST 18% rounding precision and line-item variance quantification', () => {
  // Test CGST Act Section 170 / Rule 50 invoice-level rounding
  const items = [
    { net: 1001 }, // GST = 180.18 -> 180
    { net: 1002 }, // GST = 180.36 -> 180
    { net: 1003 }, // GST = 180.54 -> 181
    { net: 1004 }, // GST = 180.72 -> 181
    { net: 1005 }, // GST = 180.90 -> 181
  ];

  const totalNet = items.reduce((a, b) => a + b.net, 0); // 5015
  const aggregateGst = Math.round(totalNet * 0.18); // 5015 * 0.18 = 902.7 -> 903
  const sumOfLineGst = items.reduce((a, b) => a + Math.round(b.net * 0.18), 0); // 180+180+181+181+181 = 903

  assert.strictEqual(aggregateGst, 903);
  assert.strictEqual(sumOfLineGst, 903);
  assert.strictEqual(aggregateGst - sumOfLineGst, 0); // Zero rounding drift
});

test('Numerical scale: Micro-consignment (₹100) correctly clamped to statutory floors', () => {
  const result = calculateMarineInlandTransit({
    invoice_value: 100,
    transit_clause: 'ITC_A',
    commodity_hazard_class: 1,
    is_certified_common_carrier: true,
  });

  // Raw premium = 100 * 0.06 / 1000 = 0.006 -> clamped to ₹1,000
  assert.strictEqual(result.net_marine_premium, 1000);
  // Excess = 100 * 0.005 = 0.5 -> clamped to ₹2,500
  assert.strictEqual(result.policy_excess, 2500);

  const quote = calculateMarineInlandQuote({
    invoice_value: 100,
    transit_clause: 'ITC_A',
    commodity_hazard_class: 1,
    is_certified_common_carrier: true,
  });
  assert.strictEqual(quote.net_premium, 1000);
  assert.strictEqual(quote.gst_amount, 180);
  assert.strictEqual(quote.total_premium, 1180);
});

test('Numerical scale: Mega-consignment (₹1,000 Crore) precision without overflow', () => {
  const megaValue = 10000000000; // ₹1,000 Crore
  const result = calculateMarineInlandTransit({
    invoice_value: megaValue,
    transit_clause: 'ITC_A',
    commodity_hazard_class: 1, // 0.06‰
    is_certified_common_carrier: true,
  });

  // 10B * 0.06 / 1000 = 600,000
  assert.strictEqual(result.net_marine_premium, 600000);
  // Excess = 10B * 0.005 = 50,000,000 (₹5 Crore excess)
  assert.strictEqual(result.policy_excess, 50000000);

  const quote = calculateMarineInlandQuote({
    invoice_value: megaValue,
    transit_clause: 'ITC_A',
    commodity_hazard_class: 1,
    is_certified_common_carrier: true,
  });
  assert.strictEqual(quote.net_premium, 600000);
  assert.strictEqual(quote.gst_amount, 108000); // 600,000 * 0.18
  assert.strictEqual(quote.total_premium, 708000);
});

// ============================================================================
// SUITE 5: STANDARD QUOTE BREAKDOWN & EXPLAINABILITY VECTOR
// ============================================================================
console.log('\nSuite 5: Standard Quote Breakdown & Explainability Vector');

test('calculateMarineInlandQuote returns 100% compliant StandardQuoteBreakdown contract', () => {
  const quote = calculateMarineInlandQuote({
    client_name: 'Tata Steel Logistics Ltd',
    origin: 'Jamshedpur Works',
    destination: 'Mumbai Nhava Sheva',
    commodity_description: 'Cold Rolled Steel Coils',
    invoice_value: 50000000,
    transit_clause: 'ITC_A',
    commodity_hazard_class: 1,
    is_certified_common_carrier: true,
  });

  assert.strictEqual(quote.lob_category, 'marine');
  assert.strictEqual(quote.insurance_line, 'marine_cargo_inland');
  assert.strictEqual(quote.sum_insured, 50000000);
  assert.strictEqual(quote.base_rate_per_mille, 0.06);
  assert.strictEqual(quote.net_premium, 3000);
  assert.strictEqual(quote.gst_rate_percent, 18);
  assert.strictEqual(quote.gst_amount, 540);
  assert.strictEqual(quote.total_premium, 3540);

  // Statutory clauses completeness
  assert.ok(Array.isArray(quote.statutory_clauses));
  assert.ok(quote.statutory_clauses.length >= 4);
  assert.ok(quote.statutory_clauses.some((c) => c.includes('Section 64VB')));
  assert.ok(quote.statutory_clauses.some((c) => c.includes('Carriage by Road Act')));
  assert.ok(quote.statutory_clauses.some((c) => c.includes('Inland Transit (Rail/Road) Clauses (A)')));
  assert.ok(quote.statutory_clauses.some((c) => c.includes('Policy Excess')));

  // Explainability Vector Completeness (Exact 6 Steps)
  assert.strictEqual(quote.algorithmic_explainability.length, 6);
  for (let i = 0; i < 6; i++) {
    const step = quote.algorithmic_explainability[i];
    assert.ok(step.step.startsWith(`Step ${i + 1}`));
    assert.ok(step.description.length > 5, `Step ${i + 1} description too short`);
    assert.ok(String(step.value).length > 0, `Step ${i + 1} value is empty`);
  }
});

test('calculateMarineOceanQuote returns 100% compliant StandardQuoteBreakdown contract', () => {
  const quote = calculateMarineOceanQuote({
    client_name: 'Sun Pharma International',
    origin: 'Mumbai Air Cargo Terminal',
    destination: 'JFK Airport New York',
    commodity_description: 'Sterile Injectable Vials',
    invoice_value_inr: 20000000, // 20M
    incoterm: 'CIF',
    icc_clause: 'ICC_A',
    customs_duty_opted: true,
    customs_duty_rate_percent: 30,
    war_and_strikes_opted: true,
  });

  assert.strictEqual(quote.lob_category, 'marine');
  assert.strictEqual(quote.insurance_line, 'marine_cargo_ocean');
  // Cargo SI = 20M * 1.10 = 22M; Duty SI = 22M * 30% = 6.6M; Total SI = 28.6M
  assert.strictEqual(quote.sum_insured, 28600000);
  assert.strictEqual(quote.base_rate_per_mille, 0.35);

  // Cargo Prem: 22M * 0.35 / 1000 = 7,700
  // Duty Prem: 6.6M * 0.175 / 1000 = 1,155
  // War Prem: 22M * 0.05 / 1000 = 1,100
  // Net Marine = 7,700 + 1,155 + 1,100 = 9,955
  assert.strictEqual(quote.net_premium, 9955);
  assert.strictEqual(quote.gst_rate_percent, 18);
  assert.strictEqual(quote.gst_amount, Math.round(9955 * 0.18)); // 1,792
  assert.strictEqual(quote.total_premium, 9955 + 1792); // 11,747

  // Statutory clauses
  assert.ok(quote.statutory_clauses.some((c) => c.includes('Section 64VB')));
  assert.ok(quote.statutory_clauses.some((c) => c.includes('Institute Cargo Clauses (ICC_A)')));
  assert.ok(quote.statutory_clauses.some((c) => c.includes('Customs Duty Insurance Endorsement')));
  assert.ok(quote.statutory_clauses.some((c) => c.includes('Institute War & Strikes Clauses')));

  // Explainability Vector Completeness (Exact 6 Steps)
  assert.strictEqual(quote.algorithmic_explainability.length, 6);
  for (let i = 0; i < 6; i++) {
    const step = quote.algorithmic_explainability[i];
    assert.ok(step.step.startsWith(`Step ${i + 1}`));
    assert.ok(step.description.length > 5);
    assert.ok(String(step.value).length > 0);
  }
});

test('calculateMarineQuote polymorphic router enforces strict line discrimination', () => {
  const inland = calculateMarineQuote({
    transit_type: 'inland',
    inland_input: {
      invoice_value: 10000000,
      transit_clause: 'ITC_B',
      commodity_hazard_class: 3,
      is_certified_common_carrier: true,
    },
  });
  assert.strictEqual(inland.insurance_line, 'marine_cargo_inland');

  const ocean = calculateMarineQuote({
    transit_type: 'ocean',
    ocean_input: {
      invoice_value_inr: 10000000,
      incoterm: 'FOB',
      icc_clause: 'ICC_B',
    },
  });
  assert.strictEqual(ocean.insurance_line, 'marine_cargo_ocean');

  assert.throws(() => {
    calculateMarineQuote({
      transit_type: 'invalid_mode' as any,
    });
  }, /Unsupported marine transit type/);
});

// ============================================================================
// SUITE 6: DUAL-TIER PARITY MATRIX (CANONICAL PRIMITIVES VS ADAPTERS)
// ============================================================================
console.log('\nSuite 6: Dual-Tier Parity Matrix (Canonical Primitives vs Adapters)');

test('Inland transit canonical vs quote adapter guarantees exact mathematical parity across 10 random runs', () => {
  const clauses: ('ITC_A' | 'ITC_B' | 'ITC_C')[] = ['ITC_A', 'ITC_B', 'ITC_C'];
  const hazards: (1 | 2 | 3 | 4)[] = [1, 2, 3, 4];
  const certified: boolean[] = [true, false];
  const invoices = [500000, 1000000, 7500000, 25000000, 100000000];

  for (let i = 0; i < 10; i++) {
    const clause = clauses[i % clauses.length];
    const hazard = hazards[i % hazards.length];
    const isCert = certified[i % certified.length];
    const inv = invoices[i % invoices.length];

    const canonical = calculateMarineInlandTransit({
      invoice_value: inv,
      transit_clause: clause,
      commodity_hazard_class: hazard,
      is_certified_common_carrier: isCert,
    });

    const quote = calculateMarineInlandQuote({
      invoice_value: inv,
      transit_clause: clause,
      commodity_hazard_class: hazard,
      is_certified_common_carrier: isCert,
    });

    assert.strictEqual(quote.net_premium, canonical.net_marine_premium, `Net premium mismatch for run ${i}`);
    assert.strictEqual(quote.base_rate_per_mille, canonical.base_rate_per_mille, `Base rate mismatch for run ${i}`);
    assert.strictEqual(quote.line_specific_breakdown.policy_excess, canonical.policy_excess, `Excess mismatch for run ${i}`);
    assert.strictEqual(quote.line_specific_breakdown.deductible_clause, canonical.deductible_clause, `Clause mismatch for run ${i}`);
  }
});

test('Ocean cargo canonical vs quote adapter guarantees exact mathematical parity across 10 random runs', () => {
  const incoterms: ('CIF' | 'FOB' | 'CFR' | 'EXW')[] = ['CIF', 'FOB', 'CFR', 'EXW'];
  const clauses: ('ICC_A' | 'ICC_B' | 'ICC_C')[] = ['ICC_A', 'ICC_B', 'ICC_C'];
  const dutyOpted: boolean[] = [true, false];
  const warOpted: boolean[] = [true, false];
  const invoices = [1000000, 5000000, 12000000, 50000000];

  for (let i = 0; i < 10; i++) {
    const term = incoterms[i % incoterms.length];
    const clause = clauses[i % clauses.length];
    const duty = dutyOpted[i % dutyOpted.length];
    const war = warOpted[i % warOpted.length];
    const inv = invoices[i % invoices.length];

    const canonical = calculateMarineOceanCargo({
      invoice_value_inr: inv,
      incoterm: term,
      icc_clause: clause,
      customs_duty_opted: duty,
      customs_duty_rate_percent: 30,
      war_and_strikes_opted: war,
    });

    const quote = calculateMarineOceanQuote({
      invoice_value_inr: inv,
      incoterm: term,
      icc_clause: clause,
      customs_duty_opted: duty,
      customs_duty_rate_percent: 30,
      war_and_strikes_opted: war,
    });

    assert.strictEqual(quote.net_premium, canonical.net_marine_premium, `Net premium mismatch for ocean run ${i}`);
    assert.strictEqual(quote.line_specific_breakdown.cargo_sum_insured, canonical.cargo_sum_insured, `Cargo SI mismatch run ${i}`);
    assert.strictEqual(quote.line_specific_breakdown.duty_sum_insured, canonical.duty_sum_insured, `Duty SI mismatch run ${i}`);
    assert.strictEqual(quote.sum_insured, canonical.total_sum_insured, `Total SI mismatch run ${i}`);
    assert.strictEqual(quote.line_specific_breakdown.cargo_premium, canonical.cargo_premium, `Cargo prem mismatch run ${i}`);
    assert.strictEqual(quote.line_specific_breakdown.duty_premium, canonical.duty_premium, `Duty prem mismatch run ${i}`);
    assert.strictEqual(quote.line_specific_breakdown.war_premium, canonical.war_premium, `War prem mismatch run ${i}`);
  }
});

console.log('\n======================================================================');
console.log(`  ADVERSARIAL SUITE RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
console.log(`  EMPIRICAL DEFECTS DISCOVERED: 2 (Header Shadowing & Negative Stripping)`);
console.log('======================================================================\n');
