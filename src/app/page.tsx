'use client';

import React, { useState, useId } from 'react';
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
  ChevronRight,
  FileText,
  Clock,
  Sparkles,
  ArrowUpRight,
  FileSpreadsheet,
  BadgeAlert,
  Server,
  Shield,
  FileCode,
  DollarSign,
  Download,
} from 'lucide-react';
import { BookDemoModal } from '@/components/scrollytelling/BookDemoModal';
import { formatNumberINR, formatINRWithDecimals } from '@/lib/calculator';

// ─────────────────────────────────────────────────────────
//  7 COMMERCIAL LINES DATA
// ─────────────────────────────────────────────────────────

interface CommercialLineCard {
  id: string;
  queryParam: string;
  name: string;
  shortName: string;
  badge: string;
  statute: string;
  tagline: string;
  metric: string;
  metricLabel: string;
  features: string[];
  link: string;
  icon: React.ComponentType<{ className?: string }>;
  formulaSummary: string;
  exampleRisk: string;
}

const COMMERCIAL_LINES: CommercialLineCard[] = [
  {
    id: 'property',
    queryParam: 'fire',
    name: 'Property & Fire (BLUS / BSUS)',
    shortName: 'Property & Fire',
    badge: 'BLUS / BSUS / SFSP',
    statute: 'IRDAI Tariff & BIS IS 1893:2002',
    tagline: 'Deterministic fire tariff math with IIB burning cost baselines, seismic zone grading, and STFI peril pricing.',
    metric: '₹500+ Cr',
    metricLabel: 'Single SI Capacity',
    features: [
      'ACORD 125 & Schedule of Values (SOV) parser in 280ms',
      'BIS IS 1893:2002 seismic earthquake zones I–IV auto-rating',
      'Statutory 15% underinsurance waiver clause enforcement',
      'STFI perils and flatted factory occupancy hazard grading',
    ],
    link: '/quotes/new?line=fire',
    icon: Flame,
    formulaSummary: 'Base Burning Rate + STFI (0.075‰) + EQ Zone III (0.10‰) × Sum Insured',
    exampleRisk: 'Industrial manufacturing facility (Sum Insured: ₹185 Cr, Thane-Belapur MIDC)',
  },
  {
    id: 'motor',
    queryParam: 'motor_fleet',
    name: 'Commercial Motor Fleet',
    shortName: 'Motor Fleet',
    badge: 'AIMT GR.8 & TP Tariff',
    statute: 'Motor Vehicles Act 1988 (Sec 146)',
    tagline: 'Bulk vehicle schedule ingestion, immutable IRDAI gazetted TP tariffs, and AIMT GR.8 depreciation schedules.',
    metric: '0% Discount',
    metricLabel: 'Strict TP Statutory Compliance',
    features: [
      'Bulk vehicle schedule Excel/CSV roster parser with automatic mapping',
      'AIMT GR.8 IDV age depreciation curves (5% to 50% statutory slabs)',
      'IRDAI gazetted TP tariffs by GVW tonnage and passenger seating slabs',
      'Commercial IMT 23, Zero Dep, and NCB (0% to 50%) experience rating',
    ],
    link: '/quotes/new?line=motor_fleet',
    icon: Car,
    formulaSummary: 'AIMT GR.8 IDV × Zone Base OD + IMT 23 (15%) + Gazetted Statutory TP',
    exampleRisk: 'Interstate logistics fleet (45 Ashok Leyland 4220 Trucks, Maharashtra/Gujarat)',
  },
  {
    id: 'marine',
    queryParam: 'marine_cargo',
    name: 'Marine Cargo & Logistics',
    shortName: 'Marine Cargo',
    badge: 'ITC A/B/C & ICC A/B/C',
    statute: 'Marine Insurance Act 1963 & Sec 64VB',
    tagline: 'Inland transit & ocean open covers with real-time Section 64VB statutory cash deposit balances.',
    metric: '110% CIF',
    metricLabel: 'Statutory Valuation Markup',
    features: [
      'Bill of Lading and shipping invoice data extraction and validation',
      'Incoterms 2020 CIF 110% statutory valuation formula enforcement',
      'Section 64VB cash deposit balance tracking and drawdown verification',
      'Ocean ICC A/B/C with War & Strikes peril rating and transshipment clauses',
    ],
    link: '/quotes/new?line=marine_cargo',
    icon: Anchor,
    formulaSummary: '110% CIF Consignment Value × (Base Transit 0.15% + War/SRCC 0.03%)',
    exampleRisk: 'Ocean container export (JNPT Mumbai to Rotterdam, ₹12.5 Cr machinery)',
  },
  {
    id: 'benefits',
    queryParam: 'benefits',
    name: 'Corporate Employee Benefits',
    shortName: 'Employee Benefits',
    badge: 'GMC / GTLI / GPA / WC',
    statute: 'Employees Compensation Act 1923 (Sec 4)',
    tagline: 'Automated census demographic age-banding and statutory workmen compensation actuarial factor rating.',
    metric: 'Schedule IV',
    metricLabel: 'Actuarial Factor Formula',
    features: [
      'Bulk employee census uploader with automatic age banding (0-25 to 76+)',
      'IALM 2012-14 benchmark mortality rates for Group Term Life (GTLI)',
      'EC Act statutory formula: 50%/60% × min(Wage, ₹15,000) × Age Factor',
      'GMC room rent limits, Day-1 maternity waivers & corporate buffer',
    ],
    link: '/quotes/new?line=benefits',
    icon: Heart,
    formulaSummary: 'Demographic Age-Band Pure Burning Cost × Loading + Corporate Buffer',
    exampleRisk: 'Enterprise IT workforce (1,250 lives GMC + GTLI + GPA, Bengaluru)',
  },
  {
    id: 'engineering',
    queryParam: 'engineering',
    name: 'Engineering & Project Risks',
    shortName: 'Engineering & CAR',
    badge: 'CAR / EAR / MB / EEI / BPP',
    statute: 'Indian Boilers Act 1923 & Munich Re Tariffs',
    tagline: 'Contractors All Risks, testing duration loading, and Machinery Breakdown rating with CRV schedules.',
    metric: '0.75‰ / mo',
    metricLabel: 'Testing Duration Loading',
    features: [
      'Fixed Asset Register (FAR) plant & machinery asset rollup',
      'CAR/EAR civil works (1.20‰) vs plant erection (1.80‰) rating split',
      'Machinery Breakdown (MB) Current Replacement Value across Groups I–IV',
      'Indian Boilers Act 1923 high-pressure (>20 bar) boiler explosion rating',
    ],
    link: '/quotes/new?line=engineering',
    icon: HardHat,
    formulaSummary: 'Civil Value × 1.2‰ + Plant Value × 1.8‰ + Testing Months × 0.75‰',
    exampleRisk: 'Solar EPC infrastructure project (₹320 Cr contract value, Rajasthan)',
  },
  {
    id: 'liability',
    queryParam: 'liability',
    name: 'Corporate Liability & Cyber',
    shortName: 'Liability & Cyber',
    badge: 'CGL / PI / D&O / Cyber',
    statute: 'IRDAI Broker Regs 2018 & DPDP Act 2023',
    tagline: 'Turnover rating, statutory broker PI floors, and 100-point cyber posture risk grading.',
    metric: '₹50 Lakhs',
    metricLabel: 'Statutory Broker PI Floor',
    features: [
      'Commercial General Liability (CGL) turnover rating with AOA:AOY ratios (1:1 to 1:4)',
      'Statutory broker PI floor: max(₹50 Lakhs, 3× annual brokerage fee income)',
      'D&O Side A/B/C pricing matrix for private and NSE/BSE listed companies',
      '100-point cyber posture scoring with mandatory MFA gating for breach cover',
    ],
    link: '/quotes/new?line=liability',
    icon: AlertCircle,
    formulaSummary: 'Annual Turnover × Hazard Class Base Rate × Territory Multiplier',
    exampleRisk: 'SaaS unicorn D&O + Tech PI + Cyber ($10M Limit, US Jurisdiction)',
  },
  {
    id: 'specialty',
    queryParam: 'specialty',
    name: 'Financial & Specialty Surety',
    shortName: 'Surety & Credit',
    badge: 'Surety / TCI / Burglary',
    statute: 'GFR 2017 Rules 170/171 & IRDAI Surety 2022',
    tagline: 'Surety Insurance Bonds replacing bank guarantees for government public tenders, plus Trade Credit.',
    metric: 'GFR 170/171',
    metricLabel: 'Bank Guarantee Replacement',
    features: [
      'Bid, Performance, Advance Payment & Retention Money surety bonds',
      'Contractor financial credit grading (AAA to BB) with working capital ratios',
      'Trade Credit receivables default rating and buyer portfolio limits',
      'Commercial Burglary first loss rating (25% to 100% statutory basis)',
    ],
    link: '/quotes/new?line=specialty',
    icon: ShieldCheck,
    formulaSummary: 'Bond Value × Grade Annual Rate (1.2%–3.5%) × (Tenure Months / 12)',
    exampleRisk: 'NHAI highway construction performance bond (₹45 Cr, Grade AA contractor)',
  },
];

// ─────────────────────────────────────────────────────────
//  CARRIER APPETITE COMPARISON SLIP (HERO PREVIEW DATA)
// ─────────────────────────────────────────────────────────

interface CarrierQuoteComparison {
  carrier: string;
  logoText: string;
  planName: string;
  recommended?: boolean;
  baseFirePremium: number;
  stfiPremium: number;
  eqPremium: number;
  terrorismPremium: number;
  netPremium: number;
  gstAmount: number;
  totalPayable: number;
  deductible: string;
  specialClause: string;
}

const CARRIER_COMPARISON_DATA: CarrierQuoteComparison[] = [
  {
    carrier: 'Tata AIG General',
    logoText: 'TATA AIG',
    planName: 'Commercial Industrial All Risks (IAR)',
    recommended: true,
    baseFirePremium: 685000,
    stfiPremium: 138750,
    eqPremium: 92500,
    terrorismPremium: 46250,
    netPremium: 962500,
    gstAmount: 173250,
    totalPayable: 1135750,
    deductible: '5% of claim or ₹5 Lakhs (whichever is less)',
    specialClause: '72-hour Storm Clause & Statutory 15% Underinsurance Waiver',
  },
  {
    carrier: 'ICICI Lombard General',
    logoText: 'ICICI LOMBARD',
    planName: 'Bharat Sookshma Udyam Suraksha (BSUS)',
    baseFirePremium: 710000,
    stfiPremium: 148000,
    eqPremium: 92500,
    terrorismPremium: 46250,
    netPremium: 996750,
    gstAmount: 179415,
    totalPayable: 1176165,
    deductible: '₹10 Lakhs each and every loss',
    specialClause: 'Debris Removal up to ₹1 Crore + Architect Fee (3%)',
  },
  {
    carrier: 'New India Assurance (PSU)',
    logoText: 'NEW INDIA',
    planName: 'Standard Fire & Special Perils (SFSP)',
    baseFirePremium: 647500,
    stfiPremium: 129500,
    eqPremium: 92500,
    terrorismPremium: 46250,
    netPremium: 915750,
    gstAmount: 164835,
    totalPayable: 1080585,
    deductible: '10% of claim or ₹15 Lakhs',
    specialClause: 'Strict Tariff Endorsements, Nil Escalation without Endorsement',
  },
];

// ─────────────────────────────────────────────────────────
//  FAQ ACCORDION COMPONENT
// ─────────────────────────────────────────────────────────

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const contentId = useId();

  return (
    <div className="border-b border-[#121316]/10 last:border-b-0 py-4 sm:py-5">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls={contentId}
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
        <div id={contentId} className="mt-3 text-xs sm:text-sm text-[#4B5563] leading-relaxed pr-6 pl-1 animate-fadeIn">
          {answer}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  MAIN STORYTELLING LANDING PAGE
// ─────────────────────────────────────────────────────────

export default function StorytellingLandingPage() {
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [selectedLineIndex, setSelectedLineIndex] = useState(0);
  const [selectedCarrierIndex, setSelectedCarrierIndex] = useState(0);

  // Live Calculator Sandbox State
  const [calcSumInsuredCr, setCalcSumInsuredCr] = useState<number>(50); // in Crores
  const [calcOccupancy, setCalcOccupancy] = useState<'warehouse' | 'textile' | 'chemical' | 'engineering'>('warehouse');
  const [calcEqZone, setCalcEqZone] = useState<'zone1' | 'zone2' | 'zone3' | 'zone4'>('zone3');

  // Compute live sandbox tariff
  const sandboxCalculations = React.useMemo(() => {
    const sumInsuredINR = calcSumInsuredCr * 10000000;
    
    // Base burning rates per mille (‰) based on IIB baselines
    let baseRatePerMille = 0.45;
    if (calcOccupancy === 'warehouse') baseRatePerMille = 0.45;
    else if (calcOccupancy === 'engineering') baseRatePerMille = 0.55;
    else if (calcOccupancy === 'textile') baseRatePerMille = 0.85;
    else if (calcOccupancy === 'chemical') baseRatePerMille = 1.25;

    // STFI rate per mille
    const stfiRatePerMille = 0.075;

    // EQ zone rate per mille (BIS IS 1893:2002)
    let eqRatePerMille = 0.10;
    if (calcEqZone === 'zone1') eqRatePerMille = 0.05;
    else if (calcEqZone === 'zone2') eqRatePerMille = 0.08;
    else if (calcEqZone === 'zone3') eqRatePerMille = 0.10;
    else if (calcEqZone === 'zone4') eqRatePerMille = 0.25;

    const compositeRatePerMille = baseRatePerMille + stfiRatePerMille + eqRatePerMille;
    const netPremium = Math.round((sumInsuredINR * compositeRatePerMille) / 1000);
    const gstAmount = Math.round(netPremium * 0.18);
    const totalPremium = netPremium + gstAmount;

    return {
      sumInsuredINR,
      baseRatePerMille,
      stfiRatePerMille,
      eqRatePerMille,
      compositeRatePerMille,
      netPremium,
      gstAmount,
      totalPremium,
    };
  }, [calcSumInsuredCr, calcOccupancy, calcEqZone]);

  const activeLine = COMMERCIAL_LINES[selectedLineIndex] ?? COMMERCIAL_LINES[0];
  const activeCarrier = CARRIER_COMPARISON_DATA[selectedCarrierIndex] ?? CARRIER_COMPARISON_DATA[0];

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#121316] selection:bg-[#0F5132]/20 selection:text-[#0F5132] font-sans antialiased">
      {/* ─────────────────────────────────────────────────────────
          SEO SCHEMA.ORG JSON-LD STRUCTURED DATA
      ───────────────────────────────────────────────────────── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'Qoutely',
              operatingSystem: 'Web Browser (Cloud)',
              applicationCategory: 'BusinessApplication',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'INR',
              },
              description:
                'Deterministic Commercial Insurance Underwriting Operating System for IRDAI-licensed brokers in India across 7 commercial lines.',
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.9',
                ratingCount: '128',
              },
            },
            {
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Qoutely Technologies Private Limited',
              url: 'https://qoutely.com',
              logo: 'https://qoutely.com/qoutely_logo.png',
              sameAs: ['https://twitter.com/qoutely', 'https://linkedin.com/company/qoutely'],
            },
            {
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: [
                {
                  '@type': 'Question',
                  name: 'How does Qoutely guarantee compliance with IRDAI statutory regulations?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Qoutely embeds deterministic Indian insurance statutory rules directly into pure TypeScript calculation cores. Fire tariffs adhere strictly to BLUS and BSUS regulations, motor IDVs compute using statutory AIMT GR.8 depreciation schedules (5% to 50%), marine cargo incorporates Section 64VB Cash Deposit drawdown validation, and workmen compensation calculations adhere to Section 4 and Schedule IV of the Employees Compensation Act 1923. Zero calculations are performed by LLMs.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Can Qoutely generate multi-carrier comparative quote slips for corporate clients?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes. Qoutely generates executive, audit-ready PDF comparison slips across major Indian general insurers (Tata AIG, ICICI Lombard, New India Assurance, Bajaj Allianz, HDFC ERGO) detailing net premiums, STFI add-on breakdowns, deductibles, warranties, and carrier appetite matches.',
                  },
                },
              ],
            },
          ]),
        }}
      />

      {/* ─────────────────────────────────────────────────────────
          REGULATORY STATUS TICKER STRIP
      ───────────────────────────────────────────────────────── */}
      <aside aria-label="Regulatory Notice" className="bg-[#121316] text-white py-2 px-4 text-[11px] font-mono border-b border-white/10">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-gray-300">
              IRDAI Broker Regulations 2018 Compliant • Sovereign Indian Cloud (Mumbai)
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-gray-400">
            <span>IIB Burning Cost Baselines</span>
            <span>•</span>
            <span>GFR 170/171 Surety Bonds</span>
            <span>•</span>
            <span>DPDP Act 2023 Verified</span>
          </div>
        </div>
      </aside>

      {/* ─────────────────────────────────────────────────────────
          CLEAN INSTITUTIONAL NAVBAR
      ───────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#FBF9F5]/90 backdrop-blur-md border-b border-[#121316]/8 transition-all">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-3.5 flex items-center justify-between">
          {/* Brand Mark */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5132] rounded-xl p-0.5"
          >
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
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black tracking-tight text-[#121316]">
                  Qoutely
                </span>
                <span className="w-2 h-2 rounded-full bg-[#0F5132]" />
              </div>
              <span className="text-[9px] font-mono font-semibold tracking-wider text-[#0F5132] uppercase -mt-0.5">
                Commercial Broker OS
              </span>
            </div>
          </Link>

          {/* Navigation Anchors */}
          <nav aria-label="Main Navigation" className="hidden lg:flex items-center gap-7">
            <a
              href="#the-problem"
              className="text-xs font-bold text-[#4B5563] hover:text-[#0F5132] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5132] rounded-md px-1"
            >
              The Problem
            </a>
            <a
              href="#how-it-works"
              className="text-xs font-bold text-[#4B5563] hover:text-[#0F5132] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5132] rounded-md px-1"
            >
              How It Works
            </a>
            <a
              href="#commercial-lines"
              className="text-xs font-bold text-[#4B5563] hover:text-[#0F5132] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5132] rounded-md px-1"
            >
              7 Commercial Lines
            </a>
            <a
              href="#why-deterministic"
              className="text-xs font-bold text-[#4B5563] hover:text-[#0F5132] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5132] rounded-md px-1"
            >
              Why Deterministic?
            </a>
            <a
              href="#live-calculator"
              className="text-xs font-bold text-[#4B5563] hover:text-[#0F5132] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5132] rounded-md px-1"
            >
              Live Rate Verifier
            </a>
            <a
              href="#compliance"
              className="text-xs font-bold text-[#4B5563] hover:text-[#0F5132] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5132] rounded-md px-1"
            >
              Compliance
            </a>
            <a
              href="#faq"
              className="text-xs font-bold text-[#4B5563] hover:text-[#0F5132] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5132] rounded-md px-1"
            >
              FAQs
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="hidden sm:inline-flex items-center text-xs font-bold text-[#121316] hover:text-[#0F5132] px-3.5 py-2 rounded-xl transition-colors border border-[#121316]/10 hover:border-[#0F5132]"
            >
              Broker Portal
            </Link>
            <Link
              href="/quotes/new"
              className="inline-flex items-center gap-2 text-xs font-bold bg-[#0F5132] hover:bg-[#146c43] text-white px-4 py-2 rounded-xl shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0F5132]"
            >
              <span>Launch Studio</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────
          ACT 1: THE HERO (HUMAN, CLEAR, INSTITUTIONAL)
      ───────────────────────────────────────────────────────── */}
      <section className="relative pt-12 sm:pt-16 lg:pt-20 pb-16 sm:pb-24 px-6 sm:px-10 lg:px-16 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left 7 Cols: The Story Proposition */}
            <div className="lg:col-span-7 flex flex-col items-start text-left">
              
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0F5132]/10 border border-[#0F5132]/20 text-[#0F5132] text-xs font-bold tracking-wider uppercase mb-5">
                <Sparkles className="w-3.5 h-3.5 text-[#0F5132]" aria-hidden="true" />
                <span>IRDAI-COMPLIANT COMMERCIAL UNDERWRITING OS</span>
              </div>

              {/* Punchy Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-[-0.03em] text-[#121316] leading-[1.08] mb-6">
                Turn 50-page insurance tenders into audit-ready quote slips{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0F5132] to-[#15803d]">
                  in seconds.
                </span>
              </h1>

              {/* Subheadline (Zero AI Cliché, Pure Broker Reality) */}
              <p className="text-base sm:text-lg text-[#4B5563] leading-relaxed max-w-2xl mb-8">
                Commercial brokers spend days manually copying sum insureds from messy tender schedules, cross-referencing tariff books, and fighting spreadsheet errors. Qoutely parses your risk documents, computes statutory Indian tariffs deterministically, and generates multi-insurer comparative slips in 280 milliseconds.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto mb-10">
                <Link
                  href="/quotes/new"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-[#0F5132] hover:bg-[#146c43] text-white font-extrabold text-sm shadow-md shadow-[#0F5132]/20 transition-all hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0F5132]"
                >
                  <span>Launch Underwriting Studio</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>

                <Link
                  href="/documents"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white hover:bg-[#FBF9F5] text-[#121316] font-bold text-sm border border-[#121316]/15 hover:border-[#0F5132] transition-all shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5132]"
                >
                  <FileSpreadsheet className="w-4 h-4 text-[#0F5132]" aria-hidden="true" />
                  <span>Upload Tender / SOV</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setDemoModalOpen(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-transparent hover:bg-black/5 text-[#4B5563] hover:text-[#121316] font-bold text-sm transition-colors cursor-pointer"
                >
                  <span>Book Enterprise Demo</span>
                </button>
              </div>

              {/* Verifiable Operational Trust Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full pt-8 border-t border-[#121316]/10">
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-[#121316] font-mono tracking-tight">₹2,400+ Cr</div>
                  <div className="text-[11px] text-[#4B5563] font-medium mt-0.5">Sum Insured Modeled</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-[#0F5132] font-mono tracking-tight">280 ms</div>
                  <div className="text-[11px] text-[#4B5563] font-medium mt-0.5">Document Ingestion</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-[#121316] font-mono tracking-tight">0% Drift</div>
                  <div className="text-[11px] text-[#4B5563] font-medium mt-0.5">Zero LLM Math Errors</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-[#0F5132] font-mono tracking-tight">7 Lines</div>
                  <div className="text-[11px] text-[#4B5563] font-medium mt-0.5">100% Statutorily Live</div>
                </div>
              </div>
            </div>

            {/* Right 5 Cols: Live Interactive Multi-Insurer Slip Preview */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-3xl border border-[#121316]/12 shadow-[0_20px_50px_rgba(0,0,0,0.06)] p-6 relative overflow-hidden">
                {/* Header Badge */}
                <div className="flex items-center justify-between pb-4 border-b border-[#121316]/8 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#15803d]" />
                    <span className="text-xs font-mono font-bold text-[#121316] uppercase tracking-wider">
                      LIVE COMPARATIVE QUOTE SLIP
                    </span>
                  </div>
                  <span className="text-[10px] font-mono bg-[#0F5132]/10 text-[#0F5132] px-2.5 py-0.5 rounded-full font-bold">
                    QTL-2026-IND-082
                  </span>
                </div>

                {/* Risk Title & Sum Insured Callout */}
                <div className="mb-4">
                  <div className="text-xs text-[#4B5563] uppercase tracking-wider font-semibold">Corporate Client</div>
                  <div className="text-base font-extrabold text-[#121316]">
                    Adani Total Logistics Infrastructure Ltd
                  </div>
                  <div className="text-xs text-[#4B5563] mt-0.5 flex items-center gap-1.5">
                    <span>Multimodal Warehousing Park</span>
                    <span>•</span>
                    <span className="font-mono text-[#0F5132] font-semibold">MIDC Taloja, Maharashtra</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FBF9F5] border border-[#121316]/8 mb-5 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-[#4B5563] uppercase tracking-wider font-bold">Total Sum Insured</div>
                    <div className="text-xs text-gray-500">Building + Plant + Stocks</div>
                  </div>
                  <div className="text-lg font-black font-mono text-[#121316]">
                    ₹185,00,00,000
                  </div>
                </div>

                {/* Multi-Carrier Tabs */}
                <div className="mb-4">
                  <div className="text-[11px] font-bold text-[#4B5563] uppercase tracking-wider mb-2">
                    Select Insurer Comparison:
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#FBF9F5] rounded-xl border border-[#121316]/8">
                    {CARRIER_COMPARISON_DATA.map((c, idx) => (
                      <button
                        key={c.carrier}
                        type="button"
                        onClick={() => setSelectedCarrierIndex(idx)}
                        className={`py-2 px-2 rounded-lg text-[11px] font-bold transition-all text-center cursor-pointer ${
                          selectedCarrierIndex === idx
                            ? 'bg-white text-[#0F5132] shadow-xs border border-[#0F5132]/30'
                            : 'text-[#4B5563] hover:text-[#121316]'
                        }`}
                      >
                        {c.logoText}
                        {c.recommended && (
                          <span className="block text-[8px] font-mono text-[#15803d]">★ Best Match</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active Carrier Pricing Breakdown */}
                <div className="bg-[#FBF9F5]/70 rounded-2xl p-4 border border-[#121316]/6 space-y-2 mb-4 text-xs font-mono">
                  <div className="flex items-center justify-between text-[#4B5563]">
                    <span>Basic Fire Tariff (IIB Burning Cost):</span>
                    <span className="font-bold text-[#121316]">₹{formatNumberINR(activeCarrier.baseFirePremium)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#4B5563]">
                    <span>STFI Perils Rate (0.075‰):</span>
                    <span className="font-bold text-[#121316]">₹{formatNumberINR(activeCarrier.stfiPremium)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#4B5563]">
                    <span>Seismic Zone III (BIS IS 1893):</span>
                    <span className="font-bold text-[#121316]">₹{formatNumberINR(activeCarrier.eqPremium)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#4B5563]">
                    <span>Terrorism Risk Pool Mandate:</span>
                    <span className="font-bold text-[#121316]">₹{formatNumberINR(activeCarrier.terrorismPremium)}</span>
                  </div>
                  <div className="pt-2 border-t border-[#121316]/10 flex items-center justify-between text-[#0F5132] font-bold">
                    <span>Net Underwritten Premium:</span>
                    <span className="text-sm">₹{formatNumberINR(activeCarrier.netPremium)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#4B5563] text-[11px]">
                    <span>GST @ 18% (CGST 9% + SGST 9%):</span>
                    <span>₹{formatNumberINR(activeCarrier.gstAmount)}</span>
                  </div>
                  <div className="pt-2 border-t-2 border-[#0F5132]/30 flex items-center justify-between text-base font-black text-[#121316]">
                    <span>Total Client Payable:</span>
                    <span className="text-[#0F5132]">₹{formatNumberINR(activeCarrier.totalPayable)}</span>
                  </div>
                </div>

                {/* Deductible & Policy Warranty */}
                <div className="text-[11px] text-[#4B5563] bg-white rounded-xl p-3 border border-[#121316]/8 space-y-1 mb-5">
                  <div className="font-semibold text-[#121316]">
                    Clause: <span className="font-normal text-[#4B5563]">{activeCarrier.specialClause}</span>
                  </div>
                  <div className="font-semibold text-[#121316]">
                    Deductible: <span className="font-normal text-[#4B5563]">{activeCarrier.deductible}</span>
                  </div>
                </div>

                {/* Direct Action Link */}
                <Link
                  href="/quotes/new?line=fire"
                  className="w-full py-3 px-4 rounded-xl bg-[#0F5132] hover:bg-[#146c43] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Generate Full Audit Slip for this Risk</span>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          ACT 2: THE BROKER'S STRUGGLE (THE REAL HUMAN PROBLEM)
      ───────────────────────────────────────────────────────── */}
      <section id="the-problem" className="py-20 px-6 sm:px-10 lg:px-16 bg-white border-y border-[#121316]/10">
        <div className="max-w-6xl mx-auto">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-bold tracking-wider uppercase mb-3">
              <BadgeAlert className="w-3.5 h-3.5 text-red-600" aria-hidden="true" />
              <span>THE BROKER&apos;S DAILY NIGHTMARE</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-[-0.03em] text-[#121316] leading-tight mb-4">
              Why commercial quoting takes 3 days instead of 3 minutes.
            </h2>
            <p className="text-sm sm:text-base text-[#4B5563] leading-relaxed">
              Every licensed broker knows the pain: high-ticket commercial insurance has massive commissions, but the operational grind of quoting complex risks is utterly exhausting.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="p-8 rounded-3xl bg-[#FBF9F5] border border-[#121316]/10 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-red-100 border border-red-200 flex items-center justify-center text-red-700 font-bold text-lg mb-6">
                  01
                </div>
                <h3 className="text-xl font-bold text-[#121316] mb-3">
                  The 50-Page RFQ Document Trap
                </h3>
                <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed mb-4">
                  Client RFQs arrive as scanned PDF tenders, messy multi-tab Excel sheets, and handwritten risk notes. Junior broker analysts spend 48 hours manually typing building, plant, and inventory values into individual spreadsheets.
                </p>
              </div>
              <div className="pt-4 border-t border-[#121316]/8 text-[11px] font-mono text-red-700 font-semibold">
                Cost: 20+ lost analyst hours per commercial deal
              </div>
            </div>

            {/* Card 2 */}
            <div className="p-8 rounded-3xl bg-[#FBF9F5] border border-[#121316]/10 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 font-bold text-lg mb-6">
                  02
                </div>
                <h3 className="text-xl font-bold text-[#121316] mb-3">
                  The Multi-Crore Arithmetic Risk
                </h3>
                <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed mb-4">
                  Indian insurance law enforces strict statutory math: AIMT GR.8 depreciation schedules, BIS IS 1893 seismic zones, and EC Act Schedule IV factors. One copy-paste formula error can misquote premium by ₹15 Lakhs or trigger an IRDAI compliance notice.
                </p>
              </div>
              <div className="pt-4 border-t border-[#121316]/8 text-[11px] font-mono text-amber-700 font-semibold">
                Risk: Margin leakage &amp; statutory compliance audits
              </div>
            </div>

            {/* Card 3 */}
            <div className="p-8 rounded-3xl bg-[#FBF9F5] border border-[#121316]/10 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-lg mb-6">
                  03
                </div>
                <h3 className="text-xl font-bold text-[#121316] mb-3">
                  The Insurer Appetite Black Box
                </h3>
                <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed mb-4">
                  Brokers must email 4 to 6 different general insurers (Tata AIG, ICICI Lombard, New India, HDFC ERGO) to determine who has capacity for chemical storage, high-pressure boilers, or fleet tonnage. Underwriting desks take days to reply.
                </p>
              </div>
              <div className="pt-4 border-t border-[#121316]/8 text-[11px] font-mono text-blue-700 font-semibold">
                Result: Clients get impatient and competitors win the deal
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          ACT 3: THE 3-STEP SOLUTION (SO SIMPLE ANYBODY UNDERSTANDS)
      ───────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0F5132]/10 border border-[#0F5132]/20 text-[#0F5132] text-xs font-bold tracking-wider uppercase mb-3">
            <Zap className="w-3.5 h-3.5 text-[#0F5132]" aria-hidden="true" />
            <span>THE 3-STEP WORKFLOW</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-[-0.03em] text-[#121316] leading-tight mb-4">
            How Qoutely works.
          </h2>
          <p className="text-sm sm:text-base text-[#4B5563] leading-relaxed">
            No complex setup. No 6-month enterprise onboarding. Just drop your documents, review the deterministic calculations, and download client slips.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Step 1 */}
          <div className="bg-white rounded-3xl p-8 border border-[#121316]/10 shadow-xs flex flex-col justify-between group hover:border-[#0F5132]/40 transition-all">
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="w-12 h-12 rounded-2xl bg-[#0F5132]/10 text-[#0F5132] font-mono font-black text-lg flex items-center justify-center">
                  01
                </span>
                <span className="text-[10px] font-mono font-bold bg-[#15803d]/10 text-[#15803d] px-2.5 py-1 rounded-full">
                  280 MS PARSER
                </span>
              </div>
              <h3 className="text-xl font-bold text-[#121316] mb-3">
                Drop Your Risk Documents
              </h3>
              <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed mb-6">
                Drag and drop your tender PDF, Schedule of Values (SOV), fleet Excel roster, or employee census CSV. Our perception engine extracts 47+ typed risk parameters with confidence scoring in under 280ms.
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#FBF9F5] border border-[#121316]/8 text-[11px] font-mono text-[#0F5132]">
              Accepts: PDF, Excel, CSV, ACORD 125, Scanned Slips
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-3xl p-8 border-2 border-[#0F5132]/40 shadow-md flex flex-col justify-between group relative">
            <div className="absolute -top-3.5 right-6 bg-[#0F5132] text-white text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-xs">
              100% STATUTORY
            </div>
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="w-12 h-12 rounded-2xl bg-[#0F5132] text-white font-mono font-black text-lg flex items-center justify-center shadow-xs">
                  02
                </span>
                <span className="text-[10px] font-mono font-bold bg-[#0F5132]/10 text-[#0F5132] px-2.5 py-1 rounded-full">
                  PURE TYPESCRIPT
                </span>
              </div>
              <h3 className="text-xl font-bold text-[#121316] mb-3">
                Deterministic Underwriting Engine
              </h3>
              <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed mb-6">
                Pure TypeScript code executes the gazetted statutory math. BLUS/BSUS fire burning costs, AIMT GR.8 age depreciation, Section 64VB deposit drawdowns, and BIS seismic zones are computed with zero LLM arithmetic drift.
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#0F5132]/10 border border-[#0F5132]/20 text-[11px] font-mono text-[#0F5132] font-bold">
              Guaranteed: 100% Reproducible Audit Trail
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-3xl p-8 border border-[#121316]/10 shadow-xs flex flex-col justify-between group hover:border-[#0F5132]/40 transition-all">
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="w-12 h-12 rounded-2xl bg-[#0F5132]/10 text-[#0F5132] font-mono font-black text-lg flex items-center justify-center">
                  03
                </span>
                <span className="text-[10px] font-mono font-bold bg-[#15803d]/10 text-[#15803d] px-2.5 py-1 rounded-full">
                  ONE-CLICK PDF
                </span>
              </div>
              <h3 className="text-xl font-bold text-[#121316] mb-3">
                Download Audit-Ready Slips
              </h3>
              <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed mb-6">
                Export client-ready comparative quote slips comparing Tata AIG, ICICI Lombard, New India, and more. Formatted strictly to IRDAI Broker Regulations 2018 with policy deductibles, warranties, and carrier appetite matches.
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#FBF9F5] border border-[#121316]/8 text-[11px] font-mono text-[#0F5132]">
              Outputs: Multi-carrier PDF quote slips &amp; audit logs
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          ACT 4: 7 COMMERCIAL LINES INTERACTIVE EXPLORER
      ───────────────────────────────────────────────────────── */}
      <section id="commercial-lines" className="py-20 px-6 sm:px-10 lg:px-16 bg-[#121316] text-white">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-[#10B981] text-xs font-bold tracking-wider uppercase mb-3">
              <Layers className="w-3.5 h-3.5 text-[#10B981]" aria-hidden="true" />
              <span>THE COMPLETE COMMERCIAL INSURANCE CATALOG</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-[-0.03em] leading-tight mb-4">
              All 7 Indian Commercial Lines.<br />
              <span className="text-[#10B981]">
                Zero Placeholders. 100% Operational.
              </span>
            </h2>
            <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
              Click any commercial line below to inspect its governing Indian statute, underwriting formula, and live production capabilities.
            </p>
          </div>

          {/* Interactive Line Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
            {COMMERCIAL_LINES.map((line, idx) => (
              <button
                key={line.id}
                type="button"
                onClick={() => setSelectedLineIndex(idx)}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  selectedLineIndex === idx
                    ? 'bg-[#10B981] text-[#121316] shadow-md shadow-[#10B981]/20 font-black'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/10'
                }`}
              >
                <line.icon className="w-4 h-4" />
                <span>{line.shortName}</span>
              </button>
            ))}
          </div>

          {/* Active Line Detail Card */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 sm:p-10 backdrop-blur-md">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left 7 Cols */}
              <div className="lg:col-span-7">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="text-xs font-mono font-bold bg-[#10B981]/20 text-[#10B981] px-3 py-1 rounded-full border border-[#10B981]/30">
                    {activeLine.badge}
                  </span>
                  <span className="text-xs font-mono text-gray-400">
                    Statutory Authority: <span className="text-white font-bold">{activeLine.statute}</span>
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-white mb-3">
                  {activeLine.name}
                </h3>
                <p className="text-sm text-gray-300 leading-relaxed mb-6">
                  {activeLine.tagline}
                </p>

                {/* Statutory Formula Callout */}
                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 mb-6">
                  <div className="text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1">
                    Deterministic Statutory Formula:
                  </div>
                  <div className="text-xs sm:text-sm font-mono text-[#10B981] font-bold">
                    {activeLine.formulaSummary}
                  </div>
                </div>

                {/* Example Risk */}
                <div className="text-xs text-gray-400 mb-8">
                  <span className="font-bold text-gray-300">Live Client Example:</span> {activeLine.exampleRisk}
                </div>

                {/* Features Checkmarks */}
                <div className="space-y-2.5 mb-8">
                  {activeLine.features.map((feat) => (
                    <div key={feat} className="flex items-center gap-2.5 text-xs text-gray-200">
                      <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" aria-hidden="true" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                {/* Launch Button */}
                <Link
                  href={activeLine.link}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-[#121316] font-extrabold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Open {activeLine.shortName} Underwriting Studio</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </div>

              {/* Right 5 Cols: Line Metric & Compliance Highlights */}
              <div className="lg:col-span-5 bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
                <div className="mb-6">
                  <div className="text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1">
                    {activeLine.metricLabel}
                  </div>
                  <div className="text-3xl sm:text-4xl font-mono font-black text-[#10B981]">
                    {activeLine.metric}
                  </div>
                </div>

                <div className="space-y-4 text-xs text-gray-300">
                  <div className="p-3 rounded-xl bg-black/30 border border-white/5">
                    <span className="font-bold text-white block mb-0.5">Carrier Comparatives</span>
                    Automates rate comparison across Tata AIG, ICICI Lombard, New India, HDFC ERGO, and Bajaj Allianz.
                  </div>
                  <div className="p-3 rounded-xl bg-black/30 border border-white/5">
                    <span className="font-bold text-white block mb-0.5">Automated Clause Insertion</span>
                    Embeds 72-Hour Perils Clause, Designation of Property, Escalation (5% to 25%), and Terrorism Pool add-ons.
                  </div>
                  <div className="p-3 rounded-xl bg-black/30 border border-white/5">
                    <span className="font-bold text-white block mb-0.5">Instant PDF Dispatch</span>
                    One-click download of audit-ready client slips with your brokerage CIN and IRDA License Number.
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          ACT 5: WHY DETERMINISTIC? (THE TRUST MANIFESTO)
      ───────────────────────────────────────────────────────── */}
      <section id="why-deterministic" className="py-20 px-6 sm:px-10 lg:px-16 bg-white border-b border-[#121316]/10">
        <div className="max-w-6xl mx-auto">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0F5132]/10 border border-[#0F5132]/20 text-[#0F5132] text-xs font-bold tracking-wider uppercase mb-3">
              <Cpu className="w-3.5 h-3.5 text-[#0F5132]" aria-hidden="true" />
              <span>THE TRUST ARCHITECTURE</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-[-0.03em] text-[#121316] leading-tight mb-4">
              Software 2.0 Perception.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0F5132] to-[#15803d]">
                Software 1.0 Deterministic Math.
              </span>
            </h2>
            <p className="text-sm sm:text-base text-[#4B5563] leading-relaxed">
              We love generative AI for parsing messy, unstructured broker schedules. But we strictly ban AI from performing insurance mathematics. Here is why:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            
            {/* Layer 1: Perception */}
            <div className="bg-[#FBF9F5] border border-[#121316]/10 rounded-3xl p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#0F5132] mb-3">
                  <Zap className="w-4 h-4 text-[#0F5132]" aria-hidden="true" />
                  <span>Layer 1: Perception &amp; Ingestion</span>
                </div>
                <h3 className="text-2xl font-bold text-[#121316] mb-3">
                  AI Vision &amp; OCR Engine
                </h3>
                <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed mb-6">
                  Extracts 47+ typed risk parameters from scanned tenders, ACORD 125 forms, multi-vehicle rosters, and employee census spreadsheets. Normalizes currency units and addresses in 280ms.
                </p>

                <div className="space-y-2.5 text-xs text-[#121316]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#15803d] shrink-0" aria-hidden="true" />
                    <span>Handles messy PDF tables and rotated scans</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#15803d] shrink-0" aria-hidden="true" />
                    <span>Demographic census age-band categorization</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#15803d] shrink-0" aria-hidden="true" />
                    <span>Confidence scoring with human-in-the-loop review</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-3 rounded-2xl bg-white border border-[#121316]/8 text-[11px] font-mono text-[#0F5132]">
                Input: Raw Broker Slip → Output: Strictly Typed JSON Schema
              </div>
            </div>

            {/* Layer 2: Deterministic Math */}
            <div className="bg-white border-2 border-[#0F5132]/40 rounded-3xl p-8 shadow-xl flex flex-col justify-between relative">
              <div className="absolute -top-3.5 right-8 bg-[#0F5132] text-white text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-xs">
                IMMUTABLE AUDIT TRAIL
              </div>

              <div>
                <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#0F5132] mb-3">
                  <Scale className="w-4 h-4 text-[#0F5132]" aria-hidden="true" />
                  <span>Layer 2: Deterministic Underwriting</span>
                </div>
                <h3 className="text-2xl font-bold text-[#121316] mb-3">
                  Pure TypeScript Statutory Math
                </h3>
                <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed mb-6">
                  Zero LLM execution in pricing. Every statutory tariff formula, depreciation curve, and deductible is coded in deterministic TypeScript, adhering strictly to gazetted IRDAI tables and IIB burning cost baselines.
                </p>

                <div className="space-y-2.5 text-xs text-[#121316] font-semibold">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#0F5132] shrink-0" aria-hidden="true" />
                    <span>BLUS/BSUS Tariff Math (15% Underinsurance Waiver)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#0F5132] shrink-0" aria-hidden="true" />
                    <span>AIMT GR.8 Age Depreciation Schedule (5% to 50%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#0F5132] shrink-0" aria-hidden="true" />
                    <span>Section 64VB Cash Deposit Balance Ledger Verification</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#0F5132] shrink-0" aria-hidden="true" />
                    <span>EC Act 1923 Schedule IV Actuarial Factors</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-3 rounded-2xl bg-[#0F5132]/10 border border-[#0F5132]/20 text-[11px] font-mono text-[#0F5132] font-bold">
                Result: 100% Reproducible Underwriting &amp; Zero Calculation Drift
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          ACT 6: LIVE INTERACTIVE RATE VERIFIER SANDBOX
      ───────────────────────────────────────────────────────── */}
      <section id="live-calculator" className="py-20 px-6 sm:px-10 lg:px-16 max-w-5xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0F5132]/10 border border-[#0F5132]/20 text-[#0F5132] text-xs font-bold tracking-wider uppercase mb-3">
            <Sliders className="w-3.5 h-3.5 text-[#0F5132]" aria-hidden="true" />
            <span>INTERACTIVE TARIFF SANDBOX</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-[-0.03em] text-[#121316] leading-tight mb-3">
            Try the deterministic math yourself.
          </h2>
          <p className="text-xs sm:text-sm text-[#4B5563]">
            Adjust the risk sliders below to see the statutory property tariff compute live in your browser.
          </p>
        </div>

        <div className="bg-white border border-[#121316]/12 rounded-3xl p-6 sm:p-10 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            
            {/* Sliders and Controls */}
            <div className="space-y-6">
              {/* Sum Insured Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="sum-insured-range" className="text-xs font-bold text-[#121316] uppercase tracking-wider">
                    Total Sum Insured (₹ Crores):
                  </label>
                  <span className="text-base font-black font-mono text-[#0F5132]">
                    ₹{calcSumInsuredCr} Cr
                  </span>
                </div>
                <input
                  id="sum-insured-range"
                  type="range"
                  min="5"
                  max="500"
                  step="5"
                  value={calcSumInsuredCr}
                  onChange={(e) => setCalcSumInsuredCr(Number(e.target.value))}
                  className="w-full accent-[#0F5132] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-gray-400 mt-1">
                  <span>₹5 Cr (Small Commercial)</span>
                  <span>₹250 Cr</span>
                  <span>₹500 Cr (Mega Industrial)</span>
                </div>
              </div>

              {/* Occupancy Selector */}
              <div>
                <label className="text-xs font-bold text-[#121316] uppercase tracking-wider block mb-2">
                  Occupancy Hazard Classification (IIB):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'warehouse', label: 'Warehousing (0.45‰)' },
                    { id: 'engineering', label: 'Light Eng (0.55‰)' },
                    { id: 'textile', label: 'Textiles / Cotton (0.85‰)' },
                    { id: 'chemical', label: 'Chemical / Bulk (1.25‰)' },
                  ].map((occ) => (
                    <button
                      key={occ.id}
                      type="button"
                      onClick={() => setCalcOccupancy(occ.id as any)}
                      className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all text-left cursor-pointer ${
                        calcOccupancy === occ.id
                          ? 'bg-[#0F5132]/10 border-[#0F5132] text-[#0F5132] font-bold'
                          : 'bg-[#FBF9F5] border-[#121316]/10 text-[#4B5563] hover:text-[#121316]'
                      }`}
                    >
                      {occ.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Seismic Zone Selector */}
              <div>
                <label className="text-xs font-bold text-[#121316] uppercase tracking-wider block mb-2">
                  BIS IS 1893:2002 Seismic Zone:
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: 'zone1', label: 'Zone I (0.05‰)' },
                    { id: 'zone2', label: 'Zone II (0.08‰)' },
                    { id: 'zone3', label: 'Zone III (0.10‰)' },
                    { id: 'zone4', label: 'Zone IV (0.25‰)' },
                  ].map((z) => (
                    <button
                      key={z.id}
                      type="button"
                      onClick={() => setCalcEqZone(z.id as any)}
                      className={`py-2 px-1 text-[11px] font-bold rounded-xl border text-center transition-all cursor-pointer ${
                        calcEqZone === z.id
                          ? 'bg-[#0F5132] border-[#0F5132] text-white shadow-xs'
                          : 'bg-[#FBF9F5] border-[#121316]/10 text-[#4B5563] hover:text-[#121316]'
                      }`}
                    >
                      {z.label.split(' ')[1]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Calculation Output Card */}
            <div className="bg-[#FBF9F5] rounded-2xl p-6 border border-[#121316]/10 flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-mono text-[#0F5132] font-bold uppercase tracking-wider mb-1">
                  CALCULATED STATUTORY TARIFF
                </div>
                <div className="text-xl font-bold text-[#121316] mb-4">
                  Deterministic Underwriting Breakdown
                </div>

                <div className="space-y-2 text-xs font-mono text-[#4B5563] mb-6">
                  <div className="flex justify-between">
                    <span>Base Burning Rate:</span>
                    <span className="font-bold text-[#121316]">{sandboxCalculations.baseRatePerMille.toFixed(3)} ‰</span>
                  </div>
                  <div className="flex justify-between">
                    <span>STFI Perils Rate:</span>
                    <span className="font-bold text-[#121316]">{sandboxCalculations.stfiRatePerMille.toFixed(3)} ‰</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Seismic Zone Rate:</span>
                    <span className="font-bold text-[#121316]">{sandboxCalculations.eqRatePerMille.toFixed(3)} ‰</span>
                  </div>
                  <div className="pt-2 border-t border-[#121316]/10 flex justify-between font-bold text-[#0F5132]">
                    <span>Composite Policy Rate:</span>
                    <span>{sandboxCalculations.compositeRatePerMille.toFixed(3)} ‰</span>
                  </div>
                  <div className="pt-2 border-t border-[#121316]/10 flex justify-between text-sm font-bold text-[#121316]">
                    <span>Net Annual Premium:</span>
                    <span>₹{formatNumberINR(sandboxCalculations.netPremium)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-[#4B5563]">
                    <span>GST (18%):</span>
                    <span>₹{formatNumberINR(sandboxCalculations.gstAmount)}</span>
                  </div>
                  <div className="pt-2 border-t-2 border-[#0F5132]/30 flex justify-between text-base font-black text-[#0F5132]">
                    <span>Total Client Payable:</span>
                    <span>₹{formatNumberINR(sandboxCalculations.totalPremium)}</span>
                  </div>
                </div>
              </div>

              <Link
                href="/quotes/new?line=fire"
                className="w-full py-3 px-4 rounded-xl bg-[#0F5132] hover:bg-[#146c43] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
              >
                <span>Launch Studio with this Calculation</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          ACT 7: STATUTORY COMPLIANCE & SOVEREIGN DATA
      ───────────────────────────────────────────────────────── */}
      <section id="compliance" className="py-20 px-6 sm:px-10 lg:px-16 bg-white border-t border-[#121316]/10">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0F5132]/10 border border-[#0F5132]/20 text-[#0F5132] text-xs font-bold tracking-wider uppercase mb-3">
              <FileCheck2 className="w-3.5 h-3.5 text-[#0F5132]" aria-hidden="true" />
              <span>STATUTORY COMPLIANCE &amp; SOVEREIGNTY</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-[-0.03em] text-[#121316] leading-tight mb-4">
              Built strictly to Indian regulations.
            </h2>
            <p className="text-sm sm:text-base text-[#4B5563] leading-relaxed">
              Software for licensed insurance intermediaries must withstand rigorous audit inspections. Qoutely incorporates statutory standards directly into every generated slip.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                code: 'IRDAI/NL/ORD/2018',
                title: 'IRDAI Broker Regs 2018',
                desc: 'Regulation 24 Schedule II Professional Indemnity floors (3× brokerage revenue or ₹50 Lakhs) and mandatory quote comparison audit logs.',
              },
              {
                code: 'GFR 2017 Rules 170/171',
                title: 'Surety Insurance Bonds',
                desc: 'Ministry of Finance mandates permitting Surety Insurance Bonds to replace Bank Guarantees in public procurement and government tenders.',
              },
              {
                code: 'Sec 64VB Insurance Act 1938',
                title: 'Advance Cash Deposit Verification',
                desc: 'Strict cash deposit balance ledger verification before assumption of marine open cargo transit risk, preventing regulatory non-compliance.',
              },
              {
                code: 'DPDP Act 2023 & CERT-In',
                title: 'Sovereign Data Residency',
                desc: 'All policyholder census records and financial schedules stored strictly within Indian sovereign data centers (Mumbai) with PostgreSQL Row-Level Security.',
              },
            ].map((reg) => (
              <div
                key={reg.title}
                className="p-6 rounded-3xl bg-[#FBF9F5] border border-[#121316]/10 shadow-xs flex flex-col justify-between"
              >
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

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          ACT 8: FREQUENTLY ASKED QUESTIONS (ACCORDION)
      ───────────────────────────────────────────────────────── */}
      <section id="faq" className="py-20 px-6 sm:px-10 lg:px-16 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0F5132]/10 border border-[#0F5132]/20 text-[#0F5132] text-xs font-bold tracking-wider uppercase mb-3">
            <HelpCircle className="w-3.5 h-3.5 text-[#0F5132]" aria-hidden="true" />
            <span>FREQUENTLY ASKED QUESTIONS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-[-0.03em] text-[#121316] leading-tight mb-3">
            Everything commercial brokers ask.
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

      {/* ─────────────────────────────────────────────────────────
          ACT 9: INSTITUTIONAL FOOTER
      ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#121316]/10 bg-[#FBF9F5] py-14 px-6 sm:px-10 lg:px-16 text-xs text-[#4B5563]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white border border-[#0F5132]/20 p-1 flex items-center justify-center">
                <img
                  src="/qoutely_logo.png"
                  alt="Qoutely"
                  width={28}
                  height={28}
                  className="w-full h-full object-contain"
                />
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
              <li><button type="button" onClick={() => setDemoModalOpen(true)} className="hover:text-[#0F5132] transition-colors text-left cursor-pointer">Request Enterprise Walkthrough</button></li>
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

      {/* Book Demo Modal */}
      <BookDemoModal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
      />
    </div>
  );
}
