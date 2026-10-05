'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Activity,
  BookOpen,
  Building,
  CheckCircle2,
  ChevronDown,
  Cpu,
  FilePlus,
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
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    {
      label: 'New Underwrite',
      href: '/quotes/new',
      icon: FilePlus,
      highlight: true,
    },
    {
      label: 'Upload Proposal',
      href: '/upload',
      icon: Upload,
    },
    { label: 'AI Underwriting', href: '/ai-analysis', icon: Sparkles },
    {
      label: 'Quotes History',
      href: '/quotes',
      icon: History,
      count: quotes.length,
    },
    { label: 'Client CRM', href: '/clients', icon: Building },
    {
      label: 'Occupancy Explorer',
      href: '/occupancies',
      icon: Flame,
    },
    {
      label: 'Earthquake Zones',
      href: '/earthquake-zones',
      icon: MapPin,
    },
    {
      label: 'Knowledge Base',
      href: '/knowledge-base',
      icon: BookOpen,
    },
  ];

  const adminItems = [
    { label: 'Firm Settings', href: '/settings', icon: Settings },
    { label: 'AI Health & Telemetry', href: '/settings/ai', icon: Cpu },
    { label: 'Workspace Team', href: '/settings/team', icon: Users },
    { label: 'Audit Trail', href: '/audit-logs', icon: Activity },
  ];

  const roleLabels: Record<UserRole, string> = {
    super_admin: 'Super Admin',
    brokerage_owner: 'Brokerage Owner',
    admin: 'Admin',
    underwriter: 'Underwriter',
    sales_executive: 'Sales Exec',
    viewer: 'Viewer',
  };

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 w-64 flex flex-col justify-between h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 transform transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isMobileSidebarOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full lg:translate-x-0'
        } flex-shrink-0`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Brand Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <Link
                href="/dashboard"
                onClick={() => setIsMobileSidebarOpen(false)}
                className="flex items-center gap-2.5"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs">
                  <Shield className="w-4 h-4" />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                    Quotely
                  </span>
                  <span className="text-emerald-600 text-lg leading-none font-bold">.</span>
                </div>
              </Link>

              <div className="flex items-center gap-1">
                <button
                  onClick={toggleTheme}
                  className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Toggle theme"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="lg:hidden p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Workspace Switcher */}
            <div className="relative">
              <button
                onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
                className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left transition-colors"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-5 h-5 rounded bg-emerald-600 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
                    {currentWorkspace.name.charAt(0)}
                  </div>
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                    {currentWorkspace.name}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              </button>

              {isWorkspaceMenuOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-30">
                  <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Workspaces
                  </div>
                  {workspaces.map((ws) => (
                    <button
                      key={ws.id}
                      onClick={() => {
                        switchWorkspace(ws.id);
                        setIsWorkspaceMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 ${
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
                      className="flex items-center gap-2 px-2.5 py-1 text-xs text-slate-600 dark:text-slate-400 hover:text-emerald-600 hover:bg-slate-50 rounded transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New Workspace</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <div className="p-3 space-y-0.5">
            <div className="px-2 pb-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Underwriting
            </div>
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                pathname === `/app${item.href}` ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                      : item.highlight
                      ? 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : item.highlight
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && item.count > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-md font-mono bg-slate-100 dark:bg-slate-800 text-slate-500">
                      {item.count}
                    </span>
                  )}
                </Link>
              );
            })}

            <div className="pt-4 px-2 pb-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Management
            </div>
            {adminItems.map((item) => {
              const isActive =
                pathname === item.href ||
                pathname === `/app${item.href}` ||
                pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {userRole === 'super_admin' && (
              <Link
                href="/admin"
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                  pathname.startsWith('/admin')
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Globe2 className="w-4 h-4 text-emerald-600" />
                <span>Super Admin</span>
              </Link>
            )}
          </div>
        </div>

        {/* User Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 relative bg-slate-50/50 dark:bg-slate-900/50">
          <button
            onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors text-left"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-700 dark:text-slate-200">
                {currentUser.name ? currentUser.name.charAt(0) : 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-medium text-slate-900 dark:text-white truncate">
                  {currentUser.name}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {roleLabels[userRole] || 'Member'}
                </p>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isRoleMenuOpen && (
            <div className="absolute bottom-full left-3 right-3 mb-1 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-3 z-30 space-y-2">
              <div className="text-xs">
                <p className="font-semibold text-slate-900 dark:text-white truncate">{currentUser.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-colors font-medium cursor-pointer"
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
