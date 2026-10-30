'use client';

import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import styles from './AnimatedWingedCharacter.module.css';

export interface AnimatedWingedCharacterHandle {
  setPhysics: (pitch: number, roll: number, velocityRatio: number) => void;
  setGaze: (yaw: number, pitch: number) => void;
}

export interface AnimatedWingedCharacterProps {
  glowIntensity?: number;
  idleHover?: boolean;
  interactiveLook?: boolean;
  className?: string;
  priority?: boolean;
  scale?: number;
}

export const AnimatedWingedCharacter = forwardRef<
  AnimatedWingedCharacterHandle,
  AnimatedWingedCharacterProps
>(({
  glowIntensity = 1,
  idleHover = true,
  interactiveLook = true,
  className = '',
  priority = true,
  scale = 1,
}, ref) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const bankLayerRef = useRef<HTMLDivElement>(null);
  const pitchLayerRef = useRef<HTMLDivElement>(null);
  const gazeLayerRef = useRef<HTMLDivElement>(null);
  const idleLayerRef = useRef<HTMLDivElement>(null);
  const vortexRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // High-performance GSAP quickTo setters for 60-120fps direct DOM manipulation
  const bankQuickRef = useRef<((value: number) => void) | null>(null);
  const pitchQuickRef = useRef<((value: number) => void) | null>(null);
  const gazeYawQuickRef = useRef<((value: number) => void) | null>(null);
  const gazePitchQuickRef = useRef<((value: number) => void) | null>(null);

  useEffect(() => {
    if (!bankLayerRef.current || !pitchLayerRef.current || !gazeLayerRef.current) return;

    // Initialize quickTo setters with buttery smooth dampening
    bankQuickRef.current = gsap.quickTo(bankLayerRef.current, 'rotationZ', {
      duration: 0.35,
      ease: 'power2.out',
    });
    pitchQuickRef.current = gsap.quickTo(pitchLayerRef.current, 'rotationX', {
      duration: 0.3,
      ease: 'power2.out',
    });
    gazeYawQuickRef.current = gsap.quickTo(gazeLayerRef.current, 'rotationY', {
      duration: 0.45,
      ease: 'power1.out',
    });
    gazePitchQuickRef.current = gsap.quickTo(gazeLayerRef.current, 'rotationX', {
      duration: 0.45,
      ease: 'power1.out',
    });

    // If standalone interactiveLook is active without external controller
    if (interactiveLook) {
      const handleMouseMove = (e: MouseEvent) => {
        const nx = (e.clientX / window.innerWidth - 0.5) * 2;
        const ny = (e.clientY / window.innerHeight - 0.5) * 2;
        gazeYawQuickRef.current?.(nx * 10);
        gazePitchQuickRef.current?.(-ny * 8);
      };

      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
      };
    }
  }, [interactiveLook]);

  // Expose imperative physics controls to parent flight director
  useImperativeHandle(ref, () => ({
    setPhysics: (pitch: number, roll: number, velocityRatio: number) => {
      pitchQuickRef.current?.(pitch);
      bankQuickRef.current?.(roll);

      if (vortexRef.current) {
        vortexRef.current.style.opacity = String(Math.min(1, Math.max(0, velocityRatio * 1.4)));
      }

      if (imageContainerRef.current) {
        if (velocityRatio > 0.35) {
          imageContainerRef.current.classList.add(styles.fastFlightGlow);
        } else {
          imageContainerRef.current.classList.remove(styles.fastFlightGlow);
        }
      }

      if (idleLayerRef.current) {
        if (velocityRatio > 0.25) {
          idleLayerRef.current.classList.add(styles.idlePaused);
        } else {
          idleLayerRef.current.classList.remove(styles.idlePaused);
        }
      }
    },
    setGaze: (yaw: number, pitch: number) => {
      gazeYawQuickRef.current?.(yaw);
      gazePitchQuickRef.current?.(pitch);
    },
  }));

  return (
    <div
      ref={stageRef}
      className={`${styles.characterStage} ${className}`}
      style={{ transform: `scale(${scale})` }}
    >
      {/* Ambient flight emerald glow */}
      <div
        className={styles.ambientFlightGlow}
        style={{
          opacity: Math.max(0.3, Math.min(1.2, glowIntensity)),
        }}
      />

      {/* Aerodynamic Speed Vortices (Opacified by velocity ratio) */}
      <div ref={vortexRef} className={styles.windVortexContainer}>
        <svg className="w-full h-full" viewBox="0 0 300 200" fill="none">
          <path
            d="M 20 80 Q 90 20, 200 40 T 290 90"
            strokeWidth="2.5"
            strokeLinecap="round"
            className={styles.speedStreamLine}
          />
          <path
            d="M 10 120 Q 110 160, 220 130 T 295 110"
            strokeWidth="2"
            strokeLinecap="round"
            className={styles.speedStreamLine}
            style={{ animationDelay: '-0.35s' }}
          />
        </svg>
      </div>

      {/* Luminous Golden-Emerald Micro Particles */}
      <div className={styles.particlesContainer}>
        <span className={styles.sparkleParticle} />
        <span className={styles.sparkleParticle} />
        <span className={styles.sparkleParticle} />
        <span className={styles.sparkleParticle} />
      </div>

      {/* ISOLATED 3D RIGGING HIERARCHY */}
      {/* Layer 1: Banking / Roll */}
      <div ref={bankLayerRef} className={styles.bankLayer}>
        {/* Layer 2: Pitch / Dive */}
        <div ref={pitchLayerRef} className={styles.pitchLayer}>
          {/* Layer 3: Gaze / Yaw */}
          <div ref={gazeLayerRef} className={styles.gazeLayer}>
            {/* Layer 4: Organic Idle Float (CSS Keyframes) */}
            <div
              ref={idleLayerRef}
              className={`${styles.idleHoverLayer} ${!idleHover ? styles.idlePaused : ''}`}
            >
              {/* Layer 5: Visual Asset Container */}
              <div ref={imageContainerRef} className={styles.characterImageContainer}>
                <Image
                  src="/winged_money_character.png"
                  alt="Quotely Autonomous Underwriting Copilot"
                  width={973}
                  height={647}
                  priority={priority}
                  className={styles.characterImage}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

AnimatedWingedCharacter.displayName = 'AnimatedWingedCharacter';

export default AnimatedWingedCharacter;
