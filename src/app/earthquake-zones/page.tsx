'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Building,
  CheckCircle2,
  Info,
  MapPin,
  Search,
  Shield,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import eqZonesData from '@/data/earthquake_zones.json';

export default function EarthquakeZonesPage() {
  const [searchDistrict, setSearchDistrict] = useState('');
  const [selectedZoneCode, setSelectedZoneCode] = useState<string>('Zone 2'); // Zone IV (Delhi NCR)

  const zones = eqZonesData.zones;

  // Search District across all zones
  const searchResults = useMemo(() => {
    if (!searchDistrict.trim()) return [];
    const q = searchDistrict.toLowerCase().trim();
    const results: { district: string; state: string; zone: string; zone_code: string; loading_iii: number; loading_other: number }[] = [];

    zones.forEach((z) => {
      z.states.forEach((s) => {
        s.districts.forEach((d) => {
          if (d.toLowerCase().includes(q) || s.state.toLowerCase().includes(q)) {
            results.push({
              district: d,
              state: s.state,
              zone: z.zone,
              zone_code: z.zone_code,
              loading_iii: z.base_loading_section_iii,
              loading_other: z.base_loading_section_other,
            });
          }
        });
      });
    });

    return results;
  }, [zones, searchDistrict]);

  const activeZone = zones.find((z) => z.zone_code === selectedZoneCode) || zones[1];

  const zoneColors: Record<string, { bg: string; text: string; border: string; pill: string }> = {
    'Zone 1': {
      bg: 'bg-red-500/10 dark:bg-red-500/10',
      text: 'text-red-700 dark:text-red-300',
      border: 'border-red-500/30',
      pill: 'bg-red-500 text-white',
    },
    'Zone 2': {
      bg: 'bg-amber-500/10 dark:bg-amber-500/10',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-500/30',
      pill: 'bg-amber-500 text-slate-950 font-bold',
    },
    'Zone 3': {
      bg: 'bg-yellow-500/10 dark:bg-yellow-500/10',
      text: 'text-yellow-700 dark:text-yellow-300',
      border: 'border-yellow-500/30',
      pill: 'bg-yellow-500 text-slate-950 font-bold',
    },
    'Zone 4': {
      bg: 'bg-blue-500/10 dark:bg-blue-500/10',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-500/30',
      pill: 'bg-blue-500 text-white',
    },
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 dark:bg-slate-950">
      <Header
        title="India Earthquake Seismic Zoning Explorer"
        subtitle="Tariff Advisory Committee & IS 1893:2016 Seismic Zone Classifications and Loadings"
        breadcrumbs={[
          { label: 'Knowledge Base', href: '/knowledge-base' },
          { label: 'EQ Zones' },
        ]}
      />

      <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* District Instant Search */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-card">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            <Search className="w-4 h-4 text-emerald-600" />
            <span>District Seismic Zone Lookup</span>
          </div>

          <div className="relative max-w-xl">
            <input
              type="text"
              placeholder="Search your client's district (e.g. New Delhi, Gurugram, Mumbai, Pune, Kutch, Patna)..."
              value={searchDistrict}
              onChange={(e) => setSearchDistrict(e.target.value)}
              className="w-full px-4 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="mt-3 p-2 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] font-semibold text-slate-400 px-2 block">
                Found {searchResults.length} matching districts
              </span>
              <div className="grid md:grid-cols-2 gap-2 mt-1">
                {searchResults.slice(0, 6).map((res, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setSelectedZoneCode(res.zone_code);
                      setSearchDistrict('');
                    }}
                    className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 cursor-pointer transition-all flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {res.district}
                      </span>
                      <span className="text-[10px] text-slate-400 block">{res.state}</span>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-bold text-xs text-emerald-600">
                        {res.zone}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        Sec III: {res.loading_iii}‰
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 4 Interactive Zone Selector Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {zones.map((z) => {
            const isSelected = selectedZoneCode === z.zone_code;
            const styling = zoneColors[z.zone_code] || zoneColors['Zone 2'];
            return (
              <div
                key={z.zone_code}
                onClick={() => setSelectedZoneCode(z.zone_code)}
                className={`p-5 rounded-3xl border cursor-pointer transition-all card-hover ${
                  isSelected
                    ? `${styling.bg} ${styling.border} shadow-md ring-2 ring-emerald-500/30`
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${styling.pill}`}>
                    {z.zone} ({z.zone_code})
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">IS 1893</span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  {z.hazard_level.split('(')[0]}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {z.description}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Sec III Base Rate:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {z.base_loading_section_iii} per mille
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Deep Dive on Selected Zone */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-card space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-slate-900 dark:text-white">
                  {activeZone.zone} ({activeZone.zone_code}) Details
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold">
                  Tariff Rating Active
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{activeZone.hazard_level}</p>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 block font-sans">
                  Section III Commercial Rate
                </span>
                <span className="font-bold text-emerald-600 text-sm">
                  {activeZone.base_loading_section_iii}‰
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 block font-sans">
                  Section IV/VI Industrial Rate
                </span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {activeZone.base_loading_section_other}‰
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Districts & Regions Classified under {activeZone.zone}
            </h4>

            <div className="grid md:grid-cols-2 gap-4 text-xs">
              {activeZone.states.map((st, i) => (
                <div
                  key={i}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800"
                >
                  <span className="font-bold text-slate-900 dark:text-white text-xs block mb-2 text-emerald-700 dark:text-emerald-400">
                    {st.state}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {st.districts.map((d, dIdx) => (
                      <span
                        key={dIdx}
                        className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px]"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
