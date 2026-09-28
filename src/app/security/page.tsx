'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Lock, 
  Database, 
  Users, 
  FileText, 
  CheckCircle2, 
  Server, 
  ArrowLeft,
  KeyRound,
  EyeOff
} from 'lucide-react';

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Navigation */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-slate-950" />
            </div>
            <span className="font-bold text-lg text-white">Quotely Security & Trust</span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4">
            Enterprise Security Standard
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Security, Privacy & Sovereign Compliance
          </h1>
          <p className="text-slate-400 text-base sm:text-lg">
            Built from day one to protect commercial risk data, financial schedules, and corporate insurance filings.
          </p>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {/* 1. Workspace Isolation */}
          <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6 border border-emerald-500/20">
              <Database className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white mb-3">Multi-Tenant Workspace Isolation</h2>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Quotely implements rigorous multi-tenant data partitioning. Every database query, document upload, and quote generation is scoped by an immutable <code className="text-emerald-400 font-mono">workspace_id</code>.
            </p>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> PostgreSQL Row-Level Security (RLS) enforcement</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Cross-brokerage data leakage strictly impossible</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Distinct storage partitions for uploaded RFPs & schedules</li>
            </ul>
          </div>

          {/* 2. Encryption at Rest & In Transit */}
          <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-6 border border-teal-500/20">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white mb-3">End-to-End Encryption</h2>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              All financial schedules, client identity assets, and underwriting quote files are encrypted during storage and network transit.
            </p>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-400" /> AES-256 encryption at rest across all database clusters</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-400" /> TLS 1.3 enforced for all external network endpoints</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-400" /> Time-limited signed URLs for PDF quote downloads</li>
            </ul>
          </div>

          {/* 3. Role-Based Permissions (RBAC) */}
          <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-6 border border-indigo-500/20">
              <Users className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white mb-3">Granular Role-Based Permissions</h2>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Manage team access with 5 distinct enterprise roles, preventing unauthorized rate tampering or quote modifications.
            </p>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400" /> Owner, Admin, Underwriter, Sales, Viewer</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400" /> Sales cannot access unassigned client files</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400" /> Audit trail logged upon any permission change</li>
            </ul>
          </div>

          {/* 4. AI Privacy Statement */}
          <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-6 border border-blue-500/20">
              <EyeOff className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white mb-3">AI Privacy & Zero Retention</h2>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Your confidential client data is never used to train foundation models. All inferences pass through stateless enterprise API pipelines.
            </p>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-400" /> Zero customer data retention for model training</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-400" /> Isolated prompt execution with ephemeral contexts</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-400" /> Full observability over every token processed</li>
            </ul>
          </div>
        </div>

        {/* Indian Data Residency & IRDAI Compliance */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-2">Indian Sovereign Data Residency</h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                In strict adherence to IRDAI data governance mandates and the Digital Personal Data Protection (DPDP) Act, Quotely provisions database, cache, and object storage resources within sovereign Indian data center regions (Mumbai and Hyderabad).
              </p>
              <div className="flex flex-wrap gap-4 text-xs font-semibold text-emerald-400">
                <span className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">IRDAI Compliance Aligned</span>
                <span className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">DPDP Act Ready</span>
                <span className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">India Sovereign Cloud</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
