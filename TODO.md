# Autonomous Implementation Tasks: True Section-by-Section Scrollytelling & Full Security Hardening

- [x] Task 1.1: [Scroll Engine] Remove Lenis and eliminate virtual-scroll momentum fighting
- [x] Task 1.2: [Section Snap] Build deterministic section-by-section wheel/touch/keyboard snap controller with GSAP easing and resting frame alignment
- [x] Task 1.3: [Section HUD] Configure sleek floating 4-dot section progress HUD on landing page with synchronized section anchors
- [x] Task 2.1: [Auth Security] Remove hardcoded backdoor login in `src/app/api/auth/login/route.ts`
- [x] Task 2.2: [Middleware Security] Remove unsigned cookie bypass in `src/middleware.ts`
- [x] Task 2.3: [Multi-Tenancy Security] Secure `/api/tariffs` against unauthenticated leak and cross-tenant mutation
- [x] Task 2.4: [Tenancy Injection] Enforce authenticated `workspace_id` in `/api/extract/route.ts`
- [x] Task 2.5: [API Security] Enforce authentication on public AI chat endpoint in `src/app/api/ai/chat/route.ts`
- [x] Task 2.6: [Credential Security] Remove hardcoded base64 Gemini key from `src/lib/ai.ts` and fallback credentials from `src/lib/supabase.ts` and `src/middleware.ts`
- [x] Task 2.7: [Cookie Auth] Add cookie token extraction to `src/lib/api-auth.ts`
- [x] Task 3.1: [Dead Code Cleanup] Remove dead endpoint `src/app/api/extract-proposal/` and dead libraries `ai-engine.ts`/`analytics.ts`
- [x] Task 3.2: [Dead Components & Unused Deps] Remove legacy landing components and uninstall unused npm packages (`lenis`, `canvas-confetti`, `clsx`, `tailwind-merge`)
- [x] Task 4.1: [Mechanical Verification] Verify `npm run typecheck` (0 errors), `scripts/verify-all.ts` (100% pass), and `npm run build` (58/58 routes compiled)
- [x] Task 4.2: [Live Browser Verification] Verify section-by-section scrolling and exact resting frames via DevTools
- [x] Task 4.3: [Ship & Deploy] Commit and deploy all changes to `origin/main`
