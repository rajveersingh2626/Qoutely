'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface NavbarProps {
  onBookDemo: () => void;
  onNavigate?: (sectionIndex: number) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onBookDemo, onNavigate }) => {
  const handleNavClick = (sectionIndex: number) => {
    if (onNavigate) {
      onNavigate(sectionIndex);
    } else {
      const targetPercent = [0, 0.33333, 0.66666, 1.0][sectionIndex] ?? 0;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo({
        top: maxScroll * targetPercent,
        behavior: 'smooth',
      });
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-[80] pointer-events-auto bg-[#FBF9F5]/80 backdrop-blur-xl border-b border-[#121316]/8 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] py-3.5 transition-all">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 flex items-center justify-between">
        {/* Left: Authentic Brand Mark + Qoutely Wordmark with Emerald Status Dot */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-white/90 border border-[#0F5132]/20 p-1 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <img src="/qoutely_logo.png" alt="Qoutely" className="w-full h-full object-contain" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-[#121316]">
            Qoutely
          </span>
          <span className="inline-block w-2 h-2 rounded-full bg-[#00C853] shadow-[0_0_8px_rgba(0,200,83,0.5)]" />
        </Link>

        {/* Center: Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          <button
            onClick={() => handleNavClick(0)}
            className="text-sm font-semibold text-[#5A6065] hover:text-[#121316] transition-colors cursor-pointer"
          >
            Platform
          </button>
          <button
            onClick={() => handleNavClick(1)}
            className="text-sm font-semibold text-[#5A6065] hover:text-[#121316] transition-colors cursor-pointer"
          >
            Workflows
          </button>
          <button
            onClick={() => handleNavClick(2)}
            className="text-sm font-semibold text-[#5A6065] hover:text-[#121316] transition-colors cursor-pointer"
          >
            Carrier Appetite
          </button>
          <button
            onClick={() => handleNavClick(3)}
            className="text-sm font-semibold text-[#5A6065] hover:text-[#121316] transition-colors cursor-pointer"
          >
            Pricing
          </button>
          <Link
            href="/login"
            className="text-sm font-semibold text-[#5A6065] hover:text-[#121316] transition-colors"
          >
            Sign In
          </Link>
        </nav>

        {/* Right: Premium Dark Green Pill CTA */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBookDemo}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0F5132] hover:bg-[#146c43] active:scale-[0.98] text-white text-sm font-semibold tracking-tight shadow-[0_4px_16px_rgba(15,81,50,0.2)] hover:shadow-[0_6px_20px_rgba(0,200,83,0.3)] transition-all duration-200 cursor-pointer"
          >
            <span>Book Demo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
