'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Building,
  CheckCircle2,
  FileText,
  MapPin,
  Plus,
  Shield,
  Users,
} from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { Header } from '@/components/layout/Header';

export default function WorkspacesPage() {
  const router = useRouter();
  const { workspaces, currentWorkspace, switchWorkspace, currentUser } = useWorkspace();

  const handleSelectWorkspace = (id: string) => {
    switchWorkspace(id);
    router.push('/dashboard');
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 dark:bg-slate-950">
      <Header
        title="Brokerage Workspaces"
        subtitle="Manage and switch between your registered insurance brokerage firms"
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Workspaces' }]}
      />

      <div className="p-6 md:p-8 max-w-5xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Your Brokerage Firms
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Select an active workspace to view quotes, clients, team members, and tariff rules.
            </p>
          </div>

          <Link
            href="/workspaces/new"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-emerald shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Onboard New Brokerage</span>
          </Link>
        </div>

        {/* Workspaces Grid */}
        <div className="grid md:grid-cols-2 gap-5">
          {workspaces.map((ws) => {
            const isCurrent = ws.id === currentWorkspace.id;
            return (
              <div
                key={ws.id}
                className={`p-6 rounded-3xl bg-white dark:bg-slate-900 border transition-all card-hover ${
                  isCurrent
                    ? 'border-emerald-500 shadow-md shadow-emerald-500/5 ring-1 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-lg font-bold shadow-sm">
                      {ws.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {ws.name}
                        {isCurrent && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold px-2 py-0.5 rounded-full">
                            Active
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">GSTIN: {ws.gst}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-6 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{ws.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span>IRDAI License No: {ws.default_rules.irda_license_no || '236'}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="text-[11px] text-slate-400">
                    Default Discount: {ws.default_rules.default_discretionary_discount}%
                  </div>

                  <button
                    onClick={() => handleSelectWorkspace(ws.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      isCurrent
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900'
                    }`}
                  >
                    <span>{isCurrent ? 'Enter Workspace' : 'Switch Firm'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
