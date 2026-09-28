'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  BookOpen,
  ChevronRight,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Flame,
  Layers,
  MapPin,
  Search,
  Shield,
  Sparkles,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import tariffData from '@/data/tariff_rules.json';
import occupanciesData from '@/data/occupancies.json';
import { Occupancy, TariffClause } from '@/types/database';

export default function KnowledgeBasePage() {
  const [activeTab, setActiveTab] = useState<
    'clauses' | 'warranties' | 'hazards' | 'tariffs'
  >('clauses');
  const [search, setSearch] = useState('');

  const clauses = tariffData.clauses as TariffClause[];
  const warranties = tariffData.warranties;
  const hazards = tariffData.hazard_categories;

  const filteredClauses = clauses.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 dark:bg-slate-950">
      <Header
        title="Insurance Knowledge Base & Tariff Repository"
        subtitle="Authoritative repository citing AIFT 2001, IIB Loss Cost Schedule 3, and TAC circulars"
        breadcrumbs={[
          { label: 'Underwriting', href: '/quotes/new' },
          { label: 'Knowledge Base' },
        ]}
      />

      <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Source Documents Overview Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">AIFT 2001</p>
              <p className="text-[10px] text-slate-500">All India Fire Tariff (89 Pages)</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">IIB Schedule 3</p>
              <p className="text-[10px] text-slate-500">Loss Cost Benchmarks (289 Codes)</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">TAC EQ Zoning</p>
              <p className="text-[10px] text-slate-500">IS 1893:2016 Seismic Scales</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Terrorism Pool</p>
              <p className="text-[10px] text-slate-500">Indian Market Pool Schedule</p>
            </div>
          </div>
        </div>

        {/* Tab Header & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveTab('clauses')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'clauses'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Standard Clauses ({clauses.length})
            </button>

            <button
              onClick={() => setActiveTab('warranties')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'warranties'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Warranties ({warranties.length})
            </button>

            <button
              onClick={() => setActiveTab('hazards')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'hazards'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Hazard Categories ({hazards.length})
            </button>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter clauses, warranties..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Tab 1: Standard Clauses */}
        {activeTab === 'clauses' && (
          <div className="grid md:grid-cols-2 gap-4">
            {filteredClauses.map((clause) => (
              <div
                key={clause.id}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-card flex flex-col justify-between card-hover"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {clause.category}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {clause.source_doc}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                    {clause.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                    {clause.description}
                  </p>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-[11px] text-slate-500">
                    <strong className="text-slate-700 dark:text-slate-300">Applicable To:</strong>{' '}
                    {clause.applicable_to}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-emerald-600 font-semibold">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Cites: {clause.source_doc}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Warranties */}
        {activeTab === 'warranties' && (
          <div className="space-y-4">
            {warranties.map((w) => (
              <div
                key={w.code}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-card"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300">
                      {w.code}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {w.name}
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-slate-500">
                    Target Occupancy: {w.occupancy_code}
                  </span>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed mt-2 p-3 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/60 font-mono">
                  "{w.text}"
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Hazard Categories */}
        {activeTab === 'hazards' && (
          <div className="grid md:grid-cols-2 gap-4">
            {hazards.map((h) => (
              <div
                key={h.category}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-card space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-sm px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white">
                    Category {h.category}
                  </span>
                  <span
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                      h.rate_adjustment < 0
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                    }`}
                  >
                    Adjustment: {h.rate_adjustment > 0 ? `+${h.rate_adjustment * 100}%` : `${h.rate_adjustment * 100}%`}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{h.name}</h3>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {h.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
