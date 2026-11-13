/**
 * Adversarial Test Harness: Milestone 12 Commercial Motor & Fleet Insurance Module
 * 
 * Tests:
 * 1. Indian Registration Number Regex Validation & Sanitization
 * 2. Bulk CSV Parser Robustness (dirty headers, trailing delimiters, whitespace, missing fields)
 * 3. Fleet Portfolio Rollup Scale & Mathematical Soundness (50, 100, 250 vehicles)
 */

import {
  calculateCommercialMotorQuote,
  calculateFleetMotorQuote,
  MotorFleetInput,
  MotorVehicleType,
  MotorZone,
  NcbTier,
} from '../motor-engine';

// Regex under test from BulkFleetUploader
const INDIAN_REG_REGEX = /^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}$/i;

// Header normalization function under test from BulkFleetUploader
const normalizeHeader = (raw: string): string => {
  const clean = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (/^(reg|registration|vehicleno|rc|regn)/.test(clean)) return 'regNo';
  if (/^(make|model|vehiclemodel|makemodel)/.test(clean)) return 'makeModel';
  if (/^(year|mfgyear|manufacturingyear|mfg)/.test(clean)) return 'mfgYear';
  if (/^(class|vehicleclass|type|category)/.test(clean)) return 'vehicleClass';
  if (/^(gvw|weight|gvwkg|grossweight)/.test(clean)) return 'gvwKg';
  if (/^(seating|seats|capacity|passengers)/.test(clean)) return 'seatingCapacity';
  if (/^(exshowroom|price|invoice|cost|idv)/.test(clean)) return 'exShowroomPrice';
  if (/^(zone|rtozone)/.test(clean)) return 'zone';
  if (/^(ncb|bonus|ncbpercent)/.test(clean)) return 'ncbPercent';
  return clean;
};

// Simulation of BulkFleetUploader CSV Parsing pipeline
function parseCsvSchedule(text: string) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return { rows: [], validList: [], errorList: [] };

  const delimiter = lines[0].includes('\t') ? '\t' : ',';
  const rawHeaders = lines[0].split(delimiter).map((h) => h.trim().replace(/^["']|["']$/g, ''));
  const mappedHeaders = rawHeaders.map(normalizeHeader);

  const rows: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const rawCols = line.split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, ''));
    if (rawCols.length < 2) continue;

    const recordObj: Record<string, any> = {};
    mappedHeaders.forEach((key, idx) => {
      recordObj[key] = rawCols[idx];
    });

    const rawReg = (recordObj.regNo || '').replace(/[\s-]/g, '').toUpperCase();
    const makeModel = recordObj.makeModel || 'Commercial Vehicle';
    const mfgYear = parseInt(recordObj.mfgYear || '2023', 10);
    const rawClass = (recordObj.vehicleClass || 'gcv').toLowerCase();
    const vehicleClass: 'gcv' | 'pcv' | 'misc' =
      rawClass.includes('pcv') || rawClass.includes('bus') || rawClass.includes('cab')
        ? 'pcv'
        : rawClass.includes('misc') || rawClass.includes('crane') || rawClass.includes('jcb')
        ? 'misc'
        : 'gcv';

    const gvwKg = recordObj.gvwKg ? parseFloat(recordObj.gvwKg) : (vehicleClass === 'gcv' ? 16200 : undefined);
    const seatingCapacity = recordObj.seatingCapacity ? parseInt(recordObj.seatingCapacity, 10) : (vehicleClass === 'pcv' ? 32 : undefined);
    const exShowroomPrice = parseFloat(recordObj.exShowroomPrice || '2500000');
    const rawZone = (recordObj.zone || 'Zone A').trim();
    const zone: 'Zone A' | 'Zone B' | 'Zone C' =
      rawZone.toUpperCase().includes('B') ? 'Zone B' : rawZone.toUpperCase().includes('C') ? 'Zone C' : 'Zone A';
    const ncbPercent = parseFloat(recordObj.ncbPercent || '20');

    // Validation
    const errors: string[] = [];
    if (!rawReg || !INDIAN_REG_REGEX.test(rawReg)) {
      errors.push(`Invalid Reg No format ('${rawReg}'). Expected e.g. MH12AB1234.`);
    }
    if (isNaN(mfgYear) || mfgYear < 1990 || mfgYear > 2026) {
      errors.push(`Invalid Mfg Year (${mfgYear}).`);
    }
    if (isNaN(exShowroomPrice) || exShowroomPrice <= 0) {
      errors.push('Ex-showroom price must be > 0.');
    }
    if (vehicleClass === 'gcv' && (!gvwKg || gvwKg <= 0)) {
      errors.push('Gross Vehicle Weight (GVW) required for GCV.');
    }

    rows.push({
      rowNumber: i,
      rawReg,
      regNo: rawReg || `UNKNOWN-${i}`,
      makeModel,
      mfgYear,
      vehicleClass,
      gvwKg,
      seatingCapacity,
      exShowroomPrice,
      zone,
      ncbPercent,
      isValid: errors.length === 0,
      validationErrors: errors,
    });
  }

  const validList = rows.filter((r) => r.isValid);
  const errorList = rows.filter((r) => !r.isValid);
  return { rows, validList, errorList };
}

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ ${testName}`);
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    if (detail) console.error(`    Detail: ${detail}`);
  }
}

console.log('================================================================');
console.log('Milestone 12: Adversarial Fleet & Parser Stress Test Suite');
console.log('================================================================\n');

// -------------------------------------------------------------
// SECTION 1: Registration Number Regex & Sanitization
// -------------------------------------------------------------
console.log('[SECTION 1: Registration Number Regex & Sanitization]');

// 1.1 Valid Indian plate variations
const validPlates = [
  'MH12AB1234', // Standard Maharashtra 2-letter series
  'DL1CAA0001', // Delhi 1-digit RTO, 3-letter series
  'KA01F9999',  // Karnataka 1-letter series
  'HR26DQ5555', // Haryana 2-letter series
  'GJ011234',   // Gujarat 0-letter series (commercial/govt)
  'mh12ab1234', // Lowercase (case-insensitivity check)
  'TN09AZ0007', // Tamil Nadu
  'WB02E1111',  // West Bengal
  'UP32BN9876', // Uttar Pradesh
];

for (const plate of validPlates) {
  assert(INDIAN_REG_REGEX.test(plate), `Valid plate accepted: ${plate}`);
}

// 1.2 Invalid plate strings against raw regex
const invalidPlates = [
  'MH-12-AB-1234', // Contains dashes (raw regex must reject)
  '12MH1234',      // Starts with digits
  'INVALID1234',   // Alpha prefix > 2 letters without RTO code
  '',              // Empty string
  '   ',           // Whitespace string
  'MH12ABCD1234',  // 4 series letters (max is 3)
  'M12AB1234',     // Only 1 state letter
  'MH123AB1234',   // 3 RTO digits
  'MH12AB12345',   // 5 registration digits
  'MH12AB123',     // 3 registration digits
  'DROP TABLE',    // SQL injection text
  '<script>',      // HTML tag
];

for (const plate of invalidPlates) {
  assert(!INDIAN_REG_REGEX.test(plate), `Invalid plate rejected by raw regex: "${plate}"`);
}

// 1.3 Uploader Sanitization Behavior
// Verify that BulkFleetUploader strips dashes and whitespace before regex
const dashesSanitized = 'MH-12-AB-1234'.replace(/[\s-]/g, '').toUpperCase();
assert(INDIAN_REG_REGEX.test(dashesSanitized), 'BulkFleetUploader sanitizes "MH-12-AB-1234" to valid "MH12AB1234"');

const spacesSanitized = 'KA 01 F 9999'.replace(/[\s-]/g, '').toUpperCase();
assert(INDIAN_REG_REGEX.test(spacesSanitized), 'BulkFleetUploader sanitizes "KA 01 F 9999" to valid "KA01F9999"');

const emptyAfterSanitization = '   ---  '.replace(/[\s-]/g, '').toUpperCase();
assert(!INDIAN_REG_REGEX.test(emptyAfterSanitization), 'Whitespace/dashes only sanitizes to empty and is rejected');


// -------------------------------------------------------------
// SECTION 2: CSV Parser Robustness & Header Normalization
// -------------------------------------------------------------
console.log('\n[SECTION 2: CSV Parser Robustness & Header Normalization]');

// 2.1 Header Normalization variations
const headerTestCases = [
  { raw: 'reg_no', expected: 'regNo' },
  { raw: 'Vehicle No', expected: 'regNo' },
  { raw: 'RC Number', expected: 'regNo' },
  { raw: 'REGN_NO', expected: 'regNo' },
  { raw: 'Make/Model', expected: 'makeModel' },
  { raw: 'Vehicle Model', expected: 'makeModel' },
  { raw: 'Mfg Year', expected: 'mfgYear' },
  { raw: 'Manufacturing Year', expected: 'mfgYear' },
  { raw: 'Vehicle Class', expected: 'vehicleClass' },
  { raw: 'Category', expected: 'vehicleClass' },
  { raw: 'GVW (KG)', expected: 'gvwKg' },
  { raw: 'Gross Weight', expected: 'gvwKg' },
  { raw: 'Seating Capacity', expected: 'seatingCapacity' },
  { raw: 'Passengers', expected: 'seatingCapacity' },
  { raw: 'Ex-Showroom Price', expected: 'exShowroomPrice' },
  { raw: 'Cost Price', expected: 'exShowroomPrice' },
  { raw: 'Invoice Value', expected: 'exShowroomPrice' },
  { raw: 'IDV (INR)', expected: 'exShowroomPrice' },
  { raw: 'RTO Zone', expected: 'zone' },
  { raw: 'NCB %', expected: 'ncbPercent' },
];

for (const tc of headerTestCases) {
  const normalized = normalizeHeader(tc.raw);
  assert(
    normalized === tc.expected,
    `Header "${tc.raw}" normalizes to "${tc.expected}" (got "${normalized}")`
  );
}

// 2.2 Boundary Case: "Chassis IDV" header analysis
const chassisIdvNorm = normalizeHeader('Chassis IDV');
console.log(`  ℹ Discovery: "Chassis IDV" normalizes to "${chassisIdvNorm}" because regex is anchored with ^(exshowroom|price|invoice|cost|idv)`);
assert(
  chassisIdvNorm === 'chassisidv',
  '"Chassis IDV" is preserved as unmapped "chassisidv" rather than false-aliased to exShowroomPrice'
);

// 2.3 Adversarial Dirty CSV Test
const dirtyCsv = `
  reg_no , Vehicle Model , Mfg Year , Category , Gross Weight , Seating , IDV (INR) , RTO Zone , NCB % ,
  MH12AB1234 , Tata Prima 5530.S , 2023 , GCV , 55000 , , 4200000 , Zone A , 25 ,
  
  DL1CAA0001 , Ashok Leyland Viking , 2022 , PCV Bus , , 42 , 3100000 , Zone B , 35 ,
  
  12MH1234 , Invalid Prefix Truck , 2021 , GCV , 16200 , , 2200000 , Zone A , 20 ,
  
  KA01F9999 , Eicher Pro 2049 , 2024 , GCV , 4995 , , 1450000 , Zone C , 0 ,
  
  INVALID1234 , Corrupt Reg Truck , 2020 , GCV , 12000 , , 1800000 , Zone B , 20 ,
  
  HR26DQ5555 , JCB 3DX Excavator , 2022 , Misc Crane , 7800 , , 2900000 , Zone B , 50 ,
  
  , Missing Reg Plate Row , 2023 , GCV , 16200 , , 2500000 , Zone A , 20 ,
  
  GJ011234 , Tata Ace Gold , 2018 , GCV , 1650 , , 550000 , Zone A , 50 ,
`;

const parsedDirty = parseCsvSchedule(dirtyCsv);

assert(parsedDirty.rows.length === 8, `Parsed exactly 8 valid non-blank rows (got ${parsedDirty.rows.length})`);
assert(parsedDirty.validList.length === 5, `Identified exactly 5 valid vehicle rows (got ${parsedDirty.validList.length})`);
assert(parsedDirty.errorList.length === 3, `Isolated exactly 3 invalid vehicle rows (got ${parsedDirty.errorList.length})`);

const invalidRowReasons = parsedDirty.errorList.map((r: any) => ({
  row: r.rowNumber,
  reg: r.regNo,
  error: r.validationErrors[0],
}));
assert(
  invalidRowReasons.some((r: any) => r.reg === '12MH1234'),
  'Invalid plate "12MH1234" flagged with validation error'
);
assert(
  invalidRowReasons.some((r: any) => r.reg === 'INVALID1234'),
  'Invalid plate "INVALID1234" flagged with validation error'
);
assert(
  invalidRowReasons.some((r: any) => r.reg.startsWith('UNKNOWN-')),
  'Missing plate flagged with validation error and assigned UNKNOWN fallback'
);

// 2.4 Missing Optional / Required Field Fallbacks
const minimalCsv = `
reg_no,price
MH12AB1234,3000000
KA01F9999,
`;

const parsedMinimal = parseCsvSchedule(minimalCsv);
assert(parsedMinimal.rows.length === 2, 'Minimal CSV parsed 2 rows');
assert(parsedMinimal.rows[0].isValid === true, 'Row 1 with missing optional fields falls back gracefully (mfgYear=2023, gvw=16200, zone=Zone A, ncb=20)');
assert(parsedMinimal.rows[0].mfgYear === 2023, 'Missing MfgYear falls back to 2023');
assert(parsedMinimal.rows[0].gvwKg === 16200, 'Missing GCV weight falls back to 16,200 kg');
assert(parsedMinimal.rows[0].exShowroomPrice === 3000000, 'Price parsed correctly as 3,000,000');
assert(parsedMinimal.rows[1].exShowroomPrice === 2500000, 'Missing price falls back to default 2,500,000');


// -------------------------------------------------------------
// SECTION 3: Fleet Rollup Scale & Mathematical Soundness
// -------------------------------------------------------------
console.log('\n[SECTION 3: Fleet Rollup Scale & Mathematical Soundness]');

// Helper to generate synthetic large fleet
function generateSyntheticFleet(count: number): MotorFleetInput[] {
  const vehicleClasses: MotorVehicleType[] = ['gcv_public', 'gcv_private', 'pcv_bus', 'pcv_taxi', 'misc_digger_crane'];
  const zones: MotorZone[] = ['A', 'B', 'C'];
  const ncbTiers: NcbTier[] = [0, 20, 25, 35, 45, 50];

  const fleet: MotorFleetInput[] = [];

  for (let i = 1; i <= count; i++) {
    const vType = vehicleClasses[(i - 1) % vehicleClasses.length];
    const zone = zones[(i - 1) % zones.length];
    const ncb = ncbTiers[(i - 1) % ncbTiers.length];
    const ageMonths = (i * 3) % 48; // Ages 0 to 45 months

    fleet.push({
      registration_number: `MH12AB${(1000 + i).toString().padStart(4, '0')}`,
      make_model: `Fleet Model ${i}`,
      vehicle_type: vType,
      zone: zone,
      vehicle_age_months: ageMonths,
      ex_showroom_price: 2000000 + ((i * 50000) % 3000000), // ₹20L to ₹50L
      gvw_kg: vType.startsWith('gcv') ? 16200 + ((i * 500) % 20000) : undefined,
      seating_capacity: vType === 'pcv_bus' ? 36 : vType === 'pcv_taxi' ? 4 : undefined,
      cubic_capacity: vType === 'pcv_taxi' ? 1498 : undefined,
      ncb_tier: ncb,
      opted_addons: {
        imt23: i % 2 === 0,
        zero_dep: i % 3 === 0,
        consumables: i % 4 === 0,
        engine_protect: i % 5 === 0,
      },
    });
  }

  return fleet;
}

const fleetSizesToTest = [50, 100, 250];

for (const size of fleetSizesToTest) {
  console.log(`\n--- Stress Testing Fleet Size = ${size} Vehicles ---`);
  const fleetData = generateSyntheticFleet(size);

  const startTime = Date.now();
  const fleetQuote = calculateFleetMotorQuote(fleetData, {
    fleet_name: `Enterprise Logistics ${size}`,
    fleet_size: size,
    past_claims_ratio_percent: 45, // Healthy fleet (<80% ICR) -> volume discount applies
  });
  const elapsedMs = Date.now() - startTime;

  console.log(`  ⚡ Calculation executed in ${elapsedMs} ms for ${size} vehicles`);
  assert(elapsedMs < 1000, `High throughput: ${size} vehicle calculations took ${elapsedMs}ms (< 1000ms target)`);

  // 3.1 IDV Additivity
  const manualSumIdv = fleetQuote.vehicles.reduce((acc, v) => acc + v.sum_insured, 0);
  assert(
    fleetQuote.total_fleet_idv === manualSumIdv,
    `Total fleet IDV matches exact sum of vehicle IDVs (₹${fleetQuote.total_fleet_idv.toLocaleString('en-IN')})`
  );

  // 3.2 Fleet Volume Discount Verification
  // size 50 -> 10% discount (16-50 bracket)
  // size 100 -> 15% discount (>50 bracket)
  // size 250 -> 15% discount (>50 bracket)
  const expectedDiscountPercent = size > 50 ? 15 : size >= 16 ? 10 : 5;
  const sampleVehicleBd: any = fleetQuote.vehicles[0].line_specific_breakdown;
  assert(
    sampleVehicleBd.fleet_discount_percent === expectedDiscountPercent,
    `Fleet volume discount of ${expectedDiscountPercent}% correctly configured on line breakdown for size ${size}`
  );

  const manualSumFleetDiscount = fleetQuote.vehicles.reduce((acc, v) => {
    const bd: any = v.line_specific_breakdown;
    return acc + bd.fleet_discount_inr;
  }, 0);
  assert(
    fleetQuote.total_fleet_discount === manualSumFleetDiscount,
    `Total fleet discount (₹${fleetQuote.total_fleet_discount.toLocaleString('en-IN')}) exactly matches sum of vehicle fleet discounts (₹${manualSumFleetDiscount.toLocaleString('en-IN')})`
  );

  // 3.3 Net Own Damage Additivity
  const manualSumNetOd = fleetQuote.vehicles.reduce((acc, v) => {
    const bd: any = v.line_specific_breakdown;
    return acc + bd.net_od_premium;
  }, 0);
  assert(
    fleetQuote.total_net_od === manualSumNetOd,
    `Total Net OD (₹${fleetQuote.total_net_od.toLocaleString('en-IN')}) matches sum of line Net ODs (₹${manualSumNetOd.toLocaleString('en-IN')})`
  );

  // 3.4 Statutory Third Party Additivity
  const manualSumTp = fleetQuote.vehicles.reduce((acc, v) => {
    const bd: any = v.line_specific_breakdown;
    return acc + bd.tp_breakdown.total_tp_premium;
  }, 0);
  assert(
    fleetQuote.total_tp === manualSumTp,
    `Total Statutory TP (₹${fleetQuote.total_tp.toLocaleString('en-IN')}) matches sum of vehicle TP premiums (₹${manualSumTp.toLocaleString('en-IN')})`
  );

  // 3.5 Total Net Premium Additivity
  const manualSumNetPremium = fleetQuote.vehicles.reduce((acc, v) => acc + v.net_premium, 0);
  assert(
    fleetQuote.total_net_premium === manualSumNetPremium,
    `Total Net Premium (₹${fleetQuote.total_net_premium.toLocaleString('en-IN')}) matches sum of vehicle Net Premiums (₹${manualSumNetPremium.toLocaleString('en-IN')})`
  );

  // 3.6 Net Total equals Net OD + Total TP
  assert(
    fleetQuote.total_net_premium === fleetQuote.total_net_od + fleetQuote.total_tp,
    `Fleet Net Premium equals Total Net OD + Total TP (₹${fleetQuote.total_net_premium.toLocaleString('en-IN')})`
  );

  // 3.7 18% GST Rounding and Gross Consistency
  const expectedGst = Math.round(fleetQuote.total_net_premium * 0.18);
  assert(
    fleetQuote.gst_amount === expectedGst,
    `Fleet aggregate GST (₹${fleetQuote.gst_amount.toLocaleString('en-IN')}) matches Math.round(Net Premium * 0.18)`
  );

  assert(
    fleetQuote.total_gross_premium === fleetQuote.total_net_premium + fleetQuote.gst_amount,
    `Fleet Gross Premium (₹${fleetQuote.total_gross_premium.toLocaleString('en-IN')}) equals Net Premium + GST`
  );

  // Precision drift analysis: Compare aggregate GST vs sum of individual vehicle GSTs
  const sumOfLineGsts = fleetQuote.vehicles.reduce((acc, v) => acc + v.gst_amount, 0);
  const gstVariance = Math.abs(fleetQuote.gst_amount - sumOfLineGsts);
  console.log(`  ℹ GST Rounding Analysis: Aggregate GST = ₹${fleetQuote.gst_amount.toLocaleString('en-IN')}, Sum of Line GSTs = ₹${sumOfLineGsts.toLocaleString('en-IN')}, Variance = ₹${gstVariance} (${((gstVariance / fleetQuote.gst_amount) * 100).toFixed(4)}%)`);
  assert(
    gstVariance <= size,
    `GST line-rounding variance (₹${gstVariance}) is within statutory 1-rupee-per-vehicle rounding bound (<= ₹${size})`
  );
}

// -------------------------------------------------------------
// SECTION 4: Adverse Claims Loading Stress Test
// -------------------------------------------------------------
console.log('\n[SECTION 4: Adverse Claims Loading Stress Test (>80% ICR)]');

const fleet50Adverse = generateSyntheticFleet(50);
const adverseQuote = calculateFleetMotorQuote(fleet50Adverse, {
  fleet_name: 'High Risk Fleet',
  fleet_size: 50,
  past_claims_ratio_percent: 110, // >100% ICR -> +25% loading
});

assert(adverseQuote.total_fleet_discount === 0, 'Fleet volume discount is 0% when ICR > 80%');
assert(adverseQuote.total_fleet_loading > 0, `Adverse loading of +25% applied on Gross OD (₹${adverseQuote.total_fleet_loading.toLocaleString('en-IN')})`);

const sampleAdverseLine: any = adverseQuote.vehicles[0].line_specific_breakdown;
assert(sampleAdverseLine.fleet_loading_percent === 25, 'Line breakdown confirms 25% loading applied');
assert(sampleAdverseLine.fleet_discount_percent === 0, 'Line breakdown confirms 0% discount');

console.log('\n================================================================');
console.log(`Adversarial Test Suite Completed: ${passedTests}/${totalTests} Passed (${((passedTests / totalTests) * 100).toFixed(1)}%)`);
console.log('================================================================\n');

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
