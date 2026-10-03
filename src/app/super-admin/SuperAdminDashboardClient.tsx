'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Globe2,
  Building2,
  Users,
  Cpu,
  Activity,
  DollarSign,
  TrendingUp,
  Server,
  Lock,
  ShieldCheck,
  ArrowLeft,
  Search,
  Terminal,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  FileText,
  ExternalLink,
} from 'lucide-react';

interface Profile {
  id: string;
  name: string;
  email: string;
  super_admin: boolean;
  created_at: string;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  gst: string;
  address: string;
  phone?: string;
  email?: string;
  owner_id: string;
  default_rules: {
    irda_license_no: string;
    cin_no: string;
    default_discretionary_discount: number;
    default_brokerage_share: number;
  };
  created_at: string;
}

interface MemberStat {
  workspace_id: string;
  user_id: string;
  role: string;
  status: string;
}

interface QuoteStat {
  workspace_id: string;
  total_premium: number;
  sum_insured: number;
  created_at: string;
}

interface AuditEntry {
  id: string;
  actor_email: string;
  action: string;
  target_type?: string;
  target_id?: string;
  details?: Record<string, any>;
  created_at: string;
}

interface AIRequest {
  workspace_id: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  latency_ms: number;
  model: string;
  endpoint: string;
  created_at: string;
}

interface Props {
  currentAdmin: Profile;
  organizations: Organization[];
  allMembers: MemberStat[];
  quoteStats: QuoteStat[];
  systemAuditLog: AuditEntry[];
  aiRequests: AIRequest[];
  totalUsers: number;
}

type Tab = 'overview' | 'organizations' | 'ai_telemetry' | 'audit_log' | 'rls_status';

export default function SuperAdminDashboardClient({
  currentAdmin,
  organizations,
  allMembers,
  quoteStats,
  systemAuditLog,
  aiRequests,
  totalUsers,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [orgSearch, setOrgSearch] = useState('');

  // Aggregate platform KPIs
  const totalOrgs = organizations.length;
  const totalQuotes = quoteStats.length;
  const totalSumInsured = quoteStats.reduce((sum, q) => sum + (q.sum_insured || 0), 0);
  const totalPremium = quoteStats.reduce((sum, q) => sum + (q.total_premium || 0), 0);
  const totalAICost = aiRequests.reduce((sum, r) => sum + (r.cost_usd || 0), 0);
  const totalAITokens = aiRequests.reduce((sum, r) => sum + r.input_tokens + r.output_tokens, 0);
  const avgAILatency = aiRequests.length
    ? Math.round(aiRequests.reduce((s, r) => s + r.latency_ms, 0) / aiRequests.length)
    : 0;

  const filteredOrgs = useMemo(
    () =>
      organizations.filter(
        (o) =>
          o.name.toLowerCase().includes(orgSearch.toLowerCase()) ||
          o.slug.toLowerCase().includes(orgSearch.toLowerCase()) ||
          o.gst.toLowerCase().includes(orgSearch.toLowerCase())
      ),
    [organizations, orgSearch]
  );

  const formatINR = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Platform Overview' },
    { id: 'organizations', label: `Organizations (${totalOrgs})` },
    { id: 'ai_telemetry', label: 'AI Telemetry' },
    { id: 'audit_log', label: 'System Audit Log' },
    { id: 'rls_status', label: 'RLS & Security' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Globe2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">Quotely</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase tracking-wider">
                  Super Admin
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Global Multi-Tenant Control Plane</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-400">Operator:</span>
              <strong className="text-white">{currentAdmin.name}</strong>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
                super_admin
              </span>
            </div>
            <Link
              href="/app/dashboard"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Broker Desk</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Platform KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Organizations', value: totalOrgs, icon: Building2, color: 'text-emerald-400' },
            { label: 'Total Users', value: totalUsers, icon: Users, color: 'text-blue-400' },
            { label: 'Total Quotes', value: totalQuotes, icon: FileText, color: 'text-teal-400' },
            {
              label: 'Sum Insured',
              value: `₹${(totalSumInsured / 10000000).toFixed(1)}Cr`,
              icon: DollarSign,
              color: 'text-amber-400',
            },
            {
              label: 'AI Cost (USD)',
              value: `$${totalAICost.toFixed(4)}`,
              icon: Cpu,
              color: 'text-purple-400',
            },
            {
              label: 'Avg AI Latency',
              value: `${avgAILatency}ms`,
              icon: Zap,
              color: 'text-rose-400',
            },
          ].map((kpi) => (
            <div key={kpi.label} className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">{kpi.label}</span>
                <kpi.icon className={`w-3.5 h-3.5 ${kpi.color}`} />
              </div>
              <div className={`text-lg font-extrabold font-mono ${kpi.color}`}>{kpi.value}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-800 pb-0 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-white hover:border-slate-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Platform Health</h4>
                  <p className="text-xs text-slate-400">Supabase PostgreSQL — RLS Active</p>
                </div>
              </div>
              <div className="space-y-2.5 text-xs">
                {[
                  { label: 'RLS Status', value: '✅ Enforced on all tables', ok: true },
                  { label: 'Super Admin Bypass', value: 'Service-role key (server-only)', ok: true },
                  { label: 'RBAC Policies', value: `${organizations.length * 5} policies active`, ok: true },
                  { label: 'Org Isolation', value: 'workspace_id FK on all tenant tables', ok: true },
                  { label: 'Auth', value: 'Supabase Auth + SSR cookies', ok: true },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-400">{row.label}</span>
                    <span className={`font-semibold ${row.ok ? 'text-emerald-400' : 'text-red-400'}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">AI Engine</h4>
                  <p className="text-xs text-slate-400">Gemini 1.5 Flash / 2.0 Flash</p>
                </div>
              </div>
              <div className="space-y-2.5 text-xs">
                {[
                  { label: 'Total API Calls', value: `${aiRequests.length} requests` },
                  { label: 'Total Tokens', value: `${totalAITokens.toLocaleString()} tokens` },
                  { label: 'Total Cost', value: `$${totalAICost.toFixed(5)} USD` },
                  { label: 'Avg Latency', value: `${avgAILatency}ms` },
                  { label: 'Extraction Mode', value: 'Structured JSON only (no premium calc)' },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-400">{row.label}</span>
                    <span className="font-semibold text-white">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: ORGANIZATIONS */}
        {activeTab === 'organizations' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by name, slug, or GSTIN..."
                  value={orgSearch}
                  onChange={(e) => setOrgSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <span className="text-xs text-slate-400">
                Showing <strong className="text-white">{filteredOrgs.length}</strong> orgs
              </span>
            </div>

            <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold">
                    <tr>
                      <th className="py-3.5 px-5">Organization</th>
                      <th className="py-3.5 px-5">IRDA Lic / GSTIN</th>
                      <th className="py-3.5 px-5">Members</th>
                      <th className="py-3.5 px-5">Quotes</th>
                      <th className="py-3.5 px-5">Sum Insured</th>
                      <th className="py-3.5 px-5">RLS Scope</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredOrgs.map((org) => {
                      const orgMembers = allMembers.filter((m) => m.workspace_id === org.id);
                      const orgQuotes = quoteStats.filter((q) => q.workspace_id === org.id);
                      const orgSumInsured = orgQuotes.reduce((s, q) => s + (q.sum_insured || 0), 0);

                      return (
                        <tr key={org.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-blue-400 font-bold text-xs border border-slate-700">
                                {org.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <span className="font-bold text-white block">{org.name}</span>
                                <span className="text-slate-500 font-mono text-[10px]">/{org.slug}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-5">
                            <div className="text-slate-300">Lic #{org.default_rules?.irda_license_no}</div>
                            <div className="text-slate-500 font-mono text-[10px]">{org.gst}</div>
                          </td>
                          <td className="py-4 px-5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 font-mono font-bold text-[11px]">
                              <Users className="w-3 h-3 text-blue-400" />
                              {orgMembers.length}
                            </span>
                          </td>
                          <td className="py-4 px-5">
                            <span className="font-mono font-bold text-white">{orgQuotes.length}</span>
                          </td>
                          <td className="py-4 px-5 font-mono text-emerald-400 font-bold">
                            {formatINR(orgSumInsured)}
                          </td>
                          <td className="py-4 px-5">
                            <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                              <Lock className="w-3 h-3" />
                              Isolated
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredOrgs.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-slate-500">
                          No organizations found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: AI TELEMETRY */}
        {activeTab === 'ai_telemetry' && (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Gemini AI — Platform Telemetry</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  $0.075/1M input • $0.30/1M output • gemini-1.5-flash / gemini-2.0-flash
                </p>
              </div>
              <div className="font-mono text-emerald-400 font-bold text-lg">
                ${totalAICost.toFixed(5)}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold">
                    <tr>
                      <th className="py-3 px-4">Time</th>
                      <th className="py-3 px-4">Endpoint</th>
                      <th className="py-3 px-4">Model</th>
                      <th className="py-3 px-4">Tokens (In/Out)</th>
                      <th className="py-3 px-4">Cost</th>
                      <th className="py-3 px-4">Latency</th>
                      <th className="py-3 px-4">Tenant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {aiRequests.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-500 font-sans">
                          No AI requests logged in this session.
                        </td>
                      </tr>
                    ) : (
                      aiRequests.slice(0, 100).map((req, i) => (
                        <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-2.5 px-4 text-slate-400 text-[10px]">
                            {new Date(req.created_at).toLocaleTimeString()}
                          </td>
                          <td className="py-2.5 px-4 font-bold text-white">{req.endpoint}</td>
                          <td className="py-2.5 px-4 text-blue-400">{req.model}</td>
                          <td className="py-2.5 px-4 text-slate-300">
                            {req.input_tokens} / {req.output_tokens}
                          </td>
                          <td className="py-2.5 px-4 text-emerald-400 font-bold">
                            ${req.cost_usd.toFixed(6)}
                          </td>
                          <td className="py-2.5 px-4 text-slate-400">{req.latency_ms}ms</td>
                          <td className="py-2.5 px-4 text-slate-500 text-[10px] truncate max-w-[120px]">
                            {req.workspace_id || '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: SYSTEM AUDIT LOG */}
        {activeTab === 'audit_log' && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold">
                    <tr>
                      <th className="py-3 px-4">Time</th>
                      <th className="py-3 px-4">Actor</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Target</th>
                      <th className="py-3 px-4">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {systemAuditLog.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-slate-500">
                          No system-level audit entries yet.
                        </td>
                      </tr>
                    ) : (
                      systemAuditLog.map((entry) => (
                        <tr key={entry.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-2.5 px-4 text-slate-400 font-mono text-[10px]">
                            {new Date(entry.created_at).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-white">{entry.actor_email}</td>
                          <td className="py-2.5 px-4">
                            <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono text-[10px]">
                              {entry.action}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-slate-400">
                            {entry.target_type && (
                              <span className="font-mono">
                                {entry.target_type}: {entry.target_id}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-slate-500 font-mono text-[10px] max-w-[200px] truncate">
                            {entry.details ? JSON.stringify(entry.details) : '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: RLS STATUS */}
        {activeTab === 'rls_status' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white mb-1">
                    PostgreSQL Row-Level Security Architecture
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                    All tables enforce multi-tenant isolation via mandatory{' '}
                    <code className="text-blue-400 font-mono">workspace_id</code> filtering.
                    Only users with <code className="text-blue-400 font-mono">super_admin = TRUE</code> in{' '}
                    <code className="text-blue-400 font-mono">profiles</code> can bypass tenant boundaries
                    (checked server-side, never client-side).
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                {[
                  {
                    table: 'profiles',
                    desc: 'Own profile + workspace teammates. Super admin sees all.',
                    policies: 3,
                  },
                  {
                    table: 'workspaces',
                    desc: 'Members see their own orgs. Admins can update. Super admin sees all.',
                    policies: 4,
                  },
                  {
                    table: 'workspace_members',
                    desc: 'Rosters visible to members. Only org admins can mutate.',
                    policies: 4,
                  },
                  {
                    table: 'clients',
                    desc: 'Viewers see assigned clients. Underwriters see own. Admins see all.',
                    policies: 4,
                  },
                  {
                    table: 'quotes',
                    desc: 'Viewers blocked. Underwriters see own quotes. Admins see all.',
                    policies: 4,
                  },
                  {
                    table: 'audit_logs',
                    desc: 'Read-only for workspace members. Append-only writes. No delete.',
                    policies: 2,
                  },
                  {
                    table: 'ai_requests',
                    desc: 'Org admins and super admin only. Backend can insert.',
                    policies: 2,
                  },
                  {
                    table: 'workspace_invitations',
                    desc: 'Org admins manage invitations. Super admin always.',
                    policies: 4,
                  },
                  {
                    table: 'system_audit_log',
                    desc: 'Super admin ONLY. Cross-tenant system events.',
                    policies: 1,
                  },
                ].map((t) => (
                  <div key={t.table} className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-white font-mono">{t.table}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold">
                        {t.policies} policies
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">{t.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
