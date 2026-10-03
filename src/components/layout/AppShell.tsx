'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { CommandPalette } from './CommandPalette';
import { AIAssistantDrawer } from './AIAssistantDrawer';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  
  // Public marketing, authentication, and isolated Platform Admin pages
  const isStandalonePage =
    pathname === '/' ||
    pathname === '/security' ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password' ||
    pathname.startsWith('/accept-invitation') ||
    pathname.startsWith('/admin');

  if (isStandalonePage) {
    return <main className="min-h-screen bg-slate-950 text-slate-100">{children}</main>;
  }

  return (
    <div className="flex h-screen w-full max-w-full overflow-hidden bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {children}
      </div>
      <CommandPalette />
      <AIAssistantDrawer />
    </div>
  );
};
