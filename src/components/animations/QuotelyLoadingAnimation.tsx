'use client';

import React from 'react';
import Image from 'next/image';
import styles from './Loader.module.css';

interface QuotelyLoadingAnimationProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const QuotelyLoadingAnimation: React.FC<QuotelyLoadingAnimationProps> = ({
  size = 'md',
  className = '',
}) => {
  const scale = size === 'sm' ? 0.75 : size === 'lg' ? 1.25 : 1;

  return (
    <div
      className={`${styles.loaderContainer} ${className}`}
      style={{ transform: `scale(${scale})` }}
      aria-label="Quotely Loading Animation"
      role="status"
    >
      {/* SVG Motion Trail Path that character orbits along */}
      <svg
        className={styles.orbitSvg}
        viewBox="0 0 220 220"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="emeraldGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
            <stop offset="50%" stopColor="#10b981" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#059669" stopOpacity="1" />
          </linearGradient>
        </defs>
        {/* Curved elliptical orbit path matching keyframes */}
        <path
          className={styles.motionPath}
          d="M 185 45 C 195 90, 140 180, 80 170 C 30 160, 35 75, 110 50 C 135 40, 125 100, 110 110"
        />
      </svg>

      {/* Central Dark Green 'Q' Logo */}
      <div className={styles.centerLogoWrapper}>
        <Image
          src="/qoutely_logo.png"
          alt="Quotely Q Logo"
          width={64}
          height={64}
          priority
          className={styles.qLogo}
        />
      </div>

      {/* Three Bouncing Dots Below the 'Q' */}
      <div className={styles.dotsWrapper}>
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </div>

      {/* Winged Money Character Orbiting and Landing */}
      <div className={styles.wingedCharacter}>
        <Image
          src="/winged_money_character.png"
          alt="Winged Character"
          width={54}
          height={36}
          priority
          className={styles.wingedImg}
        />
      </div>
    </div>
  );
};

export default QuotelyLoadingAnimation;
