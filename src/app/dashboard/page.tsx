'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowUpRight,
  Building,
  Clock,
  Download,
  FilePlus,
  FileText,
  Flame,
  Plus,
  TrendingUp,
  Upload,
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

  // Monthly Quote trend
  const now = new Date();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const monthQuotes = quotes.filter((q) => {
      const qDate = new Date(q.created_at);
      return qDate.getFullYear() === d.getFullYear() && qDate.getMonth() === d.getMonth();
    });
    return {
      month: monthNames[d.getMonth()],
      count: monthQuotes.length,
      premium: monthQuotes.reduce((s, q) => s + (q.total_premium || 0), 0),
    };
  });
  const maxMonthCount = Math.max(...monthlyData.map((m) => m.count), 1);
  const maxMonthPremium = Math.max(...monthlyData.map((m) => m.premium), 1);

  // Occupancy breakdown
  const occupancyCounts: Record<string, number> = {};
  quotes.forEach((q) => {
    const key = q.occupation_description || 'Other';
    occupancyCounts[key] = (occupancyCounts[key] || 0) + 1;
  });
  const topOccupancies = Object.entries(occupancyCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  const occupancyColors = ['bg-emerald-500', 'bg-teal-500', 'bg-slate-400', 'bg-amber-500'];
  const occupancyBreakdown = topOccupancies.map(([label, count], i) => ({
    label,
    count,
    percent: quotes.length > 0 ? Math.round((count / quotes.length) * 100) : 0,
    color: occupancyColors[i] || 'bg-slate-400',
  }));

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 dark:bg-slate-950">
      <Header
        title="Dashboard"
        subtitle={currentWorkspace.name}
        breadcrumbs={[{ label: 'Home' }, { label: 'Dashboard' }]}
      />

      <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Top Header Row with Enterprise Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Underwriting Overview
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live quote slips and statutory tariff compliance for {currentWorkspace.name}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 text-xs font-medium transition-colors shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>Upload Proposal</span>
            </Link>

            {canGenerateQuotes && (
              <Link
                href="/quotes/new"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Quote</span>
              </Link>
            )}
          </div>
        </div>

        {/* 3 Core Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Quotes Generated</span>
              <FileText className="w-4 h-4 text-slate-400" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {quotesCount}
              </span>
              <span className="text-xs text-emerald-600 font-medium flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" />
                Active
              </span>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Active Clients</span>
              <Building className="w-4 h-4 text-slate-400" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {activeClientsCount}
              </span>
              <span className="text-xs text-slate-400">Verified</span>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Pending Reviews</span>
              <Clock className="w-4 h-4 text-slate-400" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {pendingReviewsCount}
              </span>
              <span className="text-xs text-amber-600 font-medium">Queue</span>
            </div>
          </div>
        </div>

        {/* Charts & Breakdown Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Quotes Bar Chart */}
          <div className="lg:col-span-2 p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  {chartMode === 'volume' ? 'Quote Generation Volume' : 'Monthly Premium Value (INR)'}
                </h3>
                <p className="text-xs text-slate-400">Commercial fire & property policies</p>
              </div>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
                <button
                  onClick={() => setChartMode('volume')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    chartMode === 'volume'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500'
                  }`}
                >
                  Volume
                </button>
                <button
                  onClick={() => setChartMode('premium')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    chartMode === 'premium'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500'
                  }`}
                >
                  Premium (₹)
                </button>
              </div>
            </div>

            <div className="h-48 flex items-end justify-between gap-3 pt-4 px-2">
              {monthlyData.map((d, i) => {
                const heightPercent =
                  chartMode === 'volume'
                    ? Math.round((d.count / maxMonthCount) * 100)
                    : Math.round((d.premium / maxMonthPremium) * 100);

                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      {chartMode === 'volume' ? `${d.count}` : `₹${(d.premium / 100000).toFixed(1)}L`}
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t h-32 flex items-end overflow-hidden">
                      <div
                        style={{ height: `${Math.max(heightPercent, 6)}%` }}
                        className="w-full rounded-t bg-emerald-600 hover:bg-emerald-500 transition-all duration-200"
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-500">
                      {d.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Occupancy Category Breakdown */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Occupancy Portfolio
                </h3>
                <Flame className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-xs text-slate-400 mb-5">
                Indian Fire Tariff category distribution
              </p>

              <div className="space-y-3.5">
                {occupancyBreakdown.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[180px]">
                        {item.label}
                      </span>
                      <span className="font-mono text-slate-500">
                        {item.percent}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.color}`}
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-5">
              <Link
                href="/occupancies"
                className="w-full py-1.5 flex items-center justify-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700"
              >
                <span>View All Tariff Occupancies</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Lower Grid: Recent Quotes & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Quotes Table */}
          <div className="lg:col-span-2 p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Recent Quotation Slips
                </h3>
                <p className="text-xs text-slate-400">Workspace policies</p>
              </div>
              <Link
                href="/quotes"
                className="text-xs font-medium text-emerald-600 hover:underline"
              >
                View all ({quotes.length})
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-[11px] font-medium">
                    <th className="pb-2.5">Client</th>
                    <th className="pb-2.5">Code</th>
                    <th className="pb-2.5">Sum Insured</th>
                    <th className="pb-2.5">Total Premium</th>
                    <th className="pb-2.5">Status</th>
                    <th className="pb-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {quotes.slice(0, 5).map((q) => (
                    <tr key={q.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 pr-2">
                        <Link
                          href={`/quotes/${q.id}`}
                          className="font-medium text-slate-900 dark:text-white hover:text-emerald-600"
                        >
                          {q.client_name}
                        </Link>
                        <p className="text-[10px] text-slate-400 font-mono">{q.quote_number}</p>
                      </td>
                      <td className="py-2.5 font-mono text-slate-600 dark:text-slate-300">
                        {q.occupation_code}
                      </td>
                      <td className="py-2.5 text-slate-700 dark:text-slate-300">
                        {formatINR(q.sum_insured)}
                      </td>
                      <td className="py-2.5 font-mono font-medium text-emerald-600 dark:text-emerald-400">
                        {formatINR(q.total_premium)}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                            q.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {q.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => downloadQuoteSlipPDF(q, currentWorkspace)}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                          title="Download Quote Slip PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Activity</h3>
                <Activity className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-xs text-slate-400 mb-5">Audit trail</p>

              <div className="space-y-3">
                {auditLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="flex items-start gap-2.5 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-slate-800 dark:text-slate-200">{log.action}</p>
                      <p className="text-[10px] text-slate-400">
                        {log.user_name} • {log.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-5">
              <Link
                href="/audit-logs"
                className="w-full py-1.5 flex items-center justify-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                <span>View Full Audit Log</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
