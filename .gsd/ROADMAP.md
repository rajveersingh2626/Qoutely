# QOUTELY PRODUCTION HARDENING ROADMAP

## ✅ COMPLETED MILESTONES (1–11)

## Milestone 1: Authentication Hardening, Super Admin Whitelist & Dinesh VIP Session Lock ✅
## Milestone 2: Dual Gemini API Failover Proxy Engine (`/api/ai/proxy`) ✅
## Milestone 3: Modern Underwriting Rules Engine (BSUS/BLUS) & Carrier Directory ✅
## Milestone 4: Interactive Risk & Occupancy Wizard ✅
## Milestone 5: Tiered Plan Engine & Omnichannel Hinglish Renewal Engine ✅
## Milestone 6: High-Contrast Glassmorphic System & Executive Summary UX ✅
## Milestone 7: Regulatory Governance, Audit Trails & Verification ✅
## Milestone 8: Dynamic Occupancy Tariff Customization Engine & IIB Formula Verification ✅
## Milestone 9: Intelligent Dual-Loading UX System ✅
## Milestone 10: Stark White Glassmorphic Frontend & Video Hero Flow ✅
## Milestone 11: Backend UI Facelift & Operational Polish ✅

---

## 🔄 PHASE 2: ALL-LINES COMMERCIAL BROKER EXPANSION (Milestones 12–22)

### Milestone 12: Commercial Motor & Fleet Insurance Module
**Scope**: Primary high-volume commercial line across Indian brokerages.
- DB: Add `lob_category` and expanded `insurance_line` enum values.
- Studio: `/quotes/new?line=motor_fleet` supporting GCV, PCV, and Misc Digger/Crane categories.
- Engine: Vehicle depreciation, zone rating (A/B/C), IMT add-ons (IMT 23, Zero Dep, Consumables, Engine Protect).
- Fleet Ingestion: Bulk Excel vehicle roster parsing (Reg No, Chassis, Engine, GVW, Seating Capacity).

### Milestone 13: Marine Cargo & Logistics Module
**Scope**: Inland (ITC A/B/C) and Ocean (ICC A/B/C) transit protection.
- Studio: `/quotes/new?line=marine_cargo` with Single Voyage vs. Open Cover (MOP/ATPO).
- Engine: Commodity risk loading, Incoterms (CIF, FOB, CFR), monthly declaration workflows.

### Milestone 14: Employee Benefits — Group Health (GHI) & Group Term Life (GTLI)
**Scope**: Corporate medical and life protection.
- Studio: `/quotes/new?line=ghi` with dynamic Census file upload.
- Engine: Demographic age-banding, family definition (1+3 / 1+5), room rent sub-limits, maternity, corporate buffers.

### Milestone 15: Employee Benefits — Group Personal Accident (GPA) & Workmen's Compensation (WC)
**Scope**: 24x7 accident and statutory labor law compliance.
- Engine: EC Act formula calculator based on monthly wage roll and age factor.
- GPA risk classification (white collar, blue collar, hazardous).

### Milestone 16: Engineering Insurance — CAR / EAR
**Scope**: Construction and erection all-risk policies.
- Project lifecycle timeline builder, civil vs. plant split, AOG earthquake/STFI peril loadings.

### Milestone 17: Engineering Insurance — MB, EEI & Boiler (BPP)
**Scope**: Operational asset breakdown and electronic hardware.
- Fixed asset schedule uploader, machine group rates (Group I–IV), Indian Boilers Act certification tracking.

### Milestone 18: Liability — Commercial General Liability (CGL) & Public/Product Liability
**Scope**: Bodily injury and property damage third-party exposures.
- Turnover-based pricing, AOA/AOY limit ratios, Public Liability Insurance Act statutory mandates.

### Milestone 19: Liability — Professional Indemnity (PI) & Directors & Officers (D&O)
**Scope**: Errors & omissions and corporate executive protection.
- Claims-made retroactive date management, Side A/B/C cover structures.

### Milestone 20: Cyber Liability & Commercial Crime/Fidelity
**Scope**: Digital assets, extortion, DPDPA 2023 compliance, and internal employee theft.
- Cyber security posture scoring matrix (MFA, EDR, air-gapped backups).

### Milestone 21: Financial Lines — Surety Bonds & Trade Credit
**Scope**: Contract performance guarantee replacing bank guarantees (GFR) and accounts receivable default protection.
- Contractor balance sheet scoring and buyer limit schedules.

### Milestone 22: Business Interruption & Burglary
**Scope**: Revenue loss and theft add-ons integrated seamlessly across Property & Plant portfolios.

---

## 🚀 PHASE 3: PLATFORM INTELLIGENCE (Milestones 21+)

### Milestone 21: Universal Quote Comparison Engine
- Broker can float multi-line RFQ to multiple insurers from Qoutely
- Side-by-side comparison view across insurer quotations

### Milestone 22: AI Claims Assistance Module
- Claim registration flow with document checklist per insurance line
- AI-powered claim narrative generator for broker submission
- Claim status tracker linked to policies

### Milestone 23: Regulatory Intelligence Engine
- Auto-pull IRDAI circulars, master circulars, product regulation updates
- Push alerts to brokers for lines they actively quote
- Compliance calendar: broker PI renewal, IRDAI COR renewal, VAPT audit reminders
