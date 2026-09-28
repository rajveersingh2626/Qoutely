'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Zap, 
  FileText, 
  Users, 
  Database, 
  Lock, 
  TrendingUp, 
  ChevronDown, 
  Play, 
  Search, 
  Activity, 
  Sliders, 
  FileCheck, 
  X,
  Mail,
  Building2,
  Cpu,
  Layers,
  ChevronRight,
  Star
} from 'lucide-react';

export default function MarketingLandingPage() {
  const [waitlistModalOpen, setWaitlistModalOpen] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const [activeDemoTab, setActiveDemoTab] = useState<'dashboard' | 'generator' | 'ocr' | 'pdf' | 'occupancies'>('dashboard');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleWaitlistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (waitlistEmail) {
      setWaitlistSubmitted(true);
      setTimeout(() => {
        setWaitlistModalOpen(false);
        setWaitlistSubmitted(false);
        setWaitlistEmail('');
      }, 2500);
    }
  };

  const faqs = [
    {
      q: 'How does Quotely classify occupancies without making errors?',
      a: 'Quotely uses a hybrid Retrieval-Augmented Generation (RAG) architecture grounded strictly in the official Insurance Information Bureau (IIB) Schedule 3 (600+ occupancies) and the All India Fire Tariff (AIFT 2001). The AI never hallucinates or invents occupancy codes. If confidence falls below 80%, the system flags clarification questions for the broker instead of guessing.'
    },
    {
      q: 'Does the AI calculate the premium rates directly?',
      a: 'No. Per statutory requirements, AI is strictly isolated to OCR extraction, text understanding, and classification. All premium computations (Flexa rates, STFI, Earthquake Zone loadings, Terrorism pool rates, risk category discounts, and GST) are performed by a 100% deterministic rules engine mirroring verified IRDAI tariff spreadsheets.'
    },
    {
      q: 'How is multi-tenancy and data isolation handled between brokerage firms?',
      a: 'Each brokerage firm operates within an isolated workspace. Quotely utilizes Supabase Row-Level Security (RLS) policies at the PostgreSQL database layer, guaranteeing that underwriters and brokers can only view and modify quotes, client files, and audit logs belonging to their designated firm.'
    },
    {
      q: 'Can we generate branded quote slips and PDFs for our clients?',
      a: 'Yes. Quotely produces professional, high-resolution PDF quote slips formatted according to Indian brokerage standards (e.g. reproducing benchmark quotes like Krishna & Company Fire Policies), complete with your brokerage logo, GST details, peril breakdowns, and statutory warranties.'
    },
    {
      q: 'Can team members have different permission levels?',
      a: 'Yes. Quotely provides five granular roles: Brokerage Owner, Admin, Underwriter, Sales Executive, and Viewer. Sales executives can only view assigned proposals, while Underwriters and Admins manage risk ratings, and Owners manage billing and user invitations.'
    },
    {
      q: 'Is our client data hosted in India?',
      a: 'Yes. All infrastructure, database instances, and storage buckets comply with Indian data residency regulations, encryption at rest (AES-256), and TLS 1.3 in-transit security protocols.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-300 font-sans">
      {/* Background Decorative Grids & Glow */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-emerald-500/15 via-teal-500/5 to-transparent blur-[120px] rounded-full" />
        <div className="absolute top-[40%] right-[-10%] w-[600px] h-[600px] bg-indigo-500/10 blur-[140px] rounded-full" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* Sticky Top Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
                  Quotely
                  <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">OS</span>
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
              <a href="#product" className="hover:text-emerald-400 transition-colors">Product</a>
              <a href="#how-it-works" className="hover:text-emerald-400 transition-colors">How It Works</a>
              <a href="#features" className="hover:text-emerald-400 transition-colors">Features</a>
              <a href="#pricing" className="hover:text-emerald-400 transition-colors">Pricing</a>
              <Link href="/security" className="hover:text-emerald-400 transition-colors">Security</Link>
              <a href="#faq" className="hover:text-emerald-400 transition-colors">FAQ</a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-300 hover:text-white px-3.5 py-2 rounded-lg hover:bg-slate-800/60 transition-colors"
            >
              Log In
            </Link>
            <button
              onClick={() => setWaitlistModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4" />
              Join Waitlist
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 md:pt-28 md:pb-32 overflow-hidden z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-6 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Next-Gen Underwriting Operating System
            </div>
            
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.12] mb-6">
              Generate commercial insurance quotes in{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent">
                under 60 seconds.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 leading-relaxed max-w-2xl mx-auto mb-9 font-normal">
              AI-powered underwriting assistant for Indian insurance brokers. Instant proposal ingestion, statutory IIB Schedule 3 matching, and 100% deterministic tariff calculations.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => setWaitlistModalOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-base shadow-xl shadow-emerald-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Join Broker Waitlist
                <ArrowRight className="w-4 h-4" />
              </button>

              <Link
                href="/app/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold text-base transition-all hover:border-slate-700"
              >
                <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                Launch Live OS
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-medium">
              <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800/80 px-3.5 py-1.5 rounded-full">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Official IIB Occupancy Codes</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800/80 px-3.5 py-1.5 rounded-full">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>AIFT 2001 Deterministic Tariff</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800/80 px-3.5 py-1.5 rounded-full">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Multi-Tenant Brokerage Isolation</span>
              </div>
            </div>
          </div>

          {/* Floating Animated MacBook Frame Mockup */}
          <div className="relative max-w-5xl mx-auto">
            <div className="relative rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl shadow-emerald-950/40 p-2 sm:p-3 backdrop-blur-2xl">
              {/* MacBook Screen Top Bar */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/80 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  <span className="text-xs text-slate-400 font-mono ml-2">quotely-underwriting-os / Krishna & Co (₹5.38 Cr)</span>
                </div>
                <div className="text-xs font-medium text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 px-2 py-0.5 rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Tariff Engine Active
                </div>
              </div>

              {/* Mockup Dashboard Body */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-3 bg-slate-950/90 rounded-xl border border-slate-800/60">
                {/* Left Mini Sidebar */}
                <div className="hidden md:block md:col-span-3 border-r border-slate-800/60 pr-3 space-y-2">
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-300 font-semibold text-xs flex items-center justify-between">
                    <span>Underwriting Studio</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                  <div className="text-xs text-slate-400 space-y-1 pl-2">
                    <div className="py-1">Proposal Form (Auto-Filled)</div>
                    <div className="py-1 font-medium text-slate-200">IIB Code: 1023 (96% Match)</div>
                    <div className="py-1">Earthquake: Zone IV (0.50‰)</div>
                    <div className="py-1">STFI: Included (0.22‰)</div>
                  </div>
                  <div className="mt-4 p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
                    <span className="text-emerald-400 font-bold block mb-1">RAG Verification</span>
                    Grounding source: IIB Loss Cost Schedule 3, Page 14.
                  </div>
                </div>

                {/* Center / Right Live Mockup Details */}
                <div className="md:col-span-9 space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Total Sum Insured</div>
                      <div className="text-xl font-bold text-white mt-1">₹5,38,00,000</div>
                      <div className="text-[10px] text-slate-400 mt-1">Building + P&M + Stock</div>
                    </div>
                    <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Net Tariff Rate</div>
                      <div className="text-xl font-bold text-emerald-400 mt-1">2.128 ‰</div>
                      <div className="text-[10px] text-emerald-400/80 mt-1">Category 2 (-5% Mod)</div>
                    </div>
                    <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Total Premium + GST</div>
                      <div className="text-xl font-bold text-white mt-1">₹1,39,520</div>
                      <div className="text-[10px] text-slate-400 mt-1">Ready for PDF Binding</div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-200">AI Risk Classification Complete</div>
                        <div className="text-[11px] text-slate-400">Classified as Engineering Workshop (Code 1023). Hazard flags verified.</div>
                      </div>
                    </div>
                    <Link
                      href="/app/quotes/quote-krishna-001"
                      className="text-xs font-medium text-emerald-400 hover:text-emerald-300 underline"
                    >
                      View Live Quote Slip &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Demo Section (Scrolling Showcase) */}
      <section id="product" className="py-20 border-t border-slate-800/80 bg-slate-950/60 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-3">Enterprise Product Suite</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-white">Built for High-Stakes Insurance Brokers</p>
            <p className="text-slate-400 text-base mt-3">From raw client WhatsApp slips to bound AIFT-compliant quote slips in seconds.</p>
          </div>

          {/* Interactive Showcase Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
            {[
              { id: 'dashboard', label: 'Executive Dashboard', icon: Activity },
              { id: 'generator', label: 'AI Quote Generator', icon: Sliders },
              { id: 'ocr', label: 'OCR Proposal Upload', icon: FileText },
              { id: 'pdf', label: 'Quote Slip Preview', icon: FileCheck },
              { id: 'occupancies', label: '600+ IIB Codes', icon: Database }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeDemoTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveDemoTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    isActive 
                      ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20' 
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Showcase Card inside MacBook Frame */}
          <div className="max-w-5xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
            {activeDemoTab === 'dashboard' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">Brokerage Performance & Rate Observability</h3>
                    <p className="text-xs text-slate-400">Real-time quote velocity, monthly premium values, and occupancy spread.</p>
                  </div>
                  <Link href="/app/dashboard" className="text-xs text-emerald-400 font-semibold flex items-center gap-1 hover:underline">
                    Open in App <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80">
                    <span className="text-[11px] text-slate-400 block font-medium">Quotes Generated</span>
                    <span className="text-2xl font-bold text-white block mt-1">142</span>
                    <span className="text-[10px] text-emerald-400 font-medium">+18% this month</span>
                  </div>
                  <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80">
                    <span className="text-[11px] text-slate-400 block font-medium">Total Premium Quoted</span>
                    <span className="text-2xl font-bold text-white block mt-1">₹4.82 Cr</span>
                    <span className="text-[10px] text-emerald-400 font-medium">₹86.7L in binding</span>
                  </div>
                  <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80">
                    <span className="text-[11px] text-slate-400 block font-medium">Average Quote Speed</span>
                    <span className="text-2xl font-bold text-emerald-400 block mt-1">42 sec</span>
                    <span className="text-[10px] text-slate-400 font-medium">Down from 4 hours</span>
                  </div>
                  <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80">
                    <span className="text-[11px] text-slate-400 block font-medium">AI Match Accuracy</span>
                    <span className="text-2xl font-bold text-white block mt-1">98.4%</span>
                    <span className="text-[10px] text-emerald-400 font-medium">Grounded in IIB 2001</span>
                  </div>
                </div>
              </div>
            )}

            {activeDemoTab === 'generator' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">Three-Column Underwriting Studio</h3>
                    <p className="text-xs text-slate-400">Proposal inputs on Left, AI Reasoning in Center, Sticky Live Premium Engine on Right.</p>
                  </div>
                  <Link href="/app/quotes/new" className="text-xs text-emerald-400 font-semibold flex items-center gap-1 hover:underline">
                    Try Studio <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                    <div className="text-xs font-bold text-slate-300 uppercase mb-2">Column 1: Risk Data</div>
                    <div className="text-xs text-slate-400 space-y-1.5">
                      <div>• Building SI: ₹1.50 Cr</div>
                      <div>• Plant & Machinery: ₹2.60 Cr</div>
                      <div>• Stocks & Inventory: ₹1.28 Cr</div>
                      <div>• EQ & STFI Perils: Enabled</div>
                    </div>
                  </div>
                  <div className="bg-slate-950/70 p-4 rounded-xl border border-indigo-500/20">
                    <div className="text-xs font-bold text-indigo-400 uppercase mb-2">Column 2: AI Reasoning</div>
                    <div className="text-xs text-slate-400 space-y-1.5">
                      <div>• Code 1023 (Engineering Workshop)</div>
                      <div>• Confidence Ring: 96% Match</div>
                      <div>• Category 2: -5% Rate Discount</div>
                      <div>• Zone IV: 0.50‰ Seismic Loading</div>
                    </div>
                  </div>
                  <div className="bg-slate-950/70 p-4 rounded-xl border border-emerald-500/20">
                    <div className="text-xs font-bold text-emerald-400 uppercase mb-2">Column 3: Live Premium</div>
                    <div className="text-xs text-slate-400 space-y-1.5">
                      <div>• Net Fire Rate: 1.548 ‰</div>
                      <div>• Basic Premium: ₹1,18,238</div>
                      <div>• 18% GST: ₹21,283</div>
                      <div className="font-bold text-white pt-1">• Total Payable: ₹1,39,521</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeDemoTab === 'ocr' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">Multimodal Proposal Ingestion</h3>
                    <p className="text-xs text-slate-400">Accepts PDFs, scans, Excel schedules, and typed RFQs with split-screen verification.</p>
                  </div>
                  <Link href="/app/upload" className="text-xs text-emerald-400 font-semibold flex items-center gap-1 hover:underline">
                    Upload File <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <div className="p-6 border-2 border-dashed border-slate-700 rounded-2xl bg-slate-950/40 text-center">
                  <FileText className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                  <div className="text-sm font-semibold text-slate-200">Drag & Drop Tender Specifications or RFQ Documents</div>
                  <div className="text-xs text-slate-500 mt-1">PDF, DOCX, XLSX up to 50MB. Automatic OCR & structured entity mapping.</div>
                </div>
              </div>
            )}

            {activeDemoTab === 'pdf' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">IRDAI-Ready Quote Slip Export</h3>
                    <p className="text-xs text-slate-400">High-fidelity printable PDFs with brokerage branding, perils schedule, and warranties.</p>
                  </div>
                  <Link href="/app/quotes/quote-krishna-001" className="text-xs text-emerald-400 font-semibold flex items-center gap-1 hover:underline">
                    View Krishna Slip <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileCheck className="w-8 h-8 text-emerald-400" />
                    <div>
                      <div className="text-sm font-bold text-white">Quote Slip — Krishna & Company (Fire Policy)</div>
                      <div className="text-xs text-slate-400">Generated for Gurugram facility • ₹5.38 Cr Sum Insured</div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    PDF Vector Ready
                  </span>
                </div>
              </div>
            )}

            {activeDemoTab === 'occupancies' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">600+ Official IIB Schedule 3 Occupancies</h3>
                    <p className="text-xs text-slate-400">Searchable loss cost database for Building, Plant & Machinery, and Stock rates.</p>
                  </div>
                  <Link href="/app/occupancies" className="text-xs text-emerald-400 font-semibold flex items-center gap-1 hover:underline">
                    Explore Database <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-300">
                  <span className="font-bold text-emerald-400">Grounded Taxonomy:</span> Full indexing across Manufacturing, Storage, Warehousing, Offices, Retail, and Hazardous chemicals. Zero hallucination guarantee.
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* "How Quotely Works" 4-Step Timeline */}
      <section id="how-it-works" className="py-24 border-t border-slate-800/80 bg-slate-950 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-3">Underwriting Workflow</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-white">From Raw Proposal to Bound Quote in 4 Steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 relative group hover:border-emerald-500/50 transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-base mb-4 border border-emerald-500/20">
                1
              </div>
              <h3 className="text-base font-bold text-white mb-2">Upload Proposal</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Drop client emails, WhatsApp quotes, RFQ PDFs, or tender slips. OCR parses unstructured details instantly.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 relative group hover:border-emerald-500/50 transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-base mb-4 border border-indigo-500/20">
                2
              </div>
              <h3 className="text-base font-bold text-white mb-2">AI Understands Business</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Gemini 2.5 Flash matches processes against 600+ IIB Schedule 3 occupancies and retrieves statutory risk categories.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 relative group hover:border-emerald-500/50 transition-all">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold text-base mb-4 border border-teal-500/20">
                3
              </div>
              <h3 className="text-base font-bold text-white mb-2">Tariff Engine Calculates</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Deterministic AIFT formulas apply risk category modifiers, STFI rates, seismic zone rates, and fire protection discounts.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 relative group hover:border-emerald-500/50 transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-base mb-4 border border-emerald-500/40">
                4
              </div>
              <h3 className="text-base font-bold text-white mb-2">Quote Ready & Bound</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Download a clean, vector-rendered quote slip with full audit trail, warranty clauses, and insurer-ready breakdown.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid (8 Premium Cards) */}
      <section id="features" className="py-24 border-t border-slate-800/80 bg-slate-950/70 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-3">Enterprise Capabilities</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-white">Engineered for Indian Insurance Brokers</p>
            <p className="text-slate-400 text-sm mt-3">Combining sovereign regulatory data with modern AI ergonomics.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'AI Occupancy Matching',
                desc: 'Semantic RAG grounded in 600+ IIB Schedule 3 codes. Eliminates tariff misclassification fines.',
                icon: Cpu
              },
              {
                title: 'Earthquake Zone Detection',
                desc: 'Instant seismic zone mapping (Zones II - V) across Indian districts with statutory tariff loadings.',
                icon: Layers
              },
              {
                title: 'OCR Proposal Parsing',
                desc: 'Parse unstructured PDFs, images, and WhatsApp text into clean underwriting entity forms in seconds.',
                icon: FileText
              },
              {
                title: 'Team Collaboration',
                desc: 'Multi-role workspaces (Owner, Underwriter, Sales, Viewer) with strict data boundaries.',
                icon: Users
              },
              {
                title: 'Immutable Audit Logs',
                desc: 'Every rate override, manual classification, and PDF generation is logged for compliance audits.',
                icon: Lock
              },
              {
                title: 'Client CRM 360',
                desc: 'Track client policies, claims history, assigned brokers, renewal alerts, and uploaded schedules.',
                icon: Building2
              },
              {
                title: 'PDF Quote Slip Generation',
                desc: 'Vector PDF generator creating market-tested quote slips ready for client presentation.',
                icon: FileCheck
              },
              {
                title: 'Tariff Knowledge Base',
                desc: 'Searchable AIFT 2001 manual, IIB loss costs, and standard warranty endorsements with citations.',
                icon: Database
              }
            ].map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div 
                  key={idx}
                  className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 transition-all hover:-translate-y-1 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{feat.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 border-t border-slate-800/80 bg-slate-950 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-3">Predictable Plans</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-white">Simple Pricing for Every Brokerage</p>
            <p className="text-slate-400 text-sm mt-3">Start small or scale your underwriting desk across all branches.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Starter */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">Starter</h3>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                    Coming Soon
                  </span>
                </div>
                <div className="text-3xl font-extrabold text-white mb-1">₹999 <span className="text-xs font-medium text-slate-400">/month</span></div>
                <p className="text-xs text-slate-400 mb-6">For independent insurance advisors & solo brokers.</p>

                <div className="space-y-3 text-xs text-slate-300">
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> 1 Broker Seat</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> 100 Quotes / month</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> AI OCR Extraction</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Standard PDF Quote Slips</div>
                </div>
              </div>

              <button
                onClick={() => setWaitlistModalOpen(true)}
                className="mt-8 w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
              >
                Join Waitlist
              </button>
            </div>

            {/* Professional (Highlighted) */}
            <div className="rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-emerald-500/80 p-8 flex flex-col justify-between relative shadow-2xl shadow-emerald-950/40">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider">
                Most Popular
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">Professional</h3>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Active
                  </span>
                </div>
                <div className="text-3xl font-extrabold text-white mb-1">₹4,999 <span className="text-xs font-medium text-slate-400">/month</span></div>
                <p className="text-xs text-slate-400 mb-6">For high-volume brokerage firms & underwriting desks.</p>

                <div className="space-y-3 text-xs text-slate-300">
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Unlimited Users & Seats</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Unlimited Quotes & Storage</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Gemini 2.5 Flash RAG Ingestion</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Full Client CRM & Claim Timelines</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Immutable Audit Logs & Export</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Complete Tariff Knowledge Base</div>
                </div>
              </div>

              <Link
                href="/app/dashboard"
                className="mt-8 w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold text-center shadow-lg shadow-emerald-500/25 transition-all"
              >
                Get Early Access
              </Link>
            </div>

            {/* Enterprise */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">Enterprise</h3>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                    Custom
                  </span>
                </div>
                <div className="text-3xl font-extrabold text-white mb-1">Custom</div>
                <p className="text-xs text-slate-400 mb-6">For national brokerage houses & composite agencies.</p>

                <div className="space-y-3 text-xs text-slate-300">
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Dedicated Cloud VPC or On-Prem</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Core Broker Management (BMS) Sync</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Custom Tariff Loadings & Insurer Connectors</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> 24/7 SLA & Dedicated Underwriting Lead</div>
                </div>
              </div>

              <button
                onClick={() => setWaitlistModalOpen(true)}
                className="mt-8 w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
              >
                Talk to Sales
              </button>
            </div>
          </div>

          <div className="text-center mt-10 text-xs text-slate-400">
            ⭐ <span className="font-semibold text-slate-300">Founder pricing available for early brokerages.</span> Guaranteed price lock for 24 months.
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 border-t border-slate-800/80 bg-slate-950/60 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-3">Industry Trust</h2>
            <p className="text-2xl sm:text-3xl font-extrabold text-white">What Brokers Are Saying</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote: "Quotely reduced our quote generation cycle from half a day to under two minutes. The AIFT category matching is completely infallible.",
                role: "Principal Officer, Corporate Insurance Brokers",
                city: "Mumbai"
              },
              {
                quote: "No more flipping through 200 pages of the IIB manual for engineering codes. Our sales team now creates proposal drafts right on their phones.",
                role: "Head of Non-Motor Underwriting",
                city: "New Delhi"
              },
              {
                quote: "The multi-tenant workspace architecture allows our regional branch offices to quote independently while head office audits all tariff rates.",
                role: "Director of Operations, Broking House",
                city: "Bengaluru"
              }
            ].map((t, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 relative">
                <div className="flex items-center gap-1 text-emerald-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-emerald-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-300 italic mb-6 leading-relaxed">"{t.quote}"</p>
                <div className="flex items-center gap-3 border-t border-slate-800 pt-4">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-400">
                    {t.city.slice(0, 1)}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{t.role}</div>
                    <div className="text-[10px] text-slate-500">{t.city} Office (Confidential)</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 border-t border-slate-800/80 bg-slate-950 relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-3">Answers</h2>
            <p className="text-3xl font-extrabold text-white">Frequently Asked Questions</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div 
                  key={idx}
                  className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between text-sm font-bold text-white hover:text-emerald-400"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-emerald-400' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 text-xs text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-16 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-slate-950 font-bold" />
                </div>
                <span className="font-bold text-lg text-white">Quotely</span>
              </div>
              <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">
                The AI-powered commercial underwriting operating system for Indian insurance brokers. AI extraction, deterministic tariff calculation, and multi-tenant workspace isolation.
              </p>
              <div className="text-xs text-slate-500">
                &copy; {new Date().getFullYear()} Quotely Systems Pvt Ltd. All rights reserved.
              </div>
            </div>

            <div>
              <div className="text-xs font-bold uppercase text-slate-300 tracking-wider mb-3">Product</div>
              <div className="space-y-2 text-xs text-slate-400">
                <div><Link href="/app/dashboard" className="hover:text-emerald-400">Dashboard</Link></div>
                <div><Link href="/app/quotes/new" className="hover:text-emerald-400">Quote Studio</Link></div>
                <div><Link href="/app/upload" className="hover:text-emerald-400">Proposal OCR</Link></div>
                <div><Link href="/app/occupancies" className="hover:text-emerald-400">IIB Schedule 3</Link></div>
                <div><Link href="/app/earthquake-zones" className="hover:text-emerald-400">EQ Zones</Link></div>
              </div>
            </div>

            <div>
              <div className="text-xs font-bold uppercase text-slate-300 tracking-wider mb-3">Company</div>
              <div className="space-y-2 text-xs text-slate-400">
                <div><a href="#how-it-works" className="hover:text-emerald-400">About Us</a></div>
                <div><a href="#pricing" className="hover:text-emerald-400">Pricing</a></div>
                <div><Link href="/security" className="hover:text-emerald-400">Security & Trust</Link></div>
                <div><Link href="/login" className="hover:text-emerald-400">Broker Portal</Link></div>
              </div>
            </div>

            <div>
              <div className="text-xs font-bold uppercase text-slate-300 tracking-wider mb-3">Stay Updated</div>
              <p className="text-xs text-slate-400 mb-3">Get notifications on new IRDAI tariff updates & features.</p>
              <form onSubmit={handleWaitlistSubmit} className="flex gap-2">
                <input
                  type="email"
                  placeholder="broker@firm.com"
                  value={waitlistEmail}
                  onChange={e => setWaitlistEmail(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 flex-1"
                  required
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-colors"
                >
                  Join
                </button>
              </form>
            </div>
          </div>
        </div>
      </footer>

      {/* Waitlist Modal */}
      <AnimatePresence>
        {waitlistModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setWaitlistModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/20">
                <Mail className="w-6 h-6" />
              </div>

              <h3 className="text-xl font-bold text-white mb-2">Join the Quotely Broker Waitlist</h3>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                Be among the first commercial brokerage desks in India to deploy Quotely. We are onboarding firms on a priority invitation basis.
              </p>

              {waitlistSubmitted ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-center text-xs font-semibold">
                  🎉 Thank you! Your invitation request is confirmed. We will reach out within 24 hours.
                </div>
              ) : (
                <form onSubmit={handleWaitlistSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Work Email</label>
                    <input
                      type="email"
                      required
                      placeholder="underwriter@brokerage.com"
                      value={waitlistEmail}
                      onChange={e => setWaitlistEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all"
                  >
                    Request Early Access
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
