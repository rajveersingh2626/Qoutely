'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Flame, 
  Car, 
  Anchor, 
  Heart, 
  HardHat, 
  AlertCircle, 
  ShieldCheck, 
  Check, 
  ArrowRight, 
  Zap, 
  Cpu, 
  Database, 
  Lock, 
  Scale, 
  Building2, 
  FileCheck2, 
  Layers, 
  HelpCircle, 
  ChevronDown, 
  CheckCircle2, 
  Sliders, 
  TrendingUp, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { MascotPreloader } from '@/components/scrollytelling/MascotPreloader';
import { PreloaderOverlay } from '@/components/scrollytelling/PreloaderOverlay';
import { ScrollytellingCanvas, SNAP_POINTS } from '@/components/scrollytelling/ScrollytellingCanvas';
import { Navbar } from '@/components/scrollytelling/Navbar';
import { ScrollytellingOverlay } from '@/components/scrollytelling/ScrollytellingOverlay';
import { BookDemoModal } from '@/components/scrollytelling/BookDemoModal';
import { ScrollytellingAssets } from '@/components/scrollytelling/types';
import { SmoothScrollProvider } from '@/components/providers/SmoothScrollProvider';

// ─────────────────────────────────────────────────────────
//  7 COMMERCIAL LINES SHOWCASE DATA
// ─────────────────────────────────────────────────────────

interface CommercialLineCard {
  id: string;
  name: string;
  badge: string;
  statute: string;
  tagline: string;
  metric: string;
  metricLabel: string;
  features: string[];
  link: string;
  icon: React.ReactNode;
}

const COMMERCIAL_LINES: CommercialLineCard[] = [
  {
    id: 'property',
    name: 'Property & Fire (BLUS / BSUS)',
    badge: 'BLUS / BSUS / SFSP',
    statute: 'IRDAI Tariff & BIS IS 1893:2002',
    tagline: 'Deterministic statutory fire tariff computation with IIB burning cost cross-check.',
    metric: '₹500+ Cr',
    metricLabel: 'Single SI Capacity',
    features: [
      'ACORD 125 & SOV parser in 280ms',
      'BIS seismic earthquake zones I–IV auto-rating',
      'Statutory 15% underinsurance waiver clause',
      'STFI perils and flatted factory hazard grading',
    ],
    link: '/quotes/new?line=fire',
    icon: <Flame className="w-5 h-5 text-[#0F5132]" />,
  },
  {
    id: 'motor',
    name: 'Commercial Motor Fleet',
    badge: 'AIMT GR.8 & TP Tariff',
    statute: 'Motor Vehicles Act 1988 (Sec 146)',
    tagline: 'Fleet schedule bulk ingestion, immutable IRDAI TP tariffs, and AIMT GR.8 depreciation.',
    metric: '0% Discount',
    metricLabel: 'Strict TP Statutory Compliance',
    features: [
      'Bulk vehicle schedule Excel/CSV roster parser',
      'AIMT GR.8 IDV age depreciation curves (5%–50%)',
      'IRDAI gazetted TP tariffs by GVW and seating slabs',
      'Commercial IMT 23, Zero Dep, and NCB (0%–50%)',
    ],
    link: '/quotes/new?line=motor_fleet',
    icon: <Car className="w-5 h-5 text-[#0F5132]" />,
  },
  {
    id: 'marine',
    name: 'Marine Cargo & Logistics',
    badge: 'ITC A/B/C & ICC A/B/C',
    statute: 'Marine Insurance Act 1963 & Sec 64VB',
    tagline: 'Inland transit & ocean open covers with real-time Section 64VB cash deposit balances.',
    metric: '110% CIF',
    metricLabel: 'Statutory Valuation Markup',
    features: [
      'Bill of Lading data extraction and validation',
      'Incoterms 2020 CIF 110% formula enforcement',
      'Section 64VB cash deposit balance tracking',
      'Ocean ICC A/B/C with War & Strikes peril rating',
    ],
    link: '/quotes/new?line=marine_cargo',
    icon: <Anchor className="w-5 h-5 text-[#0F5132]" />,
  },
  {
    id: 'benefits',
    name: 'Corporate Employee Benefits',
    badge: 'GMC / GTLI / GPA / WC',
    statute: 'Employees Compensation Act 1923 (Sec 4)',
    tagline: 'Automated census demographic age-banding and statutory workmen compensation rating.',
    metric: 'Schedule IV',
    metricLabel: 'Actuarial Factor Formula',
    features: [
      'Bulk employee census uploader with age bands',
      'IALM 2012-14 benchmark rates for Group Term Life',
      'EC Act statutory formula: 50%/60% × min(Wage, ₹15k) × Factor',
      'GMC room rent, Day-1 maternity & corporate buffer',
    ],
    link: '/quotes/new?line=benefits',
    icon: <Heart className="w-5 h-5 text-[#0F5132]" />,
  },
  {
    id: 'engineering',
    name: 'Engineering & Project Risks',
    badge: 'CAR / EAR / MB / EEI / BPP',
    statute: 'Indian Boilers Act 1923 & Munich Re Tariffs',
    tagline: 'Contractors All Risks, testing duration loading, and Machinery Breakdown rating.',
    metric: '0.75‰ / mo',
    metricLabel: 'Testing Duration Loading',
    features: [
      'Fixed Asset Register (FAR) plant & machinery rollup',
      'CAR/EAR civil (1.20‰) vs plant (1.80‰) rating',
      'Machinery Breakdown (MB) CRV rating across Groups I–IV',
      'Indian Boilers Act 1923 high pressure (>20 bar) rating',
    ],
    link: '/quotes/new?line=engineering',
    icon: <HardHat className="w-5 h-5 text-[#0F5132]" />,
  },
  {
    id: 'liability',
    name: 'Corporate Liability & Cyber',
    badge: 'CGL / PI / D&O / Cyber',
    statute: 'IRDAI Broker Regs 2018 & DPDP Act 2023',
    tagline: 'Turnover rating, statutory broker PI floors, and 100-point cyber posture scoring.',
    metric: '₹50 Lakhs',
    metricLabel: 'Statutory Broker PI Floor',
    features: [
      'CGL turnover rating with AOA:AOY limit ratios (1:1 to 1:4)',
      'Statutory broker PI floor: max(₹50L, 3× fee income)',
      'D&O Side A/B/C pricing for private & listed firms',
      '100-point cyber posture scoring (MFA hard gating)',
    ],
    link: '/quotes/new?line=liability',
    icon: <AlertCircle className="w-5 h-5 text-[#0F5132]" />,
  },
  {
    id: 'specialty',
    name: 'Financial & Specialty Lines',
    badge: 'Surety / TCI / Burglary',
    statute: 'GFR 2017 Rules 170/171 & IRDAI Surety 2022',
    tagline: 'Surety Insurance Bonds replacing bank guarantees for government public tenders.',
    metric: 'GFR 170/171',
    metricLabel: 'Bank Guarantee Replacement',
    features: [
      'Bid, Performance, Advance & Retention surety bonds',
      'Contractor financial credit grading (AAA to BB)',
      'Trade Credit receivables default rating & limits',
      'Commercial Burglary first loss rating (25%–100%)',
    ],
    link: '/quotes/new?line=specialty',
    icon: <ShieldCheck className="w-5 h-5 text-[#0F5132]" />,
  },
];

// ─────────────────────────────────────────────────────────
//  EXECUTIVE FAQ ACCORDION ITEM
// ─────────────────────────────────────────────────────────

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-[#121316]/10 last:border-b-0 py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between text-left font-bold text-sm sm:text-base text-[#121316] hover:text-[#0F5132] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5132] rounded-lg p-1"
      >
        <span className="pr-4">{question}</span>
        <ChevronDown
          className={`w-4 h-4 text-[#0F5132] shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>
      {isOpen && (
        <div className="mt-2 text-xs sm:text-sm text-[#4B5563] leading-relaxed pr-6 pl-1 animate-fadeIn">
          {answer}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  MAIN SCROLLYTELLING LANDING PAGE COMPONENT
// ─────────────────────────────────────────────────────────

export default function ScrollytellingLandingPage() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Asset preloading state — Tier 1 critical ready in <300ms
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [assets, setAssets] = useState<ScrollytellingAssets | null>(null);

  // Active section indicator passed to overlay without polling
  const [activeSection, setActiveSection] = useState(0);

  // Interactive Demo Modal
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }

    let mounted = true;

    // Progressive Tier 1 Preload: Frame 1 + trajectory in <300ms
    MascotPreloader.preloadCritical((progress) => {
      if (mounted) {
        setLoadProgress(progress);
      }
    })
      .then((loadedAssets) => {
        if (mounted) {
          setAssets(loadedAssets);
          // Hero ready immediately: reveal screen in 200ms
          setTimeout(() => {
            if (mounted) setIsLoading(false);
          }, 200);
        }
      })
      .catch((err) => {
        console.error('Failed to preload critical assets:', err);
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleBookDemo = () => {
    setDemoModalOpen(true);
  };

  const handleExploreWorkflows = () => {
    handleNavigate(1);
  };

  const handleNavigate = (sectionIndex: number) => {
    if (typeof window !== 'undefined' && (window as unknown as { __navigateToSection?: (idx: number) => void }).__navigateToSection) {
      (window as unknown as { __navigateToSection: (idx: number) => void }).__navigateToSection(sectionIndex);
      return;
    }
    if (!containerRef.current) return;
    const maxScroll = containerRef.current.scrollHeight - window.innerHeight;
    const targetRatio = SNAP_POINTS[sectionIndex] ?? 0;
    const targetTop = maxScroll * targetRatio;

    window.scrollTo({
      top: targetTop,
      behavior: 'smooth',
    });
  };

  return (
    <SmoothScrollProvider>
      <div 
        ref={containerRef}
        className="relative w-full bg-[#FBF9F5] text-[#121316] selection:bg-[#0F5132]/20 selection:text-[#0F5132]"
      >
        {/* Preloader Overlay (z-[100]) */}
        <PreloaderOverlay progress={loadProgress} isLoading={isLoading} />

        {/* Global Navigation Bar (z-[80]) */}
        <Navbar 
          onBookDemo={handleBookDemo} 
          onNavigate={handleNavigate}
        />

        {/* ─────────────────────────────────────────────────────────
            SCROLLYTELLING 4-ACT VIEWPORT STAGE (400vh Container)
        ───────────────────────────────────────────────────────── */}
        <main id="main-content" className="relative w-full h-[400vh]">
          {/* Sticky Full-Viewport Stage */}
          <div className="sticky top-0 h-screen w-full overflow-hidden bg-[#FBF9F5]">
            {/* Full-Screen Hardware-Accelerated Canvas Engine */}
            {assets && (
              <ScrollytellingCanvas
                assets={assets}
                containerRef={containerRef}
                onSectionChange={(sec) => setActiveSection(sec)}
              />
            )}

            {/* Sticky Section Overlays with Direct Section State */}
            <ScrollytellingOverlay
              onBookDemo={handleBookDemo}
              onExploreWorkflows={handleExploreWorkflows}
              activeSection={activeSection}
            />
          </div>
        </main>

        {/* ─────────────────────────────────────────────────────────
            RICH BELOW-THE-FOLD INSTITUTIONAL COMMERCIAL SECTIONS
        ───────────────────────────────────────────────────────── */}
        <div className="relative z-30 bg-[#FBF9F5] border-t border-[#121316]/10">

          {/* ═════════════════════════════════════════════════════════
              SECTION 1: 7 COMMERCIAL LINES INTERACTIVE SHOWCASE
          ═════════════════════════════════════════════════════════ */}
          <section className="py-20 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto">
            <div className="flex flex-col items-center text-center mb-14">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0F5132]/10 border border-[#0F5132]/20 text-[#0F5132] text-xs font-bold tracking-wider uppercase mb-3">
                <Layers className="w-3.5 h-3.5 text-[#0F5132]" />
                <span>100% OPERATIONAL &amp; VERIFIED</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-[-0.03em] text-[#121316] leading-tight mb-4">
                All 7 Indian Commercial Lines.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0F5132] to-[#15803d]">
                  One Unified Operating System.
                </span>
              </h2>
              <p className="text-sm sm:text-base text-[#4B5563] max-w-2xl leading-relaxed">
                Zero placeholders. Every commercial underwriting engine is fully deployed in production with statutory Indian tariff formulas, document parsers, and multi-insurer quote comparison slips.
              </p>
            </div>

            {/* 7-Line Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {COMMERCIAL_LINES.map((line) => (
                <div
                  key={line.id}
                  className="bg-white/95 backdrop-blur-md border border-[#121316]/10 rounded-3xl p-6 shadow-[0_8px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_36px_rgba(0,0,0,0.08)] hover:border-[#0F5132]/30 transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#0F5132]/10 flex items-center justify-center p-2">
                        {line.icon}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold bg-[#15803d]/15 text-[#0F5132] px-2 py-0.5 rounded-full border border-[#15803d]/30">
                          100% LIVE
                        </span>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-[#121316] mb-1 group-hover:text-[#0F5132] transition-colors">
                      {line.name}
                    </h3>
                    <div className="text-[10px] font-mono text-[#0F5132] font-semibold mb-2">
                      {line.statute}
                    </div>
                    <p className="text-xs text-[#4B5563] leading-relaxed mb-4">
                      {line.tagline}
                    </p>

                    {/* Metric Callout */}
                    <div className="p-3 rounded-2xl bg-[#FBF9F5] border border-[#121316]/6 mb-4 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-[#4B5563]">{line.metricLabel}</span>
                      <span className="text-xs font-mono font-bold text-[#0F5132] tabular-nums">{line.metric}</span>
                    </div>

                    {/* Features list */}
                    <div className="space-y-1.5 mb-5">
                      {line.features.map((feat) => (
                        <div key={feat} className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-[#15803d] shrink-0" aria-hidden="true" />
                          <span className="text-[11px] font-medium text-[#121316]">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Direct Launch Link */}
                  <Link
                    href={line.link}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#FBF9F5] hover:bg-[#0F5132] text-[#121316] hover:text-white font-bold text-xs border border-[#121316]/10 hover:border-[#0F5132] transition-all flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5132]"
                  >
                    <span>Launch {line.name.split(' ')[0]} Studio</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </Link>
                </div>
              ))}
            </div>
          </section>

          {/* ═════════════════════════════════════════════════════════
              SECTION 2: DETERMINISTIC UNDERWRITING ARCHITECTURE
              (AI Perception vs. Pure TypeScript Deterministic Math)
          ═════════════════════════════════════════════════════════ */}
          <section className="py-20 px-6 sm:px-10 lg:px-16 bg-white border-y border-[#121316]/10">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-14">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0F5132]/10 border border-[#0F5132]/20 text-[#0F5132] text-xs font-bold tracking-wider uppercase mb-3">
                  <Cpu className="w-3.5 h-3.5 text-[#0F5132]" />
                  <span>ZERO LLM CALCULATION HALLUCINATIONS</span>
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-[-0.03em] text-[#121316] leading-tight mb-4">
                  Software 2.0 Perception.<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0F5132] to-[#15803d]">
                    Software 1.0 Deterministic Math.
                  </span>
                </h2>
                <p className="text-sm sm:text-base text-[#4B5563] max-w-2xl mx-auto leading-relaxed">
                  Never entrust complex multi-crore insurance calculations to stochastic generative AI. Qoutely enforces strict separation of concerns: AI parses raw broker documents; immutable TypeScript code executes the statutory math.
                </p>
              </div>

              {/* Architectural Split Visual */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                {/* Layer 1: Perception */}
                <div className="bg-[#FBF9F5] border border-[#121316]/10 rounded-3xl p-8 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2.5 text-xs font-mono font-bold uppercase tracking-wider text-[#0F5132] mb-3">
                      <Zap className="w-4 h-4 text-[#0F5132]" />
                      <span>Layer 1: Document Ingestion &amp; Perception</span>
                    </div>
                    <h3 className="text-xl font-bold text-[#121316] mb-3">
                      Generative Vision &amp; OCR Engine
                    </h3>
                    <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed mb-6">
                      Handles messy, unstructured broker inputs: PDF schedules, scanned ACORD forms, loss runs, and multi-vehicle CSVs. Normalizes 47+ risk attributes in 280ms into typed JSON schemas.
                    </p>

                    <div className="space-y-2.5">
                      {[
                        'PDF Table Extraction & Entity Linking',
                        'Fleet Roster & Census Demographic Parsing',
                        'Automatic Currency & Unit Normalization',
                        'Confidence Scoring & Human-in-the-Loop Review',
                      ].map((item) => (
                        <div key={item} className="flex items-center gap-2 text-xs text-[#121316]">
                          <CheckCircle2 className="w-4 h-4 text-[#15803d] shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-8 p-3 rounded-2xl bg-white border border-[#121316]/8 text-[11px] font-mono text-[#0F5132]">
                    Input: Unstructured Broker Slip → Output: Strictly Typed JSON Schema
                  </div>
                </div>

                {/* Layer 2: Deterministic Engine */}
                <div className="bg-white border-2 border-[#0F5132]/30 rounded-3xl p-8 shadow-xl flex flex-col justify-between relative">
                  <div className="absolute -top-3 right-8 bg-[#0F5132] text-white text-[10px] font-bold tracking-wider uppercase px-3 py-1 rounded-full shadow-sm">
                    IMMUTABLE AUDIT TRAIL
                  </div>

                  <div>
                    <div className="flex items-center gap-2.5 text-xs font-mono font-bold uppercase tracking-wider text-[#0F5132] mb-3">
                      <Scale className="w-4 h-4 text-[#0F5132]" />
                      <span>Layer 2: Deterministic Underwriting Engine</span>
                    </div>
                    <h3 className="text-xl font-bold text-[#121316] mb-3">
                      Pure TypeScript Statutory Mathematics
                    </h3>
                    <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed mb-6">
                      Zero LLM execution in pricing. Every tariff formula, depreciation curve, and deductible is coded in deterministic TypeScript, adhering strictly to gazetted IRDAI tables and IIB baselines.
                    </p>

                    <div className="space-y-2.5">
                      {[
                        'BLUS/BSUS Tariff Math (15% Underinsurance Waiver)',
                        'AIMT GR.8 Age Depreciation Schedule (5%–50%)',
                        'Section 64VB Cash Deposit Balance Ledger',
                        'EC Act 1923 Schedule IV Actuarial Factors',
                      ].map((item) => (
                        <div key={item} className="flex items-center gap-2 text-xs text-[#121316] font-semibold">
                          <CheckCircle2 className="w-4 h-4 text-[#0F5132] shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-8 p-3 rounded-2xl bg-[#0F5132]/10 border border-[#0F5132]/20 text-[11px] font-mono text-[#0F5132] font-bold">
                    Result: 100% Reproducible Underwriting &amp; Zero Calculation Drift
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ═════════════════════════════════════════════════════════
              SECTION 3: STATUTORY & REGULATORY CREDENTIALS
          ═════════════════════════════════════════════════════════ */}
          <section className="py-20 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0F5132]/10 border border-[#0F5132]/20 text-[#0F5132] text-xs font-bold tracking-wider uppercase mb-3">
                <FileCheck2 className="w-3.5 h-3.5 text-[#0F5132]" />
                <span>STATUTORY COMPLIANCE &amp; GOVERNANCE</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-[-0.03em] text-[#121316] leading-tight mb-4">
                Built Strictly to Indian Regulations.
              </h2>
              <p className="text-sm sm:text-base text-[#4B5563] max-w-2xl mx-auto leading-relaxed">
                Operating systems for licensed brokers must withstand rigorous audit inspections. Qoutely incorporates statutory standards directly into every generated schedule.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  title: 'IRDAI Broker Regulations 2018',
                  desc: 'Regulation 24 Schedule II Professional Indemnity floors (3× brokerage revenue or ₹50 Lakhs) and mandatory quote comparison audit logs.',
                  code: 'IRDAI/NL/ORD/2018',
                },
                {
                  title: 'General Financial Rules 170/171',
                  desc: 'Ministry of Finance mandates permitting Surety Insurance Bonds to replace Bank Guarantees in public procurement and government tenders.',
                  code: 'GFR 2017 Rules 170/171',
                },
                {
                  title: 'Insurance Act 1938 Sec 64VB',
                  desc: 'Strict cash deposit balance verification before assumption of marine open cargo transit risk, preventing regulatory non-compliance.',
                  code: 'Sec 64VB Insurance Act',
                },
                {
                  title: 'Employees Compensation Act 1923',
                  desc: 'Deterministic Schedule IV actuarial factor calculations for statutory workmen compensation death and total disability payouts.',
                  code: 'EC Act 1923 Sec 4',
                },
              ].map((reg) => (
                <div key={reg.title} className="p-6 rounded-3xl bg-white border border-[#121316]/10 shadow-xs flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#0F5132] bg-[#0F5132]/10 px-2 py-0.5 rounded-md inline-block mb-3">
                      {reg.code}
                    </span>
                    <h3 className="text-base font-bold text-[#121316] mb-2">{reg.title}</h3>
                    <p className="text-xs text-[#4B5563] leading-relaxed">{reg.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ═════════════════════════════════════════════════════════
              SECTION 4: ENTERPRISE DATA SOVEREIGNTY & SECURITY
          ═════════════════════════════════════════════════════════ */}
          <section className="py-20 px-6 sm:px-10 lg:px-16 bg-[#121316] text-white">
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col items-center text-center mb-14">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-[#10B981] text-xs font-bold tracking-wider uppercase mb-3">
                  <Lock className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>INDIAN SOVEREIGN CLOUD ARCHITECTURE</span>
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-[-0.03em] leading-tight mb-4">
                  Institutional Security &amp; Data Residency.
                </h2>
                <p className="text-sm sm:text-base text-gray-400 max-w-2xl leading-relaxed">
                  Your policyholder schedules, claim run logs, and corporate employee census files are stored strictly within Indian sovereign borders with multi-tenant row-level security.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
                  <Database className="w-6 h-6 text-[#10B981] mb-4" />
                  <h3 className="text-lg font-bold mb-2">Tenant Isolation (RLS)</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    PostgreSQL Row-Level Security ensures that each brokerage workspace operates in complete digital isolation. No co-mingling of quote slips or client loss records.
                  </p>
                </div>

                <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
                  <Lock className="w-6 h-6 text-[#10B981] mb-4" />
                  <h3 className="text-lg font-bold mb-2">AES-256 GCM Cloud Encryption</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    All document uploads and generated slips are encrypted using enterprise AES-256 GCM at rest and TLS 1.3 with HSTS preload in transit.
                  </p>
                </div>

                <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
                  <Building2 className="w-6 h-6 text-[#10B981] mb-4" />
                  <h3 className="text-lg font-bold mb-2">DPDP Act 2023 Compliance</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Comprehensive consent tracking, audit trails for corporate census access, and compliance with CERT-In 6-hour cybersecurity reporting guidelines.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ═════════════════════════════════════════════════════════
              SECTION 5: EXECUTIVE FAQ SECTION
          ═════════════════════════════════════════════════════════ */}
          <section className="py-20 px-6 sm:px-10 lg:px-16 max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0F5132]/10 border border-[#0F5132]/20 text-[#0F5132] text-xs font-bold tracking-wider uppercase mb-3">
                <HelpCircle className="w-3.5 h-3.5 text-[#0F5132]" />
                <span>FREQUENTLY ASKED QUESTIONS</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-[-0.03em] text-[#121316] leading-tight mb-3">
                Everything commercial brokers need to know.
              </h2>
              <p className="text-xs sm:text-sm text-[#4B5563]">
                Clear statutory answers regarding IRDAI compliance, quote slip generation, and underwriting accuracy.
              </p>
            </div>

            <div className="bg-white border border-[#121316]/10 rounded-3xl p-6 sm:p-8 shadow-xs divide-y divide-[#121316]/8">
              <FaqItem
                question="How does Qoutely guarantee compliance with IRDAI statutory regulations?"
                answer="Qoutely embeds deterministic Indian insurance statutory rules directly into its TypeScript calculation core. Fire tariffs adhere strictly to BLUS and BSUS regulations, motor IDVs compute using the statutory AIMT GR.8 depreciation schedules (5% to 50%), marine cargo incorporates Section 64VB Cash Deposit drawdown validation, and workmen compensation calculations adhere to Section 4 and Schedule IV of the Employees Compensation Act 1923. Zero arithmetic calculations are performed by LLMs."
              />
              <FaqItem
                question="Can Qoutely generate multi-carrier comparative quote slips for corporate clients?"
                answer="Yes. Qoutely generates executive, audit-ready PDF comparison slips across major Indian general insurers (Tata AIG, ICICI Lombard, New India Assurance, Bajaj Allianz, HDFC ERGO) detailing net premiums, STFI add-on breakdowns, deductibles, warranties, and carrier appetite matches."
              />
              <FaqItem
                question="Does Qoutely benchmark loss ratios against the Insurance Information Bureau of India (IIB)?"
                answer="Yes. Qoutely cross-references baseline property burning costs against gazetted IIB loss costs across commercial occupancies (textiles, chemical storage, plastics, heavy engineering) and flags high-risk loss run deviations for commercial motor and corporate group health portfolios."
              />
              <FaqItem
                question="Can we issue government tender Surety Insurance Bonds under GFR 170/171?"
                answer="Yes. Qoutely supports Surety Insurance Bonds replacing Bank Guarantees in accordance with Ministry of Finance General Financial Rules (GFR) 2017 Rules 170 and 171, rating Bid Bonds, Performance Bonds, Advance Payment Bonds, and Retention Money Bonds across contractor credit grades AAA to BB."
              />
              <FaqItem
                question="Where is our brokerage policyholder data stored?"
                answer="All policyholder data, employee census schedules, and risk inspection documents are stored exclusively within Indian sovereign data centers (Mumbai/Hyderabad) using AES-256 cloud encryption, tenant-isolated database schemas, and full compliance with the Digital Personal Data Protection (DPDP) Act, 2023."
              />
              <FaqItem
                question="How does onboarding and migration work for existing brokerage teams?"
                answer="Our dedicated insurance onboarding specialists assist with workspace setup, role-based access configuration (Principal Officer, Broker Underwriters, Operations), and historical client SOV migration within 24 hours. No software installation is required; Qoutely operates securely through any modern web browser."
              />
            </div>
          </section>

          {/* ═════════════════════════════════════════════════════════
              SECTION 6: INSTITUTIONAL BROKER OS FOOTER
          ═════════════════════════════════════════════════════════ */}
          <footer className="border-t border-[#121316]/10 bg-[#FBF9F5] py-14 px-6 sm:px-10 lg:px-16 text-xs text-[#4B5563]">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white border border-[#0F5132]/20 p-1 flex items-center justify-center">
                    <img src="/qoutely_logo.png" alt="Qoutely" width={28} height={28} className="w-full h-full object-contain" />
                  </div>
                  <span className="text-lg font-black tracking-tight text-[#121316]">Qoutely</span>
                </div>
                <p className="text-xs leading-relaxed text-[#4B5563]">
                  Enterprise commercial insurance operating system and deterministic underwriting copilot for IRDAI-registered brokers in India.
                </p>
                <div className="text-[11px] font-mono text-[#0F5132] font-semibold">
                  Sovereign Indian Cloud Infrastructure
                </div>
              </div>

              <div>
                <h3 className="font-bold text-[#121316] mb-3 uppercase tracking-wider text-[11px]">7 Commercial Lines</h3>
                <ul className="space-y-2 text-xs">
                  <li><Link href="/quotes/new?line=fire" className="hover:text-[#0F5132] transition-colors">Property &amp; Fire (BLUS/BSUS)</Link></li>
                  <li><Link href="/quotes/new?line=motor_fleet" className="hover:text-[#0F5132] transition-colors">Commercial Motor Fleet</Link></li>
                  <li><Link href="/quotes/new?line=marine_cargo" className="hover:text-[#0F5132] transition-colors">Marine Cargo &amp; Logistics</Link></li>
                  <li><Link href="/quotes/new?line=benefits" className="hover:text-[#0F5132] transition-colors">Employee Benefits (GMC/GPA/WC)</Link></li>
                  <li><Link href="/quotes/new?line=engineering" className="hover:text-[#0F5132] transition-colors">Engineering (CAR/EAR/MB)</Link></li>
                  <li><Link href="/quotes/new?line=liability" className="hover:text-[#0F5132] transition-colors">Corporate Liability &amp; Cyber</Link></li>
                  <li><Link href="/quotes/new?line=specialty" className="hover:text-[#0F5132] transition-colors">Financial &amp; Specialty Surety</Link></li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-[#121316] mb-3 uppercase tracking-wider text-[11px]">Platform &amp; Tools</h3>
                <ul className="space-y-2 text-xs">
                  <li><Link href="/dashboard" className="hover:text-[#0F5132] transition-colors">Broker Dashboard</Link></li>
                  <li><Link href="/quotes" className="hover:text-[#0F5132] transition-colors">Quote Management</Link></li>
                  <li><Link href="/documents" className="hover:text-[#0F5132] transition-colors">SOV &amp; Document Ingestion</Link></li>
                  <li><Link href="/audit-logs" className="hover:text-[#0F5132] transition-colors">Statutory Audit Logs</Link></li>
                  <li><button onClick={handleBookDemo} className="hover:text-[#0F5132] transition-colors text-left cursor-pointer">Request Enterprise Walkthrough</button></li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-[#121316] mb-3 uppercase tracking-wider text-[11px]">Statutory Disclosures</h3>
                <p className="text-[11px] leading-relaxed text-[#4B5563] mb-3">
                  Qoutely Technologies Private Limited provides software operating systems for insurance intermediaries and is not an insurance risk-carrier. All policies are subject to carrier underwriting approval.
                </p>
                <div className="text-[10px] font-mono text-[#4B5563]">
                  IRDAI Reg 2018 | GFR 170/171 | DPDP Act 2023
                </div>
              </div>
            </div>

            <div className="max-w-7xl mx-auto pt-6 border-t border-[#121316]/8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#4B5563]">
              <div>
                &copy; {new Date().getFullYear()} Qoutely Technologies Private Limited. All rights reserved.
              </div>
              <div className="flex gap-6 mt-2 sm:mt-0">
                <Link href="/privacy" className="hover:text-[#121316] transition-colors">Privacy Policy</Link>
                <Link href="/terms" className="hover:text-[#121316] transition-colors">Terms of Service</Link>
                <Link href="/security" className="hover:text-[#121316] transition-colors">Security Architecture</Link>
              </div>
            </div>
          </footer>
        </div>

        {/* Interactive Qualification & Demo Booking Modal */}
        <BookDemoModal
          isOpen={demoModalOpen}
          onClose={() => setDemoModalOpen(false)}
        />
      </div>
    </SmoothScrollProvider>
  );
}
