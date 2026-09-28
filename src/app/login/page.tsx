'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  Lock,
  Mail,
  Shield,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { SEED_PROFILES } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const { switchUser } = useWorkspace();

  const [email, setEmail] = useState('arjun.k@capitalinsurance.co.in');
  const [password, setPassword] = useState('••••••••••••');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState('user-004'); // Arjun Kapoor (Underwriter)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      switchUser(selectedPersona);
      router.push('/dashboard');
    }, 400);
  };

  const handleSelectPersona = (profileId: string) => {
    setSelectedPersona(profileId);
    const p = SEED_PROFILES.find((x) => x.id === profileId);
    if (p) {
      setEmail(p.email);
      switchUser(p.id);
    }
  };

  const personas = [
    {
      id: 'user-002',
      name: 'Rajesh Singhania',
      role: 'Brokerage Owner',
      email: 'owner@capitalinsurance.co.in',
      badge: 'Full Admin',
    },
    {
      id: 'user-004',
      name: 'Arjun Kapoor',
      role: 'Underwriter',
      email: 'arjun.k@capitalinsurance.co.in',
      badge: 'Quotes & Analysis',
    },
    {
      id: 'user-005',
      name: 'Sneha Verma',
      role: 'Sales Executive',
      email: 'sneha.v@capitalinsurance.co.in',
      badge: 'Proposals Only',
    },
    {
      id: 'user-006',
      name: 'Rohan Gupta',
      role: 'Auditor / Viewer',
      email: 'rohan.auditor@capitalinsurance.co.in',
      badge: 'Read-only',
    },
  ];

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-4xl grid md:grid-cols-2 rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        {/* Left Side: Brand & Value Proposition */}
        <div className="p-8 md:p-12 bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-950 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                <svg
                  className="w-6 h-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <circle cx="12" cy="11" r="3.2" />
                  <path d="m14.5 13.5 2 2" />
                </svg>
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight">Quotely</span>
                <p className="text-[11px] text-emerald-400 font-medium">Enterprise Underwriting OS</p>
              </div>
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
              AI Underwriting.
              <br />
              <span className="text-emerald-400">Human Confidence.</span>
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              Built for Indian insurance brokerages. Convert complex commercial proposals, PDFs, and RFQs into tariff-compliant quote slips in seconds.
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-2.5 text-xs text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Multi-tenant workspace isolation with strict RLS</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Deterministic AIFT 2001 & IIB Schedule 3 calculation engine</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>289 scheduled occupancy codes & earthquake zoning</span>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 text-[11px] text-slate-400">
            Protected by Supabase Row-Level Security * IRDAI Regulatory Standard
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="p-8 md:p-12 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Broker Login</h3>
                <p className="text-xs text-slate-500">Access your brokerage workspace</p>
              </div>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Invite-Only
              </span>
            </div>

            {/* Quick Demo Persona Switcher */}
            <div className="mb-5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Quick Demo Login (Select Role)
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {personas.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPersona(p.id)}
                    className={`p-2 rounded-xl text-left border transition-all ${
                      selectedPersona === p.id
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-2xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold truncate">{p.name}</span>
                      <span className="text-[9px] font-medium text-emerald-600 dark:text-emerald-400">
                        {p.badge}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 truncate block">{p.role}</span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="name@brokerage.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => alert('In production, password reset instructions are emailed to verified broker addresses.')}
                    className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-400">Remember Me</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-emerald shadow-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In to Underwriting Desk</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-6 text-center text-xs text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-4">
            Need access for your firm?{' '}
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold cursor-pointer">
              Contact your Brokerage Administrator
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
