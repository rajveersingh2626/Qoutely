/**
 * Empirical Proof of Bug: Header Shadowing in MarineDeclarationUploader.tsx
 *
 * Demonstrates:
 * 1. "Invoice Date" is shadowed by /^invoice/ and erroneously mapped to "invoiceNo" instead of "invoiceDate".
 * 2. "Invoice Value" is shadowed by /^invoice/ and erroneously mapped to "invoiceNo" instead of "consignmentValue".
 * 3. In a standard enterprise CSV with headers ["Invoice No", "Invoice Date", "Origin", "Destination", "Invoice Value"],
 *    all 3 columns collide into "invoiceNo", causing consignmentValue to be 0, triggering validation errors,
 *    and rendering all rows invalid.
 */

import assert from 'node:assert';

// Verbatim copy of normalizeHeader from src/app/quotes/new/uploaders/MarineDeclarationUploader.tsx (Lines 84-99)
const normalizeHeader = (raw: string): string => {
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

console.log('=== EMPIRICAL INVESTIGATION: HEADER SHADOWING DEFECT ===\n');

const testHeaders = [
  { raw: 'Invoice No', expected: 'invoiceNo' },
  { raw: 'Invoice Date', expected: 'invoiceDate' },
  { raw: 'Inv Date', expected: 'invoiceDate' },
  { raw: 'Invoice Value', expected: 'consignmentValue' },
  { raw: 'Invoice Amount', expected: 'consignmentValue' },
];

for (const t of testHeaders) {
  const actual = normalizeHeader(t.raw);
  const passed = actual === t.expected;
  console.log(`Header "${t.raw}":`);
  console.log(`  Actual mapping:   "${actual}"`);
  console.log(`  Expected mapping: "${t.expected}"`);
  console.log(`  Status:           ${passed ? 'PASS' : 'BUG CONFIRMED (SHADOWED BY /^invoice/)'}\n`);
}

// Full CSV Ingestion Simulation with Standard Enterprise Headers
const enterpriseCsv = [
  'Invoice No,Invoice Date,Origin,Destination,Invoice Value,Commodity',
  'INV-2026-881,2026-11-10,Mumbai,Delhi,5000000,Textiles',
  'INV-2026-882,2026-11-11,Chennai,Bangalore,7500000,Auto Components',
].join('\n');

const lines = enterpriseCsv.split('\n');
const headers = lines[0].split(',').map(normalizeHeader);

console.log('Normalized Headers for Enterprise CSV:');
console.log(headers);

// Observe how record is populated
for (let i = 1; i < lines.length; i++) {
  const cols = lines[i].split(',');
  const record: Record<string, string> = {};
  headers.forEach((hdr, idx) => {
    record[hdr] = cols[idx];
  });

  console.log(`\nParsed Record for row ${i}:`, record);
  console.log(`  Invoice No in record:        "${record.invoiceNo}" (Overwritten with Invoice Value!)`);
  console.log(`  Invoice Date in record:      "${record.invoiceDate}" (MISSING / UNDEFINED!)`);
  console.log(`  Consignment Value in record: "${record.consignmentValue}" (MISSING / UNDEFINED!)`);

  const rawVal = parseFloat(record.consignmentValue?.replace(/[^0-9.]/g, '') || '0');
  const consignmentValue = isNaN(rawVal) ? 0 : rawVal;
  console.log(`  Extracted Consignment Value: ${consignmentValue} -> FAILS VALIDATION (consignmentValue <= 0)`);
}
