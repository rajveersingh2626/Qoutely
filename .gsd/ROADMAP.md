# QOUTELY PRODUCTION HARDENING ROADMAP

## Milestone 1: Authentication Hardening, Super Admin Whitelist & Dinesh VIP Session Lock
- Hardcode Dinesh Uncle permanent Enterprise plan override (`unlimited_quota: true`, `rate_limit_bypass: true`).
- Restrict super admin access strictly to `SUPER_ADMIN_IDS` whitelist.
- Purge mock single-click login buttons from `Header.tsx`, `login/page.tsx`, and `admin/page.tsx`.
- Enforce cookie security (HttpOnly, Secure, SameSite).

## Milestone 2: Dual Gemini API Failover Proxy Engine (`/api/ai/proxy`)
- Configure primary and fallback Gemini API keys.
- Build circuit-breaker proxy gateway catching HTTP 429 quota exhaustion and failover to fallback key with cooldown timer.
- Wire AI modules (OCR, IDP, Hinglish renewal generators, quote analysis) through this resilient gateway.

## Milestone 3: Modern Underwriting Rules Engine (BSUS/BLUS) & Carrier Directory
- Implement IRDAI commercial fire products with dynamic routing (<= ₹5 Cr BSUS with ₹5,000 excess; ₹5 Cr - ₹50 Cr BLUS with 5% excess min ₹10,000; > ₹50 Cr mega-risk).
- Implement BLUS 15% Underinsurance Waiver Engine with proportionate penalty calculation and broker warning advisories.
- Implement automated in-built covers (Additions 15%, Temporary removal 10%, Startup expenses ₹5L, Professional fees 5%, Debris 2%).
- Implement Carrier Master Directory and Broker Professional Indemnity (PI) 90/60/30-day expiry tracker.

## Milestone 4: Interactive Risk & Occupancy Wizard
- Build Step-by-Step Glass Modal Wizard replacing static occupancy dropdowns:
  - Step 1: Operational Classification
  - Step 2: Hazard & Fire-Load Assessment
  - Step 3: NCR Municipal & Environmental Compliance (Okhla DPCC & FAR; Bawana DFS Fire NOC & hazardous waste)
  - Step 4: Itemized Asset Valuation Breakdown (Reinstatement for Buildings & Plant/Machinery; inventory cost for Stocks)

## Milestone 5: Tiered Plan Engine & Omnichannel Hinglish Renewal Engine
- Subscription middleware enforcing Starter (500), Pro (3,000), Enterprise (Unlimited) quotas with Dinesh VIP bypass.
- Automated omnichannel renewal engine scheduling notices at 60, 30, 15, and 3 days with English and Hinglish templates across WhatsApp, SMS, and Email.

## Milestone 6: High-Contrast Glassmorphic System & Executive Summary UX
- Implement high-contrast layered frosted glass CSS design tokens.
- Add Executive Operational Summary first screen on dashboard (active quotation volume, pending renewals, recovered commission leakages).
- Implement mobile-first responsiveness (48x48px touch targets, mobile bottom sheets, safe-area-inset padding).

## Milestone 7: Regulatory Governance, Audit Trails & Verification
- Immutable audit trail logger adhering to DPDP Act.
- Algorithmic explainability metadata for calculated quotes.
- Run typecheck, custom unit/integration tests, and viewport tests for full verification.
