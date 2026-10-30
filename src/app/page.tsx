'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MascotPreloader } from '@/components/scrollytelling/MascotPreloader';
import { PreloaderOverlay } from '@/components/scrollytelling/PreloaderOverlay';
import { ScrollytellingCanvas, SNAP_POINTS } from '@/components/scrollytelling/ScrollytellingCanvas';
import { Navbar } from '@/components/scrollytelling/Navbar';
import { ScrollytellingOverlay } from '@/components/scrollytelling/ScrollytellingOverlay';
import { BookDemoModal } from '@/components/scrollytelling/BookDemoModal';
import { ScrollytellingAssets } from '@/components/scrollytelling/types';
import { SmoothScrollProvider } from '@/components/providers/SmoothScrollProvider';

export default function ScrollytellingLandingPage() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Asset preloading state
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [assets, setAssets] = useState<ScrollytellingAssets | null>(null);

  // Interactive Demo Modal
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }

    let mounted = true;

    MascotPreloader.preloadAll((progress) => {
      if (mounted) {
        setLoadProgress(progress);
      }
    })
      .then((loadedAssets) => {
        if (mounted) {
          setAssets(loadedAssets);
          // Allow preloader bar to complete 100% visually before unmounting
          setTimeout(() => {
            if (mounted) setIsLoading(false);
          }, 350);
        }
      })
      .catch((err) => {
        console.error('Failed to preload mascot assets:', err);
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleBookDemo = () => {
    setDemoModalOpen(true);
  };

  const handleExploreWorkflows = () => {
    handleNavigate(1);
  };

  const handleNavigate = (sectionIndex: number) => {
    if (typeof window !== 'undefined' && (window as unknown as { __navigateToSection?: (idx: number) => void }).__navigateToSection) {
      (window as unknown as { __navigateToSection: (idx: number) => void }).__navigateToSection(sectionIndex);
      return;
    }
    if (!containerRef.current) return;
    const maxScroll = containerRef.current.scrollHeight - window.innerHeight;
    const targetRatio = SNAP_POINTS[sectionIndex] ?? 0;
    const targetTop = maxScroll * targetRatio;

    window.scrollTo({
      top: targetTop,
      behavior: 'smooth',
    });
  };

  return (
    <SmoothScrollProvider>
      <div 
        ref={containerRef}
        className="relative w-full h-[400vh] bg-[#FBF9F5] text-[#121316] selection:bg-[#00C853]/20 selection:text-[#0F5132]"
      >
        {/* Preloader Overlay (z-[100]) */}
        <PreloaderOverlay progress={loadProgress} isLoading={isLoading} />

        {/* Global Frosted Glass Navigation Bar (z-[80] - Highest stacking layer) */}
        <Navbar 
          onBookDemo={handleBookDemo} 
          onNavigate={handleNavigate}
        />

        {/* Sticky Full-Viewport Stage */}
        <div className="sticky top-0 h-screen w-full overflow-hidden bg-[#FBF9F5]">
          {/* Full-Screen Hardware-Accelerated Canvas Engine */}
          {assets && (
            <ScrollytellingCanvas
              assets={assets}
              containerRef={containerRef}
            />
          )}

          {/* Sticky Section Overlays with Unorthodox Dual-Sided Layout & Pricing */}
          <ScrollytellingOverlay
            onBookDemo={handleBookDemo}
            onExploreWorkflows={handleExploreWorkflows}
          />
        </div>

        {/* Interactive Qualification & Demo Booking Modal */}
        <BookDemoModal
          isOpen={demoModalOpen}
          onClose={() => setDemoModalOpen(false)}
        />
      </div>
    </SmoothScrollProvider>
  );
}
