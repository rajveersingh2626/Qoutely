'use client';

import React, { useState, useMemo } from 'react';
import {
  Shield,
  ShieldCheck,
  Briefcase,
  FileText,
  Download,
  Save,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Activity,
  ChevronDown,
  ChevronUp,
  Info,
  Sliders,
  AlertCircle,
  Building2,
  Lock,
  Percent,
  Check,
  TrendingUp,
  Award,
  Warehouse,
} from 'lucide-react';
import { formatNumberINR, formatINRWithDecimals } from '@/lib/calculator';
import {
  calculateSuretyBondPremium,
  calculateTradeCreditPremium,
  validateSpecialtyStudioInput,
  calculateBurglaryPremium,
  calculateSuretyQuote,
  calculateTradeCreditQuote,
  calculateBurglaryQuote,
  calculateSpecialtyPackageQuote,
  SURETY_BASE_RATES,
  CONTRACTOR_GRADE_MULTIPLIERS,
  TRADE_CREDIT_RATES,
  BURGLARY_BASE_RATE_PER_MILLE,
  BURGLARY_SECURITY_DISCOUNTS,
  STATUTORY_GST_RATE,
  SuretyBondType,
  ContractorFinancialGrade,
  SuretyBondInput,
  TradeCreditInput,
  BurglaryInput,
} from '@/lib/engines/specialty-engine';
import {
  downloadSpecialtyQuotePDF,
  SpecialtyQuoteData,
} from '@/lib/pdf/specialty-pdf';
import { useWorkspace } from '@/context/WorkspaceContext';
import { SpecialtyFinancialRiskDetails } from '@/types/database';

interface SpecialtyStudioProps {
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

export const SpecialtyStudio: React.FC<SpecialtyStudioProps> = ({
  clientInfo,
  onClientInfoChange,
  onSaveQuote,
  isSubmitting = false,
}) => {
  const { currentWorkspace } = useWorkspace();

  // Mobile navigation tab: 'parameters' | 'collateral' | 'ledger'
  const [activeMobileTab, setActiveMobileTab] = useState<'parameters' | 'collateral' | 'ledger'>('parameters');

  // Sub-line tab: 'package' | 'surety_bond' | 'trade_credit' | 'burglary'
  const [subLine, setSubLine] = useState<'package' | 'surety_bond' | 'trade_credit' | 'burglary'>('package');

  // Explainability drawer state
  const [isExplainabilityOpen, setIsExplainabilityOpen] = useState<boolean>(false);

  // --------------------------------------------------------------------------
  // Corporate Entity & KYC Parameters (Column 1)
  // --------------------------------------------------------------------------
  const [applicantName, setApplicantName] = useState<string>(
    clientInfo.clientName || 'Afcons Infrastructure Limited'
  );
  const [panNumber, setPanNumber] = useState<string>('AAACA1234F');

  // Multi-line toggles (for package and individual views)
  const [optSurety, setOptSurety] = useState<boolean>(true);
  const [optTradeCredit, setOptTradeCredit] = useState<boolean>(true);
  const [optBurglary, setOptBurglary] = useState<boolean>(true);

  // Surety Parameters
  const [bondType, setBondType] = useState<SuretyBondType>('performance_bond');
  const [bondValue, setBondValue] = useState<number>(20_00_00_000); // ₹20 Cr
  const [tenureMonths, setTenureMonths] = useState<number>(24); // 24 months
  const [contractorGrade, setContractorGrade] = useState<ContractorFinancialGrade>('AA');
  const [contractorNetWorth, setContractorNetWorth] = useState<number>(50_00_00_000); // ₹50 Cr

  // Trade Credit Parameters
  const [insurableTurnover, setInsurableTurnover] = useState<number>(100_00_00_000); // ₹100 Cr
  const [creditDays, setCreditDays] = useState<30 | 60 | 90 | 120>(60);
  const [top10SharePct, setTop10SharePct] = useState<number>(45); // 45%
  const [requestedIndemnityPct, setRequestedIndemnityPct] = useState<number>(90); // 90%

  // Burglary Parameters
  const [propertySumInsured, setPropertySumInsured] = useState<number>(20_00_00_000); // ₹20 Cr
  const [firstLossPct, setFirstLossPct] = useState<25 | 50 | 75 | 100>(50);
  const [hasCctv, setHasCctv] = useState<boolean>(true);
  const [hasGuards, setHasGuards] = useState<boolean>(true);
  const [hasAlarm, setHasAlarm] = useState<boolean>(false);

  // --------------------------------------------------------------------------
  // Reactive Calculations
  // --------------------------------------------------------------------------
  const calculations = useMemo(() => {
    const isSuretyActive = subLine === 'surety_bond' || (subLine === 'package' && optSurety);
    const isTciActive = subLine === 'trade_credit' || (subLine === 'package' && optTradeCredit);
    const isBurglaryActive = subLine === 'burglary' || (subLine === 'package' && optBurglary);

    const activeLinesList: string[] = [];
    if (isSuretyActive) activeLinesList.push('surety_bond');
    if (isTciActive) activeLinesList.push('trade_credit');
    if (isBurglaryActive) activeLinesList.push('burglary');

    // Principal amount determination for validation
    let principalAmount = 0;
    if (subLine === 'surety_bond') principalAmount = bondValue;
    else if (subLine === 'trade_credit') principalAmount = insurableTurnover;
    else if (subLine === 'burglary') principalAmount = propertySumInsured;
    else principalAmount = Math.max(bondValue, insurableTurnover, propertySumInsured);

    // Validation
    const validation = validateSpecialtyStudioInput({
      contractor_or_applicant: applicantName.trim(),
      pan_number: panNumber.trim(),
      selected_product: subLine === 'package' ? 'specialty_package' : subLine,
      principal_amount: principalAmount,
    });

    // Check at least one line is selected
    if (activeLinesList.length === 0) {
      validation.is_valid = false;
      validation.contract_ready = false;
      validation.error = 'Select at least one specialty line';
    }

    // Engine Results
    let suretyRes: ReturnType<typeof calculateSuretyBondPremium> | null = null;
    let tciRes: ReturnType<typeof calculateTradeCreditPremium> | null = null;
    let burglaryRes: ReturnType<typeof calculateBurglaryPremium> | null = null;

    if (isSuretyActive && bondValue > 0 && tenureMonths > 0) {
      try {
        suretyRes = calculateSuretyBondPremium({
          bond_type: bondType,
          bond_value: bondValue,
          tenure_months: tenureMonths,
          contractor_grade: contractorGrade,
          contractor_net_worth: contractorNetWorth,
        });
      } catch (err) {
        console.error('Surety calculation error:', err);
      }
    }

    if (isTciActive && insurableTurnover > 0) {
      try {
        tciRes = calculateTradeCreditPremium({
          insurable_turnover: insurableTurnover,
          average_credit_days: creditDays,
          top_10_buyers_turnover_share_percent: top10SharePct,
          requested_indemnity_percent: requestedIndemnityPct,
        });
      } catch (err) {
        console.error('Trade credit calculation error:', err);
      }
    }

    if (isBurglaryActive && propertySumInsured > 0) {
      try {
        burglaryRes = calculateBurglaryPremium({
          property_sum_insured: propertySumInsured,
          first_loss_percentage: firstLossPct,
          has_cctv: hasCctv,
          has_247_security_guards: hasGuards,
          has_burglar_alarm: hasAlarm,
        });
      } catch (err) {
        console.error('Burglary calculation error:', err);
      }
    }

    // Aggregate Premiums
    const suretyPrem = isSuretyActive && suretyRes ? suretyRes.total_bond_premium : 0;
    const tciPrem = isTciActive && tciRes ? tciRes.net_tci_premium : 0;
    const burglaryPrem = isBurglaryActive && burglaryRes ? burglaryRes.net_burglary_premium : 0;

    const netPremium = suretyPrem + tciPrem + burglaryPrem;
    const gstAmount = Math.round(netPremium * (STATUTORY_GST_RATE / 100));
    const totalPremium = netPremium + gstAmount;

    // Aggregate Sum Insured
    const totalSumInsured =
      (isSuretyActive ? bondValue : 0) +
      (isTciActive ? insurableTurnover : 0) +
      (isBurglaryActive && burglaryRes ? burglaryRes.first_loss_sum_insured : 0);

    return {
      isSuretyActive,
      isTciActive,
      isBurglaryActive,
      activeLinesList,
      validation,
      suretyRes,
      tciRes,
      burglaryRes,
      suretyPrem,
      tciPrem,
      burglaryPrem,
      netPremium,
      gstAmount,
      totalPremium,
      totalSumInsured,
    };
  }, [
    subLine,
    optSurety,
    optTradeCredit,
    optBurglary,
    applicantName,
    panNumber,
    bondType,
    bondValue,
    tenureMonths,
    contractorGrade,
    contractorNetWorth,
    insurableTurnover,
    creditDays,
    top10SharePct,
    requestedIndemnityPct,
    propertySumInsured,
    firstLossPct,
    hasCctv,
    hasGuards,
    hasAlarm,
  ]);

  // PAN Regex check for immediate badge display
  const isPanValid = useMemo(() => {
    return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber.trim().toUpperCase());
  }, [panNumber]);

  // PDF Generation Handler
  const handleDownloadPdf = () => {
    const quoteNumber = `QT-SPEC-${Date.now().toString().slice(-6)}`;

    const quoteData: SpecialtyQuoteData = {
      quote_number: quoteNumber,
      client_name: applicantName || clientInfo.clientName || 'Specialty Lines Client',
      client_gst: clientInfo.clientGst || '27AAAAA0000A1Z5',
      client_address: clientInfo.clientAddress || 'Mumbai, Maharashtra',
      contractor_or_applicant: applicantName,
      pan_number: panNumber.toUpperCase(),
      sub_line: subLine === 'package' ? 'specialty_package' : subLine,

      surety_opted: calculations.isSuretyActive,
      surety_bond_type: bondType,
      surety_bond_value: bondValue,
      surety_tenure_months: tenureMonths,
      surety_contractor_grade: contractorGrade,
      surety_contractor_net_worth: contractorNetWorth,
      surety_annual_rate_percent: calculations.suretyRes?.annual_rate_percent,
      surety_required_collateral_margin: calculations.suretyRes?.required_collateral_margin_percent,
      surety_credit_limit_breach: calculations.suretyRes?.credit_limit_breach,
      surety_net_premium: calculations.suretyPrem,

      trade_credit_opted: calculations.isTciActive,
      trade_credit_insurable_turnover: insurableTurnover,
      trade_credit_average_days: creditDays,
      trade_credit_top_10_share_percent: top10SharePct,
      trade_credit_requested_indemnity_percent: requestedIndemnityPct,
      trade_credit_clamped_indemnity_percent: calculations.tciRes?.clamped_indemnity_percent,
      trade_credit_base_rate_percent: calculations.tciRes?.base_rate_percent,
      trade_credit_concentration_loading_percent: calculations.tciRes?.concentration_loading_percent,
      trade_credit_net_premium: calculations.tciPrem,

      burglary_opted: calculations.isBurglaryActive,
      burglary_property_sum_insured: propertySumInsured,
      burglary_first_loss_percentage: firstLossPct,
      burglary_first_loss_sum_insured: calculations.burglaryRes?.first_loss_sum_insured,
      burglary_has_cctv: hasCctv,
      burglary_has_guards: hasGuards,
      burglary_has_alarm: hasAlarm,
      burglary_total_security_discount_percent: calculations.burglaryRes?.total_security_discount_percent,
      burglary_net_premium: calculations.burglaryPrem,

      calculation: {
        sum_insured: calculations.totalSumInsured,
        surety_premium: calculations.suretyPrem,
        trade_credit_premium: calculations.tciPrem,
        burglary_premium: calculations.burglaryPrem,
        net_premium: calculations.netPremium,
        gst_amount: calculations.gstAmount,
        total_premium: calculations.totalPremium,
      },
    };

    downloadSpecialtyQuotePDF(quoteData, currentWorkspace || undefined);
  };

  // Save Quote Handler
  const handleSave = async () => {
    const quoteNumber = `QT-SPEC-${Date.now().toString().slice(-6)}`;

    const riskDetails: SpecialtyFinancialRiskDetails = {
      sub_line: subLine === 'package' ? 'specialty_package' : subLine,
      contractor_or_applicant: applicantName,
      pan_number: panNumber.toUpperCase(),
      principal_amount: calculations.totalSumInsured,

      surety_opted: calculations.isSuretyActive,
      surety_bond_type: bondType,
      surety_bond_value: bondValue,
      surety_tenure_months: tenureMonths,
      surety_contractor_grade: contractorGrade,
      surety_contractor_net_worth: contractorNetWorth,
      surety_required_collateral_margin: calculations.suretyRes?.required_collateral_margin_percent,
      surety_credit_limit_breach: calculations.suretyRes?.credit_limit_breach,
      surety_net_premium: calculations.suretyPrem,

      trade_credit_opted: calculations.isTciActive,
      trade_credit_insurable_turnover: insurableTurnover,
      trade_credit_average_days: creditDays,
      trade_credit_top_10_share_percent: top10SharePct,
      trade_credit_requested_indemnity_percent: requestedIndemnityPct,
      trade_credit_clamped_indemnity_percent: calculations.tciRes?.clamped_indemnity_percent,
      trade_credit_concentration_loading_percent: calculations.tciRes?.concentration_loading_percent,
      trade_credit_net_premium: calculations.tciPrem,

      burglary_opted: calculations.isBurglaryActive,
      burglary_property_sum_insured: propertySumInsured,
      burglary_first_loss_percentage: firstLossPct,
      burglary_has_cctv: hasCctv,
      burglary_has_guards: hasGuards,
      burglary_has_alarm: hasAlarm,
      burglary_net_premium: calculations.burglaryPrem,

      selected_lines_count: calculations.activeLinesList.length,
    };

    const quotePayload = {
      quote_number: quoteNumber,
      client_name: applicantName || clientInfo.clientName || 'Specialty Lines Client',
      client_gst: clientInfo.clientGst || '27AAAAA0000A1Z5',
      lob_category: 'specialty',
      insurance_line: subLine === 'package' ? 'specialty_package' : subLine,
      sum_insured: calculations.totalSumInsured,
      sum_insured_breakdown: {
        total_aggregate_limit: calculations.totalSumInsured,
        surety_bond_value: calculations.isSuretyActive ? bondValue : 0,
        trade_credit_turnover: calculations.isTciActive ? insurableTurnover : 0,
        burglary_first_loss_si: calculations.isBurglaryActive && calculations.burglaryRes ? calculations.burglaryRes.first_loss_sum_insured : 0,
      },
      premium: calculations.netPremium,
      gst_amount: calculations.gstAmount,
      total_premium: calculations.totalPremium,
      policy_rate: calculations.totalSumInsured > 0 ? (calculations.netPremium / calculations.totalSumInsured) * 100 : 0,
      status: 'draft',
      ai_confidence: 0.99,
      risk_details: riskDetails,
      calculation_breakdown: {
        lob_category: 'specialty',
        insurance_line: subLine === 'package' ? 'specialty_package' : subLine,
        sum_insured: calculations.totalSumInsured,
        net_premium: calculations.netPremium,
        gst_rate_percent: STATUTORY_GST_RATE,
        gst_amount: calculations.gstAmount,
        total_premium: calculations.totalPremium,
        active_lines: calculations.activeLinesList,
      },
    };

    await onSaveQuote(quotePayload);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50 dark:bg-slate-950">
      {/* Sub-line Navigation Tabs */}
      <div className="px-6 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {[
            { id: 'package', label: 'All Specialty Package', icon: ShieldCheck, badge: 'Unified Cover' },
            { id: 'surety_bond', label: 'Surety Bonds', icon: Award, badge: 'Feature 32 (GFR 170/171)' },
            { id: 'trade_credit', label: 'Trade Credit (TCI)', icon: TrendingUp, badge: 'Feature 33 (IRDAI 2021)' },
            { id: 'burglary', label: 'Commercial Burglary', icon: Warehouse, badge: 'First Loss Scale' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = subLine === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSubLine(tab.id as any)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/25 ring-2 ring-emerald-600/20'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
                    isActive ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Mobile Section Selector */}
        <div className="flex lg:hidden items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveMobileTab('parameters')}
            className={`px-2.5 py-1 rounded-md font-medium transition ${
              activeMobileTab === 'parameters' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' : 'text-slate-500'
            }`}
          >
            Parameters
          </button>
          <button
            type="button"
            onClick={() => setActiveMobileTab('collateral')}
            className={`px-2.5 py-1 rounded-md font-medium transition ${
              activeMobileTab === 'collateral' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' : 'text-slate-500'
            }`}
          >
            Collateral
          </button>
          <button
            type="button"
            onClick={() => setActiveMobileTab('ledger')}
            className={`px-2.5 py-1 rounded-md font-medium transition ${
              activeMobileTab === 'ledger' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' : 'text-slate-500'
            }`}
          >
            Ledger
          </button>
        </div>
      </div>

      {/* Main 3-Column Glassmorphic Workspace Grid */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ================================================================== */}
          {/* COLUMN 1: CORPORATE ENTITY, KYC & CONTRACT PARAMETERS (4 COLS)     */}
          {/* ================================================================== */}
          <div
            className={`lg:col-span-4 space-y-4 ${
              activeMobileTab === 'parameters' ? 'block' : 'hidden lg:block'
            }`}
          >
            {/* Entity & Statutory PAN Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Contractor Entity & Statutory KYC
                </h4>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Contractor / Applicant Legal Entity
                </label>
                <input
                  type="text"
                  value={applicantName}
                  onChange={(e) => {
                    setApplicantName(e.target.value);
                    onClientInfoChange('clientName', e.target.value);
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  placeholder="e.g. Afcons Infrastructure Limited"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Indian Permanent Account Number (PAN)
                  </label>
                  {isPanValid ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                      <Check className="w-3 h-3" />
                      Statutory PAN Validated
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                      <XCircle className="w-3 h-3" />
                      Invalid PAN Format
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={panNumber}
                  maxLength={10}
                  onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                  className={`w-full px-3 py-2 text-xs rounded-xl font-mono uppercase bg-slate-50 dark:bg-slate-800/60 border ${
                    isPanValid
                      ? 'border-emerald-300 dark:border-emerald-700 focus:ring-emerald-500'
                      : 'border-rose-300 dark:border-rose-700 focus:ring-rose-500'
                  } focus:outline-none focus:ring-2`}
                  placeholder="e.g. AAACA1234F"
                />
                {!isPanValid && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">
                    Invalid Indian PAN format (Format: 5 letters, 4 digits, 1 letter)
                  </p>
                )}
              </div>

              {/* Package Sub-line Toggles */}
              {subLine === 'package' && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Include in Specialty Package:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setOptSurety(!optSurety)}
                      className={`p-2 rounded-xl text-center text-xs font-semibold border transition ${
                        optSurety
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-800/40 dark:border-slate-700'
                      }`}
                    >
                      Surety Bond
                    </button>
                    <button
                      type="button"
                      onClick={() => setOptTradeCredit(!optTradeCredit)}
                      className={`p-2 rounded-xl text-center text-xs font-semibold border transition ${
                        optTradeCredit
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-800/40 dark:border-slate-700'
                      }`}
                    >
                      Trade Credit
                    </button>
                    <button
                      type="button"
                      onClick={() => setOptBurglary(!optBurglary)}
                      className={`p-2 rounded-xl text-center text-xs font-semibold border transition ${
                        optBurglary
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-800/40 dark:border-slate-700'
                      }`}
                    >
                      Burglary
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Surety Parameters Card */}
            {calculations.isSuretyActive && (
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Surety Bond Specifications (Feature 32)
                  </h4>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Bond Category (GFR 2017)
                  </label>
                  <select
                    value={bondType}
                    onChange={(e) => setBondType(e.target.value as SuretyBondType)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    <option value="bid_bond">Bid Bond / EMD (1.00% p.a.)</option>
                    <option value="performance_bond">Performance Bond (1.50% p.a.)</option>
                    <option value="advance_payment">Advance Payment Bond (1.75% p.a.)</option>
                    <option value="retention_money">Retention Money Bond (1.25% p.a.)</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Bond Principal Value
                    </label>
                    <span className="font-mono text-xs font-bold text-emerald-600">
                      ₹{formatNumberINR(bondValue)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1000000}
                    max={2000000000}
                    step={1000000}
                    value={bondValue}
                    onChange={(e) => setBondValue(Number(e.target.value))}
                    className="w-full accent-emerald-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>₹10 Lakhs</span>
                    <span>₹50 Cr</span>
                    <span>₹200 Cr</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Bond Tenure (Months)
                    </label>
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                      {tenureMonths} Months ({(tenureMonths / 12).toFixed(2)}x Pro-Rata)
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={60}
                    step={1}
                    value={tenureMonths}
                    onChange={(e) => setTenureMonths(Number(e.target.value))}
                    className="w-full accent-emerald-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>1 Month</span>
                    <span>12M</span>
                    <span>36M</span>
                    <span>60 Months</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contractor Financial Rating Grade
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {(['AAA', 'AA', 'A', 'BBB', 'BB'] as ContractorFinancialGrade[]).map((grade) => {
                      const isSelected = contractorGrade === grade;
                      const info = CONTRACTOR_GRADE_MULTIPLIERS[grade];
                      return (
                        <button
                          key={grade}
                          type="button"
                          onClick={() => setContractorGrade(grade)}
                          className={`p-2 rounded-xl text-center border transition ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          <span className="text-xs font-bold block">{grade}</span>
                          <span className="text-[10px] opacity-80 font-mono block">
                            {info.mult}x
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Trade Credit Parameters Card */}
            {calculations.isTciActive && (
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Trade Credit Receivables (Feature 33)
                  </h4>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Insurable Annual Turnover
                    </label>
                    <span className="font-mono text-xs font-bold text-emerald-600">
                      ₹{formatNumberINR(insurableTurnover)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={10000000}
                    max={5000000000}
                    step={10000000}
                    value={insurableTurnover}
                    onChange={(e) => setInsurableTurnover(Number(e.target.value))}
                    className="w-full accent-emerald-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>₹1 Cr</span>
                    <span>₹100 Cr</span>
                    <span>₹500 Cr</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Average Buyer Credit Terms (Days)
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {([30, 60, 90, 120] as const).map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => setCreditDays(days)}
                        className={`p-2 rounded-xl text-center border transition ${
                          creditDays === days
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        <span className="text-xs font-bold block">{days}d</span>
                        <span className="text-[10px] opacity-80 font-mono block">
                          {TRADE_CREDIT_RATES[days]}%
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Burglary Parameters Card */}
            {calculations.isBurglaryActive && (
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <Warehouse className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Commercial Burglary First Loss
                  </h4>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Total Insurable Property Value
                    </label>
                    <span className="font-mono text-xs font-bold text-emerald-600">
                      ₹{formatNumberINR(propertySumInsured)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1000000}
                    max={1000000000}
                    step={1000000}
                    value={propertySumInsured}
                    onChange={(e) => setPropertySumInsured(Number(e.target.value))}
                    className="w-full accent-emerald-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>₹10 Lakhs</span>
                    <span>₹20 Cr</span>
                    <span>₹100 Cr</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    First Loss Scale Percentage
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {([25, 50, 75, 100] as const).map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setFirstLossPct(pct)}
                        className={`p-2 rounded-xl text-center border transition ${
                          firstLossPct === pct
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        <span className="text-xs font-bold block">{pct}%</span>
                        <span className="text-[10px] opacity-80 font-mono block">
                          ₹{formatNumberINR((propertySumInsured * pct) / 100)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ================================================================== */}
          {/* COLUMN 2: FINANCIAL COLLATERAL & UNDERWRITING POSTURE (4 COLS)     */}
          {/* ================================================================== */}
          <div
            className={`lg:col-span-4 space-y-4 ${
              activeMobileTab === 'collateral' ? 'block' : 'hidden lg:block'
            }`}
          >
            {/* Surety Collateral & Net Worth Profiling Card */}
            {calculations.isSuretyActive && (
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Single Project Capacity & Margin
                    </h4>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                      calculations.suretyRes?.credit_limit_breach
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}
                  >
                    {calculations.suretyRes?.credit_limit_breach ? 'Capacity Breach' : 'Capacity Approved'}
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Contractor Net Worth
                    </label>
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                      ₹{formatNumberINR(contractorNetWorth)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={10000000}
                    max={2000000000}
                    step={10000000}
                    value={contractorNetWorth}
                    onChange={(e) => setContractorNetWorth(Number(e.target.value))}
                    className="w-full accent-emerald-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>₹1 Cr</span>
                    <span>₹50 Cr</span>
                    <span>₹200 Cr</span>
                  </div>
                </div>

                {/* Capacity Breach Warning Box */}
                {calculations.suretyRes?.credit_limit_breach ? (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-bold block">Capacity Limit Exceeded!</span>
                      <p className="text-[11px] opacity-90 mt-0.5">
                        Bond value (₹{formatNumberINR(bondValue)}) exceeds Contractor Net Worth (₹
                        {formatNumberINR(contractorNetWorth)}). GFR 2017 rules mandate a mandatory +25%
                        liquid collateral margin surcharge.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-bold block">Capacity Within Net Worth</span>
                      <p className="text-[11px] opacity-90 mt-0.5">
                        Bond exposure is fully supported by Contractor Net Worth. Standard collateral
                        margin of {CONTRACTOR_GRADE_MULTIPLIERS[contractorGrade].margin}% applied.
                      </p>
                    </div>
                  </div>
                )}

                {/* Collateral Margin Requirement Display */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                      Required Collateral Margin
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {calculations.suretyRes?.credit_limit_breach
                        ? `${CONTRACTOR_GRADE_MULTIPLIERS[contractorGrade].margin}% Base + 25% Surcharge`
                        : `${CONTRACTOR_GRADE_MULTIPLIERS[contractorGrade].margin}% Standard Grade Rate`}
                    </span>
                  </div>
                  <span className="text-lg font-bold font-mono text-emerald-600">
                    {calculations.suretyRes?.required_collateral_margin_percent}%
                  </span>
                </div>
              </div>
            )}

            {/* Trade Credit Profiling Card */}
            {calculations.isTciActive && (
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <Sliders className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Debtor Concentration & Statutory Indemnity
                  </h4>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Top 10 Buyers Turnover Concentration
                    </label>
                    <span
                      className={`font-mono text-xs font-bold ${
                        top10SharePct > 60 ? 'text-amber-600' : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {top10SharePct}% {top10SharePct > 60 ? '(+20% Loading)' : '(Par)'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    step={1}
                    value={top10SharePct}
                    onChange={(e) => setTop10SharePct(Number(e.target.value))}
                    className="w-full accent-emerald-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>10%</span>
                    <span className="text-amber-600 font-semibold">60% Threshold</span>
                    <span>100%</span>
                  </div>
                </div>

                {top10SharePct > 60 && (
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span>
                      High concentration loading of <strong>+20%</strong> applied because Top 10 buyers
                      account for more than 60% of whole receivables.
                    </span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Requested Indemnity Percentage
                    </label>
                    <span className="font-mono text-xs font-bold text-emerald-600">
                      {requestedIndemnityPct}% (Clamped: {calculations.tciRes?.clamped_indemnity_percent}%)
                    </span>
                  </div>
                  <input
                    type="range"
                    min={40}
                    max={100}
                    step={5}
                    value={requestedIndemnityPct}
                    onChange={(e) => setRequestedIndemnityPct(Number(e.target.value))}
                    className="w-full accent-emerald-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>50% Min</span>
                    <span>75%</span>
                    <span className="text-emerald-600 font-semibold">90% Statutory Cap</span>
                    <span>100%</span>
                  </div>
                </div>

                {requestedIndemnityPct > 90 && (
                  <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>
                      IRDAI (Trade Credit Insurance) Guidelines 2021 statutory cap clamped requested indemnity from{' '}
                      <strong>{requestedIndemnityPct}%</strong> to <strong>90%</strong>.
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Burglary Security Posture Card */}
            {calculations.isBurglaryActive && (
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Physical Security Posture
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    -{calculations.burglaryRes?.total_security_discount_percent ?? 0}% Discount
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                        Tamper-Evident CCTV Recording
                      </span>
                      <span className="text-[11px] text-slate-500">
                        30-day continuous remote cloud / safe storage
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-emerald-600">-5%</span>
                      <input
                        type="checkbox"
                        checked={hasCctv}
                        onChange={(e) => setHasCctv(e.target.checked)}
                        className="w-4 h-4 accent-emerald-600 rounded"
                      />
                    </div>
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                        24/7 Security Guards (Watch & Ward)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Continuous active licensed manned security
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-emerald-600">-10%</span>
                      <input
                        type="checkbox"
                        checked={hasGuards}
                        onChange={(e) => setHasGuards(e.target.checked)}
                        className="w-4 h-4 accent-emerald-600 rounded"
                      />
                    </div>
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                        Monitored Central Burglar Alarm
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Direct auto-dialer police/fire connectivity
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-emerald-600">-5%</span>
                      <input
                        type="checkbox"
                        checked={hasAlarm}
                        onChange={(e) => setHasAlarm(e.target.checked)}
                        className="w-4 h-4 accent-emerald-600 rounded"
                      />
                    </div>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* ================================================================== */}
          {/* COLUMN 3: STICKY 10-ROW LEDGER, EXPLAINABILITY & ACTIONS (4 COLS)  */}
          {/* ================================================================== */}
          <div
            className={`lg:col-span-4 space-y-4 ${
              activeMobileTab === 'ledger' ? 'block' : 'hidden lg:block'
            }`}
          >
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 sticky top-6">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Itemized Calculation Ledger
                  </h4>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {calculations.activeLinesList.length} Active Lines
                </span>
              </div>

              {/* 10-Row Calculation Ledger */}
              <div className="space-y-1.5 text-xs">
                {/* 1. Surety Principal */}
                {calculations.isSuretyActive && (
                  <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/60">
                    <span className="text-slate-600 dark:text-slate-400">1. Surety Principal:</span>
                    <span className="font-mono font-medium">₹{formatNumberINR(bondValue)}</span>
                  </div>
                )}

                {/* 2. Surety Annual Rate & Multiplier */}
                {calculations.isSuretyActive && (
                  <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/60">
                    <span className="text-slate-600 dark:text-slate-400">2. Annual Rate ({contractorGrade}):</span>
                    <span className="font-mono font-medium text-emerald-600">
                      {calculations.suretyRes?.annual_rate_percent}% p.a.
                    </span>
                  </div>
                )}

                {/* 3. Tenure Pro-Rata Duration */}
                {calculations.isSuretyActive && (
                  <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/60">
                    <span className="text-slate-600 dark:text-slate-400">3. Tenure Duration Factor:</span>
                    <span className="font-mono font-medium">
                      {calculations.suretyRes?.tenure_pro_rata_factor}x ({tenureMonths}M)
                    </span>
                  </div>
                )}

                {/* 4. Collateral Margin Mandate */}
                {calculations.isSuretyActive && (
                  <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/60">
                    <span className="text-slate-600 dark:text-slate-400">4. Collateral Mandate:</span>
                    <span
                      className={`font-mono font-medium ${
                        calculations.suretyRes?.credit_limit_breach ? 'text-rose-600' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {calculations.suretyRes?.required_collateral_margin_percent}% Margin
                    </span>
                  </div>
                )}

                {/* 5. TCI Insurable Turnover */}
                {calculations.isTciActive && (
                  <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/60">
                    <span className="text-slate-600 dark:text-slate-400">5. TCI Insurable Turnover:</span>
                    <span className="font-mono font-medium">₹{formatNumberINR(insurableTurnover)}</span>
                  </div>
                )}

                {/* 6. TCI Base Rate & Loading */}
                {calculations.isTciActive && (
                  <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/60">
                    <span className="text-slate-600 dark:text-slate-400">6. TCI Rate & Loading:</span>
                    <span className="font-mono font-medium text-emerald-600">
                      {calculations.tciRes?.base_rate_percent}%
                      {calculations.tciRes?.concentration_loading_percent ? ' (+20%)' : ''}
                    </span>
                  </div>
                )}

                {/* 7. Burglary First Loss Sum Insured */}
                {calculations.isBurglaryActive && (
                  <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/60">
                    <span className="text-slate-600 dark:text-slate-400">7. Burglary First Loss SI:</span>
                    <span className="font-mono font-medium">
                      ₹{formatNumberINR(calculations.burglaryRes?.first_loss_sum_insured || 0)} ({firstLossPct}%)
                    </span>
                  </div>
                )}

                {/* 8. Physical Security Discounts */}
                {calculations.isBurglaryActive && (
                  <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/60">
                    <span className="text-slate-600 dark:text-slate-400">8. Security Discounts:</span>
                    <span className="font-mono text-emerald-600 font-medium">
                      -{calculations.burglaryRes?.total_security_discount_percent}% Disc
                    </span>
                  </div>
                )}

                {/* 9. Statutory Net Premium */}
                <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/60">
                  <span className="text-slate-600 dark:text-slate-400 font-semibold">9. Statutory Net Premium:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    ₹{formatNumberINR(calculations.netPremium)}
                  </span>
                </div>

                {/* 10. Statutory GST (18%) */}
                <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/60">
                  <span className="text-slate-600 dark:text-slate-400 font-semibold">10. Goods & Services Tax (18%):</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    ₹{formatNumberINR(calculations.gstAmount)}
                  </span>
                </div>
              </div>

              {/* Total Premium Payable Box */}
              <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                    Total Premium Payable
                  </span>
                  <span className="text-[10px] text-slate-500">Includes 18% Statutory GST</span>
                </div>
                <span className="text-base font-bold font-mono text-emerald-900 dark:text-emerald-200">
                  ₹{formatNumberINR(calculations.totalPremium)}
                </span>
              </div>

              {/* Explainability Accordion Drawer */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsExplainabilityOpen(!isExplainabilityOpen)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-600" />
                    Algorithmic Explainability Vector
                  </span>
                  {isExplainabilityOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>
                {isExplainabilityOpen && (
                  <div className="p-3 bg-white dark:bg-slate-900 text-xs space-y-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/40 text-[11px] space-y-1">
                      <p className="font-semibold text-slate-900 dark:text-white">Underwriting Mechanics:</p>
                      {calculations.isSuretyActive && (
                        <p className="text-slate-600 dark:text-slate-400">
                          • Surety: Base {SURETY_BASE_RATES[bondType]}% p.a. x {CONTRACTOR_GRADE_MULTIPLIERS[contractorGrade].mult}x (Grade {contractorGrade}) x {(tenureMonths / 12).toFixed(2)}x tenure. Margin: {calculations.suretyRes?.required_collateral_margin_percent}%.
                        </p>
                      )}
                      {calculations.isTciActive && (
                        <p className="text-slate-600 dark:text-slate-400">
                          • Trade Credit: {creditDays}d terms rate {TRADE_CREDIT_RATES[creditDays]}% on turnover with {top10SharePct > 60 ? '+20% concentration loading' : '0% concentration loading'}. Indemnity clamped to {calculations.tciRes?.clamped_indemnity_percent}%.
                        </p>
                      )}
                      {calculations.isBurglaryActive && (
                        <p className="text-slate-600 dark:text-slate-400">
                          • Burglary: {firstLossPct}% first loss scale rated at 2.50‰ with -{calculations.burglaryRes?.total_security_discount_percent}% physical security discounts.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Validation Notice if any */}
              {!calculations.validation.is_valid && (
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>{calculations.validation.error}</span>
                </div>
              )}

              {/* Primary Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={!calculations.validation.is_valid}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 transition disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  Download PDF Quote Slip
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!calculations.validation.is_valid || isSubmitting}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-600/30 transition disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSubmitting ? 'Saving to Workspace...' : 'Save Quote to Workspace'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
