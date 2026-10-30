'use client';

import React from 'react';

interface AuroraBackgroundProps {
  className?: string;
  children?: React.ReactNode;
}

export const AuroraBackground: React.FC<AuroraBackgroundProps> = ({
  className = '',
  children,
}) => {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Dynamic Aurora Ambient Gradients */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[900px] h-[550px] rounded-full blur-[120px] opacity-60 mix-blend-multiply"
          style={{
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.28) 0%, rgba(20, 184, 166, 0.15) 50%, transparent 75%)',
            animation: 'aurora-shift-1 14s ease-in-out infinite alternate',
          }}
        />
        <div
          className="absolute top-[20%] right-[-5%] w-[650px] h-[450px] rounded-full blur-[140px] opacity-50 mix-blend-multiply"
          style={{
            background: 'radial-gradient(circle, rgba(52, 211, 153, 0.22) 0%, rgba(45, 212, 191, 0.12) 60%, transparent 80%)',
            animation: 'aurora-shift-2 18s ease-in-out infinite alternate',
          }}
        />
        <div
          className="absolute top-[50%] left-[-10%] w-[550px] h-[550px] rounded-full blur-[130px] opacity-40 mix-blend-multiply"
          style={{
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.18) 0%, rgba(6, 95, 70, 0.08) 60%, transparent 80%)',
            animation: 'aurora-shift-3 20s ease-in-out infinite alternate',
          }}
        />
      </div>

      <style jsx>{`
        @keyframes aurora-shift-1 {
          0% {
            transform: translate(-50%, 0) scale(1) rotate(0deg);
          }
          50% {
            transform: translate(-45%, 40px) scale(1.1) rotate(6deg);
          }
          100% {
            transform: translate(-55%, -20px) scale(0.95) rotate(-5deg);
          }
        }
        @keyframes aurora-shift-2 {
          0% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(-40px, 30px) scale(1.15);
          }
          100% {
            transform: translate(20px, -40px) scale(0.9);
          }
        }
        @keyframes aurora-shift-3 {
          0% {
            transform: translate(0, 0) scale(0.95);
          }
          50% {
            transform: translate(30px, -20px) scale(1.05);
          }
          100% {
            transform: translate(-20px, 40px) scale(1);
          }
        }
      `}</style>

      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default AuroraBackground;
