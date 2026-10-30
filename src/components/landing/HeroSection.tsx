'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, Play, CheckCircle2, ShieldCheck, FileCheck } from 'lucide-react';
import { AnimatedWingedCharacter } from '@/components/animations/AnimatedWingedCharacter';
import { ShinyText } from '@/components/reactbits/ShinyText';
import { DecryptedText } from '@/components/reactbits/DecryptedText';
import { AuroraBackground } from '@/components/reactbits/AuroraBackground';
import styles from './HeroSection.module.css';

interface HeroSectionProps {
  onJoinWaitlist: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onJoinWaitlist }) => {
  return (
    <AuroraBackground className={styles.heroSection}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className={styles.heroGrid}>
          {/* Left Column: Headline, Description & CTAs */}
          <div className="text-center lg:text-left">
            {/* Top Pill Badge with Reactbits ShinyText shimmer */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-6 shadow-xs backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <ShinyText text="Statutory Underwriting Operating System" speed={3.5} />
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-slate-900 leading-[1.08] mb-6">
              Elevate Your{' '}
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 bg-clip-text text-transparent">
                Brokerage
              </span>
            </h1>

            <p className="text-base sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0 mb-6 font-normal">
              Autonomous underwriting copilot for commercial fire policies. Multimodal RFQ extraction, statutory IIB Schedule 3 matching, and 100% deterministic AIFT tariff calculations.
            </p>

            {/* Mobile Character Display (Visible on small screens only) */}
            <div className="lg:hidden flex items-center justify-center my-6">
              <div className="w-64 h-44 relative">
                <AnimatedWingedCharacter
                  priority={true}
                  glowIntensity={0.9}
                  interactiveLook={true}
                />
              </div>
            </div>

            {/* Action CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5">
              <button
                onClick={onJoinWaitlist}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Sparkles className="w-4 h-4" />
                <span>Join Priority Waitlist</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <Link
                href="/app/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 font-bold text-sm shadow-sm transition-all hover:border-slate-300"
              >
                <Play className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                <span>Launch Live OS</span>
              </Link>
            </div>

            {/* Trust Badges with Reactbits DecryptedText */}
            <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-3.5 text-xs text-slate-600 font-medium">
              <div className="flex items-center gap-2 bg-white/90 border border-slate-200/80 px-3.5 py-1.5 rounded-full shadow-2xs backdrop-blur-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span><DecryptedText text="600+ IIB Schedule 3 Codes" speed={28} /></span>
              </div>
              <div className="flex items-center gap-2 bg-white/90 border border-slate-200/80 px-3.5 py-1.5 rounded-full shadow-2xs backdrop-blur-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span><DecryptedText text="AIFT 2001 Deterministic Rules" speed={24} /></span>
              </div>
              <div className="flex items-center gap-2 bg-white/90 border border-slate-200/80 px-3.5 py-1.5 rounded-full shadow-2xs backdrop-blur-xs">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span><DecryptedText text="BLUS 15% Waiver Guardrails" speed={26} /></span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Anchor Zone (State 1: Perch) */}
          <div className="hidden lg:flex items-center justify-center">
            <div id="hero-anchor-target" className={styles.heroAnchorZone}>
              <div className={styles.heroAmbientGlow} />
            </div>
          </div>
        </div>
      </div>
    </AuroraBackground>
  );
};

export default HeroSection;
