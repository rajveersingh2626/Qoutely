'use client';

import React, { useState, useMemo } from 'react';
import {
  Anchor,
  Ship,
  Truck,
  ShieldCheck,
  FileSpreadsheet,
  Coins,
  Check,
  Download,
  Save,
  AlertTriangle,
  Info,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { formatNumberINR, formatINRWithDecimals } from '@/lib/calculator';
import {
  MarineDeclarationUploader,
  ParsedMarineDeclarationRecord,
  MarineDeclarationRollupSummary,
} from '../uploaders/MarineDeclarationUploader';
import { downloadMarineCargoQuotePDF, MarineQuoteData } from '@/lib/pdf/marine-cargo-pdf';
import { useWorkspace } from '@/context/WorkspaceContext';
import {
  calculateMarineInlandTransit,
  calculateMarineOceanCargo,
  calculateMarineQuote,
  COMMODITY_HAZARD_RATES,
  ITC_CLAUSE_MULTIPLIERS,
  ICC_OCEAN_BASE_RATES,
  MarineItcClause,
  OceanIccClause,
  OceanIncoterm,
  MarineCommodityHazard,
} from '@/lib/engines/marine-engine';
import { Quote } from '@/types/database';

interface MarineCargoStudioProps {
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

export const MarineCargoStudio: React.FC<MarineCargoStudioProps> = ({
  clientInfo,
  onClientInfoChange,
  onSaveQuote,
  isSubmitting = false,
}) => {
  const { currentWorkspace } = useWorkspace();

  // Mobile navigation tabs: 'scope' | 'clauses' | 'ledger'
  const [activeMobileTab, setActiveMobileTab] = useState<'scope' | 'clauses' | 'ledger'>('scope');

  // Policy & Transit Scope
  const [policyType, setPolicyType] = useState<'single_voyage' | 'open_policy' | 'atpo'>('single_voyage');
  const [transitType, setTransitType] = useState<'inland' | 'ocean'>('inland');
  const [origin, setOrigin] = useState('Nhava Sheva Port, JNPT Mumbai');
  const [destination, setDestination] = useState('Bangalore Logistics Park');
  const [viaTransshipment, setViaTransshipment] = useState('');

  // Cargo Risk Dimensions
  const [commodity, setCommodity] = useState('Consumer Electronics & High-Value Components');
  const [hazardClass, setHazardClass] = useState<MarineCommodityHazard>(2);
  const [packagingType, setPackagingType] = useState('Containerized FCL (Full Container Load)');
  const [consignmentValue, setConsignmentValue] = useState<number>(5000000); // 50 Lakhs default
  const [carrierName, setCarrierName] = useState('VRL Logistics / IBA Approved Carrier');
  const [carrierDocNo, setCarrierDocNo] = useState('LR-2026-99881');
  const [isCertifiedCarrier, setIsCertifiedCarrier] = useState(true);

  // MOP / ATPO Cash Deposit Balance
  const [cdBalance, setCdBalance] = useState<number>(50000);

  // Marine Clauses & Endorsements (Column 2)
  const [inlandClause, setInlandClause] = useState<MarineItcClause>('ITC_A');
  const [oceanClause, setOceanClause] = useState<OceanIccClause>('ICC_A');
  const [incoterm, setIncoterm] = useState<OceanIncoterm>('CIF');
  const [customsDutyOpted, setCustomsDutyOpted] = useState(false);
  const [customsDutyPercent, setCustomsDutyPercent] = useState<number>(30); // 30% default
  const [warAndStrikesOpted, setWarAndStrikesOpted] = useState(false);

  // Declaration Uploader Modal & State
  const [isDeclarationModalOpen, setIsDeclarationModalOpen] = useState(false);
  const [appliedDeclarations, setAppliedDeclarations] = useState<ParsedMarineDeclarationRecord[]>([]);
  const [declarationRollup, setDeclarationRollup] = useState<MarineDeclarationRollupSummary | null>(null);

  // --------------------------------------------------------------------------
  // DETERMINISTIC CALCULATION (ZERO LLM ARITHMETIC)
  // --------------------------------------------------------------------------
  const calculation = useMemo(() => {
    // If declarations have been uploaded in MOP/ATPO mode, use aggregate declared value
    const effectiveValue =
      appliedDeclarations.length > 0
        ? declarationRollup?.totalConsignmentValue || consignmentValue
        : consignmentValue;

    if (transitType === 'inland') {
      const inlandResult = calculateMarineInlandTransit({
        invoice_value: Math.max(1, effectiveValue),
        transit_clause: inlandClause,
        commodity_hazard_class: hazardClass,
        is_certified_common_carrier: isCertifiedCarrier,
      });

      const netPremium = inlandResult.net_marine_premium;
      const gstAmount = Math.round(netPremium * 0.18);
      const totalFinalPremium = netPremium + gstAmount;

      return {
        transitType: 'inland' as const,
        consignmentValue: effectiveValue,
        incotermMarkup: 0,
        insurableSumInsured: effectiveValue,
        dutySumInsured: 0,
        totalSumInsured: effectiveValue,
        baseRatePerMille: inlandResult.base_rate_per_mille,
        baseTransitPremium: inlandResult.net_marine_premium,
        customsDutyPremium: 0,
        warAndStrikesPremium: 0,
        netMarinePremium: netPremium,
        gstAmount,
        totalFinalPremium,
        policyExcess: inlandResult.policy_excess,
        policyExcessClause: inlandResult.deductible_clause,
      };
    } else {
      const oceanResult = calculateMarineOceanCargo({
        invoice_value_inr: Math.max(1, effectiveValue),
        incoterm,
        icc_clause: oceanClause,
        customs_duty_opted: customsDutyOpted,
        customs_duty_rate_percent: customsDutyPercent,
        war_and_strikes_opted: warAndStrikesOpted,
      });

      const netPremium = oceanResult.net_marine_premium;
      const gstAmount = Math.round(netPremium * 0.18);
      const totalFinalPremium = netPremium + gstAmount;
      const baseRate = ICC_OCEAN_BASE_RATES[oceanClause];
      const excess = Math.max(2500, Math.round(effectiveValue * 0.005));

      return {
        transitType: 'ocean' as const,
        consignmentValue: effectiveValue,
        incotermMarkup: oceanResult.cargo_sum_insured - effectiveValue,
        insurableSumInsured: oceanResult.cargo_sum_insured,
        dutySumInsured: oceanResult.duty_sum_insured,
        totalSumInsured: oceanResult.total_sum_insured,
        baseRatePerMille: baseRate,
        baseTransitPremium: oceanResult.cargo_premium,
        customsDutyPremium: oceanResult.duty_premium,
        warAndStrikesPremium: oceanResult.war_premium,
        netMarinePremium: netPremium,
        gstAmount,
        totalFinalPremium,
        policyExcess: excess,
        policyExcessClause: '0.5% of consignment value subject to minimum of ₹2,500 each and every loss',
      };
    }
  }, [
    transitType,
    consignmentValue,
    appliedDeclarations,
    declarationRollup,
    inlandClause,
    oceanClause,
    hazardClass,
    isCertifiedCarrier,
    incoterm,
    customsDutyOpted,
    customsDutyPercent,
    warAndStrikesOpted,
  ]);

  // Handle Declaration Ingestion Callback
  const handleApplyDeclarations = (
    declarations: ParsedMarineDeclarationRecord[],
    rollup: MarineDeclarationRollupSummary
  ) => {
    setAppliedDeclarations(declarations);
    setDeclarationRollup(rollup);
    if (declarations.length > 0) {
      setConsignmentValue(rollup.totalConsignmentValue);
      setOrigin(`${declarations[0].origin} & Multi-Hubs`);
      setDestination(`${declarations[0].destination} & Multi-Hubs`);
      if (declarations.some((d) => d.transitMode === 'sea')) {
        setTransitType('ocean');
      }
    }
  };

  // Generate and Download PDF Quote Slip
  const handleDownloadPDF = () => {
    const quoteNumber = `QOUTELY-MAR-${Math.floor(100000 + Math.random() * 900000)}`;
    const quoteData: MarineQuoteData = {
      quote_number: quoteNumber,
      client_name: clientInfo.clientName || 'Commercial Cargo Enterprise',
      client_gst: clientInfo.clientGst,
      client_address: clientInfo.clientAddress,
      hypothecation_bank: clientInfo.hypothecationBank,
      policyType,
      transitType,
      route: {
        origin,
        destination,
        viaTransshipment: viaTransshipment || undefined,
      },
      cargoDetails: {
        commodity,
        hazardClass,
        packagingType,
        carrierName,
        carrierDocNo,
        isCertifiedCarrier,
      },
      clauses: {
        transitClause: transitType === 'inland' ? inlandClause : oceanClause,
        incoterm,
        customsDutyOpted,
        customsDutyPercent: customsDutyOpted ? customsDutyPercent : undefined,
        warAndStrikesOpted,
        policyExcessClause: calculation.policyExcessClause,
      },
      calculation: {
        consignmentValue: calculation.consignmentValue,
        insurableSumInsured: calculation.insurableSumInsured,
        dutySumInsured: calculation.dutySumInsured,
        totalSumInsured: calculation.totalSumInsured,
        baseRatePerMille: calculation.baseRatePerMille,
        baseTransitPremium: calculation.baseTransitPremium,
        customsDutyPremium: calculation.customsDutyPremium,
        warAndStrikesPremium: calculation.warAndStrikesPremium,
        netMarinePremium: calculation.netMarinePremium,
        gstAmount: calculation.gstAmount,
        totalFinalPremium: calculation.totalFinalPremium,
      },
      declarationsCount: appliedDeclarations.length > 0 ? appliedDeclarations.length : undefined,
    };

    downloadMarineCargoQuotePDF(quoteData, currentWorkspace || undefined);
  };

  // Save Quote to Workspace
  const handleSave = async () => {
    const quoteNumber = `QT-MAR-${Date.now().toString().slice(-6)}`;
    const standardBreakdown = calculateMarineQuote({
      transit_type: transitType,
      inland_input:
        transitType === 'inland'
          ? {
              client_name: clientInfo.clientName,
              origin,
              destination,
              commodity_description: commodity,
              carrier_name: carrierName,
              invoice_value: calculation.consignmentValue,
              transit_clause: inlandClause,
              commodity_hazard_class: hazardClass,
              is_certified_common_carrier: isCertifiedCarrier,
            }
          : undefined,
      ocean_input:
        transitType === 'ocean'
          ? {
              client_name: clientInfo.clientName,
              origin,
              destination,
              commodity_description: commodity,
              carrier_name: carrierName,
              invoice_value_inr: calculation.consignmentValue,
              incoterm,
              icc_clause: oceanClause,
              customs_duty_opted: customsDutyOpted,
              customs_duty_rate_percent: customsDutyPercent,
              war_and_strikes_opted: warAndStrikesOpted,
            }
          : undefined,
    });

    const quotePayload: Partial<Quote> = {
      quote_number: quoteNumber,
      client_name: clientInfo.clientName || 'Commercial Client',
      client_gst: clientInfo.clientGst,
      lob_category: 'marine',
      insurance_line:
        policyType === 'open_policy' || policyType === 'atpo'
          ? 'marine_open_policy'
          : transitType === 'ocean'
          ? 'marine_cargo_ocean'
          : 'marine_cargo_inland',
      sum_insured: calculation.totalSumInsured,
      sum_insured_breakdown: {
        consignment_value: calculation.consignmentValue,
        insurable_cargo_si: calculation.insurableSumInsured,
        duty_sum_insured: calculation.dutySumInsured,
        total_sum_insured: calculation.totalSumInsured,
      },
      premium: calculation.netMarinePremium,
      gst_amount: calculation.gstAmount,
      total_premium: calculation.totalFinalPremium,
      policy_rate: calculation.baseRatePerMille,
      status: 'draft',
      ai_confidence: 0.99,
      calculation_breakdown: standardBreakdown,
      risk_details: {
        policy_type: policyType,
        transit_type: transitType,
        origin,
        destination,
        via_transshipment: viaTransshipment || undefined,
        carrier_name: carrierName,
        carrier_lr_bl_awb: carrierDocNo,
        is_certified_common_carrier: isCertifiedCarrier,
        commodity_hazard_class: hazardClass,
        commodity_description: commodity,
        packaging_type: packagingType,
        invoice_value: calculation.consignmentValue,
        incoterm,
        transit_clause: transitType === 'inland' ? inlandClause : oceanClause,
        customs_duty_opted: customsDutyOpted,
        customs_duty_rate_percent: customsDutyOpted ? customsDutyPercent : undefined,
        war_and_strikes_opted: warAndStrikesOpted,
        cd_deposit_balance: cdBalance,
        declaration_summary:
          appliedDeclarations.length > 0 && declarationRollup
            ? {
                total_shipments: declarationRollup.totalShipments,
                valid_shipments: declarationRollup.validShipments,
                invalid_shipments: declarationRollup.invalidShipments,
                total_consignment_value: declarationRollup.totalConsignmentValue,
                total_insurable_value: declarationRollup.totalInsurableValue,
                total_estimated_premium: declarationRollup.totalEstimatedPremium,
              }
            : undefined,
      },
    };

    await onSaveQuote(quotePayload);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Mobile Tab Switcher */}
      <div className="lg:hidden flex items-center justify-between p-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setActiveMobileTab('scope')}
          className={`flex-1 py-2 text-xs font-bold text-center rounded-lg transition-colors ${
            activeMobileTab === 'scope'
              ? 'bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400'
              : 'text-slate-500'
          }`}
        >
          1. Scope & Route
        </button>
        <button
          type="button"
          onClick={() => setActiveMobileTab('clauses')}
          className={`flex-1 py-2 text-xs font-bold text-center rounded-lg transition-colors ${
            activeMobileTab === 'clauses'
              ? 'bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400'
              : 'text-slate-500'
          }`}
        >
          2. Clauses & Covers
        </button>
        <button
          type="button"
          onClick={() => setActiveMobileTab('ledger')}
          className={`flex-1 py-2 text-xs font-bold text-center rounded-lg transition-colors ${
            activeMobileTab === 'ledger'
              ? 'bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400'
              : 'text-slate-500'
          }`}
        >
          3. Calculation Slip
        </button>
      </div>

      {/* 3-Column Glassmorphic Desktop Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* ================================================================== */}
        {/* COLUMN 1: Voyage Scope & Risk Dimensions (4 Cols) */}
        {/* ================================================================== */}
        <div
          className={`lg:col-span-4 border-r border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 overflow-y-auto bg-white dark:bg-slate-900 space-y-6 ${
            activeMobileTab === 'scope' ? 'block' : 'hidden lg:block'
          }`}
        >
          {/* Section Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
                <Anchor className="w-3.5 h-3.5" />
                01. Voyage Scope & Risk Dimensions
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
                Marine Cargo Schedule
              </h2>
            </div>

            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setPolicyType('single_voyage')}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                  policyType === 'single_voyage'
                    ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Single Voyage
              </button>
              <button
                type="button"
                onClick={() => setPolicyType('open_policy')}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                  policyType === 'open_policy' || policyType === 'atpo'
                    ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Open Policy (MOP)
              </button>
            </div>
          </div>

          {/* Transit Corridor Toggle: Inland vs Ocean */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Transit Domain & Corridor
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTransitType('inland')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  transitType === 'inland'
                    ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-200 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span className="text-xs font-bold">Inland Transit</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  Domestic Rail & Road transit within India (ITC A/B/C).
                </p>
              </button>

              <button
                type="button"
                onClick={() => setTransitType('ocean')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  transitType === 'ocean'
                    ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-200 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Ship className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span className="text-xs font-bold">Ocean & Air Cargo</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  International export/import marine shipments (ICC A/B/C).
                </p>
              </button>
            </div>
          </div>

          {/* Route Parameters */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Origin (Dispatch From)
              </label>
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="e.g. Nhava Sheva Port, JNPT Mumbai"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Destination (Dispatch To)
              </label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="e.g. Rotterdam Port, Netherlands"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Via Transshipment Port (Optional)
              </label>
              <input
                type="text"
                value={viaTransshipment}
                onChange={(e) => setViaTransshipment(e.target.value)}
                className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="e.g. Colombo / Singapore Transshipment Hub"
              />
            </div>
          </div>

          {/* Commodity Hazard Classification */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Commodity Hazard Classification
              </label>
              <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 font-bold">
                Rate: {COMMODITY_HAZARD_RATES[hazardClass]}‰
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setHazardClass(1)}
                className={`p-2.5 rounded-xl border text-left transition-colors ${
                  hazardClass === 1
                    ? 'border-cyan-500 bg-cyan-50/40 dark:bg-cyan-950/30 text-cyan-800 dark:text-cyan-200 font-bold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="text-xs font-semibold">Class 1: Non-Hazardous</div>
                <div className="text-[10px] text-slate-500">Steel, coal, grains, machinery (0.06‰)</div>
              </button>

              <button
                type="button"
                onClick={() => setHazardClass(2)}
                className={`p-2.5 rounded-xl border text-left transition-colors ${
                  hazardClass === 2
                    ? 'border-cyan-500 bg-cyan-50/40 dark:bg-cyan-950/30 text-cyan-800 dark:text-cyan-200 font-bold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="text-xs font-semibold">Class 2: Moderate</div>
                <div className="text-[10px] text-slate-500">FMCG, electronics, auto parts (0.12‰)</div>
              </button>

              <button
                type="button"
                onClick={() => setHazardClass(3)}
                className={`p-2.5 rounded-xl border text-left transition-colors ${
                  hazardClass === 3
                    ? 'border-cyan-500 bg-cyan-50/40 dark:bg-cyan-950/30 text-cyan-800 dark:text-cyan-200 font-bold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="text-xs font-semibold">Class 3: Fragile / Chilled</div>
                <div className="text-[10px] text-slate-500">Glassware, liquids, perishables (0.25‰)</div>
              </button>

              <button
                type="button"
                onClick={() => setHazardClass(4)}
                className={`p-2.5 rounded-xl border text-left transition-colors ${
                  hazardClass === 4
                    ? 'border-cyan-500 bg-cyan-50/40 dark:bg-cyan-950/30 text-cyan-800 dark:text-cyan-200 font-bold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="text-xs font-semibold">Class 4: High Risk / Hazchem</div>
                <div className="text-[10px] text-slate-500">Chemicals, paints, batteries (0.55‰)</div>
              </button>
            </div>
          </div>

          {/* Commodity Description & Packaging Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Commodity Description
              </label>
              <input
                type="text"
                value={commodity}
                onChange={(e) => setCommodity(e.target.value)}
                className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="Description of goods"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Packaging Type
              </label>
              <select
                value={packagingType}
                onChange={(e) => setPackagingType(e.target.value)}
                className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="Containerized FCL (Full Container Load)">Containerized FCL</option>
                <option value="Less than Container Load (LCL)">Less than Container Load (LCL)</option>
                <option value="Wooden Cases / Palletized Crates">Wooden Cases / Palletized</option>
                <option value="Steel Drums / Barrels">Steel Drums / Barrels</option>
                <option value="Corrugated 7-Ply Cartons">Corrugated 7-Ply Cartons</option>
                <option value="Bulk / Loose Cargo">Bulk / Loose Cargo</option>
              </select>
            </div>
          </div>

          {/* Commercial Invoice Consignment Value */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Commercial Invoice Value (INR)
              </label>
              <span className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 font-bold">
                ₹ {formatNumberINR(consignmentValue)}
              </span>
            </div>
            <input
              type="number"
              min={1}
              value={consignmentValue}
              onChange={(e) => setConsignmentValue(Math.max(1, parseFloat(e.target.value) || 0))}
              className="mt-1 w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Declaration Ingestion Trigger Banner */}
          <div className="p-3.5 rounded-xl bg-cyan-50/70 dark:bg-cyan-950/40 border border-cyan-200/80 dark:border-cyan-900/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Monthly Declaration Schedule
                </h4>
                <p className="text-[10px] text-slate-500">
                  {appliedDeclarations.length > 0
                    ? `${appliedDeclarations.length} shipments loaded (${formatNumberINR(
                        declarationRollup?.totalConsignmentValue || 0
                      )} INR)`
                    : 'Ingest bulk shipments via CSV for automated MOP drawdown.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsDeclarationModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold transition-colors flex-shrink-0"
            >
              {appliedDeclarations.length > 0 ? 'Edit Schedule' : 'Upload CSV'}
            </button>
          </div>
        </div>

        {/* ================================================================== */}
        {/* COLUMN 2: Marine Clauses & Endorsements (4 Cols) */}
        {/* ================================================================== */}
        <div
          className={`lg:col-span-4 border-r border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 overflow-y-auto bg-white dark:bg-slate-900 space-y-6 ${
            activeMobileTab === 'clauses' ? 'block' : 'hidden lg:block'
          }`}
        >
          {/* Section Header */}
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              02. Marine Clauses & Endorsements
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
              Institute Warranties & Incoterms
            </h2>
          </div>

          {/* Primary Transit Clause Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {transitType === 'inland'
                ? 'Inland Transit Clause (ITC Rail / Road)'
                : 'Institute Cargo Clauses (ICC 1/1/82 or 1/1/09)'}
            </label>

            {transitType === 'inland' ? (
              <div className="grid grid-cols-3 gap-2">
                {(['ITC_A', 'ITC_B', 'ITC_C'] as MarineItcClause[]).map((clause) => (
                  <button
                    key={clause}
                    type="button"
                    onClick={() => setInlandClause(clause)}
                    className={`py-2 px-2.5 rounded-xl border text-center transition-all ${
                      inlandClause === clause
                        ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 font-bold shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="text-xs">{clause.replace('_', ' ')}</div>
                    <div className="text-[10px] text-slate-500">
                      {clause === 'ITC_A'
                        ? 'All Risks (1.0x)'
                        : clause === 'ITC_B'
                        ? 'Named Perils (0.8x)'
                        : 'Fire Only (0.6x)'}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {(['ICC_A', 'ICC_B', 'ICC_C'] as OceanIccClause[]).map((clause) => (
                  <button
                    key={clause}
                    type="button"
                    onClick={() => setOceanClause(clause)}
                    className={`py-2 px-2.5 rounded-xl border text-center transition-all ${
                      oceanClause === clause
                        ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 font-bold shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="text-xs">{clause.replace('_', ' ')}</div>
                    <div className="text-[10px] text-slate-500">
                      {clause === 'ICC_A'
                        ? 'All Risks (0.35‰)'
                        : clause === 'ICC_B'
                        ? 'Named Perils (0.26‰)'
                        : 'Major Perils (0.18‰)'}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Incoterms & Valuation Basis */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Incoterms & Shippable Valuation Basis
              </label>
              <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 font-bold">
                {incoterm === 'CIF'
                  ? '+10% Profit Margin (110% CIF)'
                  : incoterm === 'FOB' || incoterm === 'CFR'
                  ? 'Invoice + 10% Freight + 2% Port, then 110%'
                  : 'Invoice + 5% Inland + 10% Freight, then 110%'}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {(['CIF', 'FOB', 'CFR', 'EXW'] as OceanIncoterm[]).map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => setIncoterm(term)}
                  className={`py-2 rounded-xl border text-center text-xs font-bold transition-all ${
                    incoterm === term
                      ? 'border-cyan-500 bg-cyan-50/60 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {term}
                </button>
              ))}
            </div>
          </div>

          {/* Customs Duty Insurance Cover Toggle & Slider */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="customsDutyToggle"
                  checked={customsDutyOpted}
                  onChange={(e) => setCustomsDutyOpted(e.target.checked)}
                  className="w-4 h-4 text-cyan-600 rounded-sm focus:ring-cyan-500"
                />
                <label
                  htmlFor="customsDutyToggle"
                  className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  Customs Duty Insurance Cover
                </label>
              </div>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300">
                Rated @ 50% Base Rate
              </span>
            </div>

            {customsDutyOpted && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Customs Duty Sum Insured Rate</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{customsDutyPercent}% of CIF</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={50}
                  step={5}
                  value={customsDutyPercent}
                  onChange={(e) => setCustomsDutyPercent(parseInt(e.target.value, 10))}
                  className="w-full accent-cyan-600 cursor-pointer"
                />
                <div className="text-[10px] text-slate-400 flex justify-between">
                  <span>10% Minimum</span>
                  <span>30% Standard IRDAI</span>
                  <span>50% Maximum</span>
                </div>
              </div>
            )}
          </div>

          {/* Institute War & Strikes Clauses (Cargo) */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="warStrikesToggle"
                checked={warAndStrikesOpted}
                onChange={(e) => setWarAndStrikesOpted(e.target.checked)}
                className="w-4 h-4 text-cyan-600 rounded-sm focus:ring-cyan-500"
              />
              <div>
                <label
                  htmlFor="warStrikesToggle"
                  className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  Institute War & Strikes Clauses (Cargo)
                </label>
                <p className="text-[10px] text-slate-500">
                  Covers War, Strikes, Riots, Civil Commotions (SRCC).
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono font-bold text-cyan-600 dark:text-cyan-400">
              0.05‰
            </span>
          </div>

          {/* Carrier Quality & IBA Certification */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="certifiedCarrierToggle"
                checked={isCertifiedCarrier}
                onChange={(e) => setIsCertifiedCarrier(e.target.checked)}
                className="w-4 h-4 text-cyan-600 rounded-sm focus:ring-cyan-500"
              />
              <div>
                <label
                  htmlFor="certifiedCarrierToggle"
                  className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  IBA Approved / Classed Common Carrier
                </label>
                <p className="text-[10px] text-slate-500">
                  {isCertifiedCarrier
                    ? 'Certified Carrier — Standard tariff base rate.'
                    : 'Uncertified Carrier — +25% underwriting surcharge applied.'}
                </p>
              </div>
            </div>
            {!isCertifiedCarrier && (
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                +25% Surcharge
              </span>
            )}
          </div>

          {/* Policy Excess / Deductible Floor Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-xs">
              <Info className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>Statutory Policy Excess / Deductible</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              0.5% of consignment value subject to a statutory floor of ₹2,500 each and every loss.
            </p>
            <div className="mt-2 text-xs font-mono font-bold text-slate-900 dark:text-white">
              Current Loss Deductible: ₹ {formatNumberINR(calculation.policyExcess)}
            </div>
          </div>
        </div>

        {/* ================================================================== */}
        {/* COLUMN 3: Live 9-Row Calculation Ledger (4 Cols) */}
        {/* ================================================================== */}
        <div
          className={`lg:col-span-4 p-4 sm:p-6 overflow-y-auto bg-slate-50/70 dark:bg-slate-900/50 space-y-6 ${
            activeMobileTab === 'ledger' ? 'block' : 'hidden lg:block'
          }`}
        >
          {/* Section Header */}
          <div className="pb-3 border-b border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5" />
              03. Marine Tariff Calculation Ledger
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
              Live Underwriting Breakdown
            </h2>
          </div>

          {/* 9-Row Calculation Ledger Box */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 space-y-3">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Statutory 9-Row Premium Ledger
            </div>

            <div className="space-y-2 text-xs font-mono">
              {/* 1. Consignment Value */}
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span className="font-sans">1. Commercial Invoice Value</span>
                <span>₹ {formatNumberINR(calculation.consignmentValue)}</span>
              </div>

              {/* 2. Incoterm Markup */}
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span className="font-sans">2. Incoterm Valuation Markup</span>
                <span>₹ {formatNumberINR(calculation.incotermMarkup)}</span>
              </div>

              {/* 3. Insurable Sum Insured */}
              <div className="flex items-center justify-between text-cyan-700 dark:text-cyan-300 font-semibold pt-1 border-t border-slate-100 dark:border-slate-800">
                <span className="font-sans">3. Cargo Insurable Sum Insured</span>
                <span>₹ {formatNumberINR(calculation.insurableSumInsured)}</span>
              </div>

              {/* 4. Base Transit Rate */}
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span className="font-sans">4. Base Transit Peril Rate</span>
                <span>{calculation.baseRatePerMille.toFixed(4)} ‰</span>
              </div>

              {/* 5. Base Transit Premium */}
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span className="font-sans">5. Base Transit Premium</span>
                <span>₹ {formatNumberINR(calculation.baseTransitPremium)}</span>
              </div>

              {/* 6. Customs Duty Cover */}
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span className="font-sans">6. Customs Duty Cover Premium</span>
                <span>₹ {formatNumberINR(calculation.customsDutyPremium)}</span>
              </div>

              {/* 7. War & Strikes */}
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span className="font-sans">7. Institute War & Strikes Cover</span>
                <span>₹ {formatNumberINR(calculation.warAndStrikesPremium)}</span>
              </div>

              {/* 8. Net Marine Premium */}
              <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="font-sans">8. Net Marine Premium (Min ₹1k)</span>
                <span>₹ {formatINRWithDecimals(calculation.netMarinePremium)}</span>
              </div>

              {/* 9. GST @ 18% */}
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span className="font-sans">9. Goods & Services Tax (18%)</span>
                <span>₹ {formatINRWithDecimals(calculation.gstAmount)}</span>
              </div>

              {/* TOTAL PAYABLE */}
              <div className="flex items-center justify-between font-black text-sm text-cyan-600 dark:text-cyan-400 pt-2 border-t-2 border-slate-900 dark:border-slate-700">
                <span className="font-sans uppercase">Total Final Marine Premium</span>
                <span className="text-base">₹ {formatINRWithDecimals(calculation.totalFinalPremium)}</span>
              </div>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="w-full py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Generate Marine Quote Slip (PDF)</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Saving Quote...' : 'Save Quote to Workspace'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Marine Declaration Uploader Modal */}
      <MarineDeclarationUploader
        isOpen={isDeclarationModalOpen}
        onClose={() => setIsDeclarationModalOpen(false)}
        onApplyDeclarations={handleApplyDeclarations}
        currentCdBalance={cdBalance}
        policyType={policyType}
      />
    </div>
  );
};
