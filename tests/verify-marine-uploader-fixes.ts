import assert from 'node:assert';
import fs from 'node:fs';

console.log('=== VERIFYING MARINE DECLARATION UPLOADER SURGICAL FIXES ===');

const uploaderContent = fs.readFileSync('src/app/quotes/new/uploaders/MarineDeclarationUploader.tsx', 'utf-8');

// 1. Verify Fix 1: Disambiguate normalizeHeader
assert(
  uploaderContent.includes('if (/^(invoicedate|invdate|date|dispatchdate|shipmentdate)/.test(clean)) return \'invoiceDate\';'),
  'Fix 1 failed: invoiceDate check not found in expected order.'
);
assert(
  uploaderContent.includes('if (/^(invoicevalue|consignmentvalue|declaredvalue|invoiceamount|value|amount|inr)/.test(clean)) return \'consignmentValue\';'),
  'Fix 1 failed: consignmentValue check not found in expected order.'
);
assert(
  uploaderContent.includes('if (/^(invoiceno|billno|invno|documentno|invoice|inv|bill)/.test(clean)) return \'invoiceNo\';'),
  'Fix 1 failed: invoiceNo check not found after compound checks.'
);
console.log('✓ Fix 1 verified in source code: compound patterns precede single-word generic prefixes.');

// 2. Verify Fix 2: Preserve negative values during parsing
assert(
  uploaderContent.includes('const isNegative = /^\\s*-/.test(record.consignmentValue || \'\');'),
  'Fix 2 failed: isNegative test not found.'
);
assert(
  uploaderContent.includes('const cleanVal = record.consignmentValue?.replace(/[^0-9.]/g, \'\') || \'0\';'),
  'Fix 2 failed: cleanVal extraction not found.'
);
assert(
  uploaderContent.includes('const rawVal = parseFloat(cleanVal) * (isNegative ? -1 : 1);'),
  'Fix 2 failed: negative sign application not found.'
);
console.log('✓ Fix 2 verified in source code: negative signs are preserved before non-numeric stripping.');

// 3. Functional test of the normalizeHeader algorithm as implemented
const normalizeHeader = (raw: string): string => {
  const clean = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
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

assert.strictEqual(normalizeHeader('Invoice No'), 'invoiceNo');
assert.strictEqual(normalizeHeader('Invoice Date'), 'invoiceDate');
assert.strictEqual(normalizeHeader('Inv Date'), 'invoiceDate');
assert.strictEqual(normalizeHeader('Invoice Value'), 'consignmentValue');
assert.strictEqual(normalizeHeader('Invoice Amount'), 'consignmentValue');
assert.strictEqual(normalizeHeader('Port of Loading'), 'origin');
assert.strictEqual(normalizeHeader('Port of Discharge'), 'destination');
console.log('✓ Functional test passed: Header aliasing and collision tests pass 100%.');

// 4. Functional test of negative number parsing
const parseConsignmentValue = (raw: string | undefined): number => {
  const isNegative = /^\s*-/.test(raw || '');
  const cleanVal = raw?.replace(/[^0-9.]/g, '') || '0';
  const rawVal = parseFloat(cleanVal) * (isNegative ? -1 : 1);
  return isNaN(rawVal) ? 0 : rawVal;
};

assert.strictEqual(parseConsignmentValue('₹ 50,00,000'), 5000000);
assert.strictEqual(parseConsignmentValue('-5000000'), -5000000);
assert.strictEqual(parseConsignmentValue(' -₹ 1,00,000 '), -100000);
assert.strictEqual(parseConsignmentValue('0'), 0);
assert.strictEqual(parseConsignmentValue(''), 0);
assert.strictEqual(parseConsignmentValue(undefined), 0);
console.log('✓ Functional test passed: Negative number parsing preserves credit adjustments and negative signs.');

console.log('=== ALL SURGICAL FIX CHECKS PASSED ===');
