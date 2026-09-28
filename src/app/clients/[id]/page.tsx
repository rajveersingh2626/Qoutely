'use client';

import React, { use, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Building,
  CheckCircle2,
  FilePlus,
  FileText,
  MapPin,
  Shield,
  Upload,
  User,
  Calendar,
  AlertTriangle,
  History,
  Activity,
  Download,
  FileCheck,
  Clock
} from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { Header } from '@/components/layout/Header';
import { formatINR } from '@/lib/calculator';

export default function ClientProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const { clients, quotes, currentWorkspace } = useWorkspace();
  const [activeTab, setActiveTab] = useState<'quotes' | 'claims' | 'docs' | 'activity'>('quotes');

  const client =
    clients.find((c) => c.id === unwrappedParams.id) || clients[0];

  const clientQuotes = quotes.filter(
    (q) => q.client_name === client?.client_name || q.client_id === client?.id
  );

  if (!client) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <div>
          <p className="text-sm font-semibold text-slate-700">Client profile not found.</p>
          <Link href="/app/clients" className="text-xs text-emerald-600 underline mt-2 block">
            Return to clients CRM
          </Link>
        </div>
      </div>
    );
  }

  const previousPolicies = [
    {
      policyNo: 'OG-24-1102-1801-00042',
      insurer: 'ICICI Lombard GIC',
      period: '2025 - 2026 (Expiring)',
      sumInsured: 53800000,
      premium: 139520,
      claims: 'Nil (0%)'
    },
    {
      policyNo: '110200/11/2023/4521',
      insurer: 'New India Assurance',
      period: '2024 - 2025',
      sumInsured: 48000000,
      premium: 124800,
      claims: 'Settled ₹42,000 (Storm)'
    }
  ];

  const claimsHistory = [
    {
      claimNo: 'CLM-2024-0081',
      date: '18 Aug 2024',
      peril: 'STFI (Water Ingress during Monsoon)',
      amountClaimed: 65000,
      amountSettled: 42000,
      status: 'Settled & Closed',
      surveyor: 'M/s Sharma & Associates'
    }
  ];

  const uploadedDocs = [
    { name: 'Proposal_Form_Krishna_Signed.pdf', size: '2.4 MB', date: 'Yesterday', type: 'PDF' },
    { name: 'Fire_NOC_Gurugram_FireDept.pdf', size: '1.1 MB', date: '12 Jan 2026', type: 'PDF' },
    { name: 'Substation_AMC_Certificate_2026.pdf', size: '840 KB', date: '04 Feb 2026', type: 'PDF' },
    { name: 'BalanceSheet_FY25_PlantAssets.xlsx', size: '3.6 MB', date: '18 Feb 2026', type: 'Excel' }
  ];

  const activities = [
    { user: 'Sneha Verma', action: 'Uploaded Fire NOC & electrical test audit report', time: 'Yesterday at 4:15 PM' },
    { user: 'Arjun Kapoor', action: 'Approved draft quote slip (₹5.38 Cr) with Category 2 discount', time: 'Yesterday at 5:30 PM' },
    { user: 'Rajesh Singhania', action: 'Sent proposal PDF to ICICI Lombard underwriter', time: 'Today at 10:12 AM' }
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 dark:bg-slate-950 font-sans">
      <Header
        title={`Client CRM • ${client.client_name}`}
        subtitle={`Account File • GSTIN: ${client.gst}`}
        breadcrumbs={[
          { label: 'Clients', href: '/app/clients' },
          { label: client.client_name },
        ]}
      />

      <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Client Header Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white font-bold text-xl flex items-center justify-center shadow-md shadow-emerald-600/20">
              {client.client_name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                  {client.client_name}
                </h1>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Verified Insured
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                GSTIN: {client.gst} • Industry: {client.industry}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{client.address} • {client.district}, {client.state}</span>
              </div>
            </div>
          </div>

          <Link
            href="/app/quotes/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <FilePlus className="w-4 h-4" />
            <span>Generate New Quote</span>
          </Link>
        </div>

        {/* 2-Column Info & History Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Account Details, Assigned Broker, Renewal Alerts */}
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800">
                Brokerage Account Details
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Assigned Sales Executive</span>
                  <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    <User className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Sneha Verma (Senior Broker Lead)</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Policy Renewal Date</span>
                  <div className="flex items-center gap-2 font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>14 October 2026 (Due in 42 Days)</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Risk Profile Rating</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    Low Hazard (Category 2 • Class A Construction)
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Underwriter Notes</span>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed mt-0.5 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                    {client.notes || 'Facility operates high-precision milling and stamping machinery. Fire hydrant network inspected and active. No heavy solvent bulk storage on ground level.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Previous Policies */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800">
                Previous Insurance Policies
              </h3>
              <div className="space-y-2">
                {previousPolicies.map((p, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs">
                    <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                      <span>{p.insurer}</span>
                      <span className="text-emerald-600 font-mono">₹{(p.sumInsured / 10000000).toFixed(2)} Cr</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{p.policyNo}</div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                      <span>Period: {p.period}</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Claims: {p.claims}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Tabbed Views (Quotes, Claims Timeline, Uploaded Docs, Activity Feed) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
              {/* Tab Selector */}
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
                {[
                  { id: 'quotes', label: `Quotes (${clientQuotes.length})`, icon: FileText },
                  { id: 'claims', label: 'Claims Timeline', icon: AlertTriangle },
                  { id: 'docs', label: `Documents (${uploadedDocs.length})`, icon: Upload },
                  { id: 'activity', label: 'Activity Feed', icon: Activity }
                ].map(t => {
                  const Icon = t.icon;
                  const isActive = activeTab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id as any)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {t.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab 1: Quotes Timeline */}
              {activeTab === 'quotes' && (
                <div className="space-y-3">
                  {clientQuotes.map(q => (
                    <div key={q.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Link href={`/app/quotes/${q.id}`} className="font-bold text-xs text-slate-900 dark:text-white hover:text-emerald-500">
                            {q.quote_number}
                          </Link>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold">
                            {q.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Occ Code {q.occupation_code} • Sum Insured {formatINR(q.sum_insured)} • Rate {q.policy_rate || 2.128}‰
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                          {formatINR(q.total_premium)}
                        </span>
                        <Link href={`/app/quotes/${q.id}`} className="text-[10px] text-slate-400 hover:underline block mt-0.5">
                          Open Slip &rarr;
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 2: Claims Timeline */}
              {activeTab === 'claims' && (
                <div className="space-y-4">
                  {claimsHistory.map((c, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white font-mono">{c.claimNo}</span>
                        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                          {c.status}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300">{c.peril}</p>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700">
                        <div>Claimed: ₹{c.amountClaimed.toLocaleString('en-IN')}</div>
                        <div>Settled: ₹{c.amountSettled.toLocaleString('en-IN')}</div>
                        <div>Surveyor: {c.surveyor}</div>
                        <div>Date: {c.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 3: Uploaded Documents */}
              {activeTab === 'docs' && (
                <div className="space-y-2.5">
                  {uploadedDocs.map((doc, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <FileCheck className="w-5 h-5 text-emerald-500" />
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">{doc.name}</div>
                          <div className="text-[10px] text-slate-400">{doc.type} • {doc.size} • Uploaded {doc.date}</div>
                        </div>
                      </div>
                      <button className="p-1.5 text-slate-400 hover:text-emerald-500">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 4: Activity Feed */}
              {activeTab === 'activity' && (
                <div className="space-y-3 text-xs">
                  {activities.map((act, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white">{act.user}: </span>
                        <span className="text-slate-600 dark:text-slate-300">{act.action}</span>
                        <p className="text-[10px] text-slate-400 mt-0.5">{act.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
