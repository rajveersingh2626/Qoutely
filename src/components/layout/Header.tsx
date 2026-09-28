'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  Check,
  ChevronRight,
  FilePlus,
  HelpCircle,
  Search,
  Sparkles,
  Upload,
} from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, breadcrumbs }) => {
  const {
    currentUser,
    currentWorkspace,
    setIsCommandPaletteOpen,
    setIsAiDrawerOpen,
    canGenerateQuotes,
  } = useWorkspace();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const notifications = [
    {
      id: '1',
      title: 'Quote Slip Generated',
      desc: 'Acme Industries Ltd (₹5.38 Cr) approved with Category 2 discount.',
      time: '10m ago',
      unread: true,
    },
    {
      id: '2',
      title: 'Tariff Rate Update',
      desc: 'IIB Schedule 3 loss costs synchronized for Zone IV districts.',
      time: '1h ago',
      unread: false,
    },
    {
      id: '3',
      title: 'New Member Joined',
      desc: 'Arjun Kapoor joined as Underwriter.',
      time: '2d ago',
      unread: false,
    },
  ];

  return (
    <header className="h-16 px-6 border-b border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md flex items-center justify-between sticky top-0 z-10 transition-colors">
      {/* Left: Greeting / Breadcrumbs */}
      <div className="flex items-center gap-3">
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            {breadcrumbs.map((b, i) => (
              <React.Fragment key={i}>
                {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                {b.href ? (
                  <Link
                    href={b.href}
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors"
                  >
                    {b.label}
                  </Link>
                ) : (
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {b.label}
                  </span>
                )}
              </React.Fragment>
            ))}
          </nav>
        ) : (
          <div>
            <h1 className="text-sm font-bold text-slate-900 dark:text-white">
              {title || `Welcome, ${currentUser.name.split(' ')[0]}`}
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {subtitle || `${currentWorkspace.name} * Commercial Underwriting Desk`}
            </p>
          </div>
        )}
      </div>

      {/* Right: Actions, Search, Notifications */}
      <div className="flex items-center gap-2.5">
        {/* Command Search Bar Trigger */}
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-500 dark:text-slate-400 text-xs font-medium border border-transparent hover:border-slate-300 dark:hover:border-slate-600 transition-all"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Search occupancies, quotes, clients...</span>
          <kbd className="text-[10px] font-mono bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded shadow-2xs">
            ⌘K
          </kbd>
        </button>

        {/* AI Assistant Button */}
        <button
          onClick={() => setIsAiDrawerOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 text-xs font-medium transition-all shadow-2xs"
          title="Open AI Underwriting Copilot"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span className="hidden sm:inline">AI Copilot</span>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 relative transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-3 z-30 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Notifications
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold cursor-pointer">
                  Mark all read
                </span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-700/60 mt-1 max-h-64 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className="py-2.5 px-1 hover:bg-slate-50 dark:hover:bg-slate-700/40 rounded-lg">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {n.title}
                      </p>
                      <span className="text-[10px] text-slate-400">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {n.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick New Quote Action */}
        {canGenerateQuotes && (
          <Link
            href="/quotes/new"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-emerald shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <FilePlus className="w-3.5 h-3.5" />
            <span>New Quote</span>
          </Link>
        )}
      </div>
    </header>
  );
};
