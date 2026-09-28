'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Copy,
  Cpu,
  FileCode,
  Flame,
  HelpCircle,
  Play,
  RefreshCw,
  Shield,
  Sparkles,
  Terminal,
} from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { Header } from '@/components/layout/Header';
import { analyzeProposalAI } from '@/lib/ai-engine';
import { AIAnalysisResult } from '@/types/database';

export default function AIAnalysisPage() {
  const [inputText, setInputText] = useState(
    `Client: Acme Industries Ltd\nLocation: Plot 101, Industrial Corridor Phase II, MIDC, Mumbai, Maharashtra 400093\nTrade: Precision CNC metal machining, tool stamping, component fabrication and parts assembly workshop. Electrical equipment tested and certified. Sum insured Rs. 5.38 Crores.`
  );
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult>(() =>
    analyzeProposalAI({
      business_name: 'Acme Industries Ltd',
      business_description: 'Precision CNC metal machining, tool stamping, component fabrication and parts assembly workshop.',
      raw_text: `Client: Acme Industries Ltd\nLocation: Plot 101, Industrial Corridor Phase II, MIDC, Mumbai, Maharashtra 400093\nTrade: Precision CNC metal machining, tool stamping, component fabrication and parts assembly workshop. Electrical equipment tested and certified. Sum insured Rs. 5.38 Crores.`,
      sum_insured: 53800000,
      stocks_si: 12800000,
      building_si: 15000000,
      pm_si: 26000000,
      gst: '27AAACA1234A1Z5',
    })
  );

  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleRunAnalysis = () => {
    setIsRunning(true);
    setTimeout(() => {
      const res = analyzeProposalAI({
        raw_text: inputText,
        business_description: inputText,
      });
      setAnalysisResult(res);
      setIsRunning(false);
    }, 400);
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(analysisResult, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 dark:bg-slate-950">
      <Header
        title="AI Underwriting Engine & Grounding Inspector"
        subtitle="Auditable JSON output grounded exclusively in AIFT 2001 and IIB Schedule 3"
        breadcrumbs={[
          { label: 'Underwriting', href: '/quotes/new' },
          { label: 'AI Engine' },
        ]}
      />

      <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Compliance Guarantees Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-card">
          <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">
            <Shield className="w-4 h-4" />
            <span>Deterministic Guardrails Enforcement</span>
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">
            AI Underwriting Behavioral Rules
          </h2>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            In compliance with insurance brokerage regulations, Quotely’s AI performs only extraction, classification, and hazard detection. It never calculates mathematical premiums and never invents tariff codes.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
              <span className="font-bold text-emerald-800 dark:text-emerald-300 block mb-1">
                Grounded Citations Only
              </span>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                Classifications must map to one of 289 scheduled IIB codes.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800">
              <span className="font-bold text-sky-800 dark:text-sky-300 block mb-1">
                Strict JSON Output
              </span>
              <p className="text-[11px] text-sky-700 dark:text-sky-400">
                Emits strictly formatted schema for downstream calculation pipelines.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
              <span className="font-bold text-blue-800 dark:text-blue-300 block mb-1">
                Zero Tariff Hallucination
              </span>
              <p className="text-[11px] text-blue-700 dark:text-blue-400">
                Warranties and rate tables are verified against AIFT 2001.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <span className="font-bold text-amber-800 dark:text-amber-300 block mb-1">
                Hazard & Missing Fields
              </span>
              <p className="text-[11px] text-amber-700 dark:text-amber-400">
                Surfaces regulatory gaps and unverified warranties for underwriters.
              </p>
            </div>
          </div>
        </div>

        {/* Interactive Testing Sandbox */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Input Text Console */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-card flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Proposal Input Text / RFQ
                  </span>
                </div>
                <button
                  onClick={() =>
                    setInputText(
                      `Client: Acme Industries Ltd\nLocation: Plot 101, Industrial Corridor Phase II, MIDC, Mumbai, Maharashtra 400093\nTrade: Precision CNC metal machining, tool stamping, component fabrication and parts assembly workshop. Electrical equipment tested and certified. Sum insured Rs. 5.38 Crores.`
                    )
                  }
                  className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Reset Acme Sample
                </button>
              </div>

              <textarea
                rows={12}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                placeholder="Paste proposal text, customer notes, or WhatsApp inquiry here..."
              />
            </div>

            <button
              onClick={handleRunAnalysis}
              disabled={isRunning}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {isRunning ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Execute Grounded Underwriting Classification</span>
                </>
              )}
            </button>
          </div>

          {/* Right: Structured JSON Output */}
          <div className="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-card flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white font-mono">
                    Structured Output Schema (JSON)
                  </span>
                </div>
                <button
                  onClick={handleCopyJSON}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
                </button>
              </div>

              <pre className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-x-auto max-h-[380px] overflow-y-auto leading-relaxed">
                {JSON.stringify(analysisResult, null, 2)}
              </pre>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>Candidates: {analysisResult.occupancy_candidates.length}</span>
              <span>Hazard Flags: {analysisResult.hazard_flags.length}</span>
              <span>Confidence: {Math.round(analysisResult.confidence_score * 100)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
