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
  Building,
  ArrowUpRight,
  Shield,
  Layers,
  ChevronDown,
  HelpCircle,
  MessageSquare,
  Send,
  CornerDownRight,
  MapPin,
  CheckSquare,
  Square,
  BadgePercent,
  FileCheck,
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
import { matchDistrictEQZone } from '@/lib/rag';
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
  clarificationQuestion?: string | null;
  suggestedQuickAnswers?: string[];
  missingFields?: string[];
  suggestedDiscountPercent?: number;
  suggestedLoadingPercent?: number;
}

const SAMPLE_PROPOSALS = [
  {
    title: 'Krishna & Co. Food & Oil Godown',
    client: 'Krishna & Company',
    gst: '07ALMPA9603N1ZS',
    address: 'Khasra No-309/2, Pul Pehladpur, Near Lal Kuan Sunday Bazar, New Delhi - 110044',
    hypothecation: 'Bank of India, South Delhi Branch',
    sumInsured: 50000000,
    text: 'Trading and storage of food products of Nestle, Bajaj almond oil, cosmetic products and similar goods. Category I hazardous goods godown with operational fire hydrants, standard drainage and 24x7 security.',
  },
  {
    title: 'Acme CNC Machining',
    client: 'Acme Industries Ltd',
    gst: '27AAACA1234A1Z5',
    address: 'Plot 42, GIDC Phase II, Vatva, Ahmedabad, Gujarat 382445',
    hypothecation: 'State Bank of India',
    sumInsured: 5000000,
    text: 'High-precision CNC metal machining, tool stamping, lathe turning and automotive parts fabrication workshop. Certified electrical switchgear with quarterly audit.',
  },
  {
    title: 'Apex Pharma Labs',
    client: 'Apex Healthcare Formulations Ltd',
    gst: '24AABCA5678B1Z2',
    address: 'Plot 18, Electronic City Phase 1, Bengaluru, Karnataka 560100',
    hypothecation: 'HDFC Bank',
    sumInsured: 25000000,
    text: 'Pharmaceutical cleanroom manufacturing, oral dosage tablet formulations, API blending and analytical testing research laboratories. Controlled HVAC system.',
  },
  {
    title: 'Global Logistics Godown',
    client: 'TransWorld Supply Chain Solutions LLP',
    gst: '07AAACT9012C1Z4',
    address: 'Shed 12, Palam Industrial Area, New Delhi 110077',
    hypothecation: 'Punjab National Bank',
    sumInsured: 12000000,
    text: 'FMCG packaged foods and dry goods warehousing facility. Palletized racking with automatic smoke beam detectors and Category I godown warranty compliance.',
  },
  {
    title: 'Bharat Textile Weaving',
    client: 'Bharat Spinners & Weaving Mills',
    gst: '33AABCB3456D1Z6',
    address: 'Mill Road, Tirupur, Coimbatore, Tamil Nadu 641602',
    hypothecation: 'Canara Bank',
    sumInsured: 35000000,
    text: 'Cotton spinning, automated shuttleless loom weaving and yarn fabric processing facility. Overhead fire sprinkler network and daily lint extraction.',
  },
];

export default function NewQuoteWorkspacePage() {
  const router = useRouter();
  const { currentWorkspace, addQuote } = useWorkspace();

  // 1. Client & Proposal Metadata State
  const [clientName, setClientName] = useState('');
  const [clientGst, setClientGst] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [hypothecationBank, setHypothecationBank] = useState('');
  const [eqZone, setEqZone] = useState('Zone 3 (Moderate Damage Risk)');
  const [detectedZoneInfo, setDetectedZoneInfo] = useState<{
    zone: string;
    district: string;
    hazardLevel?: string;
    rate: number;
    source: string;
  } | null>(null);
  const [businessDescription, setBusinessDescription] = useState('');
  const [brokeragePercent, setBrokeragePercent] = useState<number>(15);
  const [activeMobileTab, setActiveMobileTab] = useState<'input' | 'calc' | 'slip'>('input');

  // 2. AI Extraction & Clarification State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AIExtractionResponse | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [aiAppliedNotification, setAiAppliedNotification] = useState(false);
  const [followUpInput, setFollowUpInput] = useState('');
  const [isAnsweringFollowUp, setIsAnsweringFollowUp] = useState(false);
  const [clarificationHistory, setClarificationHistory] = useState<Array<{ q: string; a: string }>>([]);

  // 3. Deterministic Engine Form State (Controlled inputs, clean un-prefilled UX)
  const [sumInsured, setSumInsured] = useState<number>(0);
  const [flexaRate, setFlexaRate] = useState<number>(0);
  const [stfiRate, setStfiRate] = useState<number>(0);
  const [eqRate, setEqRate] = useState<number>(0);
  const [loadings, setLoadings] = useState<number>(0);
  const [discounts, setDiscounts] = useState<number>(0);

  // 4. Modal / Quote Slip preview state
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);
  const [savedQuoteId, setSavedQuoteId] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [showSampleMenu, setShowSampleMenu] = useState(false);

  // Auto-detect Earthquake Zone & STFI when Address, Pincode or GST is entered
  React.useEffect(() => {
    if (!clientAddress && !clientGst) {
      setDetectedZoneInfo(null);
      return;
    }

    // Try full address / pincode first
    if (clientAddress.trim()) {
      const match = matchDistrictEQZone(clientAddress);
      if (match) {
        const zoneLabel =
          match.zone === 'Zone 1'
            ? 'Zone 1 (High Damage Risk)'
            : match.zone === 'Zone 2'
            ? 'Zone 2 (Moderate Damage Risk)'
            : match.zone === 'Zone 3'
            ? 'Zone 3 (Medium Damage Risk)'
            : 'Zone 4 (Low Damage Risk)';

        setEqZone(zoneLabel);
        setEqRate(match.eqRatePerMille);
        setDetectedZoneInfo({
          zone: match.zone,
          district: match.district,
          hazardLevel: match.hazardLevel,
          rate: match.eqRatePerMille,
          source: 'Address / Pincode AI Match',
        });
        return;
      }
    }

    // Fallback: If GST is entered, extract state code
    if (clientGst && clientGst.length >= 2) {
      const stateCode = clientGst.substring(0, 2);
      const GST_STATE_MAP: Record<string, { zone: string; label: string; rate: number; state: string }> = {
        '07': { zone: 'Zone 2', label: 'Zone 2 (Moderate Damage Risk)', rate: 0.15, state: 'Delhi NCR' },
        '27': { zone: 'Zone 3', label: 'Zone 3 (Medium Damage Risk)', rate: 0.10, state: 'Maharashtra' },
        '24': { zone: 'Zone 2', label: 'Zone 2 (Moderate Damage Risk)', rate: 0.15, state: 'Gujarat' },
        '29': { zone: 'Zone 4', label: 'Zone 4 (Low Damage Risk)', rate: 0.05, state: 'Karnataka' },
        '36': { zone: 'Zone 4', label: 'Zone 4 (Low Damage Risk)', rate: 0.05, state: 'Telangana' },
        '33': { zone: 'Zone 3', label: 'Zone 3 (Medium Damage Risk)', rate: 0.10, state: 'Tamil Nadu' },
        '19': { zone: 'Zone 2', label: 'Zone 2 (Moderate Damage Risk)', rate: 0.15, state: 'West Bengal' },
        '18': { zone: 'Zone 1', label: 'Zone 1 (High Damage Risk)', rate: 0.25, state: 'Assam / NE' },
        '10': { zone: 'Zone 2', label: 'Zone 2 (Moderate Damage Risk)', rate: 0.15, state: 'Bihar' },
        '06': { zone: 'Zone 2', label: 'Zone 2 (Moderate Damage Risk)', rate: 0.15, state: 'Haryana' },
        '03': { zone: 'Zone 2', label: 'Zone 2 (Moderate Damage Risk)', rate: 0.15, state: 'Punjab' },
        '08': { zone: 'Zone 3', label: 'Zone 3 (Medium Damage Risk)', rate: 0.10, state: 'Rajasthan' },
        '23': { zone: 'Zone 3', label: 'Zone 3 (Medium Damage Risk)', rate: 0.10, state: 'Madhya Pradesh' },
      };

      if (GST_STATE_MAP[stateCode]) {
        const item = GST_STATE_MAP[stateCode];
        setEqZone(item.label);
        setEqRate(item.rate);
        setDetectedZoneInfo({
          zone: item.zone,
          district: item.state,
          hazardLevel: `${item.zone} - GST State Code Match`,
          rate: item.rate,
          source: `GST State Code (${stateCode})`,
        });
      }
    }
  }, [clientAddress, clientGst]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const codeParam = params.get('code');
      const clientParam = params.get('client');
      const descParam = params.get('desc');
      if (clientParam) setClientName(clientParam);
      if (descParam) setBusinessDescription(descParam);
      if (codeParam) {
        const matched = OCCUPANCIES.find((o) => o.code === codeParam);
        if (matched) {
          setFlexaRate(matched.flexa_rate);
          setAiResult({
            occupancyCode: matched.code,
            occupancyDescription: matched.description,
            matchedKeywords: [matched.code, matched.category_tag],
            confidenceScore: 0.98,
            suggestedFlexaRate: matched.flexa_rate,
            suggestedStfiRate: matched.stfi_rate || 0.15,
            suggestedEqRate: matched.eq_rate || 0.10,
            riskTier: matched.category === 1 ? 'Low' : 'Medium',
            reasoning: `Pre-classified under statutory IIB Schedule 3 Code ${matched.code}.`,
          });
        }
      }
    }
  }, []);

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

  // STEP 1: Live AI Risk Classification & Follow-up Dialogue handler hitting /api/classify
  const handleAnalyzeProposal = async (customAnswer?: string) => {
    const textToAnalyze = businessDescription.trim();
    if (!textToAnalyze) {
      setAnalysisError('Please enter a business description to analyze.');
      return;
    }

    if (customAnswer) {
      setIsAnsweringFollowUp(true);
    } else {
      setIsAnalyzing(true);
    }
    setAnalysisError(null);

    try {
      const response = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_description: textToAnalyze,
          district: eqZone,
          follow_up_answer: customAnswer || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to analyze proposal.');
      }

      const resJson = await response.json();
      const topCand = resJson.data?.occupancy_candidates?.[0];
      if (topCand) {
        const matched = OCCUPANCIES.find((o) => o.code === topCand.code);
        const flexa = matched ? matched.flexa_rate : (topCand.loss_cost || 0.65);
        const stfi = matched ? (matched.stfi_rate || 0.15) : 0.15;
        const eq = matched ? (matched.eq_rate || 0.10) : 0.10;

        const discountPct = resJson.data?.suggested_discount_percent || 0;
        const loadingPct = resJson.data?.suggested_loading_percent || 0;

        setAiResult({
          occupancyCode: topCand.code,
          occupancyDescription: topCand.description,
          matchedKeywords: resJson.data.keywords || [topCand.code],
          confidenceScore: topCand.confidence || 0.95,
          suggestedFlexaRate: flexa,
          suggestedStfiRate: stfi,
          suggestedEqRate: eq,
          riskTier: matched?.category === 1 ? 'Low' : 'Medium',
          reasoning: topCand.reason || 'Classified via Gemini 3.8 Flash grounded in AIFT 2001 and IIB Schedule 3.',
          clarificationQuestion: resJson.data?.clarification_question || null,
          suggestedQuickAnswers: resJson.data?.suggested_quick_answers || [],
          missingFields: resJson.data?.missing_fields || [],
          suggestedDiscountPercent: discountPct,
          suggestedLoadingPercent: loadingPct,
        });

        // Auto-apply suggested rates
        setFlexaRate(flexa);
        setStfiRate(stfi);
        setEqRate(eq);

        // Deterministically apply discount or loading if extracted
        if (discountPct > 0) {
          setDiscounts(discountPct);
        }
        if (loadingPct > 0) {
          setLoadings(loadingPct);
        }

        if (customAnswer && aiResult?.clarificationQuestion) {
          setClarificationHistory((prev) => [
            ...prev,
            { q: aiResult.clarificationQuestion!, a: customAnswer },
          ]);
          setBusinessDescription((prev) => `${prev}\n[Underwriter Clarification: ${customAnswer}]`);
          setFollowUpInput('');
        }

        setAiAppliedNotification(true);
        setTimeout(() => setAiAppliedNotification(false), 3500);
      }
    } catch (err: any) {
      setAnalysisError(err.message || 'Error executing AI risk extraction.');
    } finally {
      setIsAnalyzing(false);
      setIsAnsweringFollowUp(false);
    }
  };

  // Load sample proposal
  const handleLoadSample = (sample: (typeof SAMPLE_PROPOSALS)[0]) => {
    setClientName(sample.client);
    setClientGst(sample.gst);
    setClientAddress(sample.address || '');
    setHypothecationBank((sample as any).hypothecation || '');
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
    if (!clientName.trim()) {
      alert('Please enter a Client Name before generating the quote slip.');
      return;
    }
    if (!calculation.sumInsured || calculation.sumInsured <= 0) {
      alert('Please enter a valid Sum Insured before generating the quote slip.');
      return;
    }
    if (calculation.netPremium <= 0) {
      alert('Please configure peril rates (Flexa, STFI, or EQ) before generating the quote slip.');
      return;
    }

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

        {/* Sample Templates Secondary Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowSampleMenu(!showSampleMenu)}
            className="text-[11px] font-medium px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1.5"
          >
            <Zap className="w-3 h-3 text-amber-500" />
            <span>Need sample data? Load preset template</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showSampleMenu ? 'rotate-180' : ''}`} />
          </button>

          {showSampleMenu && (
            <div className="absolute right-0 mt-1.5 w-64 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl p-1.5 z-30 animate-fadeIn">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Sample Proposal Templates
              </div>
              {SAMPLE_PROPOSALS.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    handleLoadSample(sample);
                    setShowSampleMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 text-xs text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-between group"
                >
                  <span className="font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400">{sample.title}</span>
                  <span className="text-[10px] text-slate-400 font-mono">₹{(sample.sumInsured / 100000).toFixed(0)}L</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Step Switcher */}
      <div className="lg:hidden flex items-center border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 gap-1.5 overflow-x-auto flex-shrink-0">
        <button
          type="button"
          onClick={() => setActiveMobileTab('input')}
          className={`flex-1 min-w-[105px] py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
            activeMobileTab === 'input'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>01. Input & AI</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveMobileTab('calc')}
          className={`flex-1 min-w-[105px] py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
            activeMobileTab === 'calc'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>02. Tariff Math</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveMobileTab('slip')}
          className={`flex-1 min-w-[105px] py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
            activeMobileTab === 'slip'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          <Coins className="w-3.5 h-3.5" />
          <span>03. Slip Ledger</span>
        </button>
      </div>

      {/* Main 3-Column Split Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* ====================================================================== */}
        {/* LEFT PANEL: Proposal Input & AI Extraction (4 Cols) */}
        {/* ====================================================================== */}
        <div className={`lg:col-span-4 border-r border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 overflow-y-auto bg-white dark:bg-slate-900 space-y-6 ${activeMobileTab === 'input' ? 'block' : 'hidden lg:block'}`}>
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
              Gemini 3.8 Flash • AI Classifier
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
              onClick={() => handleAnalyzeProposal()}
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

          {/* AI Empty State Helper */}
          {!aiResult && !isAnalyzing && (
            <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 text-center space-y-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Ready for Underwriting Analysis
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                Describe the business activity or risk above and click <span className="font-semibold text-blue-600 dark:text-blue-400">Analyze Risk & Match Occupancy</span> to map it to IRDAI tariff codes via Gemini 3.8 Flash.
              </p>
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
                  {aiResult.confidenceScore > 1
                    ? Math.min(99, Math.round(aiResult.confidenceScore))
                    : Math.min(99, Math.round(aiResult.confidenceScore * 100))}% Confidence
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

              {/* Interactive Underwriter Follow-up Clarification Dialogue */}
              {aiResult.clarificationQuestion && (
                <div className="pt-4 border-t border-blue-200/60 dark:border-blue-900/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider">
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Underwriting Follow-up Dialogue</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800">
                      Live Clarification
                    </span>
                  </div>

                  {aiResult.missingFields && aiResult.missingFields.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 text-[10px]">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Missing data:</span>
                      {aiResult.missingFields.map((field, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900 font-medium text-[10px]"
                        >
                          {field}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/60 shadow-xs space-y-2.5">
                    <div className="flex items-start gap-2">
                      <HelpCircle className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs font-semibold text-slate-900 dark:text-white leading-snug">
                        {aiResult.clarificationQuestion}
                      </p>
                    </div>

                    {/* Clickable Quick Answer Suggestions */}
                    {aiResult.suggestedQuickAnswers && aiResult.suggestedQuickAnswers.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                          Quick Answers (Tap to update & re-rate):
                        </span>
                        <div className="flex flex-col gap-1.5">
                          {aiResult.suggestedQuickAnswers.map((answer, idx) => (
                            <button
                              key={idx}
                              type="button"
                              disabled={isAnsweringFollowUp}
                              onClick={() => handleAnalyzeProposal(answer)}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg bg-indigo-50/70 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 border border-indigo-200/60 dark:border-indigo-800 text-[11px] font-medium text-indigo-900 dark:text-indigo-200 transition-all flex items-center justify-between group disabled:opacity-50"
                            >
                              <span>{answer}</span>
                              <CornerDownRight className="w-3 h-3 text-indigo-400 group-hover:text-indigo-600 transition-transform group-hover:translate-x-0.5" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Inline Reply Input Box */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
                      <input
                        type="text"
                        value={followUpInput}
                        onChange={(e) => setFollowUpInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && followUpInput.trim() && !isAnsweringFollowUp) {
                            e.preventDefault();
                            handleAnalyzeProposal(followUpInput.trim());
                          }
                        }}
                        placeholder="Type custom clarification (e.g. 2 hydrants on site)..."
                        className="flex-1 px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                      />
                      <button
                        type="button"
                        disabled={!followUpInput.trim() || isAnsweringFollowUp}
                        onClick={() => handleAnalyzeProposal(followUpInput.trim())}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1 transition-colors flex-shrink-0"
                      >
                        {isAnsweringFollowUp ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            <Send className="w-3 h-3" />
                            <span>Reply</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Resolved Clarification Notes */}
                  {clarificationHistory.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                        Confirmed Clarifications:
                      </span>
                      {clarificationHistory.map((item, idx) => (
                        <div
                          key={idx}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-start gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="font-semibold">{item.a}</span>
                            <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                              Enriched into proposal & verified against statutory tariff rates.
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ====================================================================== */}
        {/* MIDDLE PANEL: Deterministic Tariff Engine (4 Cols) */}
        {/* ====================================================================== */}
        <div className={`lg:col-span-4 border-r border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50 space-y-6 ${activeMobileTab === 'calc' ? 'block' : 'hidden lg:block'}`}>
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
                    placeholder="e.g. Acme Industries Ltd"
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Risk Location & Pincode with AI Zone Auto-Detection */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-500" />
                    <span>Risk Location Address & PIN Code</span>
                  </label>
                  {detectedZoneInfo && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 font-semibold flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-blue-500" />
                      <span>{detectedZoneInfo.zone} ({detectedZoneInfo.rate.toFixed(2)}‰)</span>
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  placeholder="e.g. Pul Pehladpur, New Delhi - 110044 or Nariman Point, Mumbai 400021"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {detectedZoneInfo && (
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>Auto-mapped: {detectedZoneInfo.district} ({detectedZoneInfo.source})</span>
                  </p>
                )}
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
                    placeholder="e.g. 27AAACA1234A1Z5"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Earthquake Zone
                  </label>
                  <select
                    value={eqZone}
                    onChange={(e) => {
                      setEqZone(e.target.value);
                      if (e.target.value.includes('Zone 1')) setEqRate(0.25);
                      else if (e.target.value.includes('Zone 2')) setEqRate(0.15);
                      else if (e.target.value.includes('Zone 3')) setEqRate(0.10);
                      else if (e.target.value.includes('Zone 4')) setEqRate(0.05);
                    }}
                    className="w-full px-2.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 truncate"
                  >
                    <option value="Zone 1 (High Damage Risk)">Zone 1 / V (0.25‰ - NE, Kutch, Bihar)</option>
                    <option value="Zone 2 (Moderate Damage Risk)">Zone 2 / IV (0.15‰ - Delhi, Gujarat, Punjab)</option>
                    <option value="Zone 3 (Medium Damage Risk)">Zone 3 / III (0.10‰ - Mumbai, Pune, Chennai)</option>
                    <option value="Zone 4 (Low Damage Risk)">Zone 4 / II (0.05‰ - Bengaluru, Hyd, Jaipur)</option>
                  </select>
                </div>
              </div>

              {/* Hypothecation Bank (for Mandate / Bank Loan coverage) */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Hypothecation Bank / Financier
                </label>
                <div className="relative">
                  <Building className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={hypothecationBank}
                    onChange={(e) => setHypothecationBank(e.target.value)}
                    placeholder="e.g. State Bank of India, SME Branch / HDFC Bank"
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Brokerage & Commission Controls */}
              <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-amber-900 dark:text-amber-200 text-[11px] font-bold">
                    <BadgePercent className="w-3.5 h-3.5 text-amber-600" />
                    <span>Brokerage Margin (IRDAI Cap 15%)</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-300">
                    {brokeragePercent}%
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="0.5"
                    value={brokeragePercent}
                    onChange={(e) => setBrokeragePercent(Number(e.target.value))}
                    className="flex-1 accent-amber-600 h-1.5 bg-amber-200 dark:bg-amber-800 rounded-lg cursor-pointer"
                  />
                  <div className="w-16">
                    <input
                      type="number"
                      min="0"
                      max="25"
                      step="0.5"
                      value={brokeragePercent}
                      onChange={(e) => setBrokeragePercent(Number(e.target.value))}
                      className="w-full px-2 py-1 text-center font-mono font-bold text-xs rounded-lg border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-amber-800 dark:text-amber-300 font-mono pt-1 border-t border-amber-200 dark:border-amber-900">
                  <span>Earnable Brokerage:</span>
                  <span className="font-bold">
                    ₹ {formatINRWithDecimals((calculation.netPremium * brokeragePercent) / 100)}
                  </span>
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
                  {sumInsured > 0 ? formatINR(sumInsured) : '₹0'}
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
                  onChange={(e) => setSumInsured(e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)))}
                  placeholder="e.g. 50,00,000"
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
                    value={flexaRate || ''}
                    onChange={(e) => setFlexaRate(e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)))}
                    placeholder="0.00"
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
                    value={stfiRate || ''}
                    onChange={(e) => setStfiRate(e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)))}
                    placeholder="0.00"
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
                    value={eqRate || ''}
                    onChange={(e) => setEqRate(e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)))}
                    placeholder="0.00"
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
                    value={loadings || ''}
                    onChange={(e) => setLoadings(e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)))}
                    placeholder="0"
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
                    value={discounts || ''}
                    onChange={(e) => setDiscounts(e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)))}
                    placeholder="0"
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
        <div className={`lg:col-span-4 p-4 sm:p-6 overflow-y-auto bg-white dark:bg-slate-900 flex flex-col justify-between space-y-6 ${activeMobileTab === 'slip' ? 'block' : 'hidden lg:flex'}`}>
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

      {/* Mobile Sticky Action Bar */}
      <div className="lg:hidden p-3.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shadow-lg z-20 flex-shrink-0">
        <div>
          <span className="text-[10px] uppercase font-semibold text-slate-400 block">Total Final Premium</span>
          <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
            {formatINRWithDecimals(calculation.totalFinalPremium)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {activeMobileTab === 'input' && (
            <button
              type="button"
              onClick={() => setActiveMobileTab('calc')}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <span>Tariff Math</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
          {activeMobileTab === 'calc' && (
            <button
              type="button"
              onClick={() => setActiveMobileTab('slip')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <span>Review Slip</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
          {activeMobileTab === 'slip' && (
            <button
              type="button"
              onClick={handleGenerateQuoteSlip}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <FileText className="w-4 h-4" />
              <span>Generate Slip</span>
            </button>
          )}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    Insured Client
                  </span>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">{clientName}</p>
                  <p className="font-mono text-slate-500 text-[11px]">GSTIN: {clientGst || 'N/A'}</p>
                  {clientAddress && (
                    <p className="text-[10px] text-slate-500 truncate mt-1">
                      <span className="font-semibold text-slate-600 dark:text-slate-400">Risk Loc:</span> {clientAddress}
                    </p>
                  )}
                  {hypothecationBank && (
                    <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                      Hypothecated: {hypothecationBank}
                    </p>
                  )}
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    Classified Risk & Tariff
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
                  <div className="pt-1 flex items-center justify-between text-[11px] font-mono text-amber-700 dark:text-amber-400">
                    <span>Brokerage Margin:</span>
                    <span className="font-bold">{brokeragePercent}% (₹ {formatINRWithDecimals((calculation.netPremium * brokeragePercent) / 100)})</span>
                  </div>
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
