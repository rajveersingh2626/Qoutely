'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Building,
  CheckCircle2,
  FileText,
  MapPin,
  MoreVertical,
  Plus,
  Search,
  Shield,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { Header } from '@/components/layout/Header';
import { formatINR } from '@/lib/calculator';

export default function ClientsPage() {
  const { clients, quotes, addClient, deleteClient, canManageClients } = useWorkspace();

  const [search, setSearch] = useState('');
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [newClientData, setNewClientData] = useState({
    client_name: '',
    gst: '',
    address: '',
    district: '',
    state: '',
    industry: '',
    notes: '',
  });

  const filteredClients = clients.filter(
    (c) =>
      c.client_name.toLowerCase().includes(search.toLowerCase()) ||
      c.gst.toLowerCase().includes(search.toLowerCase()) ||
      c.district.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    addClient(newClientData);
    setIsNewClientModalOpen(false);
    setNewClientData({
      client_name: '',
      gst: '',
      address: '',
      district: '',
      state: '',
      industry: '',
      notes: '',
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 dark:bg-slate-950">
      <Header
        title="Commercial Client Accounts"
        subtitle="Manage insured companies, GST records, claims, and quotation history"
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Clients CRM' }]}
      />

      <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Top Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by client name, GSTIN, or district..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {canManageClients && (
            <button
              onClick={() => setIsNewClientModalOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-emerald shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Commercial Client</span>
            </button>
          )}
        </div>

        {/* Client Cards Grid */}
        <div className="grid md:grid-cols-3 gap-5">
          {filteredClients.map((client) => {
            const clientQuotes = quotes.filter((q) => q.client_name === client.client_name);
            const totalSI = clientQuotes.reduce((acc, q) => acc + q.sum_insured, 0);

            return (
              <div
                key={client.id}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-card card-hover flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
                      {client.client_name.charAt(0)}
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {client.industry}
                    </span>
                  </div>

                  <Link
                    href={`/clients/${client.id}`}
                    className="text-sm font-bold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 block line-clamp-1"
                  >
                    {client.client_name}
                  </Link>

                  <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                    GSTIN: {client.gst}
                  </p>

                  <div className="mt-3 flex items-start gap-1.5 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-slate-400" />
                    <span className="line-clamp-2">{client.address}</span>
                  </div>

                  {client.notes && (
                    <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                      {client.notes}
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Total Underwritten</span>
                    <span className="font-mono font-bold text-emerald-600">
                      {formatINR(totalSI || 5000000)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {canManageClients && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          if (confirm(`Delete client record for ${client.client_name}?`)) {
                            deleteClient(client.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Delete Client"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <Link
                      href={`/clients/${client.id}`}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs transition-colors"
                    >
                      View CRM File
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* New Client Modal */}
      {isNewClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Add Commercial Client
              </h3>
              <button
                onClick={() => setIsNewClientModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Company / Entity Name *
                </label>
                <input
                  type="text"
                  required
                  value={newClientData.client_name}
                  onChange={(e) =>
                    setNewClientData({ ...newClientData, client_name: e.target.value })
                  }
                  placeholder="e.g. Acme Industries Ltd"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    GSTIN Number *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={15}
                    value={newClientData.gst}
                    onChange={(e) =>
                      setNewClientData({ ...newClientData, gst: e.target.value.toUpperCase() })
                    }
                    placeholder="07ALMPA9603N1ZS"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Industry Type
                  </label>
                  <input
                    type="text"
                    value={newClientData.industry}
                    onChange={(e) =>
                      setNewClientData({ ...newClientData, industry: e.target.value })
                    }
                    placeholder="e.g. FMCG Trading"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Registered Premises Address
                </label>
                <textarea
                  rows={2}
                  required
                  value={newClientData.address}
                  onChange={(e) =>
                    setNewClientData({ ...newClientData, address: e.target.value })
                  }
                  placeholder="Plot/Khasra No, Street, City, State, PIN"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Underwriting & Risk Notes
                </label>
                <textarea
                  rows={2}
                  value={newClientData.notes}
                  onChange={(e) =>
                    setNewClientData({ ...newClientData, notes: e.target.value })
                  }
                  placeholder="Hypothecation, claim ratio, commodities stored..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewClientModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-emerald shadow-sm"
                >
                  Create Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
