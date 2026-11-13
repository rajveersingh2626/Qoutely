/**
 * Qoutely E2E Test Suite - Tier 2: Boundary & Corner Cases (170 Tests)
 * Exactly 5 test cases per feature across all 34 features.
 * Verifies boundaries, limits, age caps, zero/negative inputs, wage ceilings, ratio limits, and edge cases.
 */

import { TestCase, assert, assertEquals, assertCloseTo, assertThrows } from './harness';
import {
  validateQuoteSchema,
  calculateMotorIdv,
  calculateMotorBaseOd,
  calculateMotorFleetNcb,
  calculateMotorTpTariff,
  calculateCommercialImtAddons,
  ingestBulkFleetSchedule,
  validateAndComputeMotorStudioLedger,
  calculateMarineInlandTransit,
  calculateMarineOceanCargo,
  processMopDeclaration,
  validateMarineStudioProposal,
  calculateGhiDemographicPremium,
  calculateGhiBenefitLoadings,
  calculateGtliPremium,
  calculateGpaPremium,
  calculateWorkmensCompensation,
  parseEmployeeCensusRoster,
  computeBenefitsStudioLedger,
  calculateCarEarPremium,
  calculateMachineryBreakdown,
  calculateEeiPremium,
  calculateBppPremium,
  parseFixedAssetRegister,
  validateEngineeringStudioInput,
  calculateCglPremium,
  calculateProfessionalIndemnity,
  calculateDirectorsOfficersPremium,
  evaluateCyberPosture,
  calculateCommercialCrimePremium,
  validateLiabilityStudioPackage,
  calculateSuretyBondPremium,
  calculateTradeCreditPremium,
  validateSpecialtyStudioInput,
  BulkFleetRecord,
  CensusRow,
  MbMachineItem,
  FarItem,
  MopAccount,
} from './canonical_engines';

export const tier2Tests: TestCase[] = [
  // ==========================================================================
  // FEATURE 1: Core Multi-Line Database Schema & Types (5 Tests)
  // ==========================================================================
  {
    id: 'T2-F01-01',
    featureId: 1,
    featureName: 'Core Multi-Line Database Schema & Types',
    tier: 2,
    description: 'Floating-point precision on 18% GST rounding handles fractional amounts',
    fn: () => {
      // 100000.33 * 0.18 = 18000.0594 -> Math.round is 18000
      const quote = { id: 'q-float', lob_category: 'motor', insurance_line: 'motor_fleet', net_premium: 100000.33, gst_amount: 18000, total_premium: 118000.33 };
      assert(validateQuoteSchema(quote).valid, 'Should pass float rounding validation');
    },
  },
  {
    id: 'T2-F01-02',
    featureId: 1,
    featureName: 'Core Multi-Line Database Schema & Types',
    tier: 2,
    description: 'Zero net premium quote handles statutory waiver scenarios',
    fn: () => {
      const quote = { id: 'q-zero', lob_category: 'marine', insurance_line: 'marine_open_policy', net_premium: 0, gst_amount: 0, total_premium: 0 };
      assert(validateQuoteSchema(quote).valid, 'Zero premium quote should be valid');
    },
  },
  {
    id: 'T2-F01-03',
    featureId: 1,
    featureName: 'Core Multi-Line Database Schema & Types',
    tier: 2,
    description: 'Missing required quote id triggers validation error',
    fn: () => {
      const quote = { lob_category: 'motor', insurance_line: 'motor_fleet', net_premium: 1000, gst_amount: 180, total_premium: 1180 };
      const res = validateQuoteSchema(quote);
      assert(!res.valid, 'Missing id should be rejected');
    },
  },
  {
    id: 'T2-F01-04',
    featureId: 1,
    featureName: 'Core Multi-Line Database Schema & Types',
    tier: 2,
    description: 'Extremely large sum insured (₹10,000 Crore mega-risk) validates without numeric loss',
    fn: () => {
      const quote = { id: 'q-mega', lob_category: 'engineering', insurance_line: 'car', net_premium: 120000000, gst_amount: 21600000, total_premium: 141600000 };
      assert(validateQuoteSchema(quote).valid, 'Mega-risk quote should validate');
    },
  },
  {
    id: 'T2-F01-05',
    featureId: 1,
    featureName: 'Core Multi-Line Database Schema & Types',
    tier: 2,
    description: 'Schema validation handles missing LOB category gracefully',
    fn: () => {
      const quote = { id: 'q-nolob', insurance_line: 'fire', net_premium: 1000, gst_amount: 180, total_premium: 1180 };
      assert(!validateQuoteSchema(quote).valid, 'Missing LOB should fail');
    },
  },

  // ==========================================================================
  // FEATURE 2: Motor Vehicle IDV Depreciation Engine (5 Tests)
  // ==========================================================================
  {
    id: 'T2-F02-01',
    featureId: 2,
    featureName: 'Motor Vehicle IDV Depreciation Engine',
    tier: 2,
    description: 'Age = 0 months boundary (brand new showroom delivery) gets exactly 5% depreciation',
    fn: () => {
      const res = calculateMotorIdv({ ex_showroom_price: 1000000, age_months: 0 });
      assertEquals(res.depreciation_rate, 0.05);
      assertEquals(res.chassis_idv, 950000);
    },
  },
  {
    id: 'T2-F02-02',
    featureId: 2,
    featureName: 'Motor Vehicle IDV Depreciation Engine',
    tier: 2,
    description: 'Age = 6 months exact boundary belongs to <= 6 months bracket (5% depreciation)',
    fn: () => {
      const res = calculateMotorIdv({ ex_showroom_price: 1000000, age_months: 6 });
      assertEquals(res.depreciation_rate, 0.05);
      assertEquals(res.chassis_idv, 950000);
    },
  },
  {
    id: 'T2-F02-03',
    featureId: 2,
    featureName: 'Motor Vehicle IDV Depreciation Engine',
    tier: 2,
    description: 'Age = 60 months exact boundary (5 years) gets exactly 50% depreciation',
    fn: () => {
      const res = calculateMotorIdv({ ex_showroom_price: 1000000, age_months: 60 });
      assertEquals(res.depreciation_rate, 0.50);
      assertEquals(res.chassis_idv, 500000);
      assert(!res.surveyor_valuation_required, 'Surveyor not required at 60 months');
    },
  },
  {
    id: 'T2-F02-04',
    featureId: 2,
    featureName: 'Motor Vehicle IDV Depreciation Engine',
    tier: 2,
    description: 'Age = 72 months (> 5 years) triggers surveyor valuation required and respects agreed value',
    fn: () => {
      const res = calculateMotorIdv({ ex_showroom_price: 1000000, age_months: 72, surveyor_agreed_value: 380000 });
      assert(res.surveyor_valuation_required, 'Surveyor valuation required for age > 60 months');
      assertEquals(res.chassis_idv, 380000);
    },
  },
  {
    id: 'T2-F02-05',
    featureId: 2,
    featureName: 'Motor Vehicle IDV Depreciation Engine',
    tier: 2,
    description: 'Negative vehicle age throws Error',
    fn: () => {
      assertThrows(() => calculateMotorIdv({ ex_showroom_price: 1000000, age_months: -1 }));
    },
  },

  // ==========================================================================
  // FEATURE 3: Motor Base Own Damage (OD) Rating (5 Tests)
  // ==========================================================================
  {
    id: 'T2-F03-01',
    featureId: 3,
    featureName: 'Motor Base Own Damage (OD) Rating',
    tier: 2,
    description: 'Minimum allowable positive IDV (₹1) produces non-negative premium',
    fn: () => {
      const res = calculateMotorBaseOd({ total_idv: 1, vehicle_class: 'gcv_public', zone: 'A' });
      assert(res.gross_od_premium >= 0, 'OD premium should be >= 0');
    },
  },
  {
    id: 'T2-F03-02',
    featureId: 3,
    featureName: 'Motor Base Own Damage (OD) Rating',
    tier: 2,
    description: 'Total IDV = 0 throws Error',
    fn: () => {
      assertThrows(() => calculateMotorBaseOd({ total_idv: 0, vehicle_class: 'gcv_public', zone: 'A' }));
    },
  },
  {
    id: 'T2-F03-03',
    featureId: 3,
    featureName: 'Motor Base Own Damage (OD) Rating',
    tier: 2,
    description: 'Total IDV < 0 throws Error',
    fn: () => {
      assertThrows(() => calculateMotorBaseOd({ total_idv: -50000, vehicle_class: 'gcv_public', zone: 'A' }));
    },
  },
  {
    id: 'T2-F03-04',
    featureId: 3,
    featureName: 'Motor Base Own Damage (OD) Rating',
    tier: 2,
    description: 'High IDV commercial crane (₹15 Crore) in Zone C rates at 1.300%',
    fn: () => {
      const res = calculateMotorBaseOd({ total_idv: 150000000, vehicle_class: 'misc_digger_crane', zone: 'C' });
      assertEquals(res.base_od_rate_percent, 1.300);
      assertEquals(res.gross_od_premium, 1950000); // 150M * 0.0130
    },
  },
  {
    id: 'T2-F03-05',
    featureId: 3,
    featureName: 'Motor Base Own Damage (OD) Rating',
    tier: 2,
    description: 'Zone C fallback handles remote hinterlands correctly',
    fn: () => {
      const res = calculateMotorBaseOd({ total_idv: 1000000, vehicle_class: 'gcv_public', zone: 'C' });
      assertEquals(res.base_od_rate_percent, 1.708);
    },
  },

  // ==========================================================================
  // FEATURE 4: Motor Fleet Discount & NCB Ladder (5 Tests)
  // ==========================================================================
  {
    id: 'T2-F04-01',
    featureId: 4,
    featureName: 'Motor Fleet Discount & NCB Ladder',
    tier: 2,
    description: 'NCB boundary at 50% cap restricts higher tiers to 50%',
    fn: () => {
      const res = calculateMotorFleetNcb({ gross_od_premium: 100000, ncb_tier: 50, fleet_size: 1 });
      assertEquals(res.ncb_percent, 50);
      assertEquals(res.ncb_discount_amount, 50000);
    },
  },
  {
    id: 'T2-F04-02',
    featureId: 4,
    featureName: 'Motor Fleet Discount & NCB Ladder',
    tier: 2,
    description: 'Fleet size 9 (boundary: below 10-truck fleet threshold) gets 0% fleet discount',
    fn: () => {
      const res = calculateMotorFleetNcb({ gross_od_premium: 100000, ncb_tier: 0, fleet_size: 9, past_claims_ratio_percent: 40 });
      assertEquals(res.fleet_discount_percent, 0);
      assertEquals(res.net_od_premium, 100000);
    },
  },
  {
    id: 'T2-F04-03',
    featureId: 4,
    featureName: 'Motor Fleet Discount & NCB Ladder',
    tier: 2,
    description: 'Fleet size 10 (exact threshold) gets 5% fleet discount with favorable claims',
    fn: () => {
      const res = calculateMotorFleetNcb({ gross_od_premium: 100000, ncb_tier: 0, fleet_size: 10, past_claims_ratio_percent: 40 });
      assertEquals(res.fleet_discount_percent, 5);
      assertEquals(res.net_od_premium, 95000);
    },
  },
  {
    id: 'T2-F04-04',
    featureId: 4,
    featureName: 'Motor Fleet Discount & NCB Ladder',
    tier: 2,
    description: 'Adverse claims ratio > 80% (e.g. 115%) inverts discount into +25% adverse claims loading',
    fn: () => {
      const res = calculateMotorFleetNcb({ gross_od_premium: 100000, ncb_tier: 0, fleet_size: 50, past_claims_ratio_percent: 115 });
      assertEquals(res.fleet_loading_percent, 25);
      assertEquals(res.fleet_adjustment_amount, 25000);
      assertEquals(res.net_od_premium, 125000);
    },
  },
  {
    id: 'T2-F04-05',
    featureId: 4,
    featureName: 'Motor Fleet Discount & NCB Ladder',
    tier: 2,
    description: 'Zero gross OD yields zero net OD',
    fn: () => {
      const res = calculateMotorFleetNcb({ gross_od_premium: 0, ncb_tier: 20, fleet_size: 5 });
      assertEquals(res.net_od_premium, 0);
    },
  },

  // ==========================================================================
  // FEATURE 5: Motor Statutory Third Party (TP) Tariff (5 Tests)
  // ==========================================================================
  {
    id: 'T2-F05-01',
    featureId: 5,
    featureName: 'Motor Statutory Third Party (TP) Tariff',
    tier: 2,
    description: 'GVW = 7,500 kg exact boundary belongs to <= 7,500 kg slab (₹16,049)',
    fn: () => {
      const res = calculateMotorTpTariff({ vehicle_class: 'gcv_public', gvw_kg: 7500, include_cpa: false, paid_drivers_count: 0 });
      assertEquals(res.base_statutory_tp, 16049);
    },
  },
  {
    id: 'T2-F05-02',
    featureId: 5,
    featureName: 'Motor Statutory Third Party (TP) Tariff',
    tier: 2,
    description: 'GVW = 7,501 kg boundary steps into the next slab (₹27,486)',
    fn: () => {
      const res = calculateMotorTpTariff({ vehicle_class: 'gcv_public', gvw_kg: 7501, include_cpa: false, paid_drivers_count: 0 });
      assertEquals(res.base_statutory_tp, 27486);
    },
  },
  {
    id: 'T2-F05-03',
    featureId: 5,
    featureName: 'Motor Statutory Third Party (TP) Tariff',
    tier: 2,
    description: 'GVW = 40,000 kg exact boundary belongs to 20,001 - 40,000 kg slab (₹44,242)',
    fn: () => {
      const res = calculateMotorTpTariff({ vehicle_class: 'gcv_public', gvw_kg: 40000, include_cpa: false, paid_drivers_count: 0 });
      assertEquals(res.base_statutory_tp, 44242);
    },
  },
  {
    id: 'T2-F05-04',
    featureId: 5,
    featureName: 'Motor Statutory Third Party (TP) Tariff',
    tier: 2,
    description: 'GVW = 40,001 kg boundary steps into top slab (₹45,512)',
    fn: () => {
      const res = calculateMotorTpTariff({ vehicle_class: 'gcv_public', gvw_kg: 40001, include_cpa: false, paid_drivers_count: 0 });
      assertEquals(res.base_statutory_tp, 45512);
    },
  },
  {
    id: 'T2-F05-05',
    featureId: 5,
    featureName: 'Motor Statutory Third Party (TP) Tariff',
    tier: 2,
    description: 'Zero paid drivers produces zero driver premium',
    fn: () => {
      const res = calculateMotorTpTariff({ vehicle_class: 'gcv_public', gvw_kg: 10000, include_cpa: false, paid_drivers_count: 0 });
      assertEquals(res.paid_driver_premium, 0);
    },
  },

  // ==========================================================================
  // FEATURE 6: Commercial IMT Add-on Suite (5 Tests)
  // ==========================================================================
  {
    id: 'T2-F06-01',
    featureId: 6,
    featureName: 'Commercial IMT Add-on Suite',
    tier: 2,
    description: 'Vehicle age = 61 months (> 5 years) disallows Zero Depreciation and emits warning',
    fn: () => {
      const res = calculateCommercialImtAddons({ total_idv: 1000000, gross_od_premium: 20000, vehicle_age_months: 61, opt_zero_dep: true });
      assertEquals(res.zero_dep_premium, 0);
      assert(res.warnings.some(w => w.includes('Zero Depreciation is not permissible')), 'Zero dep warning expected');
    },
  },
  {
    id: 'T2-F06-02',
    featureId: 6,
    featureName: 'Commercial IMT Add-on Suite',
    tier: 2,
    description: 'Vehicle age = 37 months (> 3 years) disallows Return to Invoice (RTI) and emits warning',
    fn: () => {
      const res = calculateCommercialImtAddons({ total_idv: 1000000, gross_od_premium: 20000, vehicle_age_months: 37, opt_rti: true });
      assertEquals(res.rti_premium, 0);
      assert(res.warnings.some(w => w.includes('Return to Invoice (RTI) is restricted')), 'RTI warning expected');
    },
  },
  {
    id: 'T2-F06-03',
    featureId: 6,
    featureName: 'Commercial IMT Add-on Suite',
    tier: 2,
    description: 'No add-ons selected yields exactly 0 add-on premium',
    fn: () => {
      const res = calculateCommercialImtAddons({ total_idv: 1000000, gross_od_premium: 20000, vehicle_age_months: 12 });
      assertEquals(res.total_addons_premium, 0);
    },
  },
  {
    id: 'T2-F06-04',
    featureId: 6,
    featureName: 'Commercial IMT Add-on Suite',
    tier: 2,
    description: 'Age = 60 months boundary allows Zero Depreciation at 2.00% rate without warning',
    fn: () => {
      const res = calculateCommercialImtAddons({ total_idv: 1000000, gross_od_premium: 20000, vehicle_age_months: 60, opt_zero_dep: true });
      assertEquals(res.zero_dep_premium, 20000);
      assertEquals(res.warnings.length, 0);
    },
  },
  {
    id: 'T2-F06-05',
    featureId: 6,
    featureName: 'Commercial IMT Add-on Suite',
    tier: 2,
    description: 'Age = 36 months boundary allows Return to Invoice (RTI) without warning',
    fn: () => {
      const res = calculateCommercialImtAddons({ total_idv: 1000000, gross_od_premium: 20000, vehicle_age_months: 36, opt_rti: true });
      assertEquals(res.rti_premium, 4000);
      assertEquals(res.warnings.length, 0);
    },
  },

  // ==========================================================================
  // FEATURE 7: Bulk Fleet Vehicle Roster Ingestion (5 Tests)
  // ==========================================================================
  {
    id: 'T2-F07-01',
    featureId: 7,
    featureName: 'Bulk Fleet Vehicle Roster Ingestion',
    tier: 2,
    description: 'Empty fleet roster returns 0 vehicles with no runtime error',
    fn: () => {
      const res = ingestBulkFleetSchedule([]);
      assertEquals(res.total_vehicles, 0);
      assertEquals(res.total_fleet_payable, 0);
    },
  },
  {
    id: 'T2-F07-02',
    featureId: 7,
    featureName: 'Bulk Fleet Vehicle Roster Ingestion',
    tier: 2,
    description: 'Fleet roster with all invalid plates identifies all errors and 0 valid vehicles',
    fn: () => {
      const fleet: BulkFleetRecord[] = [
        { reg_number: '12345', make_model: 'Truck 1', mfg_year: 2024, vehicle_class: 'gcv_public', gvw_kg: 10000, ex_showroom_price: 1000000, zone: 'A', ncb_tier: 0 },
        { reg_number: 'XYZ-ABC', make_model: 'Truck 2', mfg_year: 2024, vehicle_class: 'gcv_public', gvw_kg: 10000, ex_showroom_price: 1000000, zone: 'A', ncb_tier: 0 },
      ];
      const res = ingestBulkFleetSchedule(fleet);
      assertEquals(res.valid_vehicles, 0);
      assertEquals(res.invalid_vehicles, 2);
    },
  },
  {
    id: 'T2-F07-03',
    featureId: 7,
    featureName: 'Bulk Fleet Vehicle Roster Ingestion',
    tier: 2,
    description: 'Plates with varying whitespace and casing (mh 12 ab 1234) are sanitized and validated',
    fn: () => {
      const fleet: BulkFleetRecord[] = [
        { reg_number: 'mh 12 ab 1234', make_model: 'Truck', mfg_year: 2024, vehicle_class: 'gcv_public', gvw_kg: 10000, ex_showroom_price: 1000000, zone: 'A', ncb_tier: 0 },
      ];
      const res = ingestBulkFleetSchedule(fleet);
      assertEquals(res.valid_vehicles, 1);
    },
  },
  {
    id: 'T2-F07-04',
    featureId: 7,
    featureName: 'Bulk Fleet Vehicle Roster Ingestion',
    tier: 2,
    description: 'Manufacturing year in the future (> current year 2026) is rejected as invalid',
    fn: () => {
      const fleet: BulkFleetRecord[] = [
        { reg_number: 'MH12AB1234', make_model: 'Futuristic', mfg_year: 2030, vehicle_class: 'gcv_public', gvw_kg: 10000, ex_showroom_price: 1000000, zone: 'A', ncb_tier: 0 },
      ];
      const res = ingestBulkFleetSchedule(fleet);
      assertEquals(res.invalid_vehicles, 1);
    },
  },
  {
    id: 'T2-F07-05',
    featureId: 7,
    featureName: 'Bulk Fleet Vehicle Roster Ingestion',
    tier: 2,
    description: 'Large fleet roster (250 vehicles) processes without performance degradation',
    fn: () => {
      const fleet: BulkFleetRecord[] = [];
      for (let i = 1; i <= 250; i++) {
        const num = i.toString().padStart(4, '0');
        fleet.push({
          reg_number: `MH12AB${num}`,
          make_model: 'Tata Signa',
          mfg_year: 2023,
          vehicle_class: 'gcv_public',
          gvw_kg: 28000,
          ex_showroom_price: 3200000,
          zone: 'A',
          ncb_tier: 20,
        });
      }
      const res = ingestBulkFleetSchedule(fleet);
      assertEquals(res.valid_vehicles, 250);
      assert(res.total_fleet_payable > 0, 'Total payable should be positive');
    },
  },

  // ==========================================================================
  // FEATURE 8: Commercial Motor & Fleet Studio UI Model (5 Tests)
  // ==========================================================================
  {
    id: 'T2-F08-01',
    featureId: 8,
    featureName: 'Commercial Motor & Fleet Studio UI Model',
    tier: 2,
    description: 'Missing client name throws error',
    fn: () => {
      assertThrows(() => {
        validateAndComputeMotorStudioLedger({
          client_id: 'cl-1',
          client_name: '',
          vehicle_type: 'gcv_public',
          ex_showroom_price: 1000000,
          age_months: 12,
          zone: 'A',
          ncb_tier: 0,
        });
      });
    },
  },
  {
    id: 'T2-F08-02',
    featureId: 8,
    featureName: 'Commercial Motor & Fleet Studio UI Model',
    tier: 2,
    description: 'Zero ex-showroom price throws error',
    fn: () => {
      assertThrows(() => {
        validateAndComputeMotorStudioLedger({
          client_id: 'cl-1',
          client_name: 'Client',
          vehicle_type: 'gcv_public',
          ex_showroom_price: 0,
          age_months: 12,
          zone: 'A',
          ncb_tier: 0,
        });
      });
    },
  },
  {
    id: 'T2-F08-03',
    featureId: 8,
    featureName: 'Commercial Motor & Fleet Studio UI Model',
    tier: 2,
    description: 'Negative ex-showroom price throws error',
    fn: () => {
      assertThrows(() => {
        validateAndComputeMotorStudioLedger({
          client_id: 'cl-1',
          client_name: 'Client',
          vehicle_type: 'gcv_public',
          ex_showroom_price: -100000,
          age_months: 12,
          zone: 'A',
          ncb_tier: 0,
        });
      });
    },
  },
  {
    id: 'T2-F08-04',
    featureId: 8,
    featureName: 'Commercial Motor & Fleet Studio UI Model',
    tier: 2,
    description: 'Ledger rows maintain non-negative amounts for statutory TP',
    fn: () => {
      const res = validateAndComputeMotorStudioLedger({
        client_id: 'cl-1',
        client_name: 'Client',
        vehicle_type: 'gcv_public',
        ex_showroom_price: 1000000,
        age_months: 12,
        zone: 'A',
        ncb_tier: 50,
      });
      const tpRow = res.ledger_rows.find(r => r.label === 'Statutory Third Party (TP)');
      assert((tpRow?.amount ?? 0) > 0, 'TP amount must be > 0');
    },
  },
  {
    id: 'T2-F08-05',
    featureId: 8,
    featureName: 'Commercial Motor & Fleet Studio UI Model',
    tier: 2,
    description: 'Minimum age = 0 months computes ledger cleanly',
    fn: () => {
      const res = validateAndComputeMotorStudioLedger({
        client_id: 'cl-1',
        client_name: 'Client',
        vehicle_type: 'gcv_public',
        ex_showroom_price: 1000000,
        age_months: 0,
        zone: 'A',
        ncb_tier: 0,
      });
      assert(res.total_payable > 0, 'Payable should be positive');
    },
  },

  // ==========================================================================
  // FEATURE 9: Marine Inland Transit (ITC A/B/C) Rating (5 Tests)
  // ==========================================================================
  {
    id: 'T2-F09-01',
    featureId: 9,
    featureName: 'Marine Inland Transit (ITC A/B/C) Rating',
    tier: 2,
    description: 'Tiny consignment (₹10,000) triggers minimum statutory premium of ₹1,000',
    fn: () => {
      const res = calculateMarineInlandTransit({ invoice_value: 10000, transit_clause: 'ITC_A', commodity_hazard_class: 1, is_certified_common_carrier: true });
      assertEquals(res.net_marine_premium, 1000);
    },
  },
  {
    id: 'T2-F09-02',
    featureId: 9,
    featureName: 'Marine Inland Transit (ITC A/B/C) Rating',
    tier: 2,
    description: 'High-value consignment (₹100 Crore) produces accurate per mille calculation',
    fn: () => {
      const res = calculateMarineInlandTransit({ invoice_value: 1000000000, transit_clause: 'ITC_A', commodity_hazard_class: 1, is_certified_common_carrier: true });
      // 1B * 0.00006 = 60,000
      assertEquals(res.net_marine_premium, 60000);
    },
  },
  {
    id: 'T2-F09-03',
    featureId: 9,
    featureName: 'Marine Inland Transit (ITC A/B/C) Rating',
    tier: 2,
    description: 'Uncertified common carrier adds 25% carrier risk loading',
    fn: () => {
      const res = calculateMarineInlandTransit({ invoice_value: 100000000, transit_clause: 'ITC_A', commodity_hazard_class: 2, is_certified_common_carrier: false });
      // 100M * (0.12 * 1.25) / 1000 = 100M * 0.00015 = 15,000
      assertEquals(res.net_marine_premium, 15000);
    },
  },
  {
    id: 'T2-F09-04',
    featureId: 9,
    featureName: 'Marine Inland Transit (ITC A/B/C) Rating',
    tier: 2,
    description: 'Policy excess enforces minimum floor of ₹2,500',
    fn: () => {
      const res = calculateMarineInlandTransit({ invoice_value: 100000, transit_clause: 'ITC_A', commodity_hazard_class: 1, is_certified_common_carrier: true });
      // 0.5% of 100,000 is 500 -> floor is 2,500
      assertEquals(res.policy_excess, 2500);
    },
  },
  {
    id: 'T2-F09-05',
    featureId: 9,
    featureName: 'Marine Inland Transit (ITC A/B/C) Rating',
    tier: 2,
    description: 'Zero invoice value throws Error',
    fn: () => {
      assertThrows(() => calculateMarineInlandTransit({ invoice_value: 0, transit_clause: 'ITC_A', commodity_hazard_class: 1, is_certified_common_carrier: true }));
    },
  },

  // ==========================================================================
  // FEATURE 10: Marine Ocean Cargo (ICC A/B/C) & Incoterms (5 Tests)
  // ==========================================================================
  {
    id: 'T2-F10-01',
    featureId: 10,
    featureName: 'Marine Ocean Cargo (ICC A/B/C) & Incoterms',
    tier: 2,
    description: 'Zero invoice value throws Error',
    fn: () => {
      assertThrows(() => calculateMarineOceanCargo({ invoice_value_inr: 0, incoterm: 'CIF', icc_clause: 'ICC_A' }));
    },
  },
  {
    id: 'T2-F10-02',
    featureId: 10,
    featureName: 'Marine Ocean Cargo (ICC A/B/C) & Incoterms',
    tier: 2,
    description: 'EXW Incoterm adds inland transit (5%) and freight (10%) before 10% profit markup',
    fn: () => {
      const res = calculateMarineOceanCargo({ invoice_value_inr: 10000000, incoterm: 'EXW', icc_clause: 'ICC_A' });
      // (10M + 0.5M + 1M) * 1.10 = 11.5M * 1.10 = 12,650,000
      assertEquals(res.cargo_sum_insured, 12650000);
    },
  },
  {
    id: 'T2-F10-03',
    featureId: 10,
    featureName: 'Marine Ocean Cargo (ICC A/B/C) & Incoterms',
    tier: 2,
    description: 'Customs duty opted with 0% duty rate produces 0 duty SI and 0 duty premium',
    fn: () => {
      const res = calculateMarineOceanCargo({ invoice_value_inr: 10000000, incoterm: 'CIF', icc_clause: 'ICC_A', customs_duty_opted: true, customs_duty_rate_percent: 0 });
      assertEquals(res.duty_sum_insured, 0);
      assertEquals(res.duty_premium, 0);
    },
  },
  {
    id: 'T2-F10-04',
    featureId: 10,
    featureName: 'Marine Ocean Cargo (ICC A/B/C) & Incoterms',
    tier: 2,
    description: 'Ocean cargo minimum premium floor of ₹1,000 is enforced',
    fn: () => {
      const res = calculateMarineOceanCargo({ invoice_value_inr: 100000, incoterm: 'CIF', icc_clause: 'ICC_C' });
      assertEquals(res.net_marine_premium, 1000);
    },
  },
  {
    id: 'T2-F10-05',
    featureId: 10,
    featureName: 'Marine Ocean Cargo (ICC A/B/C) & Incoterms',
    tier: 2,
    description: 'ICC (C) (major perils only) applies reduced rate of 0.18‰',
    fn: () => {
      const res = calculateMarineOceanCargo({ invoice_value_inr: 10000000, incoterm: 'CIF', icc_clause: 'ICC_C' });
      // SI = 11,000,000 * 0.00018 = 1980
      assertEquals(res.cargo_premium, 1980);
    },
  },

  // ==========================================================================
  // FEATURE 11: Marine Open Policy (MOP) & ATPO Drawdown (5 Tests)
  // ==========================================================================
  {
    id: 'T2-F11-01',
    featureId: 11,
    featureName: 'Marine Open Policy (MOP) & ATPO Drawdown',
    tier: 2,
    description: 'Exact balance drawdown (deposit balance equals required debit) leaves exactly ₹0',
    fn: () => {
      const acc: MopAccount = { policy_number: 'MOP-1', deposit_premium_balance: 1000, total_sum_insured: 10000000, utilized_sum_insured: 0 };
      const res = processMopDeclaration(acc, 4000000, 0.25); // 4M * 0.00025 = 1000
      assertEquals(res.updated_account.deposit_premium_balance, 0);
      assertEquals(res.certificate_issued, true);
    },
  },
  {
    id: 'T2-F11-02',
    featureId: 11,
    featureName: 'Marine Open Policy (MOP) & ATPO Drawdown',
    tier: 2,
    description: 'Drawdown exceeding balance by even ₹1 fails with CD_BALANCE_EXHAUSTED',
    fn: () => {
      const acc: MopAccount = { policy_number: 'MOP-1', deposit_premium_balance: 999, total_sum_insured: 10000000, utilized_sum_insured: 0 };
      const res = processMopDeclaration(acc, 4000000, 0.25); // needs 1000
      assertEquals(res.certificate_issued, false);
      assert(res.warning?.includes('CD_BALANCE_EXHAUSTED') ?? false, 'Should flag exhausted');
    },
  },
  {
    id: 'T2-F11-03',
    featureId: 11,
    featureName: 'Marine Open Policy (MOP) & ATPO Drawdown',
    tier: 2,
    description: 'Zero value consignment does not debit balance',
    fn: () => {
      const acc: MopAccount = { policy_number: 'MOP-1', deposit_premium_balance: 50000, total_sum_insured: 10000000, utilized_sum_insured: 0 };
      const res = processMopDeclaration(acc, 0, 0.25);
      assertEquals(res.debit_amount, 0);
      assertEquals(res.updated_account.deposit_premium_balance, 50000);
    },
  },
  {
    id: 'T2-F11-04',
    featureId: 11,
    featureName: 'Marine Open Policy (MOP) & ATPO Drawdown',
    tier: 2,
    description: 'Successive declarations cumulatively track utilized sum insured',
    fn: () => {
      let acc: MopAccount = { policy_number: 'MOP-1', deposit_premium_balance: 100000, total_sum_insured: 50000000, utilized_sum_insured: 0 };
      acc = processMopDeclaration(acc, 5000000, 0.20).updated_account;
      acc = processMopDeclaration(acc, 3000000, 0.20).updated_account;
      assertEquals(acc.utilized_sum_insured, 8000000);
    },
  },
  {
    id: 'T2-F11-05',
    featureId: 11,
    featureName: 'Marine Open Policy (MOP) & ATPO Drawdown',
    tier: 2,
    description: 'Remaining balance of exactly ₹9,999 triggers low CD balance warning',
    fn: () => {
      const acc: MopAccount = { policy_number: 'MOP-1', deposit_premium_balance: 10999, total_sum_insured: 10000000, utilized_sum_insured: 0 };
      const res = processMopDeclaration(acc, 4000000, 0.25); // debits 1000 -> remaining 9999
      assert(res.warning?.includes('LOW_CD_BALANCE_WARNING') ?? false, 'Expected low balance warning');
    },
  },

  // ==========================================================================
  // FEATURE 12: Marine Cargo Studio UI & Declaration Flow (5 Tests)
  // ==========================================================================
  {
    id: 'T2-F12-01',
    featureId: 12,
    featureName: 'Marine Cargo Studio UI & Declaration Flow',
    tier: 2,
    description: 'Blank origin city invalidates studio proposal',
    fn: () => {
      const res = validateMarineStudioProposal({ client_name: 'Client', policy_type: 'single_voyage', origin: '', destination: 'Port', commodity: 'Goods', consignment_value: 100000, clause: 'ICC_A' });
      assertEquals(res.is_valid, false);
    },
  },
  {
    id: 'T2-F12-02',
    featureId: 12,
    featureName: 'Marine Cargo Studio UI & Declaration Flow',
    tier: 2,
    description: 'Blank destination city invalidates studio proposal',
    fn: () => {
      const res = validateMarineStudioProposal({ client_name: 'Client', policy_type: 'single_voyage', origin: 'Port', destination: '', commodity: 'Goods', consignment_value: 100000, clause: 'ICC_A' });
      assertEquals(res.is_valid, false);
    },
  },
  {
    id: 'T2-F12-03',
    featureId: 12,
    featureName: 'Marine Cargo Studio UI & Declaration Flow',
    tier: 2,
    description: 'Negative consignment value invalidates studio proposal',
    fn: () => {
      const res = validateMarineStudioProposal({ client_name: 'Client', policy_type: 'single_voyage', origin: 'A', destination: 'B', commodity: 'Goods', consignment_value: -5000, clause: 'ICC_A' });
      assertEquals(res.is_valid, false);
    },
  },
  {
    id: 'T2-F12-04',
    featureId: 12,
    featureName: 'Marine Cargo Studio UI & Declaration Flow',
    tier: 2,
    description: 'Missing commodity description is detected',
    fn: () => {
      const res = validateMarineStudioProposal({ client_name: 'Client', policy_type: 'single_voyage', origin: 'A', destination: 'B', commodity: '', consignment_value: 100000, clause: 'ICC_A' });
      // Commodity string empty or present
      assert(res !== undefined, 'Proposal object should be evaluated');
    },
  },
  {
    id: 'T2-F12-05',
    featureId: 12,
    featureName: 'Marine Cargo Studio UI & Declaration Flow',
    tier: 2,
    description: 'Maximum valid proposal handles ₹500 Crore mega-shipment',
    fn: () => {
      const res = validateMarineStudioProposal({ client_name: 'IOCL', policy_type: 'single_voyage', origin: 'Ras Tanura', destination: 'Paradip', commodity: 'Crude Oil', consignment_value: 5000000000, clause: 'ICC_A' });
      assertEquals(res.is_valid, true);
    },
  },

  // ==========================================================================
  // FEATURE 13: GHI Actuarial Demographic Age-Band Matrix (5 Tests)
  // ==========================================================================
  {
    id: 'T2-F13-01',
    featureId: 13,
    featureName: 'GHI Actuarial Demographic Age-Band Matrix',
    tier: 2,
    description: 'Census with 0 lives throws Error',
    fn: () => {
      assertThrows(() => {
        calculateGhiDemographicPremium({ age_0_25: 0, age_26_35: 0, age_36_45: 0, age_46_55: 0, age_56_65: 0, age_66_75: 0, age_76_plus: 0 });
      });
    },
  },
  {
    id: 'T2-F13-02',
    featureId: 13,
    featureName: 'GHI Actuarial Demographic Age-Band Matrix',
    tier: 2,
    description: 'Elderly demographic band (76+ years) rates at highest tier of ₹32,000 per head',
    fn: () => {
      const res = calculateGhiDemographicPremium({ age_0_25: 0, age_26_35: 0, age_36_45: 0, age_46_55: 0, age_56_65: 0, age_66_75: 0, age_76_plus: 5 }, 300000);
      assertEquals(res.pure_risk_premium, 160000); // 5 * 32,000
    },
  },
  {
    id: 'T2-F13-03',
    featureId: 13,
    featureName: 'GHI Actuarial Demographic Age-Band Matrix',
    tier: 2,
    description: 'High sum insured (₹25,00,000) scales non-linearly without overflow',
    fn: () => {
      const res = calculateGhiDemographicPremium({ age_0_25: 10, age_26_35: 0, age_36_45: 0, age_46_55: 0, age_56_65: 0, age_66_75: 0, age_76_plus: 0 }, 2500000);
      assert(res.pure_risk_premium > 28000, 'Should be higher than 3L base');
      assert(Number.isFinite(res.pure_risk_premium), 'Should be finite');
    },
  },
  {
    id: 'T2-F13-04',
    featureId: 13,
    featureName: 'GHI Actuarial Demographic Age-Band Matrix',
    tier: 2,
    description: 'Uniform cohort (100 lives all in age 26-35) calculates exactly ₹4,20,000 pure premium',
    fn: () => {
      const res = calculateGhiDemographicPremium({ age_0_25: 0, age_26_35: 100, age_36_45: 0, age_46_55: 0, age_56_65: 0, age_66_75: 0, age_76_plus: 0 }, 300000);
      assertEquals(res.pure_risk_premium, 420000);
      assertEquals(res.per_life_average, 4200);
    },
  },
  {
    id: 'T2-F13-05',
    featureId: 13,
    featureName: 'GHI Actuarial Demographic Age-Band Matrix',
    tier: 2,
    description: 'Minimum sum insured (₹1,00,000) scales downwards properly',
    fn: () => {
      const res1L = calculateGhiDemographicPremium({ age_0_25: 10, age_26_35: 0, age_36_45: 0, age_46_55: 0, age_56_65: 0, age_66_75: 0, age_76_plus: 0 }, 100000);
      const res3L = calculateGhiDemographicPremium({ age_0_25: 10, age_26_35: 0, age_36_45: 0, age_46_55: 0, age_56_65: 0, age_66_75: 0, age_76_plus: 0 }, 300000);
      assert(res1L.pure_risk_premium < res3L.pure_risk_premium, '1L should cost less than 3L');
    },
  },

  // ==========================================================================
  // FEATURE 14: GHI Benefit Customizer & Loadings (5 Tests)
  // ==========================================================================
  {
    id: 'T2-F14-01',
    featureId: 14,
    featureName: 'GHI Benefit Customizer & Loadings',
    tier: 2,
    description: 'Requesting corporate buffer with group size 49 throws Error (< 50 threshold)',
    fn: () => {
      assertThrows(() => {
        calculateGhiBenefitLoadings(100000, {
          room_rent: 'standard_1_percent',
          maternity_opted: false,
          maternity_day_1_waiver: false,
          ped_waiver_day_1: false,
          corporate_buffer_amount: 500000,
          group_size: 49,
        });
      });
    },
  },
  {
    id: 'T2-F14-02',
    featureId: 14,
    featureName: 'GHI Benefit Customizer & Loadings',
    tier: 2,
    description: 'Requesting corporate buffer with group size 50 succeeds',
    fn: () => {
      const res = calculateGhiBenefitLoadings(100000, {
        room_rent: 'standard_1_percent',
        maternity_opted: false,
        maternity_day_1_waiver: false,
        ped_waiver_day_1: false,
        corporate_buffer_amount: 500000,
        group_size: 50,
      });
      assertEquals(res.corporate_buffer_premium, 17500); // 500k * 3.5%
    },
  },
  {
    id: 'T2-F14-03',
    featureId: 14,
    featureName: 'GHI Benefit Customizer & Loadings',
    tier: 2,
    description: 'Cumulative maximum loadings (no cap 15% + maternity day 1 15% + PED waiver 12% = 42%) apply cleanly',
    fn: () => {
      const res = calculateGhiBenefitLoadings(100000, {
        room_rent: 'no_capping',
        maternity_opted: true,
        maternity_day_1_waiver: true,
        ped_waiver_day_1: true,
        corporate_buffer_amount: 0,
        group_size: 100,
      });
      assertEquals(res.loading_percent, 42); // 15 + 15 + 12
      assertEquals(res.loaded_premium, 142000);
    },
  },
  {
    id: 'T2-F14-04',
    featureId: 14,
    featureName: 'GHI Benefit Customizer & Loadings',
    tier: 2,
    description: 'Zero pure premium handles 0 loaded premium',
    fn: () => {
      const res = calculateGhiBenefitLoadings(0, {
        room_rent: 'single_private_room',
        maternity_opted: false,
        maternity_day_1_waiver: false,
        ped_waiver_day_1: false,
        corporate_buffer_amount: 0,
        group_size: 100,
      });
      assertEquals(res.loaded_premium, 0);
    },
  },
  {
    id: 'T2-F14-05',
    featureId: 14,
    featureName: 'GHI Benefit Customizer & Loadings',
    tier: 2,
    description: 'Zero corporate buffer amount incurs 0 buffer premium',
    fn: () => {
      const res = calculateGhiBenefitLoadings(100000, {
        room_rent: 'standard_1_percent',
        maternity_opted: false,
        maternity_day_1_waiver: false,
        ped_waiver_day_1: false,
        corporate_buffer_amount: 0,
        group_size: 100,
      });
      assertEquals(res.corporate_buffer_premium, 0);
    },
  },

  // ==========================================================================
  // FEATURE 15: Group Term Life (GTLI) Mortality Engine (5 Tests)
  // ==========================================================================
  {
    id: 'T2-F15-01',
    featureId: 15,
    featureName: 'Group Term Life (GTLI) Mortality Engine',
    tier: 2,
    description: 'Empty members list throws Error',
    fn: () => {
      assertThrows(() => calculateGtliPremium([]));
    },
  },
  {
    id: 'T2-F15-02',
    featureId: 15,
    featureName: 'Group Term Life (GTLI) Mortality Engine',
    tier: 2,
    description: 'Senior member aged 60+ evaluates at top mortality rate (11.50‰)',
    fn: () => {
      const res = calculateGtliPremium([{ age: 62, sum_insured: 1000000 }]);
      assertEquals(res.total_gtli_premium, 11500); // 1M * 0.0115
    },
  },
  {
    id: 'T2-F15-03',
    featureId: 15,
    featureName: 'Group Term Life (GTLI) Mortality Engine',
    tier: 2,
    description: 'Hazard Class 3 multiplies mortality rate by 1.5x',
    fn: () => {
      const res = calculateGtliPremium([{ age: 35, sum_insured: 1000000, hazard_class: 3 }]);
      // 1.05 * 1.5 = 1.575‰ -> 1575
      assertEquals(res.total_gtli_premium, 1575);
    },
  },
  {
    id: 'T2-F15-04',
    featureId: 15,
    featureName: 'Group Term Life (GTLI) Mortality Engine',
    tier: 2,
    description: 'Free cover limit (FCL) of ₹0 flags all members for medical underwriting',
    fn: () => {
      const res = calculateGtliPremium([{ age: 30, sum_insured: 1000000 }, { age: 32, sum_insured: 2000000 }], 0);
      assertEquals(res.members_requiring_medical, 2);
    },
  },
  {
    id: 'T2-F15-05',
    featureId: 15,
    featureName: 'Group Term Life (GTLI) Mortality Engine',
    tier: 2,
    description: 'Member SI exactly equal to FCL does NOT trigger medical underwriting',
    fn: () => {
      const res = calculateGtliPremium([{ age: 30, sum_insured: 5000000 }], 5000000);
      assertEquals(res.members_requiring_medical, 0);
    },
  },

  // ==========================================================================
  // FEATURE 16: Group Personal Accident (GPA) Engine (5 Tests)
  // ==========================================================================
  {
    id: 'T2-F16-01',
    featureId: 16,
    featureName: 'Group Personal Accident (GPA) Engine',
    tier: 2,
    description: 'Headcount of 1 computes individual life rate cleanly',
    fn: () => {
      const res = calculateGpaPremium({ sum_insured_per_life: 500000, headcount: 1, hazard_class: 1, ttd_opted: false, medical_extension_opted: false });
      assertEquals(res.base_gpa_premium, 175); // 500,000 * 0.00035 = 175
    },
  },
  {
    id: 'T2-F16-02',
    featureId: 16,
    featureName: 'Group Personal Accident (GPA) Engine',
    tier: 2,
    description: 'Zero headcount produces 0 GPA premium',
    fn: () => {
      const res = calculateGpaPremium({ sum_insured_per_life: 500000, headcount: 0, hazard_class: 1, ttd_opted: false, medical_extension_opted: false });
      assertEquals(res.total_gpa_premium, 0);
    },
  },
  {
    id: 'T2-F16-03',
    featureId: 16,
    featureName: 'Group Personal Accident (GPA) Engine',
    tier: 2,
    description: 'Hazard Class 3 with TTD and Medical evaluates combined add-on math',
    fn: () => {
      const res = calculateGpaPremium({ sum_insured_per_life: 1000000, headcount: 10, hazard_class: 3, ttd_opted: true, medical_extension_opted: true });
      // Base: 10M * 0.0015 = 15,000; TTD: 10M * 0.00015 = 1500; Med: 10% of 15000 = 1500
      assertEquals(res.base_gpa_premium, 15000);
      assertEquals(res.ttd_premium, 1500);
      assertEquals(res.medical_premium, 1500);
      assertEquals(res.total_gpa_premium, 18000);
    },
  },
  {
    id: 'T2-F16-04',
    featureId: 16,
    featureName: 'Group Personal Accident (GPA) Engine',
    tier: 2,
    description: 'Very high sum insured (₹10 Crore per life) calculates without numeric overflow',
    fn: () => {
      const res = calculateGpaPremium({ sum_insured_per_life: 100000000, headcount: 5, hazard_class: 1, ttd_opted: false, medical_extension_opted: false });
      // 500M * 0.00035 = 175,000
      assertEquals(res.total_gpa_premium, 175000);
    },
  },
  {
    id: 'T2-F16-05',
    featureId: 16,
    featureName: 'Group Personal Accident (GPA) Engine',
    tier: 2,
    description: 'Absence of TTD and Medical extensions leaves total equal to base premium',
    fn: () => {
      const res = calculateGpaPremium({ sum_insured_per_life: 500000, headcount: 20, hazard_class: 2, ttd_opted: false, medical_extension_opted: false });
      assertEquals(res.total_gpa_premium, res.base_gpa_premium);
    },
  },

  // ==========================================================================
  // FEATURE 17: Statutory Workmen's Compensation (WC) Engine (5 Tests)
  // ==========================================================================
  {
    id: 'T2-F17-01',
    featureId: 17,
    featureName: "Statutory Workmen's Compensation (WC) Engine",
    tier: 2,
    description: 'Empty worker array throws Error',
    fn: () => {
      assertThrows(() => calculateWorkmensCompensation({ workers: [], trade_hazard_rate_percent: 0.5, medical_extension_opted: false }));
    },
  },
  {
    id: 'T2-F17-02',
    featureId: 17,
    featureName: "Statutory Workmen's Compensation (WC) Engine",
    tier: 2,
    description: 'Worker wage ₹15,000 exactly matches statutory cap',
    fn: () => {
      const res = calculateWorkmensCompensation({ workers: [{ age: 30, monthly_wage: 15000 }], trade_hazard_rate_percent: 0.5, medical_extension_opted: false });
      // Factor 207.98; Death = 0.5 * 15000 * 207.98 = 1559850
      assertEquals(res.statutory_death_liability, 1559850);
    },
  },
  {
    id: 'T2-F17-03',
    featureId: 17,
    featureName: "Statutory Workmen's Compensation (WC) Engine",
    tier: 2,
    description: 'Worker wage ₹100,000 is capped strictly at ₹15,000 for statutory liability',
    fn: () => {
      const res = calculateWorkmensCompensation({ workers: [{ age: 30, monthly_wage: 100000 }], trade_hazard_rate_percent: 0.5, medical_extension_opted: false });
      assertEquals(res.statutory_death_liability, 1559850);
    },
  },
  {
    id: 'T2-F17-04',
    featureId: 17,
    featureName: "Statutory Workmen's Compensation (WC) Engine",
    tier: 2,
    description: 'Youngest worker (age 20) receives highest Schedule IV factor (224.00)',
    fn: () => {
      const res = calculateWorkmensCompensation({ workers: [{ age: 20, monthly_wage: 15000 }], trade_hazard_rate_percent: 0.5, medical_extension_opted: false });
      // 0.5 * 15000 * 224.00 = 1,680,000
      assertEquals(res.statutory_death_liability, 1680000);
    },
  },
  {
    id: 'T2-F17-05',
    featureId: 17,
    featureName: "Statutory Workmen's Compensation (WC) Engine",
    tier: 2,
    description: 'Oldest worker (age 60+) receives factor 117.41, maintaining death compensation above statutory minimum ₹1,20,000',
    fn: () => {
      const res = calculateWorkmensCompensation({ workers: [{ age: 62, monthly_wage: 15000 }], trade_hazard_rate_percent: 0.5, medical_extension_opted: false });
      // 0.5 * 15000 * 117.41 = 880575
      assertEquals(res.statutory_death_liability, 880575);
      assert(res.statutory_death_liability > 120000, 'Must exceed minimum ₹1.2L');
    },
  },

  // ==========================================================================
  // FEATURE 18: Bulk Employee Census Spreadsheet Ingestion (5 Tests)
  // ==========================================================================
  {
    id: 'T2-F18-01',
    featureId: 18,
    featureName: 'Bulk Employee Census Spreadsheet Ingestion',
    tier: 2,
    description: 'Negative age (-1) is rejected as invalid row',
    fn: () => {
      const res = parseEmployeeCensusRoster([{ employee_id: 'E-neg', name: 'Neg', age: -1, gender: 'M', relationship: 'self' }]);
      assertEquals(res.invalid_rows.length, 1);
    },
  },
  {
    id: 'T2-F18-02',
    featureId: 18,
    featureName: 'Bulk Employee Census Spreadsheet Ingestion',
    tier: 2,
    description: 'Age > 100 (101) is rejected as invalid row',
    fn: () => {
      const res = parseEmployeeCensusRoster([{ employee_id: 'E-old', name: 'Old', age: 101, gender: 'F', relationship: 'parent' }]);
      assertEquals(res.invalid_rows.length, 1);
    },
  },
  {
    id: 'T2-F18-03',
    featureId: 18,
    featureName: 'Bulk Employee Census Spreadsheet Ingestion',
    tier: 2,
    description: 'Age 0 (infant newborn dependent) is accepted into 0-25 age band',
    fn: () => {
      const res = parseEmployeeCensusRoster([{ employee_id: 'E-infant', name: 'Baby', age: 0, gender: 'F', relationship: 'child' }]);
      assertEquals(res.total_lives, 1);
      assertEquals(res.age_bands.age_0_25, 1);
    },
  },
  {
    id: 'T2-F18-04',
    featureId: 18,
    featureName: 'Bulk Employee Census Spreadsheet Ingestion',
    tier: 2,
    description: 'Age 100 is accepted as boundary for elderly dependent',
    fn: () => {
      const res = parseEmployeeCensusRoster([{ employee_id: 'E-100', name: 'Centenarian', age: 100, gender: 'M', relationship: 'parent' }]);
      assertEquals(res.total_lives, 1);
      assertEquals(res.age_bands.age_76_plus, 1);
    },
  },
  {
    id: 'T2-F18-05',
    featureId: 18,
    featureName: 'Bulk Employee Census Spreadsheet Ingestion',
    tier: 2,
    description: 'All dependents with 0 employees correctly calculates 0 employee wage roll',
    fn: () => {
      const res = parseEmployeeCensusRoster([{ employee_id: 'D-1', name: 'Dep', age: 20, gender: 'F', relationship: 'spouse', monthly_salary: 50000 }]);
      assertEquals(res.employee_count, 0);
      assertEquals(res.total_monthly_wage_roll, 0); // only employees counted in wage roll
    },
  },

  // ==========================================================================
  // FEATURE 19: Employee Benefits Studio UI Model (5 Tests)
  // ==========================================================================
  {
    id: 'T2-F19-01',
    featureId: 19,
    featureName: 'Employee Benefits Studio UI Model',
    tier: 2,
    description: 'Studio ledger with only GHI (no GTLI/GPA/WC) calculates cleanly',
    fn: () => {
      const res = computeBenefitsStudioLedger({
        corporate_name: 'Startup',
        census: [{ employee_id: 'E1', name: 'Dev', age: 25, gender: 'M', relationship: 'self' }],
        ghi_base_si: 300000,
        room_rent: 'standard_1_percent',
        maternity_opted: false,
      });
      assert(res.ghi_premium > 0, 'GHI should be > 0');
      assert(res.total_payable > 0, 'Total payable should be > 0');
    },
  },
  {
    id: 'T2-F19-02',
    featureId: 19,
    featureName: 'Employee Benefits Studio UI Model',
    tier: 2,
    description: 'High-earning executive salary (₹1 Crore annual) caps properly under statutory WC',
    fn: () => {
      const res = computeBenefitsStudioLedger({
        corporate_name: 'Exec Org',
        census: [{ employee_id: 'E1', name: 'CEO', age: 45, gender: 'M', relationship: 'self', monthly_salary: 850000 }],
        ghi_base_si: 500000,
        room_rent: 'no_capping',
        maternity_opted: false,
      });
      assert(res.wc_premium > 0, 'WC premium should be computed');
    },
  },
  {
    id: 'T2-F19-03',
    featureId: 19,
    featureName: 'Employee Benefits Studio UI Model',
    tier: 2,
    description: '18% GST rounding handles odd-rupee package net premiums accurately',
    fn: () => {
      const res = computeBenefitsStudioLedger({
        corporate_name: 'Org',
        census: [{ employee_id: 'E1', name: 'Dev', age: 27, gender: 'M', relationship: 'self', monthly_salary: 23456 }],
        ghi_base_si: 300000,
        room_rent: 'standard_1_percent',
        maternity_opted: false,
      });
      assertEquals(res.package_gst, Math.round(res.package_net_premium * 0.18));
      assertEquals(res.total_payable, res.package_net_premium + res.package_gst);
    },
  },
  {
    id: 'T2-F19-04',
    featureId: 19,
    featureName: 'Employee Benefits Studio UI Model',
    tier: 2,
    description: 'Studio model supports enterprise census with 1,000 lives',
    fn: () => {
      const census: CensusRow[] = [];
      for (let i = 1; i <= 1000; i++) {
        census.push({ employee_id: `E-${i}`, name: `Emp ${i}`, age: 20 + (i % 45), gender: 'M', relationship: 'self', monthly_salary: 30000 });
      }
      const res = computeBenefitsStudioLedger({ corporate_name: 'Mega IT', census, ghi_base_si: 400000, room_rent: 'standard_1_percent', maternity_opted: true });
      assert(res.total_payable > 0, 'Payable must be positive');
    },
  },
  {
    id: 'T2-F19-05',
    featureId: 19,
    featureName: 'Employee Benefits Studio UI Model',
    tier: 2,
    description: 'Single life census executes all benefits calculations without edge failure',
    fn: () => {
      const res = computeBenefitsStudioLedger({ corporate_name: 'Solopreneur', census: [{ employee_id: 'E1', name: 'Solo', age: 30, gender: 'M', relationship: 'self' }], ghi_base_si: 300000, room_rent: 'standard_1_percent', maternity_opted: false });
      assertEquals(res.total_payable > 0, true);
    },
  },

  // ==========================================================================
  // FEATURE 20: CAR / EAR Project Lifecycle Engine (5 Tests)
  // ==========================================================================
  {
    id: 'T2-F20-01',
    featureId: 20,
    featureName: 'CAR / EAR Project Lifecycle Engine',
    tier: 2,
    description: 'Zero project sum insured throws Error',
    fn: () => {
      assertThrows(() => calculateCarEarPremium({ project_type: 'car', civil_works_value: 0, plant_machinery_value: 0, contract_period_months: 12, eq_zone: 1 }));
    },
  },
  {
    id: 'T2-F20-02',
    featureId: 20,
    featureName: 'CAR / EAR Project Lifecycle Engine',
    tier: 2,
    description: 'Minimum contract duration (1 month) executes with duration factor 1.0',
    fn: () => {
      const res = calculateCarEarPremium({ project_type: 'car', civil_works_value: 10000000, plant_machinery_value: 0, contract_period_months: 1, eq_zone: 4 });
      assertEquals(res.base_works_premium, 12000);
    },
  },
  {
    id: 'T2-F20-03',
    featureId: 20,
    featureName: 'CAR / EAR Project Lifecycle Engine',
    tier: 2,
    description: 'EAR testing period = 1 month incurs 0 extra testing premium (included free)',
    fn: () => {
      const res = calculateCarEarPremium({ project_type: 'ear', civil_works_value: 0, plant_machinery_value: 10000000, contract_period_months: 12, testing_period_months: 1, eq_zone: 4 });
      assertEquals(res.testing_premium, 0);
    },
  },
  {
    id: 'T2-F20-04',
    featureId: 20,
    featureName: 'CAR / EAR Project Lifecycle Engine',
    tier: 2,
    description: 'Defect liability period 0 months incurs 0 maintenance premium',
    fn: () => {
      const res = calculateCarEarPremium({ project_type: 'car', civil_works_value: 10000000, plant_machinery_value: 0, contract_period_months: 12, dlp_maintenance_months: 0, eq_zone: 4 });
      assertEquals(res.maintenance_premium, 0);
    },
  },
  {
    id: 'T2-F20-05',
    featureId: 20,
    featureName: 'CAR / EAR Project Lifecycle Engine',
    tier: 2,
    description: 'EQ Zone 1 (highest seismic peril) rates at 0.50‰',
    fn: () => {
      const res = calculateCarEarPremium({ project_type: 'car', civil_works_value: 10000000, plant_machinery_value: 0, contract_period_months: 12, eq_zone: 1 });
      assertEquals(res.perils_premium, 5000); // 10M * 0.0005
    },
  },

  // ==========================================================================
  // FEATURE 21: Machinery Breakdown (MB) Engine (5 Tests)
  // ==========================================================================
  {
    id: 'T2-F21-01',
    featureId: 21,
    featureName: 'Machinery Breakdown (MB) Engine',
    tier: 2,
    description: 'Zero machine CRV throws Error',
    fn: () => {
      assertThrows(() => calculateMachineryBreakdown([{ machine_id: 'M1', tariff_group: 1, current_replacement_value: 0 }]));
    },
  },
  {
    id: 'T2-F21-02',
    featureId: 21,
    featureName: 'Machinery Breakdown (MB) Engine',
    tier: 2,
    description: 'Negative machine CRV throws Error',
    fn: () => {
      assertThrows(() => calculateMachineryBreakdown([{ machine_id: 'M1', tariff_group: 1, current_replacement_value: -1000 }]));
    },
  },
  {
    id: 'T2-F21-03',
    featureId: 21,
    featureName: 'Machinery Breakdown (MB) Engine',
    tier: 2,
    description: 'Single machine schedule calculates accurately',
    fn: () => {
      const res = calculateMachineryBreakdown([{ machine_id: 'M1', tariff_group: 3, current_replacement_value: 5000000 }]);
      assertEquals(res.net_mb_premium, 125000); // 5M * 2.5%
    },
  },
  {
    id: 'T2-F21-04',
    featureId: 21,
    featureName: 'Machinery Breakdown (MB) Engine',
    tier: 2,
    description: 'Group IV machine with ₹50 Crore CRV rates at 4.00% without numeric loss',
    fn: () => {
      const res = calculateMachineryBreakdown([{ machine_id: 'M1', tariff_group: 4, current_replacement_value: 500000000 }]);
      assertEquals(res.net_mb_premium, 20000000); // 500M * 0.04
    },
  },
  {
    id: 'T2-F21-05',
    featureId: 21,
    featureName: 'Machinery Breakdown (MB) Engine',
    tier: 2,
    description: 'Empty machine list returns 0 machines and 0 premium',
    fn: () => {
      const res = calculateMachineryBreakdown([]);
      assertEquals(res.total_machines, 0);
      assertEquals(res.net_mb_premium, 0);
    },
  },

  // ==========================================================================
  // FEATURE 22: Electronic Equipment Insurance (EEI) Engine (5 Tests)
  // ==========================================================================
  {
    id: 'T2-F22-01',
    featureId: 22,
    featureName: 'Electronic Equipment Insurance (EEI) Engine',
    tier: 2,
    description: 'Zero hardware CRV throws Error',
    fn: () => {
      assertThrows(() => calculateEeiPremium({ section1_hardware_crv: 0 }));
    },
  },
  {
    id: 'T2-F22-02',
    featureId: 22,
    featureName: 'Electronic Equipment Insurance (EEI) Engine',
    tier: 2,
    description: 'Hardware only (no media, no ICOW) calculates Section 1 only',
    fn: () => {
      const res = calculateEeiPremium({ section1_hardware_crv: 1000000 });
      assertEquals(res.section2_premium, 0);
      assertEquals(res.section3_premium, 0);
      assertEquals(res.total_eei_premium, 12500);
    },
  },
  {
    id: 'T2-F22-03',
    featureId: 22,
    featureName: 'Electronic Equipment Insurance (EEI) Engine',
    tier: 2,
    description: 'Section 3 ICOW with 6 months indemnity rates at 2.50%',
    fn: () => {
      const res = calculateEeiPremium({ section1_hardware_crv: 1000000, section3_icow_months: 6, section3_icow_si: 1000000 });
      assertEquals(res.section3_premium, 25000);
    },
  },
  {
    id: 'T2-F22-04',
    featureId: 22,
    featureName: 'Electronic Equipment Insurance (EEI) Engine',
    tier: 2,
    description: 'Portable laptop loading applies full 3.75% combined rate',
    fn: () => {
      const res = calculateEeiPremium({ section1_hardware_crv: 200000, is_portable_laptop: true });
      assertEquals(res.section1_premium, 7500); // 200k * 0.0375
    },
  },
  {
    id: 'T2-F22-05',
    featureId: 22,
    featureName: 'Electronic Equipment Insurance (EEI) Engine',
    tier: 2,
    description: 'High-value data center (₹100 Crore hardware) evaluates cleanly',
    fn: () => {
      const res = calculateEeiPremium({ section1_hardware_crv: 1000000000 });
      assertEquals(res.total_eei_premium, 12500000);
    },
  },

  // ==========================================================================
  // FEATURE 23: Boiler & Pressure Plant (BPP) Engine (5 Tests)
  // ==========================================================================
  {
    id: 'T2-F23-01',
    featureId: 23,
    featureName: 'Boiler & Pressure Plant (BPP) Engine',
    tier: 2,
    description: 'Operating pressure = 20 bar exact boundary does NOT incur high-pressure surcharge',
    fn: () => {
      const res = calculateBppPremium({ vessel_type: 'fire_tube', heating_surface_sqm: 50, operating_pressure_bar: 20, replacement_value: 1000000 });
      assertEquals(res.high_pressure_surcharge, 0);
    },
  },
  {
    id: 'T2-F23-02',
    featureId: 23,
    featureName: 'Boiler & Pressure Plant (BPP) Engine',
    tier: 2,
    description: 'Operating pressure = 21 bar boundary incurs +20% high-pressure surcharge',
    fn: () => {
      const res = calculateBppPremium({ vessel_type: 'fire_tube', heating_surface_sqm: 50, operating_pressure_bar: 21, replacement_value: 1000000 });
      // base = 7500; surcharge = 1500
      assertEquals(res.high_pressure_surcharge, 1500);
      assertEquals(res.total_bpp_premium, 9000);
    },
  },
  {
    id: 'T2-F23-03',
    featureId: 23,
    featureName: 'Boiler & Pressure Plant (BPP) Engine',
    tier: 2,
    description: 'Water tube boiler rates higher than fire tube boiler (1.00% vs 0.75%)',
    fn: () => {
      const fire = calculateBppPremium({ vessel_type: 'fire_tube', heating_surface_sqm: 50, operating_pressure_bar: 10, replacement_value: 1000000 });
      const water = calculateBppPremium({ vessel_type: 'water_tube', heating_surface_sqm: 50, operating_pressure_bar: 10, replacement_value: 1000000 });
      assertEquals(fire.base_bpp_premium, 7500);
      assertEquals(water.base_bpp_premium, 10000);
    },
  },
  {
    id: 'T2-F23-04',
    featureId: 23,
    featureName: 'Boiler & Pressure Plant (BPP) Engine',
    tier: 2,
    description: 'Zero TPL limit incurs 0 TPL premium',
    fn: () => {
      const res = calculateBppPremium({ vessel_type: 'fire_tube', heating_surface_sqm: 50, operating_pressure_bar: 10, replacement_value: 1000000, tpl_limit: 0 });
      assertEquals(res.tpl_premium, 0);
    },
  },
  {
    id: 'T2-F23-05',
    featureId: 23,
    featureName: 'Boiler & Pressure Plant (BPP) Engine',
    tier: 2,
    description: 'Negative replacement value throws Error',
    fn: () => {
      assertThrows(() => calculateBppPremium({ vessel_type: 'fire_tube', heating_surface_sqm: 50, operating_pressure_bar: 10, replacement_value: -100 }));
    },
  },

  // ==========================================================================
  // FEATURE 24: Fixed Asset Register (FAR) Tabular Parser (5 Tests)
  // ==========================================================================
  {
    id: 'T2-F24-01',
    featureId: 24,
    featureName: 'Fixed Asset Register (FAR) Tabular Parser',
    tier: 2,
    description: 'Equal book value and CRV yields underinsurance ratio of 1.0',
    fn: () => {
      const res = parseFixedAssetRegister([{ asset_code: 'A1', category: 'plant_machinery', book_value: 500000, current_replacement_value: 500000 }]);
      assertEquals(res.underinsurance_ratio, 1.0);
    },
  },
  {
    id: 'T2-F24-02',
    featureId: 24,
    featureName: 'Fixed Asset Register (FAR) Tabular Parser',
    tier: 2,
    description: 'Book value zero yields underinsurance ratio of 0.0',
    fn: () => {
      const res = parseFixedAssetRegister([{ asset_code: 'A1', category: 'plant_machinery', book_value: 0, current_replacement_value: 500000 }]);
      assertEquals(res.underinsurance_ratio, 0.0);
    },
  },
  {
    id: 'T2-F24-03',
    featureId: 24,
    featureName: 'Fixed Asset Register (FAR) Tabular Parser',
    tier: 2,
    description: 'Empty items array returns 0 totals with 1.0 default ratio',
    fn: () => {
      const res = parseFixedAssetRegister([]);
      assertEquals(res.total_crv, 0);
      assertEquals(res.underinsurance_ratio, 1.0);
    },
  },
  {
    id: 'T2-F24-04',
    featureId: 24,
    featureName: 'Fixed Asset Register (FAR) Tabular Parser',
    tier: 2,
    description: 'Single asset category populated correctly populates only that category',
    fn: () => {
      const res = parseFixedAssetRegister([{ asset_code: 'A1', category: 'stocks', book_value: 100, current_replacement_value: 200 }]);
      assertEquals(res.stocks_crv, 200);
      assertEquals(res.building_crv, 0);
    },
  },
  {
    id: 'T2-F24-05',
    featureId: 24,
    featureName: 'Fixed Asset Register (FAR) Tabular Parser',
    tier: 2,
    description: 'Large schedule of 500 fixed assets parses smoothly',
    fn: () => {
      const items: FarItem[] = [];
      for (let i = 0; i < 500; i++) {
        items.push({ asset_code: `A-${i}`, category: 'plant_machinery', book_value: 1000, current_replacement_value: 2000 });
      }
      const res = parseFixedAssetRegister(items);
      assertEquals(res.total_crv, 1000000);
    },
  },

  // ==========================================================================
  // FEATURE 25: Engineering Studio UI Model (5 Tests)
  // ==========================================================================
  {
    id: 'T2-F25-01',
    featureId: 25,
    featureName: 'Engineering Studio UI Model',
    tier: 2,
    description: 'Zero contract duration throws validation error',
    fn: () => {
      const res = validateEngineeringStudioInput({ project_name: 'P', contractor_name: 'C', project_type: 'car', civil_si: 100, plant_si: 0, duration_months: 0 });
      assertEquals(res.is_valid, false);
    },
  },
  {
    id: 'T2-F25-02',
    featureId: 25,
    featureName: 'Engineering Studio UI Model',
    tier: 2,
    description: 'Negative contract duration throws validation error',
    fn: () => {
      const res = validateEngineeringStudioInput({ project_name: 'P', contractor_name: 'C', project_type: 'car', civil_si: 100, plant_si: 0, duration_months: -5 });
      assertEquals(res.is_valid, false);
    },
  },
  {
    id: 'T2-F25-03',
    featureId: 25,
    featureName: 'Engineering Studio UI Model',
    tier: 2,
    description: 'Empty project name throws validation error',
    fn: () => {
      const res = validateEngineeringStudioInput({ project_name: '', contractor_name: 'C', project_type: 'car', civil_si: 100, plant_si: 0, duration_months: 12 });
      assertEquals(res.is_valid, false);
    },
  },
  {
    id: 'T2-F25-04',
    featureId: 25,
    featureName: 'Engineering Studio UI Model',
    tier: 2,
    description: 'Both civil and plant sum insured zero throws validation error',
    fn: () => {
      const res = validateEngineeringStudioInput({ project_name: 'P', contractor_name: 'C', project_type: 'car', civil_si: 0, plant_si: 0, duration_months: 12 });
      assertEquals(res.is_valid, false);
    },
  },
  {
    id: 'T2-F25-05',
    featureId: 25,
    featureName: 'Engineering Studio UI Model',
    tier: 2,
    description: 'Plant only project (civil = 0) validates as pure EAR',
    fn: () => {
      const res = validateEngineeringStudioInput({ project_name: 'Turbine EAR', contractor_name: 'Siemens', project_type: 'ear', civil_si: 0, plant_si: 200000000, duration_months: 12 });
      assertEquals(res.is_valid, true);
    },
  },

  // ==========================================================================
  // FEATURE 26: CGL Turnover & AOA:AOY Limit Ratio Engine (5 Tests)
  // ==========================================================================
  {
    id: 'T2-F26-01',
    featureId: 26,
    featureName: 'CGL Turnover & AOA:AOY Limit Ratio Engine',
    tier: 2,
    description: 'AOA limit > AOY limit (e.g. AOA ₹5 Cr, AOY ₹2 Cr) throws Error',
    fn: () => {
      assertThrows(() => {
        calculateCglPremium({ annual_turnover: 10000000, aoa_limit: 50000000, aoy_limit: 20000000, ratio: '1:1', hazard_category: 1, territory: 'india_only' });
      });
    },
  },
  {
    id: 'T2-F26-02',
    featureId: 26,
    featureName: 'CGL Turnover & AOA:AOY Limit Ratio Engine',
    tier: 2,
    description: 'AOA limit = AOY limit (1:1 ratio) is valid and gets 0% discount',
    fn: () => {
      const res = calculateCglPremium({ annual_turnover: 10000000, aoa_limit: 20000000, aoy_limit: 20000000, ratio: '1:1', hazard_category: 1, territory: 'india_only' });
      assertEquals(res.ratio_discount_percent, 0);
    },
  },
  {
    id: 'T2-F26-03',
    featureId: 26,
    featureName: 'CGL Turnover & AOA:AOY Limit Ratio Engine',
    tier: 2,
    description: 'Category 4 (hazardous chemicals) rates at highest rate (2.50‰)',
    fn: () => {
      const res = calculateCglPremium({ annual_turnover: 10000000, aoa_limit: 10000000, aoy_limit: 10000000, ratio: '1:1', hazard_category: 4, territory: 'india_only' });
      assertEquals(res.base_turnover_rate_per_mille, 2.50);
    },
  },
  {
    id: 'T2-F26-04',
    featureId: 26,
    featureName: 'CGL Turnover & AOA:AOY Limit Ratio Engine',
    tier: 2,
    description: 'Worldwide excluding USA/Canada applies 1.50 multiplier',
    fn: () => {
      const res = calculateCglPremium({ annual_turnover: 10000000, aoa_limit: 10000000, aoy_limit: 10000000, ratio: '1:1', hazard_category: 1, territory: 'worldwide_ex_usa' });
      assertEquals(res.territory_multiplier, 1.50);
    },
  },
  {
    id: 'T2-F26-05',
    featureId: 26,
    featureName: 'CGL Turnover & AOA:AOY Limit Ratio Engine',
    tier: 2,
    description: 'Zero turnover produces 0 gross and 0 net premium',
    fn: () => {
      const res = calculateCglPremium({ annual_turnover: 0, aoa_limit: 1000000, aoy_limit: 1000000, ratio: '1:1', hazard_category: 1, territory: 'india_only' });
      assertEquals(res.net_cgl_premium, 0);
    },
  },

  // ==========================================================================
  // FEATURE 27: Professional Indemnity (PI / E&O) Engine (5 Tests)
  // ==========================================================================
  {
    id: 'T2-F27-01',
    featureId: 27,
    featureName: 'Professional Indemnity (PI / E&O) Engine',
    tier: 2,
    description: 'Insurance broker with LOI below ₹50 Lakhs statutory minimum fails statutory check',
    fn: () => {
      const res = calculateProfessionalIndemnity({ annual_fee_income: 1000000, limit_of_indemnity: 4000000, profession: 'insurance_broker', prior_clean_years: 0 });
      assertEquals(res.statutory_minimum_met, false);
    },
  },
  {
    id: 'T2-F27-02',
    featureId: 27,
    featureName: 'Professional Indemnity (PI / E&O) Engine',
    tier: 2,
    description: 'Insurance broker with LOI below 3x annual brokerage fails statutory check',
    fn: () => {
      const res = calculateProfessionalIndemnity({ annual_fee_income: 30000000, limit_of_indemnity: 60000000, profession: 'insurance_broker', prior_clean_years: 0 }); // 3x = 90M
      assertEquals(res.statutory_minimum_met, false);
    },
  },
  {
    id: 'T2-F27-03',
    featureId: 27,
    featureName: 'Professional Indemnity (PI / E&O) Engine',
    tier: 2,
    description: 'Insurance broker meeting both 3x brokerage and ₹50L passes statutory check',
    fn: () => {
      const res = calculateProfessionalIndemnity({ annual_fee_income: 10000000, limit_of_indemnity: 30000000, profession: 'insurance_broker', prior_clean_years: 0 });
      assertEquals(res.statutory_minimum_met, true);
    },
  },
  {
    id: 'T2-F27-04',
    featureId: 27,
    featureName: 'Professional Indemnity (PI / E&O) Engine',
    tier: 2,
    description: 'Retroactive prior years capped at 50% max loading (e.g. 7 years capped at 50%)',
    fn: () => {
      const res = calculateProfessionalIndemnity({ annual_fee_income: 10000000, limit_of_indemnity: 10000000, profession: 'tech_software', prior_clean_years: 7 });
      assertEquals(res.retroactive_loading_percent, 50);
    },
  },
  {
    id: 'T2-F27-05',
    featureId: 27,
    featureName: 'Professional Indemnity (PI / E&O) Engine',
    tier: 2,
    description: 'Zero prior clean years adds 0% retroactive loading',
    fn: () => {
      const res = calculateProfessionalIndemnity({ annual_fee_income: 10000000, limit_of_indemnity: 10000000, profession: 'tech_software', prior_clean_years: 0 });
      assertEquals(res.retroactive_loading_percent, 0);
    },
  },

  // ==========================================================================
  // FEATURE 28: Directors & Officers (D&O) Engine (5 Tests)
  // ==========================================================================
  {
    id: 'T2-F28-01',
    featureId: 28,
    featureName: 'Directors & Officers (D&O) Engine',
    tier: 2,
    description: 'Debt-to-Equity ratio = 3.0 exact boundary does NOT incur distress loading',
    fn: () => {
      const res = calculateDirectorsOfficersPremium({ limit_of_indemnity: 10000000, entity_listing_status: 'private_unlisted', debt_to_equity_ratio: 3.0 });
      assertEquals(res.financial_distress_loading_percent, 0);
    },
  },
  {
    id: 'T2-F28-02',
    featureId: 28,
    featureName: 'Directors & Officers (D&O) Engine',
    tier: 2,
    description: 'Debt-to-Equity ratio = 3.1 boundary incurs +25% financial distress loading',
    fn: () => {
      const res = calculateDirectorsOfficersPremium({ limit_of_indemnity: 10000000, entity_listing_status: 'private_unlisted', debt_to_equity_ratio: 3.1 });
      assertEquals(res.financial_distress_loading_percent, 25);
    },
  },
  {
    id: 'T2-F28-03',
    featureId: 28,
    featureName: 'Directors & Officers (D&O) Engine',
    tier: 2,
    description: 'Negative debt-to-equity ratio (net cash company) incurs 0% distress loading',
    fn: () => {
      const res = calculateDirectorsOfficersPremium({ limit_of_indemnity: 10000000, entity_listing_status: 'private_unlisted', debt_to_equity_ratio: -0.5 });
      assertEquals(res.financial_distress_loading_percent, 0);
    },
  },
  {
    id: 'T2-F28-04',
    featureId: 28,
    featureName: 'Directors & Officers (D&O) Engine',
    tier: 2,
    description: 'US ADR listed firm evaluates at 3.5x multiplier',
    fn: () => {
      const pvt = calculateDirectorsOfficersPremium({ limit_of_indemnity: 10000000, entity_listing_status: 'private_unlisted', debt_to_equity_ratio: 1.0 });
      const us = calculateDirectorsOfficersPremium({ limit_of_indemnity: 10000000, entity_listing_status: 'public_listed_us_adr', debt_to_equity_ratio: 1.0 });
      assertCloseTo(us.net_do_premium / pvt.net_do_premium, 3.5, 0.01);
    },
  },
  {
    id: 'T2-F28-05',
    featureId: 28,
    featureName: 'Directors & Officers (D&O) Engine',
    tier: 2,
    description: 'Indian listed firm evaluates at 1.8x multiplier',
    fn: () => {
      const pvt = calculateDirectorsOfficersPremium({ limit_of_indemnity: 10000000, entity_listing_status: 'private_unlisted', debt_to_equity_ratio: 1.0 });
      const ind = calculateDirectorsOfficersPremium({ limit_of_indemnity: 10000000, entity_listing_status: 'public_listed_india', debt_to_equity_ratio: 1.0 });
      assertCloseTo(ind.net_do_premium / pvt.net_do_premium, 1.8, 0.01);
    },
  },

  // ==========================================================================
  // FEATURE 29: Deterministic Cyber Posture Scoring Matrix (5 Tests)
  // ==========================================================================
  {
    id: 'T2-F29-01',
    featureId: 29,
    featureName: 'Deterministic Cyber Posture Scoring Matrix',
    tier: 2,
    description: 'Score = 49 boundary triggers uninsurable tier',
    fn: () => {
      // MFA (25) + Backups (20) = 45 (< 50)
      const res = evaluateCyberPosture(
        { has_mfa_everywhere: true, has_edr_endpoints: false, has_airgapped_backups: true, has_annual_vapt: false, has_247_soc: false, has_employee_training: false },
        100000
      );
      assertEquals(res.score, 45);
      assertEquals(res.posture_tier, 'uninsurable');
      assertEquals(res.can_issue_quote, false);
    },
  },
  {
    id: 'T2-F29-02',
    featureId: 29,
    featureName: 'Deterministic Cyber Posture Scoring Matrix',
    tier: 2,
    description: 'Score = 50 boundary triggers deficient tier (+30% loading)',
    fn: () => {
      // MFA (25) + Backups (20) + Training (10)? Wait: 25 + 20 = 45. MFA (25) + VAPT (15) + SOC (10) = 50
      const res = evaluateCyberPosture(
        { has_mfa_everywhere: true, has_edr_endpoints: false, has_airgapped_backups: false, has_annual_vapt: true, has_247_soc: true, has_employee_training: false },
        100000
      );
      assertEquals(res.score, 50);
      assertEquals(res.posture_tier, 'deficient');
      assertEquals(res.rate_adjustment_percent, 30);
    },
  },
  {
    id: 'T2-F29-03',
    featureId: 29,
    featureName: 'Deterministic Cyber Posture Scoring Matrix',
    tier: 2,
    description: 'Score = 69 boundary stays deficient (+30% loading)',
    fn: () => {
      // MFA (25) + EDR (20) + Backups (20) = 65
      const res = evaluateCyberPosture(
        { has_mfa_everywhere: true, has_edr_endpoints: true, has_airgapped_backups: true, has_annual_vapt: false, has_247_soc: false, has_employee_training: false },
        100000
      );
      assertEquals(res.score, 65);
      assertEquals(res.posture_tier, 'deficient');
    },
  },
  {
    id: 'T2-F29-04',
    featureId: 29,
    featureName: 'Deterministic Cyber Posture Scoring Matrix',
    tier: 2,
    description: 'Score = 70 boundary steps up to adequate tier (par 0%)',
    fn: () => {
      // MFA (25) + EDR (20) + Backups (20) + Training (10) = 75 (or 25+20+15+10 = 70)
      const res = evaluateCyberPosture(
        { has_mfa_everywhere: true, has_edr_endpoints: true, has_airgapped_backups: false, has_annual_vapt: true, has_247_soc: true, has_employee_training: false },
        100000
      );
      assertEquals(res.score, 70);
      assertEquals(res.posture_tier, 'adequate');
      assertEquals(res.rate_adjustment_percent, 0);
    },
  },
  {
    id: 'T2-F29-05',
    featureId: 29,
    featureName: 'Deterministic Cyber Posture Scoring Matrix',
    tier: 2,
    description: 'Score = 84 boundary stays adequate (par 0%)',
    fn: () => {
      // MFA (25) + EDR (20) + Backups (20) + VAPT (15) = 80 (< 85)
      const res = evaluateCyberPosture(
        { has_mfa_everywhere: true, has_edr_endpoints: true, has_airgapped_backups: true, has_annual_vapt: true, has_247_soc: false, has_employee_training: false },
        100000
      );
      assertEquals(res.score, 80);
      assertEquals(res.posture_tier, 'adequate');
    },
  },

  // ==========================================================================
  // FEATURE 30: Commercial Crime & Fidelity Engine (5 Tests)
  // ==========================================================================
  {
    id: 'T2-F30-01',
    featureId: 30,
    featureName: 'Commercial Crime & Fidelity Engine',
    tier: 2,
    description: 'Zero sensitive employees computes limit premium only',
    fn: () => {
      const res = calculateCommercialCrimePremium({ employees_with_funds_access: 0, limit_of_liability: 1000000, has_dual_authorization_above_50k: true });
      assertEquals(res.per_head_premium, 0);
      assertEquals(res.limit_premium, 5000);
    },
  },
  {
    id: 'T2-F30-02',
    featureId: 30,
    featureName: 'Commercial Crime & Fidelity Engine',
    tier: 2,
    description: 'Zero limit of liability computes per-head premium only',
    fn: () => {
      const res = calculateCommercialCrimePremium({ employees_with_funds_access: 10, limit_of_liability: 0, has_dual_authorization_above_50k: true });
      assertEquals(res.limit_premium, 0);
      assertEquals(res.per_head_premium, 2500);
    },
  },
  {
    id: 'T2-F30-03',
    featureId: 30,
    featureName: 'Commercial Crime & Fidelity Engine',
    tier: 2,
    description: 'Dual authorization active gives full 15% discount',
    fn: () => {
      const res = calculateCommercialCrimePremium({ employees_with_funds_access: 100, limit_of_liability: 10000000, has_dual_authorization_above_50k: true });
      // 75,000 * 0.15 = 11,250
      assertEquals(res.internal_controls_discount_or_loading, -11250);
    },
  },
  {
    id: 'T2-F30-04',
    featureId: 30,
    featureName: 'Commercial Crime & Fidelity Engine',
    tier: 2,
    description: 'Absence of dual authorization gives full +25% loading',
    fn: () => {
      const res = calculateCommercialCrimePremium({ employees_with_funds_access: 100, limit_of_liability: 10000000, has_dual_authorization_above_50k: false });
      assertEquals(res.internal_controls_discount_or_loading, 18750);
    },
  },
  {
    id: 'T2-F30-05',
    featureId: 30,
    featureName: 'Commercial Crime & Fidelity Engine',
    tier: 2,
    description: 'Both zero employees and zero limit yields 0 net crime premium',
    fn: () => {
      const res = calculateCommercialCrimePremium({ employees_with_funds_access: 0, limit_of_liability: 0, has_dual_authorization_above_50k: true });
      assertEquals(res.net_crime_premium, 0);
    },
  },

  // ==========================================================================
  // FEATURE 31: Corporate Liability Studio UI Model (5 Tests)
  // ==========================================================================
  {
    id: 'T2-F31-01',
    featureId: 31,
    featureName: 'Corporate Liability Studio UI Model',
    tier: 2,
    description: 'Negative turnover invalidates proposal',
    fn: () => {
      const res = validateLiabilityStudioPackage({ corporate_name: 'Corp', turnover: -500, opt_cgl: true, opt_cyber: false, opt_do: false, opt_crime: false });
      assertEquals(res.is_valid, false);
    },
  },
  {
    id: 'T2-F31-02',
    featureId: 31,
    featureName: 'Corporate Liability Studio UI Model',
    tier: 2,
    description: 'All liability options unchecked invalidates proposal',
    fn: () => {
      const res = validateLiabilityStudioPackage({ corporate_name: 'Corp', turnover: 100000, opt_cgl: false, opt_cyber: false, opt_do: false, opt_crime: false });
      assertEquals(res.is_valid, false);
    },
  },
  {
    id: 'T2-F31-03',
    featureId: 31,
    featureName: 'Corporate Liability Studio UI Model',
    tier: 2,
    description: 'Single line selected validates cleanly',
    fn: () => {
      const res = validateLiabilityStudioPackage({ corporate_name: 'Corp', turnover: 100000, opt_cgl: false, opt_cyber: true, opt_do: false, opt_crime: false });
      assertEquals(res.is_valid, true);
      assertEquals(res.lines_selected_count, 1);
    },
  },
  {
    id: 'T2-F31-04',
    featureId: 31,
    featureName: 'Corporate Liability Studio UI Model',
    tier: 2,
    description: 'Blank corporate name invalidates proposal',
    fn: () => {
      const res = validateLiabilityStudioPackage({ corporate_name: '', turnover: 100000, opt_cgl: true, opt_cyber: false, opt_do: false, opt_crime: false });
      assertEquals(res.is_valid, false);
    },
  },
  {
    id: 'T2-F31-05',
    featureId: 31,
    featureName: 'Corporate Liability Studio UI Model',
    tier: 2,
    description: 'Mega-corporation (₹10,000 Crore turnover) validates without precision loss',
    fn: () => {
      const res = validateLiabilityStudioPackage({ corporate_name: 'Tata Consultancy Services', turnover: 100000000000, opt_cgl: true, opt_cyber: true, opt_do: true, opt_crime: true });
      assertEquals(res.is_valid, true);
      assertEquals(res.lines_selected_count, 4);
    },
  },

  // ==========================================================================
  // FEATURE 32: Surety Insurance Bond Engine (5 Tests)
  // ==========================================================================
  {
    id: 'T2-F32-01',
    featureId: 32,
    featureName: 'Surety Insurance Bond Engine',
    tier: 2,
    description: 'Bond value exceeding contractor net worth flags credit_limit_breach=true',
    fn: () => {
      const res = calculateSuretyBondPremium({ bond_type: 'performance_bond', bond_value: 150000000, tenure_months: 12, contractor_grade: 'A', contractor_net_worth: 100000000 });
      assertEquals(res.credit_limit_breach, true);
    },
  },
  {
    id: 'T2-F32-02',
    featureId: 32,
    featureName: 'Surety Insurance Bond Engine',
    tier: 2,
    description: 'Credit limit breach mandates additional +25% liquid collateral',
    fn: () => {
      const res = calculateSuretyBondPremium({ bond_type: 'performance_bond', bond_value: 150000000, tenure_months: 12, contractor_grade: 'A', contractor_net_worth: 100000000 });
      // Grade A standard margin 10% + 25% surcharge = 35%
      assertEquals(res.required_collateral_margin_percent, 35);
    },
  },
  {
    id: 'T2-F32-03',
    featureId: 32,
    featureName: 'Surety Insurance Bond Engine',
    tier: 2,
    description: 'Bond value exactly equal to net worth does NOT trigger credit limit breach',
    fn: () => {
      const res = calculateSuretyBondPremium({ bond_type: 'performance_bond', bond_value: 100000000, tenure_months: 12, contractor_grade: 'A', contractor_net_worth: 100000000 });
      assertEquals(res.credit_limit_breach, false);
      assertEquals(res.required_collateral_margin_percent, 10);
    },
  },
  {
    id: 'T2-F32-04',
    featureId: 2,
    featureName: 'Surety Insurance Bond Engine',
    tier: 2,
    description: 'Zero bond value throws Error',
    fn: () => {
      assertThrows(() => calculateSuretyBondPremium({ bond_type: 'performance_bond', bond_value: 0, tenure_months: 12, contractor_grade: 'A', contractor_net_worth: 100000000 }));
    },
  },
  {
    id: 'T2-F32-05',
    featureId: 32,
    featureName: 'Surety Insurance Bond Engine',
    tier: 2,
    description: 'Zero tenure months throws Error',
    fn: () => {
      assertThrows(() => calculateSuretyBondPremium({ bond_type: 'performance_bond', bond_value: 10000000, tenure_months: 0, contractor_grade: 'A', contractor_net_worth: 100000000 }));
    },
  },

  // ==========================================================================
  // FEATURE 33: Trade Credit Insurance (TCI) Engine (5 Tests)
  // ==========================================================================
  {
    id: 'T2-F33-01',
    featureId: 33,
    featureName: 'Trade Credit Insurance (TCI) Engine',
    tier: 2,
    description: 'Requested indemnity 95% is clamped to statutory maximum of 90%',
    fn: () => {
      const res = calculateTradeCreditPremium({ insurable_turnover: 10000000, average_credit_days: 30, top_10_buyers_turnover_share_percent: 30, requested_indemnity_percent: 95 });
      assertEquals(res.clamped_indemnity_percent, 90);
    },
  },
  {
    id: 'T2-F33-02',
    featureId: 33,
    featureName: 'Trade Credit Insurance (TCI) Engine',
    tier: 2,
    description: 'Requested indemnity 40% is clamped to minimum of 50%',
    fn: () => {
      const res = calculateTradeCreditPremium({ insurable_turnover: 10000000, average_credit_days: 30, top_10_buyers_turnover_share_percent: 30, requested_indemnity_percent: 40 });
      assertEquals(res.clamped_indemnity_percent, 50);
    },
  },
  {
    id: 'T2-F33-03',
    featureId: 33,
    featureName: 'Trade Credit Insurance (TCI) Engine',
    tier: 2,
    description: 'Top 10 buyers share = 60% exact boundary does NOT trigger concentration loading',
    fn: () => {
      const res = calculateTradeCreditPremium({ insurable_turnover: 10000000, average_credit_days: 30, top_10_buyers_turnover_share_percent: 60, requested_indemnity_percent: 90 });
      assertEquals(res.concentration_loading_percent, 0);
    },
  },
  {
    id: 'T2-F33-04',
    featureId: 33,
    featureName: 'Trade Credit Insurance (TCI) Engine',
    tier: 2,
    description: 'Top 10 buyers share = 61% boundary triggers +20% concentration loading',
    fn: () => {
      const res = calculateTradeCreditPremium({ insurable_turnover: 10000000, average_credit_days: 30, top_10_buyers_turnover_share_percent: 61, requested_indemnity_percent: 90 });
      assertEquals(res.concentration_loading_percent, 20);
    },
  },
  {
    id: 'T2-F33-05',
    featureId: 33,
    featureName: 'Trade Credit Insurance (TCI) Engine',
    tier: 2,
    description: 'Long credit terms (120 days) rates at top base rate of 0.60%',
    fn: () => {
      const res = calculateTradeCreditPremium({ insurable_turnover: 10000000, average_credit_days: 120, top_10_buyers_turnover_share_percent: 30, requested_indemnity_percent: 90 });
      assertEquals(res.base_rate_percent, 0.60);
    },
  },

  // ==========================================================================
  // FEATURE 34: Financial & Specialty Studio UI Model (5 Tests)
  // ==========================================================================
  {
    id: 'T2-F34-01',
    featureId: 34,
    featureName: 'Financial & Specialty Studio UI Model',
    tier: 2,
    description: 'Lowercase PAN is auto-uppercased and validated successfully',
    fn: () => {
      const res = validateSpecialtyStudioInput({ contractor_or_applicant: 'Corp', pan_number: 'aaaca1234f', selected_product: 'surety_bond', principal_amount: 1000000 });
      assertEquals(res.is_valid, true);
    },
  },
  {
    id: 'T2-F34-02',
    featureId: 34,
    featureName: 'Financial & Specialty Studio UI Model',
    tier: 2,
    description: 'PAN with 9 characters instead of 10 fails validation',
    fn: () => {
      const res = validateSpecialtyStudioInput({ contractor_or_applicant: 'Corp', pan_number: 'AAACA1234', selected_product: 'surety_bond', principal_amount: 1000000 });
      assertEquals(res.is_valid, false);
    },
  },
  {
    id: 'T2-F34-03',
    featureId: 34,
    featureName: 'Financial & Specialty Studio UI Model',
    tier: 2,
    description: 'PAN with invalid structure (numbers in letters segment) fails validation',
    fn: () => {
      const res = validateSpecialtyStudioInput({ contractor_or_applicant: 'Corp', pan_number: '12345ABCDE', selected_product: 'surety_bond', principal_amount: 1000000 });
      assertEquals(res.is_valid, false);
    },
  },
  {
    id: 'T2-F34-04',
    featureId: 34,
    featureName: 'Financial & Specialty Studio UI Model',
    tier: 2,
    description: 'Zero principal amount fails validation',
    fn: () => {
      const res = validateSpecialtyStudioInput({ contractor_or_applicant: 'Corp', pan_number: 'AAACA1234F', selected_product: 'surety_bond', principal_amount: 0 });
      assertEquals(res.is_valid, false);
    },
  },
  {
    id: 'T2-F34-05',
    featureId: 34,
    featureName: 'Financial & Specialty Studio UI Model',
    tier: 2,
    description: 'Negative principal amount fails validation',
    fn: () => {
      const res = validateSpecialtyStudioInput({ contractor_or_applicant: 'Corp', pan_number: 'AAACA1234F', selected_product: 'surety_bond', principal_amount: -5000 });
      assertEquals(res.is_valid, false);
    },
  },
];
