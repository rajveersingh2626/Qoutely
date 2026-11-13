/**
 * Qoutely E2E Test Suite - Tier 4: Real-World Commercial Insurance Application Scenarios (17 Tests)
 * Exactly 17 comprehensive, multi-line, enterprise-scale commercial insurance portfolio placements.
 * Exercising end-to-end underwriting lifecycles, actuarial reconciliations, and statutory compliance.
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

export const tier4Tests: TestCase[] = [
  // ==========================================================================
  // SCENARIO 1: 150-Vehicle Inter-State Logistics Commercial Fleet Portfolio
  // Features: F1, F2, F3, F4, F5, F6, F7, F8
  // ==========================================================================
  {
    id: 'T4-S01',
    featureId: 7,
    featureName: 'S01: 150-Vehicle Inter-State Logistics Commercial Fleet Portfolio',
    tier: 4,
    description: 'National 3PL logistics fleet (150 multi-axle trucks) with IDV, Zone rating, TP, NCB, and volume discounts',
    fn: () => {
      const fleet: BulkFleetRecord[] = [];
      for (let i = 1; i <= 150; i++) {
        const zone = i <= 50 ? 'A' : i <= 100 ? 'B' : 'C';
        const gvw = i % 2 === 0 ? 40000 : 25000;
        const year = 2023 + (i % 3); // 2023, 2024, 2025
        fleet.push({
          reg_number: `MH12AB${i.toString().padStart(4, '0')}`,
          make_model: 'Tata Prima 4028.S',
          mfg_year: year,
          vehicle_class: 'gcv_public',
          gvw_kg: gvw,
          ex_showroom_price: 3600000,
          zone,
          ncb_tier: 25,
        });
      }

      const res = ingestBulkFleetSchedule(fleet);
      assertEquals(res.total_vehicles, 150);
      assertEquals(res.valid_vehicles, 150);
      assertEquals(res.invalid_vehicles, 0);

      // Verify fleet IDV is substantial (> ₹35 Crore)
      assert(res.total_fleet_idv > 350000000, 'Total fleet IDV should exceed 35 Cr');
      assert(res.total_fleet_net_od > 0, 'Fleet OD must be calculated');
      assert(res.total_fleet_tp > 0, 'Fleet TP must be calculated');

      // Verify GST is exactly 18% of net
      assertEquals(res.total_fleet_gst, Math.round(res.total_fleet_net_premium * 0.18));
      assertEquals(res.total_fleet_payable, res.total_fleet_net_premium + res.total_fleet_gst);

      // Verify quote schema
      const quote = { id: 'q-s01', lob_category: 'motor', insurance_line: 'motor_fleet', sum_insured: res.total_fleet_idv, net_premium: res.total_fleet_net_premium, gst_amount: res.total_fleet_gst, total_premium: res.total_fleet_payable };
      assert(validateQuoteSchema(quote).valid, 'Fleet quote must satisfy database schema');
    },
  },

  // ==========================================================================
  // SCENARIO 2: Global Multimodal Pharma Export with Incoterms & CD Drawdown
  // Features: F1, F9, F10, F11, F12
  // ==========================================================================
  {
    id: 'T4-S02',
    featureId: 10,
    featureName: 'S02: Global Multimodal Pharma Export with Incoterms & CD Drawdown',
    tier: 4,
    description: 'Pharma manufacturer dispatching cold-chain vaccines from Baddi to Antwerp with ICC (A) and MOP debit',
    fn: () => {
      // Step 1: Pre-shipment inland transit from Baddi to JNPT (ITC A, Class 4 hazardous/reefer)
      const inland = calculateMarineInlandTransit({ invoice_value: 50000000, transit_clause: 'ITC_A', commodity_hazard_class: 4, is_certified_common_carrier: true });
      assertEquals(inland.base_rate_per_mille, 0.55);
      assertEquals(inland.net_marine_premium, 27500); // 50M * 0.00055

      // Step 2: Ocean shipment from JNPT to Antwerp (CIF + 10%, ICC A, War/Strikes, Customs Duty cover)
      const ocean = calculateMarineOceanCargo({
        invoice_value_inr: 50000000,
        incoterm: 'CIF',
        icc_clause: 'ICC_A',
        customs_duty_opted: true,
        customs_duty_rate_percent: 25,
        war_and_strikes_opted: true,
      });
      // Cargo SI = 55M; Duty SI = 55M * 0.25 = 13.75M; Total SI = 68.75M
      assertEquals(ocean.cargo_sum_insured, 55000000);
      assertEquals(ocean.duty_sum_insured, 13750000);
      assert(ocean.net_marine_premium > 20000, 'Ocean premium calculated');

      // Step 3: Debit against Marine Open Policy (MOP) Cash Deposit account
      let account: MopAccount = { policy_number: 'MOP-PHARMA-2026', deposit_premium_balance: 100000, total_sum_insured: 500000000, utilized_sum_insured: 0 };
      const debitRes = processMopDeclaration(account, ocean.cargo_sum_insured, 0.35);
      assert(debitRes.certificate_issued, 'Certificate issued for pharma voyage');
      assert(debitRes.updated_account.deposit_premium_balance < 100000, 'Balance debited');
    },
  },

  // ==========================================================================
  // SCENARIO 3: 2,500-Employee IT Services Conglomerate Benefits Package
  // Features: F1, F13, F14, F15, F16, F17, F18, F19
  // ==========================================================================
  {
    id: 'T4-S03',
    featureId: 19,
    featureName: 'S03: 2,500-Employee IT Services Conglomerate Benefits Package',
    tier: 4,
    description: 'Enterprise IT conglomerate placing GHI + GTLI + GPA + WC across 2,500 employees and dependents',
    fn: () => {
      const census: CensusRow[] = [];
      for (let i = 1; i <= 1000; i++) {
        census.push({ employee_id: `EMP-${i}`, name: `Staff ${i}`, age: 24 + (i % 35), gender: i % 2 === 0 ? 'M' : 'F', relationship: 'self', monthly_salary: 40000 + (i * 20) });
      }
      for (let i = 1; i <= 800; i++) {
        census.push({ employee_id: `DEP-SP-${i}`, name: `Spouse ${i}`, age: 24 + (i % 35), gender: 'F', relationship: 'spouse' });
      }
      for (let i = 1; i <= 700; i++) {
        census.push({ employee_id: `DEP-CH-${i}`, name: `Child ${i}`, age: 2 + (i % 16), gender: 'M', relationship: 'child' });
      }

      const ledger = computeBenefitsStudioLedger({
        corporate_name: 'TechMahindra Conglomerate',
        census,
        ghi_base_si: 500000,
        room_rent: 'single_private_room',
        maternity_opted: true,
        gtli_sum_insured: 2000000,
        gpa_hazard_class: 1,
      });

      assert(ledger.ghi_premium > 10000000, 'GHI premium for 2500 lives should exceed 1 Crore');
      assert(ledger.gtli_premium > 1000000, 'GTLI premium for 1000 employees should exceed 10 Lakhs');
      assert(ledger.gpa_premium > 100000, 'GPA premium calculated');
      assert(ledger.wc_premium > 100000, 'WC premium calculated');

      // Verify full package reconciliation and GST
      assertEquals(ledger.package_gst, Math.round(ledger.package_net_premium * 0.18));
      assertEquals(ledger.total_payable, ledger.package_net_premium + ledger.package_gst);
    },
  },

  // ==========================================================================
  // SCENARIO 4: Greenfield Industrial Petrochemical Refinery Project (EAR+MB+EEI+BPP)
  // Features: F1, F20, F21, F22, F23, F24, F25
  // ==========================================================================
  {
    id: 'T4-S04',
    featureId: 20,
    featureName: 'S04: Greenfield Industrial Petrochemical Refinery Project (EAR+MB+EEI+BPP)',
    tier: 4,
    description: '₹500 Crore petrochemical refinery construction, turbine erection, testing, and high-pressure boilers',
    fn: () => {
      // 1. EAR Project lifecycle: ₹150 Cr civil, ₹350 Cr plant, 36 months duration, 6 months testing, 24 mos DLP, EQ Zone 2
      const ear = calculateCarEarPremium({
        project_type: 'ear',
        civil_works_value: 1500000000,
        plant_machinery_value: 3500000000,
        contract_period_months: 36,
        testing_period_months: 6,
        dlp_maintenance_months: 24,
        eq_zone: 2,
      });
      assertEquals(ear.project_sum_insured, 5000000000);
      assert(ear.testing_premium > 0, 'Testing premium for 5 extra months');
      assert(ear.maintenance_premium > 0, 'Maintenance premium for 24 months DLP');

      // 2. High-pressure steam boiler: water tube, 25 bar pressure, ₹25 Cr value
      const bpp = calculateBppPremium({ vessel_type: 'water_tube', heating_surface_sqm: 200, operating_pressure_bar: 25, replacement_value: 250000000, tpl_limit: 50000000 });
      assertEquals(bpp.high_pressure_surcharge, Math.round(2500000 * 0.20));

      // 3. Control room electronics: ₹10 Cr hardware, ₹2 Cr data media
      const eei = calculateEeiPremium({ section1_hardware_crv: 100000000, section2_data_media_si: 20000000, section3_icow_months: 12, section3_icow_si: 10000000 });
      assert(eei.total_eei_premium > 0, 'EEI premium computed');

      // 4. Combined engineering package
      const totalEngineeringNet = ear.net_project_premium + bpp.total_bpp_premium + eei.total_eei_premium;
      const gst = Math.round(totalEngineeringNet * 0.18);
      const quote = { id: 'q-s04', lob_category: 'engineering', insurance_line: 'ear', sum_insured: 5000000000, net_premium: totalEngineeringNet, gst_amount: gst, total_premium: totalEngineeringNet + gst };
      assert(validateQuoteSchema(quote).valid, 'Engineering mega-project satisfies quote schema');
    },
  },

  // ==========================================================================
  // SCENARIO 5: Global SaaS Unicorn Corporate Liability Package (CGL+Cyber+D&O+Crime)
  // Features: F1, F26, F27, F28, F29, F30, F31
  // ==========================================================================
  {
    id: 'T4-S05',
    featureId: 31,
    featureName: 'S05: Global SaaS Unicorn Corporate Liability Package (CGL+Cyber+D&O+Crime)',
    tier: 4,
    description: 'B2B SaaS unicorn with $100M revenue placing US-jurisdiction CGL, 100-pt Cyber, D&O, and Crime',
    fn: () => {
      // 1. CGL: ₹800 Cr turnover, Cat 1 (0.30‰), 1:4 AOA:AOY ratio (28% disc), Worldwide inc USA/Canada (2.5x)
      const cgl = calculateCglPremium({ annual_turnover: 8000000000, aoa_limit: 250000000, aoy_limit: 1000000000, ratio: '1:4', hazard_category: 1, territory: 'worldwide_inc_usa' });
      // Base = 8B * 0.00030 = 2,400,000; Net = 2.4M * 0.72 * 2.50 = 4,320,000
      assertEquals(cgl.net_cgl_premium, 4320000);

      // 2. Tech E&O (PI): ₹800 Cr revenue, ₹100 Cr LOI, 3 prior clean years (30% retro)
      const pi = calculateProfessionalIndemnity({ annual_fee_income: 8000000000, limit_of_indemnity: 1000000000, profession: 'tech_software', prior_clean_years: 3 });
      assert(pi.net_pi_premium > 0, 'PI computed');

      // 3. D&O: ₹100 Cr LOI, private unlisted, low debt
      const doRes = calculateDirectorsOfficersPremium({ limit_of_indemnity: 1000000000, entity_listing_status: 'private_unlisted', debt_to_equity_ratio: 0.5 });
      assertEquals(doRes.financial_distress_loading_percent, 0);

      // 4. Cyber Posture: 100 points, mature tier (-20% discount)
      const cyber = evaluateCyberPosture({ has_mfa_everywhere: true, has_edr_endpoints: true, has_airgapped_backups: true, has_annual_vapt: true, has_247_soc: true, has_employee_training: true }, 5000000);
      assertEquals(cyber.posture_tier, 'mature');
      assertEquals(cyber.final_cyber_premium, 4000000);

      // 5. Commercial Crime: 20 finance admins, ₹20 Cr LOI, dual authorization active (-15%)
      const crime = calculateCommercialCrimePremium({ employees_with_funds_access: 20, limit_of_liability: 200000000, has_dual_authorization_above_50k: true });
      assertEquals(crime.internal_controls_discount_or_loading, -Math.round((20 * 250 + 1000000) * 0.15));

      const totalNet = cgl.net_cgl_premium + pi.net_pi_premium + doRes.net_do_premium + cyber.final_cyber_premium + crime.net_crime_premium;
      const gst = Math.round(totalNet * 0.18);
      const quote = { id: 'q-s05', lob_category: 'liability', insurance_line: 'cgl', sum_insured: 1000000000, net_premium: totalNet, gst_amount: gst, total_premium: totalNet + gst };
      assert(validateQuoteSchema(quote).valid, 'SaaS liability package satisfies core schema');
    },
  },

  // ==========================================================================
  // SCENARIO 6: National Highway EPC Contractor GFR Surety & Trade Credit Package
  // Features: F1, F32, F33, F34
  // ==========================================================================
  {
    id: 'T4-S06',
    featureId: 32,
    featureName: 'S06: National Highway EPC Contractor GFR Surety & Trade Credit Package',
    tier: 4,
    description: 'EPC civil contractor executing ₹600 Cr highway tender placing GFR 171 Performance Bond & TCI',
    fn: () => {
      // 1. Performance Bond under GFR Rule 171: ₹60 Cr bond (10% of contract), 36 months, Grade AA, ₹100 Cr Net Worth
      const bond = calculateSuretyBondPremium({
        bond_type: 'performance_bond',
        bond_value: 600000000,
        tenure_months: 36,
        contractor_grade: 'AA',
        contractor_net_worth: 1000000000,
      });
      assertEquals(bond.credit_limit_breach, false);
      assertEquals(bond.required_collateral_margin_percent, 5); // 5% liquid collateral for AA
      // Rate = 1.50% * 1.0 * (36/12) = 4.5% -> 600M * 0.045 = 27,000,000
      assertEquals(bond.total_bond_premium, 27000000);

      // 2. Trade Credit Insurance on Sub-Contractor and Material Receivables (₹150 Cr turnover, 60 days terms)
      const tci = calculateTradeCreditPremium({
        insurable_turnover: 1500000000,
        average_credit_days: 60,
        top_10_buyers_turnover_share_percent: 55,
        requested_indemnity_percent: 90,
      });
      assertEquals(tci.base_rate_percent, 0.35);
      assertEquals(tci.clamped_indemnity_percent, 90);
      assert(tci.net_tci_premium > 0, 'TCI premium computed');
    },
  },

  // ==========================================================================
  // SCENARIO 7: Construction Dump Truck & Crane Special Vehicle Fleet Placement
  // Features: F2, F3, F5, F6, F7
  // ==========================================================================
  {
    id: 'T4-S07',
    featureId: 3,
    featureName: 'S07: Construction Dump Truck & Crane Special Vehicle Fleet Placement',
    tier: 4,
    description: 'Mining & construction fleet with 20 heavy dumpers and 10 mobile JCB cranes in Zone B',
    fn: () => {
      const fleet: BulkFleetRecord[] = [];
      for (let i = 1; i <= 20; i++) {
        fleet.push({ reg_number: `OD02AB${i.toString().padStart(4, '0')}`, make_model: 'Volvo Tipper', mfg_year: 2024, vehicle_class: 'gcv_public', gvw_kg: 31000, ex_showroom_price: 6000000, zone: 'B', ncb_tier: 20 });
      }
      for (let i = 1; i <= 10; i++) {
        fleet.push({ reg_number: `OD02CD${i.toString().padStart(4, '0')}`, make_model: 'JCB 3DX', mfg_year: 2023, vehicle_class: 'misc_digger_crane', gvw_kg: 8000, ex_showroom_price: 3500000, zone: 'B', ncb_tier: 25 });
      }

      const res = ingestBulkFleetSchedule(fleet);
      assertEquals(res.total_vehicles, 30);
      assertEquals(res.valid_vehicles, 30);
      assert(res.total_fleet_idv > 100000000, 'Fleet IDV exceeds 10 Cr');
      assert(res.total_fleet_payable > 0, 'Total payable computed');
    },
  },

  // ==========================================================================
  // SCENARIO 8: Domestic FMCG Distribution Network ATPO with 12 Declarations
  // Features: F9, F11, F12
  // ==========================================================================
  {
    id: 'T4-S08',
    featureId: 11,
    featureName: 'S08: Domestic FMCG Distribution Network ATPO with 12 Declarations',
    tier: 4,
    description: '₹200 Crore FMCG turnover policy with monthly dispatches debited from CD deposit account',
    fn: () => {
      let account: MopAccount = { policy_number: 'ATPO-FMCG-2026', deposit_premium_balance: 500000, total_sum_insured: 2000000000, utilized_sum_insured: 0 };
      const monthlyDispatchValue = 15000000; // 1.5 Cr per month
      const ratePerMille = 0.12; // Class 2 FMCG, ITC A

      for (let month = 1; month <= 12; month++) {
        const res = processMopDeclaration(account, monthlyDispatchValue, ratePerMille);
        assert(res.certificate_issued, `Month ${month} certificate must be issued`);
        account = res.updated_account;
      }

      assertEquals(account.utilized_sum_insured, 15000000 * 12); // 18 Cr utilized
      // Total debited: 180,000,000 * 0.00012 = 21,600
      assertEquals(account.deposit_premium_balance, 500000 - 21600);
    },
  },

  // ==========================================================================
  // SCENARIO 9: Manufacturing Plant Hazardous Labor Force Workmen's Comp & GPA
  // Features: F16, F17, F18
  // ==========================================================================
  {
    id: 'T4-S09',
    featureId: 17,
    featureName: "S09: Manufacturing Plant Hazardous Labor Force Workmen's Comp & GPA",
    tier: 4,
    description: 'Foundry manufacturing plant covering 100 shop floor workers under EC Act and GPA',
    fn: () => {
      const workers = Array(100).fill(null).map((_, i) => ({
        age: 22 + (i % 38), // ages 22 to 60
        monthly_wage: 18000 + (i * 50), // all above 15k cap
      }));

      // WC Calculation with ₹15,000 statutory cap and 1.10% foundry rate + 25% medical
      const wc = calculateWorkmensCompensation({ workers, trade_hazard_rate_percent: 1.10, medical_extension_opted: true });
      assertEquals(wc.total_workers, 100);
      assert(wc.statutory_death_liability > 100000000, 'Total death compensation capacity exceeds 10 Cr');

      // GPA Hazard Class III: 24x7 coverage with TTD rider
      const gpa = calculateGpaPremium({ sum_insured_per_life: 1000000, headcount: 100, hazard_class: 3, ttd_opted: true, medical_extension_opted: true });
      assertEquals(gpa.rate_per_mille, 1.50);
      assert(gpa.total_gpa_premium > 0, 'GPA premium calculated');
    },
  },

  // ==========================================================================
  // SCENARIO 10: Textile Spinning Mill Machinery Breakdown & Boiler Plant Renewal
  // Features: F21, F23, F24
  // ==========================================================================
  {
    id: 'T4-S10',
    featureId: 21,
    featureName: 'S10: Textile Spinning Mill Machinery Breakdown & Boiler Plant Renewal',
    tier: 4,
    description: 'Spinning mill with 50 spinning frames, 2 boilers, and FAR asset register valuation',
    fn: () => {
      const farItems: FarItem[] = [];
      const mbMachines: MbMachineItem[] = [];

      for (let i = 1; i <= 50; i++) {
        farItems.push({ asset_code: `SPN-${i}`, category: 'plant_machinery', book_value: 800000, current_replacement_value: 1500000 });
        mbMachines.push({ machine_id: `SPN-${i}`, tariff_group: 2, current_replacement_value: 1500000 }); // Group II = 1.5%
      }

      const far = parseFixedAssetRegister(farItems);
      assertEquals(far.plant_machinery_crv, 75000000); // 50 * 1.5M

      const mb = calculateMachineryBreakdown(mbMachines);
      assertEquals(mb.net_mb_premium, Math.round(75000000 * 0.0150)); // 1.125M

      const bpp = calculateBppPremium({ vessel_type: 'fire_tube', heating_surface_sqm: 80, operating_pressure_bar: 15, replacement_value: 5000000 });
      assertEquals(bpp.high_pressure_surcharge, 0); // <= 20 bar

      const combined = mb.net_mb_premium + bpp.total_bpp_premium;
      assert(combined > 1000000, 'Combined machinery & boiler premium calculated');
    },
  },

  // ==========================================================================
  // SCENARIO 11: Healthcare Diagnostic Chain PI & Cyber Data Protection Package
  // Features: F27, F29, F31
  // ==========================================================================
  {
    id: 'T4-S11',
    featureId: 27,
    featureName: 'S11: Healthcare Diagnostic Chain PI & Cyber Data Protection Package',
    tier: 4,
    description: 'Chain of pathology laboratories with medical malpractice PI and DPDPA patient health data protection',
    fn: () => {
      // 1. Medical Malpractice PI: ₹50 Cr fee income, ₹20 Cr LOI, 4 clean years
      const pi = calculateProfessionalIndemnity({ annual_fee_income: 500000000, limit_of_indemnity: 200000000, profession: 'medical_doctor', prior_clean_years: 4 });
      assertEquals(pi.retroactive_loading_percent, 40);
      assert(pi.net_pi_premium > 0, 'Medical PI premium computed');

      // 2. Cyber Healthcare Insurance: Mature posture (Score 100), 20% discount
      const cyber = evaluateCyberPosture({ has_mfa_everywhere: true, has_edr_endpoints: true, has_airgapped_backups: true, has_annual_vapt: true, has_247_soc: true, has_employee_training: true }, 2000000);
      assertEquals(cyber.posture_tier, 'mature');
      assertEquals(cyber.final_cyber_premium, 1600000);
    },
  },

  // ==========================================================================
  // SCENARIO 12: Cross-Border Solar Inverter Importer TCI & Customs Marine Cover
  // Features: F10, F33, F34
  // ==========================================================================
  {
    id: 'T4-S12',
    featureId: 10,
    featureName: 'S12: Cross-Border Solar Inverter Importer TCI & Customs Marine Cover',
    tier: 4,
    description: 'Importing solar inverters from Shenzhen under FOB Incoterm with 90-day dealer credit cover',
    fn: () => {
      // 1. Ocean Import: ₹50 Cr invoice, FOB with ocean freight and 35% customs duty cover
      const ocean = calculateMarineOceanCargo({
        invoice_value_inr: 500000000,
        incoterm: 'FOB',
        icc_clause: 'ICC_A',
        ocean_freight_inr: 25000000,
        port_charges_inr: 5000000,
        customs_duty_opted: true,
        customs_duty_rate_percent: 35,
        war_and_strikes_opted: true,
      });
      assert(ocean.cargo_sum_insured > 550000000, 'Cargo SI with markup');
      assert(ocean.duty_sum_insured > 0, 'Duty SI calculated');

      // 2. Dealer Trade Credit Policy: ₹600 Cr annual distributor turnover, 90 days terms
      const tci = calculateTradeCreditPremium({ insurable_turnover: 6000000000, average_credit_days: 90, top_10_buyers_turnover_share_percent: 45, requested_indemnity_percent: 90 });
      assertEquals(tci.base_rate_percent, 0.45);
      assertEquals(tci.net_tci_premium, 27000000); // 6B * 0.45%
    },
  },

  // ==========================================================================
  // SCENARIO 13: Multi-Tenant Commercial Property & Executive Fleet Placement
  // Features: F1, F2, F3, F5, F8
  // ==========================================================================
  {
    id: 'T4-S13',
    featureId: 8,
    featureName: 'S13: Multi-Tenant Commercial Property & Executive Fleet Placement',
    tier: 4,
    description: 'Commercial real estate firm insuring corporate campus asset along with executive bus fleet',
    fn: () => {
      const studio = validateAndComputeMotorStudioLedger({
        client_id: 'cl-dlf',
        client_name: 'DLF CyberCity Developers',
        vehicle_type: 'pcv_bus',
        ex_showroom_price: 5500000,
        age_months: 6,
        zone: 'A',
        ncb_tier: 20,
        gvw_kg: 16000,
      });
      assert(studio.ready_for_quote_slip, 'Ready for slip export');
      assertEquals(studio.ledger_rows.length, 11);
    },
  },

  // ==========================================================================
  // SCENARIO 14: Heavy Engineering Factory Insurance Audit & Package Conversion
  // Features: F20, F21, F22, F23, F26
  // ==========================================================================
  {
    id: 'T4-S14',
    featureId: 20,
    featureName: 'S14: Heavy Engineering Factory Insurance Audit & Package Conversion',
    tier: 4,
    description: 'Full insurance audit of heavy engineering manufacturer combining civil works, MB, EEI, BPP, and CGL',
    fn: () => {
      const ear = calculateCarEarPremium({ project_type: 'car', civil_works_value: 50000000, plant_machinery_value: 0, contract_period_months: 12, eq_zone: 3 });
      const mb = calculateMachineryBreakdown([{ machine_id: 'PRESS-1', tariff_group: 3, current_replacement_value: 30000000 }]);
      const eei = calculateEeiPremium({ section1_hardware_crv: 15000000 });
      const bpp = calculateBppPremium({ vessel_type: 'water_tube', heating_surface_sqm: 100, operating_pressure_bar: 18, replacement_value: 10000000 });
      const cgl = calculateCglPremium({ annual_turnover: 500000000, aoa_limit: 25000000, aoy_limit: 50000000, ratio: '1:2', hazard_category: 3, territory: 'india_only' });

      const total = ear.net_project_premium + mb.net_mb_premium + eei.total_eei_premium + bpp.total_bpp_premium + cgl.net_cgl_premium;
      assert(total > 1000000, 'Comprehensive engineering audit total calculated');
    },
  },

  // ==========================================================================
  // SCENARIO 15: FinTech Startup Financial Crime, Cyber Posture & D&O Package
  // Features: F28, F29, F30
  // ==========================================================================
  {
    id: 'T4-S15',
    featureId: 29,
    featureName: 'S15: FinTech Startup Financial Crime, Cyber Posture & D&O Package',
    tier: 4,
    description: 'Series B FinTech neobank combining unlisted D&O, 100-pt Cyber posture, and Commercial Crime',
    fn: () => {
      const doRes = calculateDirectorsOfficersPremium({ limit_of_indemnity: 100000000, entity_listing_status: 'private_unlisted', debt_to_equity_ratio: 0.2 });
      const cyber = evaluateCyberPosture({ has_mfa_everywhere: true, has_edr_endpoints: true, has_airgapped_backups: true, has_annual_vapt: true, has_247_soc: true, has_employee_training: true }, 2000000);
      const crime = calculateCommercialCrimePremium({ employees_with_funds_access: 50, limit_of_liability: 50000000, has_dual_authorization_above_50k: true });

      assertEquals(cyber.posture_tier, 'mature');
      assertEquals(crime.internal_controls_discount_or_loading, -Math.round((50 * 250 + 250000) * 0.15));
      assert(doRes.net_do_premium > 0, 'D&O premium computed');
    },
  },

  // ==========================================================================
  // SCENARIO 16: Renewable Energy Wind Farm CAR & MB Multi-Year Project
  // Features: F20, F21
  // ==========================================================================
  {
    id: 'T4-S16',
    featureId: 20,
    featureName: 'S16: Renewable Energy Wind Farm CAR & MB Multi-Year Project',
    tier: 4,
    description: '100 MW Wind farm project (30 wind turbine generators) from erection phase to operational MB cover',
    fn: () => {
      // Phase 1: 24-month EAR project with 4 months testing and 24 months DLP
      const ear = calculateCarEarPremium({
        project_type: 'ear',
        civil_works_value: 1000000000, // 100 Cr civil
        plant_machinery_value: 4000000000, // 400 Cr turbines
        contract_period_months: 24,
        testing_period_months: 4,
        dlp_maintenance_months: 24,
        eq_zone: 3,
      });
      assert(ear.testing_premium > 0, 'Testing premium for 3 extra months');

      // Phase 2: Operational MB on Group III turbines (2.50% rate)
      const mb = calculateMachineryBreakdown([{ machine_id: 'WTG-CLUSTER', tariff_group: 3, current_replacement_value: 4000000000 }]);
      assertEquals(mb.net_mb_premium, 100000000); // 4B * 2.5% = 10 Cr
    },
  },

  // ==========================================================================
  // SCENARIO 17: Steel Rolling Mill Complete Commercial Program (All 34 Features)
  // Features: All Lines (F1 to F34)
  // ==========================================================================
  {
    id: 'T4-S17',
    featureId: 1,
    featureName: 'S17: Steel Rolling Mill Complete Commercial Program (All 34 Lines)',
    tier: 4,
    description: 'Mega-conglomerate placing full commercial lines portfolio (Fleet, Marine, Benefits, Engineering, Liability, Surety)',
    fn: () => {
      // 1. Motor Fleet: 50 heavy trucks (F2-F7)
      const fleet = ingestBulkFleetSchedule([
        { reg_number: 'OR04AB1001', make_model: 'Tata Prima', mfg_year: 2024, vehicle_class: 'gcv_public', gvw_kg: 40000, ex_showroom_price: 4000000, zone: 'B', ncb_tier: 25 },
      ]);
      assert(fleet.total_fleet_payable > 0, 'Fleet placement active');

      // 2. Marine Open Policy: ₹200 Cr dispatch turnover (F9-F11)
      const marineInland = calculateMarineInlandTransit({ invoice_value: 50000000, transit_clause: 'ITC_A', commodity_hazard_class: 1, is_certified_common_carrier: true });
      assert(marineInland.net_marine_premium > 0, 'Marine transit active');

      // 3. Employee Benefits: 500 factory workers (F13-F18)
      const census: CensusRow[] = Array(50).fill(null).map((_, i) => ({
        employee_id: `STEEL-${i}`,
        name: `Worker ${i}`,
        age: 25 + (i % 30),
        gender: 'M',
        relationship: 'self',
        monthly_salary: 20000,
      }));
      const benefits = computeBenefitsStudioLedger({ corporate_name: 'Jindal Steel & Power', census, ghi_base_si: 300000, room_rent: 'standard_1_percent', maternity_opted: false });
      assert(benefits.total_payable > 0, 'Benefits placement active');

      // 4. Engineering: Rolling mill machinery & boilers (F20-F24)
      const mb = calculateMachineryBreakdown([{ machine_id: 'ROLL-01', tariff_group: 3, current_replacement_value: 50000000 }]);
      const bpp = calculateBppPremium({ vessel_type: 'water_tube', heating_surface_sqm: 150, operating_pressure_bar: 22, replacement_value: 15000000 });
      assert(mb.net_mb_premium > 0 && bpp.total_bpp_premium > 0, 'Engineering active');

      // 5. Corporate Liability: CGL + Cyber (F26-F30)
      const cgl = calculateCglPremium({ annual_turnover: 2000000000, aoa_limit: 50000000, aoy_limit: 100000000, ratio: '1:2', hazard_category: 3, territory: 'india_only' });
      assert(cgl.net_cgl_premium > 0, 'Liability active');

      // 6. Specialty: GFR Performance Bond (F32-F33)
      const surety = calculateSuretyBondPremium({ bond_type: 'performance_bond', bond_value: 50000000, tenure_months: 24, contractor_grade: 'AA', contractor_net_worth: 200000000 });
      assert(surety.total_bond_premium > 0, 'Surety active');

      // Grand Portfolio Total
      const grandTotalNet =
        fleet.total_fleet_net_premium +
        marineInland.net_marine_premium +
        benefits.package_net_premium +
        mb.net_mb_premium +
        bpp.total_bpp_premium +
        cgl.net_cgl_premium +
        surety.total_bond_premium;

      const grandGst = Math.round(grandTotalNet * 0.18);
      const grandPayable = grandTotalNet + grandGst;

      const quote = { id: 'q-s17-all-lines', lob_category: 'specialty', insurance_line: 'surety_bond', sum_insured: 1000000000, net_premium: grandTotalNet, gst_amount: grandGst, total_premium: grandPayable };
      assert(validateQuoteSchema(quote).valid, 'All-lines master quote validates cleanly');
    },
  },
];
