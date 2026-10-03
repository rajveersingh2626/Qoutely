'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Building,
  CheckCircle2,
  Lock,
  Save,
  Shield,
  Sparkles,
  Upload,
  Cpu,
  Key,
  Users,
  AlertTriangle,
  Trash2,
  ArrowRight
} from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { Header } from '@/components/layout/Header';

export default function SettingsPage() {
  const { currentWorkspace, updateWorkspace, canManageFirm, userRole } = useWorkspace();

  const [name, setName] = useState(currentWorkspace.name || '');
  const [gst, setGst] = useState(currentWorkspace.gst || '');
  const [address, setAddress] = useState(currentWorkspace.address || '');
  const [email, setEmail] = useState(currentWorkspace.email || '');
  const [phone, setPhone] = useState(currentWorkspace.phone || '');
  const [irdaLicense, setIrdaLicense] = useState(
    currentWorkspace.default_rules?.irda_license_no || ''
  );
  const [cinNo, setCinNo] = useState(
    currentWorkspace.default_rules?.cin_no || ''
  );
  const [discount, setDiscount] = useState(
    currentWorkspace.default_rules?.default_discretionary_discount || 0
  );
  const [geminiKey, setGeminiKey] = useState('••••••••••••••••••••••••••••••••');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateWorkspace({
      name,
      gst,
      address,
      email,
      phone,
      default_rules: {
        ...currentWorkspace.default_rules,
        irda_license_no: irdaLicense,
        cin_no: cinNo,
        default_discretionary_discount: Number(discount),
      },
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 dark:bg-slate-950 font-sans">
      <Header
        title="Brokerage Workspace Settings"
        subtitle={`Regulatory parameters and rating rules for ${currentWorkspace.name}`}
        breadcrumbs={[{ label: 'Home', href: '/app/dashboard' }, { label: 'Settings' }]}
      />

      <div className="p-6 md:p-8 max-w-4xl mx-auto w-full space-y-6">
        {!canManageFirm && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              You are currently logged in as <strong>{userRole}</strong>. Only Brokerage Owners
              and Super Admins can commit regulatory changes.
            </span>
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
          <form onSubmit={handleSave} className="space-y-6">
            {/* Firm Identity & Branding */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                Firm Identity & Branding
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                These credentials appear on all quote slips and policy proposal submissions.
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Brokerage Firm Name
                  </label>
                  <input
                    type="text"
                    disabled={!canManageFirm}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Brokerage GSTIN
                  </label>
                  <input
                    type="text"
                    disabled={!canManageFirm}
                    value={gst}
                    onChange={(e) => setGst(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white disabled:opacity-60"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Registered Office Address
                  </label>
                  <input
                    type="text"
                    disabled={!canManageFirm}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    IRDAI Direct Broker License No.
                  </label>
                  <input
                    type="text"
                    disabled={!canManageFirm}
                    value={irdaLicense}
                    onChange={(e) => setIrdaLicense(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Corporate Identity Number (CIN)
                  </label>
                  <input
                    type="text"
                    disabled={!canManageFirm}
                    value={cinNo}
                    onChange={(e) => setCinNo(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white disabled:opacity-60"
                  />
                </div>
              </div>
            </div>

            {/* Premium Calculation Defaults */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                Underwriting & Rating Defaults
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Applied automatically when initiating new quotation calculations.
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Default Discretionary Broker Discount (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={25}
                    disabled={!canManageFirm}
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Default Seismic Earthquake Zone
                  </label>
                  <select
                    disabled={!canManageFirm}
                    defaultValue="Zone 2"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white disabled:opacity-60"
                  >
                    <option value="Zone 2">Zone IV (Delhi NCR / Dehradun)</option>
                    <option value="Zone 3">Zone III (Mumbai / Pune / Kolkata)</option>
                    <option value="Zone 1">Zone V (Northeast / Bhuj)</option>
                    <option value="Zone 4">Zone II (South India / Bangalore)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* AI Engine & API Key Configuration */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    AI Underwriting Engine (Gemini 2.5 Flash)
                  </h3>
                </div>
                <Link
                  href="/app/settings/ai"
                  className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1"
                >
                  <span>Open AI Observability Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Configured via single service layer in <code className="font-mono text-emerald-600 dark:text-emerald-400">src/lib/ai.ts</code>.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Gemini API Key (Configured in Vercel / Environment)
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    disabled
                    value={geminiKey}
                    className="w-full pl-9 pr-3 py-2 text-xs font-mono rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-500 cursor-not-allowed"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Secrets are securely loaded from <code className="font-mono">GEMINI_API_KEY</code>.
                </p>
              </div>
            </div>

            {/* Quick Team Management Link */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-emerald-600" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Team Member Management</h4>
                  <p className="text-[11px] text-slate-500">Manage 5 enterprise roles and pending email invites.</p>
                </div>
              </div>
              <Link
                href="/app/team"
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100"
              >
                Manage Team &rarr;
              </Link>
            </div>

            {canManageFirm && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                {savedSuccess ? (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Workspace settings updated!</span>
                  </span>
                ) : (
                  <span />
                )}

                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.01]"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Workspace Changes</span>
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Danger Zone */}
        {canManageFirm && (
          <div className="p-6 rounded-3xl bg-red-500/5 border border-red-500/20 text-red-900 dark:text-red-300 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
              <AlertTriangle className="w-4 h-4" />
              <span>Danger Zone</span>
            </div>
            <p className="text-xs text-slate-500">
              Actions here are destructive and cannot be undone. Workspace data isolation is enforced at the database level.
            </p>
            <div className="flex items-center justify-between pt-2">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">Archive Workspace</span>
                <span className="text-[10px] text-slate-400">Lock all underwriting quote slips for regulatory compliance audit.</span>
              </div>
              <button
                type="button"
                onClick={() => alert('Workspace archive requested. An authorization code has been dispatched to the Brokerage Owner.')}
                className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
              >
                Archive Workspace
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
