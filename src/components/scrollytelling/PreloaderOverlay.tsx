'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PreloaderOverlayProps {
  progress: number;
  isLoading: boolean;
}

export const PreloaderOverlay: React.FC<PreloaderOverlayProps> = ({ progress, isLoading }) => {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#FBF9F5] select-none"
        >
          {/* Subtle ambient radial glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(0,200,83,0.08),transparent_60%)] pointer-events-none" />

          {/* Logo & Brand Header */}
          <div className="relative z-10 flex flex-col items-center text-center px-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-2xl bg-white/90 border border-[#121316]/10 p-1.5 shadow-[0_4px_16px_rgba(0,0,0,0.06)] flex items-center justify-center">
                <img src="/qoutely_logo.png" alt="Qoutely" className="w-full h-full object-contain" />
              </div>
              <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#121316]">
                Qoutely
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#00C853] animate-pulse" />
            </div>

            <p className="text-[11px] font-semibold text-[#5A6065] tracking-widest uppercase mb-8">
              AI Operating System for Insurance Brokers
            </p>

            {/* Synchronized Frosted Glass Progress Bar Container */}
            <div className="w-64 sm:w-80 h-2 bg-[#121316]/5 rounded-full overflow-hidden border border-[#121316]/10 mb-3 relative shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-[#0F5132] via-[#00C853] to-[#10B981] rounded-full relative"
                style={{
                  width: `${progress}%`,
                  transition: 'width 100ms cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                {/* Glowing leading edge */}
                <div className="absolute right-0 top-0 bottom-0 w-3 bg-white/50 blur-[1px] rounded-full" />
              </div>
            </div>

            {/* Loading readout with tabular numerals */}
            <div className="flex items-center justify-between w-64 sm:w-80 text-xs font-mono text-[#5A6065]">
              <span>Initializing flight engine...</span>
              <span className="font-semibold text-[#121316] tabular-nums">{progress}%</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
