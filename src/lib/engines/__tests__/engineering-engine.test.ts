/**
 * Comprehensive Unit Test Suite for Engineering Underwriting Engine
 *
 * Covers:
 * Suite 1: CAR / EAR Project Lifecycle Engine (Feature 20)
 * Suite 2: Machinery Breakdown (MB) Engine (Feature 21)
 * Suite 3: Electronic Equipment Insurance (EEI) Engine (Feature 22)
 * Suite 4: Boiler & Pressure Plant (BPP) Engine (Feature 23)
 * Suite 5: Fixed Asset Register (FAR) Tabular Parser (Feature 24)
 * Suite 6: Engineering Studio UI Model Validation (Feature 25)
 * Suite 7: Standard Contract Quotes, GST & Algorithmic Explainability
 */

import assert from 'node:assert';
import {
  calculateCarEarPremium,
  calculateMachineryBreakdown,
  calculateEeiPremium,
  calculateBppPremium,
  parseFixedAssetRegister,
  validateEngineeringStudioInput,
  calculateCarEarQuote,
  calculateMbQuote,
  calculateEeiQuote,
  calculateBppQuote,
  calculateEngineeringQuote,
  CAR_CIVIL_RATE_PER_MILLE,
  EAR_PLANT_RATE_PER_MILLE,
  EAR_TESTING_MONTHLY_RATE_PER_MILLE,
  SEISMIC_EQ_RATES_PER_MILLE,
  MB_GROUP_RATES,
  EEI_HARDWARE_BASE_RATE,
  EEI_PORTABLE_LAPTOP_LOADING,
  EEI_DATA_MEDIA_RATE,
  EEI_ICOW_RATES,
  BPP_VESSEL_RATES,
  BPP_HIGH_PRESSURE_SURCHARGE_PERCENT,
  BPP_TPL_RATE,
  CarEarInput,
  MbMachineItem,
  EeiInput,
  BppInput,
  FarItem,
  EngineeringStudioInput,
} from '../engineering-engine';

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

console.log('\n============================================================');
console.log('  STARTING ENGINEERING UNDERWRITING ENGINE TEST SUITE');
console.log('============================================================\n');

// ============================================================================
// SUITE 1: CAR / EAR PROJECT LIFECYCLE ENGINE (FEATURE 20)
// ============================================================================
console.log('--- Suite 1: CAR / EAR Project Lifecycle Engine ---');

runTest('CAR: 12-month civil project in Zone 4 calculates base works & peril premium', () => {
  const input: CarEarInput = {
    project_type: 'car',
    civil_works_value: 100000000, // ₹10 Cr
    plant_machinery_value: 0,
    contract_period_months: 12,
    eq_zone: 4,
  };
  const res = calculateCarEarPremium(input);
  assert.strictEqual(res.project_sum_insured, 100000000);
  // Civil: 10 Cr * 1.20 / 1000 * 1.0 = 120,000
  assert.strictEqual(res.base_works_premium, 120000);
  assert.strictEqual(res.testing_premium, 0);
  assert.strictEqual(res.maintenance_premium, 0);
  // Perils Zone 4 (0.10‰): 10 Cr * 0.10 / 1000 = 10,000
  assert.strictEqual(res.perils_premium, 10000);
  assert.strictEqual(res.net_project_premium, 130000);
});

runTest('EAR: Erection project duration scaling (24 months = 2.0x factor)', () => {
  const res12 = calculateCarEarPremium({
    project_type: 'ear',
    civil_works_value: 0,
    plant_machinery_value: 100000000, // ₹10 Cr
    contract_period_months: 12,
    eq_zone: 4,
  });
  const res24 = calculateCarEarPremium({
    project_type: 'ear',
    civil_works_value: 0,
    plant_machinery_value: 100000000,
    contract_period_months: 24,
    eq_zone: 4,
  });
  // Plant rate is 1.80‰ -> 12 mos: 180,000; 24 mos: 360,000
  assert.strictEqual(res12.base_works_premium, 180000);
  assert.strictEqual(res24.base_works_premium, 360000);
  assert.strictEqual(res24.base_works_premium, res12.base_works_premium * 2);
});

runTest('EAR: Testing period 1 month included free; 3 months = 2 extra months loaded @ 0.75‰/mo', () => {
  const freeTesting = calculateCarEarPremium({
    project_type: 'ear',
    civil_works_value: 0,
    plant_machinery_value: 50000000, // ₹5 Cr
    contract_period_months: 12,
    testing_period_months: 1,
    eq_zone: 4,
  });
  assert.strictEqual(freeTesting.testing_premium, 0);

  const extraTesting = calculateCarEarPremium({
    project_type: 'ear',
    civil_works_value: 0,
    plant_machinery_value: 50000000, // ₹5 Cr
    contract_period_months: 12,
    testing_period_months: 3, // 2 extra months
    eq_zone: 4,
  });
  // 5 Cr * (2 * 0.75) / 1000 = 75,000
  assert.strictEqual(extraTesting.testing_premium, 75000);
});

runTest('CAR/EAR: Defect Liability Period (DLP) maintenance loading (12 mos: 15%, 24 mos: 25%)', () => {
  const base = calculateCarEarPremium({
    project_type: 'car',
    civil_works_value: 100000000,
    plant_machinery_value: 0,
    contract_period_months: 12,
    eq_zone: 4,
  });
  const dlp12 = calculateCarEarPremium({
    project_type: 'car',
    civil_works_value: 100000000,
    plant_machinery_value: 0,
    contract_period_months: 12,
    dlp_maintenance_months: 12,
    eq_zone: 4,
  });
  const dlp24 = calculateCarEarPremium({
    project_type: 'car',
    civil_works_value: 100000000,
    plant_machinery_value: 0,
    contract_period_months: 12,
    dlp_maintenance_months: 24,
    eq_zone: 4,
  });
  assert.strictEqual(dlp12.maintenance_premium, Math.round(base.base_works_premium * 0.15));
  assert.strictEqual(dlp24.maintenance_premium, Math.round(base.base_works_premium * 0.25));
});

runTest('AOG: Seismic EQ Zones 1 to 4 rate accurately from 0.50‰ down to 0.10‰', () => {
  const totalSi = 100000000;
  const z1 = calculateCarEarPremium({ project_type: 'car', civil_works_value: totalSi, plant_machinery_value: 0, contract_period_months: 12, eq_zone: 1 });
  const z2 = calculateCarEarPremium({ project_type: 'car', civil_works_value: totalSi, plant_machinery_value: 0, contract_period_months: 12, eq_zone: 2 });
  const z3 = calculateCarEarPremium({ project_type: 'car', civil_works_value: totalSi, plant_machinery_value: 0, contract_period_months: 12, eq_zone: 3 });
  const z4 = calculateCarEarPremium({ project_type: 'car', civil_works_value: totalSi, plant_machinery_value: 0, contract_period_months: 12, eq_zone: 4 });

  assert.strictEqual(z1.perils_premium, 50000); // 0.50‰
  assert.strictEqual(z2.perils_premium, 35000); // 0.35‰
  assert.strictEqual(z3.perils_premium, 25000); // 0.25‰
  assert.strictEqual(z4.perils_premium, 10000); // 0.10‰
});

runTest('CAR/EAR: Zero or negative project sum insured throws error', () => {
  assert.throws(() => {
    calculateCarEarPremium({
      project_type: 'car',
      civil_works_value: 0,
      plant_machinery_value: 0,
      contract_period_months: 12,
      eq_zone: 1,
    });
  }, /Project sum insured must be greater than zero/);
});

// ============================================================================
// SUITE 2: MACHINERY BREAKDOWN (MB) ENGINE (FEATURE 21)
// ============================================================================
console.log('\n--- Suite 2: Machinery Breakdown (MB) Engine ---');

runTest('MB: Tariff Groups 1, 2, 3, 4 rates correctly apply to machine CRV', () => {
  const machines: MbMachineItem[] = [
    { machine_id: 'M1', tariff_group: 1, current_replacement_value: 1000000 }, // 0.90% = 9,000
    { machine_id: 'M2', tariff_group: 2, current_replacement_value: 1000000 }, // 1.50% = 15,000
    { machine_id: 'M3', tariff_group: 3, current_replacement_value: 1000000 }, // 2.50% = 25,000
    { machine_id: 'M4', tariff_group: 4, current_replacement_value: 1000000 }, // 4.00% = 40,000
  ];
  const res = calculateMachineryBreakdown(machines);
  assert.strictEqual(res.total_machines, 4);
  assert.strictEqual(res.total_crv, 4000000);
  assert.strictEqual(res.net_mb_premium, 89000);
});

runTest('MB: Empty machines array returns 0 premium and 0 CRV', () => {
  const res = calculateMachineryBreakdown([]);
  assert.strictEqual(res.total_machines, 0);
  assert.strictEqual(res.total_crv, 0);
  assert.strictEqual(res.net_mb_premium, 0);
});

runTest('MB: Non-positive CRV throws Error', () => {
  assert.throws(() => {
    calculateMachineryBreakdown([{ machine_id: 'BAD_CRV', tariff_group: 1, current_replacement_value: 0 }]);
  }, /CRV must be greater than zero/);

  assert.throws(() => {
    calculateMachineryBreakdown([{ machine_id: 'NEG_CRV', tariff_group: 2, current_replacement_value: -50000 }]);
  }, /CRV must be greater than zero/);
});

runTest('MB: Heavy industrial turbo-generator ₹50 Cr in Group 3 rates at 2.50%', () => {
  const res = calculateMachineryBreakdown([
    { machine_id: 'TURBINE_GEN_01', tariff_group: 3, current_replacement_value: 500000000 },
  ]);
  assert.strictEqual(res.total_crv, 500000000);
  assert.strictEqual(res.net_mb_premium, 12500000);
});

// ============================================================================
// SUITE 3: ELECTRONIC EQUIPMENT INSURANCE (EEI) ENGINE (FEATURE 22)
// ============================================================================
console.log('\n--- Suite 3: Electronic Equipment Insurance (EEI) Engine ---');

runTest('EEI: Stationary hardware rated at 1.25%', () => {
  const res = calculateEeiPremium({
    section1_hardware_crv: 10000000, // ₹1 Cr
  });
  assert.strictEqual(res.section1_premium, 125000);
  assert.strictEqual(res.section2_premium, 0);
  assert.strictEqual(res.section3_premium, 0);
  assert.strictEqual(res.total_eei_premium, 125000);
});

runTest('EEI: Portable laptop loading adds +2.50% (total 3.75%)', () => {
  const res = calculateEeiPremium({
    section1_hardware_crv: 10000000,
    is_portable_laptop: true,
  });
  // 10,000,000 * 0.0375 = 375,000
  assert.strictEqual(res.section1_premium, 375000);
  assert.strictEqual(res.total_eei_premium, 375000);
});

runTest('EEI: Section 2 External Data Media rated at 3.00%', () => {
  const res = calculateEeiPremium({
    section1_hardware_crv: 10000000,
    section2_data_media_si: 2000000, // ₹20 Lakhs
  });
  assert.strictEqual(res.section2_premium, 60000);
  assert.strictEqual(res.total_eei_premium, 125000 + 60000);
});

runTest('EEI: Section 3 ICOW rated at 1.50% (3 mos), 2.50% (6 mos), 4.00% (12 mos)', () => {
  const icow3 = calculateEeiPremium({
    section1_hardware_crv: 10000000,
    section3_icow_si: 5000000,
    section3_icow_months: 3,
  });
  const icow6 = calculateEeiPremium({
    section1_hardware_crv: 10000000,
    section3_icow_si: 5000000,
    section3_icow_months: 6,
  });
  const icow12 = calculateEeiPremium({
    section1_hardware_crv: 10000000,
    section3_icow_si: 5000000,
    section3_icow_months: 12,
  });

  assert.strictEqual(icow3.section3_premium, 75000);   // 50L * 1.50%
  assert.strictEqual(icow6.section3_premium, 125000);  // 50L * 2.50%
  assert.strictEqual(icow12.section3_premium, 200000); // 50L * 4.00%
});

runTest('EEI: Non-positive Section 1 hardware CRV throws error', () => {
  assert.throws(() => {
    calculateEeiPremium({ section1_hardware_crv: 0 });
  }, /Hardware CRV must be positive/);

  assert.throws(() => {
    calculateEeiPremium({ section1_hardware_crv: -100000 });
  }, /Hardware CRV must be positive/);
});

// ============================================================================
// SUITE 4: BOILER & PRESSURE PLANT (BPP) ENGINE (FEATURE 23)
// ============================================================================
console.log('\n--- Suite 4: Boiler & Pressure Plant (BPP) Engine ---');

runTest('BPP: Fire tube (0.75%) vs Water tube (1.00%) base rating', () => {
  const fire = calculateBppPremium({
    vessel_type: 'fire_tube',
    heating_surface_sqm: 150,
    operating_pressure_bar: 15,
    replacement_value: 20000000, // ₹2 Cr
  });
  const water = calculateBppPremium({
    vessel_type: 'water_tube',
    heating_surface_sqm: 150,
    operating_pressure_bar: 15,
    replacement_value: 20000000,
  });

  // Fire: 2 Cr * 0.75% = 150,000
  assert.strictEqual(fire.base_bpp_premium, 150000);
  assert.strictEqual(fire.high_pressure_surcharge, 0);
  assert.strictEqual(fire.total_bpp_premium, 150000);

  // Water: 2 Cr * 1.00% = 200,000
  assert.strictEqual(water.base_bpp_premium, 200000);
  assert.strictEqual(water.high_pressure_surcharge, 0);
  assert.strictEqual(water.total_bpp_premium, 200000);
});

runTest('BPP: Operating pressure threshold (<=20 bar: 0 surcharge; >20 bar: +20% surcharge)', () => {
  const atThreshold = calculateBppPremium({
    vessel_type: 'water_tube',
    heating_surface_sqm: 100,
    operating_pressure_bar: 20, // Exactly 20 bar
    replacement_value: 10000000,
  });
  assert.strictEqual(atThreshold.high_pressure_surcharge, 0);

  const aboveThreshold = calculateBppPremium({
    vessel_type: 'water_tube',
    heating_surface_sqm: 100,
    operating_pressure_bar: 25, // Above 20 bar
    replacement_value: 10000000,
  });
  // Base is 100,000 -> Surcharge +20% = 20,000
  assert.strictEqual(aboveThreshold.high_pressure_surcharge, 20000);
  assert.strictEqual(aboveThreshold.total_bpp_premium, 120000);
});

runTest('BPP: Third party liability (TPL) extension rated at 0.50%', () => {
  const res = calculateBppPremium({
    vessel_type: 'fire_tube',
    heating_surface_sqm: 100,
    operating_pressure_bar: 10,
    replacement_value: 10000000,
    tpl_limit: 5000000, // ₹50 Lakhs TPL limit
  });
  // TPL: 50L * 0.50% = 25,000
  assert.strictEqual(res.tpl_premium, 25000);
  assert.strictEqual(res.total_bpp_premium, 75000 + 25000);
});

runTest('BPP: Non-positive replacement value throws Error', () => {
  assert.throws(() => {
    calculateBppPremium({
      vessel_type: 'fire_tube',
      heating_surface_sqm: 100,
      operating_pressure_bar: 10,
      replacement_value: 0,
    });
  }, /Vessel replacement value must be positive/);
});

// ============================================================================
// SUITE 5: FIXED ASSET REGISTER (FAR) TABULAR PARSER (FEATURE 24)
// ============================================================================
console.log('\n--- Suite 5: Fixed Asset Register (FAR) Tabular Parser ---');

runTest('FAR: Category aggregation and underinsurance ratio', () => {
  const items: FarItem[] = [
    { asset_code: 'BLD-01', category: 'building', book_value: 4000000, current_replacement_value: 10000000 },
    { asset_code: 'PM-01', category: 'plant_machinery', book_value: 2000000, current_replacement_value: 6000000 },
    { asset_code: 'FF-01', category: 'furniture_fixtures', book_value: 500000, current_replacement_value: 1000000 },
    { asset_code: 'STK-01', category: 'stocks', book_value: 1500000, current_replacement_value: 3000000 },
  ];
  const res = parseFixedAssetRegister(items);
  assert.strictEqual(res.building_crv, 10000000);
  assert.strictEqual(res.plant_machinery_crv, 6000000);
  assert.strictEqual(res.furniture_crv, 1000000);
  assert.strictEqual(res.stocks_crv, 3000000);
  assert.strictEqual(res.total_crv, 20000000);
  // Total BV: 4 + 2 + 0.5 + 1.5 = 8M. Ratio = 8 / 20 = 0.40
  assert.strictEqual(res.underinsurance_ratio, 0.4);
});

runTest('FAR: Empty asset list returns 0 sums and ratio 1.0', () => {
  const res = parseFixedAssetRegister([]);
  assert.strictEqual(res.total_crv, 0);
  assert.strictEqual(res.underinsurance_ratio, 1.0);
});

runTest('FAR: Large portfolio 500-item stress test computes cleanly', () => {
  const items: FarItem[] = [];
  for (let i = 0; i < 500; i++) {
    items.push({
      asset_code: `AST-${i}`,
      category: i % 2 === 0 ? 'plant_machinery' : 'building',
      book_value: 100000,
      current_replacement_value: 200000,
    });
  }
  const res = parseFixedAssetRegister(items);
  assert.strictEqual(res.total_crv, 500 * 200000);
  assert.strictEqual(res.underinsurance_ratio, 0.5);
});

// ============================================================================
// SUITE 6: ENGINEERING STUDIO UI MODEL VALIDATION (FEATURE 25)
// ============================================================================
console.log('\n--- Suite 6: Engineering Studio UI Model Validation ---');

runTest('Studio Validator: Missing project_name returns invalid', () => {
  const res = validateEngineeringStudioInput({
    project_name: '',
    contractor_name: 'L&T',
    project_type: 'car',
    civil_si: 10000000,
    plant_si: 0,
    duration_months: 12,
  });
  assert.strictEqual(res.is_valid, false);
  assert.strictEqual(res.error, 'Project name is required');
});

runTest('Studio Validator: Zero works SI returns invalid', () => {
  const res = validateEngineeringStudioInput({
    project_name: 'Metro Line 3',
    contractor_name: 'L&T',
    project_type: 'car',
    civil_si: 0,
    plant_si: 0,
    duration_months: 12,
  });
  assert.strictEqual(res.is_valid, false);
  assert.strictEqual(res.error, 'Project works sum insured must be positive');
});

runTest('Studio Validator: Duration < 1 month returns invalid', () => {
  const res = validateEngineeringStudioInput({
    project_name: 'Metro Line 3',
    contractor_name: 'L&T',
    project_type: 'car',
    civil_si: 10000000,
    plant_si: 0,
    duration_months: 0,
  });
  assert.strictEqual(res.is_valid, false);
  assert.strictEqual(res.error, 'Duration must be at least 1 month');
});

runTest('Studio Validator: Valid inputs return summary string formatted in Crores', () => {
  const res = validateEngineeringStudioInput({
    project_name: 'Bandra Coastal Bridge',
    contractor_name: 'L&T',
    project_type: 'car',
    civil_si: 120000000, // ₹12 Cr
    plant_si: 30000000,  // ₹3 Cr
    duration_months: 18,
  });
  assert.strictEqual(res.is_valid, true);
  assert.strictEqual(res.project_summary, 'Bandra Coastal Bridge (CAR) - ₹15.00 Cr');
});

// ============================================================================
// SUITE 7: STANDARD CONTRACT QUOTES & ALGORITHMIC EXPLAINABILITY
// ============================================================================
console.log('\n--- Suite 7: Standard Contract Quotes, GST & Algorithmic Explainability ---');

runTest('Standard CAR/EAR Quote: Includes 18% GST and explainability vector', () => {
  const quote = calculateCarEarQuote({
    project_type: 'ear',
    civil_works_value: 20000000,
    plant_machinery_value: 80000000,
    contract_period_months: 18,
    testing_period_months: 2,
    dlp_maintenance_months: 12,
    eq_zone: 2,
    stfi_opted: true,
  });
  assert.strictEqual(quote.lob_category, 'engineering');
  assert.strictEqual(quote.insurance_line, 'ear');
  assert.strictEqual(quote.gst_rate_percent, 18);
  assert.strictEqual(quote.gst_amount, Math.round(quote.net_premium * 0.18));
  assert.strictEqual(quote.total_premium, quote.net_premium + quote.gst_amount);
  assert.ok(quote.algorithmic_explainability.length >= 5);
  assert.ok(quote.statutory_clauses.length >= 3);
});

runTest('Standard MB Quote: Reinstatement Value clause and machinery itemization', () => {
  const quote = calculateMbQuote({
    machines: [
      { machine_id: 'LATHE_01', tariff_group: 2, current_replacement_value: 5000000 },
      { machine_id: 'COMP_01', tariff_group: 1, current_replacement_value: 2000000 },
    ],
    express_freight_percent: 10,
  });
  assert.strictEqual(quote.insurance_line, 'mb');
  assert.strictEqual(quote.gst_rate_percent, 18);
  assert.strictEqual(quote.total_premium, quote.net_premium + quote.gst_amount);
  assert.ok(quote.line_specific_breakdown.machines_summary.length === 2);
});

runTest('Standard EEI Quote: Multi-section breakdown and laptop cover', () => {
  const quote = calculateEeiQuote({
    section1_hardware_crv: 15000000,
    is_portable_laptop: true,
    section2_data_media_si: 3000000,
    section3_icow_si: 2000000,
    section3_icow_months: 6,
  });
  assert.strictEqual(quote.insurance_line, 'eei');
  assert.strictEqual(quote.sum_insured, 20000000);
  assert.strictEqual(quote.gst_amount, Math.round(quote.net_premium * 0.18));
});

runTest('Standard BPP Quote: Indian Boilers Act statutory warranty and pressure surcharge', () => {
  const quote = calculateBppQuote({
    vessel_type: 'water_tube',
    heating_surface_sqm: 200,
    operating_pressure_bar: 30, // > 20 bar
    replacement_value: 25000000,
    tpl_limit: 10000000,
  });
  assert.strictEqual(quote.insurance_line, 'bpp');
  assert.strictEqual(quote.gst_amount, Math.round(quote.net_premium * 0.18));
  assert.ok(quote.statutory_clauses.some((c) => c.includes('Indian Boilers Act')));
});

runTest('Unified Engineering Quote: Package mode aggregates multiple sections cleanly', () => {
  const quote = calculateEngineeringQuote({
    sub_line: 'package',
    car_ear_input: {
      project_type: 'car',
      civil_works_value: 50000000,
      plant_machinery_value: 10000000,
      contract_period_months: 12,
      eq_zone: 3,
    },
    mb_input: {
      machines: [{ machine_id: 'GEN_01', tariff_group: 2, current_replacement_value: 15000000 }],
    },
    eei_input: {
      section1_hardware_crv: 5000000,
    },
  });
  assert.strictEqual(quote.lob_category, 'engineering');
  assert.strictEqual(quote.sum_insured, 60000000 + 15000000 + 5000000);
  assert.ok(quote.net_premium > 0);
  assert.strictEqual(quote.total_premium, quote.net_premium + quote.gst_amount);
});

console.log('\n============================================================');
console.log(`  ALL ${passedTests} / ${totalTests} TESTS PASSED SUCCESSFULLY!`);
console.log('============================================================\n');
