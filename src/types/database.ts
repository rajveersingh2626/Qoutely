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
  product_type: 'Flexi_BS' | 'Flexi_BL' | 'BSUS' | 'BLUS';
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
}

export interface OccupancyCandidate {
  code: string;
  description: string;
  confidence: number;
  reason: string;
  loss_cost?: number;
  category?: number;
}

export interface AIAnalysisResult {
  business_summary: string;
  keywords: string[];
  occupancy_candidates: OccupancyCandidate[];
  hazard_flags: string[];
  missing_fields: string[];
  confidence_score: number;
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
  occupation_code: string;
  occupation_description: string;
  eq_zone: string;
  sum_insured: number;
  sum_insured_breakdown: SumInsuredBreakdown;
  premium: number;
  gst_amount: number;
  total_premium: number;
  policy_rate: number;
  status: 'draft' | 'under_review' | 'approved' | 'issued' | 'rejected';
  ai_confidence: number;
  ai_analysis?: AIAnalysisResult;
  calculation_breakdown: CalculationBreakdown;
  insurer_name?: string;
  pdf_url?: string;
  created_at: string;
  updated_at: string;
  version: number;
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
    | 'workspace.updated';
  resource_type: 'quote' | 'client' | 'document' | 'member' | 'workspace';
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

export interface TariffClause {
  id: string;
  title: string;
  category: string;
  applicable_to: string;
  description: string;
  source_doc: string;
}
