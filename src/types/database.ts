export type UserRole =
  | 'super_admin'
  | 'brokerage_owner'
  | 'admin'
  | 'underwriter'
  | 'sales_executive'
  | 'viewer';

export interface Profile {
  id: string;
  name: string;
  full_name?: string;
  email: string;
  avatar?: string;
  phone?: string;
  super_admin?: boolean;
  is_super_admin?: boolean;
  created_at: string;
}

export interface WorkspaceRules {
  default_discretionary_discount: number;
  default_brokerage_share: number;
  auto_recommend_terrorism: boolean;
  default_eq_zone: string;
  irda_license_no: string;
  cin_no: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  gst: string;
  address: string;
  phone?: string;
  email?: string;
  owner_id: string;
  default_rules: WorkspaceRules;
  created_at: string;
}

export interface WorkspaceMember {
  workspace_id: string;
  user_id: string;
  role: UserRole;
  status: 'active' | 'pending' | 'suspended';
  joined_at: string;
  user?: Profile;
}

export interface Organization {
  id: string;
  name: string;
  created_at: string;
}

export interface OrganizationMember {
  id: string;
  org_id: string;
  user_id: string;
  role: 'admin' | 'underwriter' | 'sales';
  created_at: string;
  user?: Profile;
  organization?: Organization;
}

export interface Client {
  id: string;
  org_id?: string;
  workspace_id: string;
  client_name: string;
  gst: string;
  address: string;
  district: string;
  state: string;
  industry: string;
  notes?: string;
  assigned_to?: string;
  created_at: string;
  total_quotes?: number;
  total_sum_insured?: number;
}

export interface SumInsuredBreakdown {
  building: number;
  plant_machinery: number;
  furniture_fixtures: number;
  stocks: number;
  others: number;
  total: number;
  [key: string]: number | undefined;
}

export interface FeatureDiscountOptions {
  fire_hydrant_sprinkler: boolean; // -10%
  electrical_installations: boolean; // -10%
  storm_water_drainage: boolean; // -10%
  high_security_cctv: boolean; // -10% if yes, +5% if no
  past_claims_ratio: '<30' | '<=70' | '>=30<=70' | '>70<=100' | '>100<=200' | '>200';
  additional_claim_loading: number; // 0 or 100
  basement_used: boolean; // +5%
  waterbody_within_1km: boolean; // +5%
  thickly_populated_no_access: boolean; // +10%
}

export interface CalculationBreakdown {
  occupancy_code: string;
  occupancy_description: string;
  category: number;
  section: string;
  product_type: 'Flexi_BS' | 'Flexi_BL' | 'BSUS' | 'BLUS' | 'MEGA_RISK_SFSP';
  eq_zone: string;
  kutcha_construction: boolean;
  base_flexa_rate: number;
  nia_adjusted_flexa_rate: number;
  feature_discount_percent: number;
  rate_after_discount: number;
  stfi_opted: boolean;
  stfi_rate: number;
  eq_opted: boolean;
  eq_rate: number;
  terrorism_opted: boolean;
  terrorism_rate: number;
  total_base_rate: number;
  discretionary_discount_percent: number;
  rate_after_discretionary: number;
  floater_opted: boolean;
  floater_rate: number;
  final_policy_rate_per_mille: number; // per mille (per 1,000)
  total_sum_insured: number;
  net_premium: number;
  gst_rate_percent: number;
  gst_amount: number;
  total_premium: number;
  claim_excess?: string;
  in_built_covers?: {
    additionsAlterationsINR: number;
    temporaryRemovalOfStocksINR: number;
    startUpExpensesINR: number;
    professionalFeesINR: number;
    debrisRemovalINR: number;
    specificContentsINR: number;
    totalInBuiltProtectionValueINR: number;
  };
  underwriting_framework?: string;
  custom_override_applied?: boolean;
  tariff_compliance?: TariffComplianceResult;
  algorithmic_explainability?: {
    statutory_basis: string;
    applied_rules: string[];
    governance_standard: string;
    input_vector: Record<string, any>;
  };
}

export interface OccupancyCandidate {
  code: string;
  description: string;
  confidence: number;
  reason: string;
  section?: string;
  loss_cost?: number;
  category?: number;
}

export interface AIAnalysisResult {
  business_summary: string;
  keywords: string[];
  product_category?: string | null;
  aift_section?: string | null; // 'Section III' | 'Section IV' | 'Section V' | 'Section VI' | 'Section VII'
  aift_category?: number | null; // 1 | 2 | 3 | 4
  storage_hazard_category?: string | null; // 'Non-Hazardous' | 'Category I' | 'Category II' | 'Category III'
  occupancy_code?: string | null;
  occupancy_description?: string | null;
  occupancy_candidates: OccupancyCandidate[];
  hazard_flags: string[];
  missing_fields: string[];
  confidence_score: number;
  clarification_question?: string | null;
  clarifying_question?: string | null;
  suggested_quick_answers?: string[];
  suggested_discount_percent?: number;
  suggested_loading_percent?: number;
}

// ============================================================================
// COMMERCIAL INSURANCE LINES TAXONOMY
// ============================================================================

export type LOBCategory =
  | 'property'
  | 'motor'
  | 'marine'
  | 'engineering'
  | 'liability'
  | 'benefits'
  | 'specialty';

export type InsuranceLine =
  // Property & Assets
  | 'fire'
  | 'business_interruption'
  | 'burglary'
  | 'iar'
  // Motor & Fleet
  | 'motor_fleet'
  | 'motor_gcv'
  | 'motor_pcv'
  | 'motor_misc'
  // Marine & Logistics
  | 'marine_cargo_inland'
  | 'marine_cargo_ocean'
  | 'marine_open_policy'
  | 'marine_hull'
  // Engineering & Projects
  | 'car'
  | 'ear'
  | 'mb'
  | 'eei'
  | 'bpp'
  // Corporate Liability & Casualty
  | 'cgl'
  | 'public_liability'
  | 'product_liability'
  | 'pi'
  | 'do'
  | 'cyber'
  | 'crime_fidelity'
  | 'crime'
  | 'liability_package'
  // Employee Benefits & Group Life
  | 'ghi'
  | 'gpa'
  | 'wc'
  | 'gtli'
  | 'keyman'
  // Financial & Specialty Lines
  | 'surety_bond'
  | 'trade_credit'
  | 'environmental_liability'
  | 'specialty_package';

// ============================================================================
// LINE-SPECIFIC RISK DETAILS (POLYMORPHIC SCHEMA)
// ============================================================================

export interface MotorFleetRiskDetails {
  fleet_mode: 'single' | 'fleet';
  fleet_size: number;
  primary_zone: 'Zone A' | 'Zone B' | 'Zone C';
  vehicle_categories: Array<'gcv' | 'pcv' | 'misc_construction' | 'private_commercial'>;

  // Single vehicle parameters (if single or representative vehicle)
  reg_number?: string;
  make_model?: string;
  manufacturing_year?: number;
  vehicle_class?: 'gcv' | 'pcv' | 'misc_construction' | 'private_commercial';
  sub_category?: string;
  gvw_kg?: number;
  seating_capacity?: number;
  cubic_capacity_cc?: number;
  ex_showroom_price?: number;
  depreciation_percent?: number;

  // IDV Breakdown
  idv_vehicle?: number;
  idv_trailer?: number;
  idv_electrical?: number;
  idv_non_electrical?: number;
  idv_cng_lpg?: number;
  total_idv?: number;

  // Rating Adjustments
  ncb_percentage: number; // 0, 20, 25, 35, 45, 50
  past_claims_ratio_3yr?: number;
  fleet_discount_percent?: number;
  adverse_loading_percent?: number;

  // Endorsements Suite
  selected_imt_endorsements: string[]; // e.g. ['IMT 23', 'IMT 28', 'Zero Dep', 'Engine Protect', 'Consumables', 'RTI', 'RSA']
  cpa_opted?: boolean;
  paid_driver_count?: number;
  cleaner_conductor_count?: number;

  // Schedule summary (if uploaded via CSV/Excel)
  roster_summary?: {
    total_vehicles: number;
    valid_vehicles: number;
    invalid_vehicles: number;
    total_idv: number;
    total_od_premium: number;
    total_tp_premium: number;
    total_net_premium: number;
  };
}

export interface MarineCargoRiskDetails {
  policy_type: 'single_voyage' | 'open_policy' | 'atpo';
  transit_type: 'inland' | 'ocean';
  origin: string;
  destination: string;
  via_transshipment?: string;
  carrier_mode?: 'road' | 'rail' | 'sea' | 'air';
  carrier_name?: string;
  carrier_lr_bl_awb?: string;
  is_certified_common_carrier?: boolean;
  commodity_hazard_class: 1 | 2 | 3 | 4;
  commodity_description: string;
  packaging_type?: string;
  invoice_number?: string;
  invoice_date?: string;
  invoice_value: number;
  incoterm?: 'CIF' | 'FOB' | 'CFR' | 'EXW';
  transit_clause: 'ITC_A' | 'ITC_B' | 'ITC_C' | 'ICC_A' | 'ICC_B' | 'ICC_C';
  ocean_freight_inr?: number;
  port_charges_inr?: number;
  customs_duty_opted?: boolean;
  customs_duty_rate_percent?: number;
  war_and_strikes_opted?: boolean;
  mop_policy_number?: string;
  cd_deposit_balance?: number;
  declaration_summary?: {
    total_shipments: number;
    valid_shipments: number;
    invalid_shipments: number;
    total_consignment_value: number;
    total_insurable_value: number;
    total_estimated_premium: number;
  };
}

export interface EmployeeBenefitsRiskDetails {
  corporate_name?: string;
  total_lives: number;
  employee_count: number;
  dependent_count: number;
  family_structure: '1+0' | '1+3' | '1+5' | string;
  age_bands: {
    age_0_25: number;
    age_26_35: number;
    age_36_45: number;
    age_46_55: number;
    age_56_65: number;
    age_66_75: number;
    age_76_plus: number;
  };
  total_monthly_wage_roll: number;
  ghi_base_sum_insured: number;
  room_rent_capping: 'standard_1_percent' | 'single_private_room' | 'no_capping';
  maternity_opted: boolean;
  maternity_day_1_waiver: boolean;
  ped_waiver_day_1: boolean;
  corporate_buffer_amount: number;
  tpa_name?: string;
  gtli_opted: boolean;
  gtli_sum_insured_per_member: number;
  gtli_hazard_class: 1 | 2 | 3;
  gtli_free_cover_limit: number;
  gpa_opted: boolean;
  gpa_sum_insured_per_life: number;
  gpa_hazard_class: 1 | 2 | 3;
  gpa_ttd_opted: boolean;
  gpa_medical_extension_opted: boolean;
  wc_opted: boolean;
  wc_trade_hazard_rate_percent: number;
  wc_medical_extension_opted: boolean;
  census_summary?: {
    total_records: number;
    valid_records: number;
    invalid_records: number;
  };
}

export interface EngineeringRiskDetails {
  sub_line: 'car' | 'ear' | 'mb' | 'eei' | 'bpp' | 'package';
  project_name?: string;
  contractor_name?: string;
  principal_name?: string;
  site_location?: string;
  contract_period_months?: number;
  testing_period_months?: number;
  dlp_maintenance_months?: number;
  eq_zone?: 1 | 2 | 3 | 4;
  stfi_opted?: boolean;
  civil_works_value?: number;
  plant_machinery_value?: number;
  tpl_limit?: number;
  surrounding_property_limit?: number;
  machinery_items?: Array<{
    machine_id: string;
    tariff_group: 1 | 2 | 3 | 4;
    current_replacement_value: number;
    description?: string;
  }>;
  eei_details?: {
    section1_hardware_crv: number;
    section2_data_media_si?: number;
    section3_icow_months?: 3 | 6 | 12;
    section3_icow_si?: number;
    is_portable_laptop?: boolean;
  };
  bpp_details?: {
    vessel_type: 'fire_tube' | 'water_tube';
    heating_surface_sqm: number;
    operating_pressure_bar: number;
    replacement_value: number;
    tpl_limit?: number;
  };
  far_summary?: {
    total_assets: number;
    building_crv: number;
    plant_machinery_crv: number;
    furniture_crv: number;
    stocks_crv: number;
    total_crv: number;
    underinsurance_ratio: number;
  };
}

export interface CorporateLiabilityRiskDetails {
  sub_line: 'cgl' | 'pi' | 'do' | 'cyber' | 'crime' | 'liability_package';
  corporate_name: string;
  annual_turnover: number;

  // CGL Section
  cgl_opted: boolean;
  cgl_hazard_category?: 1 | 2 | 3 | 4;
  cgl_aoa_limit?: number;
  cgl_aoy_limit?: number;
  cgl_ratio?: '1:1' | '1:2' | '1:3' | '1:4';
  cgl_territory?: 'india_only' | 'worldwide_ex_usa' | 'worldwide_inc_usa';

  // Professional Indemnity Section
  pi_opted: boolean;
  pi_profession?: 'tech_software' | 'consultants_ca' | 'insurance_broker' | 'medical_doctor';
  pi_annual_fee_income?: number;
  pi_limit_of_indemnity?: number;
  pi_prior_clean_years?: number;
  pi_retroactive_date?: string;

  // Directors & Officers Section
  do_opted: boolean;
  do_limit_of_indemnity?: number;
  do_entity_listing_status?: 'private_unlisted' | 'public_listed_india' | 'public_listed_us_adr';
  do_debt_to_equity_ratio?: number;

  // Cyber Risk Section
  cyber_opted: boolean;
  cyber_limit_of_indemnity?: number;
  cyber_base_premium?: number;
  cyber_posture_answers?: {
    has_mfa_everywhere: boolean;
    has_edr_endpoints: boolean;
    has_airgapped_backups: boolean;
    has_annual_vapt: boolean;
    has_247_soc: boolean;
    has_employee_training: boolean;
  };
  cyber_score?: number;
  cyber_posture_tier?: 'mature' | 'adequate' | 'deficient' | 'uninsurable';

  // Commercial Crime & Fidelity Section
  crime_opted: boolean;
  crime_employees_with_funds_access?: number;
  crime_limit_of_liability?: number;
  crime_has_dual_authorization_above_50k?: boolean;

  // Package Aggregation
  selected_lines_count?: number;
}

export interface SpecialtyFinancialRiskDetails {
  sub_line: 'surety_bond' | 'trade_credit' | 'burglary' | 'specialty_package';
  contractor_or_applicant: string;
  pan_number: string;
  principal_amount: number;

  // Surety Bond Section
  surety_opted?: boolean;
  surety_bond_type?: 'bid_bond' | 'performance_bond' | 'advance_payment' | 'retention_money';
  surety_bond_value?: number;
  surety_tenure_months?: number;
  surety_contractor_grade?: 'AAA' | 'AA' | 'A' | 'BBB' | 'BB';
  surety_contractor_net_worth?: number;
  surety_required_collateral_margin?: number;
  surety_credit_limit_breach?: boolean;
  surety_net_premium?: number;

  // Trade Credit Section
  trade_credit_opted?: boolean;
  trade_credit_insurable_turnover?: number;
  trade_credit_average_days?: 30 | 60 | 90 | 120;
  trade_credit_top_10_share_percent?: number;
  trade_credit_requested_indemnity_percent?: number;
  trade_credit_clamped_indemnity_percent?: number;
  trade_credit_concentration_loading_percent?: number;
  trade_credit_net_premium?: number;

  // Burglary Section
  burglary_opted?: boolean;
  burglary_property_sum_insured?: number;
  burglary_first_loss_percentage?: 25 | 50 | 75 | 100;
  burglary_has_cctv?: boolean;
  burglary_has_guards?: boolean;
  burglary_has_alarm?: boolean;
  burglary_net_premium?: number;

  // Aggregation
  selected_lines_count?: number;
}

// ============================================================================
// STANDARD CALCULATION BREAKDOWN CONTRACT (LAYER 1 <-> LAYER 2)
// ============================================================================

export interface AlgorithmicExplainabilityStep {
  step: string;
  description: string;
  value: number | string;
}

export interface StandardQuoteBreakdown {
  lob_category: LOBCategory;
  insurance_line: InsuranceLine;
  sum_insured: number;
  base_rate_per_mille?: number;
  net_premium: number;
  gst_rate_percent: number; // 18
  gst_amount: number;
  total_premium: number;
  statutory_clauses: string[];
  line_specific_breakdown: Record<string, any>;
  algorithmic_explainability: AlgorithmicExplainabilityStep[];
}

// ============================================================================
// AUXILIARY TABLE MODELS
// ============================================================================

export interface FleetVehicle {
  id: string;
  quote_id: string;
  workspace_id: string;
  org_id?: string;
  reg_number: string;
  chassis_number?: string;
  engine_number?: string;
  make_model_variant: string;
  manufacturing_year: number;
  registration_date?: string;
  vehicle_class: 'gcv' | 'pcv' | 'misc_construction' | 'private_commercial';
  sub_category: string;
  gvw_kg?: number;
  seating_capacity?: number;
  cubic_capacity_cc?: number;
  rto_zone: 'Zone A' | 'Zone B' | 'Zone C';
  idv_vehicle: number;
  idv_trailer?: number;
  idv_electrical_accessories?: number;
  idv_non_electrical_accessories?: number;
  idv_cng_lpg_kit?: number;
  total_idv: number;
  imt_endorsements: string[];
  ncb_percentage: number;
  basic_od_premium: number;
  add_on_premium: number;
  ncb_discount_amount: number;
  net_od_premium: number;
  statutory_tp_premium: number;
  tp_add_on_premium: number;
  net_tp_premium: number;
  total_net_premium: number;
  gst_amount: number;
  total_gross_premium: number;
  created_at: string;
}

export interface MarineDeclaration {
  id: string;
  quote_id: string;
  workspace_id: string;
  org_id?: string;
  declaration_number: string;
  declaration_date: string;
  dispatch_date: string;
  invoice_number: string;
  carrier_consignment_note: string;
  carrier_name?: string;
  origin: string;
  destination: string;
  transit_mode: 'road' | 'rail' | 'sea' | 'air';
  consignment_value: number;
  rate_per_mille: number;
  premium_debited: number;
  cd_balance_after: number;
  certificate_number?: string;
  status: 'declared' | 'certificate_issued' | 'insufficient_balance' | 'cancelled';
  created_at: string;
}

export interface PolicyCensusRecord {
  id: string;
  quote_id: string;
  workspace_id: string;
  org_id?: string;
  employee_id: string;
  name: string;
  age: number;
  date_of_birth?: string;
  gender: 'M' | 'F' | 'O';
  relationship: 'self' | 'spouse' | 'child' | 'parent';
  monthly_salary?: number;
  ghi_sum_insured?: number;
  gtli_sum_insured?: number;
  gpa_hazard_class?: 1 | 2 | 3;
  statutory_death_liability?: number;
  statutory_ptd_liability?: number;
  requires_medical_underwriting?: boolean;
  is_valid: boolean;
  created_at: string;
}

export interface Quote {
  id: string;
  quote_number: string;
  org_id?: string;
  workspace_id: string;
  client_id: string;
  client_name: string;
  client_gst: string;
  created_by: string;
  creator_name?: string;

  // LOB Categorization
  lob_category?: LOBCategory;
  insurance_line?: InsuranceLine;

  // Property/Fire fields (relaxed to optional for multi-line support)
  occupation_code?: string;
  occupation_description?: string;
  eq_zone?: string;

  // Line-agnostic Risk Details
  risk_details?: MotorFleetRiskDetails | MarineCargoRiskDetails | EmployeeBenefitsRiskDetails | EngineeringRiskDetails | CorporateLiabilityRiskDetails | SpecialtyFinancialRiskDetails | Record<string, any>;

  // Financials
  sum_insured: number;
  sum_insured_breakdown: SumInsuredBreakdown | Record<string, any>;
  premium: number;
  gst_amount: number;
  total_premium: number;
  policy_rate: number;
  status: 'draft' | 'under_review' | 'approved' | 'issued' | 'rejected';

  // AI & Calculation Ledgers
  ai_confidence: number;
  ai_analysis?: AIAnalysisResult;
  calculation_breakdown: CalculationBreakdown | StandardQuoteBreakdown | Record<string, any>;
  insurer_name?: string;
  pdf_url?: string;
  created_at: string;
  updated_at: string;
  expiry_date?: string;
  version: number;

  // Policy Lifecycle & Co-Insurance
  policy_number?: string;
  policy_start_date?: string;
  policy_end_date?: string;
  tpa_name?: string;
  co_insurance?: Array<{
    insurer_name: string;
    share_percentage: number;
    is_lead_insurer: boolean;
  }>;
}

export interface UploadedDocument {
  id: string;
  workspace_id: string;
  quote_id?: string;
  file_name: string;
  file_url: string;
  document_type: 'pdf' | 'excel' | 'docx' | 'image' | 'whatsapp' | 'email';
  file_size: number;
  ocr_status: 'pending' | 'processing' | 'completed' | 'failed';
  extracted_data?: Record<string, any>;
  created_at: string;
}

export interface AuditLog {
  id: string;
  workspace_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  ip_address?: string;
  action:
    | 'quote.created'
    | 'quote.updated'
    | 'quote.occupancy_overridden'
    | 'quote.pdf_downloaded'
    | 'quote.status_changed'
    | 'proposal.uploaded'
    | 'client.created'
    | 'client.updated'
    | 'member.invited'
    | 'member.role_changed'
    | 'member.removed'
    | 'workspace.updated'
    | string;
  resource_type: 'quote' | 'client' | 'document' | 'member' | 'workspace' | string;
  resource_id: string;
  details?: Record<string, any>;
  timestamp: string;
}

export interface Occupancy {
  code: string;
  section: string;
  description: string;
  category: number;
  category_tag: string;
  flexa_rate: number;
  stfi_rate: number;
  eq_rate: number;
  terrorism_rate: number;
  loss_cost: number;
  keywords: string[];
  source_doc: string;
}

export interface CustomTariffOverride {
  id?: string;
  workspace_id?: string;
  occupancy_code: string;
  custom_flexa_rate?: number;
  custom_loss_cost?: number;
  custom_discretionary_discount?: number;
  custom_category?: number;
  notes?: string;
  updated_at?: string;
}

export interface TariffComplianceResult {
  is_compliant: boolean;
  status: 'COMPLIANT' | 'WARNING' | 'NON_COMPLIANT';
  occupancy_code: string;
  statutory_base_rate: number;
  effective_rate: number;
  variance_percent: number;
  statutory_loss_cost: number;
  regulatory_clause: string;
  message: string;
}

export interface TariffClause {
  id: string;
  title: string;
  category: string;
  applicable_to: string;
  description: string;
  source_doc: string;
}

