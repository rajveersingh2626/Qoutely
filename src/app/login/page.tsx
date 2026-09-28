'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  CheckCircle2,
  Lock,
  Mail,
  Shield,
  KeyRound,
} from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';

export default function LoginPage() {
  const router = useRouter();
  const { switchUser } = useWorkspace();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Authentication failed');
      }
      switchUser(data.user.id);
      router.push('/app/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
      setIsLoading(false);
    }
  };

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
              Built for Indian commercial insurance brokerages. Convert complex commercial proposals, PDFs, and RFQs into tariff-compliant quote slips in seconds.
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
                <p className="text-xs text-slate-500">Sign in to access your brokerage desk</p>
              </div>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Secure Access
              </span>
            </div>

            {/* Test Account Notification Banner */}
            <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
              <KeyRound className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <div className="text-xs text-emerald-900 dark:text-emerald-200">
                <span className="font-bold">Test Account Access:</span>
                <div className="font-mono text-[11px] mt-0.5 text-emerald-800 dark:text-emerald-300">
                  Username: <strong className="underline">test</strong> | Password: <strong className="underline">test</strong>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Username or Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Enter 'test' or email"
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
                    onClick={() => alert('For testing access, please use password: test')}
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
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Enter 'test'"
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
                className="w-full mt-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-emerald shadow-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
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
            Protected by Quotely Multi-Tenant Security * IRDAI Regulatory Standard
          </div>
        </div>
      </div>
    </div>
  );
}
