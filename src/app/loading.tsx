import React from 'react';

export default function Loading() {
  return (
    <div className="flex-1 flex items-center justify-center p-8 bg-slate-50 dark:bg-slate-950 min-h-[50vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-9 h-9 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-medium text-slate-500 font-mono tracking-wide">
          Calculating tariff schedules...
        </span>
      </div>
    </div>
  );
}
