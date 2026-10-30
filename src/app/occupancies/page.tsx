'use client';

import React, { useMemo, useState, useEffect } from 'react';
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
  Sliders,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Save,
  Check,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import occupanciesData from '@/data/occupancies.json';
import { Occupancy, CustomTariffOverride, TariffComplianceResult } from '@/types/database';
import { useWorkspace } from '@/context/WorkspaceContext';
import { evaluateTariffCompliance } from '@/lib/calculator';

export default function OccupancyExplorerPage() {
  const occupancies = occupanciesData as Occupancy[];
  const { tariffOverrides, updateTariffOverride, deleteTariffOverride, canManageFirm } = useWorkspace();

  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [showCustomOnly, setShowCustomOnly] = useState(false);
  const [expandedCode, setExpandedCode] = useState<string | null>('4002');

  // Customization Form State for expanded card
  const [editFlexa, setEditFlexa] = useState<string>('');
  const [editLossCost, setEditLossCost] = useState<string>('');
  const [editDiscount, setEditDiscount] = useState<string>('');
  const [editCategory, setEditCategory] = useState<number>(1);
  const [editNotes, setEditNotes] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

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

  const activeOverrideCount = Object.keys(tariffOverrides).length;

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

      const matchesCustom = !showCustomOnly || !!tariffOverrides[occ.code];

      return matchesSearch && matchesTag && matchesCustom;
    });
  }, [occupancies, search, selectedTag, showCustomOnly, tariffOverrides]);

  // When expanding an occupancy, initialize edit fields with either active override or statutory defaults
  useEffect(() => {
    if (!expandedCode) return;
    const occ = occupancies.find((o) => o.code === expandedCode);
    if (!occ) return;

    const existing = tariffOverrides[expandedCode];
    if (existing) {
      setEditFlexa(existing.custom_flexa_rate !== undefined && existing.custom_flexa_rate !== null ? String(existing.custom_flexa_rate) : String(occ.flexa_rate));
      setEditLossCost(existing.custom_loss_cost !== undefined && existing.custom_loss_cost !== null ? String(existing.custom_loss_cost) : String(occ.loss_cost));
      setEditDiscount(existing.custom_discretionary_discount !== undefined && existing.custom_discretionary_discount !== null ? String(existing.custom_discretionary_discount) : '10');
      setEditCategory(existing.custom_category || occ.category || 1);
      setEditNotes(existing.notes || '');
    } else {
      setEditFlexa(String(occ.flexa_rate));
      setEditLossCost(String(occ.loss_cost));
      setEditDiscount('10');
      setEditCategory(occ.category || 1);
      setEditNotes('');
    }
    setSaveStatus('idle');
  }, [expandedCode, tariffOverrides, occupancies]);

  // Real-time compliance check for active edit
  const activeOcc = occupancies.find((o) => o.code === expandedCode);
  const liveCompliance: TariffComplianceResult | null = useMemo(() => {
    if (!activeOcc) return null;
    const numFlexa = parseFloat(editFlexa);
    const rateToCheck = isNaN(numFlexa) ? activeOcc.flexa_rate : numFlexa;
    return evaluateTariffCompliance(activeOcc, rateToCheck);
  }, [activeOcc, editFlexa]);

  const handleSaveOverride = async (code: string) => {
    setSaveStatus('saving');
    const numFlexa = parseFloat(editFlexa);
    const numLossCost = parseFloat(editLossCost);
    const numDiscount = parseFloat(editDiscount);

    const overridePayload: CustomTariffOverride = {
      occupancy_code: code,
      custom_flexa_rate: !isNaN(numFlexa) ? numFlexa : undefined,
      custom_loss_cost: !isNaN(numLossCost) ? numLossCost : undefined,
      custom_discretionary_discount: !isNaN(numDiscount) ? numDiscount : undefined,
      custom_category: editCategory,
      notes: editNotes.trim() || undefined,
    };

    await updateTariffOverride(overridePayload);
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2500);
  };

  const handleResetOverride = async (code: string) => {
    await deleteTariffOverride(code);
    const occ = occupancies.find((o) => o.code === code);
    if (occ) {
      setEditFlexa(String(occ.flexa_rate));
      setEditLossCost(String(occ.loss_cost));
      setEditDiscount('10');
      setEditCategory(occ.category || 1);
      setEditNotes('');
    }
    setSaveStatus('idle');
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 dark:bg-slate-950">
      <Header
        title="IIB Schedule 3 & Tariff Occupancy Explorer"
        subtitle="Complete database of 289 Indian Insurance Tariff codes, loss costs, and dynamic workspace customization"
        breadcrumbs={[
          { label: 'Knowledge Base', href: '/knowledge-base' },
          { label: 'Occupancy Explorer' },
        ]}
      />

      <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Top Controls & Custom Overrides Banner */}
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

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowCustomOnly((prev) => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                showCustomOnly
                  ? 'bg-emerald-600 text-white shadow-emerald shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Workspace Custom Overrides</span>
              {activeOverrideCount > 0 && (
                <span className="px-1.5 py-0.2 bg-emerald-400/20 text-emerald-800 dark:text-emerald-200 rounded-full text-[10px] font-bold">
                  {activeOverrideCount}
                </span>
              )}
            </button>

            <div className="flex flex-wrap items-center gap-1 overflow-x-auto">
              {tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    selectedTag === tag
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Counter & Compliance Legend */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 px-1 gap-2">
          <span>
            Showing <strong className="text-slate-900 dark:text-white">{filteredOccupancies.length}</strong> of 289 classifications
            {showCustomOnly && <span className="text-emerald-600 font-semibold ml-1">(Customized View Active)</span>}
          </span>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> IIB Compliant Baseline
            </span>
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
              <AlertCircle className="w-3.5 h-3.5" /> AIFT Discount Corridor
            </span>
          </div>
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
                  <th className="p-4">Effective Flexa</th>
                  <th className="p-4">Statutory Loss Cost</th>
                  <th className="p-4">Section / Category</th>
                  <th className="p-4">Workspace Status</th>
                  <th className="p-4">Keywords</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredOccupancies.map((occ) => {
                  const isExpanded = expandedCode === occ.code;
                  const override = tariffOverrides[occ.code];
                  const hasCustom = !!override && (override.custom_flexa_rate !== undefined || override.custom_discretionary_discount !== undefined);
                  const effectiveFlexa = override?.custom_flexa_rate !== undefined ? override.custom_flexa_rate : occ.flexa_rate;

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

                        <td className="p-4 font-mono font-bold text-slate-900 dark:text-white">
                          <span className={hasCustom ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' : ''}>
                            {effectiveFlexa}‰
                          </span>
                          {hasCustom && (
                            <span className="block text-[9px] font-normal text-slate-400 line-through">
                              Base: {occ.flexa_rate}‰
                            </span>
                          )}
                        </td>

                        <td className="p-4 font-mono font-semibold text-slate-800 dark:text-slate-200">
                          {occ.loss_cost}‰
                        </td>

                        <td className="p-4 text-slate-600 dark:text-slate-400">
                          Section {occ.section} • Cat {override?.custom_category || occ.category}
                        </td>

                        <td className="p-4">
                          {hasCustom ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-500/20">
                              <Sparkles className="w-3 h-3 text-emerald-500" />
                              Custom Rate
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                              Statutory
                            </span>
                          )}
                        </td>

                        <td className="p-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {(occ.keywords || []).slice(0, 2).map((k, i) => (
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

                      {/* Interactive Custom Tariff & Compliance Drawer */}
                      {isExpanded && (
                        <tr className="bg-emerald-50/20 dark:bg-emerald-950/10">
                          <td colSpan={8} className="p-6 border-y border-emerald-500/20">
                            <div className="space-y-6">
                              {/* Baseline Statistics Row */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                                    Official Base Flexa
                                  </span>
                                  <span className="text-base font-mono font-bold text-slate-900 dark:text-white">
                                    {occ.flexa_rate} per mille
                                  </span>
                                  <p className="text-[10px] text-slate-400 mt-0.5">
                                    AIFT 2001 Statutory Standard
                                  </p>
                                </div>

                                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                                    Statutory Loss Cost
                                  </span>
                                  <span className="text-base font-mono font-bold text-slate-900 dark:text-white">
                                    {occ.loss_cost} per mille
                                  </span>
                                  <p className="text-[10px] text-slate-400 mt-0.5">
                                    IIB Schedule 3 Mandated Floor
                                  </p>
                                </div>

                                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                                    STFI & EQ Schedule
                                  </span>
                                  <span className="text-base font-mono font-bold text-slate-900 dark:text-white">
                                    STFI: {occ.stfi_rate}‰
                                  </span>
                                  <p className="text-[10px] text-slate-400 mt-0.5">
                                    Zone Rate scaled by Cat Factor
                                  </p>
                                </div>

                                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                                    Statutory Authority
                                  </span>
                                  <span className="font-semibold text-emerald-600 block line-clamp-1">
                                    {occ.source_doc}
                                  </span>
                                  <p className="text-[10px] text-slate-400 mt-0.5">
                                    IRDAI De-tariffing Gazette
                                  </p>
                                </div>
                              </div>

                              {/* Live Customization & Compliance Panel */}
                              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                                  <div>
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                      <Sliders className="w-4 h-4 text-emerald-500" />
                                      Dynamic Workspace Tariff Customization
                                    </h4>
                                    <p className="text-xs text-slate-500">
                                      Customized rates apply immediately to your active workspace dashboard and proposal generator.
                                    </p>
                                  </div>

                                  {/* Compliance Badge */}
                                  {liveCompliance && (
                                    <div
                                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border ${
                                        liveCompliance.status === 'COMPLIANT'
                                          ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                                          : liveCompliance.status === 'WARNING'
                                          ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-500/20'
                                          : 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border-red-500/20'
                                      }`}
                                    >
                                      {liveCompliance.status === 'COMPLIANT' ? (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                      ) : liveCompliance.status === 'WARNING' ? (
                                        <AlertCircle className="w-4 h-4 text-amber-500" />
                                      ) : (
                                        <AlertTriangle className="w-4 h-4 text-red-500" />
                                      )}
                                      <span>{liveCompliance.message}</span>
                                    </div>
                                  )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                                  <div>
                                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                                      Custom Base Flexa (per mille)
                                    </label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={editFlexa}
                                      onChange={(e) => setEditFlexa(e.target.value)}
                                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                    <span className="text-[10px] text-slate-400 mt-1 block">
                                      Statutory baseline: {occ.flexa_rate}‰
                                    </span>
                                  </div>

                                  <div>
                                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                                      Custom Loss Cost (per mille)
                                    </label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={editLossCost}
                                      onChange={(e) => setEditLossCost(e.target.value)}
                                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                    <span className="text-[10px] text-slate-400 mt-1 block">
                                      Statutory baseline: {occ.loss_cost}‰
                                    </span>
                                  </div>

                                  <div>
                                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                                      Discretionary Discount (%)
                                    </label>
                                    <input
                                      type="number"
                                      step="1"
                                      min="0"
                                      max="50"
                                      value={editDiscount}
                                      onChange={(e) => setEditDiscount(e.target.value)}
                                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                    <span className="text-[10px] text-slate-400 mt-1 block">
                                      Standard firm default: 10%
                                    </span>
                                  </div>

                                  <div>
                                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                                      Category Multiplier
                                    </label>
                                    <select
                                      value={editCategory}
                                      onChange={(e) => setEditCategory(Number(e.target.value))}
                                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    >
                                      <option value={1}>Category 1 (-25% Scaling)</option>
                                      <option value={2}>Category 2 (-10% Scaling)</option>
                                      <option value={3}>Category 3 (+25% Scaling)</option>
                                      <option value={4}>Category 4 (+160% Scaling)</option>
                                    </select>
                                    <span className="text-[10px] text-slate-400 mt-1 block">
                                      Official Category: {occ.category}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                                  <input
                                    type="text"
                                    placeholder="Optional underwriter rationale or client note..."
                                    value={editNotes}
                                    onChange={(e) => setEditNotes(e.target.value)}
                                    className="flex-1 w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                  />

                                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                    {hasCustom && (
                                      <button
                                        type="button"
                                        onClick={() => handleResetOverride(occ.code)}
                                        className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors"
                                      >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        Reset to Statutory
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      disabled={saveStatus === 'saving'}
                                      onClick={() => handleSaveOverride(occ.code)}
                                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
                                    >
                                      {saveStatus === 'saving' ? (
                                        <span>Saving...</span>
                                      ) : saveStatus === 'saved' ? (
                                        <>
                                          <Check className="w-3.5 h-3.5" />
                                          <span>Saved & Active!</span>
                                        </>
                                      ) : (
                                        <>
                                          <Save className="w-3.5 h-3.5" />
                                          <span>Save Custom Rate</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>
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
