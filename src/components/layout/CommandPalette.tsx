'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Building,
  FilePlus,
  Flame,
  History,
  LayoutDashboard,
  MapPin,
  Search,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import occupanciesData from '@/data/occupancies.json';
import { Occupancy } from '@/types/database';

export const CommandPalette: React.FC = () => {
  const router = useRouter();
  const {
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    quotes,
    clients,
    setIsAiDrawerOpen,
  } = useWorkspace();

  const [query, setQuery] = useState('');
  const occupancies = occupanciesData as Occupancy[];

  useEffect(() => {
    if (!isCommandPaletteOpen) {
      setQuery('');
    }
  }, [isCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  const cleanQuery = query.toLowerCase().trim();

  // Search Results
  const matchingQuotes = quotes.filter(
    (q) =>
      q.client_name.toLowerCase().includes(cleanQuery) ||
      q.quote_number.toLowerCase().includes(cleanQuery) ||
      q.occupation_code.includes(cleanQuery)
  );

  const matchingClients = clients.filter(
    (c) =>
      c.client_name.toLowerCase().includes(cleanQuery) ||
      c.gst.toLowerCase().includes(cleanQuery) ||
      c.district.toLowerCase().includes(cleanQuery)
  );

  const matchingOccupancies = occupancies
    .filter(
      (o) =>
        o.code.includes(cleanQuery) ||
        o.description.toLowerCase().includes(cleanQuery) ||
        o.category_tag.toLowerCase().includes(cleanQuery)
    )
    .slice(0, 5);

  const navigateTo = (path: string) => {
    setIsCommandPaletteOpen(false);
    const target = path.startsWith('/app') ? path : `/app${path}`;
    router.push(target);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
      <div
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center px-4 py-3 border-b border-slate-200 dark:border-slate-800 gap-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Type a command, client, occupancy code, or quote..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
          />
          <button
            onClick={() => setIsCommandPaletteOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-4">
          {/* Quick Actions (when empty query) */}
          {cleanQuery === '' && (
            <div>
              <p className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Quick Navigation
              </p>
              <div className="space-y-1 mt-1">
                <button
                  onClick={() => navigateTo('/quotes/new')}
                  className="w-full flex items-center gap-3 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl transition-colors text-left"
                >
                  <FilePlus className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-slate-900 dark:text-white">
                    Create New Quote Slip
                  </span>
                  <span className="ml-auto text-[10px] text-slate-400">3-Column Underwrite</span>
                </button>

                <button
                  onClick={() => navigateTo('/upload')}
                  className="w-full flex items-center gap-3 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-left"
                >
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span>Upload Proposal (PDF / OCR)</span>
                </button>

                <button
                  onClick={() => {
                    setIsCommandPaletteOpen(false);
                    setIsAiDrawerOpen(true);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-left"
                >
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Open AI Tariff Copilot</span>
                </button>

                <button
                  onClick={() => navigateTo('/occupancies')}
                  className="w-full flex items-center gap-3 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-left"
                >
                  <Flame className="w-4 h-4 text-amber-500" />
                  <span>Search 289 Tariff Occupancy Codes</span>
                </button>

                <button
                  onClick={() => navigateTo('/earthquake-zones')}
                  className="w-full flex items-center gap-3 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-left"
                >
                  <MapPin className="w-4 h-4 text-blue-500" />
                  <span>India Earthquake Zone Explorer</span>
                </button>
              </div>
            </div>
          )}

          {/* Occupancies search */}
          {matchingOccupancies.length > 0 && (
            <div>
              <p className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Occupancy Codes ({matchingOccupancies.length})
              </p>
              <div className="space-y-1 mt-1">
                {matchingOccupancies.map((o) => (
                  <button
                    key={o.code}
                    onClick={() => navigateTo(`/occupancies?search=${o.code}`)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded text-[11px]">
                        {o.code}
                      </span>
                      <span className="text-slate-800 dark:text-slate-200 line-clamp-1">
                        {o.description}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 flex-shrink-0 ml-2">
                      Rate: {o.flexa_rate}%
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quotes Search */}
          {matchingQuotes.length > 0 && (
            <div>
              <p className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Quotes ({matchingQuotes.length})
              </p>
              <div className="space-y-1 mt-1">
                {matchingQuotes.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => navigateTo(`/quotes/${q.id}`)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {q.client_name}
                      </span>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {q.quote_number} * {q.occupation_code}
                      </p>
                    </div>
                    <span className="text-emerald-600 font-semibold font-mono">
                      ₹{q.total_premium.toLocaleString('en-IN')}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Clients Search */}
          {matchingClients.length > 0 && (
            <div>
              <p className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Clients ({matchingClients.length})
              </p>
              <div className="space-y-1 mt-1">
                {matchingClients.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => navigateTo(`/clients/${c.id}`)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {c.client_name}
                      </span>
                      <p className="text-[10px] text-slate-400">
                        {c.district}, {c.state} * GST: {c.gst}
                      </p>
                    </div>
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between text-[11px] text-slate-400">
          <span>Navigate with mouse or arrows</span>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
};
