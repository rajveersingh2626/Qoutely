'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Shield,
  Clock,
  RefreshCw,
  Server,
  Lock,
  ArrowRight,
  Sparkles,
  Database,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export default function MaintenancePage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [bypassInput, setBypassInput] = useState('');
  const [showBypassModal, setShowBypassModal] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      window.location.reload();
    }, 700);
  };

  const handleBypassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (bypassInput.trim()) {
      // Set bypass cookie and reload
      document.cookie = `maintenance_bypass=${encodeURIComponent(bypassInput.trim())}; path=/; max-age=86400; SameSite=Strict`;
      window.location.href = '/dashboard';
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#070b13] text-zinc-100 flex flex-col justify-between relative overflow-hidden select-none font-sans">
      {/* Background ambient glowing orbs */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-emerald-500/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Background grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />

      {/* Top Header Strip */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-black tracking-wider text-white">QOUTELY</span>
            <span className="block text-[10px] tracking-widest text-emerald-400 font-mono uppercase">
              Underwriting OS
            </span>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span>Scheduled Systems Upgrade</span>
        </div>
      </header>

      {/* Main Hero Card */}
      <main className="relative z-10 max-w-2xl mx-auto px-6 py-8 text-center my-auto w-full">
        <div className="glass-surface-high-contrast rounded-3xl p-8 sm:p-12 border border-white/10 shadow-2xl backdrop-blur-2xl relative overflow-hidden">
          {/* Top accent badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold mb-6">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Infrastructure Hardening &amp; Compliance Upgrade</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight mb-4">
            We are temporarily offline for maintenance
          </h1>

          <p className="text-sm text-zinc-300 sm:text-base leading-relaxed mb-8 max-w-lg mx-auto">
            Qoutely is currently undergoing scheduled platform upgrades and IRDAI tariff compliance synchronization.
            All client quotes, brokerage accounts, and audit records remain securely encrypted.
          </p>

          {/* System Status Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-left mb-8">
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5">
              <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium mb-1">
                <Server className="w-3.5 h-3.5 text-amber-400" />
                <span>Underwriting Engine</span>
              </div>
              <p className="text-xs font-bold text-amber-400">Offline (Upgrading)</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5">
              <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium mb-1">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tariff Schedule 3</span>
              </div>
              <p className="text-xs font-bold text-emerald-400">Syncing Loss Costs</p>
            </div>

            <div className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-white/[0.03] border border-white/5">
              <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium mb-1">
                <Lock className="w-3.5 h-3.5 text-teal-400" />
                <span>Quote Vault</span>
              </div>
              <p className="text-xs font-bold text-teal-400">AES-256 Protected</p>
            </div>
          </div>

          {/* Call to Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs tracking-wide shadow-lg shadow-emerald-900/30 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Checking System Status...' : 'Check If Back Online'}</span>
            </button>

            <button
              onClick={() => setShowBypassModal(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-zinc-400" />
              <span>Admin Access</span>
            </button>
          </div>

          {/* Admin Bypass Modal Drawer */}
          {showBypassModal && (
            <div className="mt-6 pt-6 border-t border-white/10 text-left">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                Administrator Bypass Key
              </h3>
              <form onSubmit={handleBypassSubmit} className="flex gap-2">
                <input
                  type="password"
                  placeholder="Enter bypass key..."
                  value={bypassInput}
                  onChange={(e) => setBypassInput(e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900/90 border border-white/15 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all"
                >
                  Enter
                </button>
                <button
                  type="button"
                  onClick={() => setShowBypassModal(false)}
                  className="px-3 py-2 rounded-xl bg-slate-800 text-zinc-400 hover:text-white text-xs transition-all"
                >
                  Cancel
                </button>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Footer Strip */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
        <div>
          <span>&copy; {new Date().getFullYear()} Capital Brokers Pvt Ltd • All rights reserved.</span>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="mailto:support@capitalbrokers.in"
            className="hover:text-emerald-400 transition-colors"
          >
            Emergency Underwriting Support
          </a>
          <span>•</span>
          <span className="font-mono text-zinc-600 text-[11px]">System Status: MAINT-503</span>
        </div>
      </footer>
    </div>
  );
}
