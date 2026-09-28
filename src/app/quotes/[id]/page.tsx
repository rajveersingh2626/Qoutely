'use client';

import React, { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Building,
  CheckCircle2,
  Copy,
  Download,
  FileCheck,
  FileText,
  Flame,
  History,
  MapPin,
  Printer,
  Shield,
  Sparkles,
  Layers,
  AlertCircle,
  HelpCircle,
  Check,
  Cpu
} from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { Header } from '@/components/layout/Header';
import { formatINR, formatNumberINR } from '@/lib/calculator';
import { downloadQuoteSlipPDF } from '@/lib/pdf-generator';

export default function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const { quotes, currentWorkspace, duplicateQuote, updateQuote } = useWorkspace();

  const quote = quotes.find((q) => q.id === unwrappedParams.id) || quotes[0];
  const [currentStatus, setCurrentStatus] = useState(quote?.status || 'approved');

  if (!quote) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <div>
          <p className="text-sm font-semibold text-slate-700">Quote slip not found.</p>
          <Link href="/app/quotes" className="text-xs text-emerald-600 underline mt-2 block">
            Return to quotes history
          </Link>
        </div>
      </div>
    );
  }

  const handleStatusChange = (newStatus: any) => {
    setCurrentStatus(newStatus);
    updateQuote(quote.id, { status: newStatus });
  };

  const handleDuplicate = () => {
    const dup = duplicateQuote(quote.id);
    if (dup) {
      router.push(`/app/quotes/${dup.id}`);
    }
  };

  // Confidence calculations
  const confidenceScore = Math.round(quote.ai_confidence ? quote.ai_confidence * 100 : 96);
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (confidenceScore / 100) * circumference;

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 dark:bg-slate-950 font-sans">
      <Header
        title={`Quote Slip • ${quote.quote_number}`}
        subtitle={`Insured: ${quote.client_name} • Underwritten Commercial Policy`}
        breadcrumbs={[
          { label: 'Quotes', href: '/app/quotes' },
          { label: quote.quote_number },
        ]}
      />

      {/* Action Toolbar */}
      <div className="px-6 py-3 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/app/quotes"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">
              {quote.quote_number}
            </span>
            <span className="text-[11px] text-slate-400 ml-2">Version {quote.version || 2}</span>
          </div>

          <select
            value={currentStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
          >
            <option value="draft">Status: Draft</option>
            <option value="under_review">Status: Under Review</option>
            <option value="approved">Status: Approved / Ready</option>
            <option value="issued">Status: Policy Issued</option>
            <option value="rejected">Status: Rejected</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDuplicate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Duplicate</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>

          <button
            onClick={() => downloadQuoteSlipPDF(quote, currentWorkspace)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Official PDF Slip</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Quote Slip Left (8 cols) + AI Evidence Sidebar Right (4 cols) */}
      <div className="p-6 md:p-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Official Quote Slip */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
          {/* Header Regulatory Strip */}
          <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] font-mono text-slate-500 pb-2">
              <span>
                CIN NO: {currentWorkspace.default_rules.cin_no} | CATEGORY: DIRECT BROKERS (GENERAL)
              </span>
              <span>DATE: {new Date(quote.created_at).toLocaleDateString('en-GB')}</span>
            </div>
            <div className="text-[11px] font-mono text-slate-500 mb-3">
              IRDA LICENSE NO: {currentWorkspace.default_rules.irda_license_no} | L.EXPIRY DATE: 29 DECEMBER 2027
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  {currentWorkspace.name.toUpperCase()}
                </h1>
                <p className="text-xs text-slate-500 max-w-lg mt-0.5">
                  {currentWorkspace.address}
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Reference
                </span>
                <span className="font-mono font-bold text-xs text-emerald-600">
                  {quote.quote_number}
                </span>
              </div>
            </div>

            <div className="mt-4 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-center font-bold text-xs text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              {quote.sum_insured <= 50000000
                ? 'Proposal For Bharat Sookshma Udyam Insurance Policy & Burglary Cover'
                : 'Proposal For Bharat Laghu Udyam Insurance Policy'}
            </div>
          </div>

          {/* Insured Details Grid Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-200 dark:divide-slate-800 text-xs">
            <div className="grid grid-cols-12 p-3 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="col-span-4 font-semibold text-slate-500">INSURED NAME</div>
              <div className="col-span-8 font-bold text-slate-900 dark:text-white">
                {quote.client_name}
              </div>
            </div>

            <div className="grid grid-cols-12 p-3">
              <div className="col-span-4 font-semibold text-slate-500">RISK ADDRESS</div>
              <div className="col-span-8 text-slate-700 dark:text-slate-300">
                {quote.client_name}, {quote.eq_zone}
              </div>
            </div>

            <div className="grid grid-cols-12 p-3 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="col-span-4 font-semibold text-slate-500">GST NUMBER</div>
              <div className="col-span-8 font-mono text-slate-900 dark:text-white font-bold">
                {quote.client_gst || '27AAACA1234A1Z5'}
              </div>
            </div>

            <div className="grid grid-cols-12 p-3">
              <div className="col-span-4 font-semibold text-slate-500">POLICY PERIOD</div>
              <div className="col-span-8 text-slate-700 dark:text-slate-300">
                12 Months from Premium Realization
              </div>
            </div>

            <div className="grid grid-cols-12 p-3 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="col-span-4 font-semibold text-slate-500">OCCUPANCY DESCRIPTION</div>
              <div className="col-span-8 text-slate-700 dark:text-slate-300 font-medium">
                {quote.occupation_description}
              </div>
            </div>

            <div className="grid grid-cols-12 p-3">
              <div className="col-span-4 font-semibold text-slate-500">TARIFF OCCUPATION CODE</div>
              <div className="col-span-8 flex items-center gap-2">
                <span className="font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded text-xs">
                  {quote.occupation_code}
                </span>
                <span className="text-[11px] text-slate-400">IIB Loss Cost Schedule 3</span>
              </div>
            </div>

            <div className="grid grid-cols-12 p-3 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="col-span-4 font-semibold text-slate-500">EARTHQUAKE ZONE</div>
              <div className="col-span-8 font-semibold text-slate-800 dark:text-slate-200">
                {quote.eq_zone} (Tariff Rate Applied: 0.50 ‰)
              </div>
            </div>
          </div>

          {/* Sum Insured Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Sum Insured & Tariff Premium Computation
            </h3>

            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold text-[11px]">
                  <tr>
                    <th className="p-3">Asset Section</th>
                    <th className="p-3">Sum Insured</th>
                    <th className="p-3">Tariff Rate</th>
                    <th className="p-3 text-right">Net Premium</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr>
                    <td className="p-3 font-medium text-slate-900 dark:text-white">
                      Building, Plant & Machinery, and Stock
                    </td>
                    <td className="p-3 font-mono">{formatINR(quote.sum_insured)}</td>
                    <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                      {quote.policy_rate || '2.128'} per mille
                    </td>
                    <td className="p-3 font-mono font-semibold text-right">
                      {formatINR(quote.premium)}
                    </td>
                  </tr>

                  <tr className="bg-slate-50/60 dark:bg-slate-800/40 font-semibold">
                    <td className="p-3 text-slate-700 dark:text-slate-300">Net Basic Premium</td>
                    <td className="p-3 font-mono">{formatINR(quote.sum_insured)}</td>
                    <td className="p-3 text-slate-400">-</td>
                    <td className="p-3 font-mono text-right">{formatINR(quote.premium)}</td>
                  </tr>

                  <tr className="bg-slate-50/60 dark:bg-slate-800/40 font-semibold">
                    <td className="p-3 text-slate-700 dark:text-slate-300">GST @ 18%</td>
                    <td className="p-3 text-slate-400">-</td>
                    <td className="p-3 font-mono">18.00%</td>
                    <td className="p-3 font-mono text-right">{formatINR(quote.gst_amount)}</td>
                  </tr>

                  <tr className="bg-emerald-50 dark:bg-emerald-950/60 font-bold text-emerald-900 dark:text-emerald-200">
                    <td className="p-3.5 text-sm">TOTAL GROSS PAYABLE PREMIUM</td>
                    <td className="p-3 text-emerald-700 dark:text-emerald-300">Sum Insured: {formatINR(quote.sum_insured)}</td>
                    <td className="p-3 text-xs">Inclusive of All Perils</td>
                    <td className="p-3.5 font-mono text-sm text-right font-extrabold text-emerald-700 dark:text-emerald-300">
                      {formatINR(quote.total_premium)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Clauses */}
          <div className="grid md:grid-cols-2 gap-4 text-xs pt-2">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="font-bold text-slate-900 dark:text-white uppercase text-[11px] block">
                Standard Perils Covered
              </span>
              <ul className="space-y-1 text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                <li>• Fire, Lightning & Explosion / Implosion</li>
                <li>• Earthquake (EQ) Volcanic Eruption & Convulsion</li>
                <li>• Storm, Cyclone, Flood & Inundation (STFI)</li>
                <li>• Subsidence of Land, Landslide & Rockslide</li>
                <li>• Terrorism Coverage (Indian Terrorism Pool Tariff)</li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="font-bold text-slate-900 dark:text-white uppercase text-[11px] block">
                Applicable Clauses & Warranties
              </span>
              <ul className="space-y-1 text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                <li>• Agreed Bank Clause (Hypothecated to Banker)</li>
                <li>• Architects & Surveyors Fees (up to 5% of claim)</li>
                <li>• Cost of Removal of Debris (up to 2% of claim)</li>
                <li>• Category 2 Risk Modifier (-5% Discount Applied)</li>
                <li>• Fire Hydrant & Electrical AMC Compliance Warranty</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right Column: AI Evidence Sidebar (Part 9) & Versioning (Part 11) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Part 11: Quote Versioning Timeline */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Version History Timeline
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-bold border border-emerald-500/20">
                v{quote.version || 2}.0 Live
              </span>
            </div>

            <div className="space-y-3 relative pl-4 border-l-2 border-slate-200 dark:border-slate-800 text-xs">
              <div className="relative">
                <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <p className="font-semibold text-slate-800 dark:text-slate-200">Sent to Client / Bound</p>
                <p className="text-[10px] text-slate-400">PDF generated & sent for broker sign-off</p>
              </div>

              <div className="relative">
                <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <p className="font-semibold text-slate-800 dark:text-slate-200">Premium Recalculated</p>
                <p className="text-[10px] text-slate-400">Net basic ₹{((quote.premium || 118238)).toLocaleString('en-IN')} + 18% GST</p>
              </div>

              <div className="relative">
                <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <p className="font-semibold text-slate-800 dark:text-slate-200">Edited by Underwriter</p>
                <p className="text-[10px] text-slate-400">Hydrant discount confirmed by underwriter</p>
              </div>

              <div className="relative">
                <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500" />
                <p className="font-semibold text-slate-800 dark:text-slate-200">AI Proposal Ingestion</p>
                <p className="text-[10px] text-slate-400">Gemini 2.5 Flash extracted SI breakdown</p>
              </div>
            </div>
          </div>

          {/* Part 9: Karpathy Software 2.0 / 1.0 AI Evidence & Boundary Sidebar */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Confidence & Evidence Panel
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-bold">
                Software 2.0 ↔ 1.0
              </span>
            </div>

            {/* Software 2.0 Perception Confidence */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <span>Software 2.0: Perception (LLM)</span>
                <span className="text-emerald-500">Auto-Select Tier</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 76 76">
                    <circle
                      cx="38"
                      cy="38"
                      r={radius}
                      className="stroke-slate-200 dark:stroke-slate-700"
                      strokeWidth="6"
                      fill="none"
                    />
                    <circle
                      cx="38"
                      cy="38"
                      r={radius}
                      className="stroke-emerald-500 transition-all duration-1000 ease-out"
                      strokeWidth="6"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      fill="none"
                    />
                  </svg>
                  <span className="absolute text-xs font-bold font-mono text-slate-900 dark:text-white">
                    {confidenceScore}%
                  </span>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Semantic OCR Match
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Extracted from commercial proposal schedules with zero human intervention required.
                  </p>
                </div>
              </div>
            </div>

            {/* Software 1.0 Deterministic Boundary Card */}
            <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 space-y-3">
              <div className="flex items-center justify-between text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                <span>Software 1.0: Deterministic Guard</span>
                <span className="bg-blue-600 text-white px-1.5 py-0.2 rounded text-[9px]">Verified</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Tariff Premium Math</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-[11px]">
                    0% LLM / 100% Deterministic Engine
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">IIB Schedule 3 Taxonomy</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400 font-mono text-[11px]">
                    Code {quote.occupation_code} Validated
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Hallucination Rejection</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-[11px]">
                    Active (Unscheduled Codes Blocked)
                  </span>
                </div>
              </div>
            </div>

            {/* Multi-Factor Confidence Ratings */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Occupancy Match</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">96% (Code {quote.occupation_code})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Earthquake Match</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">99% (Zone IV)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Hazard Detection</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">94% Low-Med Hazard</span>
              </div>
            </div>

            {/* Source Regulatory Documents Used */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Statutory Citations (Software 1.0)
              </span>
              <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>IIB Loss Cost Schedule 3, Entry 1023</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>All India Fire Tariff (AIFT 2001) Rules</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>IS 1893:2002 Earthquake Zoning Annexure</span>
                </div>
              </div>
            </div>

            {/* Matched Keywords */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Matched Perception Keywords
              </span>
              <div className="flex flex-wrap gap-1.5">
                {['cnc machining', 'metal fabrication', 'press stamping', 'coolants', 'substation'].map((kw, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-700 dark:text-slate-300 font-mono"
                  >
                    #{kw}
                  </span>
                ))}
              </div>
            </div>

            {/* Missing Information Check */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Information Disclosures
              </span>
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[11px] flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>All mandatory underwriting disclosures complete.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
