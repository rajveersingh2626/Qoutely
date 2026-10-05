'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  ChevronRight,
  FilePlus,
  Menu,
  Search,
  Sparkles,
  User,
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
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    switchUser,
  } = useWorkspace();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Dinesh Beta Tester Quick Bypass Handler
  const handleDineshBypass = () => {
    // If Dinesh is in workspace members or switch to Dinesh profile
    switchUser('10000000-0000-0000-0000-000000000002');
  };

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
    <header className="h-14 px-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-20 flex items-center justify-between transition-colors">
      {/* Left: Mobile Menu Toggle + Breadcrumbs / Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none transition-colors"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {breadcrumbs && breadcrumbs.length > 0 ? (
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            {breadcrumbs.map((b, i) => (
              <React.Fragment key={i}>
                {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />}
                {b.href ? (
                  <Link
                    href={b.href}
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    {b.label}
                  </Link>
                ) : (
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {b.label}
                  </span>
                )}
              </React.Fragment>
            ))}
          </nav>
        ) : (
          <div className="flex items-baseline gap-2">
            <h1 className="text-sm font-semibold text-slate-900 dark:text-white">
              {title || `Welcome, ${currentUser.name.split(' ')[0]}`}
            </h1>
            {subtitle && (
              <span className="hidden sm:inline text-xs text-slate-400 font-normal">
                • {subtitle}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right: Actions, Search, Notifications, Dinesh Profile */}
      <div className="flex items-center gap-2.5">
        {/* Command Search Trigger */}
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs border border-slate-200 dark:border-slate-700 transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="text-slate-400">Search occupancies, quotes...</span>
          <kbd className="text-[10px] font-mono bg-white dark:bg-slate-900 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-500">
            ⌘K
          </kbd>
        </button>

        {/* AI Assistant */}
        <button
          onClick={() => setIsAiDrawerOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
          title="Open AI Underwriting Copilot"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="hidden sm:inline">AI Copilot</span>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 relative transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-3 z-30">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
                <span className="text-xs font-semibold text-slate-900 dark:text-white">
                  Notifications
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium cursor-pointer">
                  Mark all read
                </span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-700/60 mt-1 max-h-64 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className="py-2 px-1 hover:bg-slate-50 dark:hover:bg-slate-700/40 rounded-lg">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
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

        {/* Contact Sales CTA */}
        <a
          href="mailto:sales@quotely.com?subject=Enterprise%20Underwriting%20Inquiry"
          className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          Contact Sales
        </a>

        {/* New Quote Primary Action */}
        {canGenerateQuotes && (
          <Link
            href="/quotes/new"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-xs transition-colors"
          >
            <FilePlus className="w-3.5 h-3.5" />
            <span>New Quote</span>
          </Link>
        )}

        {/* CRITICAL: Dinesh Beta Tester Profile Element / Login Bypass */}
        <button
          type="button"
          onClick={handleDineshBypass}
          title="Beta Tester Profile (Dinesh Gupta)"
          className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
        >
          <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
            D
          </div>
          <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
            Dinesh
          </span>
        </button>
      </div>
    </header>
  );
};
