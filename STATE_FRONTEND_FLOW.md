# STATE_FRONTEND_FLOW.md - Qoutely Scrollytelling Architecture & Execution State

**Last Updated**: October 21, 2026
**Current Lifecycle Phase**: Phase 5 (Ship & Mechanically Verified)
**Target Objective**: Resolve sequence lag, preloader desynchronization, runaway scroll, awkward resting frames, layout voids, and glassmorphic UI elevation.

---

## 1. Verified Architecture & Implementation Summary

### A. Sequence Lag & Preloader Pipeline (Hardware-Accelerated HTML5 Canvas)
- **Controlled Concurrency Preloader (`MascotPreloader.ts`)**:
  - Replaced unthrottled 215-request flooding with an 8-worker bounded concurrency pool.
  - Preloads all 215 frames into an in-memory `HTMLImageElement[]` array before unlocking user scroll.
  - Automatically invokes `img.decode()` on each frame to pre-decode bitmaps into GPU memory.
  - Caches assets in memory for 0ms subsequent loads.
- **Synchronized Glass Preloader (`PreloaderOverlay.tsx`)**:
  - Eliminated Framer Motion animation cancellations.
  - Direct hardware-accelerated CSS `style={{ width: `${progress}%` }}` inside a visible frosted glass track (`h-2 rounded-full border border-[#121316]/10 shadow-inner`).
  - Added glowing emerald leading head and authentic brand mark (`/qoutely_logo.png`).
  - 100% synchronized with the percentage text counter.
- **Decoupled 60/120 FPS Canvas Engine (`ScrollytellingCanvas.tsx`)**:
  - Renders image sequence onto hardware-accelerated 2D `<canvas>` using `ctx.drawImage()`.
  - Zero React `useState` updates during active scroll scrubbing. Direct DOM style updates for section opacity and transforms eliminate component re-renders completely.
  - Intelligent RAF loop skips redundant redraws when the frame has not changed.

### B. Lenis Integration & Section-to-Section Magnetic Snapping
- **Lenis Smooth Scroll Engine (`SmoothScrollProvider.tsx`)**:
  - Integrated `lenis` with GSAP ScrollTrigger ticker synchronization (`gsap.ticker.add((time) => lenis.raf(time * 1000))`).
  - Smooth wheel scrolling with duration `1.2s` and exponential ease.
- **Magnetic Milestone Snapping**:
  - Configured ScrollTrigger snapping to exact milestones: `[0, 0.33333, 0.66666, 1.0]`.
  - Configured `inertia: false` to eliminate free-fall momentum overshoot, locking smoothly onto the adjacent milestone.

### C. Safe Resting Anchor Frames
- **Section 0 (Hero - 0% Snap)**: Frame 1 (Index 0) - Upright, wings naturally poised, eyes looking straight forward.
- **Section 1 (Workflows - 33.33% Snap)**: Frame 70 (Index 69) - Upright, level wings (`w=414, h=275`), centered in right corridor.
- **Section 2 (Carrier Matching - 66.66% Snap)**: Frame 149 (Index 148) - Upright, balanced wings (`w=417, h=305`), centered in left corridor.
- **Section 3 (Pricing & Brand Landing - 100% Snap)**: Frame 215 (Index 214) - Upright, wings poised (`w=419, h=401`), centered over green 'Q' mark.
- **Settle Resolver**: Piecewise progress mapping anchors the mascot to safe resting keyframes whenever scroll settles.

### D. Z-Index and Logo Overlap Resolution
- Fixed navigation bar at `z-[80]` with `pointer-events-auto`, positioned outside sticky stage containers.
- Content, canvas, and overlays sit at `z-10` and `z-20`, passing cleanly *underneath* the frosted glass navbar with `backdrop-filter: blur(16px)`.
- Brand logo [`qoutely_logo.png`](file:///c:/Users/jasra/OneDrive/Desktop/Qoutely/public/qoutely_logo.png) integrated cleanly on the left inside a frosted glass badge.

### E. Unorthodox Dual-Sided Layout & Pricing Integration
- **Section 1 (Hero)**: Left flank (Headline, CTAs, trust pills, and Executive Telemetry HUD: ₹420 Cr+ Placed SI, 99.4% Loss-Run Triage, 14 min Turnaround) | Right flank (Unobstructed flying character).
- **Section 2 (Workflows & Loss Runs)**: Left flank (Deterministic Claims Triage & SOV Normalization specs) | Center spine (Gliding character) | Right flank (ACORD 125 & Loss Run Ingestion Terminal).
- **Section 3 (Carrier Matching)**: Left corridor (Gliding character) | Right area (Frosted Glass Carrier Appetite Matrix: Tata AIG 98%, ICICI Lombard 95%, New India 92% + submission copy & CTA).
- **Section 4 (Pricing & Brand Landing)**:
  - Top: Institutional Pricing Header.
  - Center Spine: Mascot docked over illuminated brand 'Q' watermark, completely unobstructed.
  - Left Flank: **Starter Tier** (₹549/month: 1 Seat, 500 Quotes & Reminders, Standard AI).
  - Right Flank: **Professional Tier** (₹1,499/month: Unlimited Users, BLUS/BSUS Tariff Calculator, Corporate Payout Reconciler).
  - Bottom: Institutional Trust row (AES-256 Cloud Encryption, IRDAI Tariff Compliant, Tenant-Isolated Database).

---

## 2. Verification Status & Audit Hardening
- [x] `npm run typecheck`: 0 errors.
- [x] `npx tsx scripts/verify-all.ts`: 100% pass rate across all 6 statutory suites.
- [x] Browser DevTools live validation at 0%, 33.3%, 66.6%, and 100% scroll milestones.
- [x] Zero regressions across auth (Dinesh Uncle VIP), statutory tariffs, and proxy endpoints.

### Post-Audit Hardening (All Findings Resolved):
1. **Public AI Proxy Auth Gate**: Enforced `getAuthenticatedUser(req)` in `src/app/api/ai/proxy/route.ts` to prevent unauthorized usage.
2. **Earthquake Zone 5 Normalization**: Mapped `'Zone 5'`, `'Zone V'`, `'5'`, `'V'` to Tariff Zone 1 in `src/lib/calculator.ts` so high-hazard seismic zones receive full statutory premium rates.
3. **Rate Limiter Memory Growth**: Added automatic pruning of expired entries in `src/lib/rate-limiter.ts` when map exceeds 500 records.
4. **PDF Generator Default Rules Safe Chaining**: Added optional chaining on `workspace?.default_rules` in `src/lib/pdf-generator.ts` to eliminate null pointer exceptions.
5. **Subscription Pricing Synchronized**: Updated `TIER_DEFINITIONS` in `src/lib/subscription.ts` to Starter: ₹549/mo, Professional: ₹1,499/mo matching landing page offerings.
6. **RAG Search Memoization**: Implemented `PRE_TOKENIZED_OCCUPANCIES` in `src/lib/rag.ts` for instant token-matching with zero per-request tokenization overhead.
7. **Single Source of Truth Classification**: Refactored `src/app/ai-analysis/page.tsx` fallback to use `searchOccupanciesRAG`, retiring duplicate scoring paths.
8. **Dead Dependency Pruning**: Removed `@studio-freight/lenis` from `package.json` in favor of official `lenis`.
