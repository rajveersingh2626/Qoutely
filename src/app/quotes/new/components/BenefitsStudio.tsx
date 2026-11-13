'use client';

import React, { useState, useMemo } from 'react';
import {
  Heart,
  Users,
  Shield,
  Briefcase,
  Activity,
  FileSpreadsheet,
  Check,
  Download,
  Save,
  AlertTriangle,
  Info,
  ChevronRight,
  RefreshCw,
  Plus,
  Sliders,
  DollarSign,
  UserCheck,
} from 'lucide-react';
import { formatNumberINR, formatINRWithDecimals } from '@/lib/calculator';
import {
  EmployeeCensusUploader,
  ParsedCensusMember,
  CensusRollupSummary,
} from '../uploaders/EmployeeCensusUploader';
import { downloadBenefitsQuotePDF, BenefitsQuoteData } from '@/lib/pdf/benefits-pdf';
import { useWorkspace } from '@/context/WorkspaceContext';
import {
  calculateGhiDemographicPremium,
  calculateGhiBenefitLoadings,
  calculateGtliPremium,
  calculateGpaPremium,
  calculateWorkmensCompensation,
  calculateBenefitsQuote,
  GhiAgeBandCount,
  RoomRentOption,
  CensusRow,
} from '@/lib/engines/benefits-engine';
import { Quote, EmployeeBenefitsRiskDetails } from '@/types/database';

interface BenefitsStudioProps {
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

const DEFAULT_SAMPLE_AGE_BANDS: GhiAgeBandCount = {
  age_0_25: 10,
  age_26_35: 20,
  age_36_45: 12,
  age_46_55: 5,
  age_56_65: 3,
  age_66_75: 0,
  age_76_plus: 0,
};

const DEFAULT_SAMPLE_ROWS: CensusRow[] = [
  ...Array(10).fill(null).map((_, i) => ({
    employee_id: `EMP-${(i + 1).toString().padStart(3, '0')}`,
    name: `Junior Engineer ${i + 1}`,
    age: 24,
    gender: 'M' as const,
    relationship: 'self' as const,
    monthly_salary: 35000,
  })),
  ...Array(15).fill(null).map((_, i) => ({
    employee_id: `EMP-${(i + 11).toString().padStart(3, '0')}`,
    name: `Senior Associate ${i + 1}`,
    age: 31,
    gender: (i % 2 === 0 ? 'F' : 'M') as 'F' | 'M',
    relationship: 'self' as const,
    monthly_salary: 55000,
  })),
  ...Array(5).fill(null).map((_, i) => ({
    employee_id: `EMP-${(i + 26).toString().padStart(3, '0')}`,
    name: `Lead Architect ${i + 1}`,
    age: 41,
    gender: 'M' as const,
    relationship: 'self' as const,
    monthly_salary: 95000,
  })),
  ...Array(5).fill(null).map((_, i) => ({
    employee_id: `EMP-${(i + 11).toString().padStart(3, '0')}`,
    name: `Spouse ${i + 1}`,
    age: 30,
    gender: 'M' as const,
    relationship: 'spouse' as const,
  })),
  ...Array(12).fill(null).map((_, i) => ({
    employee_id: `EMP-${(i + 1).toString().padStart(3, '0')}`,
    name: `Dependent Child ${i + 1}`,
    age: 6,
    gender: 'F' as const,
    relationship: 'child' as const,
  })),
  ...Array(3).fill(null).map((_, i) => ({
    employee_id: `EMP-${(i + 26).toString().padStart(3, '0')}`,
    name: `Dependent Parent ${i + 1}`,
    age: 62,
    gender: 'F' as const,
    relationship: 'parent' as const,
  })),
];

export const BenefitsStudio: React.FC<BenefitsStudioProps> = ({
  clientInfo,
  onClientInfoChange,
  onSaveQuote,
  isSubmitting = false,
}) => {
  const { currentWorkspace } = useWorkspace();

  // Mobile navigation tab: 'census' | 'coverage' | 'ledger'
  const [activeMobileTab, setActiveMobileTab] = useState<'census' | 'coverage' | 'ledger'>('census');

  // Census Ingestion State
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const [isCensusLoaded, setIsCensusLoaded] = useState(false);
  const [uploadedCensus, setUploadedCensus] = useState<ParsedCensusMember[]>([]);
  const [censusRollup, setCensusRollup] = useState<CensusRollupSummary | null>(null);

  // Manual demographic age bands (used when no external CSV is ingested)
  const [manualAgeBands, setManualAgeBands] = useState<GhiAgeBandCount>(DEFAULT_SAMPLE_AGE_BANDS);
  const [familyStructure, setFamilyStructure] = useState<'1+0' | '1+3' | '1+5'>('1+3');

  // --------------------------------------------------------------------------
  // Coverage Customizer Parameters (Column 2)
  // --------------------------------------------------------------------------

  // 1. Group Health (GHI)
  const [ghiBaseSumInsured, setGhiBaseSumInsured] = useState<number>(500000); // 5 Lakhs default
  const [roomRent, setRoomRent] = useState<RoomRentOption>('standard_1_percent');
  const [maternityOpted, setMaternityOpted] = useState<boolean>(true);
  const [maternityDay1Waiver, setMaternityDay1Waiver] = useState<boolean>(true);
  const [pedWaiverDay1, setPedWaiverDay1] = useState<boolean>(true);
  const [corporateBufferAmount, setCorporateBufferAmount] = useState<number>(0);
  const [tpaName, setTpaName] = useState<string>('Medi Assist TPA / Vidal Health TPA');

  // 2. Group Term Life (GTLI)
  const [isGtliOpted, setIsGtliOpted] = useState<boolean>(true);
  const [gtliSumInsured, setGtliSumInsured] = useState<number>(2000000); // 20 Lakhs default
  const [gtliHazardClass, setGtliHazardClass] = useState<1 | 2 | 3>(1);
  const [gtliFreeCoverLimit, setGtliFreeCoverLimit] = useState<number>(5000000); // 50 Lakhs default FCL

  // 3. Group Personal Accident (GPA)
  const [isGpaOpted, setIsGpaOpted] = useState<boolean>(true);
  const [gpaSumInsured, setGpaSumInsured] = useState<number>(1000000); // 10 Lakhs default
  const [gpaHazardClass, setGpaHazardClass] = useState<1 | 2 | 3>(1);
  const [gpaTtdOpted, setGpaTtdOpted] = useState<boolean>(true);
  const [gpaMedicalOpted, setGpaMedicalOpted] = useState<boolean>(true);

  // 4. Statutory Workmen's Compensation (WC) under EC Act 1923
  const [isWcOpted, setIsWcOpted] = useState<boolean>(true);
  const [wcTradeHazardRate, setWcTradeHazardRate] = useState<number>(0.35); // 0.35% for Light Mfg / Office
  const [wcMedicalOpted, setWcMedicalOpted] = useState<boolean>(true);

  // --------------------------------------------------------------------------
  // DETERMINISTIC CALCULATION (ZERO LLM ARITHMETIC)
  // --------------------------------------------------------------------------
  const calculation = useMemo(() => {
    const ageBands = isCensusLoaded && censusRollup ? censusRollup.ageBands : manualAgeBands;
    const totalLives =
      ageBands.age_0_25 +
      ageBands.age_26_35 +
      ageBands.age_36_45 +
      ageBands.age_46_55 +
      ageBands.age_56_65 +
      ageBands.age_66_75 +
      ageBands.age_76_plus;

    const employeeCount = isCensusLoaded && censusRollup ? censusRollup.employeeCount : 30;
    const dependentCount = isCensusLoaded && censusRollup ? censusRollup.dependentCount : 20;

    const monthlyWageRoll = isCensusLoaded && censusRollup
      ? censusRollup.totalMonthlyWageRoll
      : employeeCount * 45000;
    const annualWageRoll = monthlyWageRoll * 12;

    // 1. GHI Pure Demographic Premium
    const ghiDemo = calculateGhiDemographicPremium(ageBands, ghiBaseSumInsured);

    // 2. GHI Loadings & Corporate Buffer
    // Safety check: only apply buffer if group size >= 50
    const safeBufferAmount = totalLives >= 50 ? corporateBufferAmount : 0;
    const ghiLoaded = calculateGhiBenefitLoadings(ghiDemo.pure_risk_premium, {
      room_rent: roomRent,
      maternity_opted: maternityOpted,
      maternity_day_1_waiver: maternityDay1Waiver,
      ped_waiver_day_1: pedWaiverDay1,
      corporate_buffer_amount: safeBufferAmount,
      group_size: totalLives,
    });

    // 3. GTLI Life Premium
    let gtliRes = {
      total_members: 0,
      total_sum_insured: 0,
      total_gtli_premium: 0,
      members_requiring_medical: 0,
    };

    if (isGtliOpted) {
      const gtliMembers =
        isCensusLoaded && uploadedCensus.length > 0
          ? uploadedCensus
              .filter((m) => m.relationship === 'self' && m.isValid)
              .map((m) => ({
                age: m.age,
                sum_insured: gtliSumInsured,
                hazard_class: gtliHazardClass,
              }))
          : DEFAULT_SAMPLE_ROWS.filter((r) => r.relationship === 'self').map((r) => ({
              age: r.age,
              sum_insured: gtliSumInsured,
              hazard_class: gtliHazardClass,
            }));

      if (gtliMembers.length > 0) {
        gtliRes = calculateGtliPremium(gtliMembers, gtliFreeCoverLimit);
      }
    }

    // 4. GPA Accident Premium
    let gpaRes = {
      rate_per_mille: 0.35,
      base_gpa_premium: 0,
      ttd_premium: 0,
      medical_premium: 0,
      total_gpa_premium: 0,
    };

    if (isGpaOpted) {
      gpaRes = calculateGpaPremium({
        sum_insured_per_life: gpaSumInsured,
        headcount: employeeCount,
        hazard_class: gpaHazardClass,
        ttd_opted: gpaTtdOpted,
        medical_extension_opted: gpaMedicalOpted,
      });
    }

    // 5. Statutory WC Liability
    let wcRes = {
      total_workers: 0,
      total_annual_wageroll: 0,
      statutory_death_liability: 0,
      statutory_ptd_liability: 0,
      net_wc_premium: 0,
    };

    if (isWcOpted) {
      const workers =
        isCensusLoaded && uploadedCensus.length > 0
          ? uploadedCensus
              .filter((m) => m.relationship === 'self' && m.isValid)
              .map((m) => ({
                age: m.age,
                monthly_wage: m.monthlySalary || 35000,
              }))
          : DEFAULT_SAMPLE_ROWS.filter((r) => r.relationship === 'self').map((r) => ({
              age: r.age,
              monthly_wage: r.monthly_salary || 35000,
            }));

      if (workers.length > 0) {
        wcRes = calculateWorkmensCompensation({
          workers,
          trade_hazard_rate_percent: wcTradeHazardRate,
          medical_extension_opted: wcMedicalOpted,
        });
      }
    }

    const netPackagePremium =
      ghiLoaded.total_ghi_premium +
      (isGtliOpted ? gtliRes.total_gtli_premium : 0) +
      (isGpaOpted ? gpaRes.total_gpa_premium : 0) +
      (isWcOpted ? wcRes.net_wc_premium : 0);

    const gstAmount = Math.round(netPackagePremium * 0.18);
    const totalPayable = netPackagePremium + gstAmount;

    return {
      totalLives,
      employeeCount,
      dependentCount,
      monthlyWageRoll,
      annualWageRoll,
      ageBands,
      ghiPurePremium: ghiDemo.pure_risk_premium,
      ghiLoadingPercent: ghiLoaded.loading_percent,
      ghiLoadingAmount: ghiLoaded.loaded_premium - ghiDemo.pure_risk_premium,
      ghiBufferPremium: ghiLoaded.corporate_buffer_premium,
      ghiTotalPremium: ghiLoaded.total_ghi_premium,
      siScalingFactor: ghiDemo.si_scaling_factor,
      gtliPremium: isGtliOpted ? gtliRes.total_gtli_premium : 0,
      gtliTotalSumInsured: isGtliOpted ? gtliRes.total_sum_insured : 0,
      gtliMedicalCount: isGtliOpted ? gtliRes.members_requiring_medical : 0,
      gpaPremium: isGpaOpted ? gpaRes.total_gpa_premium : 0,
      gpaTotalSumInsured: isGpaOpted ? gpaSumInsured * employeeCount : 0,
      wcPremium: isWcOpted ? wcRes.net_wc_premium : 0,
      wcTotalDeathLiability: isWcOpted ? wcRes.statutory_death_liability : 0,
      wcTotalPtdLiability: isWcOpted ? wcRes.statutory_ptd_liability : 0,
      netPackagePremium,
      gstAmount,
      totalPayable,
      costPerEmployee: Math.round(totalPayable / Math.max(1, employeeCount)),
      costPerLife: Math.round(totalPayable / Math.max(1, totalLives)),
    };
  }, [
    isCensusLoaded,
    uploadedCensus,
    censusRollup,
    manualAgeBands,
    ghiBaseSumInsured,
    roomRent,
    maternityOpted,
    maternityDay1Waiver,
    pedWaiverDay1,
    corporateBufferAmount,
    isGtliOpted,
    gtliSumInsured,
    gtliHazardClass,
    gtliFreeCoverLimit,
    isGpaOpted,
    gpaSumInsured,
    gpaHazardClass,
    gpaTtdOpted,
    gpaMedicalOpted,
    isWcOpted,
    wcTradeHazardRate,
    wcMedicalOpted,
  ]);

  // Handle Census Ingestion
  const handleApplyCensus = (members: ParsedCensusMember[], rollup: CensusRollupSummary) => {
    setUploadedCensus(members);
    setCensusRollup(rollup);
    setIsCensusLoaded(true);
    setIsUploaderOpen(false);
  };

  const handleResetToSample = () => {
    setUploadedCensus([]);
    setCensusRollup(null);
    setManualAgeBands(DEFAULT_SAMPLE_AGE_BANDS);
    setIsCensusLoaded(false);
  };

  // Generate and Download PDF Quote Slip
  const handleDownloadPDF = () => {
    const quoteNumber = `QT-BEN-${Date.now().toString().slice(-6)}`;
    const quoteData: BenefitsQuoteData = {
      quote_number: quoteNumber,
      client_name: clientInfo.clientName || 'Corporate Client',
      client_gst: clientInfo.clientGst,
      client_address: clientInfo.clientAddress || 'Corporate Headquarters',
      hypothecation_bank: clientInfo.hypothecationBank,
      census: {
        total_lives: calculation.totalLives,
        employee_count: calculation.employeeCount,
        dependent_count: calculation.dependentCount,
        family_structure: isCensusLoaded && censusRollup ? censusRollup.inferredFamilyStructure : familyStructure,
        age_bands: calculation.ageBands,
      },
      ghi: {
        sum_insured: ghiBaseSumInsured,
        room_rent_desc:
          roomRent === 'single_private_room'
            ? 'Single Private Room (+8%)'
            : roomRent === 'no_capping'
            ? 'No Room Rent Capping (+15%)'
            : 'Standard (1% Normal / 2% ICU)',
        maternity_opted: maternityOpted,
        maternity_limit_desc: maternityOpted
          ? `Opted (${maternityDay1Waiver ? 'Day-1 Cover' : '9-Mo Waiting'})`
          : 'Excluded',
        ped_waiver_day_1: pedWaiverDay1,
        corporate_buffer_amount: calculation.totalLives >= 50 ? corporateBufferAmount : 0,
        tpa_network_name: tpaName,
      },
      gtli: {
        opted: isGtliOpted,
        sum_insured_per_member: gtliSumInsured,
        total_sum_insured: calculation.gtliTotalSumInsured,
        free_cover_limit: gtliFreeCoverLimit,
        hazard_class_desc: `Hazard Class ${gtliHazardClass}`,
      },
      gpa: {
        opted: isGpaOpted,
        sum_insured_per_life: gpaSumInsured,
        total_sum_insured: calculation.gpaTotalSumInsured,
        hazard_class_desc: `Hazard Class ${gpaHazardClass}`,
        ttd_opted: gpaTtdOpted,
        medical_extension_opted: gpaMedicalOpted,
      },
      wc: {
        opted: isWcOpted,
        covered_workers: calculation.employeeCount,
        annual_wage_roll: calculation.annualWageRoll,
        trade_hazard_rate_percent: wcTradeHazardRate,
        medical_extension_opted: wcMedicalOpted,
        statutory_death_liability: calculation.wcTotalDeathLiability,
        statutory_ptd_liability: calculation.wcTotalPtdLiability,
      },
      calculation: {
        ghi_pure_premium: calculation.ghiPurePremium,
        ghi_loading_amount: calculation.ghiLoadingAmount,
        ghi_buffer_premium: calculation.ghiBufferPremium,
        ghi_total_premium: calculation.ghiTotalPremium,
        gtli_premium: calculation.gtliPremium,
        gpa_premium: calculation.gpaPremium,
        wc_premium: calculation.wcPremium,
        net_package_premium: calculation.netPackagePremium,
        gst_amount: calculation.gstAmount,
        total_final_premium: calculation.totalPayable,
      },
    };

    downloadBenefitsQuotePDF(quoteData, currentWorkspace || undefined);
  };

  // Save Quote to Workspace & Supabase
  const handleSave = async () => {
    const quoteNumber = `QT-BEN-${Date.now().toString().slice(-6)}`;
    const effectiveCensus = isCensusLoaded && uploadedCensus.length > 0
      ? uploadedCensus.map(m => ({
          employee_id: m.employeeId,
          name: m.name,
          age: m.age,
          gender: m.gender,
          relationship: m.relationship,
          monthly_salary: m.monthlySalary,
        }))
      : DEFAULT_SAMPLE_ROWS;

    const standardBreakdown = calculateBenefitsQuote({
      corporate_name: clientInfo.clientName || 'Corporate Client',
      census: effectiveCensus,
      ghi: {
        base_sum_insured: ghiBaseSumInsured,
        room_rent: roomRent,
        maternity_opted: maternityOpted,
        maternity_day_1_waiver: maternityDay1Waiver,
        ped_waiver_day_1: pedWaiverDay1,
        corporate_buffer_amount: calculation.totalLives >= 50 ? corporateBufferAmount : 0,
        tpa_name: tpaName,
      },
      gtli: isGtliOpted
        ? {
            sum_insured_per_life: gtliSumInsured,
            hazard_class: gtliHazardClass,
            free_cover_limit: gtliFreeCoverLimit,
          }
        : undefined,
      gpa: isGpaOpted
        ? {
            sum_insured_per_life: gpaSumInsured,
            hazard_class: gpaHazardClass,
            ttd_opted: gpaTtdOpted,
            medical_extension_opted: gpaMedicalOpted,
          }
        : undefined,
      wc: isWcOpted
        ? {
            trade_hazard_rate_percent: wcTradeHazardRate,
            medical_extension_opted: wcMedicalOpted,
          }
        : undefined,
    });

    const riskDetails: EmployeeBenefitsRiskDetails = {
      corporate_name: clientInfo.clientName,
      total_lives: calculation.totalLives,
      employee_count: calculation.employeeCount,
      dependent_count: calculation.dependentCount,
      family_structure: isCensusLoaded && censusRollup ? censusRollup.inferredFamilyStructure : familyStructure,
      age_bands: calculation.ageBands,
      total_monthly_wage_roll: calculation.monthlyWageRoll,
      ghi_base_sum_insured: ghiBaseSumInsured,
      room_rent_capping: roomRent,
      maternity_opted: maternityOpted,
      maternity_day_1_waiver: maternityDay1Waiver,
      ped_waiver_day_1: pedWaiverDay1,
      corporate_buffer_amount: calculation.totalLives >= 50 ? corporateBufferAmount : 0,
      tpa_name: tpaName,
      gtli_opted: isGtliOpted,
      gtli_sum_insured_per_member: gtliSumInsured,
      gtli_hazard_class: gtliHazardClass,
      gtli_free_cover_limit: gtliFreeCoverLimit,
      gpa_opted: isGpaOpted,
      gpa_sum_insured_per_life: gpaSumInsured,
      gpa_hazard_class: gpaHazardClass,
      gpa_ttd_opted: gpaTtdOpted,
      gpa_medical_extension_opted: gpaMedicalOpted,
      wc_opted: isWcOpted,
      wc_trade_hazard_rate_percent: wcTradeHazardRate,
      wc_medical_extension_opted: wcMedicalOpted,
      census_summary: isCensusLoaded && censusRollup ? {
        total_records: censusRollup.totalLives + censusRollup.invalidCount,
        valid_records: censusRollup.totalLives,
        invalid_records: censusRollup.invalidCount,
      } : undefined,
    };

    const quotePayload: Partial<Quote> = {
      quote_number: quoteNumber,
      client_name: clientInfo.clientName || 'Corporate Client',
      client_gst: clientInfo.clientGst,
      lob_category: 'benefits',
      insurance_line: 'ghi',
      sum_insured:
        calculation.totalLives * ghiBaseSumInsured +
        calculation.gtliTotalSumInsured +
        calculation.gpaTotalSumInsured +
        calculation.wcTotalDeathLiability,
      sum_insured_breakdown: {
        ghi_total_si: calculation.totalLives * ghiBaseSumInsured,
        gtli_total_si: calculation.gtliTotalSumInsured,
        gpa_total_si: calculation.gpaTotalSumInsured,
        wc_death_liability: calculation.wcTotalDeathLiability,
        wc_ptd_liability: calculation.wcTotalPtdLiability,
      },
      premium: calculation.netPackagePremium,
      gst_amount: calculation.gstAmount,
      total_premium: calculation.totalPayable,
      status: 'draft',
      ai_confidence: 0.99,
      calculation_breakdown: standardBreakdown,
      risk_details: riskDetails,
    };

    await onSaveQuote(quotePayload);
  };

  return (
    <div className="space-y-6">
      {/* Mobile Tab Switcher (< lg) */}
      <div className="flex lg:hidden bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveMobileTab('census')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
            activeMobileTab === 'census'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>01. Census</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveMobileTab('coverage')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
            activeMobileTab === 'coverage'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>02. Coverages</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveMobileTab('ledger')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
            activeMobileTab === 'ledger'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>03. Ledger</span>
        </button>
      </div>

      {/* 3-Column Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================================================================== */}
        {/* COLUMN 1: CENSUS ROSTER & DEMOGRAPHIC LIVES (lg:col-span-4)        */}
        {/* ================================================================== */}
        <div
          className={`lg:col-span-4 space-y-5 ${
            activeMobileTab === 'census' ? 'block' : 'hidden lg:block'
          }`}
        >
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            {/* Header & Mode Badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    01. Enrolled Lives & Census
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isCensusLoaded ? 'Ingested Census Active' : 'Sample 50-Life Group'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsUploaderOpen(true)}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 font-semibold flex items-center gap-1.5 transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>+ Upload Census</span>
              </button>
            </div>

            {/* Ingestion Status Banner */}
            {isCensusLoaded && censusRollup ? (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>
                    <strong>{censusRollup.totalLives} Lives</strong> ingested from CSV
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleResetToSample}
                  className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 underline"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>
            ) : null}

            {/* Enrolled Metrics 4-Pack */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                <div className="text-[10px] uppercase font-semibold text-slate-500">Total Lives</div>
                <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  {calculation.totalLives}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Enrolled Members</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                <div className="text-[10px] uppercase font-semibold text-slate-500">Employees</div>
                <div className="text-lg font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                  {calculation.employeeCount}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Primary Workers</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                <div className="text-[10px] uppercase font-semibold text-slate-500">Dependents</div>
                <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  {calculation.dependentCount}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Spouses, Kids, Parents</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                <div className="text-[10px] uppercase font-semibold text-slate-500">Monthly Wage</div>
                <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  ₹ {formatNumberINR(calculation.monthlyWageRoll)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Statutory Wage Roll</div>
              </div>
            </div>

            {/* Family Definition Preset Selector */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Family Floater Structure
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['1+0', '1+3', '1+5'] as const).map((def) => (
                  <button
                    key={def}
                    type="button"
                    onClick={() => setFamilyStructure(def)}
                    className={`py-2 px-2 text-xs rounded-xl border text-center font-medium transition-all ${
                      familyStructure === def
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="font-bold">{def}</div>
                    <div className="text-[9px] text-slate-500 mt-0.5">
                      {def === '1+0' ? 'Self Only' : def === '1+3' ? 'Self+Sp+2Ch' : 'Self+Sp+2Ch+2P'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Base Sum Insured Presets */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  GHI Base Sum Insured per Life
                </label>
                <span className="text-[11px] font-mono text-rose-600 dark:text-rose-400 font-semibold">
                  Scaling: {calculation.siScalingFactor}x
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {[300000, 500000, 1000000, 1500000, 2500000].map((si) => (
                  <button
                    key={si}
                    type="button"
                    onClick={() => setGhiBaseSumInsured(si)}
                    className={`py-2 text-[11px] font-semibold rounded-lg border transition-all ${
                      ghiBaseSumInsured === si
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    ₹{si / 100000}L
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Non-linear scale applies actuarial power curve: <code className="font-mono">(SI / ₹3,00,000)^0.65</code>
              </p>
            </div>

            {/* Demographic Age Bands Controls */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Actuarial Age Distribution
                </span>
                <span className="text-[10px] text-slate-400">7 IRDAI Age Bands</span>
              </div>

              <div className="space-y-1.5 text-xs">
                {(
                  [
                    { key: 'age_0_25', label: '0–25 yrs', rate: '₹2,800' },
                    { key: 'age_26_35', label: '26–35 yrs', rate: '₹4,200' },
                    { key: 'age_36_45', label: '36–45 yrs', rate: '₹6,500' },
                    { key: 'age_46_55', label: '46–55 yrs', rate: '₹11,200' },
                    { key: 'age_56_65', label: '56–65 yrs', rate: '₹18,500' },
                    { key: 'age_66_75', label: '66–75 yrs', rate: '₹26,000' },
                    { key: 'age_76_plus', label: '76+ yrs', rate: '₹32,000' },
                  ] as const
                ).map((b) => (
                  <div
                    key={b.key}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/40"
                  >
                    <div>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{b.label}</span>
                      <span className="text-[10px] text-slate-400 ml-1.5">({b.rate}/head)</span>
                    </div>

                    {isCensusLoaded ? (
                      <span className="font-bold text-slate-900 dark:text-white font-mono">
                        {calculation.ageBands[b.key]} lives
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          max="5000"
                          value={manualAgeBands[b.key]}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                            setManualAgeBands((prev) => ({ ...prev, [b.key]: val }));
                          }}
                          className="w-16 px-2 py-0.5 text-center text-xs font-mono font-bold rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================== */}
        {/* COLUMN 2: MULTI-COVERAGE & BENEFIT CUSTOMIZER (lg:col-span-4)      */}
        {/* ================================================================== */}
        <div
          className={`lg:col-span-4 space-y-5 ${
            activeMobileTab === 'coverage' ? 'block' : 'hidden lg:block'
          }`}
        >
          {/* Card 1: GHI Benefit Loadings */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                <Heart className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  02. Group Health Customizer (GHI)
                </h3>
                <p className="text-[11px] text-slate-500">Room rent, maternity, and corporate buffer</p>
              </div>
            </div>

            {/* Room Rent Option */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Room Rent Capping
              </label>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                {[
                  { key: 'standard_1_percent', label: '1% / 2% ICU', sub: '0% Loading' },
                  { key: 'single_private_room', label: 'Single Private', sub: '+8% Loading' },
                  { key: 'no_capping', label: 'No Cap', sub: '+15% Loading' },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setRoomRent(opt.key as RoomRentOption)}
                    className={`py-2 px-1 text-center rounded-xl border transition-all ${
                      roomRent === opt.key
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-semibold'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div>{opt.label}</div>
                    <div className="text-[9px] text-slate-500 mt-0.5">{opt.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Maternity & PED Toggles */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <label className="flex items-center justify-between p-2 rounded-xl border border-slate-200 dark:border-slate-700/60 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">Maternity Benefit Cover</div>
                  <div className="text-[10px] text-slate-400">Normal ₹50,000 / C-Section ₹75,000 (+10%)</div>
                </div>
                <input
                  type="checkbox"
                  checked={maternityOpted}
                  onChange={(e) => setMaternityOpted(e.target.checked)}
                  className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 w-4 h-4"
                />
              </label>

              {maternityOpted && (
                <label className="flex items-center justify-between p-2 ml-3 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 cursor-pointer">
                  <div>
                    <div className="font-semibold text-rose-900 dark:text-rose-300">Maternity Day-1 Waiver</div>
                    <div className="text-[10px] text-rose-700 dark:text-rose-400">Waives 9-month waiting period (+5%)</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={maternityDay1Waiver}
                    onChange={(e) => setMaternityDay1Waiver(e.target.checked)}
                    className="rounded border-rose-300 text-rose-600 focus:ring-rose-500 w-4 h-4"
                  />
                </label>
              )}

              <label className="flex items-center justify-between p-2 rounded-xl border border-slate-200 dark:border-slate-700/60 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">Pre-Existing Disease (PED) Waiver</div>
                  <div className="text-[10px] text-slate-400">Day-1 coverage for all pre-existing conditions (+12%)</div>
                </div>
                <input
                  type="checkbox"
                  checked={pedWaiverDay1}
                  onChange={(e) => setPedWaiverDay1(e.target.checked)}
                  className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 w-4 h-4"
                />
              </label>
            </div>

            {/* Corporate Buffer */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Corporate Buffer Pool
                </label>
                <span className="text-[10px] text-slate-400">Rated @ 3.5% (Min 50 lives)</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="100000"
                  disabled={calculation.totalLives < 50}
                  value={corporateBufferAmount}
                  onChange={(e) => setCorporateBufferAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  placeholder="e.g. 500000"
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-rose-500 disabled:opacity-50"
                />
                <button
                  type="button"
                  disabled={calculation.totalLives < 50}
                  onClick={() => setCorporateBufferAmount(1000000)}
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
                >
                  ₹10L
                </button>
              </div>
              {calculation.totalLives < 50 && (
                <p className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Corporate buffer requires minimum group size of 50 lives (current: {calculation.totalLives})</span>
                </p>
              )}
            </div>

            {/* TPA Network Selection */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Third Party Administrator (TPA) Network
              </label>
              <select
                value={tpaName}
                onChange={(e) => setTpaName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
              >
                <option value="Medi Assist TPA / Vidal Health TPA">Medi Assist TPA / Vidal Health (12,000+ Hospitals)</option>
                <option value="Paramount Health TPA">Paramount Health TPA (10,500+ Hospitals)</option>
                <option value="FHPL TPA">FHPL - Family Health Plan Ltd (9,500+ Hospitals)</option>
                <option value="MDIndia Health Insurance TPA">MDIndia Health Insurance TPA (11,000+ Hospitals)</option>
              </select>
            </div>
          </div>

          {/* Card 2: GTLI, GPA & Statutory WC Multi-Coverages */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-rose-500" />
              <span>Multi-Line Corporate Coverages</span>
            </h3>

            {/* GTLI Toggle & Controls */}
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    Group Term Life Insurance (GTLI)
                  </div>
                  <div className="text-[10px] text-slate-400">
                    24x7 Term Life • IALM 2012-14 Mortality Rates
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isGtliOpted}
                  onChange={(e) => setIsGtliOpted(e.target.checked)}
                  className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 w-4 h-4"
                />
              </div>

              {isGtliOpted && (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500">Life Cover / Head</label>
                      <select
                        value={gtliSumInsured}
                        onChange={(e) => setGtliSumInsured(parseInt(e.target.value, 10))}
                        className="w-full mt-1 px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                      >
                        <option value={1000000}>₹ 10 Lakhs</option>
                        <option value={2000000}>₹ 20 Lakhs</option>
                        <option value={5000000}>₹ 50 Lakhs (FCL)</option>
                        <option value={10000000}>₹ 1 Crore</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-500">Hazard Class</label>
                      <select
                        value={gtliHazardClass}
                        onChange={(e) => setGtliHazardClass(parseInt(e.target.value, 10) as 1 | 2 | 3)}
                        className="w-full mt-1 px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                      >
                        <option value={1}>Class 1 (1.0x Office)</option>
                        <option value={2}>Class 2 (1.2x Field)</option>
                        <option value={3}>Class 3 (1.5x Heavy)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg">
                    <span>Free Cover Limit (FCL): ₹ 50 Lakhs</span>
                    <span className="font-semibold text-rose-600 dark:text-rose-400">
                      {calculation.gtliMedicalCount} requiring medicals
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* GPA Toggle & Controls */}
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    Group Personal Accident (GPA)
                  </div>
                  <div className="text-[10px] text-slate-400">
                    24x7 Worldwide • Death, PTD, PPD, TTD
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isGpaOpted}
                  onChange={(e) => setIsGpaOpted(e.target.checked)}
                  className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 w-4 h-4"
                />
              </div>

              {isGpaOpted && (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500">Capital SI / Life</label>
                      <select
                        value={gpaSumInsured}
                        onChange={(e) => setGpaSumInsured(parseInt(e.target.value, 10))}
                        className="w-full mt-1 px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                      >
                        <option value={500000}>₹ 5 Lakhs</option>
                        <option value={1000000}>₹ 10 Lakhs</option>
                        <option value={2500000}>₹ 25 Lakhs</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-500">Hazard Class</label>
                      <select
                        value={gpaHazardClass}
                        onChange={(e) => setGpaHazardClass(parseInt(e.target.value, 10) as 1 | 2 | 3)}
                        className="w-full mt-1 px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                      >
                        <option value={1}>Class I (0.35‰)</option>
                        <option value={2}>Class II (0.65‰)</option>
                        <option value={3}>Class III (1.50‰)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={gpaTtdOpted}
                        onChange={(e) => setGpaTtdOpted(e.target.checked)}
                        className="rounded border-slate-300 text-rose-600 w-3.5 h-3.5"
                      />
                      <span className="text-[10px] text-slate-600 dark:text-slate-300">TTD Rider (+0.15‰)</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={gpaMedicalOpted}
                        onChange={(e) => setGpaMedicalOpted(e.target.checked)}
                        className="rounded border-slate-300 text-rose-600 w-3.5 h-3.5"
                      />
                      <span className="text-[10px] text-slate-600 dark:text-slate-300">Med Ext (+10%)</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Statutory WC Toggle & Controls */}
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    Workmen&apos;s Compensation (WC EC Act 1923)
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Schedule IV Age Factors • Capped Wage ₹15k
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isWcOpted}
                  onChange={(e) => setIsWcOpted(e.target.checked)}
                  className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 w-4 h-4"
                />
              </div>

              {isWcOpted && (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] text-slate-500">Trade Hazard Rate (%)</label>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {wcTradeHazardRate}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.10"
                    max="2.00"
                    step="0.05"
                    value={wcTradeHazardRate}
                    onChange={(e) => setWcTradeHazardRate(parseFloat(e.target.value))}
                    className="w-full accent-rose-600"
                  />
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>0.10% (IT/Office)</span>
                    <span>0.45% (Light Mfg)</span>
                    <span>1.50% (Hazardous)</span>
                  </div>

                  <label className="flex items-center justify-between pt-1 cursor-pointer">
                    <span className="text-[11px] text-slate-700 dark:text-slate-300">
                      Medical Extension Loading (+25%)
                    </span>
                    <input
                      type="checkbox"
                      checked={wcMedicalOpted}
                      onChange={(e) => setWcMedicalOpted(e.target.checked)}
                      className="rounded border-slate-300 text-rose-600 w-4 h-4"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================================================================== */}
        {/* COLUMN 3: LIVE 10-ROW REACTIVE LEDGER & ACTIONS (lg:col-span-4)    */}
        {/* ================================================================== */}
        <div
          className={`lg:col-span-4 space-y-5 ${
            activeMobileTab === 'ledger' ? 'block' : 'hidden lg:block'
          }`}
        >
          {/* Main Calculation Ledger Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    03. Benefits Package Ledger
                  </h3>
                  <p className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                    Deterministic Math (IRDAI Gazetted)
                  </p>
                </div>
              </div>
            </div>

            {/* 10-Row Reactive Ledger */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span>1. GHI Pure Demographic</span>
                <span className="font-mono font-medium">₹ {formatNumberINR(calculation.ghiPurePremium)}</span>
              </div>

              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span>2. GHI Benefit Loadings ({calculation.ghiLoadingPercent}%)</span>
                <span className="font-mono font-medium text-rose-600">
                  + ₹ {formatNumberINR(calculation.ghiLoadingAmount)}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span>3. GHI Corporate Buffer</span>
                <span className="font-mono font-medium">₹ {formatNumberINR(calculation.ghiBufferPremium)}</span>
              </div>

              <div className="flex items-center justify-between font-semibold text-slate-900 dark:text-white pt-1 border-t border-slate-100 dark:border-slate-800">
                <span>4. Subtotal GHI Premium</span>
                <span className="font-mono">₹ {formatNumberINR(calculation.ghiTotalPremium)}</span>
              </div>

              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 pt-1">
                <span>5. GTLI Term Life Premium</span>
                <span className="font-mono font-medium">
                  {isGtliOpted ? `₹ ${formatNumberINR(calculation.gtliPremium)}` : '—'}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span>6. GPA Accident Premium</span>
                <span className="font-mono font-medium">
                  {isGpaOpted ? `₹ ${formatNumberINR(calculation.gpaPremium)}` : '—'}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span>7. Statutory WC Premium</span>
                <span className="font-mono font-medium">
                  {isWcOpted ? `₹ ${formatNumberINR(calculation.wcPremium)}` : '—'}
                </span>
              </div>

              <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
                <span>8. Net Benefits Premium</span>
                <span className="font-mono text-sm">₹ {formatNumberINR(calculation.netPackagePremium)}</span>
              </div>

              <div className="flex items-center justify-between text-slate-500">
                <span>9. GST @ 18%</span>
                <span className="font-mono">₹ {formatNumberINR(calculation.gstAmount)}</span>
              </div>

              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-center justify-between mt-2">
                <div>
                  <div className="text-[11px] font-semibold text-rose-900 dark:text-rose-300">
                    10. Total Premium Payable
                  </div>
                  <div className="text-[10px] text-rose-600 dark:text-rose-400">
                    Inc. 18% GST & All Covers
                  </div>
                </div>
                <div className="text-xl font-black text-rose-700 dark:text-rose-300 font-mono">
                  ₹ {formatNumberINR(calculation.totalPayable)}
                </div>
              </div>
            </div>

            {/* Per-Head Metrics */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className="text-[10px] text-slate-400">Cost / Employee</div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono mt-0.5">
                  ₹ {formatNumberINR(calculation.costPerEmployee)}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className="text-[10px] text-slate-400">Cost / Insured Life</div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono mt-0.5">
                  ₹ {formatNumberINR(calculation.costPerLife)}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-3">
              <button
                type="button"
                onClick={handleDownloadPDF}
                className="w-full py-2.5 px-4 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <Download className="w-4 h-4 text-rose-600" />
                <span>Generate Benefits Quote Slip (PDF)</span>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSave}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-rose-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                <span>{isSubmitting ? 'Saving Quote...' : 'Save Quote to Workspace'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabular Census Uploader Modal */}
      <EmployeeCensusUploader
        isOpen={isUploaderOpen}
        onClose={() => setIsUploaderOpen(false)}
        onApplyCensus={handleApplyCensus}
        initialSumInsured={ghiBaseSumInsured}
      />
    </div>
  );
};
