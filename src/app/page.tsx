'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Car,
  Anchor,
  Heart,
  HardHat,
  ShieldAlert,
  ShieldCheck,
  Check,
  ArrowRight,
  Sparkles,
  ArrowDown,
  UploadCloud,
  FileCheck2,
  Send,
  Zap,
  Lock,
  Clock,
  BadgeCheck,
  ChevronDown,
  HelpCircle,
  Copy,
  ExternalLink,
  Laptop,
  CheckCircle,
} from 'lucide-react';
import { BookDemoModal } from '@/components/scrollytelling/BookDemoModal';

// ─────────────────────────────────────────────────────────
//  7 BUSINESS INSURANCE COVERAGE TYPES (SIMPLE & FRIENDLY)
// ─────────────────────────────────────────────────────────

interface CoverageType {
  id: string;
  queryParam: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  tag: string;
  description: string;
  idealFor: string;
  color: string;
  bgLight: string;
}

const COVERAGE_TYPES: CoverageType[] = [
  {
    id: 'property',
    queryParam: 'fire',
    name: 'Office & Factory Property',
    icon: Building2,
    tag: 'Fire, Flood & Earthquake',
    description: 'Protects buildings, manufacturing plant machinery, and warehouse stock from fires, storms, floods, and natural calamities.',
    idealFor: 'Factories, godowns, IT parks, retail stores, and commercial buildings.',
    color: 'text-amber-700',
    bgLight: 'bg-amber-50 border-amber-200/80',
  },
  {
    id: 'motor',
    queryParam: 'motor_fleet',
    name: 'Commercial Vehicle Fleets',
    icon: Car,
    tag: 'Trucks, Vans & Buses',
    description: 'Covers fleets of 1 to 500+ commercial trucks, transport vehicles, buses, and corporate cabs with automated age depreciation.',
    idealFor: 'Logistics operators, transport agencies, corporate fleets, and construction vehicles.',
    color: 'text-blue-700',
    bgLight: 'bg-blue-50 border-blue-200/80',
  },
  {
    id: 'marine',
    queryParam: 'marine_cargo',
    name: 'Cargo & Goods in Transit',
    icon: Anchor,
    tag: 'Highway & Ocean Shipping',
    description: 'Covers raw materials and finished goods against transit damage, theft, or accidents across Indian highways and overseas ports.',
    idealFor: 'Exporters, importers, e-commerce shippers, and manufacturers.',
    color: 'text-cyan-700',
    bgLight: 'bg-cyan-50 border-cyan-200/80',
  },
  {
    id: 'benefits',
    queryParam: 'benefits',
    name: 'Team Health & Life',
    icon: Heart,
    tag: 'Group Mediclaim (GMC)',
    description: 'Comprehensive health and term life protection for employees and their families with cashless hospital networks across India.',
    idealFor: 'Startups, growing businesses, and enterprises with 10 to 10,000+ staff.',
    color: 'text-rose-700',
    bgLight: 'bg-rose-50 border-rose-200/80',
  },
  {
    id: 'engineering',
    queryParam: 'engineering',
    name: 'Projects & Machinery',
    icon: HardHat,
    tag: 'Contractor All Risks (CAR)',
    description: 'Protects construction work, contractor equipment, high-value machinery breakdown, and project site accidents.',
    idealFor: 'Civil contractors, engineering works, equipment rentals, and solar/power developers.',
    color: 'text-orange-700',
    bgLight: 'bg-orange-50 border-orange-200/80',
  },
  {
    id: 'liability',
    queryParam: 'liability',
    name: 'Director & Cyber Liability',
    icon: ShieldAlert,
    tag: 'Lawsuit & Hacker Defense',
    description: 'Safeguards company founders, directors, and customer data against legal claims, third-party lawsuits, and cyber attacks.',
    idealFor: 'Tech startups, consultancy firms, financial companies, and mid-market corporations.',
    color: 'text-purple-700',
    bgLight: 'bg-purple-50 border-purple-200/80',
  },
  {
    id: 'specialty',
    queryParam: 'specialty',
    name: 'Government Tender Bonds',
    icon: ShieldCheck,
    tag: 'Replace Bank Guarantees',
    description: 'Government-approved Surety Insurance Bonds that let contractors bid for public tenders without locking up cash in banks.',
    idealFor: 'Government highway contractors, infrastructure builders, and tender applicants.',
    color: 'text-emerald-700',
    bgLight: 'bg-emerald-50 border-emerald-200/80',
  },
];

// ─────────────────────────────────────────────────────────
//  CARRIER COMPARISON DATA (SIMPLE & VISUAL)
// ─────────────────────────────────────────────────────────

interface SimpleCarrierQuote {
  name: string;
  badge: string;
  highlight: string;
  premiumText: string;
  benefits: string[];
}

const SAMPLE_CARRIER_QUOTES: SimpleCarrierQuote[] = [
  {
    name: 'Tata AIG General',
    badge: 'Fastest Claims (48 Hrs)',
    highlight: 'Comprehensive Protection',
    premiumText: '₹8,25,000 / yr',
    benefits: ['Full Storm & Flood Coverage', 'Zero Deductible on Inventory', 'Instant Digital Claim Filing'],
  },
  {
    name: 'ICICI Lombard',
    badge: 'Popular for Warehouses',
    highlight: 'Includes Debris Cleanup',
    premiumText: '₹8,90,000 / yr',
    benefits: ['₹1 Cr Cleanup Allowance', 'Architect & Surveyor Fees Included', '24/7 Priority Emergency Support'],
  },
  {
    name: 'New India Assurance',
    badge: 'Government PSU Insurer',
    highlight: 'Lowest Base Rate',
    premiumText: '₹7,65,000 / yr',
    benefits: ['Backed by Govt of India', 'Standard IRDAI Tariff Rates', 'Ideal for High Sum-Insured Tenders'],
  },
];

// ─────────────────────────────────────────────────────────
//  MAIN COMPONENT WITH CLEAN SECTION SNAPPING
// ─────────────────────────────────────────────────────────

export default function SimpleStorytellingLandingPage() {
  const [activeSection, setActiveSection] = useState(0);
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  const sections = [
    { id: 'hero', title: 'Home' },
    { id: 'how-it-works', title: 'How It Works' },
    { id: 'coverage', title: 'What We Cover' },
    { id: 'why-qoutely', title: 'Why Qoutely' },
    { id: 'get-started', title: 'Get Started' },
  ];

  // Track active section on scroll
  useEffect(() => {
    const container = document.getElementById('snap-container');
    if (!container) return;

    const handleScroll = () => {
      const scrollPos = container.scrollTop;
      const height = window.innerHeight;
      const index = Math.round(scrollPos / height);
      setActiveSection(Math.min(sections.length - 1, Math.max(0, index)));
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [sections.length]);

  const scrollToSection = (index: number) => {
    const container = document.getElementById('snap-container');
    if (!container) return;
    container.scrollTo({
      top: index * window.innerHeight,
      behavior: 'smooth',
    });
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#FBF9F5] text-[#121316] font-sans selection:bg-[#0F5132]/20 selection:text-[#0F5132]">
      
      {/* ─────────────────────────────────────────────────────────
          HEADER BAR
      ───────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#FBF9F5]/90 backdrop-blur-md border-b border-[#121316]/8 py-3.5 px-6 sm:px-10 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo & Simple Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-white border border-[#0F5132]/20 p-1 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <img
                src="/qoutely_logo.png"
                alt="Qoutely"
                width={32}
                height={32}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-[#121316]">
                Qoutely
              </span>
              <span className="text-[10px] text-[#0F5132] font-semibold -mt-1">
                Business Insurance Copilot
              </span>
            </div>
          </Link>

          {/* Section Jump Links */}
          <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-6 text-xs font-bold text-[#4B5563]">
            {sections.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => scrollToSection(idx)}
                className={`transition-colors cursor-pointer ${
                  activeSection === idx ? 'text-[#0F5132] font-black' : 'hover:text-[#121316]'
                }`}
              >
                {s.title}
              </button>
            ))}
          </nav>

          {/* Header Action CTAs */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-bold text-[#121316] hover:text-[#0F5132] px-3.5 py-2 rounded-xl transition-colors border border-[#121316]/10 hover:border-[#0F5132]"
            >
              Sign In
            </Link>
            <Link
              href="/quotes/new"
              className="inline-flex items-center gap-1.5 text-xs font-bold bg-[#0F5132] hover:bg-[#146c43] text-white px-4 py-2 rounded-xl shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Create a Quote</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────
          FLOATING SECTION INDICATOR (RIGHT EDGE)
      ───────────────────────────────────────────────────────── */}
      <aside aria-label="Section navigation" className="fixed right-4 sm:right-6 top-1/2 -translate-y-1/2 z-40 hidden sm:flex flex-col gap-3">
        {sections.map((s, idx) => (
          <button
            key={s.id}
            type="button"
            onClick={() => scrollToSection(idx)}
            aria-label={`Jump to ${s.title}`}
            className="group relative flex items-center justify-end cursor-pointer"
          >
            {/* Tooltip on hover */}
            <span className="absolute right-7 px-2 py-1 rounded bg-[#121316] text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-md">
              {s.title}
            </span>
            {/* Dot */}
            <span
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                activeSection === idx
                  ? 'bg-[#0F5132] ring-4 ring-[#0F5132]/20 scale-125'
                  : 'bg-[#121316]/20 hover:bg-[#121316]/50'
              }`}
            />
          </button>
        ))}
      </aside>

      {/* ─────────────────────────────────────────────────────────
          SNAP SCROLL CONTAINER (5 FULL-SCREEN SECTIONS)
      ───────────────────────────────────────────────────────── */}
      <main
        id="snap-container"
        className="h-screen w-full overflow-y-auto snap-y snap-mandatory scroll-smooth"
      >

        {/* ═════════════════════════════════════════════════════════
            SECTION 1: THE HERO (SIMPLE, CLEAR, INSTANT A-HA!)
        ═════════════════════════════════════════════════════════ */}
        <section
          id="hero"
          className="snap-start min-h-screen w-full flex flex-col justify-center pt-20 pb-12 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto relative"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center my-auto">
            
            {/* Left 7 Cols: The Story */}
            <div className="lg:col-span-7 flex flex-col items-start">
              
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0F5132]/10 border border-[#0F5132]/20 text-[#0F5132] text-xs font-bold uppercase tracking-wider mb-5">
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                <span>BUSINESS INSURANCE MADE EFFORTLESS</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-[-0.03em] text-[#121316] leading-[1.08] mb-5">
                Business insurance quotes.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0F5132] to-[#15803d]">
                  Compared in seconds.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-[#4B5563] leading-relaxed max-w-xl mb-8">
                Brokers usually waste 3 to 5 days manually reading 50-page tenders and fighting spreadsheets. Qoutely lets you upload any client request, compares real rates from India&apos;s top insurers, and creates ready-to-sign proposals in under a minute.
              </p>

              <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto mb-8">
                <Link
                  href="/quotes/new"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#0F5132] hover:bg-[#146c43] text-white font-extrabold text-sm shadow-md shadow-[#0F5132]/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Start a Quote (Free)</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>

                <button
                  type="button"
                  onClick={() => scrollToSection(1)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-[#121316] font-bold text-sm border border-[#121316]/12 shadow-xs transition-colors cursor-pointer"
                >
                  <span>See How It Works</span>
                  <ArrowDown className="w-4 h-4 text-[#0F5132]" aria-hidden="true" />
                </button>
              </div>

              {/* 3 Real Human Proof Points */}
              <div className="flex flex-wrap items-center gap-6 pt-6 border-t border-[#121316]/10 text-xs text-[#4B5563] font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#15803d]" />
                  <span>Tata AIG, ICICI Lombard &amp; PSUs</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#15803d]" />
                  <span>100% Error-Free Calculation</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#15803d]" />
                  <span>Ready in under 60 seconds</span>
                </div>
              </div>
            </div>

            {/* Right 5 Cols: Visual Sample Comparison Card */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-3xl border border-[#121316]/12 shadow-xl p-6 relative">
                
                {/* Header */}
                <div className="flex items-center justify-between pb-3.5 border-b border-[#121316]/8 mb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F5132] bg-[#0F5132]/10 px-2 py-0.5 rounded-md">
                      SAMPLE CLIENT PROPOSAL
                    </span>
                    <h3 className="text-base font-extrabold text-[#121316] mt-1">
                      Adani Logistics Warehouse Park
                    </h3>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-[#4B5563] font-medium">Insured Value</div>
                    <div className="text-sm font-black text-[#121316]">₹150 Crores</div>
                  </div>
                </div>

                {/* 3 Quotes Comparison */}
                <div className="space-y-3 mb-5">
                  {SAMPLE_CARRIER_QUOTES.map((q, idx) => (
                    <div
                      key={q.name}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        idx === 0
                          ? 'border-[#0F5132] bg-[#0F5132]/5 shadow-xs'
                          : 'border-[#121316]/8 bg-[#FBF9F5]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-[#121316]">{q.name}</span>
                          <span className="text-[9px] font-bold text-[#0F5132] bg-white border border-[#0F5132]/20 px-2 py-0.5 rounded-full">
                            {q.badge}
                          </span>
                        </div>
                        <span className="font-black text-sm text-[#121316] font-mono">{q.premiumText}</span>
                      </div>
                      <div className="text-[11px] text-[#4B5563]">
                        {q.highlight} • {q.benefits[0]}
                      </div>
                    </div>
                  ))}
                </div>

                {/* One Click Send Action */}
                <Link
                  href="/quotes/new"
                  className="w-full py-3 px-4 rounded-xl bg-[#0F5132] hover:bg-[#146c43] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all"
                >
                  <span>Build This Proposal for Your Client</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>

          </div>

          {/* Scroll Down Hint */}
          <div className="text-center mt-auto pb-4">
            <button
              type="button"
              onClick={() => scrollToSection(1)}
              className="inline-flex items-center gap-1.5 text-xs text-[#4B5563] hover:text-[#0F5132] transition-colors cursor-pointer"
            >
              <span>Scroll down to see the 3 steps</span>
              <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
            </button>
          </div>
        </section>


        {/* ═════════════════════════════════════════════════════════
            SECTION 2: HOW IT WORKS (CHILD'S PLAY SIMPLE)
        ═════════════════════════════════════════════════════════ */}
        <section
          id="how-it-works"
          className="snap-start min-h-screen w-full flex flex-col justify-center py-20 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto"
        >
          <div className="my-auto">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0F5132]/10 border border-[#0F5132]/20 text-[#0F5132] text-xs font-bold uppercase tracking-wider mb-3">
                <Zap className="w-3.5 h-3.5" aria-hidden="true" />
                <span>EFFORTLESS WORKFLOW</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-[-0.03em] text-[#121316] leading-tight mb-4">
                Three simple steps. From inquiry to signed policy.
              </h2>
              <p className="text-sm sm:text-base text-[#4B5563] leading-relaxed">
                You don&apos;t need to be a tech wizard. If you know how to drag a file and click a button, you can quote any commercial risk in Qoutely.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Step 1 */}
              <div className="bg-white rounded-3xl p-8 border border-[#121316]/10 shadow-xs flex flex-col justify-between hover:border-[#0F5132]/40 transition-all">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800 font-black text-lg mb-6">
                    1
                  </div>
                  <h3 className="text-xl font-bold text-[#121316] mb-3">
                    Drop Your Requirements
                  </h3>
                  <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed mb-6">
                    Got an email tender? An Excel sheet with 50 company trucks? Or an employee roster? Just drop the file into Qoutely. We read and organize all numbers automatically.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#FBF9F5] border border-[#121316]/8 text-[11px] font-medium text-[#4B5563] flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-[#0F5132]" />
                  <span>Accepts PDFs, Excel sheets, and photos</span>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-white rounded-3xl p-8 border-2 border-[#0F5132]/40 shadow-md flex flex-col justify-between relative">
                <div className="absolute -top-3.5 right-6 bg-[#0F5132] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-xs">
                  NO SPREADSHEET HEADACHES
                </div>
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#0F5132] text-white font-black text-lg flex items-center justify-center mb-6 shadow-xs">
                    2
                  </div>
                  <h3 className="text-xl font-bold text-[#121316] mb-3">
                    We Calculate Rates Instantly
                  </h3>
                  <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed mb-6">
                    Our system checks official Indian insurance tariffs and compares prices from Tata AIG, ICICI Lombard, and PSUs. Every discount and GST rupee is 100% accurate.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#0F5132]/10 border border-[#0F5132]/20 text-[11px] font-bold text-[#0F5132] flex items-center gap-2">
                  <BadgeCheck className="w-4 h-4 text-[#0F5132]" />
                  <span>Zero calculation errors guaranteed</span>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-white rounded-3xl p-8 border border-[#121316]/10 shadow-xs flex flex-col justify-between hover:border-[#0F5132]/40 transition-all">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800 font-black text-lg mb-6">
                    3
                  </div>
                  <h3 className="text-xl font-bold text-[#121316] mb-3">
                    Send a Beautiful Proposal
                  </h3>
                  <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed mb-6">
                    One click generates an executive PDF proposal with your brokerage logo, IRDA license, and clear price comparisons that corporate decision-makers love to sign.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#FBF9F5] border border-[#121316]/8 text-[11px] font-medium text-[#4B5563] flex items-center gap-2">
                  <Send className="w-4 h-4 text-[#0F5132]" />
                  <span>Ready to email or WhatsApp directly</span>
                </div>
              </div>

            </div>
          </div>

          <div className="text-center mt-auto pb-4">
            <button
              type="button"
              onClick={() => scrollToSection(2)}
              className="inline-flex items-center gap-1.5 text-xs text-[#4B5563] hover:text-[#0F5132] transition-colors cursor-pointer"
            >
              <span>See what insurance types we cover</span>
              <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
            </button>
          </div>
        </section>


        {/* ═════════════════════════════════════════════════════════
            SECTION 3: WHAT WE COVER (EVERY BUSINESS LINE)
        ═════════════════════════════════════════════════════════ */}
        <section
          id="coverage"
          className="snap-start min-h-screen w-full flex flex-col justify-center pt-24 pb-8 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto"
        >
          <div className="my-auto">
            <div className="text-center max-w-2xl mx-auto mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F5132]/10 border border-[#0F5132]/20 text-[#0F5132] text-xs font-bold uppercase tracking-wider mb-2.5">
                <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                <span>COMPLETE COMMERCIAL CATALOG</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-[-0.03em] text-[#121316] leading-tight mb-2">
                Every policy your business clients need.
              </h2>
              <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed">
                You never have to tell a client &quot;we don&apos;t do that line.&quot; Qoutely handles all 7 major commercial insurance categories.
              </p>
            </div>

            {/* Grid of 7 Friendly Coverage Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {COVERAGE_TYPES.map((cov) => (
                <div
                  key={cov.id}
                  className="bg-white rounded-2xl p-5 border border-[#121316]/10 shadow-xs hover:shadow-md hover:border-[#0F5132]/30 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-9 h-9 rounded-xl ${cov.bgLight} flex items-center justify-center`}>
                        <cov.icon className={`w-5 h-5 ${cov.color}`} />
                      </div>
                      <span className="text-[10px] font-bold text-[#0F5132] bg-[#0F5132]/10 px-2 py-0.5 rounded-full">
                        {cov.tag}
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-[#121316] mb-1.5 group-hover:text-[#0F5132] transition-colors">
                      {cov.name}
                    </h3>
                    <p className="text-xs text-[#4B5563] leading-relaxed mb-3">
                      {cov.description}
                    </p>
                  </div>

                  <div>
                    <div className="pt-2.5 border-t border-[#121316]/6 mb-3">
                      <span className="text-[10px] text-gray-400 block font-medium">Ideal For:</span>
                      <span className="text-[11px] font-semibold text-[#121316] line-clamp-1">{cov.idealFor}</span>
                    </div>
                    <Link
                      href={`/quotes/new?line=${cov.queryParam}`}
                      className="w-full py-2 px-3 rounded-lg bg-[#FBF9F5] hover:bg-[#0F5132] text-[#121316] hover:text-white font-bold text-xs border border-[#121316]/10 hover:border-[#0F5132] transition-all flex items-center justify-center gap-1.5"
                    >
                      <span>Quote {cov.name.split(' ')[0]}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}

              {/* 8th Card: Custom Package / All-in-One */}
              <div className="bg-[#0F5132] text-white rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center mb-3">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-base font-extrabold mb-1.5">
                    Multi-Line Corporate Bundles
                  </h3>
                  <p className="text-xs text-emerald-100/90 leading-relaxed">
                    Combine Property, Vehicle Fleet, and Employee Health into one bundled proposal for corporate clients.
                  </p>
                </div>
                <Link
                  href="/quotes/new"
                  className="w-full mt-4 py-2 px-3 rounded-lg bg-white text-[#0F5132] hover:bg-emerald-50 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Build Custom Package</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

          <div className="text-center mt-auto pb-4">
            <button
              type="button"
              onClick={() => scrollToSection(3)}
              className="inline-flex items-center gap-1.5 text-xs text-[#4B5563] hover:text-[#0F5132] transition-colors cursor-pointer"
            >
              <span>See why brokers love Qoutely</span>
              <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
            </button>
          </div>
        </section>


        {/* ═════════════════════════════════════════════════════════
            SECTION 4: WHY BROKERS LOVE QOUTELY (CONCRETE ADVANTAGES)
        ═════════════════════════════════════════════════════════ */}
        <section
          id="why-qoutely"
          className="snap-start min-h-screen w-full flex flex-col justify-center py-20 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto"
        >
          <div className="my-auto">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0F5132]/10 border border-[#0F5132]/20 text-[#0F5132] text-xs font-bold uppercase tracking-wider mb-3">
                <BadgeCheck className="w-3.5 h-3.5" aria-hidden="true" />
                <span>THE BROKER ADVANTAGE</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-[-0.03em] text-[#121316] leading-tight mb-4">
                Built to help you win more business.
              </h2>
              <p className="text-sm sm:text-base text-[#4B5563] leading-relaxed">
                Commercial insurance is competitive. Here is why modern brokers in Mumbai, Delhi, Bengaluru, and Chennai rely on Qoutely:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="p-6 rounded-3xl bg-white border border-[#121316]/10 shadow-xs">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#0F5132] flex items-center justify-center font-bold mb-4">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[#121316] mb-2">
                  5-Minute Turnaround
                </h3>
                <p className="text-xs text-[#4B5563] leading-relaxed">
                  While other brokers take days waiting on insurer emails, you deliver an executive comparison in 5 minutes and close the client first.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-[#121316]/10 shadow-xs">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold mb-4">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[#121316] mb-2">
                  100% Math Accuracy
                </h3>
                <p className="text-xs text-[#4B5563] leading-relaxed">
                  Never worry about formula errors in Excel. Statutory tariff tables, depreciation curves, and 18% GST are calculated with zero drift.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-[#121316]/10 shadow-xs">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold mb-4">
                  <Laptop className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[#121316] mb-2">
                  Branded For Your Firm
                </h3>
                <p className="text-xs text-[#4B5563] leading-relaxed">
                  Every downloaded PDF slip features your brokerage logo, IRDA license number, and contact details for maximum client trust.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-[#121316]/10 shadow-xs">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold mb-4">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[#121316] mb-2">
                  Bank-Grade Security
                </h3>
                <p className="text-xs text-[#4B5563] leading-relaxed">
                  Your customer contacts and policy schedules stay 100% confidential, stored safely in encrypted Indian cloud data centers (Mumbai).
                </p>
              </div>

            </div>
          </div>

          <div className="text-center mt-auto pb-4">
            <button
              type="button"
              onClick={() => scrollToSection(4)}
              className="inline-flex items-center gap-1.5 text-xs text-[#4B5563] hover:text-[#0F5132] transition-colors cursor-pointer"
            >
              <span>Ready to transform your brokerage?</span>
              <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
            </button>
          </div>
        </section>


        {/* ═════════════════════════════════════════════════════════
            SECTION 5: READY TO GET STARTED / CTA
        ═════════════════════════════════════════════════════════ */}
        <section
          id="get-started"
          className="snap-start min-h-screen w-full flex flex-col justify-center py-20 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto"
        >
          <div className="my-auto max-w-4xl mx-auto w-full text-center">
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0F5132]/10 border border-[#0F5132]/20 text-[#0F5132] text-xs font-bold uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              <span>THE FUTURE OF COMMERCIAL BROKING</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-[-0.03em] text-[#121316] leading-tight mb-4">
              Ready to close enterprise accounts 10x faster?
            </h2>

            <p className="text-sm sm:text-base text-[#4B5563] max-w-2xl mx-auto mb-10 leading-relaxed">
              No more waiting 3 days for underwriter replies or fighting broken spreadsheets. Generate multi-insurer rate comparisons and client-ready proposals in 60 seconds.
            </p>

            {/* Main Action Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-10 text-left">
              
              <Link
                href="/quotes/new"
                className="group p-6 rounded-3xl bg-[#0F5132] hover:bg-[#146c43] text-white transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center mb-4 text-emerald-300">
                    <Zap className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-black tracking-tight mb-1">
                    Launch Underwriting Studio
                  </h3>
                  <p className="text-xs text-emerald-100/80 leading-relaxed">
                    Compare instant rates across Fire, Motor Fleet, Marine, and Group Health right now.
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-white group-hover:gap-2.5 transition-all">
                  <span>Start a New Quote</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>

              <Link
                href="/login"
                className="group p-6 rounded-3xl bg-white hover:bg-slate-50 border border-[#121316]/10 text-[#121316] transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-[#121316]/5 flex items-center justify-center mb-4 text-[#121316]">
                    <Lock className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-black tracking-tight mb-1">
                    Broker Portal Sign In
                  </h3>
                  <p className="text-xs text-[#4B5563] leading-relaxed">
                    Access your active proposals, team pipeline, document repository, and client quote slips.
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-[#0F5132] group-hover:gap-2.5 transition-all">
                  <span>Sign In to Underwriting Desk</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>

            </div>

            {/* Trust and Compliance Ribbon */}
            <div className="pt-6 border-t border-[#121316]/8 flex flex-wrap items-center justify-center gap-6 text-xs text-[#4B5563]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#0F5132]" />
                <span className="font-semibold">IRDAI-Compliant Rating Math</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#0F5132]" />
                <span className="font-semibold">Bank-Grade 256-Bit SSL</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#0F5132]" />
                <span className="font-semibold">AWS Mumbai Sovereign Cloud</span>
              </div>
            </div>

            {/* Simple Footer */}
            <footer className="text-center text-xs text-[#4B5563] mt-10 pt-6 border-t border-[#121316]/8">
              <div>
                &copy; {new Date().getFullYear()} Qoutely Technologies Private Limited. All rights reserved.
              </div>
              <div className="flex justify-center gap-4 text-[11px] mt-1 text-gray-400">
                <span>Commercial Insurance Underwriting Infrastructure</span>
                <span>•</span>
                <span>DPDP Act 2023 Compliant</span>
              </div>
            </footer>

          </div>
        </section>

      </main>

      {/* Book Demo Modal */}
      <BookDemoModal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
      />
    </div>
  );
}
