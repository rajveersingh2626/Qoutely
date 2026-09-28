'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, UserCheck, Lock, ArrowRight, Building2, CheckCircle2 } from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';

export default function AcceptInvitationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentWorkspace, switchUser } = useWorkspace();

  const firmName = searchParams.get('firm') || currentWorkspace.name;
  const invitedRole = searchParams.get('role') || 'Underwriter';
  const invitedEmail = searchParams.get('email') || 'broker.invite@firm.com';

  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const handleAccept = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setAccepted(true);
      setTimeout(() => {
        router.push('/app/dashboard');
      }, 1500);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950">
            <ShieldCheck className="w-5 h-5 font-bold" />
          </div>
          <span className="font-bold text-lg text-white">Quotely Workspace Invite</span>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-6">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 mb-1">
            <Building2 className="w-4 h-4" />
            <span>{firmName}</span>
          </div>
          <p className="text-xs text-slate-300">
            You have been invited to join as an <strong className="text-white">{invitedRole}</strong>.
          </p>
        </div>

        {accepted ? (
          <div className="p-6 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
            <h2 className="text-base font-bold text-white mb-1">Invitation Accepted!</h2>
            <p className="text-xs text-slate-300">Setting up your underwriting desk and workspace permissions...</p>
          </div>
        ) : (
          <form onSubmit={handleAccept} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Invited Email</label>
              <input
                type="email"
                disabled
                value={invitedEmail}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-950/70 border border-slate-800 text-slate-400 cursor-not-allowed font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                required
                placeholder="Priya Sharma"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Create Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all mt-6"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Join Workspace & Launch OS</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
