'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Download,
  Eye,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Flame,
  HelpCircle,
  Loader2,
  RefreshCw,
  Shield,
  Sparkles,
  Upload,
} from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { Header } from '@/components/layout/Header';
import { calculateCommercialPremium, formatINR } from '@/lib/calculator';

type TimelineStep = 'idle' | 'ocr' | 'extraction' | 'classification' | 'premium' | 'quote' | 'completed';

export default function UploadProposalPage() {
  const router = useRouter();
  const { currentWorkspace, addQuote, addDocument } = useWorkspace();

  const [currentStep, setCurrentStep] = useState<TimelineStep>('idle');
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: string;
    type: string;
  } | null>(null);

  // Extracted Editable Fields
  const [extractedData, setExtractedData] = useState({
    clientName: 'Krishna & Company',
    gst: '07ALMPA9603N1ZS',
    address: 'Khasra No-309/2, Pul Pehladpur, Near Lal Kuan Sunday Bazar, New Delhi - 110044',
    state: 'Delhi',
    district: 'South East Delhi',
    businessDescription:
      'Trading and storage of food products of Nestle, Bajaj Almond Oil, and cosmetic products. Godowns and storage premises.',
    sumInsuredBuilding: 0,
    sumInsuredStocks: 5000000,
    sumInsuredPM: 0,
    totalSumInsured: 5000000,
    hypothecation: 'Bank of India',
    riskCode: '4002',
    eqZone: 'Zone 2',
    pastClaimRatio: '<=70',
    confidenceScore: 94,
  });

  const timelineSteps = [
    { id: 'ocr', label: '1. Document OCR' },
    { id: 'extraction', label: '2. Entity Extraction' },
    { id: 'classification', label: '3. Occupancy Classification' },
    { id: 'premium', label: '4. Tariff Calculation' },
    { id: 'quote', label: '5. Quote Slip Ready' },
  ];

  const handleSimulateUpload = (fileName: string, type: string) => {
    setUploadedFile({
      name: fileName,
      size: '146 KB',
      type,
    });

    // Run automated step-by-step pipeline
    setCurrentStep('ocr');
    setTimeout(() => {
      setCurrentStep('extraction');
      setTimeout(() => {
        setCurrentStep('classification');
        setTimeout(() => {
          setCurrentStep('premium');
          setTimeout(() => {
            setCurrentStep('quote');
            setTimeout(() => {
              setCurrentStep('completed');
            }, 400);
          }, 400);
        }, 400);
      }, 400);
    }, 400);
  };

  const handleGenerateQuoteFromExtracted = () => {
    const calc = calculateCommercialPremium({
      occupancy_code: extractedData.riskCode,
      sum_insured: {
        building: extractedData.sumInsuredBuilding,
        plant_machinery: extractedData.sumInsuredPM,
        furniture_fixtures: 0,
        stocks: extractedData.sumInsuredStocks,
        others: 0,
        total: extractedData.totalSumInsured,
      },
      eq_zone: extractedData.eqZone,
      product_type: 'BSUS',
      feature_discounts: {
        fire_hydrant_sprinkler: true,
        electrical_installations: true,
        storm_water_drainage: true,
        high_security_cctv: true,
        past_claims_ratio: '<=70',
      },
      discretionary_discount_percent: 10,
      floater_opted: true,
      terrorism_opted: false,
    });

    const newQuote = addQuote({
      client_id: `client-${Date.now()}`,
      client_name: extractedData.clientName,
      client_gst: extractedData.gst,
      created_by: 'current-user',
      occupation_code: extractedData.riskCode,
      occupation_description: calc.occupancy_description,
      eq_zone: extractedData.eqZone,
      sum_insured: calc.total_sum_insured,
      sum_insured_breakdown: {
        building: extractedData.sumInsuredBuilding,
        plant_machinery: extractedData.sumInsuredPM,
        furniture_fixtures: 0,
        stocks: extractedData.sumInsuredStocks,
        others: 0,
        total: extractedData.totalSumInsured,
      },
      premium: calc.net_premium,
      gst_amount: calc.gst_amount,
      total_premium: calc.total_premium,
      policy_rate: calc.final_policy_rate_per_mille,
      status: 'under_review',
      ai_confidence: extractedData.confidenceScore / 100,
      calculation_breakdown: calc,
    });

    addDocument({
      file_name: uploadedFile?.name || 'Proposal.pdf',
      file_url: '/dummy-url',
      document_type: 'pdf',
      file_size: 146000,
      ocr_status: 'completed',
      quote_id: newQuote.id,
      extracted_data: extractedData,
    });

    router.push(`/quotes/${newQuote.id}`);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 dark:bg-slate-950">
      <Header
        title="Upload & Ingestion Pipeline"
        subtitle="Extract proposal forms, quote slips, WhatsApp RFQs, and Excel schedules"
        breadcrumbs={[
          { label: 'Underwriting', href: '/quotes/new' },
          { label: 'Upload Pipeline' },
        ]}
      />

      <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Pipeline Timeline Bar */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Autonomous Underwriting Pipeline
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {currentStep === 'completed'
                ? 'Processing Finished'
                : currentStep === 'idle'
                ? 'Ready for Ingestion'
                : 'Processing Step...'}
            </span>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {timelineSteps.map((step, idx) => {
              const stepIndex = timelineSteps.findIndex((s) => s.id === step.id);
              const currentIndex = timelineSteps.findIndex((s) => s.id === currentStep);
              const isPast =
                currentStep === 'completed' ||
                (currentStep !== 'idle' && stepIndex <= currentIndex);
              const isCurrent = currentStep === step.id;

              return (
                <div
                  key={step.id}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    isCurrent
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 shadow-xs'
                      : isPast
                      ? 'bg-emerald-500/10 dark:bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-center mb-1">
                    {isCurrent ? (
                      <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                    ) : isPast ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                    )}
                  </div>
                  <span className="text-[11px] font-semibold block">{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upload Drop Zone & Sample Triggers */}
        {currentStep === 'idle' && (
          <div className="space-y-4">
            <div className="p-10 rounded-3xl bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 transition-all text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center mb-4">
                <Upload className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Drag & drop your commercial proposal document
              </h3>
              <p className="text-xs text-slate-500 max-w-md mt-1 mb-4">
                Supports PDF proposals, scanned images (JPG/PNG), Excel asset schedules (XLSX), and Word RFQs (DOCX).
              </p>

              <button
                onClick={() =>
                  handleSimulateUpload('Quote Slip-KRISHNA & COMPANY-Fire Insurance Policy.pdf', 'pdf')
                }
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-emerald shadow-sm transition-all"
              >
                Choose File from Local Computer
              </button>
            </div>

            {/* Quick Demo Attachment Cards */}
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Or ingest sample workspace attachments directly:
              </p>
              <div className="grid md:grid-cols-3 gap-3">
                <button
                  onClick={() =>
                    handleSimulateUpload('Quote Slip-KRISHNA & COMPANY-Fire Insurance Policy.pdf', 'pdf')
                  }
                  className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 text-left transition-all card-hover"
                >
                  <div className="flex items-center gap-2 mb-1.5 text-emerald-600 font-bold text-xs">
                    <FileText className="w-4 h-4" />
                    <span>Krishna & Co. Proposal PDF</span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2">
                    Commercial proposal for FMCG food & almond oil godown. Sum insured ₹50,00,000.
                  </p>
                </button>

                <button
                  onClick={() =>
                    handleSimulateUpload('IIB Loss Cost - Schedule 3.xlsx', 'excel')
                  }
                  className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 text-left transition-all card-hover"
                >
                  <div className="flex items-center gap-2 mb-1.5 text-blue-600 font-bold text-xs">
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>IIB Loss Cost Schedule 3.xlsx</span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2">
                    Official schedule of Indian Insurance loss costs and tariff occupancy ratings.
                  </p>
                </button>

                <button
                  onClick={() =>
                    handleSimulateUpload('UPdated Calculator-07.02.2024.xlsx', 'excel')
                  }
                  className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 text-left transition-all card-hover"
                >
                  <div className="flex items-center gap-2 mb-1.5 text-blue-600 font-bold text-xs">
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Updated Calculator 2024.xlsx</span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2">
                    Benchmark commercial calculation spreadsheet with feature discounts and EQ matrices.
                  </p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SPLIT SCREEN PREVIEW & EXTRACTED FIELDS */}
        {(currentStep === 'quote' || currentStep === 'completed') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Half: Document Preview Card */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-card flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Document Source Preview
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {uploadedFile?.name}
                  </span>
                </div>

                {/* Simulated Proposal Document View */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 font-mono text-[11px] space-y-3 leading-relaxed text-slate-700 dark:text-slate-300">
                  <div className="text-center font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-700">
                    CAPITAL INSURANCE BROKERS PVT. LTD.
                    <br />
                    PROPOSAL FOR SOOKSHMA UDYAM INSURANCE POLICY
                  </div>

                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">INSURED:</span>{' '}
                    KRISHNA & COMPANY
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">ADDRESS:</span>{' '}
                    KHASRA NO-309/2, PUL PEHLADPUR, NEAR LAL KUAN, NEW DELHI - 110044
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">GSTIN:</span>{' '}
                    07ALMPA9603N1ZS
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">TRADE:</span>{' '}
                    TRADING AND STORAGE OF FOOD PRODUCTS OF NESTLE, BAJAJ ALMOND OIL, COSMETICS.
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">RISK CODE:</span>{' '}
                    4002 (STORAGE OF CATEGORY I HAZARDOUS GOODS)
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">SUM INSURED:</span>{' '}
                    STOCKS: RS. 50,00,000 (TOTAL: RS. 50,00,000)
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">HYPOTHECATION:</span>{' '}
                    BANK OF INDIA (AGREED BANK CLAUSE)
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">CLAIMS:</span> NO
                    CLAIM IN LAST THREE YEARS
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  OCR Verified (100% Text Extracted)
                </span>
                <button
                  onClick={() => setCurrentStep('idle')}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white underline"
                >
                  Upload Another File
                </button>
              </div>
            </div>

            {/* Right Half: Editable Extracted Fields & Confidence */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-card space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    AI Extracted Entities
                  </h3>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    Review & Edit Underwriting Parameters
                  </p>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{extractedData.confidenceScore}% AI Confidence</span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Client Name
                  </label>
                  <input
                    type="text"
                    value={extractedData.clientName}
                    onChange={(e) =>
                      setExtractedData({ ...extractedData, clientName: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      GSTIN
                    </label>
                    <input
                      type="text"
                      value={extractedData.gst}
                      onChange={(e) =>
                        setExtractedData({ ...extractedData, gst: e.target.value.toUpperCase() })
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Matched Risk Code
                    </label>
                    <input
                      type="text"
                      value={extractedData.riskCode}
                      onChange={(e) =>
                        setExtractedData({ ...extractedData, riskCode: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold text-emerald-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Total Sum Insured (INR)
                    </label>
                    <input
                      type="number"
                      value={extractedData.totalSumInsured}
                      onChange={(e) =>
                        setExtractedData({
                          ...extractedData,
                          totalSumInsured: Number(e.target.value),
                          sumInsuredStocks: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Earthquake Zone
                    </label>
                    <select
                      value={extractedData.eqZone}
                      onChange={(e) =>
                        setExtractedData({ ...extractedData, eqZone: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    >
                      <option value="Zone 2">Zone 2 / Zone IV (Delhi NCR)</option>
                      <option value="Zone 3">Zone 3 / Zone III (Mumbai / Pune)</option>
                      <option value="Zone 1">Zone 1 / Zone V (Northeast)</option>
                      <option value="Zone 4">Zone 4 / Zone II (Low)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Risk Premises Address
                  </label>
                  <textarea
                    rows={2}
                    value={extractedData.address}
                    onChange={(e) =>
                      setExtractedData({ ...extractedData, address: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Action */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={handleGenerateQuoteFromExtracted}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-emerald shadow-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Quotation Slip from Extraction</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
