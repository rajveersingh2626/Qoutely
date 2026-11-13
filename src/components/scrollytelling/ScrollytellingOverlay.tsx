'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Cpu, 
  Lock,
  Database,
  FileText,
  Activity,
  Check,
  Flame,
  Anchor,
  AlertCircle,
  HardHat,
  Heart,
  Car,
  ChevronRight,
  Sliders,
  TrendingUp,
} from 'lucide-react';

interface ScrollytellingOverlayProps {
  onBookDemo: () => void;
  onExploreWorkflows: () => void;
  activeSection?: number;
}

// ─────────────────────────────────────────────────────────
//  AUTHENTIC OMNI-LINE COMMERCIAL SUITE (ALL 7 LINES 100% LIVE)
// ─────────────────────────────────────────────────────────

interface InsuranceLine {
  id: string;
  queryParam: string;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  badge: string;
  statutoryBasis: string;
  headline: string;
  description: string;
  capabilities: string[];
  status: 'live';
  statusLabel: string;
}

const INSURANCE_LINES: InsuranceLine[] = [
  {
    id: 'property',
    queryParam: 'fire',
    label: 'Fire & Property',
    shortLabel: 'Property',
    icon: <Flame className="w-3.5 h-3.5" aria-hidden="true" />,
    badge: 'BLUS / BSUS / SFSP',
    statutoryBasis: 'IIB Loss-Cost Circular & BIS IS 1893:2002',
    headline: 'Deterministic Statutory Fire Tariff & Loss Cost',
    description:
      'Full BLUS/BSUS statutory computation with IIB burning cost baseline cross-check, STFI peril pricing, and seismic earthquake zones I–IV risk mapping.',
    capabilities: [
      'ACORD 125 & SOV Parsing in 280ms',
      '47-attribute risk profile & hazard grading',
      'Statutory 15% underinsurance waiver detection',
      'Catastrophe zones (Cat 1–3) auto-adjustment',
      'Flatted factory & solvent storage rating',
    ],
    status: 'live',
    statusLabel: '100% LIVE',
  },
  {
    id: 'motor',
    queryParam: 'motor_fleet',
    label: 'Commercial Motor Fleet',
    shortLabel: 'Motor Fleet',
    icon: <Car className="w-3.5 h-3.5" aria-hidden="true" />,
    badge: 'AIMT GR.8 & TP Tariff',
    statutoryBasis: 'Motor Vehicles Act 1988 (Sec 146) & IMT Endorsements',
    headline: 'Fleet Schedule Ingestion & Mandatory TP Tariff',
    description:
      'Bulk vehicle schedule ingestion, statutory AIMT GR.8 age depreciation schedule (5% to 50%), non-discountable gazetted TP tariffs, and NCB ladder (0–50%).',
    capabilities: [
      'Multi-vehicle Excel/CSV schedule roster parser',
      'Statutory AIMT GR.8 IDV depreciation curves',
      'Immutable IRDAI TP tariffs by GVW and seating slabs',
      'Commercial IMT 23, Zero Dep, Consumables & RTI suite',
      'Fleet volume discount & adverse ICR loss loading',
    ],
    status: 'live',
    statusLabel: '100% LIVE',
  },
  {
    id: 'marine',
    queryParam: 'marine_cargo',
    label: 'Marine Cargo & Transit',
    shortLabel: 'Marine',
    icon: <Anchor className="w-3.5 h-3.5" aria-hidden="true" />,
    badge: 'ITC A/B/C & ICC A/B/C',
    statutoryBasis: 'Marine Insurance Act 1963 & Sec 64VB Compliance',
    headline: 'Inland Transit & Ocean Open Policy Automation',
    description:
      'Bill of Lading parsing, Incoterms CIF 110% valuation, Commodity Hazard Classes 1–4, and real-time Section 64VB Cash Deposit (CD) drawdown accounting.',
    capabilities: [
      'Commodity hazard rating (0.06‰ to 0.55‰)',
      'Incoterms CIF 110% statutory valuation markup',
      'Section 64VB cash deposit balance guardrails',
      'Ocean ICC A/B/C with War & Strikes (0.05‰)',
      'Monthly MOP declaration logging & balance warning',
    ],
    status: 'live',
    statusLabel: '100% LIVE',
  },
  {
    id: 'benefits',
    queryParam: 'benefits',
    label: 'Employee Benefits',
    shortLabel: 'Benefits',
    icon: <Heart className="w-3.5 h-3.5" aria-hidden="true" />,
    badge: 'GMC / GTLI / GPA / WC',
    statutoryBasis: 'EC Act 1923 Schedule IV & IALM 2012-14 Mortality',
    headline: 'Census Age-Banding & Statutory WC Rating',
    description:
      'Bulk employee census ingestion with automatic demographic age-banding, IALM 2012-14 GTLI mortality rates, and statutory Employees Compensation Act formula.',
    capabilities: [
      'Bulk census uploader auto-calculating demographic age bands',
      'GMC room rent, maternity Day-1 & corporate buffer',
      'IALM 2012-14 benchmark rates for Group Term Life',
      'EC Act statutory formula: 50%/60% × min(Wage, ₹15,000) × Factor',
      'GPA 24x7 worldwide cover across Hazard Classes I–III',
    ],
    status: 'live',
    statusLabel: '100% LIVE',
  },
  {
    id: 'engineering',
    queryParam: 'engineering',
    label: 'Engineering & Projects',
    shortLabel: 'Engineering',
    icon: <HardHat className="w-3.5 h-3.5" aria-hidden="true" />,
    badge: 'CAR / EAR / MB / EEI / BPP',
    statutoryBasis: 'Indian Boilers Act 1923 & Munich Re Project Tariffs',
    headline: 'Project Lifecycle, Machinery & Boiler Protection',
    description:
      'CAR/EAR civil vs plant split, testing duration loadings (0.75‰/mo), Fixed Asset Register (FAR) rollup, Machinery Breakdown Groups I–IV, and Indian Boilers Act BPP.',
    capabilities: [
      'FAR parser rolling up plant & machinery assets',
      'CAR/EAR testing duration & defect liability (DLP) loadings',
      'Machinery Breakdown (MB) CRV rating across Groups I–IV',
      'EEI Section 1 (Hardware), 2 (Data Media), 3 (ICOW)',
      'Indian Boilers Act 1923 explosion & high pressure (>20 bar)',
    ],
    status: 'live',
    statusLabel: '100% LIVE',
  },
  {
    id: 'liability',
    queryParam: 'liability',
    label: 'Corporate Liability',
    shortLabel: 'Liability',
    icon: <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />,
    badge: 'CGL / PI / D&O / Cyber / Crime',
    statutoryBasis: 'IRDAI Broker PI Regs, Companies Act & DPDP Act 2023',
    headline: 'Executive Protection & 100-Point Cyber Scoring',
    description:
      'CGL turnover rating with AOA:AOY limit ratios (1:1 to 1:4), statutory broker PI indemnity check, D&O Side A/B/C pricing, and DPDP Act 2023 cyber posture matrix.',
    capabilities: [
      'CGL turnover rating with AOA:AOY limit ratios (1:1 to 1:4)',
      'Statutory broker PI floor: max(₹50L, 3× annual fee income)',
      'D&O Side A/B/C pricing for private vs public listed firms',
      '100-point cyber posture scoring (MFA hard gating)',
      'Commercial crime & employee dishonesty dual controls',
    ],
    status: 'live',
    statusLabel: '100% LIVE',
  },
  {
    id: 'specialty',
    queryParam: 'specialty',
    label: 'Financial & Specialty',
    shortLabel: 'Specialty',
    icon: <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />,
    badge: 'Surety / TCI / Burglary',
    statutoryBasis: 'GFR 2017 Rules 170/171 & IRDAI Surety Guidelines 2022',
    headline: 'GFR Surety Bonds & Trade Credit Insurance',
    description:
      'Bid, Performance, Advance Payment, and Retention bonds replacing bank guarantees under GFR 170/171 rated by contractor grade (AAA to BB), plus Trade Credit Insurance.',
    capabilities: [
      'Surety bond underwriting (Bid, Performance, Advance, Retention)',
      'Contractor financial grading (AAA to BB) & net worth limits',
      'Trade Credit receivables default rating & buyer concentration',
      'IRDAI indemnity clamping (85%–90% maximum indemnity)',
      'Commercial Burglary first loss rating (25% to 100%)',
    ],
    status: 'live',
    statusLabel: '100% LIVE',
  },
];

// ─────────────────────────────────────────────────────────
//  WAI-ARIA COMPLIANT MULTI-LINE TAB SWITCHER
// ─────────────────────────────────────────────────────────

function MultiLineTabSwitcher() {
  const [activeId, setActiveId] = useState<string>('property');
  const activeLine = INSURANCE_LINES.find((l) => l.id === activeId) ?? INSURANCE_LINES[0];

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIndex = (index + 1) % INSURANCE_LINES.length;
      setActiveId(INSURANCE_LINES[nextIndex].id);
      document.getElementById(`tab-${INSURANCE_LINES[nextIndex].id}`)?.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIndex = (index - 1 + INSURANCE_LINES.length) % INSURANCE_LINES.length;
      setActiveId(INSURANCE_LINES[prevIndex].id);
      document.getElementById(`tab-${INSURANCE_LINES[prevIndex].id}`)?.focus();
    }
  };

  return (
    <div className="w-full flex flex-col gap-2.5">
      {/* WAI-ARIA Accessible Tabstrip */}
      <div
        role="tablist"
        aria-label="Commercial Insurance Lines of Business"
        className="flex flex-wrap gap-1.5"
      >
        {INSURANCE_LINES.map((line, idx) => {
          const isSelected = activeId === line.id;
          return (
            <button
              key={line.id}
              id={`tab-${line.id}`}
              role="tab"
              aria-selected={isSelected}
              aria-controls={`panel-${line.id}`}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => setActiveId(line.id)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5132] focus-visible:ring-offset-2 ${
                isSelected
                  ? 'bg-[#0F5132] text-white shadow-md'
                  : 'bg-white/80 text-[#374151] hover:text-[#121316] hover:bg-white border border-[#121316]/10'
              }`}
            >
              {line.icon}
              <span>{line.shortLabel}</span>
            </button>
          );
        })}
      </div>

      {/* WAI-ARIA Accessible Tab Panel with min-h to prevent CLS */}
      <div
        id={`panel-${activeLine.id}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeLine.id}`}
        tabIndex={0}
        className="min-h-[225px] bg-white/95 backdrop-blur-xl border border-[#121316]/10 rounded-2xl p-4 shadow-[0_12px_28px_rgba(0,0,0,0.06),0_0_0_1px_rgba(255,255,255,0.8)_inset] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5132] flex flex-col justify-between"
      >
        <div>
          <div className="flex items-start justify-between mb-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono font-bold bg-[#0F5132]/10 text-[#0F5132] px-2 py-0.5 rounded-md">
                {activeLine.badge}
              </span>
              <span className="text-[10px] font-mono font-bold bg-[#15803d]/15 text-[#15803d] px-2 py-0.5 rounded-full border border-[#15803d]/30">
                {activeLine.statusLabel}
              </span>
            </div>
            <span className="text-[9px] font-mono text-[#4B5563] text-right max-w-[190px]">
              {activeLine.statutoryBasis}
            </span>
          </div>

          <h3 className="text-sm font-black text-[#121316] mb-1">{activeLine.headline}</h3>
          <p className="text-[11px] text-[#4B5563] leading-relaxed mb-3">{activeLine.description}</p>

          <div className="space-y-1 mb-3">
            {activeLine.capabilities.slice(0, 3).map((cap) => (
              <div key={cap} className="flex items-center gap-2">
                <ChevronRight className="w-3 h-3 text-[#15803d] shrink-0" aria-hidden="true" />
                <span className="text-[11px] font-medium text-[#121316]">{cap}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Link to Line Underwriting Studio */}
        <div className="pt-2 border-t border-[#121316]/8 flex items-center justify-between">
          <span className="text-[10px] font-mono text-[#4B5563]">Instant Underwriting Slip</span>
          <Link
            href={`/quotes/new?line=${activeLine.queryParam}`}
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#0F5132] hover:text-[#15803d] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5132]"
          >
            <span>Launch {activeLine.shortLabel} Studio</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  INTERACTIVE STATUTORY RATE VERIFIER (ACT III)
// ─────────────────────────────────────────────────────────

function InteractiveRateVerifier() {
  const [occupancy, setOccupancy] = useState<'flatted' | 'chemical' | 'engineering' | 'commercial'>('flatted');
  const [sumInsuredCr, setSumInsuredCr] = useState<number>(50);
  const [zone, setZone] = useState<'zone1' | 'zone2' | 'zone3' | 'zone4'>('zone3');
  const [includeSTFI, setIncludeSTFI] = useState<boolean>(true);

  // Rate parameters per occupancy
  const OCCUPANCY_DATA = {
    flatted: { label: 'Flatted Factory / Textile', baseRate: 0.042, stfiRate: 0.010 },
    chemical: { label: 'Chemical & Solvents', baseRate: 0.088, stfiRate: 0.016 },
    engineering: { label: 'Heavy Engineering', baseRate: 0.052, stfiRate: 0.012 },
    commercial: { label: 'Commercial IT Park', baseRate: 0.024, stfiRate: 0.007 },
  };

  const ZONE_RATES = {
    zone1: 0.012,
    zone2: 0.007,
    zone3: 0.003,
    zone4: 0.001,
  };

  const currentOcc = OCCUPANCY_DATA[occupancy];
  const baseRate = currentOcc.baseRate;
  const zoneRate = ZONE_RATES[zone];
  const stfiRate = includeSTFI ? currentOcc.stfiRate : 0;
  const totalRatePct = +(baseRate + zoneRate + stfiRate).toFixed(4);

  const totalSIInRupees = sumInsuredCr * 10000000;
  const netPremium = Math.round((totalSIInRupees * totalRatePct) / 100);
  const brokerageEarn = Math.round(netPremium * 0.15);

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="bg-white/90 backdrop-blur-xl border border-[#121316]/10 rounded-3xl p-5 shadow-[0_16px_36px_rgba(0,0,0,0.06),0_0_0_1px_rgba(255,255,255,0.8)_inset]">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#121316]/8">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#0F5132]" />
          <span className="text-xs font-mono font-bold tracking-wider text-[#121316] uppercase">
            Live Rate Verifier
          </span>
        </div>
        <span className="text-[10px] font-mono font-bold bg-[#0F5132]/10 text-[#0F5132] px-2 py-0.5 rounded-full border border-[#0F5132]/20">
          IIB STATUTORY PARITY
        </span>
      </div>

      {/* Occupancy Selector */}
      <div className="mb-3">
        <label className="text-[10px] font-mono uppercase tracking-wider text-[#4B5563] block mb-1.5">
          Select Occupancy Type
        </label>
        <div role="radiogroup" aria-label="Occupancy Type" className="grid grid-cols-2 gap-1.5">
          {(
            [
              ['flatted', 'Flatted Factory'],
              ['chemical', 'Chemical Storage'],
              ['engineering', 'Heavy Engg'],
              ['commercial', 'IT / Commercial'],
            ] as const
          ).map(([key, name]) => (
            <button
              key={key}
              role="radio"
              aria-checked={occupancy === key}
              onClick={() => setOccupancy(key)}
              className={`text-left px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5132] ${
                occupancy === key
                  ? 'bg-[#0F5132] text-white shadow-xs'
                  : 'bg-[#FBF9F5] text-[#121316] hover:bg-white border border-[#121316]/5'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Sum Insured Slider / Chips */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#4B5563] mb-1.5">
          <span>Sum Insured (SI)</span>
          <span className="text-xs font-bold text-[#0F5132]">₹{sumInsuredCr} Cr</span>
        </div>
        <div role="radiogroup" aria-label="Sum Insured in Crores" className="flex gap-1.5">
          {[25, 50, 100, 250].map((si) => (
            <button
              key={si}
              role="radio"
              aria-checked={sumInsuredCr === si}
              onClick={() => setSumInsuredCr(si)}
              className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5132] ${
                sumInsuredCr === si
                  ? 'bg-[#121316] text-white shadow-xs'
                  : 'bg-[#FBF9F5] text-[#4B5563] hover:bg-white border border-[#121316]/5'
              }`}
            >
              ₹{si}Cr
            </button>
          ))}
        </div>
      </div>

      {/* Zone & STFI Row */}
      <div className="grid grid-cols-2 gap-2 mb-3.5">
        <div>
          <label className="text-[9px] font-mono uppercase tracking-wider text-[#4B5563] block mb-1">
            EQ Zone (BIS IS 1893)
          </label>
          <div role="radiogroup" aria-label="Earthquake Risk Zone" className="flex gap-1">
            {(['zone1', 'zone2', 'zone3', 'zone4'] as const).map((z, idx) => (
              <button
                key={z}
                role="radio"
                aria-checked={zone === z}
                onClick={() => setZone(z)}
                className={`flex-1 py-1 text-[9px] font-mono font-bold rounded-md transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5132] ${
                  zone === z
                    ? 'bg-[#0F5132] text-white'
                    : 'bg-[#FBF9F5] text-[#4B5563] border border-[#121316]/5'
                }`}
              >
                Z{idx + 1}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[9px] font-mono uppercase tracking-wider text-[#4B5563] block mb-1">
            STFI Peril Cover
          </label>
          <button
            onClick={() => setIncludeSTFI(!includeSTFI)}
            aria-pressed={includeSTFI}
            className={`w-full py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5132] ${
              includeSTFI
                ? 'bg-[#15803d]/15 text-[#0F5132] border border-[#15803d]/30'
                : 'bg-[#FBF9F5] text-[#4B5563] border border-[#121316]/5'
            }`}
          >
            {includeSTFI ? '✓ Included (+STFI)' : '✕ Excluded'}
          </button>
        </div>
      </div>

      {/* Dynamic Results Grid */}
      <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-[#FBF9F5] border border-[#121316]/8 mb-2">
        <div>
          <div className="text-[9px] text-[#4B5563] font-medium">Combined Rate</div>
          <div className="text-sm font-black text-[#121316] font-mono tabular-nums">{totalRatePct}%</div>
          <div className="text-[9px] text-[#4B5563]">Loss-Cost + STFI + EQ</div>
        </div>
        <div>
          <div className="text-[9px] text-[#4B5563] font-medium">Net Statutory Premium</div>
          <div className="text-sm font-black text-[#0F5132] font-mono tabular-nums">{formatINR(netPremium)}</div>
          <div className="text-[9px] text-[#15803d] font-bold">Excl. 18% GST</div>
        </div>
      </div>

      {/* Brokerage Yield Callout */}
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-[#0F5132]/10 to-[#15803d]/15 border border-[#15803d]/25">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-[#0F5132]" />
          <span className="text-[11px] font-bold text-[#0F5132]">Estimated Brokerage Revenue (15%):</span>
        </div>
        <span className="text-xs font-black text-[#0F5132] font-mono tabular-nums">{formatINR(brokerageEarn)}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  MAIN OVERLAY
// ─────────────────────────────────────────────────────────

export const ScrollytellingOverlay: React.FC<ScrollytellingOverlayProps> = ({
  onBookDemo,
  onExploreWorkflows,
  activeSection = 0,
}) => {
  const currentSection = activeSection;

  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">

      {/* =========================================================================
          SECTION 1 — ACT I: THE HERO ENTRY (0% Snap) — Resting Frame 0
          LEFT FLANK: "Elevate Your Brokerage" / CTAs / Telemetry HUD / Trust pills
          RIGHT SPINE: Character hovers confidently (cx ≈ 973) — "waiting for a command"
      ========================================================================= */}
      <div
        id="section-hero"
        style={{ opacity: 1, transform: 'translate3d(0, 0px, 0)', pointerEvents: 'auto' }}
        className="absolute inset-0 flex items-center justify-between px-6 sm:px-12 md:px-16 lg:px-20"
      >
        {/* Left Flank */}
        <div className="max-w-2xl pt-14 z-30">
          <div className="flex flex-col items-start text-left">

            {/* Pill badge with live radar ping */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0F5132]/10 border border-[#0F5132]/20 text-[#0F5132] text-xs font-bold tracking-wider uppercase mb-5 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#15803d] animate-pulse" />
              <span>DETERMINISTIC UNDERWRITING ENGINE // IIB SCHEDULE 3 PARITY</span>
            </div>

            {/* Hero Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-[-0.03em] text-[#121316] leading-[1.08] mb-5">
              Elevate Your Brokerage.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0F5132] via-[#15803d] to-[#10B981]">
                The Commercial Insurance OS.
              </span>
            </h1>

            {/* Sub-headline */}
            <p className="text-sm sm:text-base text-[#4B5563] font-normal leading-relaxed mb-7 max-w-xl">
              Automate multi-line commercial placements across all 7 Indian insurance domains. 
              Deterministic statutory tariff verification, instant SOV parsing, and compliance-ready quote slips in seconds.
            </p>

            {/* Dual Action CTAs */}
            <div className="flex flex-wrap items-center gap-4 mb-8 pointer-events-auto">
              <button
                onClick={onBookDemo}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#0F5132] hover:bg-[#146c43] active:scale-[0.98] text-white text-sm font-bold tracking-tight shadow-[0_4px_20px_rgba(15,81,50,0.25)] hover:shadow-[0_6px_24px_rgba(15,81,50,0.35)] transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5132]"
              >
                <span>Book Broker Walkthrough</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onExploreWorkflows}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white/80 hover:bg-white text-[#121316] border border-[#121316]/10 text-sm font-bold tracking-tight shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5132]"
              >
                <span>Explore 7 Live Lines</span>
              </button>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#4B5563]">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#0F5132]" />
                <span>IRDAI Broker Regulations 2018</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[#0F5132]" />
                <span>IIB Burning Cost Cross-Check</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-[#0F5132]" />
                <span>DPDP Act 2023 Compliant</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Spine HUD */}
        <div className="hidden lg:flex flex-col items-end max-w-xs pt-14 z-30 pointer-events-auto">
          <div className="w-full bg-white/80 backdrop-blur-xl border border-[#121316]/10 rounded-2xl p-4 shadow-[0_12px_28px_rgba(0,0,0,0.06),0_0_0_1px_rgba(255,255,255,0.8)_inset]">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#121316]/8 text-[11px] font-mono text-[#4B5563]">
              <span>ACTIVE ENGINE</span>
              <span className="font-bold text-[#0F5132]">ZEPHYR 3.0</span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#4B5563]">Sum Insured Capacity:</span>
                <span className="font-mono font-bold text-[#121316]">₹500+ Cr</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4B5563]">Tariff Precision:</span>
                <span className="font-mono font-bold text-[#0F5132]">100% Deterministic</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4B5563]">Lines of Business:</span>
                <span className="font-mono font-bold text-[#15803d]">7 / 7 Operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 2 — ACT II: THE DIVE INTO DATA (33.33% Snap) — Resting Frame 69
          LEFT FLANK: Document Ingestion Telemetry
          RIGHT FLANK: Omni-Line Underwriting OS (All 7 Lines 100% Live)
      ========================================================================= */}
      <div
        id="section-workflows"
        style={{ opacity: 0, transform: 'translate3d(0, -14px, 0)', pointerEvents: 'none' }}
        className="absolute inset-0 flex items-center justify-between px-6 sm:px-10 md:px-14 lg:px-18"
      >
        {/* Left Flank: Document Ingestion Telemetry */}
        <div className="max-w-[390px] pt-14 z-30 pointer-events-auto">
          <div className="flex flex-col items-start text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#15803d]/10 border border-[#15803d]/25 text-[#0F5132] text-xs font-bold tracking-wider uppercase mb-3">
              <Zap className="w-3.5 h-3.5 text-[#0F5132]" />
              <span>STATUTORY BROKER DATA EXTRACTION</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black tracking-[-0.03em] text-[#121316] leading-[1.12] mb-3">
              Dive into data.<br />Automate every line.
            </h2>

            <p className="text-xs sm:text-sm text-[#4B5563] font-normal leading-relaxed mb-4">
              Upload raw broker PDFs, ACORD forms, or insurer schedules. Qoutely normalizes 47+ risk attributes in 280ms — fully auditable, zero manual typing.
            </p>

            {/* Dense Ingestion Terminal Card */}
            <div className="w-full bg-white/90 backdrop-blur-xl border border-[#121316]/10 rounded-2xl p-4 shadow-[0_12px_28px_rgba(0,0,0,0.06),0_0_0_1px_rgba(255,255,255,0.8)_inset]">
              <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#121316]/6">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#121316]">
                  <FileText className="w-3.5 h-3.5 text-[#0F5132]" />
                  <span>ACORD 125 INGESTION</span>
                </div>
                <span className="text-[9px] font-mono font-bold bg-[#15803d]/15 text-[#0F5132] px-2 py-0.5 rounded-full border border-[#15803d]/30">
                  PARSED (280ms)
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between py-1.5 px-2.5 rounded-xl bg-[#FBF9F5] border border-[#121316]/5">
                  <span className="text-[#4B5563] text-[11px] font-medium">Risk Profile</span>
                  <span className="font-semibold text-[11px] text-[#0F5132]">47 Attributes Mapped</span>
                </div>
                <div className="flex items-center justify-between py-1.5 px-2.5 rounded-xl bg-[#FBF9F5] border border-[#121316]/5">
                  <span className="text-[#4B5563] text-[11px] font-medium">Hazard &amp; Fire-Load</span>
                  <span className="font-semibold text-[11px] text-[#0F5132]">Cat 2 Adjusted</span>
                </div>
                <div className="flex items-center justify-between py-1.5 px-2.5 rounded-xl bg-[#FBF9F5] border border-[#121316]/5">
                  <span className="text-[#4B5563] text-[11px] font-medium">Underinsurance</span>
                  <span className="font-semibold text-[11px] text-[#0F5132]">15% Waiver Applied</span>
                </div>
                <div className="flex items-center justify-between py-1.5 px-2.5 rounded-xl bg-[#FBF9F5] border border-[#121316]/5">
                  <span className="text-[#4B5563] text-[11px] font-medium">SOV Normalization</span>
                  <span className="font-semibold text-[11px] text-[#0F5132]">Reconciled</span>
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-[#121316]/6 flex items-center justify-between text-[10px] text-[#4B5563]">
                <span>OCR + Underwriting RAG</span>
                <span className="font-mono text-[#0F5132] font-bold">100% AUDITABLE</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Flank: Modular "All-Lines" Architecture */}
        <div className="hidden lg:flex flex-col max-w-[420px] w-full ml-auto pt-14 z-30 pointer-events-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#0F5132]">
              Modular Omni-Line Architecture
            </span>
            <span className="text-[10px] font-mono text-[#4B5563] font-semibold">7 Lines 100% LIVE</span>
          </div>

          <MultiLineTabSwitcher />

          {/* Quick trust strip */}
          <div className="mt-3 flex items-center justify-between text-[11px] text-[#4B5563] px-2">
            <span className="flex items-center gap-1 font-medium">
              <Check className="w-3 h-3 text-[#15803d]" /> 3-yr Claims Triage
            </span>
            <span className="flex items-center gap-1 font-medium">
              <Check className="w-3 h-3 text-[#15803d]" /> Multi-Appetite Fit
            </span>
            <span className="flex items-center gap-1 font-medium">
              <Check className="w-3 h-3 text-[#15803d]" /> Instant Export
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 3 — ACT III: STATUTORY RATE & APPETITE (66.66% Snap) — Resting Frame 148
          LEFT FLANK: Glassmorphic Pedestal + Copilot HUD
          RIGHT FLANK: Interactive Rate Verifier + Carrier Appetite Matrix
      ========================================================================= */}
      <div
        id="section-carrier"
        style={{ opacity: 0, transform: 'translate3d(0, -14px, 0)', pointerEvents: 'none' }}
        className="absolute inset-0 flex items-center justify-between px-6 sm:px-10 md:px-14 lg:px-18"
      >
        {/* Left Flank: Glassmorphic Pedestal Dock */}
        <div className="hidden lg:flex flex-col items-start max-w-[340px] pt-14 z-30 pointer-events-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0F5132]/10 border border-[#0F5132]/20 text-[#0F5132] text-xs font-bold tracking-wider uppercase mb-4">
            <Cpu className="w-3.5 h-3.5 text-[#0F5132]" />
            <span>STATUTORY RATE &amp; APPETITE ENGINE</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-[-0.03em] text-[#121316] leading-tight mb-3">
            Deterministic Rate Engine.<br />Real-time statutory verification.
          </h2>

          <p className="text-xs text-[#4B5563] leading-relaxed mb-6">
            Cross-referencing tariff rates against IIB statutory loss cost baselines, Section 64VB cash deposits, and carrier underwriting guidelines.
          </p>

          {/* Frosted Pedestal Base indicator */}
          <div className="w-full bg-white/80 backdrop-blur-xl border border-[#0F5132]/20 rounded-2xl p-4 shadow-[0_12px_28px_rgba(15,81,50,0.08),0_0_0_1px_rgba(255,255,255,0.8)_inset]">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#15803d] animate-ping" />
              <span className="text-[10px] font-mono font-bold text-[#0F5132] uppercase tracking-wider">
                IIB Tariff Baseline Cross-Check // Active
              </span>
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between text-[#4B5563]">
                <span>IRDAI Baseline Loss Cost:</span>
                <span className="font-mono font-bold text-[#121316]">VERIFIED</span>
              </div>
              <div className="flex justify-between text-[#4B5563]">
                <span>Hazard Classification:</span>
                <span className="font-mono font-bold text-[#0F5132]">Category II Occupancy</span>
              </div>
              <div className="flex justify-between text-[#4B5563]">
                <span>Underwriting Appetite Fit:</span>
                <span className="font-mono font-bold text-[#15803d]">96.8% Overall</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Flank: Interactive Rate Verifier & Carrier Appetite Matrix */}
        <div className="max-w-[460px] w-full ml-auto pt-14 z-30 pointer-events-auto flex flex-col gap-3">
          <InteractiveRateVerifier />

          {/* Carrier Appetite Matrix mini-grid */}
          <div className="bg-white/80 backdrop-blur-xl border border-[#121316]/10 rounded-2xl p-3.5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#121316]">
                <Activity className="w-3.5 h-3.5 text-[#0F5132]" />
                <span>CARRIER APPETITE FIT</span>
              </div>
              <span className="text-[9px] font-mono font-bold text-[#0F5132] bg-[#0F5132]/10 px-2 py-0.5 rounded-full border border-[#0F5132]/20">
                INSTANT DISPATCH READY
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { name: 'Tata AIG', score: '98%', highlight: 'Preferred for Industrial & Mega Risk' },
                { name: 'ICICI Lombard', score: '95%', highlight: 'Fast-track STFI & CAR/EAR' },
                { name: 'New India Assurance', score: '92%', highlight: 'Statutory IIB loss cost baseline' },
                { name: 'Bajaj Allianz', score: '89%', highlight: 'Competitive Cat 1–2 Floater' },
              ].map((c) => (
                <div key={c.name} className="p-2 rounded-xl bg-[#FBF9F5] border border-[#121316]/5">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-bold text-[#121316] text-[11px]">{c.name}</span>
                    <span className="font-mono font-bold text-[#0F5132] text-[11px] tabular-nums">{c.score}</span>
                  </div>
                  <div className="text-[9px] text-[#4B5563]">{c.highlight}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 4 — ACT IV: INSTITUTIONAL COMMERCIAL PRICING (100% Snap) — Resting Frame 214
          CENTER SPINE: Character rests upright centered above Pricing Tiers (cx ≈ 646)
          LEFT FLANK: Practice / Independent Broker (₹4,999/mo)
          RIGHT FLANK: Growth Commercial Brokerage (₹14,999/mo — Most Popular)
          FAR RIGHT / ENTERPRISE: Institutional Syndicate (Custom)
      ========================================================================= */}
      <div
        id="section-landing"
        style={{ opacity: 0, transform: 'translate3d(0, -14px, 0)', pointerEvents: 'none' }}
        className="absolute inset-0 flex flex-col justify-between px-6 sm:px-10 md:px-14 lg:px-20 pt-16 pb-6"
      >
        {/* Top: Pricing Header */}
        <div className="w-full flex flex-col items-center text-center z-30 pt-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#0F5132]/10 border border-[#0F5132]/20 text-[#0F5132] text-xs font-bold tracking-wider uppercase mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#0F5132]" />
            <span>TRANSPARENT INSTITUTIONAL COMMERCIAL PRICING</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-[-0.03em] text-[#121316] leading-tight">
            Scale your commercial brokerage.
          </h2>
          <p className="text-xs sm:text-sm text-[#4B5563] mt-1 max-w-lg">
            Institutional tiering calibrated for commercial volume, underwriting seats, and multi-line risk portfolios.
          </p>
        </div>

        {/* Middle: SaaS Pricing Cards Flanking the Resting Mascot */}
        <div className="w-full grid grid-cols-1 md:grid-cols-[1fr_200px_1fr] gap-4 items-center z-30 my-auto pointer-events-auto">

          {/* Left Flank: INDEPENDENT BROKER (₹4,999/mo) */}
          <div className="w-full max-w-sm mx-auto md:mx-0 md:ml-auto bg-white/90 backdrop-blur-xl border border-[#121316]/10 rounded-3xl p-6 shadow-[0_16px_36px_rgba(0,0,0,0.06),0_0_0_1px_rgba(255,255,255,0.8)_inset] hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)] transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold tracking-wider uppercase text-[#4B5563]">PRACTICE</span>
              <span className="text-[10px] font-mono font-semibold bg-[#121316]/5 text-[#4B5563] px-2 py-0.5 rounded-full">
                Independent Broker
              </span>
            </div>

            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-3xl font-black text-[#121316] tabular-nums">₹4,999</span>
              <span className="text-xs font-semibold text-[#4B5563]">/ month</span>
            </div>

            <p className="text-xs text-[#4B5563] mb-4">
              Essential underwriting automation for boutique commercial practices.
            </p>

            <div className="space-y-2 mb-5 text-xs text-[#121316]">
              {[
                'Up to 3 Underwriter Seats',
                '100 Commercial Quotes / mo',
                'Fire (BLUS/BSUS) & Marine Cargo',
                'ACORD 125 & SOV Ingestion Parser',
                'Standard IRDAI Tariff Verification',
                'Client WhatsApp & Email Alerts',
              ].map((feat) => (
                <div key={feat} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#15803d] shrink-0" />
                  <span className="font-medium">{feat}</span>
                </div>
              ))}
            </div>

            <button
              onClick={onBookDemo}
              className="w-full py-2.5 px-4 rounded-xl border border-[#121316]/15 hover:border-[#121316] text-[#121316] font-bold text-xs hover:bg-[#121316]/5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5132]"
            >
              Get Started with Practice
            </button>
          </div>

          {/* Center Column: Resting Mascot Pedestal & ROI Callout */}
          <div className="hidden md:flex flex-col items-center justify-end h-full pb-2 pointer-events-none">
            <div className="px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-[#0F5132]/25 text-[10px] font-mono font-bold text-[#0F5132] shadow-xs text-center">
              10× ROI in Month 1
            </div>
            <div className="w-28 h-1.5 rounded-full bg-gradient-to-r from-transparent via-[#0F5132]/30 to-transparent blur-xs mt-2" />
          </div>

          {/* Right Flank: GROWTH COMMERCIAL (₹14,999/mo — Most Popular) */}
          <div className="w-full max-w-sm mx-auto md:mr-0 md:ml-0 bg-white/95 backdrop-blur-xl border border-[#0F5132]/30 rounded-3xl p-6 shadow-[0_20px_45px_rgba(15,81,50,0.1),0_0_0_1px_rgba(15,81,50,0.2)_inset] hover:shadow-[0_25px_50px_rgba(15,81,50,0.15)] transition-all relative">
            <div className="absolute -top-3 right-6 bg-[#0F5132] text-white text-[10px] font-bold tracking-wider uppercase px-3 py-1 rounded-full shadow-sm">
              MOST POPULAR
            </div>

            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold tracking-wider uppercase text-[#0F5132]">COMMERCIAL BROKERAGE</span>
              <span className="text-[10px] font-mono font-semibold bg-[#0F5132]/10 text-[#0F5132] px-2 py-0.5 rounded-full">
                All 7 Lines LIVE
              </span>
            </div>

            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-3xl font-black text-[#121316] tabular-nums">₹14,999</span>
              <span className="text-xs font-semibold text-[#4B5563]">/ month</span>
            </div>

            <p className="text-xs text-[#4B5563] mb-4">
              Complete omni-line AI underwriting OS across all 7 Indian commercial domains.
            </p>

            <div className="space-y-2 mb-5 text-xs text-[#121316]">
              {[
                'Unlimited Underwriter Seats',
                'All 7 Lines of Business (100% LIVE)',
                'Bulk Census (GMC) & Fleet Schedule Parsers',
                'IIB Baseline Parity & GFR 170/171 Surety',
                'Multi-tenancy RBAC & Complete Audit Logs',
                'Dedicated Account Manager & 99.9% SLA',
              ].map((feat) => (
                <div key={feat} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#15803d] shrink-0" />
                  <span className="font-semibold">{feat}</span>
                </div>
              ))}
            </div>

            <button
              onClick={onBookDemo}
              className="w-full py-2.5 px-4 rounded-xl bg-[#0F5132] hover:bg-[#146c43] active:scale-[0.98] text-white font-bold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5132]"
            >
              <span>Upgrade to Commercial</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bottom: Institutional Security & Compliance Trust Footer */}
        <div className="w-full z-30 pt-2 border-t border-[#121316]/8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#4B5563]">
          <div className="flex items-center gap-5 mb-2 sm:mb-0">
            <div className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#0F5132]" />
              <span>AES-256 GCM Encryption</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0F5132]" />
              <span>IRDAI Tariff Compliant</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-[#0F5132]" />
              <span>Tenant-Isolated Database</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span>&copy; {new Date().getFullYear()} Qoutely Technologies Private Limited. All rights reserved.</span>
          </div>
        </div>
      </div>

      {/* Floating Section Navigation Indicators (Right edge) */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 hidden lg:flex flex-col items-center gap-3.5 bg-white/80 backdrop-blur-md px-2.5 py-4 rounded-full border border-[#121316]/10 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
        {[
          { idx: 0, label: 'Platform' },
          { idx: 1, label: 'Workflows' },
          { idx: 2, label: 'Appetite' },
          { idx: 3, label: 'Pricing' },
        ].map((item) => (
          <button
            key={item.idx}
            onClick={() => {
              const nav = (window as unknown as { __navigateToSection?: (i: number) => void }).__navigateToSection;
              if (nav) nav(item.idx);
            }}
            title={item.label}
            className={`group relative flex items-center justify-center transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5132] ${
              currentSection === item.idx ? 'w-4 h-4' : 'w-3 h-3'
            }`}
          >
            <span
              className={`rounded-full transition-all duration-300 ${
                currentSection === item.idx
                  ? 'w-3.5 h-3.5 bg-[#0F5132] shadow-[0_0_8px_rgba(15,81,50,0.5)]'
                  : 'w-2 h-2 bg-[#121316]/25 group-hover:bg-[#121316]/60 group-hover:scale-125'
              }`}
            />
            {/* Hover tooltip label */}
            <span className="absolute right-8 px-2.5 py-1 rounded-md bg-[#121316] text-white text-[11px] font-semibold opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
