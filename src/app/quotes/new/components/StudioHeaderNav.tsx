'use client';

import React from 'react';
import {
  Building2,
  Car,
  Anchor,
  Heart,
  HardHat,
  ShieldAlert,
  Briefcase,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export type LOBCategoryKey =
  | 'property'
  | 'motor_fleet'
  | 'marine_cargo'
  | 'benefits'
  | 'engineering'
  | 'liability'
  | 'specialty';

export interface LOBItem {
  key: LOBCategoryKey;
  label: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  activeBorder: string;
  activeBg: string;
  activeText: string;
  status: 'live' | 'beta' | 'planned';
}

export const LOB_CATALOG: LOBItem[] = [
  {
    key: 'property',
    label: 'Property & Fire',
    badge: 'BLUS / BSUS (IIB 2001)',
    icon: Building2,
    accentColor: 'emerald',
    activeBorder: 'border-emerald-500',
    activeBg: 'bg-emerald-50/70 dark:bg-emerald-950/40',
    activeText: 'text-emerald-700 dark:text-emerald-300',
    status: 'live',
  },
  {
    key: 'motor_fleet',
    label: 'Motor & Fleet',
    badge: 'AIMT & IRDAI TP Gazetted',
    icon: Car,
    accentColor: 'blue',
    activeBorder: 'border-blue-500',
    activeBg: 'bg-blue-50/70 dark:bg-blue-950/40',
    activeText: 'text-blue-700 dark:text-blue-300',
    status: 'live',
  },
  {
    key: 'marine_cargo',
    label: 'Marine Cargo',
    badge: 'ICC A/B/C • ITC Open Cover',
    icon: Anchor,
    accentColor: 'cyan',
    activeBorder: 'border-cyan-500',
    activeBg: 'bg-cyan-50/70 dark:bg-cyan-950/40',
    activeText: 'text-cyan-700 dark:text-cyan-300',
    status: 'live',
  },
  {
    key: 'benefits',
    label: 'Employee Benefits',
    badge: 'GHI • GTLI • GPA • WC (EC Act)',
    icon: Heart,
    accentColor: 'rose',
    activeBorder: 'border-rose-500',
    activeBg: 'bg-rose-50/70 dark:bg-rose-950/40',
    activeText: 'text-rose-700 dark:text-rose-300',
    status: 'live',
  },
  {
    key: 'engineering',
    label: 'Engineering',
    badge: 'CAR • EAR • MB (Groups I-IV)',
    icon: HardHat,
    accentColor: 'amber',
    activeBorder: 'border-amber-500',
    activeBg: 'bg-amber-50/70 dark:bg-amber-950/40',
    activeText: 'text-amber-700 dark:text-amber-300',
    status: 'live',
  },
  {
    key: 'liability',
    label: 'Corporate Liability',
    badge: 'CGL • D&O • Cyber (DPDPA)',
    icon: ShieldAlert,
    accentColor: 'purple',
    activeBorder: 'border-purple-500',
    activeBg: 'bg-purple-50/70 dark:bg-purple-950/40',
    activeText: 'text-purple-700 dark:text-purple-300',
    status: 'live',
  },
  {
    key: 'specialty',
    label: 'Specialty & Surety',
    badge: 'Surety Bonds • Trade Credit',
    icon: Briefcase,
    accentColor: 'emerald',
    activeBorder: 'border-emerald-500',
    activeBg: 'bg-emerald-50/70 dark:bg-emerald-950/40',
    activeText: 'text-emerald-700 dark:text-emerald-300',
    status: 'live',
  },
];

interface StudioHeaderNavProps {
  activeLine: string;
  onSelectLine: (lineKey: LOBCategoryKey) => void;
  commonClientInfo?: {
    clientName: string;
    clientGst: string;
    clientAddress?: string;
    hypothecationBank?: string;
  };
}

export const StudioHeaderNav: React.FC<StudioHeaderNavProps> = ({
  activeLine,
  onSelectLine,
  commonClientInfo,
}) => {
  const currentLOB = LOB_CATALOG.find((l) => l.key === activeLine) || LOB_CATALOG[0];

  return (
    <div className="w-full bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex-shrink-0">
      {/* Top Strip: LoB Tab Selector & Client Preserved State Pill */}
      <div className="px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/60">
        {/* Horizontal Scrollable Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
          {LOB_CATALOG.map((item) => {
            const Icon = item.icon;
            const isActive = item.key === activeLine;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onSelectLine(item.key)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 border ${
                  isActive
                    ? `${item.activeBg} ${item.activeBorder} ${item.activeText} shadow-xs`
                    : 'bg-transparent border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? item.activeText : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.status === 'live' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {/* Client Preserved Context Badge */}
        {commonClientInfo?.clientName ? (
          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span className="font-semibold text-slate-900 dark:text-white">
              {commonClientInfo.clientName}
            </span>
            {commonClientInfo.clientGst && (
              <span className="font-mono text-slate-400 text-[10px]">
                ({commonClientInfo.clientGst})
              </span>
            )}
          </div>
        ) : (
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-slate-400">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Shared client info auto-syncs across lines</span>
          </div>
        )}
      </div>

      {/* Secondary Line Banner: Regulatory Badge & Underwriting Standard */}
      <div className="px-4 sm:px-6 py-2 bg-slate-50/60 dark:bg-slate-950/40 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {currentLOB.label} Studio
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
            {currentLOB.badge}
          </span>
        </div>
        <div className="text-[11px] text-slate-500 font-mono hidden sm:inline">
          Deterministic IRDAI & AIMT Engine Active • Zero LLM Arithmetic
        </div>
      </div>
    </div>
  );
};
