'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { Sparkles, ArrowRight, ArrowLeft, ShieldCheck, Zap, CheckCircle2 } from 'lucide-react';
import { AnimatedWingedCharacter, AnimatedWingedCharacterHandle } from '@/components/animations/AnimatedWingedCharacter';
import styles from './ScrollLinkedCharacterFlight.module.css';

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

interface ScrollLinkedCharacterFlightProps {
  corridorRef?: React.RefObject<HTMLDivElement | null>;
}

type FlightSection = 'hero' | 'dive' | 'calculator' | 'workflow' | 'pricing' | 'haven';

export const ScrollLinkedCharacterFlight: React.FC<ScrollLinkedCharacterFlightProps> = ({ corridorRef }) => {
  const [mounted, setMounted] = useState(false);
  const [activeSection, setActiveSection] = useState<FlightSection>('hero');
  const [svgPathString, setSvgPathString] = useState<string>('');

  const activeSectionRef = useRef<FlightSection>('hero');
  const rigRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const slipstreamRef = useRef<SVGPathElement>(null);
  const charHandleRef = useRef<AnimatedWingedCharacterHandle>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !rigRef.current) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const rig = rigRef.current;
    const overlay = overlayRef.current;
    const triggerEl = corridorRef?.current || document.getElementById('scroll-corridor') || document.body;

    // Master GSAP Context for 100% clean teardown on unmount
    const ctx = gsap.context(() => {
      // 1. Calculate cinematic waypoints based on responsive viewport & anchor elements
      const calculateWaypoints = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;

        // Query stationary landing targets if rendered
        const heroAnchor = document.getElementById('hero-anchor-target');
        const calcAnchor = document.getElementById('character-destination-anchor');
        const havenAnchor = document.getElementById('q-haven-dock-target');

        // Target coordinates with fallback to golden-ratio viewport positions
        let p0 = { x: w * 0.74, y: h * 0.38 }; // Hero perch
        let p2 = { x: w * 0.24, y: h * 0.46 }; // Statutory rate pedestal
        let p6 = { x: w * 0.76, y: h * 0.50 }; // Grand Q Haven

        if (heroAnchor) {
          const rect = heroAnchor.getBoundingClientRect();
          if (rect.width > 0) {
            p0 = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
          }
        }
        if (calcAnchor) {
          const rect = calcAnchor.getBoundingClientRect();
          if (rect.width > 0) {
            p2 = { x: rect.left + rect.width / 2, y: h * 0.46 };
          }
        }
        if (havenAnchor) {
          const rect = havenAnchor.getBoundingClientRect();
          if (rect.width > 0) {
            p6 = { x: rect.left + rect.width / 2, y: h * 0.50 };
          }
        }

        const p1 = { x: w * 0.50, y: h * 0.28 }; // High-speed dive apex
        const p3 = { x: w * 0.36, y: h * 0.26 }; // Underwriting workflow slalom entry
        const p4 = { x: w * 0.76, y: h * 0.24 }; // Workflow slalom exit
        const p5 = { x: w * 0.54, y: h * 0.40 }; // Professional pricing escort

        return [p0, p1, p2, p3, p4, p5, p6];
      };

      const waypoints = calculateWaypoints();

      // Generate mathematical Catmull-Rom Bezier spline using MotionPathPlugin
      const rawPath = MotionPathPlugin.arrayToRawPath(waypoints, { curviness: 1.4 });
      const pathD = MotionPathPlugin.rawPathToString(rawPath);
      setSvgPathString(pathD);

      // Set initial transform state
      gsap.set(rig, {
        x: waypoints[0].x,
        y: waypoints[0].y,
        xPercent: -50,
        yPercent: -50,
        transformPerspective: 1200,
      });

      // 2. Cinematic Scroll Scrubbed Flight Timeline
      const flightTl = gsap.timeline({
        scrollTrigger: {
          trigger: triggerEl,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1.2, // Silky spring-like scrub lag syncing with Lenis
          onUpdate: (self) => {
            const p = self.progress;
            const velocity = self.getVelocity();
            const absVelocity = Math.abs(velocity);
            const velocityRatio = Math.min(1, absVelocity / 900);

            // Aerodynamic pitch: tilts forward when scrolling down, flares backward when scrolling up
            const clampedVel = Math.max(-1200, Math.min(1200, velocity));
            const targetPitch = (clampedVel / 1200) * 18;

            // Lateral banking calculation based on narrative flight path segments
            let baseBanking = 0;
            if (p >= 0.12 && p < 0.32) {
              // Diving left towards Statutory Engine pedestal
              baseBanking = -22;
            } else if (p >= 0.32 && p < 0.44) {
              // Leveling out on pedestal
              baseBanking = 0;
            } else if (p >= 0.44 && p < 0.68) {
              // Swooping right across 4-step pipeline
              baseBanking = 20;
            } else if (p >= 0.68 && p < 0.84) {
              // Banking towards Professional pricing card
              baseBanking = -6;
            } else if (p >= 0.84) {
              // Settling upright in Grand Q Haven
              baseBanking = 0;
            }

            // Velocity accentuates the bank angle
            const dynamicBanking = baseBanking + (clampedVel / 1200) * 8;

            // Direct DOM update via ref - ZERO React re-renders during high-speed scroll!
            charHandleRef.current?.setPhysics(targetPitch, dynamicBanking, velocityRatio);

            // Determine active narrative section for HUD callout pill (triggers state update ONLY on change)
            let currentSec: FlightSection = 'hero';
            if (p < 0.12) {
              currentSec = 'hero';
            } else if (p >= 0.12 && p < 0.30) {
              currentSec = 'dive';
            } else if (p >= 0.30 && p < 0.46) {
              currentSec = 'calculator';
            } else if (p >= 0.46 && p < 0.70) {
              currentSec = 'workflow';
            } else if (p >= 0.70 && p < 0.86) {
              currentSec = 'pricing';
            } else {
              currentSec = 'haven';
            }

            if (currentSec !== activeSectionRef.current) {
              activeSectionRef.current = currentSec;
              setActiveSection(currentSec);
            }
          },
        },
      });

      // MotionPath tween along the exact mathematical Bezier curve
      flightTl.to(rig, {
        motionPath: {
          path: waypoints,
          curviness: 1.4,
          alignOrigin: [0.5, 0.5],
          autoRotate: false, // Roll & pitch are controlled by aerodynamic physics
        },
        ease: 'none',
        duration: 1,
      });

      // Fade out overlay when scrolled past corridor into FAQ/Footer, fade in on reverse
      if (overlay) {
        ScrollTrigger.create({
          trigger: triggerEl,
          start: 'top top',
          end: 'bottom bottom',
          onLeave: () => {
            gsap.to(overlay, { opacity: 0, duration: 0.35, ease: 'power2.out' });
          },
          onEnterBack: () => {
            gsap.to(overlay, { opacity: 1, duration: 0.35, ease: 'power2.out' });
          },
        });
      }

      // Dynamic cursor look gaze tracking
      const handleMouseMove = (e: MouseEvent) => {
        const nx = (e.clientX / window.innerWidth - 0.5) * 2;
        const ny = (e.clientY / window.innerHeight - 0.5) * 2;
        charHandleRef.current?.setGaze(nx * 10, -ny * 7);
      };

      window.addEventListener('mousemove', handleMouseMove, { passive: true });

      // Refresh on window resize to recalculate waypoints
      const handleResize = () => {
        ScrollTrigger.refresh();
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('resize', handleResize);
      };
    });

    return () => {
      ctx.revert(); // Completely kill all GSAP tweens, motion paths, and ScrollTriggers
    };
  }, [mounted, corridorRef]);

  if (!mounted) return null;

  const flightNode = (
    <div ref={overlayRef} className={styles.flightOverlay}>
      {/* Aerodynamic Bézier Slipstream Trail across Viewport (from VIDEO3.mp4) */}
      <svg
        className={styles.slipstreamSvg}
        viewBox={`0 0 ${typeof window !== 'undefined' ? window.innerWidth : 1920} ${
          typeof window !== 'undefined' ? window.innerHeight : 1080
        }`}
        fill="none"
      >
        {svgPathString && (
          <path
            ref={slipstreamRef}
            d={svgPathString}
            className={styles.slipstreamPath}
          />
        )}
      </svg>

      {/* Main Character Flight Rig */}
      <div ref={rigRef} className={styles.characterRig}>
        <AnimatedWingedCharacter
          ref={charHandleRef}
          glowIntensity={1.0}
          priority={true}
          idleHover={true}
          interactiveLook={false} // Driven by master flight coordinator
        />

        {/* Dynamic Contextual Guidance Callout HUD Pill */}
        <div className={styles.guidancePillWrapper}>
          {activeSection === 'hero' && (
            <div className={styles.guidancePill}>
              <span className={styles.pulseDot} />
              <span>Autonomous Tariff Copilot • Perched</span>
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
            </div>
          )}

          {activeSection === 'dive' && (
            <div className={styles.guidancePill}>
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              <span>Auditing Statutory Loss Costs • S-Curve Flight</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
            </div>
          )}

          {activeSection === 'calculator' && (
            <div className={styles.guidancePill}>
              <span className={styles.pulseDot} />
              <span>IIB Schedule 3 Grounding • Pedestal Locked</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
          )}

          {activeSection === 'workflow' && (
            <div className={styles.guidancePill}>
              <ArrowLeft className="w-3.5 h-3.5 text-emerald-600" />
              <span>Slaloming 4-Step Underwriting Pipeline</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            </div>
          )}

          {activeSection === 'pricing' && (
            <div className={`${styles.guidancePill} ${styles.guidancePillPrimary}`}>
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>Broker Desk: Professional Plan</span>
              <ArrowLeft className="w-3.5 h-3.5 text-white" />
            </div>
          )}

          {activeSection === 'haven' && (
            <div className={styles.guidancePill}>
              <span className={styles.pulseDot} />
              <span>Quotely Core • Touchdown Verified</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(flightNode, document.body);
};

export default ScrollLinkedCharacterFlight;
