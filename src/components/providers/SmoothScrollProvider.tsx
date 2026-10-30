'use client';

import React from 'react';

interface SmoothScrollProviderProps {
  children: React.ReactNode;
}

/**
 * Clean layout wrapper. Lenis has been replaced with deterministic
 * section-by-section transition mechanics in ScrollytellingCanvas
 * to eliminate scroll fighting and awkward frozen frames.
 */
export const SmoothScrollProvider: React.FC<SmoothScrollProviderProps> = ({ children }) => {
  return <>{children}</>;
};

export default SmoothScrollProvider;
