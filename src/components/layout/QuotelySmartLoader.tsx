'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { getSmartLoaderType, LoaderType } from '@/lib/loading-manager';
import { QuotelyLoadingAnimation } from '@/components/animations/QuotelyLoadingAnimation';
import { ShieldCheck } from 'lucide-react';

interface QuotelySmartLoaderProps {
  contextKey?: string;
  message?: string;
  subMessage?: string;
  size?: 'sm' | 'md' | 'lg' | 'fullscreen';
  forceType?: LoaderType;
  className?: string;
}

export const QuotelySmartLoader: React.FC<QuotelySmartLoaderProps> = ({
  contextKey,
  message = 'Calculating statutory tariff schedules...',
  subMessage = 'Cross-verifying against IIB Schedule 3 & AIFT 2001',
  size = 'md',
  forceType,
  className = '',
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const selectedType: LoaderType = useMemo(() => {
    if (!mounted) return 'animated';
    return getSmartLoaderType({ contextKey, forceType });
  }, [mounted, contextKey, forceType]);

  const isFullscreen = size === 'fullscreen';

  const containerClasses = isFullscreen
    ? 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6'
    : `flex flex-col items-center justify-center p-6 ${className}`;

  if (!mounted) {
    return (
      <div className={containerClasses}>
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center gap-3 text-center max-w-sm">
        {/* Hardware-Accelerated Orbital Winged Animation (Replaces heavy video) */}
        <div className="relative group flex items-center justify-center p-2">
          <QuotelyLoadingAnimation size={size === 'sm' ? 'sm' : 'md'} />
        </div>

        {/* Message & Sub-label */}
        <div className="space-y-1">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight flex items-center justify-center gap-1.5">
            <span>{message}</span>
          </p>
          {subMessage && (
            <p className="text-[11px] font-mono text-slate-500 dark:text-zinc-400">
              {subMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
