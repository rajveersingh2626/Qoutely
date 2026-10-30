'use client';

import React, { useState } from 'react';
import { 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
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
  Globe,
  AlertCircle,
  HardHat,
  Heart,
  Car,
  ChevronRight,
  Sliders,
  DollarSign,
  TrendingUp,
} from 'lucide-react';

interface ScrollytellingOverlayProps {
  onBookDemo: () => void;
  onExploreWorkflows: () => void;
}

// ─────────────────────────────────────────────────────────
//  OMNI-LINE INSURANCE LINES DEFINITION
// ─────────────────────────────────────────────────────────

interface InsuranceLine {
  id: string;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  badge: string;
  headline: string;
  description: string;
  capabilities: string[];
  status: 'live' | 'beta' | 'coming-soon';
  statusLabel: string;
}

const INSURANCE_LINES: InsuranceLine[] = [
  {
    id: 'fire',
    label: 'Fire & Property',
    shortLabel: 'Fire',
    icon: <Flame className="w-3.5 h-3.5" />,
    badge: 'BLUS / BSUS',
    headline: 'Full Statutory Tariff Calculation',
    description: 'Automatic BLUS/BSUS loss-cost computation with IIB baseline cross-check, STFI add-on pricing, and earthquake zone risk mapping for all occupancy categories.',
    capabilities: [
      'ACORD 125 & SOV Parsing in 280ms',
      '47-attribute risk profile mapping',
      'Underinsurance waiver detection (15%)',
      'Catastrophe zone (Cat 1–3) auto-adjustment',
      'Flatted factory & storage hazard grading',
    ],
    status: 'live',
    statusLabel: 'LIVE',
  },
  {
    id: 'marine',
    label: 'Marine Cargo',
    shortLabel: 'Marine',
    icon: <Anchor className="w-3.5 h-3.5" />,
    badge: 'ICC A/B/C',
    headline: 'Open Cover & Voyage Policy Automation',
    description: 'AI parses Bill of Lading, voyage details, and commodity clauses to generate ICC A/B/C policy recommendations with accurate war and strike extensions.',
    capabilities: [
      'Bill of Lading data extraction & validation',
      'ICC clause recommendation engine (A/B/C)',
      'War & strikes premium computation',
      'Open cover declaration & fleet management',
      'Multimodal transit risk scoring & route triage',
    ],
    status: 'beta',
    statusLabel: 'BETA',
  },
  {
    id: 'cyber',
    label: 'Cyber',
    shortLabel: 'Cyber',
    icon: <Globe className="w-3.5 h-3.5" />,
    badge: 'ISO 27001',
    headline: 'Cyber Risk Quantification & Placement',
    description: 'Structured questionnaire ingestion for first-party and third-party cyber coverage. Risk scoring engine powered by CVE/CVSS exposure data and sector benchmarks.',
    capabilities: [
      'Cyber risk questionnaire parser',
      'First & third-party business interruption modeling',
      'Ransomware exposure quantification',
      'DPDP & GDPR compliance gap analysis',
      'Multi-carrier cyber appetite matching',
    ],
    status: 'coming-soon',
    statusLabel: 'COMING SOON',
  },
  {
    id: 'liability',
    label: 'Liability',
    shortLabel: 'Liability',
    icon: <AlertCircle className="w-3.5 h-3.5" />,
    badge: 'GL / PI / D&O',
    headline: 'Comprehensive Commercial Liability Automation',
    description: 'From General Liability to Professional Indemnity and Directors & Officers — AI structures declarations, limits, deductibles, and retroactive date analysis.',
    capabilities: [
      'CGL, PI, D&O declaration parsing',
      'Retroactive date & prior acts analysis',
      'Occurrence vs claims-made structure audit',
      'Limits adequacy & peer benchmarking',
      'Industry-specific exposure weighting',
    ],
    status: 'coming-soon',
    statusLabel: 'COMING SOON',
  },
  {
    id: 'engineering',
    label: 'Engineering',
    shortLabel: 'Engg.',
    icon: <HardHat className="w-3.5 h-3.5" />,
    badge: 'EAR / CAR / MB',
    headline: 'Project & Machinery Risk Intelligence',
    description: 'Erection All Risk, Contractors All Risk, and Machinery Breakdown policy structuring with automatic contract value parsing and sub-limit optimization.',
    capabilities: [
      'CAR / EAR contract value ingestion',
      'Advance loss of profit (ALOP) calculation',
      'Testing period & warranty coverage tracking',
      'Deductible structure optimization',
      'OEM serial number & machinery schedule audit',
    ],
    status: 'coming-soon',
    statusLabel: 'COMING SOON',
  },
  {
    id: 'health',
    label: 'Group Health',
    shortLabel: 'Health',
    icon: <Heart className="w-3.5 h-3.5" />,
    badge: 'GMC / GPA / GTL',
    headline: 'Employee Benefit Plan Structuring',
    description: 'Automates census ingestion, insured member classification, and benefit structure design for GMC, GPA, and GTL — with corporate payout reconciliation built in.',
    capabilities: [
      'Employee census ingestion & validation (Excel/CSV)',
      'GMC / GPA / GTL benefit design & grading',
      'Top-up & parent floater structuring',
      'Incurred claims ratio (ICR) trend projection',
      'Corporate payout reconciliation',
    ],
    status: 'coming-soon',
    statusLabel: 'COMING SOON',
  },
  {
    id: 'motor',
    label: 'Motor Fleet',
    shortLabel: 'Motor',
    icon: <Car className="w-3.5 h-3.5" />,
    badge: 'Fleet OD + TP',
    headline: 'Commercial Fleet Policy Automation at Scale',
    description: 'Multi-vehicle fleet schedule parsing, OD + TP premium computation per registration, and renewal management with automated endorsement tracking.',
    capabilities: [
      'Fleet schedule parsing (RC & chassis)',
      'OD + TP premium per-vehicle computation',
      'IDV auto-calculation & depreciation curves',
      'Fleet renewal bulk WhatsApp/email dispatch',
      'Endorsement & mid-term addition tracking',
    ],
    status: 'coming-soon',
    statusLabel: 'COMING SOON',
  },
];

function StatusBadge({ status, label }: { status: InsuranceLine['status']; label: string }) {
  if (status === 'live') {
    return (
      <span className="text-[9px] font-mono font-bold bg-[#00C853]/15 text-[#0F5132] px-2 py-0.5 rounded-full border border-[#00C853]/30">
        {label}
      </span>
    );
  }
  if (status === 'beta') {
    return (
      <span className="text-[9px] font-mono font-bold bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded-full border border-blue-500/20">
        {label}
      </span>
    );
  }
  return (
    <span className="text-[9px] font-mono font-bold bg-[#121316]/5 text-[#5A6065] px-2 py-0.5 rounded-full border border-[#121316]/10">
      {label}
    </span>
  );
}

function MultiLineTabSwitcher() {
  const [activeId, setActiveId] = useState<string>('fire');
  const activeLine = INSURANCE_LINES.find((l) => l.id === activeId) ?? INSURANCE_LINES[0];

  return (
    <div className="w-full flex flex-col gap-2.5">
      {/* Tab strip */}
      <div className="flex flex-wrap gap-1.5">
        {INSURANCE_LINES.map((line) => (
          <button
            key={line.id}
            onClick={() => setActiveId(line.id)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
              activeId === line.id
                ? 'bg-[#0F5132] text-white shadow-md'
                : 'bg-white/75 text-[#5A6065] hover:text-[#121316] hover:bg-white/95 border border-[#121316]/8'
            }`}
          >
            {line.icon}
            <span>{line.shortLabel}</span>
          </button>
        ))}
      </div>

      {/* Active Panel */}
      <div className="bg-white/90 backdrop-blur-xl border border-[#121316]/10 rounded-2xl p-4 shadow-[0_12px_28px_rgba(0,0,0,0.06),0_0_0_1px_rgba(255,255,255,0.8)_inset]">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold bg-[#0F5132]/10 text-[#0F5132] px-2 py-0.5 rounded-md">
              {activeLine.badge}
            </span>
            <StatusBadge status={activeLine.status} label={activeLine.statusLabel} />
          </div>
        </div>

        <h3 className="text-sm font-black text-[#121316] mb-1">{activeLine.headline}</h3>
        <p className="text-[11px] text-[#5A6065] leading-relaxed mb-3">{activeLine.description}</p>

        <div className="space-y-1">
          {activeLine.capabilities.map((cap) => (
            <div key={cap} className="flex items-center gap-2">
              <ChevronRight className="w-3 h-3 text-[#00C853] shrink-0" />
              <span className="text-[11px] font-medium text-[#121316]">{cap}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  INTERACTIVE RATE VERIFIER WIDGET (ACT III)
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
          <Sliders className="w-4 h-4 text-[#00C853]" />
          <span className="text-xs font-mono font-bold tracking-wider text-[#121316] uppercase">
            Live Rate Verifier
          </span>
        </div>
        <span className="text-[10px] font-mono font-bold bg-[#00C853]/15 text-[#0F5132] px-2 py-0.5 rounded-full">
          IIB STATUTORY PARITY
        </span>
      </div>

      {/* Occupancy Selector */}
      <div className="mb-3">
        <label className="text-[10px] font-mono uppercase tracking-wider text-[#5A6065] block mb-1.5">
          Select Occupancy Type
        </label>
        <div className="grid grid-cols-2 gap-1.5">
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
              onClick={() => setOccupancy(key)}
              className={`text-left px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
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
        <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#5A6065] mb-1.5">
          <span>Sum Insured (SI)</span>
          <span className="text-xs font-bold text-[#0F5132]">₹{sumInsuredCr} Cr</span>
        </div>
        <div className="flex gap-1.5">
          {[25, 50, 100, 250].map((si) => (
            <button
              key={si}
              onClick={() => setSumInsuredCr(si)}
              className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                sumInsuredCr === si
                  ? 'bg-[#121316] text-white shadow-xs'
                  : 'bg-[#FBF9F5] text-[#5A6065] hover:bg-white border border-[#121316]/5'
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
          <label className="text-[9px] font-mono uppercase tracking-wider text-[#5A6065] block mb-1">
            EQ Zone
          </label>
          <div className="flex gap-1">
            {(['zone1', 'zone2', 'zone3', 'zone4'] as const).map((z, idx) => (
              <button
                key={z}
                onClick={() => setZone(z)}
                className={`flex-1 py-1 text-[9px] font-mono font-bold rounded-md transition-all cursor-pointer ${
                  zone === z
                    ? 'bg-[#0F5132] text-white'
                    : 'bg-[#FBF9F5] text-[#5A6065] border border-[#121316]/5'
                }`}
              >
                Z{idx + 1}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[9px] font-mono uppercase tracking-wider text-[#5A6065] block mb-1">
            STFI Peril Cover
          </label>
          <button
            onClick={() => setIncludeSTFI(!includeSTFI)}
            className={`w-full py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
              includeSTFI
                ? 'bg-[#00C853]/15 text-[#0F5132] border border-[#00C853]/30'
                : 'bg-[#FBF9F5] text-[#5A6065] border border-[#121316]/5'
            }`}
          >
            {includeSTFI ? '✓ Included (+STFI)' : '✕ Excluded'}
          </button>
        </div>
      </div>

      {/* Dynamic Results Grid */}
      <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-[#FBF9F5] border border-[#121316]/8 mb-2">
        <div>
          <div className="text-[9px] text-[#5A6065] font-medium">Combined Rate</div>
          <div className="text-sm font-black text-[#121316] font-mono">{totalRatePct}%</div>
          <div className="text-[9px] text-[#5A6065]">Loss-Cost + STFI + EQ</div>
        </div>
        <div>
          <div className="text-[9px] text-[#5A6065] font-medium">Net Premium</div>
          <div className="text-sm font-black text-[#0F5132] font-mono">{formatINR(netPremium)}</div>
          <div className="text-[9px] text-[#00C853] font-semibold">Excl. 18% GST</div>
        </div>
      </div>

      {/* Brokerage Yield Callout */}
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-[#0F5132]/10 to-[#00C853]/15 border border-[#00C853]/25">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-[#00C853]" />
          <span className="text-[11px] font-bold text-[#0F5132]">Estimated Brokerage Revenue (15%):</span>
        </div>
        <span className="text-xs font-black text-[#0F5132] font-mono">{formatINR(brokerageEarn)}</span>
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
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">

      {/* =========================================================================
          SECTION 1 — ACT I: THE HERO ENTRY (0% Snap) — Resting Frame 0
          LEFT FLANK: "Elevate Your Brokerage" / CTAs / Telemetry HUD / Trust pills
          RIGHT SPINE: Character hovers confidently (cx ≈ 973) — "waiting for a command"
      ========================================================================= */}
      <div
        id="section-hero"
        style={{ opacity: 1, transform: 'translateY(0px)', pointerEvents: 'auto' }}
        className="absolute inset-0 flex items-center justify-between px-6 sm:px-12 md:px-16 lg:px-20 transition-all duration-150"
      >
        {/* ── Left Flank ── */}
        <div className="max-w-2xl pt-14 z-30">
          <div className="flex flex-col items-start text-left">

            {/* Pill badge with live radar ping */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0F5132]/10 border border-[#0F5132]/20 text-[#0F5132] text-xs font-bold tracking-wider uppercase mb-5 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#00C853] animate-pulse" />
              <span>AI UNDERWRITING COPILOT // STANDBY FOR DIRECTIVE</span>
            </div>

            {/* Headline matching mission spec: "Elevate Your Brokerage" */}
            <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-black tracking-tight text-[#121316] leading-[1.06] mb-5">
              Elevate Your Brokerage.<br />
              <span className="text-[#0F5132]">The AI Underwriting Copilot.</span>
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-lg text-[#5A6065] font-normal leading-relaxed mb-6 max-w-xl">
              Automate commercial policy comparisons, parse loss runs in seconds, and close deals 3× faster — across Fire (BLUS/BSUS), Marine, Cyber, Liability, and Engineering.
            </p>

            {/* CTA row */}
            <div className="flex flex-wrap items-center gap-4 mb-6 pointer-events-auto">
              <button
                onClick={onBookDemo}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-[#0F5132] hover:bg-[#146c43] active:scale-[0.98] text-white text-sm font-bold shadow-[0_4px_20px_rgba(15,81,50,0.25)] hover:shadow-[0_8px_25px_rgba(0,200,83,0.3)] transition-all duration-200 cursor-pointer"
              >
                <span>Book a Demo</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onExploreWorkflows}
                className="inline-flex items-center gap-1.5 text-sm font-bold text-[#121316] hover:text-[#0F5132] px-4 py-3 transition-colors cursor-pointer"
              >
                <span>Explore AI Engine</span>
                <ArrowRight className="w-4 h-4 text-[#5A6065]" />
              </button>
            </div>

            {/* Frosted Glass Telemetry HUD */}
            <div className="w-full max-w-xl bg-white/85 backdrop-blur-xl border border-[#121316]/10 rounded-2xl p-4 shadow-[0_12px_28px_rgba(0,0,0,0.04),0_0_0_1px_rgba(255,255,255,0.8)_inset] mb-5">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#121316]/5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00C853] animate-pulse" />
                  <span className="text-[11px] font-mono font-bold tracking-wider text-[#121316] uppercase">
                    Live Brokerage Telemetry
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-[#0F5132] bg-[#0F5132]/10 px-2 py-0.5 rounded-md">
                  BLUS / BSUS PARITY
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center sm:text-left">
                <div>
                  <div className="text-[10px] text-[#5A6065] font-medium">Placed SI Volume</div>
                  <div className="text-lg font-black text-[#121316]">₹420 Cr+</div>
                  <div className="text-[9px] text-[#00C853] font-semibold">Fire &amp; Special Perils</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#5A6065] font-medium">Loss-Run Triage</div>
                  <div className="text-lg font-black text-[#121316]">99.4%</div>
                  <div className="text-[9px] text-[#5A6065]">Automated Extraction</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#5A6065] font-medium">Avg Turnaround</div>
                  <div className="text-lg font-black text-[#121316]">14 min</div>
                  <div className="text-[9px] text-[#00C853] font-semibold">vs 4 days manual</div>
                </div>
              </div>
            </div>

            {/* Trust Pills */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#5A6065]">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/75 border border-[#121316]/8 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00C853]" />
                <span>99.4% Extraction Accuracy</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/75 border border-[#121316]/8 shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-[#00C853]" />
                <span>IRDAI Tariff Compliant</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/75 border border-[#121316]/8 shadow-2xs">
                <Zap className="w-3.5 h-3.5 text-[#00C853]" />
                <span>Zero Manual Typing</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right spine — open for mascot (cx ≈ 973) */}
        <div className="hidden lg:block w-72 pointer-events-none" />
      </div>


      {/* =========================================================================
          SECTION 2 — ACT II: THE DIVE INTO DATA (33.33% Snap) — Resting Frame 69
          LEFT FLANK: Zero Manual Entry + Document Extraction Telemetry
          CENTER SPINE: Character swoops aggressively forward and down into left corridor (cx ≈ 686)
          RIGHT FLANK: Omni-Line Underwriting OS (Fire, Marine, Cyber, Liability, Engg, Health, Motor)
      ========================================================================= */}
      <div
        id="section-workflows"
        style={{ opacity: 0, transform: 'translateY(-14px)', pointerEvents: 'none' }}
        className="absolute inset-0 flex items-center justify-between px-6 sm:px-10 md:px-14 lg:px-18 transition-all duration-150"
      >
        {/* Left Flank: Zero Manual Entry & Document Telemetry */}
        <div className="max-w-[390px] pt-14 z-30 pointer-events-auto">
          <div className="flex flex-col items-start text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#00C853]/10 border border-[#00C853]/25 text-[#0F5132] text-xs font-bold tracking-wider uppercase mb-3">
              <Zap className="w-3.5 h-3.5 text-[#00C853]" />
              <span>ZERO MANUAL DATA ENTRY</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[#121316] leading-[1.12] mb-3">
              Dive into data.<br />Automate every line.
            </h2>

            <p className="text-xs sm:text-sm text-[#5A6065] font-normal leading-relaxed mb-4">
              Upload raw broker PDFs, ACORD forms, or carrier schedules. Qoutely normalizes 47+ risk attributes in 280ms — fully auditable, zero manual typing.
            </p>

            {/* Dense Ingestion Terminal Card */}
            <div className="w-full bg-white/90 backdrop-blur-xl border border-[#121316]/10 rounded-2xl p-4 shadow-[0_12px_28px_rgba(0,0,0,0.06),0_0_0_1px_rgba(255,255,255,0.8)_inset]">
              <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#121316]/6">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#121316]">
                  <FileText className="w-3.5 h-3.5 text-[#0F5132]" />
                  <span>ACORD 125 INGESTION</span>
                </div>
                <span className="text-[9px] font-mono font-bold bg-[#00C853]/15 text-[#0F5132] px-2 py-0.5 rounded-full">
                  PARSED (280ms)
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between py-1.5 px-2.5 rounded-xl bg-[#FBF9F5] border border-[#121316]/5">
                  <span className="text-[#5A6065] text-[11px] font-medium">Risk Profile</span>
                  <span className="font-semibold text-[11px] text-[#0F5132]">47 Attributes Mapped</span>
                </div>
                <div className="flex items-center justify-between py-1.5 px-2.5 rounded-xl bg-[#FBF9F5] border border-[#121316]/5">
                  <span className="text-[#5A6065] text-[11px] font-medium">Hazard &amp; Fire-Load</span>
                  <span className="font-semibold text-[11px] text-[#0F5132]">Cat 2 Adjusted</span>
                </div>
                <div className="flex items-center justify-between py-1.5 px-2.5 rounded-xl bg-[#FBF9F5] border border-[#121316]/5">
                  <span className="text-[#5A6065] text-[11px] font-medium">Underinsurance</span>
                  <span className="font-semibold text-[11px] text-[#00C853]">15% Waiver Applied</span>
                </div>
                <div className="flex items-center justify-between py-1.5 px-2.5 rounded-xl bg-[#FBF9F5] border border-[#121316]/5">
                  <span className="text-[#5A6065] text-[11px] font-medium">SOV Normalization</span>
                  <span className="font-semibold text-[11px] text-[#0F5132]">Reconciled</span>
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-[#121316]/6 flex items-center justify-between text-[10px] text-[#5A6065]">
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
            <span className="text-[10px] font-mono text-[#5A6065]">7 Commercial Lines</span>
          </div>

          <MultiLineTabSwitcher />

          {/* Quick trust strip */}
          <div className="mt-3 flex items-center justify-between text-[11px] text-[#5A6065] px-2">
            <span className="flex items-center gap-1">
              <Check className="w-3 h-3 text-[#00C853]" /> 3-yr Claims Triage
            </span>
            <span className="flex items-center gap-1">
              <Check className="w-3 h-3 text-[#00C853]" /> Multi-Appetite Fit
            </span>
            <span className="flex items-center gap-1">
              <Check className="w-3 h-3 text-[#00C853]" /> Instant Export
            </span>
          </div>
        </div>
      </div>


      {/* =========================================================================
          SECTION 3 — ACT III: THE VERIFICATION DOCK (66.66% Snap) — Resting Frame 148
          LEFT FLANK: Glassmorphic Pedestal for character dock (cx ≈ 240) + Copilot HUD
          RIGHT FLANK: Interactive Rate Verifier + Carrier Appetite Matrix
      ========================================================================= */}
      <div
        id="section-carrier"
        style={{ opacity: 0, transform: 'translateY(-14px)', pointerEvents: 'none' }}
        className="absolute inset-0 flex items-center justify-between px-6 sm:px-10 md:px-14 lg:px-18 transition-all duration-150"
      >
        {/* Left Flank: Glassmorphic Pedestal Dock for Character */}
        <div className="hidden lg:flex flex-col items-start max-w-[340px] pt-14 z-30 pointer-events-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0F5132]/10 border border-[#0F5132]/20 text-[#0F5132] text-xs font-bold tracking-wider uppercase mb-4">
            <Cpu className="w-3.5 h-3.5 text-[#00C853]" />
            <span>THE VERIFICATION DOCK</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#121316] leading-tight mb-3">
            Docked &amp; watching.<br />Real-time statutory rate verification.
          </h2>

          <p className="text-xs text-[#5A6065] leading-relaxed mb-6">
            The copilot locks into its pedestal, cross-referencing tariff rates against IIB statutory baselines and carrier underwriting guidelines.
          </p>

          {/* Frosted Pedestal Base indicator aligned with mascot (cx ≈ 240, cy ≈ 377) */}
          <div className="w-full bg-white/80 backdrop-blur-xl border border-[#00C853]/30 rounded-2xl p-4 shadow-[0_12px_28px_rgba(0,200,83,0.1),0_0_0_1px_rgba(255,255,255,0.8)_inset]">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#00C853] animate-ping" />
              <span className="text-[10px] font-mono font-bold text-[#0F5132] uppercase tracking-wider">
                Copilot Dock Active // Watching Rates
              </span>
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between text-[#5A6065]">
                <span>IRDAI Baseline Loss Cost:</span>
                <span className="font-mono font-bold text-[#121316]">VERIFIED</span>
              </div>
              <div className="flex justify-between text-[#5A6065]">
                <span>Hazard Classification:</span>
                <span className="font-mono font-bold text-[#0F5132]">Category II</span>
              </div>
              <div className="flex justify-between text-[#5A6065]">
                <span>Underwriting Appetite Fit:</span>
                <span className="font-mono font-bold text-[#00C853]">96.8% Overall</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Flank: Interactive Rate Verifier & Carrier Appetite Matrix */}
        <div className="max-w-[460px] w-full ml-auto pt-14 z-30 pointer-events-auto flex flex-col gap-3">
          {/* Interactive Rate Verifier */}
          <InteractiveRateVerifier />

          {/* Carrier Appetite Matrix mini-grid */}
          <div className="bg-white/80 backdrop-blur-xl border border-[#121316]/10 rounded-2xl p-3.5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#121316]">
                <Activity className="w-3.5 h-3.5 text-[#00C853]" />
                <span>CARRIER APPETITE FIT</span>
              </div>
              <span className="text-[9px] font-mono font-bold text-[#0F5132] bg-[#00C853]/15 px-2 py-0.5 rounded-full">
                INSTANT DISPATCH READY
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { name: 'Tata AIG', score: '98%', highlight: 'Preferred for Industrial' },
                { name: 'ICICI Lombard', score: '95%', highlight: 'Fast-track STFI' },
                { name: 'New India', score: '92%', highlight: 'Statutory IIB loss cost' },
                { name: 'Bajaj Allianz', score: '89%', highlight: 'Competitive Cat 1–2' },
              ].map((c) => (
                <div key={c.name} className="p-2 rounded-xl bg-[#FBF9F5] border border-[#121316]/5">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-bold text-[#121316] text-[11px]">{c.name}</span>
                    <span className="font-mono font-bold text-[#00C853] text-[11px]">{c.score}</span>
                  </div>
                  <div className="text-[9px] text-[#5A6065]">{c.highlight}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>


      {/* =========================================================================
          SECTION 4 — ACT IV: THE FINAL PITCH (100% Snap) — Resting Frame 214
          CENTER SPINE: Character rests upright centered above Pricing Tiers (cx ≈ 646)
          LEFT FLANK: Starter Tier (₹549/mo)
          RIGHT FLANK: Professional Tier (₹1,499/mo — Recommended)
          TOP: Transparent Institutional Pricing Header
          BOTTOM: Institutional Security & Compliance Footer
      ========================================================================= */}
      <div
        id="section-landing"
        style={{ opacity: 0, transform: 'translateY(-14px)', pointerEvents: 'none' }}
        className="absolute inset-0 flex flex-col justify-between px-6 sm:px-10 md:px-14 lg:px-20 pt-18 pb-6 transition-all duration-150"
      >
        {/* Subtle Watermark Q behind character at z=0 */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
          <div className="text-[260px] sm:text-[340px] font-black text-[#0F5132]/[0.028] leading-none tracking-tighter">
            Q
          </div>
        </div>

        {/* Top: Pricing Header */}
        <div className="w-full flex flex-col items-center text-center z-30 pt-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#00C853]/10 border border-[#00C853]/25 text-[#0F5132] text-xs font-bold tracking-wider uppercase mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#00C853]" />
            <span>TRANSPARENT INSTITUTIONAL PRICING</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[#121316] leading-tight">
            Supercharge your brokerage today.
          </h2>
          <p className="text-xs sm:text-sm text-[#5A6065] mt-1 max-w-lg">
            Choose the commercial plan calibrated for your brokerage volume and line mix.
          </p>
        </div>

        {/* Middle: SaaS Pricing Cards Flanking the Resting Mascot */}
        {/* Leaves a dedicated central corridor for the mascot resting at cx ≈ 646 */}
        <div className="w-full grid grid-cols-1 md:grid-cols-[1fr_220px_1fr] gap-4 items-center z-30 my-auto pointer-events-auto">

          {/* Left Flank: STARTER (₹549/mo) */}
          <div className="w-full max-w-sm mx-auto md:mx-0 md:ml-auto bg-white/90 backdrop-blur-xl border border-[#121316]/10 rounded-3xl p-6 shadow-[0_16px_36px_rgba(0,0,0,0.06),0_0_0_1px_rgba(255,255,255,0.8)_inset] hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)] transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold tracking-wider uppercase text-[#5A6065]">STARTER</span>
              <span className="text-[10px] font-mono font-semibold bg-[#121316]/5 text-[#5A6065] px-2 py-0.5 rounded-full">
                Independent Broker
              </span>
            </div>

            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-3xl font-black text-[#121316]">₹549</span>
              <span className="text-xs font-semibold text-[#5A6065]">/ month</span>
            </div>

            <p className="text-xs text-[#5A6065] mb-4">
              Essential AI underwriting automation for independent brokers.
            </p>

            <div className="space-y-2 mb-5 text-xs text-[#121316]">
              {[
                '1 Broker Seat',
                'Basic IDP Document Extraction',
                '500 Quotes & Reminders / mo',
                'Standard CRM & WhatsApp Alerts',
                'ACORD 125 & Proposal Form Parsing',
                'Fire (BLUS) Line Access',
              ].map((feat) => (
                <div key={feat} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#00C853] shrink-0" />
                  <span className="font-medium">{feat}</span>
                </div>
              ))}
            </div>

            <button
              onClick={onBookDemo}
              className="w-full py-2.5 px-4 rounded-xl border border-[#121316]/15 hover:border-[#121316] text-[#121316] font-bold text-xs hover:bg-[#121316]/5 transition-all cursor-pointer"
            >
              Get Started with Starter
            </button>
          </div>

          {/* Center Column: Resting Mascot Pedestal & ROI Callout */}
          <div className="hidden md:flex flex-col items-center justify-end h-full pb-2 pointer-events-none">
            <div className="px-3 py-1.5 rounded-full bg-white/85 backdrop-blur-md border border-[#00C853]/30 text-[10px] font-mono font-bold text-[#0F5132] shadow-xs text-center">
              10× ROI in Month 1
            </div>
            <div className="w-28 h-1.5 rounded-full bg-gradient-to-r from-transparent via-[#00C853]/40 to-transparent blur-xs mt-2" />
          </div>

          {/* Right Flank: PROFESSIONAL (₹1,499/mo — Recommended) */}
          <div className="w-full max-w-sm mx-auto md:mr-0 md:ml-0 bg-white/95 backdrop-blur-xl border border-[#00C853]/40 rounded-3xl p-6 shadow-[0_20px_45px_rgba(0,200,83,0.12),0_0_0_1px_rgba(0,200,83,0.3)_inset] hover:shadow-[0_25px_50px_rgba(0,200,83,0.2)] transition-all relative">
            <div className="absolute -top-3 right-6 bg-gradient-to-r from-[#0F5132] to-[#00C853] text-white text-[10px] font-bold tracking-wider uppercase px-3 py-1 rounded-full shadow-sm">
              MOST POPULAR
            </div>

            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold tracking-wider uppercase text-[#0F5132]">PROFESSIONAL</span>
              <span className="text-[10px] font-mono font-semibold bg-[#00C853]/15 text-[#0F5132] px-2 py-0.5 rounded-full">
                Enterprise Ready
              </span>
            </div>

            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-3xl font-black text-[#121316]">₹1,499</span>
              <span className="text-xs font-semibold text-[#5A6065]">/ month</span>
            </div>

            <p className="text-xs text-[#5A6065] mb-4">
              Complete omni-line AI OS with IRDAI statutory compliance.
            </p>

            <div className="space-y-2 mb-5 text-xs text-[#121316]">
              {[
                'Unlimited Broker Users & Seats',
                'Full BLUS/BSUS Tariff Calculator',
                'Corporate Payout Reconciler',
                'Multi-line UI Access (Fire, Marine, Cyber, Liability, Engg, Health, Motor)',
                'Multi-tenancy RBAC & Complete Audit Trail',
                'Dedicated Account Support & SLA',
              ].map((feat) => (
                <div key={feat} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#00C853] shrink-0" />
                  <span className="font-semibold">{feat}</span>
                </div>
              ))}
            </div>

            <button
              onClick={onBookDemo}
              className="w-full py-2.5 px-4 rounded-xl bg-[#0F5132] hover:bg-[#146c43] active:scale-[0.98] text-white font-bold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Upgrade to Professional</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bottom: Institutional Security & Compliance Trust Footer */}
        <div className="w-full z-30 pt-2 border-t border-[#121316]/8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#5A6065]">
          <div className="flex items-center gap-5 mb-2 sm:mb-0">
            <div className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#0F5132]" />
              <span>AES-256 Cloud Encryption</span>
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
            <span>&copy; {new Date().getFullYear()} Qoutely Inc. All rights reserved.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
