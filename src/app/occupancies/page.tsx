'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Download,
  Filter,
  Flame,
  Info,
  Layers,
  Search,
  Shield,
  Sparkles,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import occupanciesData from '@/data/occupancies.json';
import { Occupancy } from '@/types/database';

export default function OccupancyExplorerPage() {
  const occupancies = occupanciesData as Occupancy[];

  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [expandedCode, setExpandedCode] = useState<string | null>('4002');

  const tags = [
    'All',
    'Warehouse',
    'Retail',
    'Manufacturing',
    'Office',
    'Hospitality',
    'Healthcare',
    'Hazardous',
  ];

  const filteredOccupancies = useMemo(() => {
    return occupancies.filter((occ) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        occ.code.toLowerCase().includes(q) ||
        occ.description.toLowerCase().includes(q) ||
        (occ.keywords && occ.keywords.some((k) => k.toLowerCase().includes(q)));

      const matchesTag =
        selectedTag === 'All' ||
        occ.category_tag.toLowerCase() === selectedTag.toLowerCase();

      return matchesSearch && matchesTag;
    });
  }, [occupancies, search, selectedTag]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 dark:bg-slate-950">
      <Header
        title="IIB Schedule 3 & Tariff Occupancy Explorer"
        subtitle="Complete database of 289 Indian Insurance Tariff codes, loss costs, and risk categories"
        breadcrumbs={[
          { label: 'Knowledge Base', href: '/knowledge-base' },
          { label: 'Occupancy Explorer' },
        ]}
      />

      <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Filter Controls */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search code (e.g. 4002) or keywords (food, cement, solvent)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedTag === tag
                    ? 'bg-emerald-600 text-white shadow-emerald shadow-xs'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>
            Showing <strong className="text-slate-900 dark:text-white">{filteredOccupancies.length}</strong> of 289 official classifications
          </span>
          <span className="text-[11px] font-mono">Source: IIB Schedule 3 & AIFT 2001</span>
        </div>

        {/* Occupancies Table */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-800/40 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="p-4 w-10"></th>
                  <th className="p-4">Code</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Loss Cost</th>
                  <th className="p-4">Section / Category</th>
                  <th className="p-4">Category Tag</th>
                  <th className="p-4">Keywords</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredOccupancies.map((occ) => {
                  const isExpanded = expandedCode === occ.code;
                  return (
                    <React.Fragment key={occ.code}>
                      <tr
                        onClick={() => setExpandedCode(isExpanded ? null : occ.code)}
                        className={`cursor-pointer transition-colors ${
                          isExpanded
                            ? 'bg-emerald-50/40 dark:bg-emerald-950/20'
                            : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="p-4 text-slate-400">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </td>

                        <td className="p-4 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          {occ.code}
                        </td>

                        <td className="p-4 font-semibold text-slate-900 dark:text-white max-w-md">
                          <p className="line-clamp-2">{occ.description}</p>
                        </td>

                        <td className="p-4 font-mono font-semibold text-slate-800 dark:text-slate-200">
                          {occ.loss_cost}%
                        </td>

                        <td className="p-4 text-slate-600 dark:text-slate-400">
                          Section {occ.section} * Cat {occ.category}
                        </td>

                        <td className="p-4">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              occ.category_tag === 'Hazardous'
                                ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                                : occ.category_tag === 'Warehouse'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : occ.category_tag === 'Manufacturing'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {occ.category_tag}
                          </span>
                        </td>

                        <td className="p-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {(occ.keywords || []).slice(0, 3).map((k, i) => (
                              <span
                                key={i}
                                className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                              >
                                {k}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Tariff Detail Drawer */}
                      {isExpanded && (
                        <tr className="bg-emerald-50/20 dark:bg-emerald-950/10">
                          <td colSpan={7} className="p-5 border-y border-emerald-500/20">
                            <div className="grid md:grid-cols-4 gap-4 text-xs">
                              <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                                  Base Flexa Rate
                                </span>
                                <span className="text-base font-mono font-bold text-slate-900 dark:text-white">
                                  {occ.flexa_rate} per mille
                                </span>
                                <p className="text-[10px] text-slate-400 mt-1">
                                  Standard Fire & Special Perils base rating
                                </p>
                              </div>

                              <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                                  STFI Base Rate
                                </span>
                                <span className="text-base font-mono font-bold text-slate-900 dark:text-white">
                                  {occ.stfi_rate} per mille
                                </span>
                                <p className="text-[10px] text-slate-400 mt-1">
                                  Storm, Tempest, Flood & Inundation cover
                                </p>
                              </div>

                              <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                                  Terrorism Pool Rate
                                </span>
                                <span className="text-base font-mono font-bold text-slate-900 dark:text-white">
                                  {occ.terrorism_rate} per mille
                                </span>
                                <p className="text-[10px] text-slate-400 mt-1">
                                  Indian Market Terrorism Pool scale
                                </p>
                              </div>

                              <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                                  Source Citation
                                </span>
                                <span className="font-semibold text-emerald-600 block line-clamp-1">
                                  {occ.source_doc}
                                </span>
                                <p className="text-[10px] text-slate-400 mt-1">
                                  Official TAC & IIB Schedule Document
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
