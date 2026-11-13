# E2E Test Infra: Qoutely Commercial Insurance Operating System

## Test Philosophy
- **Requirement-Driven & Opaque-Box**: Tests are derived strictly from user requirements, statutory regulations (AIMT, IRDAI, TAC, EC Act 1923, GFR 2017), and authoritative specifications, independent of internal implementation code.
- **Deterministic Verification**: Zero tolerance for flaky tests, stochastic assertions, or LLM-dependent tests. All underwriting math, tariff lookups, schedule parsers, and validation schemas must yield 100% reproducible results.
- **Progressive Testability**: Verification mechanisms use the simplest available interface (pure TypeScript engine function calls, schema validations, and mock data ingestion), enabling rapid feedback during development.
- **4-Tier Test Design Methodology**:
  - **Tier 1 (Feature Coverage)**: >=5 test cases per feature verifying happy-path behavior, default handling, and standard rating across all 34 features.
  - **Tier 2 (Boundary & Corner Cases)**: >=5 test cases per feature testing boundary values (e.g. 0-age, >5 yr age, max GVW, wage cap ₹15,000, 1:1 vs 1:4 AOA/AOY ratios, credit limits, invalid inputs).
  - **Tier 3 (Cross-Feature Combinations)**: Pairwise coverage testing interaction between modules (e.g. Motor IDV + OD + TP + NCB + IMT add-ons; Census ingestion + GHI age-banding + WC wage capping; Engineering CAR civil/plant split + testing periods + AOG peril zones).
  - **Tier 4 (Real-World Application Scenarios)**: Realistic end-to-end commercial insurance portfolios (e.g. National Logistics 200-truck fleet, Multimodal Pharma export shipment, 1,500-employee IT conglomerate benefits package, ₹500 Cr Greenfield Metro Rail project, Global SaaS Enterprise CGL/Cyber/D&O liability package, National Highway Infrastructure GFR Surety bond portfolio).

---

## Feature Inventory & Test Mapping (All 34 Features)

| # | Feature | Source (Requirement) | Tier 1 (Count) | Tier 2 (Count) | Tier 3 (Pairwise) | Tier 4 (Scenario) |
|---|---------|----------------------|:--------------:|:--------------:|:-----------------:|:-----------------:|
| 1 | Core Multi-Line Database Schema & Types | PROJECT.md § Architecture Layer 1 | 5 | 5 | ✓ | S1, S5 |
| 2 | Motor Vehicle IDV Depreciation Engine | AIMT GR.8 Statutory Table | 5 | 5 | ✓ | S1, S7 |
| 3 | Motor Base Own Damage (OD) Rating | AIMT Sections 4 & 5 | 5 | 5 | ✓ | S1, S7 |
| 4 | Motor Fleet Discount & NCB Ladder | AIMT GR.27 (0% to 50%) | 5 | 5 | ✓ | S1, S7 |
| 5 | Motor Statutory Third Party (TP) Tariff | IRDAI Gazetted TP Tariff Schedules | 5 | 5 | ✓ | S1, S7 |
| 6 | Commercial IMT Add-on Suite | Market Endorsements (IMT 23, Zero Dep, etc.) | 5 | 5 | ✓ | S1, S7 |
| 7 | Bulk Fleet Vehicle Roster Ingestion | BulkFleetUploader vehicle schedule | 5 | 5 | ✓ | S1, S7 |
| 8 | Commercial Motor & Fleet Studio UI Model | MotorFleetStudio props & contract | 5 | 5 | ✓ | S1, S7 |
| 9 | Marine Inland Transit (ITC A/B/C) Rating | TAC Inland Cargo Tariff & Clauses | 5 | 5 | ✓ | S2, S8 |
| 10 | Marine Ocean Cargo (ICC A/B/C) & Incoterms | Institute Cargo Clauses (LMA/IUA) | 5 | 5 | ✓ | S2, S8 |
| 11 | Marine Open Policy (MOP) & ATPO Drawdown | Marine Insurance Act 1963 | 5 | 5 | ✓ | S2, S8 |
| 12 | Marine Cargo Studio UI & Declaration Flow | MarineCargoStudio props & contract | 5 | 5 | ✓ | S2, S8 |
| 13 | GHI Actuarial Demographic Age-Band Matrix | GIC Corporate Health Underwriting | 5 | 5 | ✓ | S3, S9 |
| 14 | GHI Benefit Customizer & Loadings | IRDAI Group Health Guidelines | 5 | 5 | ✓ | S3, S9 |
| 15 | Group Term Life (GTLI) Mortality Engine | IALM 2012-14 Benchmark Table | 5 | 5 | ✓ | S3, S9 |
| 16 | Group Personal Accident (GPA) Engine | TAC GPA Tariff Schedule | 5 | 5 | ✓ | S3, S9 |
| 17 | Statutory Workmen's Compensation (WC) Engine | EC Act 1923 Sec 4 & Sch IV ($Wage \times Factor$) | 5 | 5 | ✓ | S3, S9 |
| 18 | Bulk Employee Census Spreadsheet Ingestion | EmployeeCensusUploader parsing | 5 | 5 | ✓ | S3, S9 |
| 19 | Employee Benefits Studio UI Model | BenefitsStudio props & contract | 5 | 5 | ✓ | S3, S9 |
| 20 | CAR / EAR Project Lifecycle Engine | TAC Engineering Tariff (CAR/EAR) | 5 | 5 | ✓ | S4, S10 |
| 21 | Machinery Breakdown (MB) Engine | TAC MB Tariff Groups I-IV | 5 | 5 | ✓ | S4, S10 |
| 22 | Electronic Equipment Insurance (EEI) Engine | TAC EEI Sections 1-3 | 5 | 5 | ✓ | S4, S10 |
| 23 | Boiler & Pressure Plant (BPP) Engine | Indian Boilers Act 1923 | 5 | 5 | ✓ | S4, S10 |
| 24 | Fixed Asset Register (FAR) Tabular Parser | FixedAssetRegisterUploader parsing | 5 | 5 | ✓ | S4, S10 |
| 25 | Engineering Studio UI Model | EngineeringStudio props & contract | 5 | 5 | ✓ | S4, S10 |
| 26 | CGL Turnover & AOA:AOY Limit Ratio Engine | Commercial Liability Rating Guidelines | 5 | 5 | ✓ | S5, S11 |
| 27 | Professional Indemnity (PI / E&O) Engine | IRDAI Broker Regs 2018 | 5 | 5 | ✓ | S5, S11 |
| 28 | Directors & Officers (D&O) Engine | Corporate Governance Underwriting | 5 | 5 | ✓ | S5, S11 |
| 29 | Deterministic Cyber Posture Scoring Matrix | 100-pt Cyber Matrix (MFA, EDR, etc.) | 5 | 5 | ✓ | S5, S11 |
30: | 30 | Commercial Crime & Fidelity Engine | Fidelity Guarantee Tariff Practice | 5 | 5 | ✓ | S5, S11 |
31: | 31 | Corporate Liability Studio UI Model | LiabilityStudio props & contract | 5 | 5 | ✓ | S5, S11 |
32: | 32 | Surety Insurance Bond Engine | GFR 2017 Rule 170/171 & IRDAI Guidelines | 5 | 5 | ✓ | S6, S12 |
33: | 33 | Trade Credit Insurance (TCI) Engine | IRDAI Trade Credit Regulations | 5 | 5 | ✓ | S6, S12 |
34: | 34 | Financial & Specialty Studio UI Model | SpecialtyStudio props & contract | 5 | 5 | ✓ | S6, S12 |
| **Total** | **34 Features** | | **170** | **170** | **34** | **17 Scenarios** |

---

## Test Architecture

### Directory Layout
```
tests/e2e/
├── harness.ts                     # Assertion library, test runner framework, reporter
├── tier1_feature_coverage.test.ts # Tier 1: 170 tests (5 tests x 34 features)
├── tier2_boundary_corner.test.ts  # Tier 2: 170 tests (5 tests x 34 features)
├── tier3_cross_feature.test.ts    # Tier 3: 34 pairwise cross-feature tests
├── tier4_real_world.test.ts       # Tier 4: 17 real-world commercial insurance application portfolios
└── run_all_tests.ts               # Standalone runner executing all suites with summary & exit code 0
```

### Test Runner Invocation
- Standalone command: `npx tsx tests/e2e/run_all_tests.ts`
- Pass/Fail Semantics: Exits with code `0` if 100% of tests pass. Exits with code `1` if any test fails.

### Test Case Format
Each test uses a typed definition:
```typescript
export interface TestCase {
  id: string;
  featureId: number;
  featureName: string;
  tier: 1 | 2 | 3 | 4;
  description: string;
  fn: () => void | Promise<void>;
}
```

---

## Real-World Application Scenarios (Tier 4)

| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| S1 | 150-Vehicle Inter-State Logistics Commercial Fleet Portfolio | F1, F2, F3, F4, F5, F6, F7, F8 | High |
| S2 | Global Multimodal Pharma Export (Air + Sea + Inland) with Incoterms & Drawdown | F1, F9, F10, F11, F12 | High |
| S3 | 2,500-Employee IT Services Conglomerate Benefits Package (GHI + GTLI + GPA + WC) | F1, F13, F14, F15, F16, F17, F18, F19 | Very High |
| S4 | Greenfield Industrial Petrochemical Refinery Project (EAR + MB + EEI + BPP + FAR) | F1, F20, F21, F22, F23, F24, F25 | Very High |
| S5 | Global SaaS Unicorn Comprehensive Corporate Liability Package (CGL + Cyber + D&O + Crime) | F1, F26, F27, F28, F29, F30, F31 | Very High |
| S6 | National Highway Infrastructure EPC Contractor GFR Surety & Trade Credit Package | F1, F32, F33, F34 | High |
| S7 | Construction Dump Truck & Crane Special Vehicle Fleet Placement | F2, F3, F5, F6, F7 | Medium |
| S8 | Domestic FMCG Distribution Network Annual Turnover Policy (ATPO) with 12 Declarations | F9, F11, F12 | Medium |
| S9 | Manufacturing Plant Hazardous Labor Force Workmen's Comp & GPA Census | F16, F17, F18 | Medium |
| S10 | Textile Spinning Mill Machinery Breakdown & Boiler Plant Renewal | F21, F23, F24 | Medium |
| S11 | Healthcare Diagnostic Chain Professional Indemnity & Cyber Data Protection Package | F27, F29, F31 | Medium |
| S12 | Cross-Border Solar Inverter Importer Trade Credit & Customs Marine Cover | F10, F33, F34 | Medium |
| S13 | Multi-Tenant Commercial Property & Fleet Combined Placement | F1, F2, F3, F5, F8 | Medium |
| S14 | Heavy Engineering Factory Full Insurance Audit & Package Conversion | F20, F21, F22, F23, F26 | High |
| S15 | FinTech Startup Financial Crime, Cyber Posture & D&O Package | F28, F29, F30 | Medium |
| S16 | Renewable Energy Wind Farm CAR & MB Multi-Year Project | F20, F21 | Medium |
| S17 | Steel Rolling Mill Complete Commercial Program (Fleet, Marine, Benefits, Engineering, Liability, Surety) | All Lines (F1–F34) | Extreme |

---

## Coverage Thresholds & Acceptance Criteria
- Tier 1: Exactly 170 test cases (5 per feature across 34 features).
- Tier 2: Exactly 170 test cases (5 boundary/corner cases per feature across 34 features).
- Tier 3: 34 cross-feature interaction test cases.
- Tier 4: 17 application-level portfolio scenarios.
- **Total Test Cases**: 391 test cases.
- **Acceptance Criterion**: 100% passing rate with exit code 0.
