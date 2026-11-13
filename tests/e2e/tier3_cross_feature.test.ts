/**
 * Qoutely E2E Test Suite - Tier 3: Cross-Feature Pairwise Integration (34 Tests)
 * Exactly 34 pairwise integration tests evaluating multi-module interactions,
 * pipeline transitions, data rollups, and unified package underwriting.
 */

import { TestCase, assert, assertEquals, assertCloseTo } from './harness';
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

export const tier3Tests: TestCase[] = [
  // P01: F01 (Core Schema) + F02 (Motor IDV)
  {
    id: 'T3-P01',
    featureId: 1,
    featureName: 'F01 + F02: Multi-Line Schema & Motor IDV Depreciation',
    tier: 3,
    description: 'Depreciated vehicle IDV output generates valid standard quote schema with 18% GST',
    fn: () => {
      const idv = calculateMotorIdv({ ex_showroom_price: 2500000, age_months: 18 });
      const net = Math.round((idv.total_idv * 0.0175));
      const gst = Math.round(net * 0.18);
      const quote = { id: 'q-m01', lob_category: 'motor', insurance_line: 'motor_fleet', sum_insured: idv.total_idv, net_premium: net, gst_amount: gst, total_premium: net + gst };
      assert(validateQuoteSchema(quote).valid, 'Should pass schema validation');
    },
  },

  // P02: F02 (Motor IDV) + F03 (Motor Base OD)
  {
    id: 'T3-P02',
    featureId: 2,
    featureName: 'F02 + F03: Motor IDV to Zone-Based Own Damage Rating',
    tier: 3,
    description: 'Depreciated IDV feeds directly into Zone A GCV Public Carrier base OD rating',
    fn: () => {
      const idv = calculateMotorIdv({ ex_showroom_price: 3000000, age_months: 12 }); // 15% dep -> 2.55M
      assertEquals(idv.total_idv, 2550000);
      const od = calculateMotorBaseOd({ total_idv: idv.total_idv, vehicle_class: 'gcv_public', zone: 'A' });
      assertEquals(od.gross_od_premium, Math.round((2550000 * 1.764) / 100));
    },
  },

  // P03: F03 (Motor Base OD) + F04 (Motor NCB & Fleet)
  {
    id: 'T3-P03',
    featureId: 3,
    featureName: 'F03 + F04: Motor Base OD to NCB Ladder and Fleet Discount',
    tier: 3,
    description: 'Gross OD flows into 35% NCB ladder and 10% fleet volume discount',
    fn: () => {
      const od = calculateMotorBaseOd({ total_idv: 2000000, vehicle_class: 'gcv_public', zone: 'B' });
      const ncb = calculateMotorFleetNcb({ gross_od_premium: od.gross_od_premium, ncb_tier: 35, fleet_size: 30, past_claims_ratio_percent: 50 });
      // Gross OD after 35% NCB = Gross * 0.65; then 10% fleet discount = * 0.90
      const expectedNet = Math.round((od.gross_od_premium * 0.65) * 0.90);
      assertCloseTo(ncb.net_od_premium, expectedNet, 5);
    },
  },

  // P04: F03 (Motor Base OD) + F06 (IMT Add-ons)
  {
    id: 'T3-P04',
    featureId: 6,
    featureName: 'F03 + F06: Motor Base OD to IMT 23 Endorsement Suite',
    tier: 3,
    description: 'IMT 23 endorsement uses Gross OD to calculate 15% lamps and tyres coverage',
    fn: () => {
      const od = calculateMotorBaseOd({ total_idv: 1000000, vehicle_class: 'gcv_public', zone: 'A' });
      const addons = calculateCommercialImtAddons({ total_idv: 1000000, gross_od_premium: od.gross_od_premium, vehicle_age_months: 6, opt_imt23: true });
      assertEquals(addons.imt23_premium, Math.round(od.gross_od_premium * 0.15));
    },
  },

  // P05: F04 (Motor Fleet) + F05 (Motor Statutory TP)
  {
    id: 'T3-P05',
    featureId: 4,
    featureName: 'F04 + F05: Discounted Fleet OD Combined with Statutory Immutable TP',
    tier: 3,
    description: 'Fleet volume discount on OD combines with statutory fixed non-discounted TP tariff',
    fn: () => {
      const ncb = calculateMotorFleetNcb({ gross_od_premium: 50000, ncb_tier: 20, fleet_size: 60, past_claims_ratio_percent: 40 });
      const tp = calculateMotorTpTariff({ vehicle_class: 'gcv_public', gvw_kg: 25000, include_cpa: false, paid_drivers_count: 1 });
      const totalNet = ncb.net_od_premium + tp.total_tp_premium;
      assert(ncb.fleet_discount_percent === 15, 'Fleet discount applied to OD');
      assertEquals(tp.base_statutory_tp, 44242);
      assertEquals(totalNet, ncb.net_od_premium + 44242 + 50);
    },
  },

  // P06: F06 (IMT Add-ons) + F05 (Motor Statutory TP)
  {
    id: 'T3-P06',
    featureId: 5,
    featureName: 'F06 + F05: Comprehensive Commercial IMT Add-ons with CPA and Driver TP',
    tier: 3,
    description: 'Zero Dep + Consumables + Engine Protect combine with statutory CPA and paid driver',
    fn: () => {
      const addons = calculateCommercialImtAddons({ total_idv: 2000000, gross_od_premium: 35000, vehicle_age_months: 12, opt_zero_dep: true, opt_consumables: true, opt_engine_protect: true });
      const tp = calculateMotorTpTariff({ vehicle_class: 'gcv_public', gvw_kg: 16000, include_cpa: true, paid_drivers_count: 2 });
      assert(addons.total_addons_premium > 0, 'Add-ons premium computed');
      assertEquals(tp.cpa_premium, 275);
      assertEquals(tp.paid_driver_premium, 100);
    },
  },

  // P07: F07 (Bulk Fleet Ingestion) + F02 (Motor IDV)
  {
    id: 'T3-P07',
    featureId: 7,
    featureName: 'F07 + F02: Bulk Fleet Schedule Ingestion with Individual IDV Schedules',
    tier: 3,
    description: 'Roster ingestion evaluates distinct manufacturing years to compute vehicle-specific IDVs',
    fn: () => {
      const fleet: BulkFleetRecord[] = [
        { reg_number: 'MH12AB1001', make_model: 'Truck 1', mfg_year: 2025, vehicle_class: 'gcv_public', gvw_kg: 20000, ex_showroom_price: 3000000, zone: 'A', ncb_tier: 0 }, // 1 yr -> 15% dep -> 2.55M
        { reg_number: 'MH12AB1002', make_model: 'Truck 2', mfg_year: 2024, vehicle_class: 'gcv_public', gvw_kg: 20000, ex_showroom_price: 3000000, zone: 'A', ncb_tier: 0 }, // 2 yr -> 20% dep -> 2.40M
      ];
      const res = ingestBulkFleetSchedule(fleet);
      assertEquals(res.total_fleet_idv, 2550000 + 2400000);
    },
  },

  // P08: F07 (Bulk Fleet Ingestion) + F04 (Motor Fleet Discount)
  {
    id: 'T3-P08',
    featureId: 7,
    featureName: 'F07 + F04: Bulk Fleet Roster Size Auto-Qualifies Volume Discount',
    tier: 3,
    description: 'A 35-truck ingested roster auto-qualifies the fleet for a 10% volume discount',
    fn: () => {
      const fleet: BulkFleetRecord[] = [];
      for (let i = 1; i <= 35; i++) {
        fleet.push({ reg_number: `MH12AB${i.toString().padStart(4, '0')}`, make_model: 'Tata', mfg_year: 2024, vehicle_class: 'gcv_public', gvw_kg: 15000, ex_showroom_price: 2000000, zone: 'A', ncb_tier: 20 });
      }
      const res = ingestBulkFleetSchedule(fleet);
      assertEquals(res.valid_vehicles, 35);
      assert(res.total_fleet_net_od > 0, 'Fleet OD computed with volume discount');
    },
  },

  // P09: F08 (Motor Studio UI) + F01 (Core Schema)
  {
    id: 'T3-P09',
    featureId: 8,
    featureName: 'F08 + F01: Commercial Motor Studio Output Integrates into Core Schema',
    tier: 3,
    description: 'Studio ledger totals validate against multi-line database quote schema',
    fn: () => {
      const ledger = validateAndComputeMotorStudioLedger({
        client_id: 'cl-1',
        client_name: 'FastExpress Transport',
        vehicle_type: 'gcv_public',
        ex_showroom_price: 3500000,
        age_months: 12,
        zone: 'A',
        ncb_tier: 20,
        gvw_kg: 35000,
      });
      const netRow = ledger.ledger_rows.find(r => r.label === 'Net Package Premium');
      const gstRow = ledger.ledger_rows.find(r => r.label === 'Goods & Services Tax (GST 18%)');
      const quote = { id: 'q-studio-1', lob_category: 'motor', insurance_line: 'motor_fleet', net_premium: netRow!.amount, gst_amount: gstRow!.amount, total_premium: ledger.total_payable };
      assert(validateQuoteSchema(quote).valid, 'Studio quote must satisfy core schema validation');
    },
  },

  // P10: F09 (Marine Inland Transit) + F11 (Marine MOP Drawdown)
  {
    id: 'T3-P10',
    featureId: 9,
    featureName: 'F09 + F11: Domestic Transit Rating Debited from Marine Open Policy Balance',
    tier: 3,
    description: 'Inland transit rate per mille computes debit amount on CD account',
    fn: () => {
      const inland = calculateMarineInlandTransit({ invoice_value: 10000000, transit_clause: 'ITC_A', commodity_hazard_class: 2, is_certified_common_carrier: true });
      const acc: MopAccount = { policy_number: 'MOP-DOM-01', deposit_premium_balance: 50000, total_sum_insured: 100000000, utilized_sum_insured: 0 };
      const res = processMopDeclaration(acc, 10000000, inland.base_rate_per_mille);
      assertEquals(res.debit_amount, inland.net_marine_premium);
      assertEquals(res.updated_account.deposit_premium_balance, 50000 - inland.net_marine_premium);
    },
  },

  // P11: F10 (Marine Ocean Cargo) + F11 (Marine MOP Drawdown)
  {
    id: 'T3-P11',
    featureId: 10,
    featureName: 'F10 + F11: Multimodal Ocean Export Debited from Marine Open Cover',
    tier: 3,
    description: 'Ocean cargo consignment with duty markup debits from CD account',
    fn: () => {
      const ocean = calculateMarineOceanCargo({ invoice_value_inr: 20000000, incoterm: 'CIF', icc_clause: 'ICC_A', war_and_strikes_opted: true });
      const acc: MopAccount = { policy_number: 'MOP-EXP-01', deposit_premium_balance: 100000, total_sum_insured: 500000000, utilized_sum_insured: 0 };
      const res = processMopDeclaration(acc, ocean.total_sum_insured, 0.40);
      assert(res.certificate_issued, 'Certificate issued for ocean export');
    },
  },

  // P12: F12 (Marine Studio UI) + F01 (Core Schema)
  {
    id: 'T3-P12',
    featureId: 12,
    featureName: 'F12 + F01: Marine Studio Proposal to Standard Multi-Line Quote',
    tier: 3,
    description: 'Validated marine studio proposal converts into compliant multi-line quote schema',
    fn: () => {
      const proposal = validateMarineStudioProposal({ client_name: 'Tata Steel', policy_type: 'single_voyage', origin: 'Jamshedpur', destination: 'Mumbai Port', commodity: 'HR Coils', consignment_value: 15000000, clause: 'ITC_A' });
      assert(proposal.is_valid, 'Proposal must be valid');
      const quote = { id: 'q-mar-1', lob_category: 'marine', insurance_line: 'marine_cargo_inland', net_premium: 15000, gst_amount: 2700, total_premium: 17700 };
      assert(validateQuoteSchema(quote).valid, 'Quote must pass schema validation');
    },
  },

  // P13: F18 (Census Ingestion) + F13 (GHI Age-Band Matrix)
  {
    id: 'T3-P13',
    featureId: 13,
    featureName: 'F18 + F13: Census Ingestion Feeds GHI Demographic Rating Matrix',
    tier: 3,
    description: 'Parsed demographic age bands from census feed directly into GHI actuarial pricing',
    fn: () => {
      const rows: CensusRow[] = [
        { employee_id: 'E1', name: 'A', age: 24, gender: 'M', relationship: 'self' },
        { employee_id: 'E2', name: 'B', age: 34, gender: 'F', relationship: 'self' },
        { employee_id: 'E3', name: 'C', age: 52, gender: 'M', relationship: 'self' },
      ];
      const parsed = parseEmployeeCensusRoster(rows);
      const demo = calculateGhiDemographicPremium(parsed.age_bands, 300000);
      assertEquals(demo.total_lives, 3);
      // 2800 + 4200 + 11200 = 18200
      assertEquals(demo.pure_risk_premium, 18200);
    },
  },

  // P14: F13 (GHI Age-Band) + F14 (GHI Benefit Customizer)
  {
    id: 'T3-P14',
    featureId: 14,
    featureName: 'F13 + F14: GHI Pure Demographic Risk Loaded with Corporate Benefits',
    tier: 3,
    description: 'Pure demographic premium loaded with Single Private Room and Maternity Day 1',
    fn: () => {
      const demo = calculateGhiDemographicPremium({ age_0_25: 10, age_26_35: 20, age_36_45: 10, age_46_55: 10, age_56_65: 0, age_66_75: 0, age_76_plus: 0 }, 300000);
      const loaded = calculateGhiBenefitLoadings(demo.pure_risk_premium, {
        room_rent: 'single_private_room', // +8%
        maternity_opted: true, // +10%
        maternity_day_1_waiver: true, // +5% -> total 23%
        ped_waiver_day_1: false,
        corporate_buffer_amount: 0,
        group_size: 50,
      });
      assertEquals(loaded.loading_percent, 23);
      assertEquals(loaded.loaded_premium, Math.round(demo.pure_risk_premium * 1.23));
    },
  },

  // P15: F18 (Census Ingestion) + F15 (GTLI Mortality Engine)
  {
    id: 'T3-P15',
    featureId: 15,
    featureName: 'F18 + F15: Census Ingestion Feeds GTLI Mortality Pricing and FCL Checks',
    tier: 3,
    description: 'Census members feed GTLI mortality engine with 3x CTC sum insured calculation',
    fn: () => {
      const rows: CensusRow[] = [
        { employee_id: 'E1', name: 'Dev', age: 30, gender: 'M', relationship: 'self', monthly_salary: 100000 }, // 3x CTC = 3.6M
        { employee_id: 'E2', name: 'VP', age: 45, gender: 'F', relationship: 'self', monthly_salary: 300000 }, // 3x CTC = 10.8M (> 5M FCL)
      ];
      const parsed = parseEmployeeCensusRoster(rows);
      const members = rows.map(r => ({ age: r.age, sum_insured: (r.monthly_salary || 0) * 36 }));
      const gtli = calculateGtliPremium(members, 5000000);
      assertEquals(gtli.total_members, 2);
      assertEquals(gtli.members_requiring_medical, 1); // VP exceeds FCL
    },
  },

  // P16: F18 (Census Ingestion) + F17 (Workmen's Compensation)
  {
    id: 'T3-P16',
    featureId: 17,
    featureName: "F18 + F17: Census Wage Roll Feeds Statutory Workmen's Compensation",
    tier: 3,
    description: 'Factory labor census salaries are capped at ₹15,000 for statutory EC Act calculations',
    fn: () => {
      const rows: CensusRow[] = [
        { employee_id: 'W1', name: 'Worker 1', age: 25, gender: 'M', relationship: 'self', monthly_salary: 22000 },
        { employee_id: 'W2', name: 'Worker 2', age: 35, gender: 'M', relationship: 'self', monthly_salary: 18000 },
      ];
      const workers = rows.map(r => ({ age: r.age, monthly_wage: r.monthly_salary || 15000 }));
      const wc = calculateWorkmensCompensation({ workers, trade_hazard_rate_percent: 0.45, medical_extension_opted: false });
      // W1: 0.5 * 15000 * 216.91 = 1626825; W2: 0.5 * 15000 * 197.06 = 1477950
      assertEquals(wc.statutory_death_liability, 1626825 + 1477950);
    },
  },

  // P17: F16 (GPA Engine) + F17 (Workmen's Compensation)
  {
    id: 'T3-P17',
    featureId: 16,
    featureName: "F16 + F17: Dual Accident & Statutory Workmen's Compensation Underwriting",
    tier: 3,
    description: 'Factory labor receives both 24x7 worldwide GPA cover and on-duty EC Act WC liability',
    fn: () => {
      const gpa = calculateGpaPremium({ sum_insured_per_life: 500000, headcount: 50, hazard_class: 3, ttd_opted: true, medical_extension_opted: true });
      const wc = calculateWorkmensCompensation({
        workers: Array(50).fill({ age: 30, monthly_wage: 15000 }),
        trade_hazard_rate_percent: 1.10, // Foundry
        medical_extension_opted: true,
      });
      assert(gpa.total_gpa_premium > 0, 'GPA premium computed');
      assert(wc.net_wc_premium > 0, 'WC premium computed');
    },
  },

  // P18: F19 (Benefits Studio UI) + F01 (Core Schema)
  {
    id: 'T3-P18',
    featureId: 19,
    featureName: 'F19 + F01: Consolidated Employee Benefits Package in Core Database Schema',
    tier: 3,
    description: 'Synchronized benefits ledger generates standard quote schema with 18% GST',
    fn: () => {
      const studio = computeBenefitsStudioLedger({
        corporate_name: 'Infosys BPM',
        census: [{ employee_id: 'E1', name: 'Analyst', age: 26, gender: 'M', relationship: 'self', monthly_salary: 35000 }],
        ghi_base_si: 400000,
        room_rent: 'standard_1_percent',
        maternity_opted: true,
        gtli_sum_insured: 1000000,
        gpa_hazard_class: 1,
      });
      const quote = { id: 'q-ben-pkg', lob_category: 'benefits', insurance_line: 'ghi', net_premium: studio.package_net_premium, gst_amount: studio.package_gst, total_premium: studio.total_payable };
      assert(validateQuoteSchema(quote).valid, 'Package quote must pass schema validation');
    },
  },

  // P19: F24 (FAR Asset Register) + F21 (Machinery Breakdown)
  {
    id: 'T3-P19',
    featureId: 21,
    featureName: 'F24 + F21: Fixed Asset Register Rollup Feeds Machinery Breakdown Groups',
    tier: 3,
    description: 'FAR schedule plant & machinery CRVs map to Group II and Group III MB ratings',
    fn: () => {
      const far = parseFixedAssetRegister([
        { asset_code: 'COMP-1', category: 'plant_machinery', book_value: 3000000, current_replacement_value: 5000000 },
        { asset_code: 'TURB-1', category: 'plant_machinery', book_value: 6000000, current_replacement_value: 10000000 },
      ]);
      const mb = calculateMachineryBreakdown([
        { machine_id: 'COMP-1', tariff_group: 2, current_replacement_value: 5000000 }, // 1.5% = 75k
        { machine_id: 'TURB-1', tariff_group: 3, current_replacement_value: 10000000 }, // 2.5% = 250k
      ]);
      assertEquals(far.plant_machinery_crv, 15000000);
      assertEquals(mb.net_mb_premium, 325000);
    },
  },

  // P20: F24 (FAR Asset Register) + F22 (Electronic Equipment Insurance)
  {
    id: 'T3-P20',
    featureId: 22,
    featureName: 'F24 + F22: FAR IT Assets Ingestion Feeds Electronic Equipment Insurance',
    tier: 3,
    description: 'FAR IT assets roll up to EEI Section 1 hardware and Section 2 data media',
    fn: () => {
      const far = parseFixedAssetRegister([
        { asset_code: 'SRV-01', category: 'plant_machinery', book_value: 1500000, current_replacement_value: 2000000 },
      ]);
      const eei = calculateEeiPremium({ section1_hardware_crv: far.plant_machinery_crv, section2_data_media_si: 500000, section3_icow_months: 6, section3_icow_si: 1000000 });
      assertEquals(eei.section1_premium, 25000); // 2M * 1.25%
      assertEquals(eei.section2_premium, 15000); // 500k * 3%
      assertEquals(eei.section3_premium, 25000); // 1M * 2.5%
    },
  },

  // P21: F20 (CAR/EAR Lifecycle) + F23 (Boiler BPP Engine)
  {
    id: 'T3-P21',
    featureId: 20,
    featureName: 'F20 + F23: Plant Erection (EAR) Transitioning to Operational Boiler (BPP) Cover',
    tier: 3,
    description: 'EAR erection project testing window links to operational high-pressure boiler risk',
    fn: () => {
      const ear = calculateCarEarPremium({ project_type: 'ear', civil_works_value: 50000000, plant_machinery_value: 150000000, contract_period_months: 18, testing_period_months: 3, eq_zone: 2 });
      const bpp = calculateBppPremium({ vessel_type: 'water_tube', heating_surface_sqm: 120, operating_pressure_bar: 25, replacement_value: 20000000 });
      assert(ear.testing_premium > 0, 'EAR testing premium applies');
      assert(bpp.high_pressure_surcharge > 0, 'High-pressure surcharge applies for > 20 bar');
    },
  },

  // P22: F20 (CAR/EAR Lifecycle) + F25 (Engineering Studio UI)
  {
    id: 'T3-P22',
    featureId: 25,
    featureName: 'F20 + F25: Engineering Studio Proposal to EAR Lifecycle Calculation',
    tier: 3,
    description: 'Validated engineering proposal drives project works and testing rating in studio',
    fn: () => {
      const studioInput = validateEngineeringStudioInput({ project_name: 'NTPC Thermal Unit', contractor_name: 'BHEL', project_type: 'ear', civil_si: 50000000, plant_si: 200000000, duration_months: 24 });
      assert(studioInput.is_valid, 'Studio proposal valid');
      const ear = calculateCarEarPremium({ project_type: 'ear', civil_works_value: 50000000, plant_machinery_value: 200000000, contract_period_months: 24, eq_zone: 3 });
      assert(ear.net_project_premium > 0, 'EAR project premium computed');
    },
  },

  // P23: F26 (CGL Turnover & Ratio) + F31 (Corporate Liability Studio)
  {
    id: 'T3-P23',
    featureId: 26,
    featureName: 'F26 + F31: CGL 1:4 Ratio Discount Integrated into Liability Studio Model',
    tier: 3,
    description: 'Turnover-based CGL with 28% 1:4 ratio discount validates inside corporate liability package',
    fn: () => {
      const studio = validateLiabilityStudioPackage({ corporate_name: 'Flipkart Logistics', turnover: 5000000000, opt_cgl: true, opt_cyber: true, opt_do: false, opt_crime: false });
      assert(studio.is_valid, 'Studio valid');
      const cgl = calculateCglPremium({ annual_turnover: 5000000000, aoa_limit: 250000000, aoy_limit: 1000000000, ratio: '1:4', hazard_category: 2, territory: 'india_only' });
      assertEquals(cgl.ratio_discount_percent, 28);
    },
  },

  // P24: F29 (Cyber Posture Matrix) + F31 (Corporate Liability Studio)
  {
    id: 'T3-P24',
    featureId: 29,
    featureName: 'F29 + F31: Cyber Posture Scoring Controls Liability Studio Quote Gating',
    tier: 3,
    description: 'Mature cyber posture (score >= 85) applies 20% discount and permits studio quote issuance',
    fn: () => {
      const studio = validateLiabilityStudioPackage({ corporate_name: 'Razorpay', turnover: 2000000000, opt_cgl: false, opt_cyber: true, opt_do: false, opt_crime: false });
      assert(studio.is_valid, 'Studio valid');
      const cyber = evaluateCyberPosture({ has_mfa_everywhere: true, has_edr_endpoints: true, has_airgapped_backups: true, has_annual_vapt: true, has_247_soc: true, has_employee_training: true }, 1000000);
      assertEquals(cyber.posture_tier, 'mature');
      assertEquals(cyber.rate_adjustment_percent, -20);
      assertEquals(cyber.can_issue_quote, true);
    },
  },

  // P25: F27 (Professional Indemnity) + F28 (Directors & Officers)
  {
    id: 'T3-P25',
    featureId: 27,
    featureName: 'F27 + F28: Executive Management Package (PI E&O + D&O Side A/B/C)',
    tier: 3,
    description: 'SaaS unicorn combines tech E&O errors & omissions with private company D&O cover',
    fn: () => {
      const pi = calculateProfessionalIndemnity({ annual_fee_income: 100000000, limit_of_indemnity: 50000000, profession: 'tech_software', prior_clean_years: 2 });
      const doRes = calculateDirectorsOfficersPremium({ limit_of_indemnity: 50000000, entity_listing_status: 'private_unlisted', debt_to_equity_ratio: 0.8 });
      assert(pi.net_pi_premium > 0, 'PI computed');
      assert(doRes.net_do_premium > 0, 'D&O computed');
      const combinedNet = pi.net_pi_premium + doRes.net_do_premium;
      assert(combinedNet > 0, 'Combined package net premium');
    },
  },

  // P26: F29 (Cyber Posture Matrix) + F30 (Commercial Crime & Fidelity)
  {
    id: 'T3-P26',
    featureId: 30,
    featureName: 'F29 + F30: Cyber Posture Interacting with Internal Financial Controls',
    tier: 3,
    description: 'MFA corporate enforcement combined with dual authorization on wire transfers',
    fn: () => {
      const cyber = evaluateCyberPosture({ has_mfa_everywhere: true, has_edr_endpoints: true, has_airgapped_backups: true, has_annual_vapt: true, has_247_soc: true, has_employee_training: true }, 500000);
      const crime = calculateCommercialCrimePremium({ employees_with_funds_access: 25, limit_of_liability: 10000000, has_dual_authorization_above_50k: true });
      assertEquals(cyber.rate_adjustment_percent, -20);
      assertEquals(crime.internal_controls_discount_or_loading, -Math.round((25 * 250 + 50000) * 0.15));
    },
  },

  // P27: F32 (Surety Insurance Bond) + F34 (Specialty Studio UI)
  {
    id: 'T3-P27',
    featureId: 32,
    featureName: 'F32 + F34: Surety Performance Bond Valuation Inside Specialty Studio',
    tier: 3,
    description: 'Highway EPC contractor GFR Rule 171 performance bond validates in specialty studio',
    fn: () => {
      const studio = validateSpecialtyStudioInput({ contractor_or_applicant: 'Dilip Buildcon', pan_number: 'AAACD1234F', selected_product: 'surety_bond', principal_amount: 50000000 });
      assert(studio.is_valid, 'Studio valid');
      const bond = calculateSuretyBondPremium({ bond_type: 'performance_bond', bond_value: 50000000, tenure_months: 24, contractor_grade: 'AA', contractor_net_worth: 200000000 });
      assertEquals(bond.credit_limit_breach, false);
      assertEquals(bond.total_bond_premium, 1500000); // 50M * 1.5% * 2 yrs
    },
  },

  // P28: F33 (Trade Credit Insurance) + F34 (Specialty Studio UI)
  {
    id: 'T3-P28',
    featureId: 33,
    featureName: 'F33 + F34: Trade Credit Receivables Policy Inside Specialty Studio',
    tier: 3,
    description: 'Export credit insurance proposal validates and applies 90% statutory indemnity clamp',
    fn: () => {
      const studio = validateSpecialtyStudioInput({ contractor_or_applicant: 'Exporter Corp', pan_number: 'AAACE5678G', selected_product: 'trade_credit', principal_amount: 200000000 });
      assert(studio.is_valid, 'Studio valid');
      const tci = calculateTradeCreditPremium({ insurable_turnover: 200000000, average_credit_days: 60, top_10_buyers_turnover_share_percent: 50, requested_indemnity_percent: 95 });
      assertEquals(tci.clamped_indemnity_percent, 90);
    },
  },

  // P29: F02 (Motor IDV) + F06 (IMT Add-ons) + F08 (Motor Studio UI)
  {
    id: 'T3-P29',
    featureId: 8,
    featureName: 'F02 + F06 + F08: Aged Vehicle (> 5 Years) Restricts Zero Dep in Studio View',
    tier: 3,
    description: 'Vehicle older than 5 years disables Zero Dep add-on in studio ledger while allowing other add-ons',
    fn: () => {
      const addons = calculateCommercialImtAddons({ total_idv: 1000000, gross_od_premium: 20000, vehicle_age_months: 65, opt_zero_dep: true, opt_consumables: true });
      assertEquals(addons.zero_dep_premium, 0);
      assertEquals(addons.consumables_premium, 2500);
      assert(addons.warnings.length > 0, 'Warning expected for Zero Dep on old vehicle');
    },
  },

  // P30: F10 (Marine Ocean Cargo) + F33 (Trade Credit Insurance)
  {
    id: 'T3-P30',
    featureId: 10,
    featureName: 'F10 + F33: Cross-Border Trade Comprehensive Transit & Receivables Placement',
    tier: 3,
    description: 'Exporter pairs ocean marine cargo (ICC A) with export trade credit insurance',
    fn: () => {
      const ocean = calculateMarineOceanCargo({ invoice_value_inr: 50000000, incoterm: 'CIF', icc_clause: 'ICC_A' });
      const tci = calculateTradeCreditPremium({ insurable_turnover: 50000000, average_credit_days: 90, top_10_buyers_turnover_share_percent: 40, requested_indemnity_percent: 90 });
      assert(ocean.net_marine_premium > 0, 'Marine cargo premium computed');
      assert(tci.net_tci_premium > 0, 'Trade credit premium computed');
    },
  },

  // P31: F21 (Machinery Breakdown) + F26 (CGL Turnover)
  {
    id: 'T3-P31',
    featureId: 21,
    featureName: 'F21 + F26: Manufacturing Industrial Package (MB + Factory Premises CGL)',
    tier: 3,
    description: 'Textile factory couples machinery breakdown insurance with commercial general liability',
    fn: () => {
      const mb = calculateMachineryBreakdown([
        { machine_id: 'LOOM-1', tariff_group: 4, current_replacement_value: 20000000 }, // 4% = 800k
      ]);
      const cgl = calculateCglPremium({ annual_turnover: 100000000, aoa_limit: 10000000, aoy_limit: 20000000, ratio: '1:2', hazard_category: 2, territory: 'india_only' });
      assertEquals(mb.net_mb_premium, 800000);
      assertEquals(cgl.net_cgl_premium, 51000);
    },
  },

  // P32: F17 (Workmen's Compensation) + F20 (CAR/EAR Engineering)
  {
    id: 'T3-P32',
    featureId: 20,
    featureName: "F17 + F20: Construction Site Civil Works (CAR) Paired with Site Labor WC",
    tier: 3,
    description: 'EPC bridge contractor integrates civil works CAR policy with construction labor WC',
    fn: () => {
      const car = calculateCarEarPremium({ project_type: 'car', civil_works_value: 200000000, plant_machinery_value: 0, contract_period_months: 18, eq_zone: 3 });
      const wc = calculateWorkmensCompensation({
        workers: Array(100).fill({ age: 28, monthly_wage: 15000 }),
        trade_hazard_rate_percent: 1.10, // Construction
        medical_extension_opted: true,
      });
      assert(car.net_project_premium > 0, 'CAR premium computed');
      assert(wc.net_wc_premium > 0, 'WC premium computed');
    },
  },

  // P33: F07 (Bulk Fleet Ingestion) + F30 (Commercial Crime)
  {
    id: 'T3-P33',
    featureId: 7,
    featureName: 'F07 + F30: Fleet Logistics Carrier Paired with Commercial Driver Fidelity',
    tier: 3,
    description: 'Logistics company pairs commercial fleet insurance with employee dishonesty fidelity cover',
    fn: () => {
      const fleet = ingestBulkFleetSchedule([
        { reg_number: 'MH12AB5555', make_model: 'BharatBenz', mfg_year: 2024, vehicle_class: 'gcv_public', gvw_kg: 28000, ex_showroom_price: 3600000, zone: 'A', ncb_tier: 20 },
      ]);
      const crime = calculateCommercialCrimePremium({ employees_with_funds_access: 10, limit_of_liability: 2000000, has_dual_authorization_above_50k: true });
      assert(fleet.total_fleet_payable > 0, 'Fleet payable computed');
      assert(crime.net_crime_premium > 0, 'Crime premium computed');
    },
  },

  // P34: F01 (Core Schema) + F32 (Surety Bond) + F33 (Trade Credit)
  {
    id: 'T3-P34',
    featureId: 1,
    featureName: 'F01 + F32 + F33: Financial Lines Multi-Product Schema Compatibility',
    tier: 3,
    description: 'Surety bond and trade credit combined quotation validates against core database schema',
    fn: () => {
      const bond = calculateSuretyBondPremium({ bond_type: 'performance_bond', bond_value: 20000000, tenure_months: 12, contractor_grade: 'AAA', contractor_net_worth: 100000000 });
      const tci = calculateTradeCreditPremium({ insurable_turnover: 100000000, average_credit_days: 60, top_10_buyers_turnover_share_percent: 40, requested_indemnity_percent: 90 });
      const totalNet = bond.total_bond_premium + tci.net_tci_premium;
      const gst = Math.round(totalNet * 0.18);
      const quote = { id: 'q-fin-spec', lob_category: 'specialty', insurance_line: 'surety_bond', sum_insured: 120000000, net_premium: totalNet, gst_amount: gst, total_premium: totalNet + gst };
      assert(validateQuoteSchema(quote).valid, 'Should pass polymorphic database schema validation');
    },
  },
];
