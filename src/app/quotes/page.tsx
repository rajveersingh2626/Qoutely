'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpDown,
  Building,
  CheckCircle2,
  Copy,
  Download,
  Eye,
  FilePlus,
  FileText,
  Filter,
  Flame,
  History,
  MoreVertical,
  Plus,
  Search,
  Shield,
  X,
} from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { Header } from '@/components/layout/Header';
import { formatINR } from '@/lib/calculator';
import { downloadQuoteSlipPDF } from '@/lib/pdf-generator';
import { Quote } from '@/types/database';

export default function QuoteHistoryPage() {
  const { quotes, currentWorkspace, duplicateQuote } = useWorkspace();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedQuoteForDrawer, setSelectedQuoteForDrawer] = useState<Quote | null>(null);

  const filteredQuotes = quotes.filter((q) => {
    const matchesSearch =
      q.client_name.toLowerCase().includes(search.toLowerCase()) ||
      q.quote_number.toLowerCase().includes(search.toLowerCase()) ||
      q.occupation_code.includes(search);

    const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 dark:bg-slate-950">
      <Header
        title="Quotation Register & History"
        subtitle={`Audit-ready policy ledger for ${currentWorkspace.name}`}
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Quote History' }]}
      />

      <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-1 items-center gap-2 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by client, quote ref, or code (e.g. 4002)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="issued">Issued</option>
            </select>
          </div>

          <Link
            href="/quotes/new"
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-emerald shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Generate New Quote</span>
          </Link>
        </div>

        {/* Quotes Table */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-800/40 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="p-4">Quote Number</th>
                  <th className="p-4">Client Name</th>
                  <th className="p-4">Risk / Code</th>
                  <th className="p-4">EQ Zone</th>
                  <th className="p-4">Sum Insured</th>
                  <th className="p-4">Total Premium</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">AI Score</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredQuotes.map((q) => (
                  <tr
                    key={q.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="p-4 font-mono font-bold text-slate-900 dark:text-white">
                      <Link
                        href={`/quotes/${q.id}`}
                        className="hover:text-emerald-600 dark:hover:text-emerald-400"
                      >
                        {q.quote_number}
                      </Link>
                      <p className="text-[10px] text-slate-400 font-sans font-normal">
                        v{q.version || 1} * {new Date(q.created_at).toLocaleDateString()}
                      </p>
                    </td>

                    <td className="p-4">
                      <span className="font-semibold text-slate-900 dark:text-white block">
                        {q.client_name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        GST: {q.client_gst || '07ALMPA9603N1ZS'}
                      </span>
                    </td>

                    <td className="p-4">
                      <span className="font-mono font-semibold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                        {q.occupation_code}
                      </span>
                      <span className="text-[10px] text-slate-500 block truncate max-w-[180px] mt-0.5">
                        {q.occupation_description}
                      </span>
                    </td>

                    <td className="p-4 text-slate-600 dark:text-slate-400 font-medium">
                      {q.eq_zone}
                    </td>

                    <td className="p-4 font-mono font-medium text-slate-700 dark:text-slate-300">
                      {formatINR(q.sum_insured)}
                    </td>

                    <td className="p-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatINR(q.total_premium)}
                    </td>

                    <td className="p-4">
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

                    <td className="p-4">
                      <span className="text-[11px] font-mono font-bold text-emerald-600">
                        {Math.round((q.ai_confidence || 0.9) * 100)}%
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedQuoteForDrawer(q)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Quick Drawer Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => duplicateQuote(q.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Duplicate Quote"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => downloadQuoteSlipPDF(q, currentWorkspace)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Download Quote Slip PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* QUICK PREVIEW DRAWER */}
      {selectedQuoteForDrawer && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between animate-in slide-in-from-right">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-emerald-600 uppercase">
                  {selectedQuoteForDrawer.quote_number}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {selectedQuoteForDrawer.client_name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedQuoteForDrawer(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block">
                    Total Premium (GST @ 18%)
                  </span>
                  <span className="text-xl font-bold font-mono text-emerald-800 dark:text-emerald-200">
                    {formatINR(selectedQuoteForDrawer.total_premium)}
                  </span>
                </div>
                <span className="text-xs font-mono font-semibold text-emerald-700 dark:text-emerald-300">
                  Rate: {selectedQuoteForDrawer.policy_rate}‰
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Risk Occupancy
                </span>
                <p className="font-semibold text-slate-900 dark:text-white">
                  Code {selectedQuoteForDrawer.occupation_code}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {selectedQuoteForDrawer.occupation_description}
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Sum Insured Breakdown
                </span>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Stocks:</span>
                    <span>{formatINR(selectedQuoteForDrawer.sum_insured_breakdown.stocks)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Building:</span>
                    <span>{formatINR(selectedQuoteForDrawer.sum_insured_breakdown.building)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-600 pt-1 border-t border-slate-200 dark:border-slate-700">
                    <span>Total:</span>
                    <span>{formatINR(selectedQuoteForDrawer.sum_insured)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Link
              href={`/quotes/${selectedQuoteForDrawer.id}`}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <span>Open Full Quote Slip</span>
            </Link>

            <button
              onClick={() => downloadQuoteSlipPDF(selectedQuoteForDrawer, currentWorkspace)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-emerald shadow-sm transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download Official PDF</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
