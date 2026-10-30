/**
 * Quotely Dual-Loading UX Engine
 * Weighted Distribution: Type 1 (Cinematic Video) ~80%, Type 2 (Standard Animated) ~20%
 */

export type LoaderType = 'video' | 'animated';

export interface LoaderOptions {
  contextKey?: string; // e.g. 'quote-calc', 'ocr-extract', 'tariff-refresh'
  forceType?: LoaderType;
  videoWeight?: number; // default 0.80 (80%)
}

const DEFAULT_VIDEO_WEIGHT = 0.80;

/**
 * Deterministic hash function for consistent loader selection per operation
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Selects loader type obeying the strict weight constraint:
 * Type 1 (Video) is significantly more prominent (~80%) than Type 2 (Animated ~20%).
 */
export function getSmartLoaderType(options: LoaderOptions = {}): LoaderType {
  if (options.forceType) {
    return options.forceType;
  }

  const weight = options.videoWeight ?? DEFAULT_VIDEO_WEIGHT;
  const threshold = Math.round(weight * 100);

  if (options.contextKey) {
    const val = hashString(options.contextKey) % 100;
    return val < threshold ? 'video' : 'animated';
  }

  // Non-deterministic weighted random selection
  const randomVal = Math.floor(Math.random() * 100);
  return randomVal < threshold ? 'video' : 'animated';
}
