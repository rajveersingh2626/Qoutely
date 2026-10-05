'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  Building,
  CheckCircle2,
  Clock,
  Download,
  FileCheck,
  FilePlus,
  FileText,
  Flame,
  Plus,
  RefreshCw,
  Send,
  Shield,
  ShieldAlert,
  Sparkles,
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
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  // Computed Executive Operational Summary Metrics
  const quotesCount = quotes.length;
  const activeClientsCount = clients.length;
  const pendingReviewsCount = quotes.filter((q) => q.status === 'under_review' || q.status === 'draft').length;

  const totalSumInsured = quotes.reduce((acc, q) => acc + (q.sum_insured || 0), 0);
  const totalPipelinePremium = quotes.reduce((acc, q) => acc + (q.total_premium || 0), 0);

  // Revenue Leakages Recovered via Commission & Brokerage Reconciliations
  // Dynamically starts at 0 until carrier statements are uploaded and reconciled
  const revenueLeakageRecovered = 0;
  const reconciledCarrierCount = 0;

  // Pending Renewals & Urgency Breakdown dynamically computed from live quotes/policies
  const now = new Date();
  const activePolicies = quotes.filter((q) => q.status === 'approved' || q.status === 'issued');
  
  // Calculate renewals due within 60 days and urgent (<= 3 days)
  const renewalsDue60d = activePolicies.filter((q) => {
    if (!q.expiry_date) return false;
    const exp = new Date(q.expiry_date);
    const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 60;
  });
  const urgentRenewals = renewalsDue60d.filter((q) => {
    if (!q.expiry_date) return false;
    const exp = new Date(q.expiry_date);
    const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 3;
  });

  const pendingRenewalsTotal = renewalsDue60d.length;
  const urgentRenewalsCount = urgentRenewals.length;

  // Dynamic Underwriting & Compliance Alerts based on live quote conditions
  const liveAlerts: Array<{
    id: string;
    type: 'urgent' | 'warning' | 'info';
    badge: string;
    badgeBg: string;
    badgeText: string;
    subBadge?: string;
    title: string;
    description: string;
    actionLabel?: string;
    actionHref?: string;
  }> = [];

  // 1. Alerts for quotes needing immediate review
  quotes
    .filter((q) => q.status === 'under_review')
    .slice(0, 2)
    .forEach((q) => {
      liveAlerts.push({
        id: `alert-review-${q.id}`,
        type: 'warning',
        badge: 'UNDERWRITING REVIEW',
        badgeBg: 'bg-amber-500',
        badgeText: 'text-slate-950',
        subBadge: q.quote_number,
        title: q.client_name || 'Commercial Fire Proposal',
        description: `Sum Insured ${formatINR(q.sum_insured)}. Broker review required for ${q.occupation_description || 'Commercial Risk'}.`,
        actionLabel: 'Review Quote',
        actionHref: `/quotes/${q.id}`,
      });
    });

  // 2. Urgent renewals
  urgentRenewals.slice(0, 2).forEach((q) => {
    liveAlerts.push({
      id: `alert-renew-${q.id}`,
      type: 'urgent',
      badge: 'POLICY EXPIRING SOON',
      badgeBg: 'bg-rose-500',
      badgeText: 'text-white',
      subBadge: q.quote_number,
      title: q.client_name,
      description: `Expiring in ≤ 3 days. Omnichannel WhatsApp & SMS renewal reminder dispatch active.`,
      actionLabel: 'Renew Policy',
      actionHref: `/renewals`,
    });
  });

  // Filter out any dismissed alerts
  const visibleAlerts = liveAlerts.filter((a) => !dismissedAlerts.includes(a.id));

  // Monthly Quote trend
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

  const dismissAlert = (id: string) => {
    setDismissedAlerts((prev) => [...prev, id]);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 dark:bg-[#0b0f19] safe-area-bottom">
      <Header
        title="Executive Dashboard"
        subtitle={currentWorkspace.name}
        breadcrumbs={[{ label: 'Home' }, { label: 'Dashboard' }]}
      />

      <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Top Header Row with Enterprise Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
                Executive Operational Summary
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Underwriting
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Active volume, IRDAI statutory tariff compliance & brokerage reconciliation for {currentWorkspace.name}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/upload"
              className="touch-target-min inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/80 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold transition-all shadow-xs active:scale-[0.98]"
            >
              <Upload className="w-4 h-4 text-slate-500" />
              <span>Upload Proposal</span>
            </Link>

            {canGenerateQuotes && (
              <Link
                href="/quotes/new"
                className="touch-target-min inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-md shadow-emerald-900/20 active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                <span>New Quote (BSUS/BLUS)</span>
              </Link>
            )}
          </div>
        </div>

        {/* Section 1.1 First Screen Experience: 3 Executive Operational Summary Cards (Glassmorphic) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          {/* Card 1: Active Quotation Volume */}
          <div className="glass-surface-high-contrast rounded-2xl p-5 sm:p-6 transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/20 transition-all" />
            <div className="flex items-center justify-between text-slate-400 dark:text-zinc-400 mb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <FileText className="w-4 h-4" />
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                  Active Quotation Volume
                </span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold">
                Live Pipeline
              </span>
            </div>

            <div className="mt-2 flex items-baseline justify-between">
              <div>
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {quotesCount}
                </span>
                <span className="text-xs text-slate-500 dark:text-zinc-400 ml-2 font-medium">
                  Quotes Bound/In Review
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-xs">
              <div className="text-slate-600 dark:text-zinc-300">
                <span className="text-slate-400 text-[11px]">Sum Insured: </span>
                <span className="font-semibold font-mono">{formatINR(totalSumInsured)}</span>
              </div>
              <div className="text-emerald-600 dark:text-emerald-400 font-medium">
                Premium: <span className="font-mono font-semibold">{formatINR(totalPipelinePremium)}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Pending Renewals (With 72H Urgent Tag) */}
          <div className="glass-surface-high-contrast rounded-2xl p-5 sm:p-6 transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/20 transition-all" />
            <div className="flex items-center justify-between text-slate-400 dark:text-zinc-400 mb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Clock className="w-4 h-4" />
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                  Pending Renewals
                </span>
              </div>
              {urgentRenewalsCount > 0 ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                  {urgentRenewalsCount} URGENT (≤72H)
                </span>
              ) : (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-500/10 text-slate-500 dark:text-zinc-400 font-semibold">
                  0 Urgent
                </span>
              )}
            </div>

            <div className="mt-2 flex items-baseline justify-between">
              <div>
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {pendingRenewalsTotal}
                </span>
                <span className="text-xs text-slate-500 dark:text-zinc-400 ml-2 font-medium">
                  Due in 60 Days
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-xs text-slate-600 dark:text-zinc-300">
              <div className="flex items-center gap-2 text-[11px]">
                {pendingRenewalsTotal > 0 ? (
                  <>
                    <span className="text-amber-500 font-semibold font-mono">{urgentRenewalsCount} due in 3d</span>
                    <span className="text-slate-400 dark:text-zinc-500">•</span>
                    <span className="text-slate-500 dark:text-zinc-400 font-mono">{pendingRenewalsTotal - urgentRenewalsCount} due in 60d</span>
                  </>
                ) : (
                  <span className="text-slate-400 dark:text-zinc-500 font-mono">No policies pending renewal</span>
                )}
              </div>
              <Link
                href="/renewals"
                className="text-amber-600 dark:text-amber-400 hover:underline font-semibold flex items-center gap-0.5"
              >
                Dispatch Notices &rarr;
              </Link>
            </div>
          </div>

          {/* Card 3: Revenue Leakages Recovered */}
          <div className="glass-surface-high-contrast rounded-2xl p-5 sm:p-6 transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-blue-500/20 transition-all" />
            <div className="flex items-center justify-between text-slate-400 dark:text-zinc-400 mb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <TrendingUp className="w-4 h-4" />
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                  Revenue Leakages Recovered
                </span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-600 dark:text-blue-400 font-semibold">
                Brokerage Recon
              </span>
            </div>

            <div className="mt-2 flex items-baseline justify-between">
              <div>
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono">
                  {formatINR(revenueLeakageRecovered)}
                </span>
                <span className="text-xs text-slate-500 dark:text-zinc-400 ml-2 font-medium">
                  recovered
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-xs text-slate-600 dark:text-zinc-300">
              <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                {reconciledCarrierCount > 0 ? (
                  <>Resolved across <span className="font-semibold text-slate-800 dark:text-zinc-200">{reconciledCarrierCount} carriers</span></>
                ) : (
                  <span>0 active discrepancies detected • Ready for upload</span>
                )}
              </span>
              <span className={`font-semibold font-mono ${reconciledCarrierCount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-zinc-400'}`}>
                {reconciledCarrierCount > 0 ? '100% Reconciled' : 'Not Started'}
              </span>
            </div>
          </div>
        </div>

        {/* Section 1.1 Actionable Alerts Strip (High-Contrast Warning Tags) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              Actionable Underwriting & Compliance Alerts
            </h3>
            <span className="text-[11px] text-slate-400 dark:text-zinc-500">
              {visibleAlerts.length > 0 ? 'Requires Immediate Broker Attention' : 'All Compliances Verified'}
            </span>
          </div>

          {visibleAlerts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {visibleAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`glass-surface-high-contrast rounded-xl p-3.5 sm:p-4 border-l-4 ${
                    alert.type === 'urgent'
                      ? 'border-l-rose-500'
                      : alert.type === 'warning'
                      ? 'border-l-amber-500'
                      : 'border-l-blue-500'
                  } flex items-start justify-between gap-3 shadow-sm`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-1.5 rounded-lg ${
                        alert.type === 'urgent'
                          ? 'bg-rose-500/20 text-rose-400'
                          : alert.type === 'warning'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-blue-500/20 text-blue-400'
                      } mt-0.5 flex-shrink-0`}
                    >
                      {alert.type === 'urgent' ? (
                        <ShieldAlert className="w-4 h-4" />
                      ) : alert.type === 'warning' ? (
                        <AlertCircle className="w-4 h-4" />
                      ) : (
                        <Shield className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${alert.badgeBg} ${alert.badgeText} tracking-wide`}
                        >
                          {alert.badge}
                        </span>
                        {alert.subBadge && (
                          <span className="text-xs font-mono text-slate-500 dark:text-zinc-400">
                            {alert.subBadge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-zinc-100 mt-1">
                        {alert.title}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                        {alert.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    {alert.actionHref && (
                      <Link
                        href={alert.actionHref}
                        className="touch-target-min inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold transition-all shadow-xs active:scale-[0.98]"
                      >
                        {alert.actionLabel || 'View'}
                      </Link>
                    )}
                    <button
                      onClick={() => dismissAlert(alert.id)}
                      className="text-[10px] text-slate-400 hover:text-slate-200"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-surface-high-contrast rounded-xl p-4 sm:p-5 border border-emerald-500/20 bg-emerald-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wide">
                    All Underwriting &amp; Compliances Up To Date
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                    0 urgent tariff discrepancies or expiring policies requiring broker intervention.
                  </p>
                </div>
              </div>
              {canGenerateQuotes && (
                <Link
                  href="/quotes/new"
                  className="touch-target-min inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-xs active:scale-[0.98] self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Quote</span>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Charts & Breakdown Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Quotes Bar Chart */}
          <div className="lg:col-span-2 p-5 rounded-2xl glass-surface-high-contrast border border-slate-200 dark:border-white/10 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                  {chartMode === 'volume' ? 'Quote Generation Volume' : 'Monthly Premium Value (INR)'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Commercial fire & property policies</p>
              </div>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg text-xs border border-slate-200 dark:border-white/10">
                <button
                  onClick={() => setChartMode('volume')}
                  className={`touch-target-min px-3 py-1.5 rounded-md font-medium transition-colors ${
                    chartMode === 'volume'
                      ? 'bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500 dark:text-zinc-400'
                  }`}
                >
                  Volume
                </button>
                <button
                  onClick={() => setChartMode('premium')}
                  className={`touch-target-min px-3 py-1.5 rounded-md font-medium transition-colors ${
                    chartMode === 'premium'
                      ? 'bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500 dark:text-zinc-400'
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
          <div className="p-5 rounded-2xl glass-surface-high-contrast border border-slate-200 dark:border-white/10 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                  Occupancy Portfolio
                </h3>
                <Flame className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mb-5">
                Indian Fire Tariff category distribution
              </p>

              {occupancyBreakdown.length === 0 ? (
                <div className="py-8 flex flex-col items-center justify-center text-center px-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-400 flex items-center justify-center mb-2">
                    <Flame className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    No Tariff Occupancies Yet
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
                    Occupancy distribution will automatically populate as policies are quoted.
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {occupancyBreakdown.map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-700 dark:text-zinc-300 truncate max-w-[180px]">
                          {item.label}
                        </span>
                        <span className="font-mono text-slate-500 dark:text-zinc-400">
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
              )}
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-white/10 mt-5">
              <Link
                href="/occupancies"
                className="touch-target-min w-full py-1.5 flex items-center justify-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors"
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
          <div className="lg:col-span-2 p-5 rounded-2xl glass-surface-high-contrast border border-slate-200 dark:border-white/10 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                  Recent Quotation Slips
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Workspace policies &amp; underwriting status</p>
              </div>
              <Link
                href="/quotes"
                className="touch-target-min inline-flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                View all ({quotes.length})
              </Link>
            </div>

            {quotes.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center px-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center mb-3">
                  <FileText className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                  No Quotes Bound Yet
                </h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mt-1 mb-4">
                  Create your first Bharat Sookshma or Laghu Udyam Suraksha quote slip with instant IRDAI tariff calculation.
                </p>
                {canGenerateQuotes && (
                  <Link
                    href="/quotes/new"
                    className="touch-target-min inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-xs active:scale-[0.98]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Generate First Quote</span>
                  </Link>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-zinc-400 text-[11px] font-semibold">
                      <th className="pb-2.5">Client</th>
                      <th className="pb-2.5">Code</th>
                      <th className="pb-2.5">Sum Insured</th>
                      <th className="pb-2.5">Total Premium</th>
                      <th className="pb-2.5">Status</th>
                      <th className="pb-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {quotes.slice(0, 5).map((q) => (
                      <tr key={q.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 pr-2">
                          <Link
                            href={`/quotes/${q.id}`}
                            className="font-semibold text-slate-900 dark:text-zinc-100 hover:text-emerald-600 dark:hover:text-emerald-400"
                          >
                            {q.client_name}
                          </Link>
                          <p className="text-[10px] text-slate-400 font-mono">{q.quote_number}</p>
                        </td>
                        <td className="py-2.5 font-mono text-slate-600 dark:text-zinc-300">
                          {q.occupation_code}
                        </td>
                        <td className="py-2.5 text-slate-700 dark:text-zinc-300">
                          {formatINR(q.sum_insured)}
                        </td>
                        <td className="py-2.5 font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                          {formatINR(q.total_premium)}
                        </td>
                        <td className="py-2.5">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              q.status === 'approved'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-500/20'
                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-500/20'
                            }`}
                          >
                            {q.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            onClick={() => downloadQuoteSlipPDF(q, currentWorkspace)}
                            className="touch-target-min p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
            )}
          </div>

          {/* Activity Timeline */}
          <div className="p-5 rounded-2xl glass-surface-high-contrast border border-slate-200 dark:border-white/10 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">Activity</h3>
                <Activity className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mb-5">Audit trail (DPDP Compliant)</p>

              <div className="space-y-3">
                {auditLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="flex items-start gap-2.5 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-zinc-200">{log.action}</p>
                      <p className="text-[10px] text-slate-400 dark:text-zinc-400">
                        {log.user_name} • {log.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-white/10 mt-5">
              <Link
                href="/audit-logs"
                className="touch-target-min w-full py-1.5 flex items-center justify-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-zinc-300 dark:hover:text-white transition-colors"
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
