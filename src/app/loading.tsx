import React from 'react';
import { QuotelySmartLoader } from '@/components/layout/QuotelySmartLoader';

export default function Loading() {
  return (
    <div className="flex-1 flex items-center justify-center p-8 bg-slate-50 dark:bg-slate-950 min-h-[60vh]">
      <QuotelySmartLoader
        contextKey="route-transition"
        message="Loading Quotely Underwriting Engine..."
        subMessage="Synchronizing AIFT 2001 and IIB Loss Cost tariffs"
      />
    </div>
  );
}
