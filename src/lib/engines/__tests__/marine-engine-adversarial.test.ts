/**
 * Comprehensive Adversarial Stress Test Harness for Marine Cargo & Logistics Underwriting Engine
 *
 * EMPIRICAL CHALLENGER TEST SUITE (Milestone 13):
 * 1. Incoterms Shippable Valuation & Markups Rigor (CIF, FOB, CFR, EXW across micro and macro scales)
 * 2. Commodity Hazard Classes 1-4, ITC Clauses (A, B, C) & Carrier Certification Surcharge (+25%) Matrix
 * 3. Customs Duty Cover Calculation (0%, 30%, 100%, 150%) & Institute War & Strikes Perils
 * 4. Statutory Floors Across Extreme Value Scales (₹1, ₹10k, ₹500k, ₹100 Crore, ₹5,000 Crore)
 * 5. Error Handling, Non-Positive Values & Defensive Invariants
 * 6. Section 64VB Cash Deposit (CD) Drawdown, Exact ₹0 Balance, 1-Rupee Shortfall & Cumulative Tracking
 * 7. StandardQuoteBreakdown Contract, 18% GST Invariant & Algorithmic Explainability Audit Trail
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
  STATUTORY_EXCESS_PERCENT,
  STATUTORY_GST_RATE,
  MarineCommodityHazard,
  MarineItcClause,
  OceanIccClause,
  OceanIncoterm,
  MopAccount,
} from '../marine-engine';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failureLog: string[] = [];

function challenge(description: string, fn: () => void) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  [PASS] ${description}`);
  } catch (err: any) {
    failedTests++;
    const msg = `  [FAIL] ${description}\n         Error: ${err.message || err}`;
    console.error(msg);
    failureLog.push(msg);
  }
}

export function runAdversarialMarineTestSuite() {
  console.log('\n================================================================');
  console.log('ADVERSARIAL STRESS TEST HARNESS: Marine Cargo Underwriting Engine');
  console.log('================================================================\n');

  // ===========================================================================
  // SECTION 1: Incoterms Shippable Valuation & Markups Rigor
  // ===========================================================================
  console.log('--- SECTION 1: Incoterms Shippable Valuation & Markups Rigor ---');

  challenge('CIF 110% Markup: Exact 10% imaginary profit on standard ₹10,000,000 consignment', () => {
    const res = calculateMarineOceanCargo({
      invoice_value_inr: 10000000,
      incoterm: 'CIF',
      icc_clause: 'ICC_A',
    });
    // CIF = 10,000,000 * 1.10 = 11,000,000
    assert.strictEqual(res.cargo_sum_insured, 11000000);
  });

  challenge('CIF 110% Markup: Exact integer rounding on micro consignment of ₹777', () => {
    const res = calculateMarineOceanCargo({
      invoice_value_inr: 777,
      incoterm: 'CIF',
      icc_clause: 'ICC_A',
    });
    // 777 * 1.10 = 854.7 -> Math.round = 855
    assert.strictEqual(res.cargo_sum_insured, 855);
  });

  challenge('FOB Default Markups: Adds 10% freight + 2% port charges then applies 110% (123.2% total)', () => {
    const res = calculateMarineOceanCargo({
      invoice_value_inr: 10000000,
      incoterm: 'FOB',
      icc_clause: 'ICC_A',
    });
    // Base = 10M + 1M (10% freight) + 0.2M (2% port) = 11.2M
    // Cargo SI = Math.round(11.2M * 1.10) = 12,320,000
    assert.strictEqual(res.cargo_sum_insured, 12320000);
  });

  challenge('FOB Explicit Markups: Incorporates specific ocean freight and port charges prior to 110%', () => {
    const res = calculateMarineOceanCargo({
      invoice_value_inr: 10000000,
      incoterm: 'FOB',
      icc_clause: 'ICC_A',
      ocean_freight_inr: 1500000, // 15% custom freight
      port_charges_inr: 350000,   // 3.5% custom port charges
    });
    // Base = 10M + 1.5M + 0.35M = 11.85M
    // Cargo SI = Math.round(11.85M * 1.10) = 13,035,000
    assert.strictEqual(res.cargo_sum_insured, 13035000);
  });

  challenge('CFR Default Markups: Mirrors FOB default (10% freight + 2% port, then 110%)', () => {
    const res = calculateMarineOceanCargo({
      invoice_value_inr: 10000000,
      incoterm: 'CFR',
      icc_clause: 'ICC_A',
    });
    assert.strictEqual(res.cargo_sum_insured, 12320000);
  });

  challenge('EXW Default Markups: Adds 5% inland transit + 10% ocean freight, then applies 110% (126.5% total)', () => {
    const res = calculateMarineOceanCargo({
      invoice_value_inr: 10000000,
      incoterm: 'EXW',
      icc_clause: 'ICC_A',
    });
    // Base = 10M + 0.5M (5% inland) + 1M (10% freight) = 11.5M
    // Cargo SI = Math.round(11.5M * 1.10) = 12,650,000
    assert.strictEqual(res.cargo_sum_insured, 12650000);
  });

  challenge('EXW Custom Ocean Freight: Uses explicit ocean freight alongside statutory 5% inland before 110%', () => {
    const res = calculateMarineOceanCargo({
      invoice_value_inr: 20000000,
      incoterm: 'EXW',
      icc_clause: 'ICC_A',
      ocean_freight_inr: 3000000,
    });
    // Base = 20M + 1M (5% inland) + 3M (custom freight) = 24M
    // Cargo SI = Math.round(24M * 1.10) = 26,400,000
    assert.strictEqual(res.cargo_sum_insured, 26400000);
  });

  challenge('Incoterms Valuation Monotonicity: CIF < FOB/CFR < EXW for identical base invoice', () => {
    const baseInvoice = 50000000;
    const cif = calculateMarineOceanCargo({ invoice_value_inr: baseInvoice, incoterm: 'CIF', icc_clause: 'ICC_A' });
    const fob = calculateMarineOceanCargo({ invoice_value_inr: baseInvoice, incoterm: 'FOB', icc_clause: 'ICC_A' });
    const cfr = calculateMarineOceanCargo({ invoice_value_inr: baseInvoice, incoterm: 'CFR', icc_clause: 'ICC_A' });
    const exw = calculateMarineOceanCargo({ invoice_value_inr: baseInvoice, incoterm: 'EXW', icc_clause: 'ICC_A' });

    assert.strictEqual(cif.cargo_sum_insured, 55000000); // 1.10x
    assert.strictEqual(fob.cargo_sum_insured, 61600000); // 1.232x
    assert.strictEqual(cfr.cargo_sum_insured, 61600000); // 1.232x
    assert.strictEqual(exw.cargo_sum_insured, 63250000); // 1.265x
    assert(cif.cargo_sum_insured < fob.cargo_sum_insured, 'CIF must be lower than FOB');
    assert.strictEqual(fob.cargo_sum_insured, cfr.cargo_sum_insured, 'Default FOB and CFR must be equal');
    assert(fob.cargo_sum_insured < exw.cargo_sum_insured, 'FOB must be lower than EXW');
  });

  // ===========================================================================
  // SECTION 2: Commodity Hazard Classes 1-4, ITC Clauses & Carrier Surcharge
  // ===========================================================================
  console.log('\n--- SECTION 2: Commodity Hazard Classes 1-4, ITC Clauses & Carrier Surcharge ---');

  const hazardClasses: MarineCommodityHazard[] = [1, 2, 3, 4];
  const itcClauses: MarineItcClause[] = ['ITC_A', 'ITC_B', 'ITC_C'];

  // Test full 24-point matrix
  for (const h of hazardClasses) {
    for (const c of itcClauses) {
      challenge(`Matrix Check: Hazard Class ${h} under ${c} (Certified vs Uncertified Carrier)`, () => {
        const baseRate = COMMODITY_HAZARD_RATES[h];
        const mult = ITC_CLAUSE_MULTIPLIERS[c];

        const certRes = calculateMarineInlandTransit({
          invoice_value: 100000000,
          transit_clause: c,
          commodity_hazard_class: h,
          is_certified_common_carrier: true,
        });

        const uncertRes = calculateMarineInlandTransit({
          invoice_value: 100000000,
          transit_clause: c,
          commodity_hazard_class: h,
          is_certified_common_carrier: false,
        });

        const expectedCertRate = Number((baseRate * mult * 1.0).toFixed(6));
        const expectedUncertRate = Number((baseRate * mult * 1.25).toFixed(6));

        assert.strictEqual(Number(certRes.base_rate_per_mille.toFixed(6)), expectedCertRate);
        assert.strictEqual(Number(uncertRes.base_rate_per_mille.toFixed(6)), expectedUncertRate);

        // Verify uncertified carrier rate is exactly 1.25x certified rate
        assert.strictEqual(Number((certRes.base_rate_per_mille * 1.25).toFixed(6)), Number(uncertRes.base_rate_per_mille.toFixed(6)));
      });
    }
  }

  challenge('Commodity Hazard Monotonicity: Class 1 < Class 2 < Class 3 < Class 4 under all clauses', () => {
    for (const clause of itcClauses) {
      const r1 = calculateMarineInlandTransit({ invoice_value: 100000000, transit_clause: clause, commodity_hazard_class: 1, is_certified_common_carrier: true });
      const r2 = calculateMarineInlandTransit({ invoice_value: 100000000, transit_clause: clause, commodity_hazard_class: 2, is_certified_common_carrier: true });
      const r3 = calculateMarineInlandTransit({ invoice_value: 100000000, transit_clause: clause, commodity_hazard_class: 3, is_certified_common_carrier: true });
      const r4 = calculateMarineInlandTransit({ invoice_value: 100000000, transit_clause: clause, commodity_hazard_class: 4, is_certified_common_carrier: true });

      assert(r1.base_rate_per_mille < r2.base_rate_per_mille, `Class 1 < Class 2 under ${clause}`);
      assert(r2.base_rate_per_mille < r3.base_rate_per_mille, `Class 2 < Class 3 under ${clause}`);
      assert(r3.base_rate_per_mille < r4.base_rate_per_mille, `Class 3 < Class 4 under ${clause}`);
      assert(r1.net_marine_premium < r2.net_marine_premium, `Premium Class 1 < Class 2 under ${clause}`);
      assert(r2.net_marine_premium < r3.net_marine_premium, `Premium Class 2 < Class 3 under ${clause}`);
      assert(r3.net_marine_premium < r4.net_marine_premium, `Premium Class 3 < Class 4 under ${clause}`);
    }
  });

  challenge('ITC Clause Hierarchy: ITC C (0.60x) < ITC B (0.80x) < ITC A (1.0x) under all hazard classes', () => {
    for (const hazard of hazardClasses) {
      const itcA = calculateMarineInlandTransit({ invoice_value: 100000000, transit_clause: 'ITC_A', commodity_hazard_class: hazard, is_certified_common_carrier: true });
      const itcB = calculateMarineInlandTransit({ invoice_value: 100000000, transit_clause: 'ITC_B', commodity_hazard_class: hazard, is_certified_common_carrier: true });
      const itcC = calculateMarineInlandTransit({ invoice_value: 100000000, transit_clause: 'ITC_C', commodity_hazard_class: hazard, is_certified_common_carrier: true });

      assert(itcC.base_rate_per_mille < itcB.base_rate_per_mille, `ITC C < ITC B for Class ${hazard}`);
      assert(itcB.base_rate_per_mille < itcA.base_rate_per_mille, `ITC B < ITC A for Class ${hazard}`);
      assert(itcC.net_marine_premium < itcB.net_marine_premium, `Premium ITC C < ITC B for Class ${hazard}`);
      assert(itcB.net_marine_premium < itcA.net_marine_premium, `Premium ITC B < ITC A for Class ${hazard}`);
    }
  });

  // ===========================================================================
  // SECTION 3: Customs Duty Cover & Institute War & Strikes
  // ===========================================================================
  console.log('\n--- SECTION 3: Customs Duty Cover & Institute War & Strikes ---');

  challenge('Customs Duty Cover Default: Rated at 50% of ICC (A) rate (0.35‰ * 0.50 = 0.175‰) on default 30% CIF duty SI', () => {
    const res = calculateMarineOceanCargo({
      invoice_value_inr: 10000000,
      incoterm: 'CIF',
      icc_clause: 'ICC_A',
      customs_duty_opted: true,
    });
    // Cargo SI = 11,000,000
    // Duty SI = 11,000,000 * 0.30 = 3,300,000
    assert.strictEqual(res.duty_sum_insured, 3300000);
    // Duty Premium = Math.round(3,300,000 * (0.35 * 0.50) / 1000) = Math.round(577.5) = 578
    assert.strictEqual(res.duty_premium, 578);
  });

  challenge('Customs Duty Cover Under ICC (B): Rated at 50% of ICC (B) rate (0.26‰ * 0.50 = 0.13‰)', () => {
    const res = calculateMarineOceanCargo({
      invoice_value_inr: 10000000,
      incoterm: 'CIF',
      icc_clause: 'ICC_B',
      customs_duty_opted: true,
      customs_duty_rate_percent: 40,
    });
    // Cargo SI = 11,000,000
    // Duty SI = 11M * 0.40 = 4,400,000
    assert.strictEqual(res.duty_sum_insured, 4400000);
    // Duty Premium = Math.round(4.4M * 0.00013) = Math.round(572) = 572
    assert.strictEqual(res.duty_premium, 572);
  });

  challenge('Customs Duty Cover Under ICC (C): Rated at 50% of ICC (C) rate (0.18‰ * 0.50 = 0.09‰)', () => {
    const res = calculateMarineOceanCargo({
      invoice_value_inr: 10000000,
      incoterm: 'CIF',
      icc_clause: 'ICC_C',
      customs_duty_opted: true,
      customs_duty_rate_percent: 50,
    });
    // Cargo SI = 11,000,000
    // Duty SI = 11M * 0.50 = 5,500,000
    assert.strictEqual(res.duty_sum_insured, 5500000);
    // Duty Premium = Math.round(5.5M * 0.00009) = Math.round(495) = 495
    assert.strictEqual(res.duty_premium, 495);
  });

  challenge('Customs Duty High Tariff Rate (150% for automotive/spirits luxury imports)', () => {
    const res = calculateMarineOceanCargo({
      invoice_value_inr: 10000000,
      incoterm: 'CIF',
      icc_clause: 'ICC_A',
      customs_duty_opted: true,
      customs_duty_rate_percent: 150,
    });
    // Cargo SI = 11,000,000
    // Duty SI = 11M * 1.50 = 16,500,000
    assert.strictEqual(res.duty_sum_insured, 16500000);
    assert.strictEqual(res.total_sum_insured, 27500000);
    // Duty Premium = Math.round(16.5M * 0.000175) = Math.round(2887.5) = 2888
    assert.strictEqual(res.duty_premium, 2888);
  });

  challenge('Customs Duty Opted = False: Yields zero duty SI and zero duty premium', () => {
    const res = calculateMarineOceanCargo({
      invoice_value_inr: 10000000,
      incoterm: 'CIF',
      icc_clause: 'ICC_A',
      customs_duty_opted: false,
      customs_duty_rate_percent: 30,
    });
    assert.strictEqual(res.duty_sum_insured, 0);
    assert.strictEqual(res.duty_premium, 0);
    assert.strictEqual(res.total_sum_insured, res.cargo_sum_insured);
  });

  challenge('Customs Duty Opted = True with 0% Duty Rate: Yields zero duty SI and zero duty premium', () => {
    const res = calculateMarineOceanCargo({
      invoice_value_inr: 10000000,
      incoterm: 'CIF',
      icc_clause: 'ICC_A',
      customs_duty_opted: true,
      customs_duty_rate_percent: 0,
    });
    assert.strictEqual(res.duty_sum_insured, 0);
    assert.strictEqual(res.duty_premium, 0);
    assert.strictEqual(res.total_sum_insured, res.cargo_sum_insured);
  });

  challenge('Institute War & Strikes Opted: Exactly 0.05‰ on cargo SI (independent of duty cover)', () => {
    const res = calculateMarineOceanCargo({
      invoice_value_inr: 20000000,
      incoterm: 'CIF',
      icc_clause: 'ICC_A',
      customs_duty_opted: true,
      customs_duty_rate_percent: 50,
      war_and_strikes_opted: true,
    });
    // Cargo SI = 22,000,000
    // Duty SI = 11,000,000
    // War premium applies strictly to Cargo SI: 22M * 0.00005 = 1100
    assert.strictEqual(res.war_premium, 1100);
    assert.strictEqual(res.cargo_premium, 7700); // 22M * 0.00035 = 7700
    // Duty Premium: 11M * (0.35 * 0.50) / 1000 = 11M * 0.000175 = 1925
    assert.strictEqual(res.duty_premium, 1925);
    assert.strictEqual(res.net_marine_premium, 7700 + 1925 + 1100); // 10725
  });

  challenge('Institute War & Strikes Opted = False: Yields zero war premium', () => {
    const res = calculateMarineOceanCargo({
      invoice_value_inr: 10000000,
      incoterm: 'CIF',
      icc_clause: 'ICC_A',
      war_and_strikes_opted: false,
    });
    assert.strictEqual(res.war_premium, 0);
  });

  // ===========================================================================
  // SECTION 4: Statutory Floors Across Extreme Value Scales
  // ===========================================================================
  console.log('\n--- SECTION 4: Statutory Floors Across Extreme Value Scales ---');

  const microAndEdgeValues = [1, 10, 100, 1000, 10000, 100000, 500000];

  for (const val of microAndEdgeValues) {
    challenge(`Statutory Minimum Premium Floor ₹1,000 clamped for Inland consignment of ₹${val}`, () => {
      const res = calculateMarineInlandTransit({
        invoice_value: val,
        transit_clause: 'ITC_A',
        commodity_hazard_class: 1, // lowest rate 0.06‰
        is_certified_common_carrier: true,
      });
      // At ₹500,000 * 0.00006 = ₹30 raw premium -> must clamp to ₹1,000
      assert.strictEqual(res.net_marine_premium, 1000);
    });

    challenge(`Statutory Minimum Premium Floor ₹1,000 clamped for Ocean consignment of ₹${val}`, () => {
      const res = calculateMarineOceanCargo({
        invoice_value_inr: val,
        incoterm: 'CIF',
        icc_clause: 'ICC_C', // lowest rate 0.18‰
      });
      assert.strictEqual(res.net_marine_premium, 1000);
    });
  }

  challenge('Policy Excess Floor ₹2,500 clamped for values below ₹500,000', () => {
    const values = [1, 100, 1000, 50000, 100000, 250000, 499999];
    for (const v of values) {
      const res = calculateMarineInlandTransit({
        invoice_value: v,
        transit_clause: 'ITC_A',
        commodity_hazard_class: 2,
        is_certified_common_carrier: true,
      });
      // 0.5% of 499,999 = 2499.995 -> clamped to ₹2,500
      assert.strictEqual(res.policy_excess, 2500, `Excess for ₹${v} should be ₹2,500`);
    }
  });

  challenge('Policy Excess Exact Boundary at ₹500,000 (0.5% = ₹2,500 exact)', () => {
    const res = calculateMarineInlandTransit({
      invoice_value: 500000,
      transit_clause: 'ITC_A',
      commodity_hazard_class: 2,
      is_certified_common_carrier: true,
    });
    assert.strictEqual(res.policy_excess, 2500);
  });

  challenge('Policy Excess Scales Proportionately (0.5%) above ₹500,000 threshold', () => {
    const testCases = [
      { val: 1000000, expectedExcess: 5000 },       // ₹10 Lakhs -> ₹5,000
      { val: 10000000, expectedExcess: 50000 },     // ₹1 Crore -> ₹50,000
      { val: 100000000, expectedExcess: 500000 },   // ₹10 Crore -> ₹500,000
      { val: 1000000000, expectedExcess: 5000000 }, // ₹100 Crore -> ₹5,000,000
    ];

    for (const tc of testCases) {
      const res = calculateMarineInlandTransit({
        invoice_value: tc.val,
        transit_clause: 'ITC_A',
        commodity_hazard_class: 2,
        is_certified_common_carrier: true,
      });
      assert.strictEqual(res.policy_excess, tc.expectedExcess);
    }
  });

  challenge('Smooth Transition above Statutory Minimum Premium Floor', () => {
    // Class 4 Uncertified: 0.55 * 1.25 = 0.6875‰
    // Threshold: 1000 / 0.0006875 = 1,454,545.45
    const justBelow = calculateMarineInlandTransit({
      invoice_value: 1400000,
      transit_clause: 'ITC_A',
      commodity_hazard_class: 4,
      is_certified_common_carrier: false,
    });
    // 1.4M * 0.0006875 = 962.5 -> clamped to 1000
    assert.strictEqual(justBelow.net_marine_premium, 1000);

    const justAbove = calculateMarineInlandTransit({
      invoice_value: 1500000,
      transit_clause: 'ITC_A',
      commodity_hazard_class: 4,
      is_certified_common_carrier: false,
    });
    // 1.5M * 0.0006875 = 1031.25 -> rounded to 1031
    assert.strictEqual(justAbove.net_marine_premium, 1031);
    assert(justAbove.net_marine_premium > 1000, 'Premium above floor should exceed ₹1,000');
  });

  challenge('Mega-Consignment Stress: ₹5,000 Crore (₹50 Billion) operates without precision loss', () => {
    const hugeVal = 50000000000;
    const inland = calculateMarineInlandTransit({
      invoice_value: hugeVal,
      transit_clause: 'ITC_A',
      commodity_hazard_class: 1,
      is_certified_common_carrier: true,
    });
    // 50B * 0.00006 = 3,000,000
    assert.strictEqual(inland.net_marine_premium, 3000000);
    assert.strictEqual(inland.policy_excess, 250000000); // 0.5% of 50B

    const ocean = calculateMarineOceanCargo({
      invoice_value_inr: hugeVal,
      incoterm: 'CIF',
      icc_clause: 'ICC_A',
      war_and_strikes_opted: true,
    });
    // Cargo SI = 55 Billion
    assert.strictEqual(ocean.cargo_sum_insured, 55000000000);
    // Cargo Premium = 55B * 0.00035 = 19,250,000
    assert.strictEqual(ocean.cargo_premium, 19250000);
    // War Premium = 55B * 0.00005 = 2,750,000
    assert.strictEqual(ocean.war_premium, 2750000);
    assert.strictEqual(ocean.net_marine_premium, 22000000);
  });

  // ===========================================================================
  // SECTION 5: Error Handling, Non-Positive Values & Defensive Invariants
  // ===========================================================================
  console.log('\n--- SECTION 5: Error Handling, Non-Positive Values & Defensive Invariants ---');

  challenge('Inland Transit: Zero invoice value throws explicit Error', () => {
    assert.throws(
      () => calculateMarineInlandTransit({ invoice_value: 0, transit_clause: 'ITC_A', commodity_hazard_class: 1, is_certified_common_carrier: true }),
      /Invoice value must be greater than zero/
    );
  });

  challenge('Inland Transit: Negative invoice value throws explicit Error', () => {
    assert.throws(
      () => calculateMarineInlandTransit({ invoice_value: -100000, transit_clause: 'ITC_A', commodity_hazard_class: 1, is_certified_common_carrier: true }),
      /Invoice value must be greater than zero/
    );
  });

  challenge('Ocean Cargo: Zero invoice value throws explicit Error', () => {
    assert.throws(
      () => calculateMarineOceanCargo({ invoice_value_inr: 0, incoterm: 'CIF', icc_clause: 'ICC_A' }),
      /Invoice value must be greater than zero/
    );
  });

  challenge('Ocean Cargo: Negative invoice value throws explicit Error', () => {
    assert.throws(
      () => calculateMarineOceanCargo({ invoice_value_inr: -500000, incoterm: 'CIF', icc_clause: 'ICC_A' }),
      /Invoice value must be greater than zero/
    );
  });

  challenge('Studio Proposal Validation: Rejects empty client name', () => {
    const res = validateMarineStudioProposal({
      client_name: '',
      policy_type: 'single_voyage',
      origin: 'Mumbai',
      destination: 'Delhi',
      commodity: 'Textiles',
      consignment_value: 1000000,
      clause: 'ITC_A',
    });
    assert.strictEqual(res.is_valid, false);
    assert.strictEqual(res.error, 'Client name is required');
  });

  challenge('Studio Proposal Validation: Rejects empty origin or destination', () => {
    const res1 = validateMarineStudioProposal({
      client_name: 'Tata Steel',
      policy_type: 'single_voyage',
      origin: '',
      destination: 'Delhi',
      commodity: 'Steel Coils',
      consignment_value: 1000000,
      clause: 'ITC_A',
    });
    assert.strictEqual(res1.is_valid, false);
    assert.strictEqual(res1.error, 'Origin and Destination required');

    const res2 = validateMarineStudioProposal({
      client_name: 'Tata Steel',
      policy_type: 'single_voyage',
      origin: 'Jamshedpur',
      destination: '',
      commodity: 'Steel Coils',
      consignment_value: 1000000,
      clause: 'ITC_A',
    });
    assert.strictEqual(res2.is_valid, false);
    assert.strictEqual(res2.error, 'Origin and Destination required');
  });

  challenge('Studio Proposal Validation: Rejects non-positive consignment value', () => {
    const zeroRes = validateMarineStudioProposal({
      client_name: 'Tata Steel',
      policy_type: 'single_voyage',
      origin: 'Jamshedpur',
      destination: 'Kolkata',
      commodity: 'Steel Coils',
      consignment_value: 0,
      clause: 'ITC_A',
    });
    assert.strictEqual(zeroRes.is_valid, false);
    assert.strictEqual(zeroRes.error, 'Consignment value must be positive');

    const negRes = validateMarineStudioProposal({
      client_name: 'Tata Steel',
      policy_type: 'single_voyage',
      origin: 'Jamshedpur',
      destination: 'Kolkata',
      commodity: 'Steel Coils',
      consignment_value: -1000,
      clause: 'ITC_A',
    });
    assert.strictEqual(negRes.is_valid, false);
    assert.strictEqual(negRes.error, 'Consignment value must be positive');
  });

  challenge('Polymorphic calculateMarineQuote router throws on missing sub-inputs', () => {
    assert.throws(
      () => calculateMarineQuote({ transit_type: 'inland' }),
      /Inland transit input parameters are required/
    );

    assert.throws(
      () => calculateMarineQuote({ transit_type: 'ocean' }),
      /Ocean cargo input parameters are required/
    );

    assert.throws(
      () => calculateMarineQuote({ transit_type: 'rail' as any }),
      /Unsupported marine transit type/
    );
  });

  // ===========================================================================
  // SECTION 6: Section 64VB Cash Deposit (CD) Drawdown & Accounting Invariants
  // ===========================================================================
  console.log('\n--- SECTION 6: Section 64VB Cash Deposit (CD) Drawdown & Accounting Invariants ---');

  challenge('Standard Drawdown: Correctly debits balance, increments utilized SI, and issues certificate', () => {
    const acc: MopAccount = {
      policy_number: 'MOP-2026-CHAL-01',
      deposit_premium_balance: 50000,
      total_sum_insured: 100000000,
      utilized_sum_insured: 20000000,
    };
    // 10M consignment @ 0.25‰ = 2,500 debit
    const res = processMopDeclaration(acc, 10000000, 0.25);
    assert.strictEqual(res.certificate_issued, true);
    assert.strictEqual(res.debit_amount, 2500);
    assert.strictEqual(res.updated_account.deposit_premium_balance, 47500);
    assert.strictEqual(res.updated_account.utilized_sum_insured, 30000000);
    assert.strictEqual(res.warning, undefined);
  });

  challenge('Exact ₹0 Balance Drawdown: Succeeds, sets balance to ₹0, issues certificate, and warns', () => {
    const acc: MopAccount = {
      policy_number: 'MOP-2026-CHAL-02',
      deposit_premium_balance: 3000,
      total_sum_insured: 50000000,
      utilized_sum_insured: 0,
    };
    // 12M consignment @ 0.25‰ = 3,000 debit (exact match)
    const res = processMopDeclaration(acc, 12000000, 0.25);
    assert.strictEqual(res.certificate_issued, true);
    assert.strictEqual(res.debit_amount, 3000);
    assert.strictEqual(res.updated_account.deposit_premium_balance, 0);
    assert.strictEqual(res.updated_account.utilized_sum_insured, 12000000);
    assert(res.warning?.includes('LOW_CD_BALANCE_WARNING') ?? false, 'Should emit low CD balance warning');
  });

  challenge('1-Rupee Shortfall Deficit: Strictly rejected under Sec 64VB without altering account state', () => {
    const acc: MopAccount = {
      policy_number: 'MOP-2026-CHAL-03',
      deposit_premium_balance: 2999, // 1-rupee deficit
      total_sum_insured: 50000000,
      utilized_sum_insured: 15000000,
    };
    // 12M consignment @ 0.25‰ = 3,000 debit
    const res = processMopDeclaration(acc, 12000000, 0.25);
    assert.strictEqual(res.certificate_issued, false);
    assert.strictEqual(res.debit_amount, 0);
    assert.strictEqual(res.updated_account.deposit_premium_balance, 2999); // untouched
    assert.strictEqual(res.updated_account.utilized_sum_insured, 15000000); // untouched
    assert(res.warning?.includes('CD_BALANCE_EXHAUSTED') ?? false, 'Should flag CD_BALANCE_EXHAUSTED');
  });

  challenge('Low CD Balance Warning Threshold: Exactly ₹9,999 warns, while exactly ₹10,000 does NOT warn', () => {
    // Case A: Remaining balance = ₹9,999 (< 10000)
    const accA: MopAccount = {
      policy_number: 'MOP-A',
      deposit_premium_balance: 10999,
      total_sum_insured: 10000000,
      utilized_sum_insured: 0,
    };
    const resA = processMopDeclaration(accA, 4000000, 0.25); // debits 1000 -> 9999
    assert.strictEqual(resA.updated_account.deposit_premium_balance, 9999);
    assert(resA.warning?.includes('LOW_CD_BALANCE_WARNING') ?? false, '₹9,999 should trigger low balance warning');

    // Case B: Remaining balance = ₹10,000 (not < 10000)
    const accB: MopAccount = {
      policy_number: 'MOP-B',
      deposit_premium_balance: 11000,
      total_sum_insured: 10000000,
      utilized_sum_insured: 0,
    };
    const resB = processMopDeclaration(accB, 4000000, 0.25); // debits 1000 -> 10000
    assert.strictEqual(resB.updated_account.deposit_premium_balance, 10000);
    assert.strictEqual(resB.warning, undefined, '₹10,000 should NOT trigger low balance warning');
  });

  challenge('Zero-Value Consignment Dispatch: Leaves CD balance intact and issues certificate', () => {
    const acc: MopAccount = {
      policy_number: 'MOP-ZERO',
      deposit_premium_balance: 20000,
      total_sum_insured: 100000000,
      utilized_sum_insured: 5000000,
    };
    const res = processMopDeclaration(acc, 0, 0.25);
    assert.strictEqual(res.certificate_issued, true);
    assert.strictEqual(res.debit_amount, 0);
    assert.strictEqual(res.updated_account.deposit_premium_balance, 20000);
    assert.strictEqual(res.updated_account.utilized_sum_insured, 5000000);
  });

  challenge('Cumulative Multi-Declaration Tracking: Iterative ledger consistency across 5 dispatches', () => {
    let current: MopAccount = {
      policy_number: 'MOP-SERIES',
      deposit_premium_balance: 100000,
      total_sum_insured: 200000000,
      utilized_sum_insured: 0,
    };

    const dispatches = [
      { val: 10000000, rate: 0.12, expectedDebit: 1200 },
      { val: 20000000, rate: 0.25, expectedDebit: 5000 },
      { val: 15000000, rate: 0.06, expectedDebit: 900 },
      { val: 30000000, rate: 0.55, expectedDebit: 16500 },
      { val: 25000000, rate: 0.20, expectedDebit: 5000 },
    ];

    let runningBalance = 100000;
    let runningUtilizedSi = 0;

    for (const d of dispatches) {
      const res = processMopDeclaration(current, d.val, d.rate);
      assert.strictEqual(res.certificate_issued, true);
      assert.strictEqual(res.debit_amount, d.expectedDebit);

      runningBalance -= d.expectedDebit;
      runningUtilizedSi += d.val;

      assert.strictEqual(res.updated_account.deposit_premium_balance, runningBalance);
      assert.strictEqual(res.updated_account.utilized_sum_insured, runningUtilizedSi);

      current = res.updated_account;
    }

    assert.strictEqual(current.deposit_premium_balance, 71400); // 100,000 - 28,600
    assert.strictEqual(current.utilized_sum_insured, 100000000); // 100M total
  });

  challenge('Batch Declaration Processor: Handles mid-stream CD balance exhaustion cleanly', () => {
    const acc: MopAccount = {
      policy_number: 'MOP-BATCH',
      deposit_premium_balance: 5000,
      total_sum_insured: 100000000,
      utilized_sum_insured: 0,
    };

    const declarations = [
      { invoice_no: 'INV-01', consignment_value: 10000000, rate_per_mille: 0.20 }, // debits 2000 -> balance 3000
      { invoice_no: 'INV-02', consignment_value: 10000000, rate_per_mille: 0.20 }, // debits 2000 -> balance 1000
      { invoice_no: 'INV-03', consignment_value: 10000000, rate_per_mille: 0.20 }, // needs 2000 > 1000 -> FAILS
      { invoice_no: 'INV-04', consignment_value: 10000000, rate_per_mille: 0.20 }, // needs 2000 > 1000 -> FAILS
    ];

    const batch = processBatchDeclarations(acc, declarations);
    assert.strictEqual(batch.total_declarations, 4);
    assert.strictEqual(batch.successful_declarations, 2);
    assert.strictEqual(batch.failed_declarations, 2);
    assert.strictEqual(batch.total_premium_debited, 4000);
    assert.strictEqual(batch.total_utilized_si_added, 20000000);
    assert.strictEqual(batch.final_account.deposit_premium_balance, 1000);
    assert.strictEqual(batch.overall_status, 'CD_BALANCE_EXHAUSTED');
    assert(batch.overall_warning?.includes('Sec 64VB Block') ?? false, 'Overall warning flags Sec 64VB');
  });

  // ===========================================================================
  // SECTION 7: Standard Quote Breakdown, 18% GST & Algorithmic Explainability
  // ===========================================================================
  console.log('\n--- SECTION 7: Standard Quote Breakdown, 18% GST & Algorithmic Explainability ---');

  challenge('Inland Quote Breakdown: Conforms strictly to StandardQuoteBreakdown with 18% GST math', () => {
    const quote = calculateMarineInlandQuote({
      invoice_value: 10000000,
      transit_clause: 'ITC_A',
      commodity_hazard_class: 2,
      is_certified_common_carrier: true,
      client_name: 'Reliance Retail',
      origin: 'Bhiwandi, Maharashtra',
      destination: 'Bengaluru, Karnataka',
    });

    assert.strictEqual(quote.lob_category, 'marine');
    assert.strictEqual(quote.insurance_line, 'marine_cargo_inland');
    assert.strictEqual(quote.sum_insured, 10000000);
    assert.strictEqual(quote.base_rate_per_mille, 0.12);
    assert.strictEqual(quote.net_premium, 1200);
    assert.strictEqual(quote.gst_rate_percent, 18);
    // 1200 * 0.18 = 216
    assert.strictEqual(quote.gst_amount, 216);
    assert.strictEqual(quote.total_premium, 1416);
    assert.strictEqual(quote.total_premium, quote.net_premium + quote.gst_amount);

    // Verify statutory clauses
    assert(quote.statutory_clauses.some((c) => c.includes('Section 64VB')));
    assert(quote.statutory_clauses.some((c) => c.includes('Carriage by Road Act, 2007')));
    assert(quote.statutory_clauses.some((c) => c.includes('Inland Transit (Rail/Road) Clauses (A)')));
    assert(quote.statutory_clauses.some((c) => c.includes('Policy Excess')));

    // Verify 6-step explainability vector
    assert.strictEqual(quote.algorithmic_explainability.length, 6);
    for (const step of quote.algorithmic_explainability) {
      assert(step.step && step.description && step.value, `Step ${step.step} must have complete properties`);
    }
  });

  challenge('Ocean Quote Breakdown: Conforms strictly to StandardQuoteBreakdown with duty and war endorsements', () => {
    const quote = calculateMarineOceanQuote({
      invoice_value_inr: 20000000,
      incoterm: 'CIF',
      icc_clause: 'ICC_A',
      customs_duty_opted: true,
      customs_duty_rate_percent: 30,
      war_and_strikes_opted: true,
      client_name: 'Adani Ports & SEZ',
      origin: 'JNPT Mumbai, India',
      destination: 'Rotterdam, Netherlands',
    });

    assert.strictEqual(quote.lob_category, 'marine');
    assert.strictEqual(quote.insurance_line, 'marine_cargo_ocean');
    // Cargo SI = 22M, Duty SI = 6.6M -> Total SI = 28.6M
    assert.strictEqual(quote.sum_insured, 28600000);
    assert.strictEqual(quote.base_rate_per_mille, 0.35);

    // Cargo Premium = 22M * 0.00035 = 7700
    // Duty Premium = 6.6M * 0.000175 = 1155
    // War Premium = 22M * 0.00005 = 1100
    // Net = 7700 + 1155 + 1100 = 9955
    assert.strictEqual(quote.net_premium, 9955);
    // GST = Math.round(9955 * 0.18) = Math.round(1791.9) = 1792
    assert.strictEqual(quote.gst_amount, 1792);
    assert.strictEqual(quote.total_premium, 11747);
    assert.strictEqual(quote.total_premium, quote.net_premium + quote.gst_amount);

    // Verify statutory clauses
    assert(quote.statutory_clauses.some((c) => c.includes('Section 64VB')));
    assert(quote.statutory_clauses.some((c) => c.includes('Institute Cargo Clauses (ICC_A)')));
    assert(quote.statutory_clauses.some((c) => c.includes('Customs Duty Insurance Endorsement')));
    assert(quote.statutory_clauses.some((c) => c.includes('Institute War & Strikes Clauses')));

    // Verify 6-step explainability vector
    assert.strictEqual(quote.algorithmic_explainability.length, 6);
  });

  challenge('GST Rounding Invariant across 100 randomized premium amounts', () => {
    // Generate 100 randomized consignment values between ₹100,000 and ₹500,000,000
    for (let i = 1; i <= 100; i++) {
      const randomVal = 100000 + Math.floor(Math.random() * 499900000);
      const quote = calculateMarineInlandQuote({
        invoice_value: randomVal,
        transit_clause: 'ITC_A',
        commodity_hazard_class: (1 + (i % 4)) as MarineCommodityHazard,
        is_certified_common_carrier: i % 2 === 0,
      });

      const expectedGst = Math.round(quote.net_premium * 0.18);
      assert.strictEqual(quote.gst_amount, expectedGst);
      assert.strictEqual(quote.total_premium, quote.net_premium + expectedGst);
    }
  });

  // ===========================================================================
  // SUMMARY
  // ===========================================================================
  console.log('\n================================================================');
  console.log(`ADVERSARIAL STRESS TEST RESULTS: ${passedTests} / ${totalTests} PASSED`);
  if (failedTests > 0) {
    console.log(`FAILED TESTS: ${failedTests}`);
    for (const fail of failureLog) {
      console.log(fail);
    }
    console.log('================================================================\n');
    process.exit(1);
  } else {
    console.log('ALL ADVERSARIAL CHALLENGES EMPIRICALLY VERIFIED (100% PASS)');
    console.log('================================================================\n');
  }
}

// Execute test suite when run directly
runAdversarialMarineTestSuite();
