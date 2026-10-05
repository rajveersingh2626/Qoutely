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
