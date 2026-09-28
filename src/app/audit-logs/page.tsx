'use client';

import React, { useState } from 'react';
import {
  Activity,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  Download,
  FileCheck,
  FilePlus,
  FileText,
  Filter,
  Search,
  Shield,
  UserCheck,
} from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { Header } from '@/components/layout/Header';

export default function AuditLogsPage() {
  const { auditLogs, currentWorkspace } = useWorkspace();
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.user_name.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      JSON.stringify(log.details || '').toLowerCase().includes(search.toLowerCase());

    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const getActionBadge = (action: string) => {
    if (action.includes('created')) {
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
    }
    if (action.includes('downloaded')) {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300';
    }
    if (action.includes('invited') || action.includes('role')) {
      return 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300';
    }
    return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 dark:bg-slate-950">
      <Header
        title="Immutable Audit & Compliance Trail"
        subtitle={`Chronological event ledger for ${currentWorkspace.name}`}
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Audit Trail' }]}
      />

      <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Top Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-1 items-center gap-2 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search audit trail by user, action, client..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="all">All Actions</option>
              <option value="quote.created">Quotes Created</option>
              <option value="quote.pdf_downloaded">PDF Downloads</option>
              <option value="member.invited">Member Invites</option>
              <option value="workspace.updated">Workspace Updates</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>Cryptographically timestamped</span>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-800/40 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Broker Personnel</th>
                  <th className="p-4">Action Event</th>
                  <th className="p-4">Resource Target</th>
                  <th className="p-4">Payload Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="p-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('en-GB')}
                    </td>

                    <td className="p-4 font-semibold text-slate-900 dark:text-white">
                      {log.user_name}
                      <span className="text-[10px] text-slate-400 block font-mono font-normal">
                        {log.user_email}
                      </span>
                    </td>

                    <td className="p-4">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${getActionBadge(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>

                    <td className="p-4 capitalize text-slate-700 dark:text-slate-300 font-medium">
                      {log.resource_type}
                      <span className="text-[10px] text-slate-400 block font-mono">
                        ID: {log.resource_id.slice(0, 16)}...
                      </span>
                    </td>

                    <td className="p-4">
                      {log.details ? (
                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 font-mono text-[10px] text-slate-600 dark:text-slate-400 max-w-sm truncate">
                          {JSON.stringify(log.details)}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
