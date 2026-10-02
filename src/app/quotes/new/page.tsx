'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Calculator,
  ShieldCheck,
  FileText,
  Check,
  Download,
  AlertCircle,
  RefreshCw,
  Zap,
  Copy,
  ExternalLink,
  X,
  ChevronRight,
  TrendingUp,
  Percent,
  Coins,
  Building2,
  ArrowUpRight,
  Shield,
  Layers,
} from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { Header } from '@/components/layout/Header';
import {
  calculatePremium,
  formatINR,
  formatNumberINR,
  formatINRWithDecimals,
  OCCUPANCIES,
} from '@/lib/calculator';
import { downloadQuoteSlipPDF } from '@/lib/pdf-generator';
import { Quote } from '@/types/database';

interface AIExtractionResponse {
  occupancyCode: string;
  occupancyDescription: string;
  matchedKeywords: string[];
  confidenceScore: number;
  suggestedFlexaRate?: number;
  suggestedStfiRate?: number;
  suggestedEqRate?: number;
  riskTier?: 'Low' | 'Medium' | 'High';
  reasoning?: string;
}

const SAMPLE_PROPOSALS = [
  {
    title: 'Acme CNC Machining',
    client: 'Acme Industries Ltd',
    gst: '27AAACA1234A1Z5',
    sumInsured: 5000000,
    text: 'High-precision CNC metal machining, tool stamping, lathe turning and automotive parts fabrication workshop. Certified electrical switchgear with quarterly audit.',
  },
  {
    title: 'Apex Pharma Labs',
    client: 'Apex Healthcare Formulations Ltd',
    gst: '24AABCA5678B1Z2',
    sumInsured: 25000000,
    text: 'Pharmaceutical cleanroom manufacturing, oral dosage tablet formulations, API blending and analytical testing research laboratories. Controlled HVAC system.',
  },
  {
    title: 'Global Logistics Godown',
    client: 'TransWorld Supply Chain Solutions LLP',
    gst: '07AAACT9012C1Z4',
    sumInsured: 12000000,
    text: 'FMCG packaged foods and dry goods warehousing facility. Palletized racking with automatic smoke beam detectors and Category I godown warranty compliance.',
  },
  {
    title: 'Bharat Textile Weaving',
    client: 'Bharat Spinners & Weaving Mills',
    gst: '33AABCB3456D1Z6',
    sumInsured: 35000000,
    text: 'Cotton spinning, automated shuttleless loom weaving and yarn fabric processing facility. Overhead fire sprinkler network and daily lint extraction.',
  },
];

export default function NewQuoteWorkspacePage() {
  const router = useRouter();
  const { currentWorkspace, addQuote } = useWorkspace();

  // 1. Client & Proposal Metadata State
  const [clientName, setClientName] = useState('Acme Industries Ltd');
  const [clientGst, setClientGst] = useState('27AAACA1234A1Z5');
  const [eqZone, setEqZone] = useState('Zone 2 (Moderate Damage Risk)');
  const [businessDescription, setBusinessDescription] = useState(
    'Precision CNC metal machining, tool stamping, component fabrication and parts assembly workshop. Electrical equipment tested and certified.'
  );

  // 2. AI Extraction State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AIExtractionResponse | null>({
    occupancyCode: '1023',
    occupancyDescription: 'Engineering Workshops, CNC Metal Machining & Parts Fabrication',
    matchedKeywords: ['cnc', 'machining', 'metal', 'tooling', 'fabrication', 'parts', 'workshop'],
    confidenceScore: 0.96,
    suggestedFlexaRate: 0.65,
    suggestedStfiRate: 0.15,
    suggestedEqRate: 0.10,
    riskTier: 'Medium',
    reasoning: 'Extracted metal cutting, CNC precision tooling, and components assembly operations under AIFT Section III.',
  });
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [aiAppliedNotification, setAiAppliedNotification] = useState(false);

  // 3. Deterministic Engine Form State (Controlled inputs)
  const [sumInsured, setSumInsured] = useState<number>(5000000);
  const [flexaRate, setFlexaRate] = useState<number>(0.65);
  const [stfiRate, setStfiRate] = useState<number>(0.15);
  const [eqRate, setEqRate] = useState<number>(0.10);
  const [loadings, setLoadings] = useState<number>(10); // percentage (10%)
  const [discounts, setDiscounts] = useState<number>(5); // percentage (5%)

  // 4. Modal / Quote Slip preview state
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);
  const [savedQuoteId, setSavedQuoteId] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // STEP 2: Pure deterministic calculation execution via calculatePremium(data)
  const calculation = useMemo(() => {
    return calculatePremium({
      sumInsured,
      flexaRate,
      stfiRate,
      eqRate,
      discounts,
      loadings,
    });
  }, [sumInsured, flexaRate, stfiRate, eqRate, discounts, loadings]);

  // STEP 1: AI Proposal Extraction Simulation handler hitting /api/extract-proposal
  const handleAnalyzeProposal = async () => {
    if (!businessDescription.trim()) {
      setAnalysisError('Please enter a business description to analyze.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const response = await fetch('/api/extract-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: businessDescription }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to analyze proposal.');
      }

      const data: AIExtractionResponse = await response.json();
      setAiResult(data);

      // Auto-apply suggested rates if available
      if (typeof data.suggestedFlexaRate === 'number') {
        setFlexaRate(data.suggestedFlexaRate);
      }
      if (typeof data.suggestedStfiRate === 'number') {
        setStfiRate(data.suggestedStfiRate);
      }
      if (typeof data.suggestedEqRate === 'number') {
        setEqRate(data.suggestedEqRate);
      }

      setAiAppliedNotification(true);
      setTimeout(() => setAiAppliedNotification(false), 3500);
    } catch (err: any) {
      setAnalysisError(err.message || 'Error executing AI risk extraction.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Load sample proposal
  const handleLoadSample = (sample: (typeof SAMPLE_PROPOSALS)[0]) => {
    setClientName(sample.client);
    setClientGst(sample.gst);
    setSumInsured(sample.sumInsured);
    setBusinessDescription(sample.text);
    setAnalysisError(null);
  };

  // Apply AI extracted rates manually
  const handleApplyAiRates = () => {
    if (!aiResult) return;
    if (typeof aiResult.suggestedFlexaRate === 'number') {
      setFlexaRate(aiResult.suggestedFlexaRate);
    }
    if (typeof aiResult.suggestedStfiRate === 'number') {
      setStfiRate(aiResult.suggestedStfiRate);
    }
    if (typeof aiResult.suggestedEqRate === 'number') {
      setEqRate(aiResult.suggestedEqRate);
    }
    setAiAppliedNotification(true);
    setTimeout(() => setAiAppliedNotification(false), 3000);
  };

  // Generate Quote Slip & persist to Workspace state
  const handleGenerateQuoteSlip = () => {
    const newQuoteRecord = addQuote({
      client_id: `client-${Date.now()}`,
      client_name: clientName,
      client_gst: clientGst,
      created_by: 'current-user',
      occupation_code: aiResult?.occupancyCode || '1023',
      occupation_description:
        aiResult?.occupancyDescription ||
        'Engineering Workshops, CNC Metal Machining & Parts Fabrication',
      eq_zone: eqZone,
      sum_insured: calculation.sumInsured,
      sum_insured_breakdown: {
        building: Math.round(calculation.sumInsured * 0.3),
        plant_machinery: Math.round(calculation.sumInsured * 0.5),
        furniture_fixtures: Math.round(calculation.sumInsured * 0.05),
        stocks: Math.round(calculation.sumInsured * 0.15),
        others: 0,
        total: calculation.sumInsured,
      },
      premium: calculation.netPremium,
      gst_amount: calculation.gst,
      total_premium: calculation.totalFinalPremium,
      policy_rate: calculation.adjustedRate,
      status: 'approved',
      ai_confidence: aiResult?.confidenceScore || 0.95,
      insurer_name: 'THE NEW INDIA ASSURANCE CO. LTD.',
      calculation_breakdown: {
        occupancy_code: aiResult?.occupancyCode || '1023',
        occupancy_description:
          aiResult?.occupancyDescription ||
          'Engineering Workshops, CNC Metal Machining & Parts Fabrication',
        category: 1,
        section: 'III',
        product_type: 'BSUS',
        eq_zone: eqZone,
        kutcha_construction: false,
        base_flexa_rate: calculation.flexaRate,
        nia_adjusted_flexa_rate: calculation.flexaRate,
        feature_discount_percent: calculation.discounts,
        rate_after_discount: calculation.adjustedRate,
        stfi_opted: calculation.stfiRate > 0,
        stfi_rate: calculation.stfiRate,
        eq_opted: calculation.eqRate > 0,
        eq_rate: calculation.eqRate,
        terrorism_opted: false,
        terrorism_rate: 0,
        total_base_rate: calculation.baseRate,
        discretionary_discount_percent: calculation.discounts,
        rate_after_discretionary: calculation.adjustedRate,
        floater_opted: false,
        floater_rate: 0,
        final_policy_rate_per_mille: calculation.adjustedRate,
        total_sum_insured: calculation.sumInsured,
        net_premium: calculation.netPremium,
        gst_rate_percent: 18,
        gst_amount: calculation.gst,
        total_premium: calculation.totalFinalPremium,
      },
    });

    setSavedQuoteId(newQuoteRecord.id);
    setIsSlipModalOpen(true);
  };

  // Download PDF
  const handleDownloadPDF = () => {
    const dummyQuote: any = {
      id: savedQuoteId || 'QTL-2026-LIVE',
      quote_number: savedQuoteId || `QTL-${Math.floor(100000 + Math.random() * 900000)}`,
      client_name: clientName,
      client_gst: clientGst,
      occupation_code: aiResult?.occupancyCode || '1023',
      occupation_description:
        aiResult?.occupancyDescription ||
        'Engineering Workshops, CNC Metal Machining & Parts Fabrication',
      eq_zone: eqZone,
      sum_insured: calculation.sumInsured,
      sum_insured_breakdown: {
        building: Math.round(calculation.sumInsured * 0.3),
        plant_machinery: Math.round(calculation.sumInsured * 0.5),
        furniture_fixtures: Math.round(calculation.sumInsured * 0.05),
        stocks: Math.round(calculation.sumInsured * 0.15),
        others: 0,
        total: calculation.sumInsured,
      },
      premium: calculation.netPremium,
      gst_amount: calculation.gst,
      total_premium: calculation.totalFinalPremium,
      policy_rate: calculation.adjustedRate,
      calculation_breakdown: {
        occupancy_code: aiResult?.occupancyCode || '1023',
        occupancy_description:
          aiResult?.occupancyDescription ||
          'Engineering Workshops, CNC Metal Machining & Parts Fabrication',
        category: 1,
        section: 'III',
        product_type: 'BSUS',
        eq_zone: eqZone,
        base_flexa_rate: calculation.flexaRate,
        stfi_rate: calculation.stfiRate,
        eq_rate: calculation.eqRate,
        final_policy_rate_per_mille: calculation.adjustedRate,
        total_sum_insured: calculation.sumInsured,
        net_premium: calculation.netPremium,
        gst_amount: calculation.gst,
        total_premium: calculation.totalFinalPremium,
      },
      created_at: new Date().toISOString(),
      insurer_name: 'THE NEW INDIA ASSURANCE CO. LTD.',
    };

    downloadQuoteSlipPDF(dummyQuote, currentWorkspace);
  };

  const copySummaryToClipboard = () => {
    const summary = `QUOTELY COMMERCIAL UNDERWRITING SLIP
Client: ${clientName} (GSTIN: ${clientGst})
Occupancy: [${aiResult?.occupancyCode || '1023'}] ${aiResult?.occupancyDescription || 'Commercial'}
Sum Insured: ₹ ${formatNumberINR(calculation.sumInsured)}
Base Rate: ${calculation.baseRate.toFixed(4)} ‰
Adjusted Rate: ${calculation.adjustedRate.toFixed(4)} ‰
Net Premium: ₹ ${formatINRWithDecimals(calculation.netPremium)}
GST (18%): ₹ ${formatINRWithDecimals(calculation.gst)}
Total Final Premium: ₹ ${formatINRWithDecimals(calculation.totalFinalPremium)}`;

    navigator.clipboard.writeText(summary);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans">
      <Header
        title="Commercial Underwriting Workspace"
        subtitle="AI Perception Layer • Deterministic IRDAI Rating Engine • Live Tariff Ledger"
        breadcrumbs={[
          { label: 'Quotes', href: '/app/quotes' },
          { label: 'New Underwrite' },
        ]}
      />

      {/* Top Banner: Status & Quick-load sample proposals */}
      <div className="px-6 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Deterministic Math Active</span>
          </div>

          <span className="text-xs text-slate-400 font-mono hidden sm:inline">
            Zero-Hallucination Rate Engine (IRDAI AIFT 2001)
          </span>
        </div>

        {/* Sample Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 hidden md:inline">
            Presets:
          </span>
          {SAMPLE_PROPOSALS.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleLoadSample(sample)}
              className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors whitespace-nowrap flex items-center gap-1"
            >
              <Zap className="w-3 h-3 text-amber-500" />
              <span>{sample.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main 3-Column Split Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* ====================================================================== */}
        {/* LEFT PANEL: Proposal Input & AI Extraction (4 Cols) */}
        {/* ====================================================================== */}
        <div className="lg:col-span-4 border-r border-slate-200/80 dark:border-slate-800 p-6 overflow-y-auto bg-white dark:bg-slate-900 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                01. Input & AI Extraction
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
                Business Proposal
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-900">
              API /extract-proposal
            </span>
          </div>

          {/* Proposal Textarea Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Raw Proposal / RFQ Description <span className="text-red-500">*</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                {businessDescription.length} characters
              </span>
            </div>

            <textarea
              rows={5}
              value={businessDescription}
              onChange={(e) => setBusinessDescription(e.target.value)}
              placeholder="Paste raw proposal text, trade description, manufacturing processes, chemical hazards, or plant layout details..."
              className="w-full p-3.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all font-sans leading-relaxed resize-y"
            />

            {analysisError && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{analysisError}</span>
              </div>
            )}

            {/* Analyze Risk Button */}
            <button
              type="button"
              onClick={handleAnalyzeProposal}
              disabled={isAnalyzing}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs shadow-soft flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Analyzing Proposal via AI Engine...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Analyze Risk & Match Occupancy</span>
                </>
              )}
            </button>
          </div>

          {/* AI Applied Success Banner */}
          {aiAppliedNotification && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Extracted rates applied to Deterministic Tariff Engine!</span>
            </div>
          )}

          {/* AI Match Card — Visually Distinct Royal Blue Theme */}
          {aiResult && (
            <div className="rounded-[20px] p-5 bg-blue-50/70 dark:bg-blue-950/40 border-2 border-blue-500/30 shadow-soft space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>AI Occupancy Match</span>
                </div>
                <div className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[11px] font-mono font-bold shadow-xs">
                  {Math.round(aiResult.confidenceScore * 100)}% Confidence
                </div>
              </div>

              {/* Occupancy details */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-blue-100 dark:border-blue-900/60 shadow-xs space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                    Code: {aiResult.occupancyCode}
                  </span>
                  {aiResult.riskTier && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      Tier: {aiResult.riskTier} Risk
                    </span>
                  )}
                </div>

                <p className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                  {aiResult.occupancyDescription}
                </p>

                {aiResult.reasoning && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-2">
                    {aiResult.reasoning}
                  </p>
                )}
              </div>

              {/* Matched Keywords */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300">
                  Extracted Risk Keywords:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {aiResult.matchedKeywords.map((kw, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-blue-100/80 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 border border-blue-200/80 dark:border-blue-800"
                    >
                      #{kw}
                    </span>
                  ))}
                </div>
              </div>

              {/* Suggested Rates Sub-strip & Action */}
              <div className="pt-2 border-t border-blue-200/60 dark:border-blue-900/60 flex items-center justify-between">
                <div className="text-[11px] text-blue-900 dark:text-blue-200">
                  <span className="font-semibold">Suggested Base: </span>
                  <span className="font-mono font-bold">
                    {(
                      (aiResult.suggestedFlexaRate || 0.65) +
                      (aiResult.suggestedStfiRate || 0.15) +
                      (aiResult.suggestedEqRate || 0.10)
                    ).toFixed(2)}
                    ‰
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleApplyAiRates}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold shadow-xs transition-colors flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  <span>Apply AI Rates</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ====================================================================== */}
        {/* MIDDLE PANEL: Deterministic Tariff Engine (4 Cols) */}
        {/* ====================================================================== */}
        <div className="lg:col-span-4 border-r border-slate-200/80 dark:border-slate-800 p-6 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5" />
                02. Deterministic Engine
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
                Statutory Rating Form
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-900">
              100% Deterministic
            </span>
          </div>

          {/* Client & Risk Details */}
          <div className="rounded-[20px] p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Client & Location Identification
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Client / Insured Entity Name
                </label>
                <div className="relative">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Client GSTIN
                  </label>
                  <input
                    type="text"
                    value={clientGst}
                    onChange={(e) => setClientGst(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Earthquake Zone
                  </label>
                  <select
                    value={eqZone}
                    onChange={(e) => setEqZone(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 truncate"
                  >
                    <option value="Zone 1 (High Damage Risk)">Zone 1 / V (High Risk)</option>
                    <option value="Zone 2 (Moderate Damage Risk)">Zone 2 / IV (Delhi, Gujarat)</option>
                    <option value="Zone 3 (Medium Damage Risk)">Zone 3 / III (Mumbai, Pune)</option>
                    <option value="Zone 4 (Low Damage Risk)">Zone 4 / II (Bengaluru, Hyd)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Mathematical Form Inputs */}
          <div className="rounded-[20px] p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Deterministic Math Parameters
            </h3>

            {/* Sum Insured Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Sum Insured (₹) <span className="text-red-500">*</span>
                </label>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {formatINR(sumInsured)}
                </span>
              </div>

              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400 font-mono">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="50000"
                  value={sumInsured || ''}
                  onChange={(e) => setSumInsured(Math.max(0, Number(e.target.value)))}
                  className="w-full pl-8 pr-3 py-2 text-sm font-mono font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Quick preset buttons */}
              <div className="flex items-center gap-1.5 pt-1">
                {[
                  { label: '₹25L', val: 2500000 },
                  { label: '₹50L', val: 5000000 },
                  { label: '₹1 Cr', val: 10000000 },
                  { label: '₹5 Cr', val: 50000000 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setSumInsured(preset.val)}
                    className={`text-[10px] font-mono px-2 py-1 rounded-md transition-colors ${
                      sumInsured === preset.val
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Peril Rates: Flexa, STFI, EQ */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Peril Rates (‰ per mille)
              </span>

              <div className="grid grid-cols-3 gap-2.5">
                {/* Flexa Rate */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Flexa Rate ‰
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={flexaRate}
                    onChange={(e) => setFlexaRate(Math.max(0, Number(e.target.value)))}
                    className="w-full px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[9px] text-slate-400 mt-0.5 block">Standard Fire</span>
                </div>

                {/* STFI Rate */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    STFI Rate ‰
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={stfiRate}
                    onChange={(e) => setStfiRate(Math.max(0, Number(e.target.value)))}
                    className="w-full px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[9px] text-slate-400 mt-0.5 block">Storm / Flood</span>
                </div>

                {/* EQ Rate */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    EQ Rate ‰
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={eqRate}
                    onChange={(e) => setEqRate(Math.max(0, Number(e.target.value)))}
                    className="w-full px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[9px] text-slate-400 mt-0.5 block">Earthquake</span>
                </div>
              </div>
            </div>

            {/* Loadings & Discounts */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3">
              {/* Loadings */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Loadings (%)
                  </label>
                  <span className="text-[11px] font-mono font-bold text-amber-600">
                    +{loadings}%
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={loadings}
                    onChange={(e) => setLoadings(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <Percent className="w-3 h-3 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>
                <select
                  value={loadings}
                  onChange={(e) => setLoadings(Number(e.target.value))}
                  className="w-full text-[10px] p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-0"
                >
                  <option value={0}>0% (Standard)</option>
                  <option value={5}>5% (Exposure Loading)</option>
                  <option value={10}>10% (Floater / Multilocation)</option>
                  <option value={20}>20% (High Combustible)</option>
                </select>
              </div>

              {/* Discounts */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Discounts (%)
                  </label>
                  <span className="text-[11px] font-mono font-bold text-emerald-600">
                    -{discounts}%
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={discounts}
                    onChange={(e) => setDiscounts(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <Percent className="w-3 h-3 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>
                <select
                  value={discounts}
                  onChange={(e) => setDiscounts(Number(e.target.value))}
                  className="w-full text-[10px] p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-0"
                >
                  <option value={0}>0% (No discount)</option>
                  <option value={5}>5% (Sprinklers / Hydrants)</option>
                  <option value={10}>10% (Full Fire Protection)</option>
                  <option value={15}>15% (Claims Free 3 Yrs)</option>
                  <option value={20}>20% (Max Discretionary)</option>
                </select>
              </div>
            </div>

            {/* Formula Execution Feedback Strip */}
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-1 text-[11px] font-mono">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Base Rate (Flexa+STFI+EQ):</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {calculation.baseRate.toFixed(4)} ‰
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Multiplier (1 + {loadings}% - {discounts}%):</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {(1 + calculation.loadingFactor - calculation.discountFactor).toFixed(4)}x
                </span>
              </div>
              <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 font-bold pt-1 border-t border-slate-200 dark:border-slate-700">
                <span>Adjusted Policy Rate:</span>
                <span>{calculation.adjustedRate.toFixed(4)} ‰</span>
              </div>
            </div>
          </div>
        </div>

        {/* ====================================================================== */}
        {/* RIGHT PANEL: Live Premium Summary & Quote Slip Generation (4 Cols) */}
        {/* ====================================================================== */}
        <div className="lg:col-span-4 p-6 overflow-y-auto bg-white dark:bg-slate-900 flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5" />
                  03. Live Premium Summary
                </span>
                <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
                  Calculation Ledger
                </h2>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                Real-Time
              </span>
            </div>

            {/* Total Premium Hero Box — Emerald Primary Theme */}
            <div className="p-6 rounded-[20px] bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 text-white shadow-emerald shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between text-emerald-100 text-xs mb-1">
                <span className="font-semibold uppercase tracking-wider text-[11px]">
                  Total Final Premium (Payable)
                </span>
                <span className="text-[10px] bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded-full font-mono font-bold">
                  18% GST Included
                </span>
              </div>

              {/* Large, ultra-precise Hero Total */}
              <div className="text-3xl sm:text-4xl font-extrabold tracking-tight font-mono my-2">
                {formatINRWithDecimals(calculation.totalFinalPremium)}
              </div>

              {/* Sub-breakdown strip */}
              <div className="mt-4 pt-3 border-t border-emerald-500/50 grid grid-cols-2 gap-2 text-xs text-emerald-100 font-mono">
                <div>
                  <span className="text-[10px] text-emerald-200 block uppercase">Net Premium</span>
                  <span className="font-bold">{formatINRWithDecimals(calculation.netPremium)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-200 block uppercase">Statutory GST</span>
                  <span className="font-bold">{formatINRWithDecimals(calculation.gst)}</span>
                </div>
              </div>
            </div>

            {/* Complete Mathematical Step-by-Step Ledger */}
            <div className="rounded-[20px] p-5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Step-by-Step Mathematical Ledger
                </h4>
                <button
                  type="button"
                  onClick={copySummaryToClipboard}
                  className="text-[10px] font-mono text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  <span>{isCopied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>

              <div className="space-y-2 text-xs">
                {/* 1. Sum Insured */}
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>1. Sum Insured</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    ₹ {formatNumberINR(calculation.sumInsured)}
                  </span>
                </div>

                {/* 2. Base Rate Breakdown */}
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>2. Flexa + STFI + EQ</span>
                  <span className="font-mono text-slate-900 dark:text-white">
                    {calculation.flexaRate.toFixed(4)} + {calculation.stfiRate.toFixed(4)} +{' '}
                    {calculation.eqRate.toFixed(4)}
                  </span>
                </div>

                {/* 3. Base Rate Sum */}
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>3. Base Rate per mille</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {calculation.baseRate.toFixed(4)} ‰
                  </span>
                </div>

                {/* 4. Loadings */}
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>4. Loadings</span>
                  <span className="font-mono text-amber-600 font-semibold">
                    +{calculation.loadingPercentage.toFixed(2)}%
                  </span>
                </div>

                {/* 5. Discounts */}
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>5. Discounts</span>
                  <span className="font-mono text-emerald-600 font-semibold">
                    -{calculation.discountPercentage.toFixed(2)}%
                  </span>
                </div>

                {/* 6. Adjusted Rate */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200">
                  <span>6. Adjusted Rate per mille</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                    {calculation.adjustedRate.toFixed(4)} ‰
                  </span>
                </div>

                {/* 7. Net Premium */}
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>7. Net Premium (SI/1000 * Rate)</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {formatINRWithDecimals(calculation.netPremium)}
                  </span>
                </div>

                {/* 8. GST */}
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>8. GST @ 18%</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {formatINRWithDecimals(calculation.gst)}
                  </span>
                </div>

                {/* 9. Final Total */}
                <div className="pt-2 border-t-2 border-slate-200 dark:border-slate-700 flex items-center justify-between text-sm font-bold text-emerald-700 dark:text-emerald-400">
                  <span>9. Total Final Premium</span>
                  <span className="font-mono text-base">
                    {formatINRWithDecimals(calculation.totalFinalPremium)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Primary Action Button: Generate Quote Slip */}
          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleGenerateQuoteSlip}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm shadow-emerald shadow-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <FileText className="w-4 h-4" />
              <span>Generate Quote Slip</span>
            </button>

            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span>Client: {clientName}</span>
              <span className="font-mono">Occupancy: {aiResult?.occupancyCode || '1023'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================== */}
      {/* QUOTE SLIP PREVIEW MODAL */}
      {/* ====================================================================== */}
      {isSlipModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[20px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Official Commercial Quote Slip</h3>
                  <p className="text-[10px] text-slate-300 font-mono">
                    Ref: {savedQuoteId || 'QTL-2026-LIVE'} • IRDAI Tariff Compliant
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsSlipModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Slip Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700 dark:text-slate-300">
              {/* Slip Top Credentials */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Brokerage Firm
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {currentWorkspace.name}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5">{currentWorkspace.address}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Underwriting Date
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {new Date().toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                  <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Status: Approved</p>
                </div>
              </div>

              {/* Insured & Occupancy Spec */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Insured Client
                  </span>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">{clientName}</p>
                  <p className="font-mono text-slate-500 mt-0.5">GSTIN: {clientGst}</p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Classified Risk
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs">
                      {aiResult?.occupancyCode || '1023'}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white truncate">
                      {aiResult?.occupancyDescription || 'Commercial Workshop'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">{eqZone}</p>
                </div>
              </div>

              {/* Financial Calculation Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800/80 text-[10px] uppercase font-bold text-slate-500">
                    <tr>
                      <th className="p-3">Component</th>
                      <th className="p-3 text-right">Rate / Basis</th>
                      <th className="p-3 text-right">Amount (INR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                    <tr>
                      <td className="p-3 font-sans">Total Sum Insured</td>
                      <td className="p-3 text-right text-slate-500">100.00%</td>
                      <td className="p-3 text-right font-bold text-slate-900 dark:text-white">
                        ₹ {formatNumberINR(calculation.sumInsured)}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-sans">
                        Base Peril Rate (Flexa + STFI + EQ)
                      </td>
                      <td className="p-3 text-right text-slate-500">
                        {calculation.baseRate.toFixed(4)} ‰
                      </td>
                      <td className="p-3 text-right text-slate-500">-</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-sans">Loadings & Discounts</td>
                      <td className="p-3 text-right text-slate-500">
                        +{loadings}% / -{discounts}%
                      </td>
                      <td className="p-3 text-right text-slate-500">-</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-sans font-bold">Adjusted Net Policy Rate</td>
                      <td className="p-3 text-right font-bold text-blue-600">
                        {calculation.adjustedRate.toFixed(4)} ‰
                      </td>
                      <td className="p-3 text-right font-bold text-slate-900 dark:text-white">
                        {formatINRWithDecimals(calculation.netPremium)}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-sans">Central & State GST (18%)</td>
                      <td className="p-3 text-right text-slate-500">18.00%</td>
                      <td className="p-3 text-right text-slate-900 dark:text-white">
                        {formatINRWithDecimals(calculation.gst)}
                      </td>
                    </tr>
                    <tr className="bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold">
                      <td className="p-3 font-sans text-xs">Total Final Payable Premium</td>
                      <td className="p-3 text-right font-sans">Inclusive of GST</td>
                      <td className="p-3 text-right text-sm">
                        {formatINRWithDecimals(calculation.totalFinalPremium)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <Link
                href="/app/quotes"
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors flex items-center gap-1.5"
              >
                <span>View in Quotes Register</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF Quote Slip</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsSlipModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-emerald transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
