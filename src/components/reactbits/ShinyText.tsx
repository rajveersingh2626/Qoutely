'use client';

import React from 'react';

interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
  shimmerColor?: string;
}

export const ShinyText: React.FC<ShinyTextProps> = ({
  text,
  disabled = false,
  speed = 3,
  className = '',
  shimmerColor = 'rgba(255, 255, 255, 0.85)',
}) => {
  const animationDuration = `${speed}s`;

  return (
    <span
      className={`relative inline-block overflow-hidden bg-clip-text text-transparent ${className}`}
      style={{
        backgroundImage: `linear-gradient(120deg, currentColor 0%, currentColor 40%, ${shimmerColor} 50%, currentColor 60%, currentColor 100%)`,
        backgroundSize: '200% 100%',
        animation: disabled ? 'none' : `shiny-sweep ${animationDuration} linear infinite`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}
    >
      {text}
      <style jsx>{`
        @keyframes shiny-sweep {
          0% {
            background-position: 100% 0;
          }
          100% {
            background-position: -100% 0;
          }
        }
      `}</style>
    </span>
  );
};

export default ShinyText;
