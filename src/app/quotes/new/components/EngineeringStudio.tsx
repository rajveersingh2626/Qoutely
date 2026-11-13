'use client';

import React, { useState, useMemo } from 'react';
import {
  HardHat,
  Cpu,
  Flame,
  Laptop,
  Layers,
  FileSpreadsheet,
  Check,
  Download,
  Save,
  AlertTriangle,
  Info,
  ChevronRight,
  Plus,
  Trash2,
  Shield,
  Activity,
  Sliders,
  Building,
  Wrench,
  Gauge,
  Zap,
} from 'lucide-react';
import { formatNumberINR, formatINRWithDecimals } from '@/lib/calculator';
import {
  FixedAssetRegisterUploader,
  FarRollupSummary,
} from '../uploaders/FixedAssetRegisterUploader';
import {
  downloadEngineeringQuotePDF,
  EngineeringQuoteData,
} from '@/lib/pdf/engineering-pdf';
import { useWorkspace } from '@/context/WorkspaceContext';
import {
  calculateCarEarPremium,
  calculateMachineryBreakdown,
  calculateEeiPremium,
  calculateBppPremium,
  validateEngineeringStudioInput,
  calculateCarEarQuote,
  calculateMbQuote,
  calculateEeiQuote,
  calculateBppQuote,
  calculateEngineeringQuote,
  CAR_CIVIL_RATE_PER_MILLE,
  EAR_PLANT_RATE_PER_MILLE,
  SEISMIC_EQ_RATES_PER_MILLE,
  MB_GROUP_RATES,
  EEI_HARDWARE_BASE_RATE,
  EEI_PORTABLE_LAPTOP_LOADING,
  EEI_DATA_MEDIA_RATE,
  EEI_ICOW_RATES,
  BPP_VESSEL_RATES,
  BPP_HIGH_PRESSURE_SURCHARGE_PERCENT,
  CarEarInput,
  MbMachineItem,
  EeiInput,
  BppInput,
  FarItem,
} from '@/lib/engines/engineering-engine';
import { Quote, EngineeringRiskDetails } from '@/types/database';

interface EngineeringStudioProps {
  clientInfo: {
    clientName: string;
    clientGst: string;
    clientAddress: string;
    hypothecationBank?: string;
  };
  onClientInfoChange: (field: string, value: string) => void;
  onSaveQuote: (quoteData: any) => Promise<void>;
  isSubmitting?: boolean;
}

const DEFAULT_SAMPLE_MACHINES: MbMachineItem[] = [
  { machine_id: 'GEN-01', tariff_group: 3, current_replacement_value: 12000000 },
  { machine_id: 'PUMP-01', tariff_group: 1, current_replacement_value: 3500000 },
  { machine_id: 'COMP-02', tariff_group: 2, current_replacement_value: 6500000 },
];

export const EngineeringStudio: React.FC<EngineeringStudioProps> = ({
  clientInfo,
  onClientInfoChange,
  onSaveQuote,
  isSubmitting = false,
}) => {
  const { currentWorkspace } = useWorkspace();

  // Mobile navigation tab: 'scope' | 'perils' | 'ledger'
  const [activeMobileTab, setActiveMobileTab] = useState<'scope' | 'perils' | 'ledger'>('scope');

  // Sub-line tab: 'car' | 'ear' | 'mb' | 'eei' | 'bpp' | 'package'
  const [subLine, setSubLine] = useState<'car' | 'ear' | 'mb' | 'eei' | 'bpp' | 'package'>('car');

  // FAR Ingestion Modal State
  const [isFarUploaderOpen, setIsFarUploaderOpen] = useState(false);
  const [isFarLoaded, setIsFarLoaded] = useState(false);
  const [uploadedFarItems, setUploadedFarItems] = useState<FarItem[]>([]);
  const [farRollup, setFarRollup] = useState<FarRollupSummary | null>(null);

  // --------------------------------------------------------------------------
  // Project & Works Details (Column 1)
  // --------------------------------------------------------------------------
  const [projectName, setProjectName] = useState<string>('Coastal Expressway & Viaduct Package 2');
  const [contractorName, setContractorName] = useState<string>('Larsen & Toubro Ltd.');
  const [principalName, setPrincipalName] = useState<string>('National Highways Authority of India');
  const [siteLocation, setSiteLocation] = useState<string>('Sector 14, Navi Mumbai, Maharashtra');

  // CAR / EAR Values
  const [contractPeriodMonths, setContractPeriodMonths] = useState<number>(18);
  const [civilWorksValue, setCivilWorksValue] = useState<number>(150000000); // ₹15 Cr
  const [plantMachineryValue, setPlantMachineryValue] = useState<number>(50000000); // ₹5 Cr

  // Machinery Breakdown (MB) Schedule
  const [machines, setMachines] = useState<MbMachineItem[]>(DEFAULT_SAMPLE_MACHINES);
  const [expressFreightPercent, setExpressFreightPercent] = useState<number>(10);
  const [airFreightSi, setAirFreightSi] = useState<number>(0);

  // Electronic Equipment (EEI) Section
  const [eeiHardwareCrv, setEeiHardwareCrv] = useState<number>(10000000); // ₹1 Cr
  const [eeiIsPortable, setEeiIsPortable] = useState<boolean>(false);
  const [eeiDataMediaSi, setEeiDataMediaSi] = useState<number>(2000000); // ₹20 Lakhs
  const [eeiIcowMonths, setEeiIcowMonths] = useState<3 | 6 | 12>(6);
  const [eeiIcowSi, setEeiIcowSi] = useState<number>(3000000); // ₹30 Lakhs

  // Boiler & Pressure Plant (BPP) Section
  const [bppVesselType, setBppVesselType] = useState<'fire_tube' | 'water_tube'>('water_tube');
  const [bppHeatingSurface, setBppHeatingSurface] = useState<number>(180);
  const [bppOperatingPressure, setBppOperatingPressure] = useState<number>(25); // > 20 bar triggers surcharge
  const [bppReplacementValue, setBppReplacementValue] = useState<number>(20000000); // ₹2 Cr
  const [bppTplLimit, setBppTplLimit] = useState<number>(5000000); // ₹50 Lakhs

  // --------------------------------------------------------------------------
  // Peril & Policy Customizer (Column 2)
  // --------------------------------------------------------------------------
  const [testingPeriodMonths, setTestingPeriodMonths] = useState<number>(2);
  const [dlpMaintenanceMonths, setDlpMaintenanceMonths] = useState<number>(12); // 0, 12, 24
  const [eqZone, setEqZone] = useState<1 | 2 | 3 | 4>(2);
  const [stfiOpted, setStfiOpted] = useState<boolean>(true);
  const [tplLimit, setTplLimit] = useState<number>(10000000); // ₹1 Cr
  const [surroundingPropertyLimit, setSurroundingPropertyLimit] = useState<number>(5000000); // ₹50 Lakhs

  // --------------------------------------------------------------------------
  // Reactive Calculations
  // --------------------------------------------------------------------------
  const calculation = useMemo(() => {
    // 1. CAR / EAR
    let baseWorksPrem = 0;
    let testingPrem = 0;
    let maintPrem = 0;
    let perilsPrem = 0;
    let carEarNet = 0;
    const carEarTotalSi = civilWorksValue + plantMachineryValue;

    if (subLine === 'car' || subLine === 'ear' || subLine === 'package') {
      try {
        if (carEarTotalSi > 0) {
          const res = calculateCarEarPremium({
            project_type: subLine === 'ear' ? 'ear' : 'car',
            civil_works_value: civilWorksValue,
            plant_machinery_value: plantMachineryValue,
            contract_period_months: contractPeriodMonths,
            testing_period_months: subLine === 'car' ? 0 : testingPeriodMonths,
            dlp_maintenance_months: dlpMaintenanceMonths,
            eq_zone: eqZone,
          });
          baseWorksPrem = res.base_works_premium;
          testingPrem = res.testing_premium;
          maintPrem = res.maintenance_premium;
          perilsPrem = res.perils_premium;
          carEarNet = res.net_project_premium;
        }
      } catch (err) {
        console.warn('CAR/EAR calculation error:', err);
      }
    }

    // STFI loading
    const stfiPrem = stfiOpted && carEarTotalSi > 0 ? Math.round((carEarTotalSi * 0.15) / 1000) : 0;

    // Surrounding property & TPL for CAR/EAR
    const surroundingPrem =
      surroundingPropertyLimit > 0 ? Math.round((surroundingPropertyLimit * 0.25) / 1000) : 0;
    const projectTplPrem = tplLimit > 0 ? Math.round((tplLimit * 0.35) / 1000) : 0;

    // 2. Machinery Breakdown (MB)
    let mbNetPrem = 0;
    let mbTotalCrv = 0;
    if (subLine === 'mb' || subLine === 'package') {
      try {
        if (machines.length > 0) {
          const res = calculateMachineryBreakdown(machines);
          mbNetPrem = res.net_mb_premium;
          mbTotalCrv = res.total_crv;
        }
      } catch (err) {
        console.warn('MB calculation error:', err);
      }
    }
    const mbExpressFreight =
      expressFreightPercent > 0 ? Math.round(mbNetPrem * (expressFreightPercent / 100)) : 0;
    const mbAirFreight = airFreightSi > 0 ? Math.round(airFreightSi * 0.025) : 0;

    // 3. Electronic Equipment (EEI)
    let eeiNetPrem = 0;
    let eeiTotalSi = 0;
    if (subLine === 'eei' || subLine === 'package') {
      try {
        if (eeiHardwareCrv > 0) {
          const res = calculateEeiPremium({
            section1_hardware_crv: eeiHardwareCrv,
            is_portable_laptop: eeiIsPortable,
            section2_data_media_si: eeiDataMediaSi,
            section3_icow_months: eeiIcowMonths,
            section3_icow_si: eeiIcowSi,
          });
          eeiNetPrem = res.total_eei_premium;
          eeiTotalSi = eeiHardwareCrv + eeiDataMediaSi + eeiIcowSi;
        }
      } catch (err) {
        console.warn('EEI calculation error:', err);
      }
    }

    // 4. Boiler & Pressure Plant (BPP)
    let bppNetPrem = 0;
    let bppTotalSi = 0;
    let bppSurcharge = 0;
    let bppTplPrem = 0;
    if (subLine === 'bpp' || subLine === 'package') {
      try {
        if (bppReplacementValue > 0) {
          const res = calculateBppPremium({
            vessel_type: bppVesselType,
            heating_surface_sqm: bppHeatingSurface,
            operating_pressure_bar: bppOperatingPressure,
            replacement_value: bppReplacementValue,
            tpl_limit: bppTplLimit,
          });
          bppNetPrem = res.total_bpp_premium;
          bppSurcharge = res.high_pressure_surcharge;
          bppTplPrem = res.tpl_premium;
          bppTotalSi = bppReplacementValue + bppTplLimit;
        }
      } catch (err) {
        console.warn('BPP calculation error:', err);
      }
    }

    // Aggregations based on selected subLine
    let totalInsuredValue = 0;
    let netEngineeringPremium = 0;

    if (subLine === 'car' || subLine === 'ear') {
      totalInsuredValue = carEarTotalSi + surroundingPropertyLimit + tplLimit;
      netEngineeringPremium = carEarNet + stfiPrem + surroundingPrem + projectTplPrem;
    } else if (subLine === 'mb') {
      totalInsuredValue = mbTotalCrv + surroundingPropertyLimit;
      netEngineeringPremium = mbNetPrem + mbExpressFreight + mbAirFreight + surroundingPrem;
    } else if (subLine === 'eei') {
      totalInsuredValue = eeiTotalSi;
      netEngineeringPremium = eeiNetPrem;
    } else if (subLine === 'bpp') {
      totalInsuredValue = bppTotalSi + surroundingPropertyLimit;
      netEngineeringPremium = bppNetPrem + surroundingPrem;
    } else if (subLine === 'package') {
      totalInsuredValue = carEarTotalSi + mbTotalCrv + eeiTotalSi + bppTotalSi + surroundingPropertyLimit + tplLimit;
      netEngineeringPremium =
        carEarNet +
        stfiPrem +
        surroundingPrem +
        projectTplPrem +
        mbNetPrem +
        mbExpressFreight +
        mbAirFreight +
        eeiNetPrem +
        bppNetPrem;
    }

    const gstAmount = Math.round(netEngineeringPremium * 0.18);
    const totalPremiumPayable = netEngineeringPremium + gstAmount;
    const aggregateRatePerMille =
      totalInsuredValue > 0 ? ((netEngineeringPremium / totalInsuredValue) * 1000).toFixed(2) : '0.00';

    return {
      carEarTotalSi,
      baseWorksPrem,
      testingPrem,
      maintPrem,
      perilsPrem,
      stfiPrem,
      surroundingPrem,
      projectTplPrem,
      mbNetPrem,
      mbTotalCrv,
      mbExpressFreight,
      mbAirFreight,
      eeiNetPrem,
      eeiTotalSi,
      bppNetPrem,
      bppTotalSi,
      bppSurcharge,
      bppTplPrem,
      totalInsuredValue,
      netEngineeringPremium,
      gstAmount,
      totalPremiumPayable,
      aggregateRatePerMille,
    };
  }, [
    subLine,
    civilWorksValue,
    plantMachineryValue,
    contractPeriodMonths,
    testingPeriodMonths,
    dlpMaintenanceMonths,
    eqZone,
    stfiOpted,
    tplLimit,
    surroundingPropertyLimit,
    machines,
    expressFreightPercent,
    airFreightSi,
    eeiHardwareCrv,
    eeiIsPortable,
    eeiDataMediaSi,
    eeiIcowMonths,
    eeiIcowSi,
    bppVesselType,
    bppHeatingSurface,
    bppOperatingPressure,
    bppReplacementValue,
    bppTplLimit,
  ]);

  // Handle FAR applied
  const handleApplyAssets = (items: FarItem[], rollup: FarRollupSummary) => {
    setIsFarLoaded(true);
    setUploadedFarItems(items);
    setFarRollup(rollup);

    // Auto-populate plant/machinery or building works if in CAR/EAR mode
    if (rollup.buildingCrv > 0) {
      setCivilWorksValue(rollup.buildingCrv);
    }
    if (rollup.plantMachineryCrv > 0) {
      setPlantMachineryValue(rollup.plantMachineryCrv);
    }

    // If there are plant items, populate into machinery schedule for MB
    const plantItems = items.filter((it) => it.category === 'plant_machinery');
    if (plantItems.length > 0) {
      const newMachines: MbMachineItem[] = plantItems.map((it, idx) => ({
        machine_id: it.asset_code,
        tariff_group: ((idx % 4) + 1) as 1 | 2 | 3 | 4,
        current_replacement_value: it.current_replacement_value,
      }));
      setMachines(newMachines);
    }
  };

  // Add / Remove machine in MB schedule
  const handleAddMachine = () => {
    const newId = `MC-${(machines.length + 1).toString().padStart(3, '0')}`;
    setMachines([...machines, { machine_id: newId, tariff_group: 2, current_replacement_value: 5000000 }]);
  };

  const handleRemoveMachine = (idx: number) => {
    setMachines(machines.filter((_, i) => i !== idx));
  };

  const handleUpdateMachine = (idx: number, field: keyof MbMachineItem, val: any) => {
    const updated = [...machines];
    (updated[idx] as any)[field] = val;
    setMachines(updated);
  };

  // Generate & Download PDF
  const handleDownloadPdf = () => {
    const quoteData: EngineeringQuoteData = {
      quote_number: `QT-ENG-${Date.now().toString().slice(-6)}`,
      client_name: clientInfo.clientName || 'Commercial Infrastructure Client',
      client_gst: clientInfo.clientGst || '27AAAAA0000A1Z5',
      client_address: clientInfo.clientAddress || 'Corporate Office, Mumbai',
      contractor_name: contractorName,
      principal_name: principalName,
      hypothecation_bank: clientInfo.hypothecationBank || 'State Bank of India',
      site_location: siteLocation,
      sub_line: subLine,
      project_name: projectName,
      project_type: subLine === 'ear' ? 'ear' : 'car',
      contract_period_months: contractPeriodMonths,
      testing_period_months: testingPeriodMonths,
      dlp_maintenance_months: dlpMaintenanceMonths,
      eq_zone: eqZone,
      stfi_opted: stfiOpted,
      civil_works_value: civilWorksValue,
      plant_machinery_value: plantMachineryValue,
      tpl_limit: tplLimit,
      surrounding_property_limit: surroundingPropertyLimit,
      machinery_summary: {
        total_machines: machines.length,
        total_crv: calculation.mbTotalCrv,
        groups_count: {
          1: machines.filter((m) => m.tariff_group === 1).length,
          2: machines.filter((m) => m.tariff_group === 2).length,
          3: machines.filter((m) => m.tariff_group === 3).length,
          4: machines.filter((m) => m.tariff_group === 4).length,
        },
      },
      eei_summary: {
        hardware_crv: eeiHardwareCrv,
        is_portable_laptop: eeiIsPortable,
        data_media_si: eeiDataMediaSi,
        icow_si: eeiIcowSi,
        icow_months: eeiIcowMonths,
      },
      bpp_summary: {
        vessel_type: bppVesselType,
        heating_surface_sqm: bppHeatingSurface,
        operating_pressure_bar: bppOperatingPressure,
        replacement_value: bppReplacementValue,
      },
      calculation: {
        sum_insured: calculation.totalInsuredValue,
        base_works_premium: calculation.baseWorksPrem,
        testing_premium: calculation.testingPrem,
        maintenance_premium: calculation.maintPrem,
        perils_premium: calculation.perilsPrem + calculation.stfiPrem,
        mb_premium: calculation.mbNetPrem + calculation.mbExpressFreight + calculation.mbAirFreight,
        eei_premium: calculation.eeiNetPrem,
        bpp_premium: calculation.bppNetPrem,
        extensions_premium: calculation.surroundingPrem + calculation.projectTplPrem,
        net_premium: calculation.netEngineeringPremium,
        gst_amount: calculation.gstAmount,
        total_premium: calculation.totalPremiumPayable,
      },
    };

    downloadEngineeringQuotePDF(quoteData, currentWorkspace || undefined);
  };

  // Save Quote Action
  const handleSave = async () => {
    const quoteNumber = `QT-ENG-${Date.now().toString().slice(-6)}`;

    const riskDetails: EngineeringRiskDetails = {
      sub_line: subLine,
      project_name: projectName,
      contractor_name: contractorName,
      principal_name: principalName,
      site_location: siteLocation,
      contract_period_months: contractPeriodMonths,
      testing_period_months: testingPeriodMonths,
      dlp_maintenance_months: dlpMaintenanceMonths,
      eq_zone: eqZone,
      stfi_opted: stfiOpted,
      civil_works_value: civilWorksValue,
      plant_machinery_value: plantMachineryValue,
      tpl_limit: tplLimit,
      surrounding_property_limit: surroundingPropertyLimit,
      machinery_items: machines,
      eei_details: {
        section1_hardware_crv: eeiHardwareCrv,
        is_portable_laptop: eeiIsPortable,
        section2_data_media_si: eeiDataMediaSi,
        section3_icow_months: eeiIcowMonths,
        section3_icow_si: eeiIcowSi,
      },
      bpp_details: {
        vessel_type: bppVesselType,
        heating_surface_sqm: bppHeatingSurface,
        operating_pressure_bar: bppOperatingPressure,
        replacement_value: bppReplacementValue,
        tpl_limit: bppTplLimit,
      },
      far_summary: farRollup
        ? {
            total_assets: farRollup.totalAssets,
            building_crv: farRollup.buildingCrv,
            plant_machinery_crv: farRollup.plantMachineryCrv,
            furniture_crv: farRollup.furnitureCrv,
            stocks_crv: farRollup.stocksCrv,
            total_crv: farRollup.totalReplacementValue,
            underinsurance_ratio: farRollup.underinsuranceRatio,
          }
        : undefined,
    };

    // Calculate StandardQuoteBreakdown
    const standardBreakdown = calculateEngineeringQuote({
      sub_line: subLine,
      car_ear_input: {
        project_type: subLine === 'ear' ? 'ear' : 'car',
        civil_works_value: civilWorksValue,
        plant_machinery_value: plantMachineryValue,
        contract_period_months: contractPeriodMonths,
        testing_period_months: testingPeriodMonths,
        dlp_maintenance_months: dlpMaintenanceMonths,
        eq_zone: eqZone,
        stfi_opted: stfiOpted,
        tpl_limit: tplLimit,
        surrounding_property_limit: surroundingPropertyLimit,
      },
      mb_input: {
        machines,
        express_freight_percent: expressFreightPercent,
        air_freight_si: airFreightSi,
        surrounding_property_limit: surroundingPropertyLimit,
      },
      eei_input: {
        section1_hardware_crv: eeiHardwareCrv,
        is_portable_laptop: eeiIsPortable,
        section2_data_media_si: eeiDataMediaSi,
        section3_icow_months: eeiIcowMonths,
        section3_icow_si: eeiIcowSi,
      },
      bpp_input: {
        vessel_type: bppVesselType,
        heating_surface_sqm: bppHeatingSurface,
        operating_pressure_bar: bppOperatingPressure,
        replacement_value: bppReplacementValue,
        tpl_limit: bppTplLimit,
        surrounding_property_limit: surroundingPropertyLimit,
      },
    });

    const quotePayload: Partial<Quote> = {
      quote_number: quoteNumber,
      client_name: clientInfo.clientName || 'Infrastructure Client',
      client_gst: clientInfo.clientGst,
      lob_category: 'engineering',
      insurance_line: subLine === 'package' ? 'car' : subLine,
      sum_insured: calculation.totalInsuredValue,
      sum_insured_breakdown: {
        civil_works_si: civilWorksValue,
        plant_machinery_si: plantMachineryValue,
        machinery_crv: calculation.mbTotalCrv,
        eei_hardware_crv: eeiHardwareCrv,
        bpp_replacement_value: bppReplacementValue,
      },
      premium: calculation.netEngineeringPremium,
      gst_amount: calculation.gstAmount,
      total_premium: calculation.totalPremiumPayable,
      policy_rate: parseFloat(calculation.aggregateRatePerMille),
      status: 'draft',
      ai_confidence: 0.99,
      calculation_breakdown: standardBreakdown,
      risk_details: riskDetails,
    };

    await onSaveQuote(quotePayload);
  };

  return (
    <div className="space-y-6">
      {/* Mobile Tab Switcher */}
      <div className="lg:hidden flex items-center justify-between p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
        <button
          type="button"
          onClick={() => setActiveMobileTab('scope')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
            activeMobileTab === 'scope'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          1. Scope &amp; Assets
        </button>
        <button
          type="button"
          onClick={() => setActiveMobileTab('perils')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
            activeMobileTab === 'perils'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          2. Perils &amp; Extensions
        </button>
        <button
          type="button"
          onClick={() => setActiveMobileTab('ledger')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
            activeMobileTab === 'ledger'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          3. Live Ledger
        </button>
      </div>

      {/* 3-Column Glassmorphic Studio Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ==================================================================== */}
        {/* COLUMN 1: Sub-line Selection, Project Details & Asset Schedules      */}
        {/* ==================================================================== */}
        <div
          className={`lg:col-span-4 space-y-5 ${
            activeMobileTab === 'scope' ? 'block' : 'hidden lg:block'
          }`}
        >
          {/* Sub-line Navigation Tabs */}
          <div className="p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-wrap gap-1">
            {[
              { id: 'car', label: 'CAR (Civil)', icon: Building },
              { id: 'ear', label: 'EAR (Erection)', icon: Wrench },
              { id: 'mb', label: 'MB (Machinery)', icon: Cpu },
              { id: 'eei', label: 'EEI (Electronics)', icon: Laptop },
              { id: 'bpp', label: 'BPP (Boilers)', icon: Flame },
              { id: 'package', label: 'Package', icon: Layers },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = subLine === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSubLine(tab.id as any)}
                  className={`flex-1 min-w-[75px] py-2 px-2 text-xs font-semibold rounded-xl transition flex flex-col items-center gap-1 ${
                    isActive
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Project Details Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <HardHat className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Project Scope &amp; Parties</h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Project Name</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-slate-900 dark:text-white"
                  placeholder="e.g. Metro Line Phase 2"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">EPC / Main Contractor</label>
                <input
                  type="text"
                  value={contractorName}
                  onChange={(e) => setContractorName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-slate-900 dark:text-white"
                  placeholder="e.g. Larsen & Toubro"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Site Location</label>
                <input
                  type="text"
                  value={siteLocation}
                  onChange={(e) => setSiteLocation(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-slate-900 dark:text-white"
                  placeholder="e.g. Plot 4B, Industrial Corridor"
                />
              </div>
            </div>
          </div>

          {/* Fixed Asset Register Trigger & Rollup Card */}
          <div className="p-5 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  Fixed Asset Register (FAR)
                </h4>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 font-semibold">
                Feature 24
              </span>
            </div>

            <p className="text-xs text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
              Upload fixed asset register CSV/TSV to extract verified Current Replacement Values (CRV) and audit underinsurance.
            </p>

            {isFarLoaded && farRollup ? (
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-800 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Total Ingested Assets:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{farRollup.validAssets}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Total Replacement Value:</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    ₹{formatNumberINR(farRollup.totalReplacementValue)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Underinsurance Ratio:</span>
                  <span
                    className={`font-bold ${
                      farRollup.underinsuranceRatio < 0.7 ? 'text-red-500' : 'text-emerald-500'
                    }`}
                  >
                    {(farRollup.underinsuranceRatio * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => setIsFarUploaderOpen(true)}
              className="w-full py-2 px-3 text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-100/80 hover:bg-amber-200/80 dark:bg-amber-900/40 dark:hover:bg-amber-900/60 rounded-xl border border-amber-300/60 dark:border-amber-700/60 transition flex items-center justify-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              {isFarLoaded ? 'Re-upload Asset Register' : 'Ingest Fixed Asset Register (CSV)'}
            </button>
          </div>

          {/* Sub-line Works Values Inputs */}
          {(subLine === 'car' || subLine === 'ear' || subLine === 'package') && (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Works Sum Insured &amp; Duration
                </h4>
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                  {contractPeriodMonths} mos (x{Math.max(1, contractPeriodMonths / 12).toFixed(2)})
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                    <span>Civil Engineering Works (1.20‰)</span>
                    <span>₹{formatNumberINR(civilWorksValue)}</span>
                  </div>
                  <input
                    type="range"
                    min="10000000"
                    max="1000000000"
                    step="10000000"
                    value={civilWorksValue}
                    onChange={(e) => setCivilWorksValue(Number(e.target.value))}
                    className="w-full mt-2 accent-amber-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                    <span>Plant &amp; Machinery Erection (1.80‰)</span>
                    <span>₹{formatNumberINR(plantMachineryValue)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="500000000"
                    step="5000000"
                    value={plantMachineryValue}
                    onChange={(e) => setPlantMachineryValue(Number(e.target.value))}
                    className="w-full mt-2 accent-amber-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                    <span>Contract Period</span>
                    <span>{contractPeriodMonths} Months</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="60"
                    step="1"
                    value={contractPeriodMonths}
                    onChange={(e) => setContractPeriodMonths(Number(e.target.value))}
                    className="w-full mt-2 accent-amber-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Machinery Breakdown List Editor */}
          {(subLine === 'mb' || subLine === 'package') && (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-amber-500" />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Machinery Schedule (Groups I-IV)
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={handleAddMachine}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition"
                >
                  <Plus className="w-3 h-3" />
                  Add
                </button>
              </div>

              <div className="space-y-2 max-h-[220px] overflow-y-auto">
                {machines.map((machine, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-2 text-xs"
                  >
                    <input
                      type="text"
                      value={machine.machine_id}
                      onChange={(e) => handleUpdateMachine(idx, 'machine_id', e.target.value)}
                      className="w-20 px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-900 dark:text-white font-mono"
                    />
                    <select
                      value={machine.tariff_group}
                      onChange={(e) => handleUpdateMachine(idx, 'tariff_group', Number(e.target.value))}
                      className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-900 dark:text-white font-medium"
                    >
                      <option value={1}>Group 1 (0.90%)</option>
                      <option value={2}>Group 2 (1.50%)</option>
                      <option value={3}>Group 3 (2.50%)</option>
                      <option value={4}>Group 4 (4.00%)</option>
                    </select>
                    <input
                      type="number"
                      value={machine.current_replacement_value}
                      onChange={(e) =>
                        handleUpdateMachine(idx, 'current_replacement_value', Number(e.target.value))
                      }
                      className="w-28 px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-900 dark:text-white text-right font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveMachine(idx)}
                      className="p-1 text-slate-400 hover:text-red-500 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Electronic Equipment (EEI) Section Inputs */}
          {(subLine === 'eei' || subLine === 'package') && (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <Laptop className="w-4 h-4 text-amber-500" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Electronic Equipment (EEI)
                </h4>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                    <span>Section 1 Hardware CRV</span>
                    <span>₹{formatNumberINR(eeiHardwareCrv)}</span>
                  </div>
                  <input
                    type="range"
                    min="1000000"
                    max="100000000"
                    step="1000000"
                    value={eeiHardwareCrv}
                    onChange={(e) => setEeiHardwareCrv(Number(e.target.value))}
                    className="w-full mt-2 accent-amber-500"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      id="portable_laptop"
                      checked={eeiIsPortable}
                      onChange={(e) => setEeiIsPortable(e.target.checked)}
                      className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                    />
                    <label htmlFor="portable_laptop" className="text-xs text-slate-600 dark:text-slate-300">
                      Worldwide Portable Equipment Loading (+2.50% / Total 3.75%)
                    </label>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                    <span>Section 2 Data Media SI (3.00%)</span>
                    <span>₹{formatNumberINR(eeiDataMediaSi)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20000000"
                    step="500000"
                    value={eeiDataMediaSi}
                    onChange={(e) => setEeiDataMediaSi(Number(e.target.value))}
                    className="w-full mt-2 accent-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">ICOW Indemnity</label>
                    <select
                      value={eeiIcowMonths}
                      onChange={(e) => setEeiIcowMonths(Number(e.target.value) as any)}
                      className="w-full mt-1 px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                    >
                      <option value={3}>3 Months (1.50%)</option>
                      <option value={6}>6 Months (2.50%)</option>
                      <option value={12}>12 Months (4.00%)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">ICOW Sum Insured</label>
                    <input
                      type="number"
                      value={eeiIcowSi}
                      onChange={(e) => setEeiIcowSi(Number(e.target.value))}
                      className="w-full mt-1 px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Boiler & Pressure Plant (BPP) Section Inputs */}
          {(subLine === 'bpp' || subLine === 'package') && (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <Flame className="w-4 h-4 text-amber-500" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Boiler &amp; Pressure Plant (BPP)
                </h4>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Vessel Type</label>
                    <select
                      value={bppVesselType}
                      onChange={(e) => setBppVesselType(e.target.value as any)}
                      className="w-full mt-1 px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                    >
                      <option value="fire_tube">Fire Tube (0.75%)</option>
                      <option value="water_tube">Water Tube (1.00%)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Operating Pressure (bar)
                    </label>
                    <input
                      type="number"
                      value={bppOperatingPressure}
                      onChange={(e) => setBppOperatingPressure(Number(e.target.value))}
                      className="w-full mt-1 px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                    <span>Vessel Replacement Value</span>
                    <span>₹{formatNumberINR(bppReplacementValue)}</span>
                  </div>
                  <input
                    type="range"
                    min="1000000"
                    max="100000000"
                    step="1000000"
                    value={bppReplacementValue}
                    onChange={(e) => setBppReplacementValue(Number(e.target.value))}
                    className="w-full mt-2 accent-amber-500"
                  />
                </div>

                {bppOperatingPressure > 20 && (
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>Operating pressure &gt; 20 bar triggers statutory +20% high-pressure surcharge.</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ==================================================================== */}
        {/* COLUMN 2: Peril & Policy Options Customizer                          */}
        {/* ==================================================================== */}
        <div
          className={`lg:col-span-4 space-y-5 ${
            activeMobileTab === 'perils' ? 'block' : 'hidden lg:block'
          }`}
        >
          {/* EAR Testing Period */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-500" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  EAR Testing Period Loading
                </h4>
              </div>
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                {testingPeriodMonths} Months ({testingPeriodMonths > 1 ? `${testingPeriodMonths - 1} loaded` : '1st free'})
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              First month of erection testing is included free. Extra months loaded at 0.75‰/month on plant sum insured.
            </p>

            <input
              type="range"
              min="0"
              max="12"
              step="1"
              value={testingPeriodMonths}
              onChange={(e) => setTestingPeriodMonths(Number(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>

          {/* Defect Liability Maintenance Cover */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-500" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Defect Liability Period (DLP)
                </h4>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 0, label: 'None', desc: 'No DLP' },
                { val: 12, label: '12 Mos', desc: '+15% Base' },
                { val: 24, label: '24 Mos', desc: '+25% Base' },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setDlpMaintenanceMonths(opt.val)}
                  className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                    dlpMaintenanceMonths === opt.val
                      ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span className="text-xs">{opt.label}</span>
                  <span className="text-[10px] opacity-75">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* AOG Perils & Seismic Zones */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-500" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Act of God (AOG) Seismic Zones
                </h4>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { zone: 1, label: 'Zone 1 (Severe)', rate: '0.50‰' },
                { zone: 2, label: 'Zone 2 (High)', rate: '0.35‰' },
                { zone: 3, label: 'Zone 3 (Moderate)', rate: '0.25‰' },
                { zone: 4, label: 'Zone 4 (Low)', rate: '0.10‰' },
              ].map((item) => (
                <button
                  key={item.zone}
                  type="button"
                  onClick={() => setEqZone(item.zone as any)}
                  className={`p-3 rounded-xl border text-left transition flex justify-between items-center ${
                    eqZone === item.zone
                      ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div>
                    <div className="text-xs">{item.label}</div>
                    <div className="text-[10px] opacity-75 font-mono">{item.rate}</div>
                  </div>
                  {eqZone === item.zone && <Check className="w-4 h-4 text-amber-600" />}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="stfi_toggle"
                  checked={stfiOpted}
                  onChange={(e) => setStfiOpted(e.target.checked)}
                  className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="stfi_toggle" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Storm, Tempest, Flood &amp; Inundation (STFI @ 0.15‰)
                </label>
              </div>
              <span className="text-xs font-mono font-semibold text-amber-600 dark:text-amber-400">
                ₹{formatNumberINR(calculation.stfiPrem)}
              </span>
            </div>
          </div>

          {/* Extensions: Surrounding Property & TPL */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
              Third Party Liability &amp; Surrounding Property
            </h4>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                <span>Third Party Liability (TPL) Limit</span>
                <span>₹{formatNumberINR(tplLimit)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="50000000"
                step="2500000"
                value={tplLimit}
                onChange={(e) => setTplLimit(Number(e.target.value))}
                className="w-full mt-2 accent-amber-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                <span>Surrounding Property Damage Limit</span>
                <span>₹{formatNumberINR(surroundingPropertyLimit)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="25000000"
                step="1000000"
                value={surroundingPropertyLimit}
                onChange={(e) => setSurroundingPropertyLimit(Number(e.target.value))}
                className="w-full mt-2 accent-amber-500"
              />
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* COLUMN 3: Live Calculation Ledger & Primary Actions                  */}
        {/* ==================================================================== */}
        <div
          className={`lg:col-span-4 space-y-5 ${
            activeMobileTab === 'ledger' ? 'block' : 'hidden lg:block'
          }`}
        >
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-5 sticky top-6">
            {/* Ledger Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                  Live Tariff Computation
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Engineering Premium Ledger
                </h3>
              </div>
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                <Zap className="w-4 h-4" />
              </div>
            </div>

            {/* Metric Highlights */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="text-[10px] font-semibold text-slate-500">Total Project Exposure</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                  ₹{formatNumberINR(calculation.totalInsuredValue)}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="text-[10px] font-semibold text-slate-500">Aggregate Rate</div>
                <div className="text-sm font-bold text-amber-600 dark:text-amber-400 font-mono mt-0.5">
                  {calculation.aggregateRatePerMille} ‰
                </div>
              </div>
            </div>

            {/* 10-Row Itemized Ledger */}
            <div className="space-y-2 text-xs divide-y divide-slate-100 dark:divide-slate-800">
              <div className="flex justify-between py-1.5 text-slate-600 dark:text-slate-300">
                <span>Civil &amp; Erection Base Works</span>
                <span className="font-mono font-semibold">₹{formatNumberINR(calculation.baseWorksPrem)}</span>
              </div>

              <div className="flex justify-between py-1.5 text-slate-600 dark:text-slate-300">
                <span>Testing Period Premium</span>
                <span className="font-mono font-semibold">₹{formatNumberINR(calculation.testingPrem)}</span>
              </div>

              <div className="flex justify-between py-1.5 text-slate-600 dark:text-slate-300">
                <span>DLP Maintenance Loading</span>
                <span className="font-mono font-semibold">₹{formatNumberINR(calculation.maintPrem)}</span>
              </div>

              <div className="flex justify-between py-1.5 text-slate-600 dark:text-slate-300">
                <span>AOG Seismic &amp; STFI Perils</span>
                <span className="font-mono font-semibold">
                  ₹{formatNumberINR(calculation.perilsPrem + calculation.stfiPrem)}
                </span>
              </div>

              <div className="flex justify-between py-1.5 text-slate-600 dark:text-slate-300">
                <span>Machinery Breakdown (Groups I-IV)</span>
                <span className="font-mono font-semibold">
                  ₹{formatNumberINR(calculation.mbNetPrem + calculation.mbExpressFreight + calculation.mbAirFreight)}
                </span>
              </div>

              <div className="flex justify-between py-1.5 text-slate-600 dark:text-slate-300">
                <span>Electronic Equipment (Hardware/Media)</span>
                <span className="font-mono font-semibold">₹{formatNumberINR(calculation.eeiNetPrem)}</span>
              </div>

              <div className="flex justify-between py-1.5 text-slate-600 dark:text-slate-300">
                <span>Boiler &amp; Pressure Plant (Explosion)</span>
                <span className="font-mono font-semibold">₹{formatNumberINR(calculation.bppNetPrem)}</span>
              </div>

              <div className="flex justify-between py-1.5 text-slate-600 dark:text-slate-300">
                <span>Surrounding Property &amp; TPL</span>
                <span className="font-mono font-semibold">
                  ₹{formatNumberINR(calculation.surroundingPrem + calculation.projectTplPrem)}
                </span>
              </div>

              <div className="flex justify-between py-2 font-bold text-slate-900 dark:text-white border-t-2 border-slate-200 dark:border-slate-700">
                <span>Net Engineering Premium</span>
                <span className="font-mono text-sm">₹{formatNumberINR(calculation.netEngineeringPremium)}</span>
              </div>

              <div className="flex justify-between py-1.5 text-slate-500 dark:text-slate-400">
                <span>Goods &amp; Services Tax (GST 18%)</span>
                <span className="font-mono font-semibold">₹{formatNumberINR(calculation.gstAmount)}</span>
              </div>
            </div>

            {/* Total Premium Banner */}
            <div className="p-4 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest">
                  Total Premium Payable
                </div>
                <div className="text-xl font-extrabold text-amber-600 dark:text-amber-300 font-mono mt-0.5">
                  ₹{formatNumberINR(calculation.totalPremiumPayable)}
                </div>
              </div>
              <div className="text-right text-[11px] text-amber-800/80 dark:text-amber-300/80 font-medium">
                Annual / Project Term
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="w-full py-2.5 px-4 text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 rounded-xl border border-amber-200 dark:border-amber-800 transition flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Engineering Quote Slip (PDF)
              </button>

              <button
                type="button"
                disabled={isSubmitting || calculation.totalPremiumPayable <= 0}
                onClick={handleSave}
                className="w-full py-3 px-4 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-amber-600/25 transition flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isSubmitting ? 'Saving Quote...' : 'Save Engineering Quote'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Asset Register Modal */}
      <FixedAssetRegisterUploader
        isOpen={isFarUploaderOpen}
        onClose={() => setIsFarUploaderOpen(false)}
        onApplyAssets={handleApplyAssets}
      />
    </div>
  );
};
