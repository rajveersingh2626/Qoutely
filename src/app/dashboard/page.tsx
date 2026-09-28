'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowUpRight,
  Building,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  Download,
  FilePlus,
  FileSpreadsheet,
  FileText,
  Flame,
  HardDrive,
  Plus,
  Server,
  Shield,
  Sparkles,
  TrendingUp,
  Upload,
  Users,
  Zap,
} from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { Header } from '@/components/layout/Header';
import { formatINR } from '@/lib/calculator';
import { downloadQuoteSlipPDF } from '@/lib/pdf-generator';

export default function DashboardPage() {
  const { quotes, clients, currentWorkspace, auditLogs, canGenerateQuotes } = useWorkspace();
  const [chartMode, setChartMode] = useState<'volume' | 'premium'>('volume');

  // KPIs
  const quotesCount = quotes.length;
  const activeClientsCount = clients.length;
  const pendingReviewsCount = quotes.filter((q) => q.status === 'under_review' || q.status === 'draft').length;
  const totalPremiumMonth = quotes.reduce((acc, q) => acc + (q.total_premium || 0), 0);

  // Monthly Quote trend data
  const monthlyData = [
    { month: 'Oct', count: 12, premium: 1420000 },
    { month: 'Nov', count: 18, premium: 2150000 },
    { month: 'Dec', count: 24, premium: 3840000 },
    { month: 'Jan', count: 29, premium: 4210000 },
    { month: 'Feb', count: 35, premium: 5120000 },
    { month: 'Mar', count: 42, premium: 6480000 },
  ];
  const maxMonthCount = 50;
  const maxMonthPremium = 7000000;

  // Occupancy breakdown
  const occupancyBreakdown = [
    { label: 'Storage & Godowns (4002)', count: 14, percent: 38, color: 'bg-emerald-500' },
    { label: 'Manufacturing & Plants (2044/2060)', count: 11, percent: 30, color: 'bg-indigo-500' },
    { label: 'Offices & Commercial (1007)', count: 7, percent: 19, color: 'bg-blue-500' },
    { label: 'Hospitality & Retail (1011/1017)', count: 5, percent: 13, color: 'bg-amber-500' },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 dark:bg-slate-950">
      <Header
        title="Underwriting Operations Dashboard"
        subtitle={`${currentWorkspace.name} • Licensed Direct Broker`}
        breadcrumbs={[{ label: 'Home' }, { label: 'Dashboard' }]}
      />

      <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-7">
        {/* Top Banner / Quick Action */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-900 via-slate-900 to-slate-950 text-white relative overflow-hidden shadow-sm">
          <div className="absolute right-0 top-0 w-96 h-full bg-emerald-500/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>IRDAI Bharat Sookshma & Laghu Tariff Rules Active</span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight">
                AI Underwriting Operating System
              </h2>
              <p className="text-xs text-slate-300 max-w-xl mt-1">
                Drop proposal PDFs or typed descriptions to automatically extract assets, match IIB Schedule 3 occupancies, and generate compliance-ready quotation slips.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-shrink-0">
              <Link
                href="/app/upload"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm transition-all"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Proposal</span>
              </Link>

              {canGenerateQuotes && (
                <Link
                  href="/app/quotes/new"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/30 transition-all hover:scale-105"
                >
                  <FilePlus className="w-4 h-4 text-slate-950" />
                  <span>New Underwrite (3-Col)</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* 4 Core KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-card card-hover">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
              <span className="text-xs font-semibold">Quotes Generated</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {quotesCount}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="w-3.5 h-3.5" />
                +18.4%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Across 289 scheduled tariffs</p>
          </div>

          {/* Card 2 */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-card card-hover">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
              <span className="text-xs font-semibold">Active Clients</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Building className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {activeClientsCount}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                <Users className="w-3.5 h-3.5" />
                Verified GSTIN
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Commercial corporate accounts</p>
          </div>

          {/* Card 3 */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-card card-hover">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
              <span className="text-xs font-semibold">Pending Reviews</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {pendingReviewsCount}
              </span>
              <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                Requires Sign-off
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Underwriter queue</p>
          </div>

          {/* Card 4 */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-card card-hover">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
              <span className="text-xs font-semibold">Total Premium (Current Month)</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatINR(totalPremiumMonth || 211810)}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="w-3.5 h-3.5" />
                +24% MoM
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Net underwritten risk premium</p>
          </div>
        </div>

        {/* Part 4 New Widgets: Observability & Telemetry Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. AI Usage Widget */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">AI Engine (Today)</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">18 req • $0.002</span>
              </div>
            </div>
            <Link href="/app/settings/ai" className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
              Logs &rarr;
            </Link>
          </div>

          {/* 2. API Usage Widget */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">API Health</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">310ms • 99.98%</span>
              </div>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          {/* 3. Storage Usage Widget */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">S3 / Doc Storage</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">12.4 MB / 10 GB</span>
              </div>
            </div>
            <span className="text-[10px] font-mono text-slate-400">14 files</span>
          </div>

          {/* 4. Quote Accuracy Widget */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Quote Accuracy</span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">98.4% Match</span>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-slate-400">IIB RAG</span>
          </div>
        </div>

        {/* Charts & Breakdown Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Quotes Volume or Premium Value Bar Chart */}
          <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {chartMode === 'volume' ? 'Monthly Quote Generation Volume' : 'Monthly Premium Value (INR)'}
                </h3>
                <p className="text-xs text-slate-500">Commercial Fire & Allied Perils Policies</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 flex text-xs">
                  <button
                    onClick={() => setChartMode('volume')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                      chartMode === 'volume'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Volume
                  </button>
                  <button
                    onClick={() => setChartMode('premium')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                      chartMode === 'premium'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Premium (₹)
                  </button>
                </div>
              </div>
            </div>

            <div className="h-52 flex items-end justify-between gap-4 pt-4 px-2">
              {monthlyData.map((d, i) => {
                const heightPercent = chartMode === 'volume'
                  ? Math.round((d.count / maxMonthCount) * 100)
                  : Math.round((d.premium / maxMonthPremium) * 100);

                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      {chartMode === 'volume' ? `${d.count} quotes` : `₹${(d.premium / 100000).toFixed(1)}L`}
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-xl h-36 flex items-end overflow-hidden p-1">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full rounded-t-lg bg-gradient-to-t from-emerald-600 to-emerald-400 group-hover:from-emerald-500 group-hover:to-emerald-300 transition-all duration-300"
                      />
                    </div>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      {d.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Occupancy Category Breakdown */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Occupancy Portfolio
                </h3>
                <Flame className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-xs text-slate-500 mb-6">
                Distribution across Indian Fire Tariff categories
              </p>

              <div className="space-y-4">
                {occupancyBreakdown.map((item, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                        {item.label}
                      </span>
                      <span className="font-mono font-semibold text-slate-900 dark:text-white">
                        {item.percent}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.color}`}
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
              <Link
                href="/app/occupancies"
                className="w-full py-2 flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
              >
                <span>Browse all 289 Tariff Occupancies</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Lower Grid: Recent Quotes & Activity Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Quotes Table */}
          <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-card">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Recent Quotation Slips
                </h3>
                <p className="text-xs text-slate-500">Live workspace policies</p>
              </div>
              <Link
                href="/app/quotes"
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                View all ({quotes.length})
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase text-[10px] font-semibold">
                    <th className="pb-3">Client & Ref</th>
                    <th className="pb-3">Risk Code</th>
                    <th className="pb-3">Sum Insured</th>
                    <th className="pb-3">Total Premium</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {quotes.slice(0, 5).map((q) => (
                    <tr
                      key={q.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 pr-2">
                        <Link
                          href={`/app/quotes/${q.id}`}
                          className="font-bold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400"
                        >
                          {q.client_name}
                        </Link>
                        <p className="text-[10px] text-slate-400 font-mono">{q.quote_number}</p>
                      </td>
                      <td className="py-3">
                        <span className="font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {q.occupation_code}
                        </span>
                      </td>
                      <td className="py-3 font-medium text-slate-700 dark:text-slate-300">
                        {formatINR(q.sum_insured)}
                      </td>
                      <td className="py-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatINR(q.total_premium)}
                      </td>
                      <td className="py-3">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            q.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {q.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => downloadQuoteSlipPDF(q, currentWorkspace)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Download Quote Slip PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Activity</h3>
                <Activity className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-xs text-slate-500 mb-6">Audit trail for {currentWorkspace.name}</p>

              <div className="space-y-4">
                {auditLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="flex items-start gap-3 text-xs">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{log.action}</p>
                      <p className="text-[11px] text-slate-400">
                        {log.user_name} • {log.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
              <Link
                href="/app/audit-logs"
                className="w-full py-2 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                <span>View Full Immutable Audit Log</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
