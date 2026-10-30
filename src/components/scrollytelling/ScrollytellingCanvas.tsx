'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollytellingAssets, MascotCoordinate } from './types';

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
 * Piecewise mapping — guarantees monotonic, smooth frame interpolation:
 * p = 0.000000 → Frame 1   (Index 0)
 * p = 0.333333 → Frame 70  (Index 69)
 * p = 0.666667 → Frame 149 (Index 148)
 * p = 1.000000 → Frame 215 (Index 214)
 */
export function getFrameFromProgress(p: number): number {
  const clamped = Math.max(0, Math.min(1, p));
  
  if (clamped <= 0.008) return 0;
  if (Math.abs(clamped - 0.333333) <= 0.008) return 69;
  if (Math.abs(clamped - 0.666667) <= 0.008) return 148;
  if (clamped >= 0.992) return 214;

  if (clamped < 0.333333) {
    const norm = clamped / 0.333333;
    return Math.min(69, Math.max(0, Math.round(norm * 69)));
  } else if (clamped < 0.666667) {
    const norm = (clamped - 0.333333) / (0.666667 - 0.333333);
    return Math.min(148, Math.max(69, 69 + Math.round(norm * (148 - 69))));
  } else {
    const norm = (clamped - 0.666667) / (1.0 - 0.666667);
    return Math.min(214, Math.max(148, 148 + Math.round(norm * (214 - 148))));
  }
}

export const ScrollytellingCanvas: React.FC<ScrollytellingCanvasProps> = ({
  assets,
  containerRef,
  onCoordinateUpdate,
  onSectionChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Animated progress value (synchronized across GSAP section tweens)
  const animatedProgressRef = useRef<number>(0);
  const currentSectionRef = useRef<number>(0);
  const isTransitioningRef = useRef<boolean>(false);
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
    //  DETERMINISTIC SECTION-BY-SECTION TRANSITION CONTROLLER
    //  Eliminates Lenis virtual scroll momentum loop fighting.
    //  Every scroll gesture, swipe, or key cleanly glides from
    //  Section N to Section N±1 and locks onto resting frames.
    // ─────────────────────────────────────────────────────────
    const tweenObj = { progress: animatedProgressRef.current };

    const navigateToSection = (targetIndex: number, duration: number = 0.72) => {
      const clamped = Math.max(0, Math.min(3, targetIndex));
      if (clamped === currentSectionRef.current && !isTransitioningRef.current) return;

      isTransitioningRef.current = true;
      currentSectionRef.current = clamped;
      if (onSectionChange) onSectionChange(clamped);

      const targetProgress = SNAP_POINTS[clamped];

      gsap.killTweensOf(tweenObj);
      gsap.to(tweenObj, {
        progress: targetProgress,
        duration: duration,
        ease: 'power2.out',
        onUpdate: () => {
          animatedProgressRef.current = tweenObj.progress;
          updateSectionStyles(tweenObj.progress);

          // Synchronize window scroll top so scrollbar position is consistent
          if (containerRef.current) {
            const maxScroll = containerRef.current.scrollHeight - window.innerHeight;
            window.scrollTo({
              top: maxScroll * tweenObj.progress,
              behavior: 'instant' as ScrollBehavior,
            });
          }
        },
        onComplete: () => {
          animatedProgressRef.current = targetProgress;
          tweenObj.progress = targetProgress;
          updateSectionStyles(targetProgress);
          lastDrawnFrameRef.current = -1; // force render exact resting anchor

          // Short grace period to prevent mouse wheel inertia double-stepping
          setTimeout(() => {
            isTransitioningRef.current = false;
          }, 120);
        },
      });
    };

    // Expose controller globally for Navbar and CTA buttons
    (window as unknown as { __navigateToSection?: (idx: number, dur?: number) => void }).__navigateToSection = navigateToSection;
    (window as unknown as { __currentSection?: () => number }).__currentSection = () => currentSectionRef.current;

    // ─────────────────────────────────────────────────────────
    //  WHEEL GESTURE INTERCEPTOR (Crisp Section-by-Section)
    // ─────────────────────────────────────────────────────────
    let lastWheelTime = 0;

    const handleWheel = (e: WheelEvent) => {
      // Allow browser zoom (Ctrl + wheel) or internal scroll in modal dialogs
      if (e.ctrlKey || e.metaKey) return;
      const target = e.target as HTMLElement | null;
      if (target && target.closest('[data-lenis-prevent], [role="dialog"], .allow-scroll')) {
        return;
      }

      e.preventDefault();

      const now = Date.now();
      // Enforce debounce cooldown while an animation is actively playing
      if (isTransitioningRef.current || now - lastWheelTime < 420) {
        return;
      }

      // Ignore micro-jitter
      if (Math.abs(e.deltaY) < 18) {
        return;
      }

      lastWheelTime = now;

      if (e.deltaY > 0) {
        // Scroll Down -> Next Section
        navigateToSection(currentSectionRef.current + 1);
      } else {
        // Scroll Up -> Previous Section
        navigateToSection(currentSectionRef.current - 1);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });

    // ─────────────────────────────────────────────────────────
    //  KEYBOARD NAVIGATION (Arrow keys, PageUp/Down, Space)
    // ─────────────────────────────────────────────────────────
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeEl.tagName)) {
        return;
      }

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

    window.addEventListener('keydown', handleKeyDown);

    // ─────────────────────────────────────────────────────────
    //  TOUCH SWIPE NAVIGATION (Mobile / Tablet)
    // ─────────────────────────────────────────────────────────
    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };
    const handleTouchEnd = (e: TouchEvent) => {
      const delta = touchStartY - e.changedTouches[0].clientY;
      if (Math.abs(delta) > 35 && !isTransitioningRef.current) {
        if (delta > 0) {
          navigateToSection(currentSectionRef.current + 1);
        } else {
          navigateToSection(currentSectionRef.current - 1);
        }
      }
    };

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
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      delete (window as unknown as { __navigateToSection?: unknown }).__navigateToSection;
      delete (window as unknown as { __currentSection?: unknown }).__currentSection;
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
