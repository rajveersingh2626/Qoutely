import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
          Error 404 • Tariff Reference Not Found
        </span>

        <h1 className="text-2xl font-bold text-white mt-3 mb-2">Page Does Not Exist</h1>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          The underwriting page, quote slip identifier, or regulatory resource you requested could not be located in this brokerage workspace.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link
            href="/app/dashboard"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Underwriting Dashboard</span>
          </Link>

          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Public Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
