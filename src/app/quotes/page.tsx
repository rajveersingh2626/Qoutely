'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Plus,
  Building,
  FileText,
  Download,
  Eye,
  Trash2,
  Copy,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Shield,
  ArrowUpDown,
  Filter,
  X,
  ExternalLink,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { Header } from '@/components/layout/Header';
import { formatINR, formatNumberINR, formatINRWithDecimals } from '@/lib/calculator';
import { downloadQuoteSlipPDF } from '@/lib/pdf-generator';
import { Quote } from '@/types/database';

export default function QuotesDashboardPage() {
  const { quotes, currentWorkspace, deleteQuote } = useWorkspace();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedQuoteForModal, setSelectedQuoteForModal] = useState<Quote | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filtered quotes based on search query and status filter
  const filteredQuotes = quotes.filter((q) => {
    const matchesSearch =
      q.client_name.toLowerCase().includes(search.toLowerCase()) ||
      q.quote_number.toLowerCase().includes(search.toLowerCase()) ||
      q.occupation_code.includes(search) ||
      q.occupation_description.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate high-level summary KPIs
  const totalSumInsured = filteredQuotes.reduce((acc, q) => acc + (q.sum_insured || 0), 0);
  const totalPremiumValue = filteredQuotes.reduce((acc, q) => acc + (q.total_premium || 0), 0);

  const handleCopyQuoteRef = (quoteNumber: string) => {
    navigator.clipboard.writeText(quoteNumber);
    setCopiedId(quoteNumber);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadSlip = (quote: Quote) => {
    downloadQuoteSlipPDF(quote, currentWorkspace);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 dark:bg-slate-950 font-sans">
      <Header
        title="Quotes Register & Policy Ledger"
        subtitle={`Audit-ready commercial quotation register for ${currentWorkspace.name}`}
        breadcrumbs={[
          { label: 'Home', href: '/app/dashboard' },
          { label: 'Quotes Register' },
        ]}
      />

      <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* KPI Metric Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-[20px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-card">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Total Active Quotes
            </span>
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
              {filteredQuotes.length} <span className="text-xs font-normal text-slate-400">policies</span>
            </div>
            <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>IRDAI compliant underwriting ledger</span>
            </p>
          </div>

          <div className="p-5 rounded-[20px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-card">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Total Sum Insured Underwritten
            </span>
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
              {formatINR(totalSumInsured)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Across commercial, industrial & godown risks</p>
          </div>

          <div className="p-5 rounded-[20px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-card">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Cumulative Gross Premium
            </span>
            <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono">
              {formatINR(totalPremiumValue)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Includes 18% Central & State GST</p>
          </div>
        </div>

        {/* Action & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-1 items-center gap-2.5 max-w-lg">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                placeholder="Search by client, occupancy code (e.g. 1023), or quote ref..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
            >
              <option value="all">All Statuses</option>
              <option value="approved">Approved</option>
              <option value="draft">Draft</option>
              <option value="under_review">Under Review</option>
              <option value="issued">Issued</option>
            </select>
          </div>

          <Link
            href="/app/quotes/new"
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold shadow-emerald shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <Plus className="w-4 h-4" />
            <span>New Underwrite Workspace</span>
          </Link>
        </div>

        {/* Historical Quotes Data Table */}
        <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-200/80 dark:border-slate-800 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-800/40 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Client</th>
                  <th className="py-3.5 px-4 font-bold">Occupancy</th>
                  <th className="py-3.5 px-4 font-bold">Sum Insured</th>
                  <th className="py-3.5 px-4 font-bold">Total Premium</th>
                  <th className="py-3.5 px-4 font-bold">Date</th>
                  <th className="py-3.5 px-4 font-bold">Status</th>
                  <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredQuotes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                        No quotes found matching your search.
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Try adjusting filters or create a new quote using the workspace.
                      </p>
                      <Link
                        href="/app/quotes/new"
                        className="inline-flex items-center gap-1.5 mt-4 px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create New Quote</span>
                      </Link>
                    </td>
                  </tr>
                ) : (
                  filteredQuotes.map((q) => {
                    const quoteDate = new Date(q.created_at).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    });

                    return (
                      <tr
                        key={q.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors group"
                      >
                        {/* 1. Client Column */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-xs flex-shrink-0">
                              {q.client_name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 dark:text-white block group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                {q.client_name}
                              </span>
                              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-mono">
                                <span>GST: {q.client_gst || '27AAACA1234A1Z5'}</span>
                                <span>•</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyQuoteRef(q.quote_number)}
                                  className="hover:text-slate-700 dark:hover:text-slate-200"
                                  title="Copy Quote Number"
                                >
                                  {copiedId === q.quote_number ? 'Copied!' : q.quote_number}
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Occupancy Column */}
                        <td className="py-4 px-4 max-w-[240px]">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="font-mono font-bold px-1.5 py-0.5 rounded text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-900">
                              {q.occupation_code}
                            </span>
                            {q.ai_confidence && (
                              <span className="text-[10px] font-mono font-semibold text-emerald-600">
                                {Math.round(q.ai_confidence * 100)}% AI Match
                              </span>
                            )}
                          </div>
                          <span
                            className="text-xs text-slate-600 dark:text-slate-300 block truncate"
                            title={q.occupation_description}
                          >
                            {q.occupation_description}
                          </span>
                        </td>

                        {/* 3. Sum Insured Column */}
                        <td className="py-4 px-4 font-mono font-bold text-slate-900 dark:text-white">
                          <div>₹ {formatNumberINR(q.sum_insured)}</div>
                          <span className="text-[10px] font-normal text-slate-400 font-sans">
                            {formatINR(q.sum_insured)}
                          </span>
                        </td>

                        {/* 4. Total Premium Column */}
                        <td className="py-4 px-4 font-mono">
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {formatINRWithDecimals(q.total_premium)}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            Net: {formatINR(q.premium)} + GST
                          </span>
                        </td>

                        {/* 5. Date Column */}
                        <td className="py-4 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                          {quoteDate}
                        </td>

                        {/* Status Column */}
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                              q.status === 'approved'
                                ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : q.status === 'issued'
                                ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {q.status.replace('_', ' ')}
                          </span>
                        </td>

                        {/* Actions Column */}
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedQuoteForModal(q)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="View Quote Slip"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDownloadSlip(q)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors"
                              title="Download PDF"
                            >
                              <Download className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => deleteQuote(q.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                              title="Delete Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="p-4 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {filteredQuotes.length} of {quotes.length} total quotes
            </span>
            <span className="font-mono text-[11px]">
              Workspace: {currentWorkspace.name}
            </span>
          </div>
        </div>
      </div>

      {/* ====================================================================== */}
      {/* QUOTE SLIP MODAL */}
      {/* ====================================================================== */}
      {selectedQuoteForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[20px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Quote Slip • {selectedQuoteForModal.quote_number}</h3>
                  <p className="text-[10px] text-slate-300 font-mono">
                    Client: {selectedQuoteForModal.client_name}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedQuoteForModal(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Slip Content */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Brokerage Firm
                  </span>
                  <p className="font-bold text-slate-900 dark:text-white">{currentWorkspace.name}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{currentWorkspace.address}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Underwriting Date
                  </span>
                  <p className="font-mono font-bold text-slate-900 dark:text-white">
                    {new Date(selectedQuoteForModal.created_at).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                    Status: {selectedQuoteForModal.status.toUpperCase()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Insured Client
                  </span>
                  <p className="font-bold text-slate-900 dark:text-white">
                    {selectedQuoteForModal.client_name}
                  </p>
                  <p className="font-mono text-slate-500 mt-0.5">
                    GSTIN: {selectedQuoteForModal.client_gst}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Risk Occupancy
                  </span>
                  <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs">
                    Code: {selectedQuoteForModal.occupation_code}
                  </span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-1 line-clamp-1">
                    {selectedQuoteForModal.occupation_description}
                  </p>
                </div>
              </div>

              {/* Breakdown Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-500">
                    <tr>
                      <th className="p-3">Financial Parameter</th>
                      <th className="p-3 text-right">Value (INR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                    <tr>
                      <td className="p-3 font-sans">Total Sum Insured</td>
                      <td className="p-3 text-right font-bold text-slate-900 dark:text-white">
                        ₹ {formatNumberINR(selectedQuoteForModal.sum_insured)}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-sans">Net Premium (Excluding Taxes)</td>
                      <td className="p-3 text-right text-slate-900 dark:text-white">
                        {formatINRWithDecimals(selectedQuoteForModal.premium)}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-sans">Central & State GST (18%)</td>
                      <td className="p-3 text-right text-slate-900 dark:text-white">
                        {formatINRWithDecimals(selectedQuoteForModal.gst_amount)}
                      </td>
                    </tr>
                    <tr className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold">
                      <td className="p-3 font-sans text-xs">Total Final Payable Premium</td>
                      <td className="p-3 text-right text-sm">
                        {formatINRWithDecimals(selectedQuoteForModal.total_premium)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => handleDownloadSlip(selectedQuoteForModal)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedQuoteForModal(null)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-emerald transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
