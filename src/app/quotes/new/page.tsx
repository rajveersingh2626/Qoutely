'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  Download,
  FileCheck,
  FileText,
  Flame,
  HelpCircle,
  Info,
  RefreshCw,
  Save,
  Shield,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { Header } from '@/components/layout/Header';
import {
  calculateCommercialPremium,
  formatINR,
  formatNumberINR,
  getOccupancyByCode,
  OCCUPANCIES,
} from '@/lib/calculator';
import { analyzeProposalAI } from '@/lib/ai-engine';
import { downloadQuoteSlipPDF } from '@/lib/pdf-generator';
import {
  AIAnalysisResult,
  FeatureDiscountOptions,
  OccupancyCandidate,
  SumInsuredBreakdown,
} from '@/types/database';

export default function NewQuotePage() {
  const router = useRouter();
  const { currentWorkspace, addQuote, clients, addClient } = useWorkspace();

  // LEFT COLUMN: Proposal Form State
  const [selectedClientId, setSelectedClientId] = useState<string>('custom');
  const [clientName, setClientName] = useState('Krishna & Company');
  const [clientGst, setClientGst] = useState('07ALMPA9603N1ZS');
  const [clientAddress, setClientAddress] = useState(
    'Khasra No-309/2, Measuring 400 Sq. Yds. Pul Pehladpur, Near Lal Kuan Sunday Bazar, New Delhi - 110044'
  );
  const [stateName, setStateName] = useState('Delhi');
  const [districtName, setDistrictName] = useState('South East Delhi');
  const [businessDescription, setBusinessDescription] = useState(
    'Trading and storage of food products of Nestle, Bajaj Almond Oil, cosmetic products and other similar type of packaged products related to insured trade.'
  );

  // Sum Insured Breakdown
  const [sumInsured, setSumInsured] = useState<SumInsuredBreakdown>({
    building: 0,
    plant_machinery: 0,
    furniture_fixtures: 0,
    stocks: 5000000,
    others: 0,
    total: 5000000,
  });

  const [constructionType, setConstructionType] = useState('Class A Pucca RCC');
  const [policyDuration, setPolicyDuration] = useState('12 Months (Annual Policy)');
  const [previousInsurer, setPreviousInsurer] = useState('THE NEW INDIA ASSURANCE CO. LTD.');
  const [claimHistory, setClaimHistory] = useState('<=70'); // 0 claims in last 3 years

  // Peril Toggles
  const [eqToggle, setEqToggle] = useState(true);
  const [stfiToggle, setStfiToggle] = useState(true);
  const [terrorismToggle, setTerrorismToggle] = useState(false);
  const [floaterToggle, setFloaterToggle] = useState(true);
  const [eqZone, setEqZone] = useState('Zone 2'); // Zone IV (Delhi NCR)

  // Feature Discounts
  const [features, setFeatures] = useState<Partial<FeatureDiscountOptions>>({
    fire_hydrant_sprinkler: true,
    electrical_installations: true,
    storm_water_drainage: true,
    high_security_cctv: true,
    past_claims_ratio: '<=70',
    basement_used: false,
    waterbody_within_1km: false,
    thickly_populated_no_access: false,
  });

  // Selected Occupancy
  const [occupancyCode, setOccupancyCode] = useState('4002');
  const [productType, setProductType] = useState<'Flexi_BS' | 'Flexi_BL' | 'BSUS' | 'BLUS'>('BSUS');
  const [discretionaryDiscount, setDiscretionaryDiscount] = useState(10);

  // AI Analysis State
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);

  // Run AI analysis whenever description, GST, or sum insured changes
  useEffect(() => {
    setIsAiAnalyzing(true);
    const timer = setTimeout(() => {
      const res = analyzeProposalAI({
        business_name: clientName,
        business_description: businessDescription,
        gst: clientGst,
        address: clientAddress,
        district: districtName,
        state: stateName,
        sum_insured: sumInsured.total,
        building_si: sumInsured.building,
        stocks_si: sumInsured.stocks,
        pm_si: sumInsured.plant_machinery,
        construction_type: constructionType,
        claim_history: claimHistory,
        has_fire_hydrant: features.fire_hydrant_sprinkler,
        has_security_cctv: features.high_security_cctv,
        has_drainage: features.storm_water_drainage,
        is_basement_used: features.basement_used,
        is_near_waterbody: features.waterbody_within_1km,
      });
      setAiAnalysis(res);
      setIsAiAnalyzing(false);
    }, 350);

    return () => clearTimeout(timer);
  }, [
    clientName,
    businessDescription,
    clientGst,
    clientAddress,
    districtName,
    stateName,
    sumInsured.total,
    sumInsured.building,
    sumInsured.plant_machinery,
    sumInsured.stocks,
    constructionType,
    claimHistory,
    features,
  ]);

  // Handle Sum Insured Field Change
  const handleSIChange = (key: keyof SumInsuredBreakdown, value: number) => {
    setSumInsured((prev) => {
      const updated = { ...prev, [key]: Math.max(0, value) };
      updated.total =
        updated.building +
        updated.plant_machinery +
        updated.furniture_fixtures +
        updated.stocks +
        updated.others;
      return updated;
    });
  };

  // Deterministic calculation engine
  const calculation = useMemo(() => {
    return calculateCommercialPremium({
      occupancy_code: occupancyCode,
      sum_insured: sumInsured,
      eq_zone: eqZone,
      product_type: productType,
      kutcha_construction: constructionType.toLowerCase().includes('kutcha'),
      feature_discounts: features,
      discretionary_discount_percent: discretionaryDiscount,
      floater_opted: floaterToggle,
      terrorism_opted: terrorismToggle,
      stfi_opted: stfiToggle,
      eq_opted: eqToggle,
    });
  }, [
    occupancyCode,
    sumInsured,
    eqZone,
    productType,
    constructionType,
    features,
    discretionaryDiscount,
    floaterToggle,
    terrorismToggle,
    stfiToggle,
    eqToggle,
  ]);

  // Load Preset Proposal (Krishna & Company)
  const loadKrishnaSample = () => {
    setClientName('Krishna & Company');
    setClientGst('07ALMPA9603N1ZS');
    setClientAddress(
      'Khasra No-309/2, Measuring 400 Sq. Yds. Pul Pehladpur, Near Lal Kuan Sunday Bazar, New Delhi - 110044'
    );
    setStateName('Delhi');
    setDistrictName('South East Delhi');
    setBusinessDescription(
      'Trading and storage of food products of Nestle, Bajaj Almond Oil, cosmetic products and other similar type of products related to insured trade.'
    );
    setSumInsured({
      building: 0,
      plant_machinery: 0,
      furniture_fixtures: 0,
      stocks: 5000000,
      others: 0,
      total: 5000000,
    });
    setOccupancyCode('4002');
    setProductType('BSUS');
    setEqZone('Zone 2');
    setTerrorismToggle(false);
    setFloaterToggle(true);
    setFeatures({
      fire_hydrant_sprinkler: true,
      electrical_installations: true,
      storm_water_drainage: true,
      high_security_cctv: true,
      past_claims_ratio: '<=70',
      basement_used: false,
      waterbody_within_1km: false,
      thickly_populated_no_access: false,
    });
  };

  // Save Draft Quote
  const handleSaveDraft = () => {
    const quote = addQuote({
      client_id: selectedClientId === 'custom' ? `client-${Date.now()}` : selectedClientId,
      client_name: clientName,
      client_gst: clientGst,
      created_by: 'current-user',
      occupation_code: occupancyCode,
      occupation_description: calculation.occupancy_description,
      eq_zone: eqZone,
      sum_insured: calculation.total_sum_insured,
      sum_insured_breakdown: sumInsured,
      premium: calculation.net_premium,
      gst_amount: calculation.gst_amount,
      total_premium: calculation.total_premium,
      policy_rate: calculation.final_policy_rate_per_mille,
      status: 'draft',
      ai_confidence: aiAnalysis?.confidence_score || 0.9,
      ai_analysis: aiAnalysis || undefined,
      calculation_breakdown: calculation,
      insurer_name: previousInsurer,
    });

    router.push(`/quotes/${quote.id}`);
  };

  // Download PDF
  const handleDownloadPDF = () => {
    const dummyQuote: any = {
      id: 'draft-temp',
      quote_number: 'QTL-DRAFT-2026',
      client_name: clientName,
      client_gst: clientGst,
      occupation_code: occupancyCode,
      occupation_description: calculation.occupancy_description,
      eq_zone: eqZone,
      sum_insured: calculation.total_sum_insured,
      sum_insured_breakdown: sumInsured,
      premium: calculation.net_premium,
      gst_amount: calculation.gst_amount,
      total_premium: calculation.total_premium,
      policy_rate: calculation.final_policy_rate_per_mille,
      calculation_breakdown: calculation,
      created_at: new Date().toISOString(),
      insurer_name: previousInsurer,
    };
    downloadQuoteSlipPDF(dummyQuote, currentWorkspace);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-950">
      <Header
        title="Three-Column Underwriting Workspace"
        subtitle="Proposal Intake * AI Classification * Deterministic Tariff Calculation"
        breadcrumbs={[
          { label: 'Quotes', href: '/quotes' },
          { label: 'New Underwrite' },
        ]}
      />

      {/* Top Banner Toolbar */}
      <div className="px-6 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Engine Active
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            Occupancy: {occupancyCode} ({calculation.occupancy_description.slice(0, 32)}...)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadKrishnaSample}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Load Krishna & Co. Sample Proposal</span>
          </button>
        </div>
      </div>

      {/* 3-COLUMN WORKSPACE BODY */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* ====================================================================== */}
        {/* LEFT COLUMN: Proposal Form (4 Cols) */}
        {/* ====================================================================== */}
        <div className="lg:col-span-4 border-r border-slate-200/80 dark:border-slate-800 p-5 overflow-y-auto bg-white dark:bg-slate-900 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                1. Proposal Form
              </h3>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Client & Risk Details
              </p>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              IRDAI Format
            </span>
          </div>

          {/* Client Details */}
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Insured Name *
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  GST Number (GSTIN)
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
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Zone 1">Zone 1 / Zone V (Northeast, Kutch, J&K)</option>
                  <option value="Zone 2">Zone 2 / Zone IV (Delhi NCR, Bihar, Gujarat)</option>
                  <option value="Zone 3">Zone 3 / Zone III (Mumbai, Pune, Chennai)</option>
                  <option value="Zone 4">Zone 4 / Zone II (Bengaluru, Hyderabad)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Risk Premises Address
              </label>
              <textarea
                rows={2}
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Business & Trade Description
              </label>
              <textarea
                rows={3}
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Sum Insured Breakdown */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Sum Insured Breakdown (INR)
              </label>
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                Total: {formatINR(sumInsured.total)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 block mb-0.5">Building</span>
                <input
                  type="number"
                  value={sumInsured.building || ''}
                  placeholder="0"
                  onChange={(e) => handleSIChange('building', Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs"
                />
              </div>

              <div>
                <span className="text-[10px] text-slate-500 block mb-0.5">Plant & Machinery</span>
                <input
                  type="number"
                  value={sumInsured.plant_machinery || ''}
                  placeholder="0"
                  onChange={(e) => handleSIChange('plant_machinery', Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs"
                />
              </div>

              <div>
                <span className="text-[10px] text-slate-500 block mb-0.5">Furniture & Fixtures</span>
                <input
                  type="number"
                  value={sumInsured.furniture_fixtures || ''}
                  placeholder="0"
                  onChange={(e) => handleSIChange('furniture_fixtures', Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs"
                />
              </div>

              <div>
                <span className="text-[10px] text-slate-500 block mb-0.5">Stocks (Inventory)</span>
                <input
                  type="number"
                  value={sumInsured.stocks || ''}
                  placeholder="0"
                  onChange={(e) => handleSIChange('stocks', Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400"
                />
              </div>
            </div>
          </div>

          {/* Construction & Policy Controls */}
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Construction Type
                </label>
                <select
                  value={constructionType}
                  onChange={(e) => setConstructionType(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="Class A Pucca RCC">Class A Pucca (RCC / Brick)</option>
                  <option value="Kutcha Construction">Kutcha Roof / Combustible (+4.0 loading)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Policy Product
                </label>
                <select
                  value={productType}
                  onChange={(e) => setProductType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="BSUS">Bharat Sookshma Suraksha (&le; 5 Cr)</option>
                  <option value="BLUS">Bharat Laghu Suraksha (&le; 50 Cr)</option>
                  <option value="Flexi_BS">Flexi Sookshma</option>
                  <option value="Flexi_BL">Flexi Laghu</option>
                </select>
              </div>
            </div>

            {/* Perils Covered Toggles */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Standard Peril Inclusions
              </p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={eqToggle}
                    onChange={(e) => setEqToggle(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  <span>Earthquake (EQ)</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={stfiToggle}
                    onChange={(e) => setStfiToggle(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  <span>STFI Perils</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={terrorismToggle}
                    onChange={(e) => setTerrorismToggle(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  <span>Terrorism Pool</span>
                </label>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={floaterToggle}
                    onChange={(e) => setFloaterToggle(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Floater Cover (Stocks across locations)
                  </span>
                </label>
                <span className="text-[10px] font-mono text-emerald-600 font-semibold">+10%</span>
              </div>
            </div>

            {/* Feature Discounts Accordion / Checkboxes */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Broker Risk Features & Discounts
              </p>
              <div className="space-y-1.5 text-xs">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-slate-700 dark:text-slate-300">
                    Operational Fire Hydrants / Sprinklers
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-emerald-600 font-semibold">-10%</span>
                    <input
                      type="checkbox"
                      checked={features.fire_hydrant_sprinkler}
                      onChange={(e) =>
                        setFeatures({ ...features, fire_hydrant_sprinkler: e.target.checked })
                      }
                      className="rounded text-emerald-600"
                    />
                  </div>
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-slate-700 dark:text-slate-300">
                    Well Maintained Electrical Installations
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-emerald-600 font-semibold">-10%</span>
                    <input
                      type="checkbox"
                      checked={features.electrical_installations}
                      onChange={(e) =>
                        setFeatures({ ...features, electrical_installations: e.target.checked })
                      }
                      className="rounded text-emerald-600"
                    />
                  </div>
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-slate-700 dark:text-slate-300">
                    Plinth &ge; 1.5 ft + Storm Drainage
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-emerald-600 font-semibold">-10%</span>
                    <input
                      type="checkbox"
                      checked={features.storm_water_drainage}
                      onChange={(e) =>
                        setFeatures({ ...features, storm_water_drainage: e.target.checked })
                      }
                      className="rounded text-emerald-600"
                    />
                  </div>
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-slate-700 dark:text-slate-300">
                    24x7 Security Guard & CCTV
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-emerald-600 font-semibold">-10%</span>
                    <input
                      type="checkbox"
                      checked={features.high_security_cctv}
                      onChange={(e) =>
                        setFeatures({ ...features, high_security_cctv: e.target.checked })
                      }
                      className="rounded text-emerald-600"
                    />
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* ====================================================================== */}
        {/* CENTER COLUMN: AI Underwriting Analysis (4 Cols) */}
        {/* ====================================================================== */}
        <div className="lg:col-span-4 border-r border-slate-200/80 dark:border-slate-800 p-5 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                2. AI Underwriting Analysis
              </h3>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Deterministic Classification
              </p>
            </div>
            {isAiAnalyzing ? (
              <RefreshCw className="w-4 h-4 text-indigo-500 animate-spin" />
            ) : (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                AIFT Compliant
              </span>
            )}
          </div>

          {/* Confidence & Software 2.0 / 1.0 Boundary Card */}
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Software 2.0 Perception
              </span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                0% LLM Math
              </span>
            </div>

            <div className="flex items-center gap-4">
              {/* SVG Circular Confidence Ring */}
              <div className="relative w-14 h-14 flex-shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100 dark:text-slate-800"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-emerald-500 transition-all duration-700 ease-out"
                    strokeDasharray={`${Math.round((aiAnalysis?.confidence_score || 0.94) * 100)}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-xs font-bold text-slate-900 dark:text-white font-mono">
                  {Math.round((aiAnalysis?.confidence_score || 0.94) * 100)}%
                </span>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Underwriting Perception Score
                </p>
                <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                  LLM extracted candidate occupancies bounded by official IIB Schedule 3 taxonomy.
                </p>
              </div>
            </div>

            {/* Software 1.0 Deterministic Enforcement Badge */}
            <div className="p-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 text-[11px] flex items-center justify-between text-blue-900 dark:text-blue-300">
              <span className="font-semibold">Software 1.0 Rating Engine:</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">100% Deterministic</span>
            </div>
          </div>

          {/* Business Summary */}
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Extracted Business Summary
            </h4>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {aiAnalysis?.business_summary ||
                'Trading and storage of food products (Nestle, Bajaj Almond Oil) and cosmetics. Classified under Category I Hazardous Goods godown warranty.'}
            </p>

            {/* Detected Keywords */}
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-semibold text-slate-400 block mb-1.5">
                DETECTED RISK KEYWORDS
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(aiAnalysis?.keywords || ['food', 'nestle', 'almond oil', 'cosmetics', 'godown', 'storage']).map(
                  (kw, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60"
                    >
                      {kw}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Top 3 Occupancy Candidates */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Top Occupancy Candidates
              </h4>
              <span className="text-[10px] text-slate-400">Click to apply</span>
            </div>

            {(aiAnalysis?.occupancy_candidates || []).map((cand) => {
              const isSelected = occupancyCode === cand.code;
              return (
                <div
                  key={cand.code}
                  onClick={() => setOccupancyCode(cand.code)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-500 shadow-xs ring-1 ring-emerald-500/20'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400">
                        {cand.code}
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                        {cand.description}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-600 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                      {Math.round(cand.confidence * 100)}%
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                    {cand.reason}
                  </p>

                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Loss Cost: {cand.loss_cost || 0.4}%</span>
                    <span>Category: {cand.category || 1}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Hazard Warnings */}
          {aiAnalysis?.hazard_flags && aiAnalysis.hazard_flags.length > 0 && (
            <div className="p-4 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 space-y-2">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 text-xs font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Underwriting Hazard Flags</span>
              </div>
              <ul className="space-y-1 text-xs text-amber-900 dark:text-amber-200">
                {aiAnalysis.hazard_flags.map((h, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-amber-600 font-bold">*</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Missing Fields Questions */}
          {aiAnalysis?.missing_fields && aiAnalysis.missing_fields.length > 0 && (
            <div className="p-4 rounded-3xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 space-y-2">
              <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300 text-xs font-bold">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                <span>Underwriter Verification Required</span>
              </div>
              <ul className="space-y-1 text-xs text-blue-900 dark:text-blue-200">
                {aiAnalysis.missing_fields.map((mf, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-blue-500">*</span>
                    <span>{mf}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* ====================================================================== */}
        {/* RIGHT COLUMN: Premium Engine (4 Cols - Sticky) */}
        {/* ====================================================================== */}
        <div className="lg:col-span-4 p-5 overflow-y-auto bg-white dark:bg-slate-900 flex flex-col justify-between space-y-5">
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                  3. Premium Engine
                </h3>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  Live Tariff Calculation
                </p>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                ₹ per 1,000
              </span>
            </div>

            {/* Total Premium Hero Box */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white shadow-emerald shadow-md">
              <div className="flex items-center justify-between text-emerald-100 text-xs mb-1">
                <span>Total Payable Premium (with GST)</span>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">
                  18% GST Included
                </span>
              </div>
              <div className="text-3xl font-extrabold tracking-tight font-mono">
                {formatINR(calculation.total_premium)}
              </div>
              <div className="mt-3 pt-3 border-t border-emerald-500/50 flex items-center justify-between text-xs text-emerald-100">
                <span>Net Basic: {formatINR(calculation.net_premium)}</span>
                <span>GST: {formatINR(calculation.gst_amount)}</span>
              </div>
            </div>

            {/* Live Calculation Step-by-Step Breakdown */}
            <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Tariff Calculation Breakdown
              </h4>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>Base Flexa Rate ({calculation.section})</span>
                  <span className="font-mono text-slate-900 dark:text-white">
                    {calculation.base_flexa_rate}‰
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>Category {calculation.category} Rating</span>
                  <span className="font-mono text-emerald-600">
                    {calculation.category === 1 ? '-25%' : calculation.category === 2 ? '-10%' : '+25%'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>Adjusted Flexa Rate</span>
                  <span className="font-mono text-slate-900 dark:text-white">
                    {calculation.nia_adjusted_flexa_rate}‰
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>Feature Discounts / Loading</span>
                  <span className="font-mono text-emerald-600 font-bold">
                    {calculation.feature_discount_percent}%
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>Flexa Rate after Features</span>
                  <span className="font-mono text-slate-900 dark:text-white">
                    {calculation.rate_after_discount}‰
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>Earthquake Peril ({calculation.eq_zone})</span>
                  <span className="font-mono text-slate-900 dark:text-white">
                    +{calculation.eq_rate}‰
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>STFI Perils</span>
                  <span className="font-mono text-slate-900 dark:text-white">
                    +{calculation.stfi_rate}‰
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>Terrorism Peril</span>
                  <span className="font-mono text-slate-900 dark:text-white">
                    +{calculation.terrorism_rate}‰
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200">
                  <span>Total Base Rate</span>
                  <span className="font-mono">{calculation.total_base_rate}‰</span>
                </div>

                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>Discretionary Broker Discount</span>
                  <span className="font-mono text-emerald-600">
                    -{calculation.discretionary_discount_percent}%
                  </span>
                </div>

                {calculation.floater_opted && (
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span>Floater Loading</span>
                    <span className="font-mono text-amber-600">+10%</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  <span>Final Policy Rate Applied</span>
                  <span className="font-mono text-sm">{calculation.final_policy_rate_per_mille}‰</span>
                </div>
              </div>
            </div>

            {/* Discretionary Discount Slider */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Discretionary Broker Discount
                </span>
                <span className="font-mono font-bold text-emerald-600">{discretionaryDiscount}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="25"
                step="1"
                value={discretionaryDiscount}
                onChange={(e) => setDiscretionaryDiscount(Number(e.target.value))}
                className="w-full accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>0% (Standard)</span>
                <span>10% (Broker Default)</span>
                <span>25% (Max Authority)</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={handleDownloadPDF}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download Quote Slip PDF</span>
            </button>

            <button
              onClick={handleSaveDraft}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-emerald shadow-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
            >
              <Save className="w-4 h-4" />
              <span>Save & Issue Quote</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
