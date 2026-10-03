'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Activity,
  AlertTriangle,
  BookOpen,
  Building,
  CheckCircle2,
  ChevronDown,
  Cpu,
  FilePlus,
  FileSpreadsheet,
  FileText,
  Flame,
  Globe2,
  History,
  LayoutDashboard,
  LogOut,
  MapPin,
  Moon,
  Plus,
  Search,
  Settings,
  Shield,
  Sparkles,
  Sun,
  Upload,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useTheme } from '@/context/ThemeContext';
import { UserRole } from '@/types/database';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const {
    currentWorkspace,
    workspaces,
    switchWorkspace,
    currentUser,
    switchUser,
    userRole,
    quotes,
    isAiDrawerOpen,
    setIsAiDrawerOpen,
    setIsCommandPaletteOpen,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
  } = useWorkspace();
  const { theme, toggleTheme } = useTheme();

  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    router.push('/login');
    router.refresh();
  };

  const navItems = [
    { label: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard },
    {
      label: 'New Underwrite',
      href: '/app/quotes/new',
      icon: FilePlus,
      highlight: true,
      badge: '3-Col',
    },
    {
      label: 'Upload Proposal',
      href: '/app/upload',
      icon: Upload,
      badge: 'AI OCR',
    },
    { label: 'AI Underwriting', href: '/app/ai-analysis', icon: Sparkles },
    {
      label: 'Quotes History',
      href: '/app/quotes',
      icon: History,
      count: quotes.length,
    },
    { label: 'Client CRM', href: '/app/clients', icon: Building },
    {
      label: 'Occupancy Explorer',
      href: '/app/occupancies',
      icon: Flame,
      badge: '289',
    },
    {
      label: 'Earthquake Zones',
      href: '/app/earthquake-zones',
      icon: MapPin,
      badge: 'IS 1893',
    },
    {
      label: 'Knowledge Base',
      href: '/app/knowledge-base',
      icon: BookOpen,
      badge: 'AIFT',
    },
  ];

  const adminItems = [
    { label: 'Firm Settings', href: '/app/settings', icon: Settings },
    { label: 'AI Health & Telemetry', href: '/app/settings/ai', icon: Cpu, badge: 'Flash' },
    { label: 'Workspace Team', href: '/app/settings/team', icon: Users },
    { label: 'Audit Trail', href: '/app/audit-logs', icon: Activity },
  ];

  const roleColors: Record<UserRole, string> = {
    super_admin: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200',
    brokerage_owner: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200',
    admin: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border-sky-200',
    underwriter: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200',
    sales_executive: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200',
    viewer: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200',
  };

  const roleLabels: Record<UserRole, string> = {
    super_admin: 'Super Admin',
    brokerage_owner: 'Brokerage Owner',
    admin: 'Admin',
    underwriter: 'Underwriter',
    sales_executive: 'Sales Exec',
    viewer: 'Viewer (Read-only)',
  };

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 w-72 max-w-[85vw] flex flex-col justify-between h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 transform transition-transform duration-300 ease-in-out lg:static lg:w-64 lg:translate-x-0 ${
          isMobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        } flex-shrink-0`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Brand Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800/60">
            <div className="flex items-center justify-between mb-3">
              <Link
                href="/app/dashboard"
                onClick={() => setIsMobileSidebarOpen(false)}
                className="flex items-center gap-2.5 group"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-emerald shadow-sm group-hover:scale-105 transition-transform">
                  {/* Shield Q Logo */}
                  <svg
                    className="w-5 h-5"
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
                  <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                    Quotely
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                      SaaS
                    </span>
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    AI Underwriting OS
                  </p>
                </div>
              </Link>

              <div className="flex items-center gap-1">
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Toggle theme"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Close sidebar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Workspace Switcher */}
            <div className="relative">
            <button
              onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/70 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 text-left transition-all"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {currentWorkspace.name.charAt(0)}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {currentWorkspace.name}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    GST: {currentWorkspace.gst}
                  </p>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 ml-1" />
            </button>

            {isWorkspaceMenuOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-30 animate-in fade-in slide-in-from-top-1">
                <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Brokerage Workspaces
                </div>
                {workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => {
                      switchWorkspace(ws.id);
                      setIsWorkspaceMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 ${
                      ws.id === currentWorkspace.id
                        ? 'text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50/50 dark:bg-emerald-950/30'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="truncate">{ws.name}</span>
                    {ws.id === currentWorkspace.id && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    )}
                  </button>
                ))}
                <div className="border-t border-slate-100 dark:border-slate-700 mt-1 pt-1 px-1">
                  <Link
                    href="/workspaces/new"
                    onClick={() => setIsWorkspaceMenuOpen(false)}
                    className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create New Firm</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Command Trigger */}
        <div className="px-3 pt-3">
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/70 dark:border-slate-700/50 text-xs transition-colors"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5" />
              <span>Search or Cmd+K</span>
            </div>
            <kbd className="text-[10px] font-mono bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Navigation Links */}
        <div className="px-3 py-3 space-y-0.5">
          <div className="px-2 pb-1.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Underwriting
          </div>
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname === item.href.replace('/app', '');
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald/30 font-semibold'
                    : item.highlight
                    ? 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 bg-emerald-50/60 dark:bg-emerald-950/20'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive
                        ? 'text-white'
                        : item.highlight
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {item.count !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="pt-4 px-2 pb-1.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Organization
          </div>
          {adminItems.map((item) => {
            const isActive = pathname === item.href || pathname === item.href.replace('/app', '');
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {userRole === 'super_admin' && (
            <Link
              href="/admin"
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                pathname.startsWith('/admin')
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-blue-600 dark:text-blue-400 bg-blue-50/60 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800'
              }`}
            >
              <Globe2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Platform Super Admin</span>
            </Link>
          )}
        </div>

        {/* AI Assistant Banner Trigger */}
        <div className="px-3 pb-2 mt-auto">
          <button
            onClick={() => setIsAiDrawerOpen(!isAiDrawerOpen)}
            className="w-full p-2.5 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/40 border border-blue-200/70 dark:border-blue-800/50 flex items-center justify-between text-left group hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-blue-950 dark:text-blue-200">
                  Tariff AI Copilot
                </p>
                <p className="text-[10px] text-blue-600 dark:text-blue-400">
                  Citing AIFT 2001 & IIB
                </p>
              </div>
            </div>
            <span className="text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-full font-medium">
              Open
            </span>
          </button>
        </div>
      </div>

      {/* User & Role Switcher Footer */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 relative bg-slate-50/50 dark:bg-slate-900/50">
        <button
          onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
          className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all text-left"
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 flex-shrink-0 border border-slate-300 dark:border-slate-700">
              <img
                src={currentUser.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'}
                alt={currentUser.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                {currentUser.name}
              </p>
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-[9px] font-semibold px-1.5 py-0.2 rounded border ${roleColors[userRole]}`}
                >
                  {roleLabels[userRole]}
                </span>
              </div>
            </div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>

        {isRoleMenuOpen && (
          <div className="absolute bottom-full left-3 right-3 mb-1.5 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-3.5 z-30 space-y-3">
            <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100 dark:border-slate-700/80">
              <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-200 flex-shrink-0 border border-slate-300 dark:border-slate-600">
                <img
                  src={currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                  alt={currentUser.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {currentUser.name}
                </p>
                <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 space-y-1.5">
              <div className="flex items-center justify-between">
                <span>Access Tier:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Super Admin (All Access)</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Workspace:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[130px]">
                  {currentWorkspace.name}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-700/80">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors font-semibold cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  </>
  );
};
