/**
 * Qoutely E2E Test Suite - Tier 1: Feature Coverage (170 Tests)
 * Exactly 5 test cases per feature across all 34 features.
 * Verifies baseline happy paths, default parameter handling, statutory clauses, and core quote structures.
 */

import { TestCase, assert, assertEquals, assertCloseTo, assertThrows, assertMatch } from './harness';
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

export const tier1Tests: TestCase[] = [
  // ==========================================================================
  // FEATURE 1: Core Multi-Line Database Schema & Types (5 Tests)
  // ==========================================================================
  {
    id: 'T1-F01-01',
    featureId: 1,
    featureName: 'Core Multi-Line Database Schema & Types',
    tier: 1,
    description: 'Validates schema validation succeeds for standard quote with 18% GST',
    fn: () => {
      const quote = {
        id: 'q-1001',
        lob_category: 'motor',
        insurance_line: 'motor_fleet',
        net_premium: 100000,
        gst_amount: 18000,
        total_premium: 118000,
      };
      const res = validateQuoteSchema(quote);
      assert(res.valid, `Expected valid quote schema, got errors: ${res.errors.join(', ')}`);
    },
  },
  {
    id: 'T1-F01-02',
    featureId: 1,
    featureName: 'Core Multi-Line Database Schema & Types',
    tier: 1,
    description: 'Validates schema rejects quote with negative net premium',
    fn: () => {
      const quote = {
        id: 'q-1002',
        lob_category: 'motor',
        insurance_line: 'motor_fleet',
        net_premium: -500,
        gst_amount: 0,
        total_premium: 0,
      };
      const res = validateQuoteSchema(quote);
      assert(!res.valid, 'Expected schema validation to reject negative net premium');
    },
  },
  {
    id: 'T1-F01-03',
    featureId: 1,
    featureName: 'Core Multi-Line Database Schema & Types',
    tier: 1,
    description: 'Validates schema rejects quote when total_premium != net + gst',
    fn: () => {
      const quote = {
        id: 'q-1003',
        lob_category: 'marine',
        insurance_line: 'marine_cargo_inland',
        net_premium: 50000,
        gst_amount: 9000,
        total_premium: 65000, // Should be 59000
      };
      const res = validateQuoteSchema(quote);
      assert(!res.valid, 'Expected schema validation to reject inconsistent total premium');
    },
  },
  {
    id: 'T1-F01-04',
    featureId: 1,
    featureName: 'Core Multi-Line Database Schema & Types',
    tier: 1,
    description: 'Verifies support for all 7 commercial LOB categories',
    fn: () => {
      const lobs = ['property', 'motor', 'marine', 'engineering', 'liability', 'benefits', 'specialty'];
      for (const lob of lobs) {
        const q = { id: `q-${lob}`, lob_category: lob, insurance_line: 'test_line', net_premium: 1000, gst_amount: 180, total_premium: 1180 };
        assert(validateQuoteSchema(q).valid, `Expected LOB ${lob} to be valid`);
      }
    },
  },
  {
    id: 'T1-F01-05',
    featureId: 1,
    featureName: 'Core Multi-Line Database Schema & Types',
    tier: 1,
    description: 'Verifies support for specialized lines in database model',
    fn: () => {
      const lines = ['fire', 'motor_fleet', 'marine_cargo_ocean', 'car', 'cgl', 'ghi', 'surety_bond'];
      for (const line of lines) {
        const q = { id: `q-${line}`, lob_category: 'specialty', insurance_line: line, net_premium: 10000, gst_amount: 1800, total_premium: 11800 };
        assert(validateQuoteSchema(q).valid, `Expected line ${line} to be valid`);
      }
    },
  },

  // ==========================================================================
  // FEATURE 2: Motor Vehicle IDV Depreciation Engine (5 Tests)
  // ==========================================================================
  {
    id: 'T1-F02-01',
    featureId: 2,
    featureName: 'Motor Vehicle IDV Depreciation Engine',
    tier: 1,
    description: 'Vehicle age <= 6 months receives exact 5% depreciation',
    fn: () => {
      const res = calculateMotorIdv({ ex_showroom_price: 1000000, age_months: 4 });
      assertEquals(res.depreciation_rate, 0.05);
      assertEquals(res.chassis_idv, 950000);
      assertEquals(res.total_idv, 950000);
      assert(!res.surveyor_valuation_required, 'Surveyor not required for young vehicle');
    },
  },
  {
    id: 'T1-F02-02',
    featureId: 2,
    featureName: 'Motor Vehicle IDV Depreciation Engine',
    tier: 1,
    description: 'Vehicle age 18 months receives exact 20% depreciation',
    fn: () => {
      const res = calculateMotorIdv({ ex_showroom_price: 3500000, age_months: 18 });
      assertEquals(res.depreciation_rate, 0.20);
      assertEquals(res.chassis_idv, 2800000);
      assertEquals(res.total_idv, 2800000);
    },
  },
  {
    id: 'T1-F02-03',
    featureId: 2,
    featureName: 'Motor Vehicle IDV Depreciation Engine',
    tier: 1,
    description: 'Vehicle age 42 months receives exact 40% depreciation',
    fn: () => {
      const res = calculateMotorIdv({ ex_showroom_price: 2000000, age_months: 42 });
      assertEquals(res.depreciation_rate, 0.40);
      assertEquals(res.chassis_idv, 1200000);
    },
  },
  {
    id: 'T1-F02-04',
    featureId: 2,
    featureName: 'Motor Vehicle IDV Depreciation Engine',
    tier: 1,
    description: 'Accessories and CNG kit depreciate at the same statutory age rate',
    fn: () => {
      const res = calculateMotorIdv({
        ex_showroom_price: 1000000,
        age_months: 10, // 15% dep
        electrical_accessories: 50000,
        cng_lpg_kit: 60000,
      });
      assertEquals(res.depreciation_rate, 0.15);
      assertEquals(res.chassis_idv, 850000);
      assertEquals(res.accessories_idv, 42500); // 50000 * 0.85
      assertEquals(res.cng_idv, 51000); // 60000 * 0.85
      assertEquals(res.total_idv, 850000 + 42500 + 51000);
    },
  },
  {
    id: 'T1-F02-05',
    featureId: 2,
    featureName: 'Motor Vehicle IDV Depreciation Engine',
    tier: 1,
    description: 'Total IDV is exactly sum of chassis, accessories, and CNG kit',
    fn: () => {
      const res = calculateMotorIdv({
        ex_showroom_price: 1500000,
        age_months: 24, // 20% dep
        electrical_accessories: 20000,
        non_electrical_accessories: 30000,
        cng_lpg_kit: 50000,
      });
      const expected = res.chassis_idv + res.accessories_idv + res.cng_idv;
      assertEquals(res.total_idv, expected);
    },
  },

  // ==========================================================================
  // FEATURE 3: Motor Base Own Damage (OD) Rating (5 Tests)
  // ==========================================================================
  {
    id: 'T1-F03-01',
    featureId: 3,
    featureName: 'Motor Base Own Damage (OD) Rating',
    tier: 1,
    description: 'GCV Public Carrier in Zone A rates at 1.764%',
    fn: () => {
      const res = calculateMotorBaseOd({ total_idv: 1000000, vehicle_class: 'gcv_public', zone: 'A' });
      assertEquals(res.base_od_rate_percent, 1.764);
      assertEquals(res.gross_od_premium, 17640);
    },
  },
  {
    id: 'T1-F03-02',
    featureId: 3,
    featureName: 'Motor Base Own Damage (OD) Rating',
    tier: 1,
    description: 'GCV Public Carrier in Zone B rates at 1.756%',
    fn: () => {
      const res = calculateMotorBaseOd({ total_idv: 1000000, vehicle_class: 'gcv_public', zone: 'B' });
      assertEquals(res.base_od_rate_percent, 1.756);
      assertEquals(res.gross_od_premium, 17560);
    },
  },
  {
    id: 'T1-F03-03',
    featureId: 3,
    featureName: 'Motor Base Own Damage (OD) Rating',
    tier: 1,
    description: 'GCV Public Carrier in Zone C rates at 1.708%',
    fn: () => {
      const res = calculateMotorBaseOd({ total_idv: 1000000, vehicle_class: 'gcv_public', zone: 'C' });
      assertEquals(res.base_od_rate_percent, 1.708);
      assertEquals(res.gross_od_premium, 17080);
    },
  },
  {
    id: 'T1-F03-04',
    featureId: 3,
    featureName: 'Motor Base Own Damage (OD) Rating',
    tier: 1,
    description: 'GCV Private Carrier rates at 1.545% in Zone A',
    fn: () => {
      const res = calculateMotorBaseOd({ total_idv: 1000000, vehicle_class: 'gcv_private', zone: 'A' });
      assertEquals(res.base_od_rate_percent, 1.545);
      assertEquals(res.gross_od_premium, 15450);
    },
  },
  {
    id: 'T1-F03-05',
    featureId: 3,
    featureName: 'Motor Base Own Damage (OD) Rating',
    tier: 1,
    description: 'PCV Bus rates at 1.850% in Zone A',
    fn: () => {
      const res = calculateMotorBaseOd({ total_idv: 2000000, vehicle_class: 'pcv_bus', zone: 'A' });
      assertEquals(res.base_od_rate_percent, 1.850);
      assertEquals(res.gross_od_premium, 37000);
    },
  },

  // ==========================================================================
  // FEATURE 4: Motor Fleet Discount & NCB Ladder (5 Tests)
  // ==========================================================================
  {
    id: 'T1-F04-01',
    featureId: 4,
    featureName: 'Motor Fleet Discount & NCB Ladder',
    tier: 1,
    description: '0% NCB yields zero discount and full gross OD',
    fn: () => {
      const res = calculateMotorFleetNcb({ gross_od_premium: 20000, ncb_tier: 0, fleet_size: 1 });
      assertEquals(res.ncb_percent, 0);
      assertEquals(res.ncb_discount_amount, 0);
      assertEquals(res.net_od_premium, 20000);
    },
  },
  {
    id: 'T1-F04-02',
    featureId: 4,
    featureName: 'Motor Fleet Discount & NCB Ladder',
    tier: 1,
    description: '20% NCB gives exact 20% discount on gross OD',
    fn: () => {
      const res = calculateMotorFleetNcb({ gross_od_premium: 20000, ncb_tier: 20, fleet_size: 1 });
      assertEquals(res.ncb_percent, 20);
      assertEquals(res.ncb_discount_amount, 4000);
      assertEquals(res.net_od_premium, 16000);
    },
  },
  {
    id: 'T1-F04-03',
    featureId: 4,
    featureName: 'Motor Fleet Discount & NCB Ladder',
    tier: 1,
    description: '50% NCB gives exact 50% discount on gross OD',
    fn: () => {
      const res = calculateMotorFleetNcb({ gross_od_premium: 50000, ncb_tier: 50, fleet_size: 1 });
      assertEquals(res.ncb_percent, 50);
      assertEquals(res.ncb_discount_amount, 25000);
      assertEquals(res.net_od_premium, 25000);
    },
  },
  {
    id: 'T1-F04-04',
    featureId: 4,
    featureName: 'Motor Fleet Discount & NCB Ladder',
    tier: 1,
    description: 'Fleet size 30 with favorable claim ratio (<=60%) receives 10% fleet discount',
    fn: () => {
      const res = calculateMotorFleetNcb({ gross_od_premium: 100000, ncb_tier: 0, fleet_size: 30, past_claims_ratio_percent: 45 });
      assertEquals(res.fleet_discount_percent, 10);
      assertEquals(res.net_od_premium, 90000);
    },
  },
  {
    id: 'T1-F04-05',
    featureId: 4,
    featureName: 'Motor Fleet Discount & NCB Ladder',
    tier: 1,
    description: 'Fleet size > 50 with favorable claim ratio receives 15% fleet discount',
    fn: () => {
      const res = calculateMotorFleetNcb({ gross_od_premium: 100000, ncb_tier: 0, fleet_size: 60, past_claims_ratio_percent: 50 });
      assertEquals(res.fleet_discount_percent, 15);
      assertEquals(res.net_od_premium, 85000);
    },
  },

  // ==========================================================================
  // FEATURE 5: Motor Statutory Third Party (TP) Tariff (5 Tests)
  // ==========================================================================
  {
    id: 'T1-F05-01',
    featureId: 5,
    featureName: 'Motor Statutory Third Party (TP) Tariff',
    tier: 1,
    description: 'GCV Public Carrier <= 7,500 kg assigns statutory flat TP of ₹16,049',
    fn: () => {
      const res = calculateMotorTpTariff({ vehicle_class: 'gcv_public', gvw_kg: 6000, include_cpa: false, paid_drivers_count: 0 });
      assertEquals(res.base_statutory_tp, 16049);
      assertEquals(res.total_tp_premium, 16049);
      assert(res.is_statutory_immutable, 'Statutory TP is immutable');
    },
  },
  {
    id: 'T1-F05-02',
    featureId: 5,
    featureName: 'Motor Statutory Third Party (TP) Tariff',
    tier: 1,
    description: 'GCV Public Carrier 7,501 - 12,000 kg assigns statutory flat TP of ₹27,486',
    fn: () => {
      const res = calculateMotorTpTariff({ vehicle_class: 'gcv_public', gvw_kg: 10000, include_cpa: false, paid_drivers_count: 0 });
      assertEquals(res.base_statutory_tp, 27486);
    },
  },
  {
    id: 'T1-F05-03',
    featureId: 5,
    featureName: 'Motor Statutory Third Party (TP) Tariff',
    tier: 1,
    description: 'GCV Public Carrier 12,001 - 20,000 kg assigns statutory flat TP of ₹35,313',
    fn: () => {
      const res = calculateMotorTpTariff({ vehicle_class: 'gcv_public', gvw_kg: 16000, include_cpa: false, paid_drivers_count: 0 });
      assertEquals(res.base_statutory_tp, 35313);
    },
  },
  {
    id: 'T1-F05-04',
    featureId: 5,
    featureName: 'Motor Statutory Third Party (TP) Tariff',
    tier: 1,
    description: 'GCV Public Carrier > 40,000 kg assigns statutory flat TP of ₹45,512',
    fn: () => {
      const res = calculateMotorTpTariff({ vehicle_class: 'gcv_public', gvw_kg: 45000, include_cpa: false, paid_drivers_count: 0 });
      assertEquals(res.base_statutory_tp, 45512);
    },
  },
  {
    id: 'T1-F05-05',
    featureId: 5,
    featureName: 'Motor Statutory Third Party (TP) Tariff',
    tier: 1,
    description: 'Compulsory CPA adds ₹275 and paid driver IMT 28 adds ₹50',
    fn: () => {
      const res = calculateMotorTpTariff({ vehicle_class: 'gcv_public', gvw_kg: 10000, include_cpa: true, paid_drivers_count: 2 });
      assertEquals(res.cpa_premium, 275);
      assertEquals(res.paid_driver_premium, 100);
      assertEquals(res.total_tp_premium, 27486 + 275 + 100);
    },
  },

  // ==========================================================================
  // FEATURE 6: Commercial IMT Add-on Suite (5 Tests)
  // ==========================================================================
  {
    id: 'T1-F06-01',
    featureId: 6,
    featureName: 'Commercial IMT Add-on Suite',
    tier: 1,
    description: 'IMT 23 endorsement computes exactly 15% of gross OD premium',
    fn: () => {
      const res = calculateCommercialImtAddons({ total_idv: 1000000, gross_od_premium: 20000, vehicle_age_months: 12, opt_imt23: true });
      assertEquals(res.imt23_premium, 3000);
      assertEquals(res.total_addons_premium, 3000);
    },
  },
  {
    id: 'T1-F06-02',
    featureId: 6,
    featureName: 'Commercial IMT Add-on Suite',
    tier: 1,
    description: 'Zero depreciation for young vehicle (<=6 months) computes 0.75% of IDV',
    fn: () => {
      const res = calculateCommercialImtAddons({ total_idv: 1000000, gross_od_premium: 20000, vehicle_age_months: 5, opt_zero_dep: true });
      assertEquals(res.zero_dep_premium, 7500);
    },
  },
  {
    id: 'T1-F06-03',
    featureId: 6,
    featureName: 'Commercial IMT Add-on Suite',
    tier: 1,
    description: 'Consumables cover computes exactly 0.25% of IDV',
    fn: () => {
      const res = calculateCommercialImtAddons({ total_idv: 1000000, gross_od_premium: 20000, vehicle_age_months: 12, opt_consumables: true });
      assertEquals(res.consumables_premium, 2500);
    },
  },
  {
    id: 'T1-F06-04',
    featureId: 6,
    featureName: 'Commercial IMT Add-on Suite',
    tier: 1,
    description: 'Engine & gearbox protect computes exactly 0.35% of IDV',
    fn: () => {
      const res = calculateCommercialImtAddons({ total_idv: 2000000, gross_od_premium: 35000, vehicle_age_months: 12, opt_engine_protect: true });
      assertEquals(res.engine_protect_premium, 7000);
    },
  },
  {
    id: 'T1-F06-05',
    featureId: 6,
    featureName: 'Commercial IMT Add-on Suite',
    tier: 1,
    description: 'Roadside assistance (RSA) computes flat ₹500',
    fn: () => {
      const res = calculateCommercialImtAddons({ total_idv: 1000000, gross_od_premium: 20000, vehicle_age_months: 12, opt_rsa: true });
      assertEquals(res.rsa_premium, 500);
    },
  },

  // ==========================================================================
  // FEATURE 7: Bulk Fleet Vehicle Roster Ingestion (5 Tests)
  // ==========================================================================
  {
    id: 'T1-F07-01',
    featureId: 7,
    featureName: 'Bulk Fleet Vehicle Roster Ingestion',
    tier: 1,
    description: 'Parses valid fleet schedule with valid registration numbers',
    fn: () => {
      const fleet: BulkFleetRecord[] = [
        { reg_number: 'MH12AB1234', make_model: 'Tata Prima', mfg_year: 2024, vehicle_class: 'gcv_public', gvw_kg: 25000, ex_showroom_price: 3500000, zone: 'A', ncb_tier: 20 },
        { reg_number: 'DL01CD5678', make_model: 'Ashok Leyland', mfg_year: 2023, vehicle_class: 'gcv_public', gvw_kg: 16000, ex_showroom_price: 2800000, zone: 'A', ncb_tier: 25 },
      ];
      const res = ingestBulkFleetSchedule(fleet);
      assertEquals(res.total_vehicles, 2);
      assertEquals(res.valid_vehicles, 2);
      assertEquals(res.invalid_vehicles, 0);
    },
  },
  {
    id: 'T1-F07-02',
    featureId: 7,
    featureName: 'Bulk Fleet Vehicle Roster Ingestion',
    tier: 1,
    description: 'Aggregates total fleet IDV across all valid vehicles accurately',
    fn: () => {
      const fleet: BulkFleetRecord[] = [
        { reg_number: 'MH12AB1234', make_model: 'Tata Prima', mfg_year: 2024, vehicle_class: 'gcv_public', gvw_kg: 25000, ex_showroom_price: 2000000, zone: 'A', ncb_tier: 0 },
        { reg_number: 'KA01CD5678', make_model: 'Eicher Pro', mfg_year: 2024, vehicle_class: 'gcv_public', gvw_kg: 10000, ex_showroom_price: 1500000, zone: 'B', ncb_tier: 0 },
      ];
      const res = ingestBulkFleetSchedule(fleet);
      // Both 2 yrs old (2026 - 2024 = 24 mos) -> 20% dep -> 80% IDV
      assertEquals(res.total_fleet_idv, (2000000 * 0.8) + (1500000 * 0.8));
    },
  },
  {
    id: 'T1-F07-03',
    featureId: 7,
    featureName: 'Bulk Fleet Vehicle Roster Ingestion',
    tier: 1,
    description: 'Aggregates total fleet OD and TP premiums correctly',
    fn: () => {
      const fleet: BulkFleetRecord[] = [
        { reg_number: 'MH12AB1234', make_model: 'Tata Prima', mfg_year: 2025, vehicle_class: 'gcv_public', gvw_kg: 35000, ex_showroom_price: 3000000, zone: 'A', ncb_tier: 20 },
      ];
      const res = ingestBulkFleetSchedule(fleet);
      assert(res.total_fleet_net_od > 0, 'OD premium should be > 0');
      assert(res.total_fleet_tp > 0, 'TP premium should be > 0');
      assertEquals(res.total_fleet_net_premium, res.total_fleet_net_od + res.total_fleet_tp);
    },
  },
  {
    id: 'T1-F07-04',
    featureId: 7,
    featureName: 'Bulk Fleet Vehicle Roster Ingestion',
    tier: 1,
    description: 'Computes 18% GST and total fleet payable accurately',
    fn: () => {
      const fleet: BulkFleetRecord[] = [
        { reg_number: 'MH12AB1234', make_model: 'Tata Prima', mfg_year: 2025, vehicle_class: 'gcv_public', gvw_kg: 35000, ex_showroom_price: 3000000, zone: 'A', ncb_tier: 20 },
      ];
      const res = ingestBulkFleetSchedule(fleet);
      assertEquals(res.total_fleet_gst, Math.round(res.total_fleet_net_premium * 0.18));
      assertEquals(res.total_fleet_payable, res.total_fleet_net_premium + res.total_fleet_gst);
    },
  },
  {
    id: 'T1-F07-05',
    featureId: 7,
    featureName: 'Bulk Fleet Vehicle Roster Ingestion',
    tier: 1,
    description: 'Flags invalid registration numbers without crashing the ingestion engine',
    fn: () => {
      const fleet: BulkFleetRecord[] = [
        { reg_number: 'INVALID_PLATE', make_model: 'Tata Prima', mfg_year: 2024, vehicle_class: 'gcv_public', gvw_kg: 25000, ex_showroom_price: 3500000, zone: 'A', ncb_tier: 20 },
        { reg_number: 'MH12AB1234', make_model: 'Ashok Leyland', mfg_year: 2024, vehicle_class: 'gcv_public', gvw_kg: 16000, ex_showroom_price: 2800000, zone: 'A', ncb_tier: 25 },
      ];
      const res = ingestBulkFleetSchedule(fleet);
      assertEquals(res.total_vehicles, 2);
      assertEquals(res.valid_vehicles, 1);
      assertEquals(res.invalid_vehicles, 1);
      assertEquals(res.validation_errors.length, 1);
    },
  },

  // ==========================================================================
  // FEATURE 8: Commercial Motor & Fleet Studio UI Model (5 Tests)
  // ==========================================================================
  {
    id: 'T1-F08-01',
    featureId: 8,
    featureName: 'Commercial Motor & Fleet Studio UI Model',
    tier: 1,
    description: 'Validates required client and vehicle fields for studio view',
    fn: () => {
      const res = validateAndComputeMotorStudioLedger({
        client_id: 'cl-1',
        client_name: 'Navkar Logistics Ltd',
        vehicle_type: 'gcv_public',
        ex_showroom_price: 2500000,
        age_months: 12,
        zone: 'A',
        ncb_tier: 20,
        gvw_kg: 25000,
      });
      assert(res.ready_for_quote_slip, 'Expected ready for quote slip');
    },
  },
  {
    id: 'T1-F08-02',
    featureId: 8,
    featureName: 'Commercial Motor & Fleet Studio UI Model',
    tier: 1,
    description: 'Generates 11-row comprehensive calculation ledger',
    fn: () => {
      const res = validateAndComputeMotorStudioLedger({
        client_id: 'cl-1',
        client_name: 'Navkar Logistics Ltd',
        vehicle_type: 'gcv_public',
        ex_showroom_price: 2500000,
        age_months: 12,
        zone: 'A',
        ncb_tier: 20,
        gvw_kg: 25000,
      });
      assertEquals(res.ledger_rows.length, 11);
    },
  },
  {
    id: 'T1-F08-03',
    featureId: 8,
    featureName: 'Commercial Motor & Fleet Studio UI Model',
    tier: 1,
    description: 'Verifies ledger amounts reconcile from IDV to final payable',
    fn: () => {
      const res = validateAndComputeMotorStudioLedger({
        client_id: 'cl-1',
        client_name: 'Navkar Logistics Ltd',
        vehicle_type: 'gcv_public',
        ex_showroom_price: 2500000,
        age_months: 12,
        zone: 'A',
        ncb_tier: 20,
        gvw_kg: 25000,
      });
      const payableRow = res.ledger_rows.find(r => r.label === 'Total Premium Payable');
      assert(payableRow !== undefined, 'Payable row must exist');
      assertEquals(payableRow!.amount, res.total_payable);
    },
  },
  {
    id: 'T1-F08-04',
    featureId: 8,
    featureName: 'Commercial Motor & Fleet Studio UI Model',
    tier: 1,
    description: 'Displays statutory IRDAI Third Party description in ledger',
    fn: () => {
      const res = validateAndComputeMotorStudioLedger({
        client_id: 'cl-1',
        client_name: 'Navkar Logistics Ltd',
        vehicle_type: 'gcv_public',
        ex_showroom_price: 2500000,
        age_months: 12,
        zone: 'A',
        ncb_tier: 20,
        gvw_kg: 25000,
      });
      const tpRow = res.ledger_rows.find(r => r.label === 'Statutory Third Party (TP)');
      assert(tpRow?.description?.includes('IRDAI Gazetted Fixed Tariff') ?? false, 'TP description should cite IRDAI');
    },
  },
  {
    id: 'T1-F08-05',
    featureId: 8,
    featureName: 'Commercial Motor & Fleet Studio UI Model',
    tier: 1,
    description: 'Flags quote proposal as ready for quote slip PDF export',
    fn: () => {
      const res = validateAndComputeMotorStudioLedger({
        client_id: 'cl-1',
        client_name: 'Navkar Logistics Ltd',
        vehicle_type: 'gcv_public',
        ex_showroom_price: 2500000,
        age_months: 12,
        zone: 'A',
        ncb_tier: 20,
        gvw_kg: 25000,
      });
      assertEquals(res.ready_for_quote_slip, true);
    },
  },

  // ==========================================================================
  // FEATURE 9: Marine Inland Transit (ITC A/B/C) Rating (5 Tests)
  // ==========================================================================
  {
    id: 'T1-F09-01',
    featureId: 9,
    featureName: 'Marine Inland Transit (ITC A/B/C) Rating',
    tier: 1,
    description: 'Class 1 commodity under ITC (A) rates at 0.06‰',
    fn: () => {
      const res = calculateMarineInlandTransit({ invoice_value: 50000000, transit_clause: 'ITC_A', commodity_hazard_class: 1, is_certified_common_carrier: true });
      assertEquals(res.base_rate_per_mille, 0.06);
      assertEquals(res.net_marine_premium, 3000); // 50,000,000 * 0.00006 = 3000
    },
  },
  {
    id: 'T1-F09-02',
    featureId: 9,
    featureName: 'Marine Inland Transit (ITC A/B/C) Rating',
    tier: 1,
    description: 'Class 2 commodity under ITC (A) rates at 0.12‰',
    fn: () => {
      const res = calculateMarineInlandTransit({ invoice_value: 10000000, transit_clause: 'ITC_A', commodity_hazard_class: 2, is_certified_common_carrier: true });
      assertEquals(res.base_rate_per_mille, 0.12);
      assertEquals(res.net_marine_premium, 1200);
    },
  },
  {
    id: 'T1-F09-03',
    featureId: 9,
    featureName: 'Marine Inland Transit (ITC A/B/C) Rating',
    tier: 1,
    description: 'Class 3 commodity under ITC (A) rates at 0.25‰',
    fn: () => {
      const res = calculateMarineInlandTransit({ invoice_value: 10000000, transit_clause: 'ITC_A', commodity_hazard_class: 3, is_certified_common_carrier: true });
      assertEquals(res.base_rate_per_mille, 0.25);
      assertEquals(res.net_marine_premium, 2500);
    },
  },
  {
    id: 'T1-F09-04',
    featureId: 9,
    featureName: 'Marine Inland Transit (ITC A/B/C) Rating',
    tier: 1,
    description: 'Class 4 commodity under ITC (A) rates at 0.55‰',
    fn: () => {
      const res = calculateMarineInlandTransit({ invoice_value: 10000000, transit_clause: 'ITC_A', commodity_hazard_class: 4, is_certified_common_carrier: true });
      assertEquals(res.base_rate_per_mille, 0.55);
      assertEquals(res.net_marine_premium, 5500);
    },
  },
  {
    id: 'T1-F09-05',
    featureId: 9,
    featureName: 'Marine Inland Transit (ITC A/B/C) Rating',
    tier: 1,
    description: 'Enforces minimum statutory premium of ₹1,000 and 0.5% policy excess',
    fn: () => {
      const res = calculateMarineInlandTransit({ invoice_value: 500000, transit_clause: 'ITC_A', commodity_hazard_class: 1, is_certified_common_carrier: true });
      // Raw: 500,000 * 0.00006 = 30 -> Clamped to min ₹1,000
      assertEquals(res.net_marine_premium, 1000);
      assertEquals(res.policy_excess, 2500); // 0.5% of 500,000 is 2500 (min 2500)
    },
  },

  // ==========================================================================
  // FEATURE 10: Marine Ocean Cargo (ICC A/B/C) & Incoterms (5 Tests)
  // ==========================================================================
  {
    id: 'T1-F10-01',
    featureId: 10,
    featureName: 'Marine Ocean Cargo (ICC A/B/C) & Incoterms',
    tier: 1,
    description: 'CIF Incoterm applies 10% imaginary profit markup on invoice value',
    fn: () => {
      const res = calculateMarineOceanCargo({ invoice_value_inr: 10000000, incoterm: 'CIF', icc_clause: 'ICC_A' });
      assertEquals(res.cargo_sum_insured, 11000000); // 10M * 1.10
    },
  },
  {
    id: 'T1-F10-02',
    featureId: 10,
    featureName: 'Marine Ocean Cargo (ICC A/B/C) & Incoterms',
    tier: 1,
    description: 'FOB Incoterm includes freight and port markups before 10% profit markup',
    fn: () => {
      const res = calculateMarineOceanCargo({
        invoice_value_inr: 10000000,
        incoterm: 'FOB',
        icc_clause: 'ICC_A',
        ocean_freight_inr: 1000000,
        port_charges_inr: 200000,
      });
      // (10M + 1M + 0.2M) * 1.10 = 11.2M * 1.10 = 12,320,000
      assertEquals(res.cargo_sum_insured, 12320000);
    },
  },
  {
    id: 'T1-F10-03',
    featureId: 10,
    featureName: 'Marine Ocean Cargo (ICC A/B/C) & Incoterms',
    tier: 1,
    description: 'ICC (A) rates at base 0.35‰ on total cargo sum insured',
    fn: () => {
      const res = calculateMarineOceanCargo({ invoice_value_inr: 10000000, incoterm: 'CIF', icc_clause: 'ICC_A' });
      // SI = 11,000,000; Premium = 11,000,000 * 0.00035 = 3850
      assertEquals(res.cargo_premium, 3850);
    },
  },
  {
    id: 'T1-F10-04',
    featureId: 10,
    featureName: 'Marine Ocean Cargo (ICC A/B/C) & Incoterms',
    tier: 1,
    description: 'Customs Duty coverage rates at 50% of the ocean base cargo rate',
    fn: () => {
      const res = calculateMarineOceanCargo({
        invoice_value_inr: 10000000,
        incoterm: 'CIF',
        icc_clause: 'ICC_A',
        customs_duty_opted: true,
        customs_duty_rate_percent: 30,
      });
      // Cargo SI = 11M, Duty SI = 11M * 0.30 = 3.3M
      assertEquals(res.duty_sum_insured, 3300000);
      // Duty rate = 0.35‰ * 0.50 = 0.175‰; Premium = 3.3M * 0.000175 = 577.5 -> 578
      assertCloseTo(res.duty_premium, 578, 2);
    },
  },
  {
    id: 'T1-F10-05',
    featureId: 10,
    featureName: 'Marine Ocean Cargo (ICC A/B/C) & Incoterms',
    tier: 1,
    description: 'Institute War & Strikes clauses rate at 0.05‰ on total sum insured',
    fn: () => {
      const res = calculateMarineOceanCargo({
        invoice_value_inr: 10000000,
        incoterm: 'CIF',
        icc_clause: 'ICC_A',
        war_and_strikes_opted: true,
      });
      // War = 11,000,000 * 0.00005 = 550
      assertEquals(res.war_premium, 550);
      assertEquals(res.net_marine_premium, res.cargo_premium + 550);
    },
  },

  // ==========================================================================
  // FEATURE 11: Marine Open Policy (MOP) & ATPO Drawdown (5 Tests)
  // ==========================================================================
  {
    id: 'T1-F11-01',
    featureId: 11,
    featureName: 'Marine Open Policy (MOP) & ATPO Drawdown',
    tier: 1,
    description: 'Debits single dispatch premium from CD deposit account balance',
    fn: () => {
      const acc: MopAccount = { policy_number: 'MOP-2026-001', deposit_premium_balance: 50000, total_sum_insured: 100000000, utilized_sum_insured: 0 };
      const res = processMopDeclaration(acc, 5000000, 0.25);
      // Premium = 5,000,000 * 0.00025 = 1250
      assertEquals(res.debit_amount, 1250);
      assertEquals(res.updated_account.deposit_premium_balance, 48750);
      assert(res.certificate_issued, 'Certificate should be issued');
    },
  },
  {
    id: 'T1-F11-02',
    featureId: 11,
    featureName: 'Marine Open Policy (MOP) & ATPO Drawdown',
    tier: 1,
    description: 'Increases utilized sum insured by the consignment value',
    fn: () => {
      const acc: MopAccount = { policy_number: 'MOP-2026-001', deposit_premium_balance: 50000, total_sum_insured: 100000000, utilized_sum_insured: 10000000 };
      const res = processMopDeclaration(acc, 4000000, 0.25);
      assertEquals(res.updated_account.utilized_sum_insured, 14000000);
    },
  },
  {
    id: 'T1-F11-03',
    featureId: 11,
    featureName: 'Marine Open Policy (MOP) & ATPO Drawdown',
    tier: 1,
    description: 'Issues certificate when CD balance is sufficient',
    fn: () => {
      const acc: MopAccount = { policy_number: 'MOP-2026-001', deposit_premium_balance: 25000, total_sum_insured: 100000000, utilized_sum_insured: 0 };
      const res = processMopDeclaration(acc, 2000000, 0.12);
      assertEquals(res.certificate_issued, true);
    },
  },
  {
    id: 'T1-F11-04',
    featureId: 11,
    featureName: 'Marine Open Policy (MOP) & ATPO Drawdown',
    tier: 1,
    description: 'Emits warning when remaining CD balance falls below ₹10,000',
    fn: () => {
      const acc: MopAccount = { policy_number: 'MOP-2026-001', deposit_premium_balance: 11000, total_sum_insured: 100000000, utilized_sum_insured: 0 };
      const res = processMopDeclaration(acc, 8000000, 0.25);
      // Debit = 8M * 0.00025 = 2000 -> Remaining balance = 9000 (< 10000)
      assert(res.warning !== undefined && res.warning.includes('LOW_CD_BALANCE_WARNING'), 'Warning expected for low balance');
    },
  },
  {
    id: 'T1-F11-05',
    featureId: 11,
    featureName: 'Marine Open Policy (MOP) & ATPO Drawdown',
    tier: 1,
    description: 'Blocks declaration and flags CD_BALANCE_EXHAUSTED when debit exceeds balance',
    fn: () => {
      const acc: MopAccount = { policy_number: 'MOP-2026-001', deposit_premium_balance: 500, total_sum_insured: 100000000, utilized_sum_insured: 0 };
      const res = processMopDeclaration(acc, 5000000, 0.25); // Needs 1250
      assertEquals(res.certificate_issued, false);
      assert(res.warning?.includes('CD_BALANCE_EXHAUSTED') ?? false, 'Should flag CD_BALANCE_EXHAUSTED');
    },
  },

  // ==========================================================================
  // FEATURE 12: Marine Cargo Studio UI & Declaration Flow (5 Tests)
  // ==========================================================================
  {
    id: 'T1-F12-01',
    featureId: 12,
    featureName: 'Marine Cargo Studio UI & Declaration Flow',
    tier: 1,
    description: 'Validates complete marine proposal with origin, destination, and commodity',
    fn: () => {
      const res = validateMarineStudioProposal({
        client_name: 'Adani Logistics Ltd',
        policy_type: 'single_voyage',
        origin: 'JNPT Port, Mumbai',
        destination: 'Hamburg, Germany',
        commodity: 'Engineering Spares',
        consignment_value: 5000000,
        clause: 'ICC_A',
      });
      assert(res.is_valid && res.declaration_ready, 'Expected valid proposal');
    },
  },
  {
    id: 'T1-F12-02',
    featureId: 12,
    featureName: 'Marine Cargo Studio UI & Declaration Flow',
    tier: 1,
    description: 'Rejects marine proposal when consignment value is zero or negative',
    fn: () => {
      const res = validateMarineStudioProposal({
        client_name: 'Adani Logistics Ltd',
        policy_type: 'single_voyage',
        origin: 'JNPT Port',
        destination: 'Hamburg',
        commodity: 'Steel',
        consignment_value: 0,
        clause: 'ICC_A',
      });
      assertEquals(res.is_valid, false);
    },
  },
  {
    id: 'T1-F12-03',
    featureId: 12,
    featureName: 'Marine Cargo Studio UI & Declaration Flow',
    tier: 1,
    description: 'Rejects marine proposal when client name is missing',
    fn: () => {
      const res = validateMarineStudioProposal({
        client_name: '',
        policy_type: 'single_voyage',
        origin: 'JNPT Port',
        destination: 'Hamburg',
        commodity: 'Steel',
        consignment_value: 100000,
        clause: 'ICC_A',
      });
      assertEquals(res.is_valid, false);
    },
  },
  {
    id: 'T1-F12-04',
    featureId: 12,
    featureName: 'Marine Cargo Studio UI & Declaration Flow',
    tier: 1,
    description: 'Confirms declaration readiness for single voyage policies',
    fn: () => {
      const res = validateMarineStudioProposal({
        client_name: 'Reliance Industries',
        policy_type: 'single_voyage',
        origin: 'Hazira',
        destination: 'Rotterdam',
        commodity: 'Polymers',
        consignment_value: 20000000,
        clause: 'ICC_A',
      });
      assertEquals(res.declaration_ready, true);
    },
  },
  {
    id: 'T1-F12-05',
    featureId: 12,
    featureName: 'Marine Cargo Studio UI & Declaration Flow',
    tier: 1,
    description: 'Confirms declaration readiness for Open Cover / ATPO policies',
    fn: () => {
      const res = validateMarineStudioProposal({
        client_name: 'Tata Steel Ltd',
        policy_type: 'atpo',
        origin: 'Jamshedpur',
        destination: 'All India',
        commodity: 'Steel Coils',
        consignment_value: 100000000,
        clause: 'ITC_A',
      });
      assertEquals(res.declaration_ready, true);
    },
  },

  // ==========================================================================
  // FEATURE 13: GHI Actuarial Demographic Age-Band Matrix (5 Tests)
  // ==========================================================================
  {
    id: 'T1-F13-01',
    featureId: 13,
    featureName: 'GHI Actuarial Demographic Age-Band Matrix',
    tier: 1,
    description: 'Age band 0–25 assigns base rate ₹2,800 per head',
    fn: () => {
      const res = calculateGhiDemographicPremium({ age_0_25: 10, age_26_35: 0, age_36_45: 0, age_46_55: 0, age_56_65: 0, age_66_75: 0, age_76_plus: 0 }, 300000);
      assertEquals(res.pure_risk_premium, 28000); // 10 * 2800
      assertEquals(res.total_lives, 10);
    },
  },
  {
    id: 'T1-F13-02',
    featureId: 13,
    featureName: 'GHI Actuarial Demographic Age-Band Matrix',
    tier: 1,
    description: 'Age band 26–35 assigns base rate ₹4,200 per head',
    fn: () => {
      const res = calculateGhiDemographicPremium({ age_0_25: 0, age_26_35: 10, age_36_45: 0, age_46_55: 0, age_56_65: 0, age_66_75: 0, age_76_plus: 0 }, 300000);
      assertEquals(res.pure_risk_premium, 42000);
    },
  },
  {
    id: 'T1-F13-03',
    featureId: 13,
    featureName: 'GHI Actuarial Demographic Age-Band Matrix',
    tier: 1,
    description: 'Age band 36–45 assigns base rate ₹6,500 per head',
    fn: () => {
      const res = calculateGhiDemographicPremium({ age_0_25: 0, age_26_35: 0, age_36_45: 10, age_46_55: 0, age_56_65: 0, age_66_75: 0, age_76_plus: 0 }, 300000);
      assertEquals(res.pure_risk_premium, 65000);
    },
  },
  {
    id: 'T1-F13-04',
    featureId: 13,
    featureName: 'GHI Actuarial Demographic Age-Band Matrix',
    tier: 1,
    description: 'Age band 46–55 assigns base rate ₹11,200 per head',
    fn: () => {
      const res = calculateGhiDemographicPremium({ age_0_25: 0, age_26_35: 0, age_36_45: 0, age_46_55: 10, age_56_65: 0, age_66_75: 0, age_76_plus: 0 }, 300000);
      assertEquals(res.pure_risk_premium, 112000);
    },
  },
  {
    id: 'T1-F13-05',
    featureId: 13,
    featureName: 'GHI Actuarial Demographic Age-Band Matrix',
    tier: 1,
    description: 'Applies non-linear sum insured scaling `(SI / 3,00,000)^0.65`',
    fn: () => {
      const res3L = calculateGhiDemographicPremium({ age_0_25: 10, age_26_35: 0, age_36_45: 0, age_46_55: 0, age_56_65: 0, age_66_75: 0, age_76_plus: 0 }, 300000);
      const res5L = calculateGhiDemographicPremium({ age_0_25: 10, age_26_35: 0, age_36_45: 0, age_46_55: 0, age_56_65: 0, age_66_75: 0, age_76_plus: 0 }, 500000);
      // (500000 / 300000)^0.65 = (1.6667)^0.65 ~ 1.393
      assert(res5L.pure_risk_premium > res3L.pure_risk_premium, '5L should cost more than 3L');
      assertCloseTo(res5L.pure_risk_premium / res3L.pure_risk_premium, 1.393, 0.02);
    },
  },

  // ==========================================================================
  // FEATURE 14: GHI Benefit Customizer & Loadings (5 Tests)
  // ==========================================================================
  {
    id: 'T1-F14-01',
    featureId: 14,
    featureName: 'GHI Benefit Customizer & Loadings',
    tier: 1,
    description: 'Standard 1% normal / 2% ICU room rent applies 0% loading',
    fn: () => {
      const res = calculateGhiBenefitLoadings(100000, {
        room_rent: 'standard_1_percent',
        maternity_opted: false,
        maternity_day_1_waiver: false,
        ped_waiver_day_1: false,
        corporate_buffer_amount: 0,
        group_size: 100,
      });
      assertEquals(res.loading_percent, 0);
      assertEquals(res.loaded_premium, 100000);
    },
  },
  {
    id: 'T1-F14-02',
    featureId: 14,
    featureName: 'GHI Benefit Customizer & Loadings',
    tier: 1,
    description: 'Single Private Room option applies +8% loading',
    fn: () => {
      const res = calculateGhiBenefitLoadings(100000, {
        room_rent: 'single_private_room',
        maternity_opted: false,
        maternity_day_1_waiver: false,
        ped_waiver_day_1: false,
        corporate_buffer_amount: 0,
        group_size: 100,
      });
      assertEquals(res.loading_percent, 8);
      assertEquals(res.loaded_premium, 108000);
    },
  },
  {
    id: 'T1-F14-03',
    featureId: 14,
    featureName: 'GHI Benefit Customizer & Loadings',
    tier: 1,
    description: 'No Capping room rent option applies +15% loading',
    fn: () => {
      const res = calculateGhiBenefitLoadings(100000, {
        room_rent: 'no_capping',
        maternity_opted: false,
        maternity_day_1_waiver: false,
        ped_waiver_day_1: false,
        corporate_buffer_amount: 0,
        group_size: 100,
      });
      assertEquals(res.loading_percent, 15);
      assertEquals(res.loaded_premium, 115000);
    },
  },
  {
    id: 'T1-F14-04',
    featureId: 14,
    featureName: 'GHI Benefit Customizer & Loadings',
    tier: 1,
    description: 'Maternity cover with Day 1 waiver applies 15% combined loading (10% + 5%)',
    fn: () => {
      const res = calculateGhiBenefitLoadings(100000, {
        room_rent: 'standard_1_percent',
        maternity_opted: true,
        maternity_day_1_waiver: true,
        ped_waiver_day_1: false,
        corporate_buffer_amount: 0,
        group_size: 100,
      });
      assertEquals(res.loading_percent, 15);
      assertEquals(res.loaded_premium, 115000);
    },
  },
  {
    id: 'T1-F14-05',
    featureId: 14,
    featureName: 'GHI Benefit Customizer & Loadings',
    tier: 1,
    description: 'Corporate buffer requires minimum 50 lives and rates at 3.5% of buffer amount',
    fn: () => {
      const res = calculateGhiBenefitLoadings(100000, {
        room_rent: 'standard_1_percent',
        maternity_opted: false,
        maternity_day_1_waiver: false,
        ped_waiver_day_1: false,
        corporate_buffer_amount: 1000000, // 10 Lakhs buffer
        group_size: 100,
      });
      assertEquals(res.corporate_buffer_premium, 35000); // 1,000,000 * 3.5%
      assertEquals(res.total_ghi_premium, 100000 + 35000);
    },
  },

  // ==========================================================================
  // FEATURE 15: Group Term Life (GTLI) Mortality Engine (5 Tests)
  // ==========================================================================
  {
    id: 'T1-F15-01',
    featureId: 15,
    featureName: 'Group Term Life (GTLI) Mortality Engine',
    tier: 1,
    description: 'Age 25 member computes mortality rate of 0.88‰',
    fn: () => {
      const res = calculateGtliPremium([{ age: 25, sum_insured: 1000000 }]);
      // 1,000,000 * 0.00088 = 880
      assertEquals(res.total_gtli_premium, 880);
    },
  },
  {
    id: 'T1-F15-02',
    featureId: 15,
    featureName: 'Group Term Life (GTLI) Mortality Engine',
    tier: 1,
    description: 'Age 35 member computes mortality rate of 1.05‰',
    fn: () => {
      const res = calculateGtliPremium([{ age: 35, sum_insured: 1000000 }]);
      assertEquals(res.total_gtli_premium, 1050);
    },
  },
  {
    id: 'T1-F15-03',
    featureId: 15,
    featureName: 'Group Term Life (GTLI) Mortality Engine',
    tier: 1,
    description: 'Age 45 member computes mortality rate of 1.80‰',
    fn: () => {
      const res = calculateGtliPremium([{ age: 45, sum_insured: 1000000 }]);
      assertEquals(res.total_gtli_premium, 1800);
    },
  },
  {
    id: 'T1-F15-04',
    featureId: 15,
    featureName: 'Group Term Life (GTLI) Mortality Engine',
    tier: 1,
    description: 'Sum of individual member premiums equals total GTLI premium',
    fn: () => {
      const members = [
        { age: 25, sum_insured: 1000000 },
        { age: 35, sum_insured: 2000000 },
      ];
      const res = calculateGtliPremium(members);
      // 880 + (2 * 1050) = 880 + 2100 = 2980
      assertEquals(res.total_gtli_premium, 2980);
    },
  },
  {
    id: 'T1-F15-05',
    featureId: 15,
    featureName: 'Group Term Life (GTLI) Mortality Engine',
    tier: 1,
    description: 'Members with sum insured exceeding Free Cover Limit (FCL) are flagged for medical review',
    fn: () => {
      const members = [
        { age: 30, sum_insured: 2000000 },
        { age: 40, sum_insured: 8000000 }, // exceeds 5M FCL
      ];
      const res = calculateGtliPremium(members, 5000000);
      assertEquals(res.members_requiring_medical, 1);
    },
  },

  // ==========================================================================
  // FEATURE 16: Group Personal Accident (GPA) Engine (5 Tests)
  // ==========================================================================
  {
    id: 'T1-F16-01',
    featureId: 16,
    featureName: 'Group Personal Accident (GPA) Engine',
    tier: 1,
    description: 'Hazard Class I (Office/IT) rates at 0.35‰',
    fn: () => {
      const res = calculateGpaPremium({ sum_insured_per_life: 1000000, headcount: 10, hazard_class: 1, ttd_opted: false, medical_extension_opted: false });
      // Total SI = 10,000,000 * 0.00035 = 3500
      assertEquals(res.rate_per_mille, 0.35);
      assertEquals(res.total_gpa_premium, 3500);
    },
  },
  {
    id: 'T1-F16-02',
    featureId: 16,
    featureName: 'Group Personal Accident (GPA) Engine',
    tier: 1,
    description: 'Hazard Class II (Field/Light Mfg) rates at 0.65‰',
    fn: () => {
      const res = calculateGpaPremium({ sum_insured_per_life: 1000000, headcount: 10, hazard_class: 2, ttd_opted: false, medical_extension_opted: false });
      assertEquals(res.rate_per_mille, 0.65);
      assertEquals(res.total_gpa_premium, 6500);
    },
  },
  {
    id: 'T1-F16-03',
    featureId: 16,
    featureName: 'Group Personal Accident (GPA) Engine',
    tier: 1,
    description: 'Hazard Class III (Heavy/Hazardous) rates at 1.50‰',
    fn: () => {
      const res = calculateGpaPremium({ sum_insured_per_life: 1000000, headcount: 10, hazard_class: 3, ttd_opted: false, medical_extension_opted: false });
      assertEquals(res.rate_per_mille, 1.50);
      assertEquals(res.total_gpa_premium, 15000);
    },
  },
  {
    id: 'T1-F16-04',
    featureId: 16,
    featureName: 'Group Personal Accident (GPA) Engine',
    tier: 1,
    description: 'TTD rider adds 0.15‰ to the capital sum insured',
    fn: () => {
      const res = calculateGpaPremium({ sum_insured_per_life: 1000000, headcount: 10, hazard_class: 1, ttd_opted: true, medical_extension_opted: false });
      // TTD = 10M * 0.00015 = 1500; Total = 3500 + 1500 = 5000
      assertEquals(res.ttd_premium, 1500);
      assertEquals(res.total_gpa_premium, 5000);
    },
  },
  {
    id: 'T1-F16-05',
    featureId: 16,
    featureName: 'Group Personal Accident (GPA) Engine',
    tier: 1,
    description: 'Medical extension adds 10% to the base GPA premium',
    fn: () => {
      const res = calculateGpaPremium({ sum_insured_per_life: 1000000, headcount: 10, hazard_class: 1, ttd_opted: false, medical_extension_opted: true });
      assertEquals(res.medical_premium, 350); // 10% of 3500
      assertEquals(res.total_gpa_premium, 3850);
    },
  },

  // ==========================================================================
  // FEATURE 17: Statutory Workmen's Compensation (WC) Engine (5 Tests)
  // ==========================================================================
  {
    id: 'T1-F17-01',
    featureId: 17,
    featureName: "Statutory Workmen's Compensation (WC) Engine",
    tier: 1,
    description: 'Monthly wage above ₹15,000 is capped at ₹15,000 for statutory liability',
    fn: () => {
      const res = calculateWorkmensCompensation({
        workers: [{ age: 25, monthly_wage: 30000 }],
        trade_hazard_rate_percent: 0.45,
        medical_extension_opted: false,
      });
      // 50% * 15000 * 216.91 = 16,26,825
      assertEquals(res.statutory_death_liability, 1626825);
    },
  },
  {
    id: 'T1-F17-02',
    featureId: 17,
    featureName: "Statutory Workmen's Compensation (WC) Engine",
    tier: 1,
    description: 'Age 25 worker Schedule IV factor is 216.91, giving death compensation of ₹16,26,825',
    fn: () => {
      const res = calculateWorkmensCompensation({
        workers: [{ age: 25, monthly_wage: 15000 }],
        trade_hazard_rate_percent: 0.45,
        medical_extension_opted: false,
      });
      assertEquals(res.statutory_death_liability, 1626825);
    },
  },
  {
    id: 'T1-F17-03',
    featureId: 17,
    featureName: "Statutory Workmen's Compensation (WC) Engine",
    tier: 1,
    description: 'Age 25 worker statutory PTD compensation is 60% * 15000 * 216.91 = ₹19,52,190',
    fn: () => {
      const res = calculateWorkmensCompensation({
        workers: [{ age: 25, monthly_wage: 15000 }],
        trade_hazard_rate_percent: 0.45,
        medical_extension_opted: false,
      });
      assertEquals(res.statutory_ptd_liability, 1952190);
    },
  },
  {
    id: 'T1-F17-04',
    featureId: 17,
    featureName: "Statutory Workmen's Compensation (WC) Engine",
    tier: 1,
    description: 'Enforces statutory minimum death compensation of ₹1,20,000',
    fn: () => {
      // Very low wage: ₹500/mo, age 55 factor 135.56 -> 0.5 * 500 * 135.56 = 33890 (< 120000)
      const res = calculateWorkmensCompensation({
        workers: [{ age: 55, monthly_wage: 500 }],
        trade_hazard_rate_percent: 0.45,
        medical_extension_opted: false,
      });
      assertEquals(res.statutory_death_liability, 120000);
    },
  },
  {
    id: 'T1-F17-05',
    featureId: 17,
    featureName: "Statutory Workmen's Compensation (WC) Engine",
    tier: 1,
    description: 'Computes WC premium on annual wage roll with 25% medical extension loading',
    fn: () => {
      const res = calculateWorkmensCompensation({
        workers: [{ age: 30, monthly_wage: 20000 }],
        trade_hazard_rate_percent: 1.00,
        medical_extension_opted: true,
      });
      // Wage roll = 240,000; Base = 2,400; with 25% loading = 3,000
      assertEquals(res.net_wc_premium, 3000);
    },
  },

  // ==========================================================================
  // FEATURE 18: Bulk Employee Census Spreadsheet Ingestion (5 Tests)
  // ==========================================================================
  {
    id: 'T1-F18-01',
    featureId: 18,
    featureName: 'Bulk Employee Census Spreadsheet Ingestion',
    tier: 1,
    description: 'Categorizes employees and dependents into correct demographic age bands',
    fn: () => {
      const rows: CensusRow[] = [
        { employee_id: 'E1', name: 'John', age: 24, gender: 'M', relationship: 'self' },
        { employee_id: 'E2', name: 'Sarah', age: 32, gender: 'F', relationship: 'self' },
        { employee_id: 'E3', name: 'Amit', age: 48, gender: 'M', relationship: 'self' },
      ];
      const res = parseEmployeeCensusRoster(rows);
      assertEquals(res.age_bands.age_0_25, 1);
      assertEquals(res.age_bands.age_26_35, 1);
      assertEquals(res.age_bands.age_46_55, 1);
    },
  },
  {
    id: 'T1-F18-02',
    featureId: 18,
    featureName: 'Bulk Employee Census Spreadsheet Ingestion',
    tier: 1,
    description: 'Separates employees (self) from dependents (spouse, child, parent)',
    fn: () => {
      const rows: CensusRow[] = [
        { employee_id: 'E1', name: 'John', age: 30, gender: 'M', relationship: 'self' },
        { employee_id: 'E1-S', name: 'Mary', age: 28, gender: 'F', relationship: 'spouse' },
        { employee_id: 'E1-C', name: 'Leo', age: 4, gender: 'M', relationship: 'child' },
      ];
      const res = parseEmployeeCensusRoster(rows);
      assertEquals(res.employee_count, 1);
      assertEquals(res.dependent_count, 2);
      assertEquals(res.total_lives, 3);
    },
  },
  {
    id: 'T1-F18-03',
    featureId: 18,
    featureName: 'Bulk Employee Census Spreadsheet Ingestion',
    tier: 1,
    description: 'Aggregates total monthly wage roll for workers',
    fn: () => {
      const rows: CensusRow[] = [
        { employee_id: 'E1', name: 'John', age: 30, gender: 'M', relationship: 'self', monthly_salary: 50000 },
        { employee_id: 'E2', name: 'Jane', age: 35, gender: 'F', relationship: 'self', monthly_salary: 60000 },
      ];
      const res = parseEmployeeCensusRoster(rows);
      assertEquals(res.total_monthly_wage_roll, 110000);
    },
  },
  {
    id: 'T1-F18-04',
    featureId: 18,
    featureName: 'Bulk Employee Census Spreadsheet Ingestion',
    tier: 1,
    description: 'Identifies invalid age rows (<0 or >100) and reports errors',
    fn: () => {
      const rows: CensusRow[] = [
        { employee_id: 'E1', name: 'Invalid Age', age: -5, gender: 'M', relationship: 'self' },
        { employee_id: 'E2', name: 'Centenarian', age: 105, gender: 'M', relationship: 'parent' },
        { employee_id: 'E3', name: 'Valid', age: 30, gender: 'M', relationship: 'self' },
      ];
      const res = parseEmployeeCensusRoster(rows);
      assertEquals(res.invalid_rows.length, 2);
      assertEquals(res.total_lives, 1);
    },
  },
  {
    id: 'T1-F18-05',
    featureId: 18,
    featureName: 'Bulk Employee Census Spreadsheet Ingestion',
    tier: 1,
    description: 'Returns accurate total lives count',
    fn: () => {
      const rows: CensusRow[] = [
        { employee_id: 'E1', name: 'A', age: 25, gender: 'M', relationship: 'self' },
        { employee_id: 'E2', name: 'B', age: 26, gender: 'F', relationship: 'self' },
        { employee_id: 'E3', name: 'C', age: 27, gender: 'M', relationship: 'self' },
      ];
      const res = parseEmployeeCensusRoster(rows);
      assertEquals(res.total_lives, 3);
    },
  },

  // ==========================================================================
  // FEATURE 19: Employee Benefits Studio UI Model (5 Tests)
  // ==========================================================================
  {
    id: 'T1-F19-01',
    featureId: 19,
    featureName: 'Employee Benefits Studio UI Model',
    tier: 1,
    description: 'Computes synchronized GHI, GTLI, GPA, and WC ledger',
    fn: () => {
      const res = computeBenefitsStudioLedger({
        corporate_name: 'Wipro Technologies',
        census: [
          { employee_id: 'E1', name: 'A', age: 28, gender: 'M', relationship: 'self', monthly_salary: 40000 },
          { employee_id: 'E2', name: 'B', age: 34, gender: 'F', relationship: 'self', monthly_salary: 50000 },
        ],
        ghi_base_si: 300000,
        room_rent: 'standard_1_percent',
        maternity_opted: true,
        gtli_sum_insured: 1500000,
        gpa_hazard_class: 1,
      });
      assert(res.ghi_premium > 0, 'GHI should be > 0');
      assert(res.gtli_premium > 0, 'GTLI should be > 0');
      assert(res.gpa_premium > 0, 'GPA should be > 0');
      assert(res.wc_premium > 0, 'WC should be > 0');
    },
  },
  {
    id: 'T1-F19-02',
    featureId: 19,
    featureName: 'Employee Benefits Studio UI Model',
    tier: 1,
    description: 'Reconciles package net premium from individual lines',
    fn: () => {
      const res = computeBenefitsStudioLedger({
        corporate_name: 'Wipro Technologies',
        census: [{ employee_id: 'E1', name: 'A', age: 28, gender: 'M', relationship: 'self', monthly_salary: 40000 }],
        ghi_base_si: 300000,
        room_rent: 'standard_1_percent',
        maternity_opted: false,
      });
      const expectedNet = res.ghi_premium + res.gtli_premium + res.gpa_premium + res.wc_premium;
      assertEquals(res.package_net_premium, expectedNet);
    },
  },
  {
    id: 'T1-F19-03',
    featureId: 19,
    featureName: 'Employee Benefits Studio UI Model',
    tier: 1,
    description: 'Computes 18% GST on package net premium',
    fn: () => {
      const res = computeBenefitsStudioLedger({
        corporate_name: 'Wipro Technologies',
        census: [{ employee_id: 'E1', name: 'A', age: 28, gender: 'M', relationship: 'self', monthly_salary: 40000 }],
        ghi_base_si: 300000,
        room_rent: 'standard_1_percent',
        maternity_opted: false,
      });
      assertEquals(res.package_gst, Math.round(res.package_net_premium * 0.18));
    },
  },
  {
    id: 'T1-F19-04',
    featureId: 19,
    featureName: 'Employee Benefits Studio UI Model',
    tier: 1,
    description: 'Computes total package payable',
    fn: () => {
      const res = computeBenefitsStudioLedger({
        corporate_name: 'Wipro Technologies',
        census: [{ employee_id: 'E1', name: 'A', age: 28, gender: 'M', relationship: 'self', monthly_salary: 40000 }],
        ghi_base_si: 300000,
        room_rent: 'standard_1_percent',
        maternity_opted: false,
      });
      assertEquals(res.total_payable, res.package_net_premium + res.package_gst);
    },
  },
  {
    id: 'T1-F19-05',
    featureId: 19,
    featureName: 'Employee Benefits Studio UI Model',
    tier: 1,
    description: 'Verifies support for multi-tier benefits structure',
    fn: () => {
      const res = computeBenefitsStudioLedger({
        corporate_name: 'Wipro Technologies',
        census: [
          { employee_id: 'E1', name: 'CXO', age: 45, gender: 'M', relationship: 'self', monthly_salary: 200000 },
          { employee_id: 'E2', name: 'Junior', age: 23, gender: 'F', relationship: 'self', monthly_salary: 25000 },
        ],
        ghi_base_si: 500000,
        room_rent: 'single_private_room',
        maternity_opted: true,
      });
      assert(res.total_payable > 0, 'Total payable should be > 0');
    },
  },

  // ==========================================================================
  // FEATURE 20: CAR / EAR Project Lifecycle Engine (5 Tests)
  // ==========================================================================
  {
    id: 'T1-F20-01',
    featureId: 20,
    featureName: 'CAR / EAR Project Lifecycle Engine',
    tier: 1,
    description: 'CAR project rates civil works at 1.20‰',
    fn: () => {
      const res = calculateCarEarPremium({
        project_type: 'car',
        civil_works_value: 100000000, // 10 Cr
        plant_machinery_value: 0,
        contract_period_months: 12,
        eq_zone: 4, // 0.10‰
      });
      // Civil: 100M * 0.0012 = 120,000; Perils: 100M * 0.00010 = 10,000
      assertEquals(res.base_works_premium, 120000);
      assertEquals(res.net_project_premium, 130000);
    },
  },
  {
    id: 'T1-F20-02',
    featureId: 20,
    featureName: 'CAR / EAR Project Lifecycle Engine',
    tier: 1,
    description: 'EAR project rates plant erection at 1.80‰',
    fn: () => {
      const res = calculateCarEarPremium({
        project_type: 'ear',
        civil_works_value: 0,
        plant_machinery_value: 100000000,
        contract_period_months: 12,
        eq_zone: 4,
      });
      // Plant: 100M * 0.0018 = 180,000
      assertEquals(res.base_works_premium, 180000);
    },
  },
  {
    id: 'T1-F20-03',
    featureId: 20,
    featureName: 'CAR / EAR Project Lifecycle Engine',
    tier: 1,
    description: 'Pro-rata duration scaling for projects longer than 12 months',
    fn: () => {
      const res12 = calculateCarEarPremium({ project_type: 'car', civil_works_value: 100000000, plant_machinery_value: 0, contract_period_months: 12, eq_zone: 4 });
      const res24 = calculateCarEarPremium({ project_type: 'car', civil_works_value: 100000000, plant_machinery_value: 0, contract_period_months: 24, eq_zone: 4 });
      assertEquals(res24.base_works_premium, res12.base_works_premium * 2);
    },
  },
  {
    id: 'T1-F20-04',
    featureId: 20,
    featureName: 'CAR / EAR Project Lifecycle Engine',
    tier: 1,
    description: 'EAR testing period beyond 1 month is loaded at 0.75‰ per month on plant SI',
    fn: () => {
      const res = calculateCarEarPremium({
        project_type: 'ear',
        civil_works_value: 0,
        plant_machinery_value: 100000000,
        contract_period_months: 12,
        testing_period_months: 4, // 3 extra months
        eq_zone: 4,
      });
      // Testing: 100M * (3 * 0.00075) = 225,000
      assertEquals(res.testing_premium, 225000);
    },
  },
  {
    id: 'T1-F20-05',
    featureId: 20,
    featureName: 'CAR / EAR Project Lifecycle Engine',
    tier: 1,
    description: '12-month DLP maintenance adds 15% and 24-month DLP adds 25% to base works',
    fn: () => {
      const res12 = calculateCarEarPremium({ project_type: 'car', civil_works_value: 100000000, plant_machinery_value: 0, contract_period_months: 12, dlp_maintenance_months: 12, eq_zone: 4 });
      const res24 = calculateCarEarPremium({ project_type: 'car', civil_works_value: 100000000, plant_machinery_value: 0, contract_period_months: 12, dlp_maintenance_months: 24, eq_zone: 4 });
      assertEquals(res12.maintenance_premium, 18000); // 15% of 120,000
      assertEquals(res24.maintenance_premium, 30000); // 25% of 120,000
    },
  },

  // ==========================================================================
  // FEATURE 21: Machinery Breakdown (MB) Engine (5 Tests)
  // ==========================================================================
  {
    id: 'T1-F21-01',
    featureId: 21,
    featureName: 'Machinery Breakdown (MB) Engine',
    tier: 1,
    description: 'Group I machinery (motors up to 100 kW) rates at 0.90% of CRV',
    fn: () => {
      const res = calculateMachineryBreakdown([{ machine_id: 'M1', tariff_group: 1, current_replacement_value: 1000000 }]);
      assertEquals(res.net_mb_premium, 9000);
    },
  },
  {
    id: 'T1-F21-02',
    featureId: 21,
    featureName: 'Machinery Breakdown (MB) Engine',
    tier: 1,
    description: 'Group II machinery (compressors/transformers) rates at 1.50% of CRV',
    fn: () => {
      const res = calculateMachineryBreakdown([{ machine_id: 'M2', tariff_group: 2, current_replacement_value: 1000000 }]);
      assertEquals(res.net_mb_premium, 15000);
    },
  },
  {
    id: 'T1-F21-03',
    featureId: 21,
    featureName: 'Machinery Breakdown (MB) Engine',
    tier: 1,
    description: 'Group III machinery (turbines/generators) rates at 2.50% of CRV',
    fn: () => {
      const res = calculateMachineryBreakdown([{ machine_id: 'M3', tariff_group: 3, current_replacement_value: 1000000 }]);
      assertEquals(res.net_mb_premium, 25000);
    },
  },
  {
    id: 'T1-F21-04',
    featureId: 21,
    featureName: 'Machinery Breakdown (MB) Engine',
    tier: 1,
    description: 'Group IV machinery (printing/plastic injection) rates at 4.00% of CRV',
    fn: () => {
      const res = calculateMachineryBreakdown([{ machine_id: 'M4', tariff_group: 4, current_replacement_value: 1000000 }]);
      assertEquals(res.net_mb_premium, 40000);
    },
  },
  {
    id: 'T1-F21-05',
    featureId: 21,
    featureName: 'Machinery Breakdown (MB) Engine',
    tier: 1,
    description: 'Multi-machine schedule aggregates total CRV and total premium accurately',
    fn: () => {
      const machines: MbMachineItem[] = [
        { machine_id: 'M1', tariff_group: 1, current_replacement_value: 1000000 },
        { machine_id: 'M2', tariff_group: 2, current_replacement_value: 2000000 },
      ];
      const res = calculateMachineryBreakdown(machines);
      assertEquals(res.total_machines, 2);
      assertEquals(res.total_crv, 3000000);
      assertEquals(res.net_mb_premium, 9000 + 30000);
    },
  },

  // ==========================================================================
  // FEATURE 22: Electronic Equipment Insurance (EEI) Engine (5 Tests)
  // ==========================================================================
  {
    id: 'T1-F22-01',
    featureId: 22,
    featureName: 'Electronic Equipment Insurance (EEI) Engine',
    tier: 1,
    description: 'Section 1 hardware equipment rates at 1.25% of CRV',
    fn: () => {
      const res = calculateEeiPremium({ section1_hardware_crv: 1000000 });
      assertEquals(res.section1_premium, 12500);
      assertEquals(res.total_eei_premium, 12500);
    },
  },
  {
    id: 'T1-F22-02',
    featureId: 22,
    featureName: 'Electronic Equipment Insurance (EEI) Engine',
    tier: 1,
    description: 'Section 2 external data media rates at 3.00% of sum insured',
    fn: () => {
      const res = calculateEeiPremium({ section1_hardware_crv: 1000000, section2_data_media_si: 200000 });
      assertEquals(res.section2_premium, 6000);
    },
  },
  {
    id: 'T1-F22-03',
    featureId: 22,
    featureName: 'Electronic Equipment Insurance (EEI) Engine',
    tier: 1,
    description: 'Section 3 ICOW rates at 1.50% for 3 months indemnity',
    fn: () => {
      const res = calculateEeiPremium({ section1_hardware_crv: 1000000, section3_icow_months: 3, section3_icow_si: 500000 });
      assertEquals(res.section3_premium, 7500);
    },
  },
  {
    id: 'T1-F22-04',
    featureId: 22,
    featureName: 'Electronic Equipment Insurance (EEI) Engine',
    tier: 1,
    description: 'Section 3 ICOW rates at 4.00% for 12 months indemnity',
    fn: () => {
      const res = calculateEeiPremium({ section1_hardware_crv: 1000000, section3_icow_months: 12, section3_icow_si: 500000 });
      assertEquals(res.section3_premium, 20000);
    },
  },
  {
    id: 'T1-F22-05',
    featureId: 22,
    featureName: 'Electronic Equipment Insurance (EEI) Engine',
    tier: 1,
    description: 'Portable laptop loading adds 2.50% for worldwide transit risk',
    fn: () => {
      const res = calculateEeiPremium({ section1_hardware_crv: 100000, is_portable_laptop: true });
      // 100,000 * (1.25% + 2.50%) = 100,000 * 3.75% = 3750
      assertEquals(res.section1_premium, 3750);
    },
  },

  // ==========================================================================
  // FEATURE 23: Boiler & Pressure Plant (BPP) Engine (5 Tests)
  // ==========================================================================
  {
    id: 'T1-F23-01',
    featureId: 23,
    featureName: 'Boiler & Pressure Plant (BPP) Engine',
    tier: 1,
    description: 'Fire tube boiler rates at 0.75% base',
    fn: () => {
      const res = calculateBppPremium({ vessel_type: 'fire_tube', heating_surface_sqm: 50, operating_pressure_bar: 10, replacement_value: 2000000 });
      assertEquals(res.base_bpp_premium, 15000);
    },
  },
  {
    id: 'T1-F23-02',
    featureId: 23,
    featureName: 'Boiler & Pressure Plant (BPP) Engine',
    tier: 1,
    description: 'Water tube boiler rates at 1.00% base',
    fn: () => {
      const res = calculateBppPremium({ vessel_type: 'water_tube', heating_surface_sqm: 100, operating_pressure_bar: 15, replacement_value: 5000000 });
      assertEquals(res.base_bpp_premium, 50000);
    },
  },
  {
    id: 'T1-F23-03',
    featureId: 23,
    featureName: 'Boiler & Pressure Plant (BPP) Engine',
    tier: 1,
    description: 'Operating pressure exceeding 20 bar adds +20% high-pressure surcharge',
    fn: () => {
      const res = calculateBppPremium({ vessel_type: 'water_tube', heating_surface_sqm: 100, operating_pressure_bar: 25, replacement_value: 5000000 });
      assertEquals(res.high_pressure_surcharge, 10000); // 20% of 50000
      assertEquals(res.total_bpp_premium, 60000);
    },
  },
  {
    id: 'T1-F23-04',
    featureId: 23,
    featureName: 'Boiler & Pressure Plant (BPP) Engine',
    tier: 1,
    description: 'Third party liability (TPL) extension rates at 0.50% of limit',
    fn: () => {
      const res = calculateBppPremium({ vessel_type: 'fire_tube', heating_surface_sqm: 50, operating_pressure_bar: 10, replacement_value: 2000000, tpl_limit: 1000000 });
      assertEquals(res.tpl_premium, 5000);
    },
  },
  {
    id: 'T1-F23-05',
    featureId: 23,
    featureName: 'Boiler & Pressure Plant (BPP) Engine',
    tier: 1,
    description: 'Rejects boiler valuation less than or equal to zero',
    fn: () => {
      assertThrows(() => {
        calculateBppPremium({ vessel_type: 'fire_tube', heating_surface_sqm: 50, operating_pressure_bar: 10, replacement_value: 0 });
      });
    },
  },

  // ==========================================================================
  // FEATURE 24: Fixed Asset Register (FAR) Tabular Parser (5 Tests)
  // ==========================================================================
  {
    id: 'T1-F24-01',
    featureId: 24,
    featureName: 'Fixed Asset Register (FAR) Tabular Parser',
    tier: 1,
    description: 'Categorizes assets into Building, Plant & Machinery, Furniture, and Stocks',
    fn: () => {
      const items: FarItem[] = [
        { asset_code: 'BLD-1', category: 'building', book_value: 800000, current_replacement_value: 1000000 },
        { asset_code: 'MCH-1', category: 'plant_machinery', book_value: 1500000, current_replacement_value: 2500000 },
        { asset_code: 'FUR-1', category: 'furniture_fixtures', book_value: 200000, current_replacement_value: 300000 },
        { asset_code: 'STK-1', category: 'stocks', book_value: 500000, current_replacement_value: 500000 },
      ];
      const res = parseFixedAssetRegister(items);
      assertEquals(res.building_crv, 1000000);
      assertEquals(res.plant_machinery_crv, 2500000);
      assertEquals(res.furniture_crv, 300000);
      assertEquals(res.stocks_crv, 500000);
    },
  },
  {
    id: 'T1-F24-02',
    featureId: 24,
    featureName: 'Fixed Asset Register (FAR) Tabular Parser',
    tier: 1,
    description: 'Aggregates total replacement value (CRV) accurately',
    fn: () => {
      const items: FarItem[] = [
        { asset_code: 'BLD-1', category: 'building', book_value: 800000, current_replacement_value: 1000000 },
        { asset_code: 'MCH-1', category: 'plant_machinery', book_value: 1500000, current_replacement_value: 2500000 },
      ];
      const res = parseFixedAssetRegister(items);
      assertEquals(res.total_crv, 3500000);
    },
  },
  {
    id: 'T1-F24-03',
    featureId: 24,
    featureName: 'Fixed Asset Register (FAR) Tabular Parser',
    tier: 1,
    description: 'Detects underinsurance ratio when book value is significantly lower than CRV',
    fn: () => {
      const items: FarItem[] = [
        { asset_code: 'MCH-1', category: 'plant_machinery', book_value: 1000000, current_replacement_value: 2000000 },
      ];
      const res = parseFixedAssetRegister(items);
      assertEquals(res.underinsurance_ratio, 0.5);
    },
  },
  {
    id: 'T1-F24-04',
    featureId: 24,
    featureName: 'Fixed Asset Register (FAR) Tabular Parser',
    tier: 1,
    description: 'Correctly handles empty asset categories without errors',
    fn: () => {
      const items: FarItem[] = [
        { asset_code: 'BLD-1', category: 'building', book_value: 1000000, current_replacement_value: 1000000 },
      ];
      const res = parseFixedAssetRegister(items);
      assertEquals(res.plant_machinery_crv, 0);
      assertEquals(res.furniture_crv, 0);
      assertEquals(res.stocks_crv, 0);
    },
  },
  {
    id: 'T1-F24-05',
    featureId: 24,
    featureName: 'Fixed Asset Register (FAR) Tabular Parser',
    tier: 1,
    description: 'Verifies consistency between itemized CRVs and category totals',
    fn: () => {
      const items: FarItem[] = [
        { asset_code: 'A1', category: 'building', book_value: 100, current_replacement_value: 200 },
        { asset_code: 'A2', category: 'building', book_value: 300, current_replacement_value: 400 },
      ];
      const res = parseFixedAssetRegister(items);
      assertEquals(res.building_crv, 600);
    },
  },

  // ==========================================================================
  // FEATURE 25: Engineering Studio UI Model (5 Tests)
  // ==========================================================================
  {
    id: 'T1-F25-01',
    featureId: 25,
    featureName: 'Engineering Studio UI Model',
    tier: 1,
    description: 'Validates required project and contractor names',
    fn: () => {
      const res = validateEngineeringStudioInput({
        project_name: 'Metro Rail Phase 2',
        contractor_name: 'L&T Construction',
        project_type: 'car',
        civil_si: 500000000,
        plant_si: 100000000,
        duration_months: 24,
      });
      assert(res.is_valid, 'Expected valid engineering input');
    },
  },
  {
    id: 'T1-F25-02',
    featureId: 25,
    featureName: 'Engineering Studio UI Model',
    tier: 1,
    description: 'Validates positive project works sum insured',
    fn: () => {
      const res = validateEngineeringStudioInput({
        project_name: 'Metro Rail Phase 2',
        contractor_name: 'L&T Construction',
        project_type: 'car',
        civil_si: 0,
        plant_si: 0,
        duration_months: 24,
      });
      assertEquals(res.is_valid, false);
    },
  },
  {
    id: 'T1-F25-03',
    featureId: 25,
    featureName: 'Engineering Studio UI Model',
    tier: 1,
    description: 'Validates contract duration of at least 1 month',
    fn: () => {
      const res = validateEngineeringStudioInput({
        project_name: 'Metro Rail Phase 2',
        contractor_name: 'L&T Construction',
        project_type: 'car',
        civil_si: 1000000,
        plant_si: 0,
        duration_months: 0,
      });
      assertEquals(res.is_valid, false);
    },
  },
  {
    id: 'T1-F25-04',
    featureId: 25,
    featureName: 'Engineering Studio UI Model',
    tier: 1,
    description: 'Generates clean project summary string formatted in Crores (Cr)',
    fn: () => {
      const res = validateEngineeringStudioInput({
        project_name: 'Metro Rail Phase 2',
        contractor_name: 'L&T Construction',
        project_type: 'car',
        civil_si: 500000000,
        plant_si: 100000000,
        duration_months: 24,
      });
      assert(res.project_summary?.includes('60.00 Cr') ?? false, 'Should show 60 Cr');
    },
  },
  {
    id: 'T1-F25-05',
    featureId: 25,
    featureName: 'Engineering Studio UI Model',
    tier: 1,
    description: 'Distinguishes between CAR civil and EAR erection workflows',
    fn: () => {
      const resCar = validateEngineeringStudioInput({ project_name: 'Dam Construction', contractor_name: 'HCC', project_type: 'car', civil_si: 1000000, plant_si: 0, duration_months: 12 });
      const resEar = validateEngineeringStudioInput({ project_name: 'Turbine Erection', contractor_name: 'BHEL', project_type: 'ear', civil_si: 0, plant_si: 1000000, duration_months: 12 });
      assert(resCar.project_summary?.includes('CAR') ?? false, 'CAR tag expected');
      assert(resEar.project_summary?.includes('EAR') ?? false, 'EAR tag expected');
    },
  },

  // ==========================================================================
  // FEATURE 26: CGL Turnover & AOA:AOY Limit Ratio Engine (5 Tests)
  // ==========================================================================
  {
    id: 'T1-F26-01',
    featureId: 26,
    featureName: 'CGL Turnover & AOA:AOY Limit Ratio Engine',
    tier: 1,
    description: 'Category 1 (IT/Consulting) rates at 0.30‰ on annual turnover',
    fn: () => {
      const res = calculateCglPremium({
        annual_turnover: 1000000000, // 100 Cr
        aoa_limit: 50000000,
        aoy_limit: 50000000,
        ratio: '1:1',
        hazard_category: 1,
        territory: 'india_only',
      });
      assertEquals(res.base_turnover_rate_per_mille, 0.30);
      assertEquals(res.net_cgl_premium, 300000); // 1,000,000,000 * 0.00030 = 300,000
    },
  },
  {
    id: 'T1-F26-02',
    featureId: 26,
    featureName: 'CGL Turnover & AOA:AOY Limit Ratio Engine',
    tier: 1,
    description: '1:1 AOA:AOY ratio applies 1.00 multiplier (no discount)',
    fn: () => {
      const res = calculateCglPremium({ annual_turnover: 100000000, aoa_limit: 10000000, aoy_limit: 10000000, ratio: '1:1', hazard_category: 2, territory: 'india_only' });
      assertEquals(res.ratio_discount_percent, 0);
    },
  },
  {
    id: 'T1-F26-03',
    featureId: 26,
    featureName: 'CGL Turnover & AOA:AOY Limit Ratio Engine',
    tier: 1,
    description: '1:2 AOA:AOY ratio applies 0.85 multiplier (15% discount)',
    fn: () => {
      const res = calculateCglPremium({ annual_turnover: 100000000, aoa_limit: 5000000, aoy_limit: 10000000, ratio: '1:2', hazard_category: 2, territory: 'india_only' });
      assertEquals(res.ratio_discount_percent, 15);
      assertEquals(res.net_cgl_premium, Math.round(res.gross_cgl_premium * 0.85));
    },
  },
  {
    id: 'T1-F26-04',
    featureId: 26,
    featureName: 'CGL Turnover & AOA:AOY Limit Ratio Engine',
    tier: 1,
    description: '1:4 AOA:AOY ratio applies 0.72 multiplier (28% discount)',
    fn: () => {
      const res = calculateCglPremium({ annual_turnover: 100000000, aoa_limit: 2500000, aoy_limit: 10000000, ratio: '1:4', hazard_category: 2, territory: 'india_only' });
      assertEquals(res.ratio_discount_percent, 28);
      assertEquals(res.net_cgl_premium, Math.round(res.gross_cgl_premium * 0.72));
    },
  },
  {
    id: 'T1-F26-05',
    featureId: 26,
    featureName: 'CGL Turnover & AOA:AOY Limit Ratio Engine',
    tier: 1,
    description: 'Worldwide including USA/Canada applies 2.50 multiplier (+150% loading)',
    fn: () => {
      const res = calculateCglPremium({ annual_turnover: 100000000, aoa_limit: 10000000, aoy_limit: 10000000, ratio: '1:1', hazard_category: 1, territory: 'worldwide_inc_usa' });
      assertEquals(res.territory_multiplier, 2.50);
      assertEquals(res.net_cgl_premium, Math.round(res.gross_cgl_premium * 2.50));
    },
  },

  // ==========================================================================
  // FEATURE 27: Professional Indemnity (PI / E&O) Engine (5 Tests)
  // ==========================================================================
  {
    id: 'T1-F27-01',
    featureId: 27,
    featureName: 'Professional Indemnity (PI / E&O) Engine',
    tier: 1,
    description: 'Technology & Software E&O rates at 0.85% base on LOI',
    fn: () => {
      const res = calculateProfessionalIndemnity({ annual_fee_income: 50000000, limit_of_indemnity: 10000000, profession: 'tech_software', prior_clean_years: 0 });
      assertEquals(res.base_pi_premium, 85000);
      assertEquals(res.net_pi_premium, 85000);
    },
  },
  {
    id: 'T1-F27-02',
    featureId: 27,
    featureName: 'Professional Indemnity (PI / E&O) Engine',
    tier: 1,
    description: 'Financial Consultants / CAs rate at 1.20% base on LOI',
    fn: () => {
      const res = calculateProfessionalIndemnity({ annual_fee_income: 20000000, limit_of_indemnity: 10000000, profession: 'consultants_ca', prior_clean_years: 0 });
      assertEquals(res.base_pi_premium, 120000);
    },
  },
  {
    id: 'T1-F27-03',
    featureId: 27,
    featureName: 'Professional Indemnity (PI / E&O) Engine',
    tier: 1,
    description: 'Insurance Brokers rate at 1.50% base on LOI',
    fn: () => {
      const res = calculateProfessionalIndemnity({ annual_fee_income: 50000000, limit_of_indemnity: 150000000, profession: 'insurance_broker', prior_clean_years: 0 });
      assertEquals(res.base_pi_premium, 2250000);
    },
  },
  {
    id: 'T1-F27-04',
    featureId: 27,
    featureName: 'Professional Indemnity (PI / E&O) Engine',
    tier: 1,
    description: 'Retroactive cover adds 10% per prior clean year',
    fn: () => {
      const res = calculateProfessionalIndemnity({ annual_fee_income: 10000000, limit_of_indemnity: 5000000, profession: 'tech_software', prior_clean_years: 3 });
      assertEquals(res.retroactive_loading_percent, 30);
      // 5M * 0.0085 = 42500 * 1.30 = 55250
      assertEquals(res.net_pi_premium, 55250);
    },
  },
  {
    id: 'T1-F27-05',
    featureId: 27,
    featureName: 'Professional Indemnity (PI / E&O) Engine',
    tier: 1,
    description: 'Validates statutory minimum limit for insurance brokers (3x brokerage or ₹50L)',
    fn: () => {
      const validBroker = calculateProfessionalIndemnity({ annual_fee_income: 10000000, limit_of_indemnity: 30000000, profession: 'insurance_broker', prior_clean_years: 0 });
      const invalidBroker = calculateProfessionalIndemnity({ annual_fee_income: 10000000, limit_of_indemnity: 10000000, profession: 'insurance_broker', prior_clean_years: 0 });
      assertEquals(validBroker.statutory_minimum_met, true);
      assertEquals(invalidBroker.statutory_minimum_met, false);
    },
  },

  // ==========================================================================
  // FEATURE 28: Directors & Officers (D&O) Engine (5 Tests)
  // ==========================================================================
  {
    id: 'T1-F28-01',
    featureId: 28,
    featureName: 'Directors & Officers (D&O) Engine',
    tier: 1,
    description: 'Private unlisted entity applies 1.0x baseline multiplier across Side A, B, and C',
    fn: () => {
      const res = calculateDirectorsOfficersPremium({ limit_of_indemnity: 100000000, entity_listing_status: 'private_unlisted', debt_to_equity_ratio: 1.0 });
      assertEquals(res.side_a_premium, 400000); // 0.40%
      assertEquals(res.side_b_premium, 350000); // 0.35%
      assertEquals(res.side_c_premium, 500000); // 0.50%
      assertEquals(res.net_do_premium, 1250000);
    },
  },
  {
    id: 'T1-F28-02',
    featureId: 28,
    featureName: 'Directors & Officers (D&O) Engine',
    tier: 1,
    description: 'Public listed entity in India applies 1.8x multiplier',
    fn: () => {
      const res = calculateDirectorsOfficersPremium({ limit_of_indemnity: 100000000, entity_listing_status: 'public_listed_india', debt_to_equity_ratio: 1.0 });
      assertEquals(res.side_a_premium, 720000); // 400k * 1.8
      assertEquals(res.net_do_premium, 2250000); // 1.25M * 1.8
    },
  },
  {
    id: 'T1-F28-03',
    featureId: 28,
    featureName: 'Directors & Officers (D&O) Engine',
    tier: 1,
    description: 'Public listed entity with US ADR applies 3.5x multiplier',
    fn: () => {
      const res = calculateDirectorsOfficersPremium({ limit_of_indemnity: 100000000, entity_listing_status: 'public_listed_us_adr', debt_to_equity_ratio: 1.0 });
      assertEquals(res.side_a_premium, 1400000); // 400k * 3.5
      assertEquals(res.net_do_premium, 4375000); // 1.25M * 3.5
    },
  },
  {
    id: 'T1-F28-04',
    featureId: 28,
    featureName: 'Directors & Officers (D&O) Engine',
    tier: 1,
    description: 'Side A (0.40%), Side B (0.35%), and Side C (0.50%) sum correctly',
    fn: () => {
      const res = calculateDirectorsOfficersPremium({ limit_of_indemnity: 10000000, entity_listing_status: 'private_unlisted', debt_to_equity_ratio: 1.0 });
      const expected = res.side_a_premium + res.side_b_premium + res.side_c_premium;
      assertEquals(res.net_do_premium, expected);
    },
  },
  {
    id: 'T1-F28-05',
    featureId: 28,
    featureName: 'Directors & Officers (D&O) Engine',
    tier: 1,
    description: 'Debt-to-Equity ratio > 3.0 incurs +25% financial distress loading',
    fn: () => {
      const res = calculateDirectorsOfficersPremium({ limit_of_indemnity: 100000000, entity_listing_status: 'private_unlisted', debt_to_equity_ratio: 3.5 });
      assertEquals(res.financial_distress_loading_percent, 25);
      assertEquals(res.net_do_premium, Math.round(1250000 * 1.25));
    },
  },

  // ==========================================================================
  // FEATURE 29: Deterministic Cyber Posture Scoring Matrix (5 Tests)
  // ==========================================================================
  {
    id: 'T1-F29-01',
    featureId: 29,
    featureName: 'Deterministic Cyber Posture Scoring Matrix',
    tier: 1,
    description: 'Full marks on all 6 controls scores exactly 100 points',
    fn: () => {
      const res = evaluateCyberPosture(
        { has_mfa_everywhere: true, has_edr_endpoints: true, has_airgapped_backups: true, has_annual_vapt: true, has_247_soc: true, has_employee_training: true },
        500000
      );
      assertEquals(res.score, 100);
      assertEquals(res.posture_tier, 'mature');
    },
  },
  {
    id: 'T1-F29-02',
    featureId: 29,
    featureName: 'Deterministic Cyber Posture Scoring Matrix',
    tier: 1,
    description: 'Score >= 85 achieves Mature tier with 20% premium discount',
    fn: () => {
      const res = evaluateCyberPosture(
        { has_mfa_everywhere: true, has_edr_endpoints: true, has_airgapped_backups: true, has_annual_vapt: true, has_247_soc: true, has_employee_training: false },
        500000 // Score = 90
      );
      assertEquals(res.score, 90);
      assertEquals(res.rate_adjustment_percent, -20);
      assertEquals(res.final_cyber_premium, 400000);
    },
  },
  {
    id: 'T1-F29-03',
    featureId: 29,
    featureName: 'Deterministic Cyber Posture Scoring Matrix',
    tier: 1,
    description: 'Score 70–84 achieves Adequate tier with par (0%) rate',
    fn: () => {
      const res = evaluateCyberPosture(
        { has_mfa_everywhere: true, has_edr_endpoints: true, has_airgapped_backups: true, has_annual_vapt: true, has_247_soc: false, has_employee_training: false },
        500000 // Score = 80
      );
      assertEquals(res.score, 80);
      assertEquals(res.posture_tier, 'adequate');
      assertEquals(res.rate_adjustment_percent, 0);
      assertEquals(res.final_cyber_premium, 500000);
    },
  },
  {
    id: 'T1-F29-04',
    featureId: 29,
    featureName: 'Deterministic Cyber Posture Scoring Matrix',
    tier: 1,
    description: 'Score 50–69 achieves Deficient tier with +30% loading',
    fn: () => {
      const res = evaluateCyberPosture(
        { has_mfa_everywhere: true, has_edr_endpoints: true, has_airgapped_backups: false, has_annual_vapt: true, has_247_soc: false, has_employee_training: false },
        500000 // Score = 25 + 20 + 15 = 60
      );
      assertEquals(res.score, 60);
      assertEquals(res.posture_tier, 'deficient');
      assertEquals(res.rate_adjustment_percent, 30);
      assertEquals(res.final_cyber_premium, 650000);
    },
  },
  {
    id: 'T1-F29-05',
    featureId: 29,
    featureName: 'Deterministic Cyber Posture Scoring Matrix',
    tier: 1,
    description: 'Missing MFA results in uninsurable tier and blocks quote issuance',
    fn: () => {
      const res = evaluateCyberPosture(
        { has_mfa_everywhere: false, has_edr_endpoints: true, has_airgapped_backups: true, has_annual_vapt: true, has_247_soc: true, has_employee_training: true },
        500000
      );
      assertEquals(res.posture_tier, 'uninsurable');
      assertEquals(res.can_issue_quote, false);
      assert(res.reasons.some(r => r.includes('MFA')), 'Expected MFA reason');
    },
  },

  // ==========================================================================
  // FEATURE 30: Commercial Crime & Fidelity Engine (5 Tests)
  // ==========================================================================
  {
    id: 'T1-F30-01',
    featureId: 30,
    featureName: 'Commercial Crime & Fidelity Engine',
    tier: 1,
    description: 'Rates per-head access at ₹250 per sensitive employee',
    fn: () => {
      const res = calculateCommercialCrimePremium({ employees_with_funds_access: 100, limit_of_liability: 0, has_dual_authorization_above_50k: true });
      assertEquals(res.per_head_premium, 25000);
    },
  },
  {
    id: 'T1-F30-02',
    featureId: 30,
    featureName: 'Commercial Crime & Fidelity Engine',
    tier: 1,
    description: 'Rates limit of liability at 0.50% of indemnity limit',
    fn: () => {
      const res = calculateCommercialCrimePremium({ employees_with_funds_access: 0, limit_of_liability: 10000000, has_dual_authorization_above_50k: true });
      assertEquals(res.limit_premium, 50000);
    },
  },
  {
    id: 'T1-F30-03',
    featureId: 30,
    featureName: 'Commercial Crime & Fidelity Engine',
    tier: 1,
    description: 'Dual authorization on transactions > ₹50k applies 15% discount',
    fn: () => {
      const res = calculateCommercialCrimePremium({ employees_with_funds_access: 100, limit_of_liability: 10000000, has_dual_authorization_above_50k: true });
      // subtotal = 25000 + 50000 = 75000; disc = 15% of 75000 = 11250
      assertEquals(res.internal_controls_discount_or_loading, -11250);
      assertEquals(res.net_crime_premium, 63750);
    },
  },
  {
    id: 'T1-F30-04',
    featureId: 30,
    featureName: 'Commercial Crime & Fidelity Engine',
    tier: 1,
    description: 'Absence of dual authorization applies +25% loading',
    fn: () => {
      const res = calculateCommercialCrimePremium({ employees_with_funds_access: 100, limit_of_liability: 10000000, has_dual_authorization_above_50k: false });
      // 75000 * 1.25 = 93750
      assertEquals(res.internal_controls_discount_or_loading, 18750);
      assertEquals(res.net_crime_premium, 93750);
    },
  },
  {
    id: 'T1-F30-05',
    featureId: 30,
    featureName: 'Commercial Crime & Fidelity Engine',
    tier: 1,
    description: 'Reconciles total crime premium with applied control adjustment',
    fn: () => {
      const res = calculateCommercialCrimePremium({ employees_with_funds_access: 50, limit_of_liability: 5000000, has_dual_authorization_above_50k: true });
      const expected = res.per_head_premium + res.limit_premium + res.internal_controls_discount_or_loading;
      assertEquals(res.net_crime_premium, expected);
    },
  },

  // ==========================================================================
  // FEATURE 31: Corporate Liability Studio UI Model (5 Tests)
  // ==========================================================================
  {
    id: 'T1-F31-01',
    featureId: 31,
    featureName: 'Corporate Liability Studio UI Model',
    tier: 1,
    description: 'Validates corporate name and positive turnover',
    fn: () => {
      const res = validateLiabilityStudioPackage({ corporate_name: 'Postman India', turnover: 500000000, opt_cgl: true, opt_cyber: true, opt_do: false, opt_crime: false });
      assert(res.is_valid, 'Expected valid liability package');
    },
  },
  {
    id: 'T1-F31-02',
    featureId: 31,
    featureName: 'Corporate Liability Studio UI Model',
    tier: 1,
    description: 'Validates selection of at least one liability line',
    fn: () => {
      const res = validateLiabilityStudioPackage({ corporate_name: 'Postman India', turnover: 500000000, opt_cgl: false, opt_cyber: false, opt_do: false, opt_crime: false });
      assertEquals(res.is_valid, false);
      assert(res.error?.includes('at least one') ?? false, 'Should flag no lines selected');
    },
  },
  {
    id: 'T1-F31-03',
    featureId: 31,
    featureName: 'Corporate Liability Studio UI Model',
    tier: 1,
    description: 'Reports correct count of selected liability lines',
    fn: () => {
      const res = validateLiabilityStudioPackage({ corporate_name: 'Postman India', turnover: 500000000, opt_cgl: true, opt_cyber: true, opt_do: true, opt_crime: true });
      assertEquals(res.lines_selected_count, 4);
    },
  },
  {
    id: 'T1-F31-04',
    featureId: 31,
    featureName: 'Corporate Liability Studio UI Model',
    tier: 1,
    description: 'Confirms package validity when multiple lines are selected',
    fn: () => {
      const res = validateLiabilityStudioPackage({ corporate_name: 'Swiggy', turnover: 1000000000, opt_cgl: true, opt_cyber: true, opt_do: false, opt_crime: false });
      assertEquals(res.is_valid, true);
    },
  },
  {
    id: 'T1-F31-05',
    featureId: 31,
    featureName: 'Corporate Liability Studio UI Model',
    tier: 1,
    description: 'Flags validation error if corporate turnover is non-positive',
    fn: () => {
      const res = validateLiabilityStudioPackage({ corporate_name: 'Swiggy', turnover: 0, opt_cgl: true, opt_cyber: false, opt_do: false, opt_crime: false });
      assertEquals(res.is_valid, false);
    },
  },

  // ==========================================================================
  // FEATURE 32: Surety Insurance Bond Engine (5 Tests)
  // ==========================================================================
  {
    id: 'T1-F32-01',
    featureId: 32,
    featureName: 'Surety Insurance Bond Engine',
    tier: 1,
    description: 'Bid bond base rate is 1.00% p.a.',
    fn: () => {
      const res = calculateSuretyBondPremium({ bond_type: 'bid_bond', bond_value: 10000000, tenure_months: 12, contractor_grade: 'AA', contractor_net_worth: 50000000 });
      assertEquals(res.annual_rate_percent, 1.00);
      assertEquals(res.total_bond_premium, 100000);
    },
  },
  {
    id: 'T1-F32-02',
    featureId: 32,
    featureName: 'Surety Insurance Bond Engine',
    tier: 1,
    description: 'Performance bond base rate is 1.50% p.a.',
    fn: () => {
      const res = calculateSuretyBondPremium({ bond_type: 'performance_bond', bond_value: 10000000, tenure_months: 12, contractor_grade: 'AA', contractor_net_worth: 50000000 });
      assertEquals(res.annual_rate_percent, 1.50);
      assertEquals(res.total_bond_premium, 150000);
    },
  },
  {
    id: 'T1-F32-03',
    featureId: 32,
    featureName: 'Surety Insurance Bond Engine',
    tier: 1,
    description: 'Grade AAA contractor gets 0.80x multiplier with 0% liquid collateral',
    fn: () => {
      const res = calculateSuretyBondPremium({ bond_type: 'performance_bond', bond_value: 10000000, tenure_months: 12, contractor_grade: 'AAA', contractor_net_worth: 50000000 });
      assertEquals(res.annual_rate_percent, 1.20); // 1.5 * 0.8
      assertEquals(res.required_collateral_margin_percent, 0);
    },
  },
  {
    id: 'T1-F32-04',
    featureId: 32,
    featureName: 'Surety Insurance Bond Engine',
    tier: 1,
    description: 'Grade BB contractor gets 2.20x multiplier with 25% liquid collateral',
    fn: () => {
      const res = calculateSuretyBondPremium({ bond_type: 'performance_bond', bond_value: 10000000, tenure_months: 12, contractor_grade: 'BB', contractor_net_worth: 50000000 });
      assertEquals(res.annual_rate_percent, 3.30); // 1.5 * 2.2
      assertEquals(res.required_collateral_margin_percent, 25);
    },
  },
  {
    id: 'T1-F32-05',
    featureId: 32,
    featureName: 'Surety Insurance Bond Engine',
    tier: 1,
    description: 'Pro-rata tenure factor scales accurately for multi-month contracts',
    fn: () => {
      const res6M = calculateSuretyBondPremium({ bond_type: 'bid_bond', bond_value: 10000000, tenure_months: 6, contractor_grade: 'AA', contractor_net_worth: 50000000 });
      assertEquals(res6M.tenure_pro_rata_factor, 0.50);
      assertEquals(res6M.total_bond_premium, 50000);
    },
  },

  // ==========================================================================
  // FEATURE 33: Trade Credit Insurance (TCI) Engine (5 Tests)
  // ==========================================================================
  {
    id: 'T1-F33-01',
    featureId: 33,
    featureName: 'Trade Credit Insurance (TCI) Engine',
    tier: 1,
    description: '30 days credit terms rate at 0.25% of insurable turnover',
    fn: () => {
      const res = calculateTradeCreditPremium({ insurable_turnover: 100000000, average_credit_days: 30, top_10_buyers_turnover_share_percent: 40, requested_indemnity_percent: 90 });
      assertEquals(res.base_rate_percent, 0.25);
      assertEquals(res.net_tci_premium, 250000);
    },
  },
  {
    id: 'T1-F33-02',
    featureId: 33,
    featureName: 'Trade Credit Insurance (TCI) Engine',
    tier: 1,
    description: '60 days credit terms rate at 0.35% of insurable turnover',
    fn: () => {
      const res = calculateTradeCreditPremium({ insurable_turnover: 100000000, average_credit_days: 60, top_10_buyers_turnover_share_percent: 40, requested_indemnity_percent: 90 });
      assertEquals(res.base_rate_percent, 0.35);
      assertEquals(res.net_tci_premium, 350000);
    },
  },
  {
    id: 'T1-F33-03',
    featureId: 33,
    featureName: 'Trade Credit Insurance (TCI) Engine',
    tier: 1,
    description: '90 days credit terms rate at 0.45% of insurable turnover',
    fn: () => {
      const res = calculateTradeCreditPremium({ insurable_turnover: 100000000, average_credit_days: 90, top_10_buyers_turnover_share_percent: 40, requested_indemnity_percent: 90 });
      assertEquals(res.base_rate_percent, 0.45);
      assertEquals(res.net_tci_premium, 450000);
    },
  },
  {
    id: 'T1-F33-04',
    featureId: 33,
    featureName: 'Trade Credit Insurance (TCI) Engine',
    tier: 1,
    description: 'Top 10 buyers share > 60% triggers +20% concentration loading',
    fn: () => {
      const res = calculateTradeCreditPremium({ insurable_turnover: 100000000, average_credit_days: 30, top_10_buyers_turnover_share_percent: 75, requested_indemnity_percent: 90 });
      assertEquals(res.concentration_loading_percent, 20);
      // 0.25% * 1.20 = 0.30% -> 300,000
      assertEquals(res.net_tci_premium, 300000);
    },
  },
  {
    id: 'T1-F33-05',
    featureId: 33,
    featureName: 'Trade Credit Insurance (TCI) Engine',
    tier: 1,
    description: 'Requested indemnity is clamped to statutory maximum of 90%',
    fn: () => {
      const res = calculateTradeCreditPremium({ insurable_turnover: 100000000, average_credit_days: 30, top_10_buyers_turnover_share_percent: 40, requested_indemnity_percent: 95 });
      assertEquals(res.clamped_indemnity_percent, 90);
    },
  },

  // ==========================================================================
  // FEATURE 34: Financial & Specialty Studio UI Model (5 Tests)
  // ==========================================================================
  {
    id: 'T1-F34-01',
    featureId: 34,
    featureName: 'Financial & Specialty Studio UI Model',
    tier: 1,
    description: 'Validates applicant name and positive principal amount',
    fn: () => {
      const res = validateSpecialtyStudioInput({
        contractor_or_applicant: 'Afcons Infrastructure',
        pan_number: 'AAACA1234F',
        selected_product: 'surety_bond',
        principal_amount: 50000000,
      });
      assert(res.is_valid && res.contract_ready, 'Expected valid specialty input');
    },
  },
  {
    id: 'T1-F34-02',
    featureId: 34,
    featureName: 'Financial & Specialty Studio UI Model',
    tier: 1,
    description: 'Validates Indian PAN format using statutory regex',
    fn: () => {
      const valid = validateSpecialtyStudioInput({ contractor_or_applicant: 'Afcons', pan_number: 'AAACA1234F', selected_product: 'surety_bond', principal_amount: 1000000 });
      assertEquals(valid.is_valid, true);
    },
  },
  {
    id: 'T1-F34-03',
    featureId: 34,
    featureName: 'Financial & Specialty Studio UI Model',
    tier: 1,
    description: 'Rejects invalid PAN formats',
    fn: () => {
      const invalid = validateSpecialtyStudioInput({ contractor_or_applicant: 'Afcons', pan_number: 'INVALIDPAN', selected_product: 'surety_bond', principal_amount: 1000000 });
      assertEquals(invalid.is_valid, false);
      assert(invalid.error?.includes('PAN') ?? false, 'Should report PAN error');
    },
  },
  {
    id: 'T1-F34-04',
    featureId: 34,
    featureName: 'Financial & Specialty Studio UI Model',
    tier: 1,
    description: 'Confirms contract readiness for Surety Bond studio input',
    fn: () => {
      const res = validateSpecialtyStudioInput({ contractor_or_applicant: 'L&T', pan_number: 'AAACL1234G', selected_product: 'surety_bond', principal_amount: 10000000 });
      assertEquals(res.contract_ready, true);
    },
  },
  {
    id: 'T1-F34-05',
    featureId: 34,
    featureName: 'Financial & Specialty Studio UI Model',
    tier: 1,
    description: 'Confirms contract readiness for Trade Credit studio input',
    fn: () => {
      const res = validateSpecialtyStudioInput({ contractor_or_applicant: 'Tata Steel', pan_number: 'AAACT5678K', selected_product: 'trade_credit', principal_amount: 100000000 });
      assertEquals(res.contract_ready, true);
    },
  },
];
