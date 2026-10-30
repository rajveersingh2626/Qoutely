# QOUTELY PRODUCTION HARDENING & AUTONOMOUS DEPLOYMENT
## Architecture Context & System Invariants

### 1. Business & Underwriting Objectives
- **Modern IRDAI Underwriting Engine**: Fully migrate away from de-notified AIFT 2001 assumptions to current regulatory products:
  - Total Value at Risk <= ₹5 Cr: **Bharat Sookshma Udyam Suraksha (BSUS)** with standard excess of ₹5,000.
  - Total Value at Risk > ₹5 Cr and <= ₹50 Cr: **Bharat Laghu Udyam Suraksha (BLUS)** with 5% claim excess (min ₹10,000).
  - Total Value at Risk > ₹50 Cr: Standard mega-risk Fire and Special Perils.
  - **BLUS 15% Underinsurance Waiver Engine**: Loss within 15% of declared sum insured triggers waiver without condition of average. Over 15% calculates proportionate penalty & broker warning advisory.
  - **Automated In-Built Covers**: Additions/Alterations (15% SI excl stocks), Temporary Removal of Stocks (up to 10%), Start-Up Expenses (up to ₹5 Lakhs), Professional Fees (up to 5%), Debris Removal (up to 2%), Specific Contents covers.
  - **Valuation Integrity**: Reinstatement Value on structures & machinery (including plinths & foundations); Landed Cost for raw materials, Input Cost for WIP, Contract/Mfg Price for finished goods.
- **Intelligent Risk & Occupancy Wizard**: Multi-step glass modal replacing static dropdowns:
  - Step 1: Operational Classification (Manufacturing, Storage & Warehousing, Commercial Office, Retail Trade, Flatted Factory Complex).
  - Step 2: Hazard & Fire-Load Assessment (chemicals, solvents, paints, plastics, flammables -> auto fire-load adjustment).
  - Step 3: NCR Municipal & Environmental Compliance (Okhla DPCC Consent to Operate & FAR limits; Bawana DFS Fire NOC validity & hazardous waste permits).
  - Step 4: Asset Valuation Breakdown (Buildings, Plant & Machinery, separate inventory cost for Stocks).

### 2. Authentication, Session Lock & Super Admin RBAC
- **Dinesh Uncle Session Invariance**:
  - Email: `dinesh@capitalbrokers.in` / User ID: `664e9b3c-1f0b-4fcb-ae7f-1fbb156bbc3f` (and legacy mock ID `10000000-0000-0000-0000-000000000002`).
  - Zero session invalidation. Active refresh/access tokens must never be invalidated or dropped.
  - Tier Lock Override: Hardcode permanent lock into **Enterprise Tier** with `unlimited_quota: true`, `rate_limit_bypass: true`, and zero reminder caps.
- **Super Admin RBAC**:
  - Restrict system-level configuration, broker admin, and audit views strictly to IDs/emails whitelisted in `SUPER_ADMIN_IDS`.
  - Remove all mock 1-click bypass buttons and test auth switches across the frontend.
  - Standard OTP and password authentication with HttpOnly, SameSite=Strict/Lax, Secure cookies.

### 3. Dual Gemini API Failover Proxy Engine
- Gateway: `/api/ai/proxy`
  - Primary Key: `process.env.GEMINI_API_KEY_PRIMARY` (Free tier)
  - Fallback Key: `process.env.GEMINI_API_KEY_FALLBACK` (Paid tier)
  - Failover Circuit: Catch HTTP 429 / quota exceeded, re-dispatch exact payload to fallback key transparently with cooldown timer on primary.
  - Zero UI disruption.

### 4. Tiered Plan Engine, Usage Limits & Omnichannel Reminders
- Starter Tier (₹899): 500 reminders max.
- Pro Tier (₹1,999): 3,000 reminders max.
- Enterprise Tier (₹4,999+): Unlimited reminders.
- Dinesh Uncle VIP exception: Unconditional bypass.
- Omnichannel renewal engine: Expiry notices at 60, 30, 15, and 3 days across WhatsApp, SMS, Email in English and Hinglish.

### 5. High-Contrast Glassmorphic UX & Mobile Viewport
- Layered frosted glass aesthetic:
  `background: rgba(18, 24, 38, 0.85); backdrop-filter: blur(20px) saturate(190%); border: 1px solid rgba(255, 255, 255, 0.16); box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.55); color: #f4f4f5;`
- Executive operational summary first screen: active quotation volume, pending renewals, recovered commission leakages.
- Min 48x48px touch targets, mobile bottom sheets, safe-area-inset padding.

### 6. Security Hardening & Regulatory Governance
- AES-256 data encryption at rest, TLS in transit.
- Immutable audit trail in `audit_logs` (user_id, ip_address, action, resource_id, timestamp).
- Algorithmic explainability logging for DPDP Act & MeitY AI Governance.

### 7. Tariff Rate Customization & IIB / AIFT Mirroring Engine
- **Strict Compliance & IIB Parity**:
  - The computational engine strictly mirrors the formulas from `UPdated Calculator-07.02.2024.xlsx` (Sheet1 lookups, Category factor modifiers: Cat 1 -25%, Cat 2 -10%, Cat 3 +25%, Cat 4 +160%).
  - STFI logic (Section III: 0.15, IV/V/VII: 0.25) adjusted by category factor.
  - EQ zone rates (Section III vs IV/V/VII across Zones 1 to 4) adjusted by category factor.
  - Terrorism rate (0.15 for Section III, 0.23 for other sections; opt-out capability for Flexi_BS/BL).
  - Kutcha construction surcharge (+4.00 on adjusted flexa).
  - Risk feature discount/loadings (capped at -50% unless adverse claim loading applies).
  - Discretionary discount and floater rate (+10%).
- **Dynamic Per-User/Per-Workspace Customization**:
  - Enable brokers to configure custom base flexa rates, loss costs, or discount ceilings on a per-occupancy level for their workspace.
  - Changes immediately reflect in real-time on their quotation dashboard, quote creation flows, and analytics.
  - Built-in regulatory guardrails: automatically compare customized rates against statutory AIFT / IIB baseline rates and display compliance variance badges (e.g., "Compliant with IIB Minimum Loss Cost" vs "Below Recommended Loss Cost - Regulatory Justification Required").

### 8. Intelligent Dual-Loading UX System
- **Type 1 (Video-based loader)**: Ultra-sleek, short video loop (~1-2s) representing rapid data fetch & AI crunching.
- **Type 2 (Standard animated loader)**: Lightweight, high-tech animated SVG/pulse loader.
- **Weighted Distribution Engine**:
  - Weighted probabilistic selection constraint: Type 1 (Video) is significantly more prominent (e.g., ~80% weight) vs Type 2 (Standard animated ~20% weight).
  - Deterministic per-action / session seeding to avoid visual flickering during identical loading steps.
  - Integrated into global route transitions, data queries, and AI generation states.

### 9. Stark White Glassmorphic Frontend & Video Hero Flow
- **Aesthetic Direction**: Stark, clean, ultra-modern white theme replacing legacy dark tones on the public marketing landing page.
- **Apple-vibe Glass-morphism Navigation Bar**: Translucent green glass (`backdrop-blur-md`, subtle emerald tint, crisp hairline borders), housing the new transparent logo (`qoutely_logo_remove_bg.png`).

### 10. Performance Optimization & Pure UI Animations (Zero Video Tags)
- **Problem**: Prior implementation embedded massive (>40MB) MP4 video chassis directly into landing page and loader components, degrading initial page load, Core Web Vitals, and mobile responsiveness.
- **Solution**:
  - Completely purged all `<video>` tags from the codebase.
  - Implemented `QuotelyLoadingAnimation.tsx` + `Loader.module.css`: Hardware-accelerated CSS keyframes and SVG orbital motion paths replicating the exact timing: dark green 'Q' logo with 3 bouncing dots below it; winged money character flying in from top-right, orbiting 360° around the 'Q', landing in the center with a pop/bounce before fading out smoothly. Added `prefers-reduced-motion` accessible fallbacks.
  - Implemented `HeroIntro.tsx` + `HeroIntro.module.css`: Refactored to a balanced 2-column layout matching reference video frame 0 with the headline "Elevate Your Brokerage" on the left and the winged money character floating prominently on the right with an ambient emerald glow.
  - Implemented `ScrollFlowGuide.tsx` + `ScrollFlowGuide.module.css`: Purely displays the winged character gliding and flowing downwards along an illuminated curved guide stream following scroll position, removing hypothetical mock cards per user directive ("in the website flow video only the gliding and the flow that the character and the character must be seen, everything except that is hypothetical").
  - Implemented `InteractiveCalculator.tsx`: Lightweight, code-split client component directly executing the Capital Brokers / AIFT 2001 calculation formulas with instant reactivity.

### 11. Milestone 14: Fluid Scroll & Character Flight Flow (Video 2 Parity)
- **Objective**: Eliminate rigid, fragmented scroll disconnect from Video 1 and achieve the continuous, scroll-linked character flight flow from Video 2.
- **Root Cause & Structural Evolution**:
  - Unify the Hero section and Scroll Flow runway into a single persistent corridor (`<HeroScrollFlowDirector />`).
  - Character starts in the Hero showcase position at `scroll = 0%`.
  - As scroll begins, character detaches and travels along a smooth S-curve down the screen, guiding the eye across Stage 1 (IIB tariffs) and Stage 2 (Statutory shield & quotes) to Stage 3 ('Q' dock).
- **Puppet Rigging & Wing Articulation**:
  - Decompose `winged_money_character.png` into 3 layered assets: `money_body.png`, `wing_left.png`, `wing_right.png`.
  - Sinusoidal 3D wing flapping via hardware-accelerated transforms, reacting dynamically to scroll velocity (`useVelocity`).
  - Realistic aerodynamic banking (-18° dive, +16° swoop, 0° landing).
- **Preservation Mandate**:
  - Retain 100% of verified statutory underwriting content, calculator, pricing, FAQs, and navigation. Zero code or test regressions.
### 12. Milestone 15: Continuous Scroll-Linked Character Flight to Rate Verifier Section
- **Problem Statement**:
  - The previous 380vh locked block (`HeroScrollFlowDirector.tsx`) trapped the character inside a rigid, artificial runway with synthetic intermediate cards, interrupting the natural flow of the website.
- **Architectural & Aesthetic Target**:
  - Liberate the character from the locked runway block; allow normal, unconstrained website scrolling.
  - The character starts inside the Hero section ("Elevate Your Brokerage") on the top-right.
  - As the user scrolls down, the character physically tilts/bends forward into flight posture (-22° roll, forward pitch), accelerating wing flap frequency, and glides down across the viewport.
  - The destination is the "Interactive Tools & Rate Verifier" section (`#calculator`), where text and content are right-aligned. The character fluidly lands and occupies the empty space on the left side of that section.
  - Character size remains proportional and consistent; zero heavy video tags; 100% native 3D GPU transforms.
  - Full preservation of statutory tariffs, underwriting rules, and database schemas.
- **Implemented Architecture & Verified Journey**:
  - **Component Structure**:
    - `AnimatedWingedCharacter.tsx` & `.module.css`: 3-layer rigged sprite puppet (`money_body.png`, `wing_left.png`, `wing_right.png`) with rhythmic 3D wing flapping, scroll-velocity sensitivity, aerodynamic banking, and forward pitch.
    - `HeroSection.tsx` & `.module.css`: Clean, white 2-column Hero section with Left headline & CTAs, and Right transparent anchor zone for initial character placement.
    - `ScrollLinkedCharacterFlight.tsx` & `.module.css`: Dynamic flight corridor controller with `position: sticky; top: 42vh;` viewport rig, hardware-accelerated 3D transforms (`rotate`, `rotateX`), and calibrated sub-pixel waypoints:
      - State A: Hero top-right (+19vw, -7vh, 0° tilt, idle hover bobbing).
      - State B: Flight transition (-5vw, +6vh, 20° forward tilt, 20° 3D pitch, rapid velocity flapping).
      - State C: Landing dock in Rate Verifier left pedestal (-30vw, -11vh, 0° upright alignment, resume idle hover).
    - `#calculator` (Rate Verifier): Asymmetric 2-column layout (Left: glowing pedestal bay with "Autonomous Tariff Copilot • Active" badge; Right: right-aligned header, right-aligned tabs, and `<InteractiveCalculator />` showcase card).
    - Post-Landing Flow: When scrolling past the corridor (>1200px into "How Quotely Works"), the character stays docked inside `#calculator` and naturally scrolls away with the section, keeping subsequent sections 100% clean and unobstructed.
  - **Mechanical Verification**:
    - `npm run typecheck` (`tsc --noEmit`): 0 errors.
    - `verify-all.ts`: All 6 statutory suites passed (100% test pass rate).
    - `npm run build`: 59/59 routes compiled with code 0.
    - Real browser DevTools verification: Verified visually at scroll 0px, 260px, 620px, and 1500px forwards and backwards.
