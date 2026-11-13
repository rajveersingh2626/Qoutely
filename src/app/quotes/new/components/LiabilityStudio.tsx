'use client';

import React, { useState, useMemo } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Scale,
  Building2,
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
  DollarSign,
  UserCheck,
  Briefcase,
  AlertCircle,
  KeyRound,
  Server,
  Database,
  Search,
  Eye,
  GraduationCap,
} from 'lucide-react';
import { formatNumberINR, formatINRWithDecimals } from '@/lib/calculator';
import {
  calculateCglPremium,
  calculateProfessionalIndemnity,
  calculateDirectorsOfficersPremium,
  evaluateCyberPosture,
  calculateCommercialCrimePremium,
  validateLiabilityStudioPackage,
  calculateCorporateLiabilityQuote,
  CGL_HAZARD_RATES_PER_MILLE,
  CGL_LIMIT_RATIO_MULTIPLIERS,
  CGL_TERRITORY_MULTIPLIERS,
  PI_PROFESSION_RATES,
  DO_SIDE_RATES,
  DO_LISTING_MULTIPLIERS,
  CRIME_PER_HEAD_RATE,
  CRIME_LOI_RATE,
  STATUTORY_GST_RATE,
  CglHazardCategory,
  CglLimitRatio,
  CglTerritory,
  PiProfession,
  CyberPostureAnswers,
} from '@/lib/engines/liability-engine';
import {
  downloadLiabilityQuotePDF,
  LiabilityQuoteData,
} from '@/lib/pdf/liability-pdf';
import { useWorkspace } from '@/context/WorkspaceContext';
import { CorporateLiabilityRiskDetails } from '@/types/database';

interface LiabilityStudioProps {
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

export const LiabilityStudio: React.FC<LiabilityStudioProps> = ({
  clientInfo,
  onClientInfoChange,
  onSaveQuote,
  isSubmitting = false,
}) => {
  const { currentWorkspace } = useWorkspace();

  // Mobile navigation tab: 'parameters' | 'posture' | 'ledger'
  const [activeMobileTab, setActiveMobileTab] = useState<'parameters' | 'posture' | 'ledger'>('parameters');

  // Sub-line tab: 'package' | 'cgl' | 'pi' | 'do' | 'cyber' | 'crime'
  const [subLine, setSubLine] = useState<'package' | 'cgl' | 'pi' | 'do' | 'cyber' | 'crime'>('package');

  // Explainability drawer open state
  const [isExplainabilityOpen, setIsExplainabilityOpen] = useState<boolean>(false);

  // --------------------------------------------------------------------------
  // Corporate Core & Policy Parameters (Column 1)
  // --------------------------------------------------------------------------
  const [corporateName, setCorporateName] = useState<string>(clientInfo.clientName || 'Infosys Technologies Private Limited');
  const [annualTurnover, setAnnualTurnover] = useState<number>(100_00_00_000); // ₹100 Cr

  // Sub-line line toggles (for package and individual tabs)
  const [optCgl, setOptCgl] = useState<boolean>(true);
  const [optPi, setOptPi] = useState<boolean>(true);
  const [optDo, setOptDo] = useState<boolean>(true);
  const [optCyber, setOptCyber] = useState<boolean>(true);
  const [optCrime, setOptCrime] = useState<boolean>(true);

  // CGL Parameters
  const [cglHazardCat, setCglHazardCat] = useState<CglHazardCategory>(1);
  const [cglAoyLimit, setCglAoyLimit] = useState<number>(20_00_00_000); // ₹20 Cr
  const [cglRatio, setCglRatio] = useState<CglLimitRatio>('1:2');
  const [cglTerritory, setCglTerritory] = useState<CglTerritory>('worldwide_ex_usa');

  // PI Parameters
  const [piProfession, setPiProfession] = useState<PiProfession>('tech_software');
  const [piFeeIncome, setPiFeeIncome] = useState<number>(30_00_00_000); // ₹30 Cr
  const [piLoi, setPiLoi] = useState<number>(25_00_00_000); // ₹25 Cr
  const [piPriorCleanYears, setPiPriorCleanYears] = useState<number>(3); // +30% loading

  // D&O Parameters
  const [doLoi, setDoLoi] = useState<number>(30_00_00_000); // ₹30 Cr
  const [doListingStatus, setDoListingStatus] = useState<'private_unlisted' | 'public_listed_india' | 'public_listed_us_adr'>('private_unlisted');
  const [doDeRatio, setDoDeRatio] = useState<number>(1.2); // <= 3.0 healthy

  // Cyber Parameters
  const [cyberLoi, setCyberLoi] = useState<number>(25_00_00_000); // ₹25 Cr
  const [cyberBasePremium, setCyberBasePremium] = useState<number>(8_00_000); // ₹8 Lakhs base

  // Cyber 6-Control Checklist State
  const [cyberAnswers, setCyberAnswers] = useState<CyberPostureAnswers>({
    has_mfa_everywhere: true,
    has_edr_endpoints: true,
    has_airgapped_backups: true,
    has_annual_vapt: true,
    has_247_soc: true,
    has_employee_training: true,
  });

  // Commercial Crime Parameters
  const [crimeEmployees, setCrimeEmployees] = useState<number>(30);
  const [crimeLoi, setCrimeLoi] = useState<number>(10_00_00_000); // ₹10 Cr
  const [crimeDualAuth, setCrimeDualAuth] = useState<boolean>(true); // -15% discount

  // Derived AOA limit from ratio
  const cglAoaLimit = useMemo(() => {
    switch (cglRatio) {
      case '1:1':
        return cglAoyLimit;
      case '1:2':
        return Math.round(cglAoyLimit / 2);
      case '1:3':
        return Math.round(cglAoyLimit / 3);
      case '1:4':
        return Math.round(cglAoyLimit / 4);
    }
  }, [cglAoyLimit, cglRatio]);

  // --------------------------------------------------------------------------
  // Reactive Calculations
  // --------------------------------------------------------------------------
  const calculations = useMemo(() => {
    // 1. CGL Calculation
    let cglRes = null;
    const isCglActive = (subLine === 'package' && optCgl) || subLine === 'cgl';
    if (isCglActive && annualTurnover > 0 && cglAoyLimit > 0) {
      try {
        cglRes = calculateCglPremium({
          annual_turnover: annualTurnover,
          aoa_limit: cglAoaLimit,
          aoy_limit: cglAoyLimit,
          ratio: cglRatio,
          hazard_category: cglHazardCat,
          territory: cglTerritory,
        });
      } catch (e) {
        cglRes = null;
      }
    }

    // 2. PI Calculation
    let piRes = null;
    const isPiActive = (subLine === 'package' && optPi) || subLine === 'pi';
    if (isPiActive && piLoi > 0) {
      piRes = calculateProfessionalIndemnity({
        annual_fee_income: piFeeIncome,
        limit_of_indemnity: piLoi,
        profession: piProfession,
        prior_clean_years: piPriorCleanYears,
      });
    }

    // 3. D&O Calculation
    let doRes = null;
    const isDoActive = (subLine === 'package' && optDo) || subLine === 'do';
    if (isDoActive && doLoi > 0) {
      doRes = calculateDirectorsOfficersPremium({
        limit_of_indemnity: doLoi,
        entity_listing_status: doListingStatus,
        debt_to_equity_ratio: doDeRatio,
      });
    }

    // 4. Cyber Calculation
    let cyberRes = null;
    const isCyberActive = (subLine === 'package' && optCyber) || subLine === 'cyber';
    if (isCyberActive) {
      cyberRes = evaluateCyberPosture(cyberAnswers, cyberBasePremium);
    }

    // 5. Crime Calculation
    let crimeRes = null;
    const isCrimeActive = (subLine === 'package' && optCrime) || subLine === 'crime';
    if (isCrimeActive) {
      crimeRes = calculateCommercialCrimePremium({
        employees_with_funds_access: crimeEmployees,
        limit_of_liability: crimeLoi,
        has_dual_authorization_above_50k: crimeDualAuth,
      });
    }

    // Combined Totals
    let totalLimit = 0;
    let netPremium = 0;
    const activeLinesList: string[] = [];

    if (isCglActive && cglRes) {
      netPremium += cglRes.net_cgl_premium;
      totalLimit += cglAoyLimit;
      activeLinesList.push('CGL');
    }
    if (isPiActive && piRes) {
      netPremium += piRes.net_pi_premium;
      totalLimit += piLoi;
      activeLinesList.push('PI');
    }
    if (isDoActive && doRes) {
      netPremium += doRes.net_do_premium;
      totalLimit += doLoi;
      activeLinesList.push('D&O');
    }
    if (isCyberActive && cyberRes) {
      netPremium += cyberRes.final_cyber_premium;
      totalLimit += cyberLoi;
      activeLinesList.push('Cyber');
    }
    if (isCrimeActive && crimeRes) {
      netPremium += crimeRes.net_crime_premium;
      totalLimit += crimeLoi;
      activeLinesList.push('Crime');
    }

    const gstAmount = Math.round(netPremium * (STATUTORY_GST_RATE / 100));
    const totalPremium = netPremium + gstAmount;

    // Validation
    const validation = validateLiabilityStudioPackage({
      corporate_name: corporateName,
      turnover: annualTurnover,
      opt_cgl: isCglActive,
      opt_cyber: isCyberActive,
      opt_do: isDoActive,
      opt_crime: isCrimeActive,
    });

    return {
      cglRes,
      piRes,
      doRes,
      cyberRes,
      crimeRes,
      isCglActive,
      isPiActive,
      isDoActive,
      isCyberActive,
      isCrimeActive,
      totalLimit,
      netPremium,
      gstAmount,
      totalPremium,
      activeLinesList,
      validation,
    };
  }, [
    subLine,
    corporateName,
    annualTurnover,
    optCgl,
    optPi,
    optDo,
    optCyber,
    optCrime,
    cglHazardCat,
    cglAoyLimit,
    cglAoaLimit,
    cglRatio,
    cglTerritory,
    piProfession,
    piFeeIncome,
    piLoi,
    piPriorCleanYears,
    doLoi,
    doListingStatus,
    doDeRatio,
    cyberLoi,
    cyberBasePremium,
    cyberAnswers,
    crimeEmployees,
    crimeLoi,
    crimeDualAuth,
  ]);

  // Cyber toggle handler
  const handleToggleCyberControl = (key: keyof CyberPostureAnswers) => {
    setCyberAnswers((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // PDF Download Handler
  const handleDownloadPdf = () => {
    const quoteData: LiabilityQuoteData = {
      quote_number: `QT-LIAB-${Date.now().toString().slice(-6)}`,
      client_name: clientInfo.clientName || corporateName || 'Corporate Client',
      client_gst: clientInfo.clientGst || '27AAAAA0000A1Z5',
      client_address: clientInfo.clientAddress || 'Corporate Financial District, Mumbai 400051',
      corporate_name: corporateName,
      annual_turnover: annualTurnover,
      sub_line: subLine === 'package' ? 'liability_package' : subLine,
      cgl_opted: calculations.isCglActive,
      cgl_aoa_limit: cglAoaLimit,
      cgl_aoy_limit: cglAoyLimit,
      cgl_ratio: cglRatio,
      cgl_territory: cglTerritory,
      cgl_hazard_category: cglHazardCat,
      cgl_net_premium: calculations.cglRes?.net_cgl_premium,
      pi_opted: calculations.isPiActive,
      pi_profession: piProfession,
      pi_annual_fee_income: piFeeIncome,
      pi_limit_of_indemnity: piLoi,
      pi_prior_clean_years: piPriorCleanYears,
      pi_statutory_minimum_met: calculations.piRes?.statutory_minimum_met,
      pi_net_premium: calculations.piRes?.net_pi_premium,
      do_opted: calculations.isDoActive,
      do_limit_of_indemnity: doLoi,
      do_entity_listing_status: doListingStatus,
      do_debt_to_equity_ratio: doDeRatio,
      do_distress_loading_percent: calculations.doRes?.financial_distress_loading_percent,
      do_side_a_premium: calculations.doRes?.side_a_premium,
      do_side_b_premium: calculations.doRes?.side_b_premium,
      do_side_c_premium: calculations.doRes?.side_c_premium,
      do_net_premium: calculations.doRes?.net_do_premium,
      cyber_opted: calculations.isCyberActive,
      cyber_limit_of_indemnity: cyberLoi,
      cyber_base_premium: cyberBasePremium,
      cyber_score: calculations.cyberRes?.score,
      cyber_posture_tier: calculations.cyberRes?.posture_tier,
      cyber_rate_adjustment_percent: calculations.cyberRes?.rate_adjustment_percent,
      cyber_can_issue_quote: calculations.cyberRes?.can_issue_quote,
      cyber_answers: cyberAnswers,
      cyber_net_premium: calculations.cyberRes?.final_cyber_premium,
      crime_opted: calculations.isCrimeActive,
      crime_employees_with_funds_access: crimeEmployees,
      crime_limit_of_liability: crimeLoi,
      crime_has_dual_authorization_above_50k: crimeDualAuth,
      crime_per_head_premium: calculations.crimeRes?.per_head_premium,
      crime_limit_premium: calculations.crimeRes?.limit_premium,
      crime_control_adjustment: calculations.crimeRes?.internal_controls_discount_or_loading,
      crime_net_premium: calculations.crimeRes?.net_crime_premium,
      calculation: {
        sum_insured: calculations.totalLimit,
        cgl_premium: calculations.cglRes?.net_cgl_premium,
        pi_premium: calculations.piRes?.net_pi_premium,
        do_premium: calculations.doRes?.net_do_premium,
        cyber_premium: calculations.cyberRes?.final_cyber_premium,
        crime_premium: calculations.crimeRes?.net_crime_premium,
        net_premium: calculations.netPremium,
        gst_amount: calculations.gstAmount,
        total_premium: calculations.totalPremium,
      },
    };

    downloadLiabilityQuotePDF(quoteData, currentWorkspace || undefined);
  };

  // Save Quote Handler
  const handleSave = async () => {
    const quoteNumber = `QT-LIAB-${Date.now().toString().slice(-6)}`;

    const riskDetails: CorporateLiabilityRiskDetails = {
      sub_line: subLine === 'package' ? 'liability_package' : subLine,
      corporate_name: corporateName,
      annual_turnover: annualTurnover,
      cgl_opted: calculations.isCglActive,
      cgl_hazard_category: cglHazardCat,
      cgl_aoa_limit: cglAoaLimit,
      cgl_aoy_limit: cglAoyLimit,
      cgl_ratio: cglRatio,
      cgl_territory: cglTerritory,
      pi_opted: calculations.isPiActive,
      pi_profession: piProfession,
      pi_annual_fee_income: piFeeIncome,
      pi_limit_of_indemnity: piLoi,
      pi_prior_clean_years: piPriorCleanYears,
      do_opted: calculations.isDoActive,
      do_limit_of_indemnity: doLoi,
      do_entity_listing_status: doListingStatus,
      do_debt_to_equity_ratio: doDeRatio,
      cyber_opted: calculations.isCyberActive,
      cyber_limit_of_indemnity: cyberLoi,
      cyber_base_premium: cyberBasePremium,
      cyber_posture_answers: cyberAnswers,
      cyber_score: calculations.cyberRes?.score,
      cyber_posture_tier: calculations.cyberRes?.posture_tier,
      crime_opted: calculations.isCrimeActive,
      crime_employees_with_funds_access: crimeEmployees,
      crime_limit_of_liability: crimeLoi,
      crime_has_dual_authorization_above_50k: crimeDualAuth,
      selected_lines_count: calculations.activeLinesList.length,
    };

    const quotePayload = {
      quote_number: quoteNumber,
      client_name: corporateName || clientInfo.clientName || 'Corporate Liability Client',
      client_gst: clientInfo.clientGst || '27AAAAA0000A1Z5',
      lob_category: 'liability',
      insurance_line: subLine === 'package' ? 'liability_package' : subLine,
      sum_insured: calculations.totalLimit,
      sum_insured_breakdown: {
        total_aggregate_limit: calculations.totalLimit,
        cgl_aoy_limit: calculations.isCglActive ? cglAoyLimit : 0,
        pi_loi: calculations.isPiActive ? piLoi : 0,
        do_loi: calculations.isDoActive ? doLoi : 0,
        cyber_loi: calculations.isCyberActive ? cyberLoi : 0,
        crime_limit: calculations.isCrimeActive ? crimeLoi : 0,
      },
      premium: calculations.netPremium,
      gst_amount: calculations.gstAmount,
      total_premium: calculations.totalPremium,
      policy_rate: annualTurnover > 0 ? (calculations.netPremium / annualTurnover) * 100 : 0,
      status: 'draft',
      ai_confidence: 0.98,
      risk_details: riskDetails,
      calculation_breakdown: {
        lob_category: 'liability',
        insurance_line: subLine === 'package' ? 'liability_package' : subLine,
        sum_insured: calculations.totalLimit,
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
            { id: 'package', label: 'All Liability Package', icon: ShieldCheck, badge: '5 Lines' },
            { id: 'cgl', label: 'CGL & Casualty', icon: Shield, badge: 'Feature 26' },
            { id: 'pi', label: 'PI / E&O', icon: Briefcase, badge: 'IRDAI 2018' },
            { id: 'do', label: 'D&O Executive', icon: Scale, badge: 'Side A/B/C' },
            { id: 'cyber', label: 'Cyber Posture', icon: Lock, badge: 'DPDPA 2023' },
            { id: 'crime', label: 'Crime & Fidelity', icon: KeyRound, badge: 'Dual Auth' },
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
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/25 ring-2 ring-indigo-600/20'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
                    isActive ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
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
              activeMobileTab === 'parameters' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-500'
            }`}
          >
            Parameters
          </button>
          <button
            type="button"
            onClick={() => setActiveMobileTab('posture')}
            className={`px-2.5 py-1 rounded-md font-medium transition ${
              activeMobileTab === 'posture' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-500'
            }`}
          >
            Controls
          </button>
          <button
            type="button"
            onClick={() => setActiveMobileTab('ledger')}
            className={`px-2.5 py-1 rounded-md font-medium transition ${
              activeMobileTab === 'ledger' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-500'
            }`}
          >
            Ledger
          </button>
        </div>
      </div>

      {/* Main 3-Column Studio Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 overflow-y-auto">
        {/* ================================================================== */}
        {/* COLUMN 1: CORPORATE CORE & UNDERWRITING PARAMETERS (4 COLS)       */}
        {/* ================================================================== */}
        <div
          className={`lg:col-span-4 space-y-4 ${
            activeMobileTab === 'parameters' ? 'block' : 'hidden lg:block'
          }`}
        >
          {/* Corporate Profile Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Corporate Insured Profile
              </h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Corporate Entity Name
                </label>
                <input
                  type="text"
                  value={corporateName}
                  onChange={(e) => {
                    setCorporateName(e.target.value);
                    onClientInfoChange('clientName', e.target.value);
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  placeholder="e.g. Acme Tech Solutions Ltd"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  <span>Annual Global Turnover (INR)</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400">
                    ₹{formatNumberINR(annualTurnover)}
                  </span>
                </div>
                <input
                  type="range"
                  min="5000000"
                  max="10000000000"
                  step="5000000"
                  value={annualTurnover}
                  onChange={(e) => setAnnualTurnover(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-0.5">
                  <span>₹50 Lakhs</span>
                  <span>₹500 Cr</span>
                  <span>₹1,000 Cr</span>
                </div>
              </div>

              {/* Sub-line toggles for package */}
              {subLine === 'package' && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                    Active Coverage Lines
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={optCgl}
                        onChange={(e) => setOptCgl(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-medium text-slate-700 dark:text-slate-300">CGL Casualty</span>
                    </label>
                    <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={optPi}
                        onChange={(e) => setOptPi(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-medium text-slate-700 dark:text-slate-300">PI / E&O</span>
                    </label>
                    <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={optDo}
                        onChange={(e) => setOptDo(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-medium text-slate-700 dark:text-slate-300">D&O Liability</span>
                    </label>
                    <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={optCyber}
                        onChange={(e) => setOptCyber(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-medium text-slate-700 dark:text-slate-300">Cyber Risk</span>
                    </label>
                    <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer col-span-2">
                      <input
                        type="checkbox"
                        checked={optCrime}
                        onChange={(e) => setOptCrime(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-medium text-slate-700 dark:text-slate-300">Commercial Crime & Fidelity</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CGL Parameters Card */}
          {(subLine === 'cgl' || (subLine === 'package' && optCgl)) && (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Commercial General Liability (Feature 26)
                  </h4>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                  {CGL_HAZARD_RATES_PER_MILLE[cglHazardCat].toFixed(2)}‰ Rate
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Hazard Classification
                  </label>
                  <select
                    value={cglHazardCat}
                    onChange={(e) => setCglHazardCat(Number(e.target.value) as CglHazardCategory)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                  >
                    <option value={1}>Category 1: IT / Financial / Consulting (0.30‰)</option>
                    <option value={2}>Category 2: Light Mfg / Retail / Hospitality (0.60‰)</option>
                    <option value={3}>Category 3: Heavy Engineering / Construction (1.20‰)</option>
                    <option value={4}>Category 4: Hazardous Chemicals / Petrochemical (2.50‰)</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    <span>Any One Year (AOY) Aggregate Limit</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400">
                      ₹{formatNumberINR(cglAoyLimit)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10000000"
                    max="1000000000"
                    step="5000000"
                    value={cglAoyLimit}
                    onChange={(e) => setCglAoyLimit(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      AOA:AOY Limit Ratio
                    </label>
                    <select
                      value={cglRatio}
                      onChange={(e) => setCglRatio(e.target.value as CglLimitRatio)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                    >
                      <option value="1:1">1:1 (0% Discount)</option>
                      <option value="1:2">1:2 (-15% Discount)</option>
                      <option value="1:3">1:3 (-22% Discount)</option>
                      <option value="1:4">1:4 (-28% Discount)</option>
                    </select>
                    <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                      AOA: ₹{formatNumberINR(cglAoaLimit)}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Territorial Jurisdiction
                    </label>
                    <select
                      value={cglTerritory}
                      onChange={(e) => setCglTerritory(e.target.value as CglTerritory)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                    >
                      <option value="india_only">India Only (1.0x)</option>
                      <option value="worldwide_ex_usa">Worldwide ex-USA (1.5x)</option>
                      <option value="worldwide_inc_usa">Worldwide inc-USA (2.5x)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PI / E&O Parameters Card */}
          {(subLine === 'pi' || (subLine === 'package' && optPi)) && (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Professional Indemnity (Feature 27)
                  </h4>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                  {(PI_PROFESSION_RATES[piProfession] * 100).toFixed(2)}% Rate
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Professional Practice Line
                  </label>
                  <select
                    value={piProfession}
                    onChange={(e) => setPiProfession(e.target.value as PiProfession)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="tech_software">Technology, SaaS & Software (0.85%)</option>
                    <option value="consultants_ca">Management Consultants & CA (1.20%)</option>
                    <option value="insurance_broker">Direct Insurance Brokers (1.50%)</option>
                    <option value="medical_doctor">Medical Practitioners & Clinics (2.00%)</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    <span>Limit of Indemnity (LOI)</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400">
                      ₹{formatNumberINR(piLoi)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="2500000"
                    max="500000000"
                    step="2500000"
                    value={piLoi}
                    onChange={(e) => setPiLoi(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Annual Fee Income (INR)
                    </label>
                    <input
                      type="number"
                      value={piFeeIncome}
                      onChange={(e) => setPiFeeIncome(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Prior Clean Years
                    </label>
                    <select
                      value={piPriorCleanYears}
                      onChange={(e) => setPiPriorCleanYears(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                    >
                      <option value={0}>0 Years (+0% Loading)</option>
                      <option value={1}>1 Year (+10% Loading)</option>
                      <option value={2}>2 Years (+20% Loading)</option>
                      <option value={3}>3 Years (+30% Loading)</option>
                      <option value={4}>4 Years (+40% Loading)</option>
                      <option value={5}>5+ Years (+50% Max Cap)</option>
                    </select>
                  </div>
                </div>

                {/* IRDAI Broker Statutory Check Alert */}
                {piProfession === 'insurance_broker' && (
                  <div
                    className={`p-2.5 rounded-xl border flex items-start gap-2 text-xs ${
                      calculations.piRes?.statutory_minimum_met
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                        : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                    }`}
                  >
                    {calculations.piRes?.statutory_minimum_met ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
                    )}
                    <div>
                      <span className="font-bold">
                        {calculations.piRes?.statutory_minimum_met
                          ? 'IRDAI 2018 Statutory Minimum Satisfied'
                          : 'Statutory Broker Limit Deficit!'}
                      </span>
                      <p className="text-[11px] opacity-90 mt-0.5">
                        IRDAI Broker Regulations 2018 mandate minimum limit of{' '}
                        <strong>₹{formatNumberINR(Math.max(50_00_000, piFeeIncome * 3))}</strong> (3x fees or ₹50 Lakhs).
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ================================================================== */}
        {/* COLUMN 2: RISK, CONTROLS & CYBER POSTURE MATRIX (4 COLS)          */}
        {/* ================================================================== */}
        <div
          className={`lg:col-span-4 space-y-4 ${
            activeMobileTab === 'posture' ? 'block' : 'hidden lg:block'
          }`}
        >
          {/* Cyber 6-Control Posture Card */}
          {(subLine === 'cyber' || (subLine === 'package' && optCyber)) && (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Cyber Security Posture Matrix
                  </h4>
                </div>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                    calculations.cyberRes?.posture_tier === 'mature'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : calculations.cyberRes?.posture_tier === 'adequate'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      : calculations.cyberRes?.posture_tier === 'deficient'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}
                >
                  {calculations.cyberRes?.posture_tier}
                </span>
              </div>

              {/* Progress & Score Bar */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Underwriting Score</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {calculations.cyberRes?.score} / 100
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      (calculations.cyberRes?.score ?? 0) >= 85
                        ? 'bg-emerald-500'
                        : (calculations.cyberRes?.score ?? 0) >= 70
                        ? 'bg-blue-500'
                        : (calculations.cyberRes?.score ?? 0) >= 50
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${calculations.cyberRes?.score ?? 0}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                  <span>0 (Uninsurable)</span>
                  <span>50 (Deficient +30%)</span>
                  <span>70 (Par)</span>
                  <span>85+ (Mature -20%)</span>
                </div>
              </div>

              {/* 6-Control Checklist */}
              <div className="space-y-2">
                {[
                  {
                    key: 'has_mfa_everywhere' as const,
                    label: 'Multi-Factor Auth (MFA) Everywhere',
                    pts: 25,
                    isHardGate: true,
                    desc: 'Required on all endpoints, VPNs, cloud consoles & email',
                    icon: KeyRound,
                  },
                  {
                    key: 'has_edr_endpoints' as const,
                    label: 'Endpoint Detection & Response (EDR)',
                    pts: 20,
                    isHardGate: false,
                    desc: 'Centralized EDR with automated host isolation',
                    icon: Server,
                  },
                  {
                    key: 'has_airgapped_backups' as const,
                    label: 'Immutable Airgapped Offline Backups',
                    pts: 20,
                    isHardGate: false,
                    desc: 'WORM storage isolated from corporate domain',
                    icon: Database,
                  },
                  {
                    key: 'has_annual_vapt' as const,
                    label: 'Annual CERT-In Empanelled VAPT',
                    pts: 15,
                    isHardGate: false,
                    desc: 'Independent penetration testing with patch SLA',
                    icon: Search,
                  },
                  {
                    key: 'has_247_soc' as const,
                    label: '24/7 Managed SOC / MDR Monitoring',
                    pts: 10,
                    isHardGate: false,
                    desc: 'Continuous threat hunting and SIEM telemetry',
                    icon: Eye,
                  },
                  {
                    key: 'has_employee_training' as const,
                    label: 'Quarterly Phishing Simulation & Training',
                    pts: 10,
                    isHardGate: false,
                    desc: 'Simulated campaigns with remedial coaching',
                    icon: GraduationCap,
                  },
                ].map((ctrl) => {
                  const Icon = ctrl.icon;
                  const isChecked = cyberAnswers[ctrl.key];
                  return (
                    <div
                      key={ctrl.key}
                      onClick={() => handleToggleCyberControl(ctrl.key)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                        isChecked
                          ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800'
                          : ctrl.isHardGate
                          ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // handled by parent div
                        className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Icon className="w-3.5 h-3.5 text-indigo-500" />
                            {ctrl.label}
                          </span>
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                              isChecked
                                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                            }`}
                          >
                            +{ctrl.pts} pts
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{ctrl.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Uninsurable Warning Callout */}
              {!calculations.cyberRes?.can_issue_quote && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-2 text-xs text-rose-800 dark:text-rose-300">
                  <XCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-bold">Underwriting Decline: Risk Uninsurable</span>
                    <p className="text-[11px] opacity-90 mt-0.5">
                      {calculations.cyberRes?.reasons.join('; ')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* D&O Executive Profile & Balance Sheet Leverage */}
          {(subLine === 'do' || (subLine === 'package' && optDo)) && (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    D&O Tri-Partite Structure (Feature 28)
                  </h4>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                  {DO_LISTING_MULTIPLIERS[doListingStatus]}x Mult
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Corporate Listing Status
                  </label>
                  <select
                    value={doListingStatus}
                    onChange={(e) => setDoListingStatus(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="private_unlisted">Private Unlisted Entity (1.0x)</option>
                    <option value="public_listed_india">Public Listed on BSE / NSE (1.8x)</option>
                    <option value="public_listed_us_adr">Public Listed with US ADR / NYSE (3.5x)</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    <span>Debt-to-Equity (D/E) Leverage Ratio</span>
                    <span
                      className={`font-mono font-bold ${
                        doDeRatio > 3.0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {doDeRatio.toFixed(2)}x {doDeRatio > 3.0 ? '(+25% Distress)' : '(Healthy)'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5.0"
                    step="0.1"
                    value={doDeRatio}
                    onChange={(e) => setDoDeRatio(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5">
                    <span>0.0x (Net Cash)</span>
                    <span>3.0x (Distress Threshold)</span>
                    <span>5.0x (Severe Leverage)</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Side A (Non-Indemnified 0.40%):</span>
                    <span className="font-mono font-medium">₹{formatNumberINR(calculations.doRes?.side_a_premium || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Side B (Corporate Reimbursement 0.35%):</span>
                    <span className="font-mono font-medium">₹{formatNumberINR(calculations.doRes?.side_b_premium || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Side C (Entity Securities 0.50%):</span>
                    <span className="font-mono font-medium">₹{formatNumberINR(calculations.doRes?.side_c_premium || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Commercial Crime Internal Financial Controls */}
          {(subLine === 'crime' || (subLine === 'package' && optCrime)) && (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Commercial Crime & Fidelity (Feature 30)
                  </h4>
                </div>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                    crimeDualAuth
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}
                >
                  {crimeDualAuth ? '-15% Discount' : '+25% Loading'}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    <span>Sensitive Employees with Funds Access</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400">
                      {crimeEmployees} Staff (@ ₹250/head)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="500"
                    step="1"
                    value={crimeEmployees}
                    onChange={(e) => setCrimeEmployees(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    <span>Limit of Liability (0.50% Tariff)</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400">
                      ₹{formatNumberINR(crimeLoi)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1000000"
                    max="200000000"
                    step="1000000"
                    value={crimeLoi}
                    onChange={(e) => setCrimeLoi(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                {/* Dual Authorization Toggle */}
                <div
                  onClick={() => setCrimeDualAuth(!crimeDualAuth)}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                    crimeDualAuth
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                      : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800'
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Mandatory Dual Signatory Authority
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Enforced on all wire transfers and fund releases exceeding ₹50,000
                    </span>
                  </div>
                  <div
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                      crimeDualAuth ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        crimeDualAuth ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================================================================== */}
        {/* COLUMN 3: STICKY 10-ROW TARIFF LEDGER & ACTIONS (4 COLS)          */}
        {/* ================================================================== */}
        <div
          className={`lg:col-span-4 space-y-4 ${
            activeMobileTab === 'ledger' ? 'block' : 'hidden lg:block'
          }`}
        >
          <div className="sticky top-6 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            {/* Header & Limits Summary */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Actuarial Premium Ledger
                </h3>
                <span className="text-[11px] text-slate-500">
                  {calculations.activeLinesList.length} Active Liability Lines
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Aggregate LOI</span>
                <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  ₹{formatNumberINR(calculations.totalLimit)}
                </span>
              </div>
            </div>

            {/* Itemized 10-Row Calculation Ledger Table */}
            <div className="space-y-1.5 text-xs">
              {/* 1. CGL Base */}
              {calculations.isCglActive && (
                <>
                  <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/60">
                    <span className="text-slate-600 dark:text-slate-400">1. CGL Base Turnover Prem:</span>
                    <span className="font-mono font-medium">₹{formatNumberINR(calculations.cglRes?.gross_cgl_premium || 0)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/60">
                    <span className="text-slate-600 dark:text-slate-400">2. CGL Ratio Disc ({cglRatio}):</span>
                    <span className="font-mono text-emerald-600">-{calculations.cglRes?.ratio_discount_percent}%</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/60">
                    <span className="text-slate-600 dark:text-slate-400">3. CGL Territory ({cglTerritory}):</span>
                    <span className="font-mono text-indigo-600">{calculations.cglRes?.territory_multiplier}x</span>
                  </div>
                </>
              )}

              {/* 4 & 5. PI */}
              {calculations.isPiActive && (
                <>
                  <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/60">
                    <span className="text-slate-600 dark:text-slate-400">4. PI Base Indemnity:</span>
                    <span className="font-mono font-medium">₹{formatNumberINR(calculations.piRes?.base_pi_premium || 0)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/60">
                    <span className="text-slate-600 dark:text-slate-400">5. PI Retroactive Loading:</span>
                    <span className="font-mono text-amber-600">+{calculations.piRes?.retroactive_loading_percent}%</span>
                  </div>
                </>
              )}

              {/* 6 & 7. D&O */}
              {calculations.isDoActive && (
                <>
                  <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/60">
                    <span className="text-slate-600 dark:text-slate-400">6. D&O Side A/B/C Base:</span>
                    <span className="font-mono font-medium">
                      ₹{formatNumberINR(
                        (calculations.doRes?.side_a_premium || 0) +
                        (calculations.doRes?.side_b_premium || 0) +
                        (calculations.doRes?.side_c_premium || 0)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/60">
                    <span className="text-slate-600 dark:text-slate-400">7. D&O Distress Loading:</span>
                    <span className={`font-mono ${(calculations.doRes?.financial_distress_loading_percent || 0) > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                      +{calculations.doRes?.financial_distress_loading_percent}%
                    </span>
                  </div>
                </>
              )}

              {/* 8. Cyber */}
              {calculations.isCyberActive && (
                <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/60">
                  <span className="text-slate-600 dark:text-slate-400">8. Cyber Net ({calculations.cyberRes?.posture_tier}):</span>
                  <span className={`font-mono ${(calculations.cyberRes?.rate_adjustment_percent || 0) < 0 ? 'text-emerald-600' : (calculations.cyberRes?.rate_adjustment_percent || 0) > 0 ? 'text-amber-600' : 'text-slate-600'}`}>
                    ₹{formatNumberINR(calculations.cyberRes?.final_cyber_premium || 0)}
                  </span>
                </div>
              )}

              {/* 9 & 10. Crime */}
              {calculations.isCrimeActive && (
                <>
                  <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/60">
                    <span className="text-slate-600 dark:text-slate-400">9. Crime Head & Limit Base:</span>
                    <span className="font-mono font-medium">
                      ₹{formatNumberINR((calculations.crimeRes?.per_head_premium || 0) + (calculations.crimeRes?.limit_premium || 0))}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/60">
                    <span className="text-slate-600 dark:text-slate-400">10. Dual Auth Adjustment:</span>
                    <span className={`font-mono ${(calculations.crimeRes?.internal_controls_discount_or_loading || 0) < 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {((calculations.crimeRes?.internal_controls_discount_or_loading || 0) >= 0 ? '+' : '')}
                      ₹{formatNumberINR(calculations.crimeRes?.internal_controls_discount_or_loading || 0)}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Net, GST & Total Box */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>Net Corporate Liability Premium:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  ₹{formatNumberINR(calculations.netPremium)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>Statutory GST (18%):</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  ₹{formatNumberINR(calculations.gstAmount)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider block">
                    Total Premium Payable
                  </span>
                  <span className="text-[10px] text-slate-500">Includes 18% Statutory GST</span>
                </div>
                <span className="text-base font-bold font-mono text-indigo-900 dark:text-indigo-200">
                  ₹{formatNumberINR(calculations.totalPremium)}
                </span>
              </div>
            </div>

            {/* Explainability Accordion Drawer */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setIsExplainabilityOpen(!isExplainabilityOpen)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between"
              >
                <span className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-indigo-600" />
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
                    <p className="text-slate-600 dark:text-slate-400">
                      • CGL: Rated at {CGL_HAZARD_RATES_PER_MILLE[cglHazardCat]}‰ on turnover, ratio discount {cglRatio}, territory {cglTerritory}.
                    </p>
                    <p className="text-slate-600 dark:text-slate-400">
                      • PI: Rated at {(PI_PROFESSION_RATES[piProfession] * 100).toFixed(2)}% on LOI with +{calculations.piRes?.retroactive_loading_percent}% retroactive loading.
                    </p>
                    <p className="text-slate-600 dark:text-slate-400">
                      • D&O: Rated on Side A/B/C with {DO_LISTING_MULTIPLIERS[doListingStatus]}x listing factor and {calculations.doRes?.financial_distress_loading_percent}% distress surcharge.
                    </p>
                    <p className="text-slate-600 dark:text-slate-400">
                      • Cyber: 6-control matrix evaluated ({calculations.cyberRes?.score}/100 pts), adjustment {calculations.cyberRes?.rate_adjustment_percent}%.
                    </p>
                    <p className="text-slate-600 dark:text-slate-400">
                      • Crime: ₹250/head + 0.50% limit with {crimeDualAuth ? '-15% dual auth discount' : '+25% single signoff loading'}.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Validation Error Notice if any */}
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
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs text-indigo-700 dark:text-indigo-300 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 transition disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                Download PDF Quote Slip
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={!calculations.validation.is_valid || isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/30 transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSubmitting ? 'Saving to Workspace...' : 'Save Quote to Workspace'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
