import { jsPDF } from 'jspdf';
import { Quote, Workspace } from '@/types/database';
import { generateQuoteSlipPDF } from '@/lib/pdf-generator';
import { downloadBenefitsQuotePDF, generateBenefitsQuoteSlipPDF, BenefitsQuoteData } from './benefits-pdf';
import { downloadMotorFleetQuotePDF, generateMotorFleetPDF, MotorQuoteData } from './motor-fleet-pdf';
import { downloadMarineCargoQuotePDF, generateMarineCargoPDF, MarineQuoteData } from './marine-cargo-pdf';
import { downloadEngineeringQuotePDF, generateEngineeringQuoteSlipPDF, EngineeringQuoteData } from './engineering-pdf';
import { downloadLiabilityQuotePDF, generateLiabilityQuoteSlipPDF, LiabilityQuoteData } from './liability-pdf';
import { downloadSpecialtyQuotePDF, generateSpecialtyQuoteSlipPDF, SpecialtyQuoteData } from './specialty-pdf';

export * from './benefits-pdf';
export * from './motor-fleet-pdf';
export * from './marine-cargo-pdf';
export * from './engineering-pdf';
export * from './liability-pdf';
export * from './specialty-pdf';

/**
 * Polymorphic PDF Quote Slip Generator
 * Directs quote data to the statutory line-specific PDF layout
 */
export function generatePolymorphicQuoteSlipPDF(quote: any, workspace?: Workspace): jsPDF {
  const lob = (quote.insurance_line || quote.lob_category || '').toLowerCase();
  const safeWorkspace = workspace || ({} as Workspace);

  try {
    if (lob === 'motor_fleet' || lob === 'motor') {
      const breakdown = quote.calculation_breakdown?.line_specific_breakdown || {};
      const risk = quote.risk_details || {};
      const motorData: MotorQuoteData = {
        quote_number: quote.quote_number || 'QTL-MTR-2026-0001',
        client_name: quote.client_name || 'Client',
        client_gst: quote.client_gst || '',
        client_address: quote.client_address || '',
        hypothecation_bank: quote.hypothecation_bank || '',
        quoteMode: (risk.fleet_mode === 'fleet' || risk.fleet_size > 1) ? 'fleet' : 'single',
        singleVehicle: {
          regNo: risk.reg_number || 'MH-04-AB-1234',
          makeModel: risk.make_model || 'Commercial Vehicle',
          vehicleClass: risk.vehicle_class || 'gcv',
          mfgYear: risk.manufacturing_year || 2023,
          gvwKg: risk.gvw_kg || 16000,
          seatingCapacity: risk.seating_capacity || 2,
          totalIdv: quote.sum_insured || 0,
          zone: risk.primary_zone || 'Zone B',
        },
        fleetCount: risk.fleet_size || 1,
        calculation: {
          totalIdv: breakdown.totalIdv || quote.sum_insured || 0,
          chassisIdv: breakdown.chassisIdv || quote.sum_insured || 0,
          accessoriesIdv: breakdown.accessoriesIdv || 0,
          grossOd: breakdown.grossOd || 0,
          imtAddons: breakdown.imtAddons || 0,
          ncbDiscount: breakdown.ncbDiscount || 0,
          fleetDiscountAmount: breakdown.fleetDiscountAmount || 0,
          netOd: breakdown.netOd || 0,
          statutoryTp: breakdown.statutoryTp || 0,
          cpaAndDrivers: breakdown.cpaAndDrivers || 0,
          netPremium: breakdown.netPremium || quote.premium || 0,
          gst: breakdown.gst || quote.gst_amount || 0,
          totalFinalPremium: breakdown.totalFinalPremium || quote.total_premium || 0,
        },
      };
      return generateMotorFleetPDF(motorData, safeWorkspace);
    }

    if (lob === 'marine_cargo' || lob === 'marine') {
      const breakdown = quote.calculation_breakdown?.line_specific_breakdown || {};
      const risk = quote.risk_details || {};
      const marineData: MarineQuoteData = {
        quote_number: quote.quote_number || 'QTL-MAR-2026-0001',
        client_name: quote.client_name || 'Client',
        client_gst: quote.client_gst || '',
        client_address: quote.client_address || '',
        hypothecation_bank: quote.hypothecation_bank || '',
        policyType: risk.policy_type || 'open_policy',
        transitType: risk.transit_type || 'inland',
        route: risk.route || { origin: 'JNPT Port', destination: 'Bhiwandi Hub' },
        cargoDetails: risk.cargo_details || {
          commodity: 'General Manufactured Goods',
          hazardClass: 2,
          isCertifiedCarrier: true,
        },
        clauses: risk.clauses || {
          transitClause: 'ITC (A) All Risks',
          incoterm: 'CIF',
          customsDutyOpted: false,
          warAndStrikesOpted: true,
          policyExcessClause: '0.5% of consignment value',
        },
        calculation: {
          consignmentValue: breakdown.consignmentValue || quote.sum_insured || 0,
          insurableSumInsured: breakdown.insurableSumInsured || breakdown.cifSumInsured || quote.sum_insured || 0,
          dutySumInsured: breakdown.dutySumInsured || breakdown.customsDutySumInsured || 0,
          totalSumInsured: breakdown.totalSumInsured || quote.sum_insured || 0,
          baseRatePerMille: breakdown.baseRatePerMille || 1.5,
          baseTransitPremium: breakdown.baseTransitPremium || quote.premium || 0,
          customsDutyPremium: breakdown.customsDutyPremium || 0,
          warAndStrikesPremium: breakdown.warAndStrikesPremium || 0,
          netMarinePremium: breakdown.netMarinePremium || quote.premium || 0,
          gstAmount: breakdown.gstAmount || quote.gst_amount || 0,
          totalFinalPremium: breakdown.totalFinalPremium || quote.total_premium || 0,
        },
      };
      return generateMarineCargoPDF(marineData, safeWorkspace);
    }

    if (lob === 'benefits' || lob === 'eb' || lob === 'employee_benefits') {
      const breakdown = quote.calculation_breakdown?.line_specific_breakdown || {};
      const risk = quote.risk_details || {};
      const benefitsData: BenefitsQuoteData = {
        quote_number: quote.quote_number || 'QTL-EB-2026-0001',
        client_name: quote.client_name || 'Client',
        client_gst: quote.client_gst || '',
        client_address: quote.client_address || '',
        hypothecation_bank: quote.hypothecation_bank || '',
        census: risk.census || {
          total_lives: risk.total_employees || 100,
          employee_count: risk.total_employees || 100,
          dependent_count: 0,
          family_structure: '1+0 (Employee Only)',
          age_bands: {
            age_0_25: 15,
            age_26_35: 55,
            age_36_45: 20,
            age_46_55: 8,
            age_56_65: 2,
            age_66_75: 0,
            age_76_plus: 0,
          },
        },
        ghi: risk.ghi || {
          sum_insured: 500000,
          room_rent_desc: '1% of SI per day',
          maternity_opted: true,
          maternity_limit_desc: 'Rs 50,000 normal/caesarean',
          ped_waiver_day_1: true,
          corporate_buffer_amount: 1000000,
          tpa_network_name: 'Medi Assist / Vidal Health',
        },
        gtli: risk.gtli || {
          opted: false,
          sum_insured_per_member: 1000000,
          total_sum_insured: 0,
          free_cover_limit: 1000000,
          hazard_class_desc: 'Class 1 White Collar',
        },
        gpa: risk.gpa || {
          opted: false,
          sum_insured_per_life: 1000000,
          total_sum_insured: 0,
        },
        wc: risk.wc || {
          opted: false,
          total_employee_count: 0,
          total_monthly_wages: 0,
          statutory_basis_desc: 'EC Act 1923 Sec 4 Schedule IV',
        },
        calculation: {
          ghi_pure_premium: breakdown.ghi_pure_premium || breakdown.gmc_premium || quote.premium || 0,
          ghi_loading_amount: breakdown.ghi_loading_amount || 0,
          ghi_buffer_premium: breakdown.ghi_buffer_premium || breakdown.corporate_buffer_premium || 0,
          ghi_total_premium: breakdown.ghi_total_premium || breakdown.gmc_premium || quote.premium || 0,
          gtli_premium: breakdown.gtli_premium || 0,
          gpa_premium: breakdown.gpa_premium || 0,
          wc_premium: breakdown.wc_premium || 0,
          net_package_premium: breakdown.net_package_premium || breakdown.total_net_premium || quote.premium || 0,
          gst_amount: breakdown.gst_amount || quote.gst_amount || 0,
          total_final_premium: breakdown.total_final_premium || breakdown.final_total_premium || quote.total_premium || 0,
        },
      };
      return generateBenefitsQuoteSlipPDF(benefitsData, safeWorkspace);
    }

    if (lob === 'engineering') {
      const breakdown = quote.calculation_breakdown?.line_specific_breakdown || {};
      const risk = quote.risk_details || {};
      const engData: EngineeringQuoteData = {
        quote_number: quote.quote_number || 'QTL-ENG-2026-0001',
        client_name: quote.client_name || 'Client',
        client_gst: quote.client_gst || '',
        client_address: quote.client_address || '',
        hypothecation_bank: quote.hypothecation_bank || '',
        sub_line: risk.sub_line || 'car',
        contract_period_months: risk.contract_period_months || 12,
        civil_works_value: risk.civil_works_value || quote.sum_insured || 0,
        plant_machinery_value: risk.plant_machinery_value || 0,
        calculation: {
          sum_insured: breakdown.sum_insured || breakdown.total_sum_insured || quote.sum_insured || 0,
          base_works_premium: breakdown.base_works_premium || quote.premium || 0,
          testing_premium: breakdown.testing_premium || 0,
          maintenance_premium: breakdown.maintenance_premium || 0,
          perils_premium: breakdown.perils_premium || 0,
          net_premium: breakdown.net_premium || breakdown.total_net_premium || quote.premium || 0,
          gst_amount: breakdown.gst_amount || quote.gst_amount || 0,
          total_premium: breakdown.total_premium || breakdown.final_total_premium || quote.total_premium || 0,
        },
      };
      return generateEngineeringQuoteSlipPDF(engData, safeWorkspace);
    }

    if (lob === 'liability') {
      const breakdown = quote.calculation_breakdown?.line_specific_breakdown || {};
      const risk = quote.risk_details || {};
      const liabData: LiabilityQuoteData = {
        quote_number: quote.quote_number || 'QTL-LIA-2026-0001',
        client_name: quote.client_name || 'Client',
        client_gst: quote.client_gst || '',
        client_address: quote.client_address || '',
        annual_turnover: risk.annual_turnover || quote.sum_insured || 10000000,
        sub_line: risk.sub_line || 'cgl',
        calculation: {
          sum_insured: breakdown.sum_insured || quote.sum_insured || 10000000,
          cgl_premium: breakdown.cgl_premium,
          pi_premium: breakdown.pi_premium,
          do_premium: breakdown.do_premium,
          cyber_premium: breakdown.cyber_premium,
          crime_premium: breakdown.crime_premium,
          net_premium: breakdown.net_premium || breakdown.total_net_premium || quote.premium || 0,
          gst_amount: breakdown.gst_amount || quote.gst_amount || 0,
          total_premium: breakdown.total_premium || breakdown.final_total_premium || quote.total_premium || 0,
        },
      };
      return generateLiabilityQuoteSlipPDF(liabData, safeWorkspace);
    }

    if (lob === 'specialty') {
      const breakdown = quote.calculation_breakdown?.line_specific_breakdown || {};
      const risk = quote.risk_details || {};
      const specData: SpecialtyQuoteData = {
        quote_number: quote.quote_number || 'QTL-SPE-2026-0001',
        client_name: quote.client_name || 'Client',
        client_gst: quote.client_gst || '',
        client_address: quote.client_address || '',
        pan_number: risk.pan_number || 'ABCDE1234F',
        sub_line: risk.sub_line || 'surety_bond',
        calculation: {
          sum_insured: breakdown.sum_insured || quote.sum_insured || 10000000,
          surety_premium: breakdown.surety_premium,
          trade_credit_premium: breakdown.trade_credit_premium,
          burglary_premium: breakdown.burglary_premium,
          net_premium: breakdown.net_premium || breakdown.total_net_premium || quote.premium || 0,
          gst_amount: breakdown.gst_amount || quote.gst_amount || 0,
          total_premium: breakdown.total_premium || breakdown.final_total_premium || quote.total_premium || 0,
        },
      };
      return generateSpecialtyQuoteSlipPDF(specData, safeWorkspace);
    }
  } catch (err) {
    console.warn('Polymorphic PDF generator encountered an issue, falling back to canonical fire/property layout:', err);
  }

  // Fallback: Canonical Property & Fire PDF Slip
  return generateQuoteSlipPDF(quote as Quote, safeWorkspace);
}

/**
 * Download polymorphic quote slip PDF
 */
export function downloadPolymorphicQuoteSlipPDF(quote: any, workspace?: Workspace) {
  const doc = generatePolymorphicQuoteSlipPDF(quote, workspace);
  const cleanClient = (quote.client_name || 'Client').replace(/[^a-zA-Z0-9]/g, '_');
  const quoteNum = quote.quote_number || 'QTL-QUOTE';
  doc.save(`Quote_Slip-${cleanClient}-${quoteNum}.pdf`);
}

// Canonical alias for seamless polymorphic drop-in
export { downloadPolymorphicQuoteSlipPDF as downloadQuoteSlipPDF };

