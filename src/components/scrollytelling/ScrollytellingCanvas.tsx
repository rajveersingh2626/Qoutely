'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollytellingAssets, MascotCoordinate } from './types';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface ScrollytellingCanvasProps {
  assets: ScrollytellingAssets;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onCoordinateUpdate?: (coord: MascotCoordinate) => void;
  onSectionChange?: (activeSection: number) => void;
}

// Curated safe resting anchor frames (0-indexed) where the character is perfectly upright and poised
// Section 0 (Hero 0%):           Frame 1   (Index 0)   — Upright, wings poised in right corridor (cx ≈ 973)
// Section 1 (Workflows 33.33%):  Frame 70  (Index 69)  — Upright, level wings in center-right corridor (cx ≈ 686)
// Section 2 (Carrier 66.66%):    Frame 149 (Index 148) — Upright, poised wings in left pedestal dock (cx ≈ 240)
// Section 3 (Pricing 100%):      Frame 215 (Index 214) — Upright, wings poised centered above pricing (cx ≈ 646)
export const RESTING_FRAMES = [0, 69, 148, 214];
export const SNAP_POINTS = [0, 0.333333, 0.666667, 1.0];

/**
 * Piecewise mapping — ensures exact anchor alignment at section milestones:
 * p = 0.000000 → Frame 1   (Index 0)
 * p = 0.333333 → Frame 70  (Index 69)
 * p = 0.666667 → Frame 149 (Index 148)
 * p = 1.000000 → Frame 215 (Index 214)
 * 
 * Generous resting anchor zones (±0.035 around each section milestone)
 * ensure that whenever the user rests at or near a section,
 * the character is locked strictly to its clean, upright resting pose.
 */
export function getFrameFromProgress(p: number): number {
  const clamped = Math.max(0, Math.min(1, p));
  
  // Generous resting anchor zones (±0.035 around each section milestone)
  // Guarantees that whenever the user rests at or near a section,
  // the character is locked strictly to its clean, upright resting pose with idle hovering.
  if (clamped <= 0.035) return 0;
  if (Math.abs(clamped - 0.333333) <= 0.035) return 69;
  if (Math.abs(clamped - 0.666667) <= 0.035) return 148;
  if (clamped >= 0.965) return 214;

  if (clamped < 0.333333) {
    const local = (clamped - 0.035) / (0.333333 - 0.07);
    const normalized = Math.max(0, Math.min(1, local));
    return Math.min(69, Math.max(0, Math.round(normalized * 69)));
  } else if (clamped < 0.666667) {
    const local = (clamped - (0.333333 + 0.035)) / (0.333334 - 0.07);
    const normalized = Math.max(0, Math.min(1, local));
    return Math.min(148, Math.max(69, 69 + Math.round(normalized * (148 - 69))));
  } else {
    const local = (clamped - (0.666667 + 0.035)) / (0.333333 - 0.07);
    const normalized = Math.max(0, Math.min(1, local));
    return Math.min(214, Math.max(148, 148 + Math.round(normalized * (214 - 148))));
  }
}

export const ScrollytellingCanvas: React.FC<ScrollytellingCanvasProps> = ({
  assets,
  containerRef,
  onCoordinateUpdate,
  onSectionChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Animated progress value (separate from raw scroll to allow eased snap-to)
  const scrollProgressRef = useRef<number>(0);
  const animatedProgressRef = useRef<number>(0);
  const currentSectionRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);
  const lastDrawnFrameRef = useRef<number>(-1);

  const NATIVE_W = 1280;
  const NATIVE_H = 720;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let dpr = window.devicePixelRatio || 1;

    const handleResize = () => {
      dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;

      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      lastDrawnFrameRef.current = -1; // force redraw on resize
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Cache direct DOM section elements for zero-overhead direct style updates
    const el0 = document.getElementById('section-hero');
    const el1 = document.getElementById('section-workflows');
    const el2 = document.getElementById('section-carrier');
    const el3 = document.getElementById('section-landing');

    const updateSectionStyles = (p: number) => {
      const op0 = Math.max(0, Math.min(1, 1 - p * 3.8));
      const op1 = Math.max(0, Math.min(1, 1 - Math.abs(p - 0.33333) * 4.5));
      const op2 = Math.max(0, Math.min(1, 1 - Math.abs(p - 0.66666) * 4.5));
      const op3 = Math.max(0, Math.min(1, 1 - Math.abs(p - 1.0) * 4.0));

      if (el0) {
        el0.style.opacity = op0.toFixed(3);
        el0.style.transform = `translateY(${((1 - op0) * -14).toFixed(1)}px)`;
        el0.style.pointerEvents = op0 > 0.35 ? 'auto' : 'none';
      }
      if (el1) {
        el1.style.opacity = op1.toFixed(3);
        el1.style.transform = `translateY(${((1 - op1) * -14).toFixed(1)}px)`;
        el1.style.pointerEvents = op1 > 0.35 ? 'auto' : 'none';
      }
      if (el2) {
        el2.style.opacity = op2.toFixed(3);
        el2.style.transform = `translateY(${((1 - op2) * -14).toFixed(1)}px)`;
        el2.style.pointerEvents = op2 > 0.35 ? 'auto' : 'none';
      }
      if (el3) {
        el3.style.opacity = op3.toFixed(3);
        el3.style.transform = `translateY(${((1 - op3) * -14).toFixed(1)}px)`;
        el3.style.pointerEvents = op3 > 0.35 ? 'auto' : 'none';
      }
    };

    updateSectionStyles(0);

    // ─────────────────────────────────────────────────────────
    //  MAGNETIC SNAP & SCROLL ENGINE (LENIS DRIVEN)
    //  No fighting between ScrollTrigger snap and Lenis momentum.
    //  Lenis handles smooth scrolling, and magnetic settle guarantees
    //  the mascot lands cleanly on the resting anchor keyframes.
    // ─────────────────────────────────────────────────────────
    let snapDebounceTimer: ReturnType<typeof setTimeout> | null = null;
    let isProgrammaticSnap = false;

    const navigateToSection = (targetIndex: number) => {
      const clamped = Math.max(0, Math.min(3, targetIndex));
      currentSectionRef.current = clamped;
      if (onSectionChange) onSectionChange(clamped);

      const maxScroll =
        (containerRef.current?.scrollHeight ?? document.documentElement.scrollHeight) -
        window.innerHeight;
      const targetScroll = maxScroll * SNAP_POINTS[clamped];

      const lenis = (window as unknown as { __lenis?: { scrollTo: (y: number, opts?: Record<string, unknown>) => void } }).__lenis;

      if (lenis) {
        isProgrammaticSnap = true;
        lenis.scrollTo(targetScroll, {
          duration: 0.85,
          easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          onComplete: () => {
            isProgrammaticSnap = false;
            animatedProgressRef.current = SNAP_POINTS[clamped];
            updateSectionStyles(SNAP_POINTS[clamped]);
            lastDrawnFrameRef.current = -1;
          },
        });
      } else {
        window.scrollTo({ top: targetScroll, behavior: 'smooth' });
      }
    };

    const performMagneticSnap = (direction: number = 0) => {
      if (isProgrammaticSnap || !containerRef.current) return;
      const maxScroll = containerRef.current.scrollHeight - window.innerHeight;
      if (maxScroll <= 0) return;

      const currentScroll = window.scrollY;
      const currentProgress = Math.max(0, Math.min(1, currentScroll / maxScroll));

      // Determine closest snap milestone
      let closestIdx = 0;
      let minDiff = Infinity;
      for (let i = 0; i < SNAP_POINTS.length; i++) {
        const diff = Math.abs(currentProgress - SNAP_POINTS[i]);
        if (diff < minDiff) {
          minDiff = diff;
          closestIdx = i;
        }
      }

      let targetIdx = closestIdx;
      // Directional bias if user scrolled with significant intent
      if (direction > 0 && currentProgress > SNAP_POINTS[currentSectionRef.current] + 0.04) {
        targetIdx = Math.min(3, currentSectionRef.current + 1);
      } else if (direction < 0 && currentProgress < SNAP_POINTS[currentSectionRef.current] - 0.04) {
        targetIdx = Math.max(0, currentSectionRef.current - 1);
      }

      const targetScroll = maxScroll * SNAP_POINTS[targetIdx];

      // Snap if off target by more than 2px
      if (Math.abs(currentScroll - targetScroll) > 2) {
        navigateToSection(targetIdx);
      } else {
        currentSectionRef.current = targetIdx;
        animatedProgressRef.current = SNAP_POINTS[targetIdx];
        updateSectionStyles(SNAP_POINTS[targetIdx]);
        lastDrawnFrameRef.current = -1;
      }
    };

    // Scroll progress synchronizer: called on every frame of scroll
    const handleScrollUpdate = (scrollY: number, direction: number = 0) => {
      if (!containerRef.current) return;
      const maxScroll = containerRef.current.scrollHeight - window.innerHeight;
      if (maxScroll <= 0) return;

      const progress = Math.max(0, Math.min(1, scrollY / maxScroll));
      scrollProgressRef.current = progress;

      if (!isProgrammaticSnap) {
        animatedProgressRef.current = progress;
        updateSectionStyles(progress);
      }

      // Track active section for HUD / Navbar
      let closestIdx = 0;
      let minDiff = Infinity;
      for (let i = 0; i < SNAP_POINTS.length; i++) {
        const diff = Math.abs(progress - SNAP_POINTS[i]);
        if (diff < minDiff) {
          minDiff = diff;
          closestIdx = i;
        }
      }
      if (closestIdx !== currentSectionRef.current && !isProgrammaticSnap) {
        currentSectionRef.current = closestIdx;
        if (onSectionChange) onSectionChange(closestIdx);
      }

      // Debounce magnetic snap after user scroll gesture settles
      if (!isProgrammaticSnap) {
        if (snapDebounceTimer) clearTimeout(snapDebounceTimer);
        snapDebounceTimer = setTimeout(() => {
          performMagneticSnap(direction);
        }, 110);
      }
    };

    // Hook into Lenis scroll listener
    type LenisInstance = {
      scroll: number;
      direction: number;
      on: (event: string, cb: (e: { scroll: number; direction: number }) => void) => () => void;
    };

    let unsubLenis: (() => void) | null = null;
    const attachLenis = () => {
      const lenis = (window as unknown as { __lenis?: LenisInstance }).__lenis;
      if (lenis && typeof lenis.on === 'function') {
        unsubLenis = lenis.on('scroll', (e) => {
          handleScrollUpdate(e.scroll, e.direction);
        });
        return true;
      }
      return false;
    };

    if (!attachLenis()) {
      const checkInterval = setInterval(() => {
        if (attachLenis()) {
          clearInterval(checkInterval);
        }
      }, 50);
      setTimeout(() => clearInterval(checkInterval), 2500);
    }

    // Native scroll fallback (if Lenis not loaded or during initial paint)
    const onNativeScrollFallback = () => {
      if ((window as unknown as { __lenis?: LenisInstance }).__lenis) return;
      handleScrollUpdate(window.scrollY, 0);
    };
    window.addEventListener('scroll', onNativeScrollFallback, { passive: true });

    // Keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowDown', 'PageDown', ' '].includes(e.key)) {
        e.preventDefault();
        navigateToSection(currentSectionRef.current + 1);
      } else if (['ArrowUp', 'PageUp'].includes(e.key)) {
        e.preventDefault();
        navigateToSection(currentSectionRef.current - 1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        navigateToSection(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        navigateToSection(3);
      }
    };

    // Touch swipe navigation
    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };
    const handleTouchEnd = (e: TouchEvent) => {
      const delta = touchStartY - e.changedTouches[0].clientY;
      if (Math.abs(delta) > 40 && !isProgrammaticSnap) {
        if (delta > 0) {
          navigateToSection(currentSectionRef.current + 1);
        } else {
          navigateToSection(currentSectionRef.current - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    // ─────────────────────────────────────────────────────────
    //  Hardware-Accelerated Canvas RAF Loop
    //  Decoupled pacing: reads animatedProgressRef so character
    //  flies cinematically without violent frame jumps.
    //  Adds gentle organic idle-bobbing when resting at anchors.
    // ─────────────────────────────────────────────────────────
    let lastRenderTime = 0;

    const render = (time: number) => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const progress = animatedProgressRef.current;
      const targetFrame = getFrameFromProgress(progress);

      // Check if we are resting on an anchor frame
      const isResting =
        targetFrame === 0 ||
        targetFrame === 69 ||
        targetFrame === 148 ||
        targetFrame === 214;

      // In resting idle, animate subtle organic hovering bob (60fps)
      // When moving, redraw only on frame index change for zero-lag performance
      const needsRedraw =
        targetFrame !== lastDrawnFrameRef.current ||
        (isResting && time - lastRenderTime > 25);

      if (needsRedraw) {
        lastDrawnFrameRef.current = targetFrame;
        lastRenderTime = time;

        ctx.save();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);

        const nativeAspect = NATIVE_W / NATIVE_H;
        const screenAspect = w / h;

        let drawW: number;
        let drawH: number;
        let offsetX: number;
        let offsetY: number;

        if (screenAspect > nativeAspect) {
          drawH = h;
          drawW = h * nativeAspect;
          offsetX = (w - drawW) / 2;
          offsetY = 0;
        } else {
          drawW = w;
          drawH = w / nativeAspect;
          offsetX = 0;
          offsetY = (h - drawH) / 2;
        }

        const scale = drawW / NATIVE_W;

        // Subtle gentle idle bobbing when resting on anchors (CSS/Canvas loop)
        // Damped to 0 while flying between sections
        const idleBob = isResting ? Math.sin(time * 0.0022) * 4.5 : 0;

        // Fetch trajectory data for current frame
        const traj = assets.trajectory[targetFrame] || {
          cx: 973,
          cy: 360,
          w: 422,
          h: 270,
        };

        const mascotX = offsetX + traj.cx * scale;
        const mascotY = offsetY + (traj.cy + idleBob) * scale;
        const mascotW = traj.w * scale;
        const mascotH = traj.h * scale;

        if (onCoordinateUpdate) {
          onCoordinateUpdate({
            screenX: mascotX,
            screenY: mascotY,
            screenW: mascotW,
            screenH: mascotH,
            frameIndex: targetFrame,
          });
        }

        // Draw hardware-accelerated flight frame with gentle bob applied
        const flightImg = assets.flightFrames[targetFrame];
        if (flightImg && flightImg.complete) {
          ctx.drawImage(flightImg, offsetX, offsetY + idleBob * scale, drawW, drawH);
        }

        ctx.restore();
      }

      rafIdRef.current = requestAnimationFrame(render);
    };

    rafIdRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', onNativeScrollFallback);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      if (unsubLenis) unsubLenis();
      if (snapDebounceTimer) clearTimeout(snapDebounceTimer);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [assets, containerRef, onCoordinateUpdate, onSectionChange]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-10 w-full h-full"
    />
  );
};
