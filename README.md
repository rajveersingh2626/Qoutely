# QUOTELY — AI Commercial Insurance Operating System for Brokers

> **"AI Underwriting. Human Confidence."**

Quotely is a production-ready, multi-tenant B2B SaaS platform engineered specifically for Indian commercial insurance brokerage firms. It ingests complex RFQs, proposals, tender slips, WhatsApp threads, and Excel spreadsheets, classifies occupancies using the IIB (Insurance Information Bureau) Schedule 3 taxonomy, and executes 100% deterministic underwriting premium calculations in compliance with the All India Fire Tariff (AIFT) and General Insurance Council regulations.

---

## 🏛️ Multi-Tenant Architecture

Quotely is built from the ground up for multi-brokerage tenancy:
- **Isolated Workspaces**: Every brokerage firm (e.g. *Capital Insurance Brokers Pvt Ltd*) operates in an isolated workspace with custom GST defaults, default brokerage retention, branding, and logos.
- **Role-Based Access Control (RBAC)**:
  - **Super Admin**: Platform oversight across all brokerages.
  - **Brokerage Owner**: Firm management, team invitations, workspace settings, quote deletion.
  - **Admin**: Client management, quote generation, member invitations.
  - **Underwriter**: Quote drafting, risk classification override, proposal OCR analysis.
  - **Sales Executive**: Proposal submission and assigned client management.
  - **Viewer**: Read-only quote and audit log auditing.
- **Enterprise Row Level Security (RLS)**: PostgreSQL schemas enforce strict tenant boundaries (`workspace_id`), audited in `src/lib/schema.sql`.

---

## 🚀 Key Features & The 16 Production Pages

| # | Route | Module | Purpose |
|---|---|---|---|
| 1 | `/login` | **Authentication** | Email/Password login, workspace remember, invitation-based onboarding |
| 2 | `/workspaces/new` | **Workspace Creation** | Multi-step brokerage onboarding with GST validation and branding |
| 3 | `/workspaces` | **Workspace Switcher** | Instant switching between brokerages for group brokers |
| 4 | `/dashboard` | **Enterprise Dashboard** | KPI metric cards, monthly quote velocity, occupancy distribution charts, live activity timeline |
| 5 | `/quotes/new` | **3-Column Underwriting Studio** | Left: Risk details & SI breakdown; Center: AI classification & hazard flags; Right: Real-time tariff calculation engine & PDF export |
| 6 | `/upload` | **Proposal Ingestion** | Drag-and-drop OCR pipeline (PDF, DOCX, XLSX, Images), timeline parser, and split-screen verification |
| 7 | `/ai-analysis` | **AI Underwriting Studio** | JSON-structured reasoning, keyword extraction, occupancy confidence rings, hazard checks, and missing info queries |
| 8 | `/quotes/[id]` | **Quote Slip Preview** | High-fidelity broker quote slip (includes Krishna & Company Fire Policy benchmark) with printable PDF generation |
| 9 | `/quotes` | **Quote Ledger** | Filterable quote repository with status badges, versioning, duplication, and instant quote drawer |
| 10 | `/clients` | **Client CRM** | Complete broker client list with active policies, GST details, risk profiles, and assigned broker reps |
| 11 | `/clients/[id]` | **Client Profile 360** | Comprehensive history, claims ratio, linked quotes, uploaded tenders, and broker notes |
| 12 | `/occupancies` | **Occupancy Explorer** | Searchable directory of 600+ IIB Schedule 3 codes with loss costs, hazard ratings, and category filters |
| 13 | `/earthquake-zones` | **Earthquake Zone Explorer** | India seismic zone locator (Zones II - V), district search, and statutory EQ tariff loadings |
| 14 | `/knowledge-base` | **Regulatory Knowledge Base** | Full text search across AIFT 2001, IIB Loss Cost Schedule 3, Earthquake Zoning, and Standard Endorsements |
| 15 | `/team` | **User Management** | Member roster, role assignment, invite modal, and real-time status |
| 16 | `/settings` | **Brokerage Settings** | Firm profile, GST defaults, standard deductible configurations, and audit logging |
| + | `/audit-logs` | **Enterprise Audit Trail** | Immutable log tracking every quote creation, occupancy override, and PDF download |

---

## 📐 Deterministic Underwriting & Tariff Rules Engine

Quotely adheres strictly to the rule: **AI extracts and classifies; deterministic algorithms calculate.**

1. **AIFT 2001 & IIB Schedule 3**:
   - Ingests raw loss costs directly from IIB Schedule 3 for Building, Plant & Machinery, and Stock.
   - Applies the 4-tier risk classification modifier (Category 1: -10%, Category 2: -5%, Category 3: +5%, Category 4: +10%).
2. **Standard Perils**:
   - **Flexa Rate**: Base rate adjusted by risk category.
   - **STFI (Storm, Tempest, Flood, Inundation)**: Scaled by sum insured tiers (e.g. ₹0.22/mille for standard industrial occupancies).
   - **Earthquake (EQ)**: Strict lookup matching district to Zone II (0.10‰), Zone III (0.25‰), Zone IV (0.50‰), or Zone V (1.00‰).
   - **Terrorism (pool scale)**: Tiered rates based on total sum insured (₹0.07‰ up to 500 Cr, etc.).
3. **Discounts & Loadings**:
   - Past Claims Experience discount (up to 15%)
   - Fire Protection System discounts (Hydrant/Sprinkler compliance: up to 10%)
   - Deductible voluntary loading/discounts
   - Kutcha construction loadings
   - Statutory GST (18%) and Stamp Duty

### Krishna & Company Fire Insurance Benchmark
The system contains a pre-configured, audited quote slip benchmark matching `Quote Slip-KRISHNA & COMPANY-Fire Insurance Policy.pdf`:
- **Client**: Krishna & Company
- **Occupancy**: Code 1023 (Engineering Workshop / Metalworking)
- **Total Sum Insured**: ₹5,38,00,000 (₹5.38 Cr)
- **Breakdown**:
  - Building (Superstructure & Plinth): ₹1,50,00,000
  - Plant & Machinery: ₹2,60,00,000
  - Stocks & Raw Materials: ₹1,28,00,000
- **Earthquake Zone**: Zone IV (Delhi / NCR)

---

## 💻 Tech Stack

- **Framework**: Next.js 15 (App Router, Server & Client Components)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v3 with custom design tokens matching the **Quotely Design Bible** (Emerald primary `#059669`, Slate surfaces `#F8FAFC`, dark mode `#090D16`)
- **Animations**: Framer Motion for subtle micro-interactions, layout transitions, and confidence rings
- **Icons**: Lucide React
- **Database / Auth**: Supabase PostgreSQL with RLS policies and auth providers
- **PDF Generation**: Browser-native canvas and HTML-to-PDF rendering with high-resolution vector styles

---

## 🛠️ Local Development

### 1. Prerequisites
- Node.js 18+ (tested on Node v22.14.0)
- npm 9+

### 2. Installation
```bash
# Clone the repository
git clone <repo-url>
cd Qoutely

# Install dependencies
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Database Setup (Supabase)
Execute the SQL script in [src/lib/schema.sql](file:///c:/Users/jasra/OneDrive/Desktop/Qoutely/src/lib/schema.sql) in your Supabase SQL Editor to provision:
- Multi-tenant workspaces & member roles
- Client CRM and quotes tables
- Audit logs and storage buckets
- Row Level Security (RLS) policies

---

## 🛡️ License & Compliance
Compliant with Insurance Regulatory and Development Authority of India (IRDAI) guidelines and General Insurance Council tariff directives.
