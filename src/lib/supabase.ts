import { createClient } from '@supabase/supabase-js';
import {
  AuditLog,
  Client,
  Profile,
  Quote,
  UploadedDocument,
  UserRole,
  Workspace,
  WorkspaceMember,
} from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ==============================================================================
// INITIAL SEED DATA FOR COMMERCIAL INSURANCE BROKERAGES
// ==============================================================================

export const SEED_PROFILES: Profile[] = [
  {
    id: 'user-001',
    name: 'Vikramaditya Sharma',
    email: 'superadmin@quotely.ai',
    phone: '+91 98110 99881',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    created_at: '2024-01-01T10:00:00Z',
  },
  {
    id: 'user-002',
    name: 'Rajesh Singhania',
    email: 'owner@capitalinsurance.co.in',
    phone: '+91 98200 44551',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    created_at: '2024-01-10T10:00:00Z',
  },
  {
    id: 'user-003',
    name: 'Priya Malhotra',
    email: 'priya@capitalinsurance.co.in',
    phone: '+91 98711 23456',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    created_at: '2024-01-15T11:30:00Z',
  },
  {
    id: 'user-004',
    name: 'Arjun Kapoor',
    email: 'arjun.k@capitalinsurance.co.in',
    phone: '+91 99100 87654',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    created_at: '2024-02-01T09:15:00Z',
  },
  {
    id: 'user-005',
    name: 'Sneha Verma',
    email: 'sneha.v@capitalinsurance.co.in',
    phone: '+91 98102 34567',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
    created_at: '2024-02-10T14:20:00Z',
  },
  {
    id: 'user-006',
    name: 'Rohan Gupta (Auditor)',
    email: 'rohan.auditor@capitalinsurance.co.in',
    phone: '+91 97111 65432',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
    created_at: '2024-02-15T16:00:00Z',
  },
];

export const SEED_WORKSPACES: Workspace[] = [
  {
    id: 'ws-capital-01',
    name: 'Capital Insurance Brokers Pvt Ltd',
    slug: 'capital-insurance',
    logo_url: '/logo-shield.svg',
    gst: '07AABC1234F1Z5',
    address: '706, 7th Floor, B-09-ITL-Twin-Tower, Netaji Subhash Place, Ring Road, Pitampura, New Delhi 110034',
    phone: '011-45631850',
    email: 'contact@capitalinsurance.co.in',
    owner_id: 'user-002',
    default_rules: {
      default_discretionary_discount: 10,
      default_brokerage_share: 15,
      auto_recommend_terrorism: false,
      default_eq_zone: 'Zone 2',
      irda_license_no: '236',
      cin_no: 'U74999DL2003PTC119576',
    },
    created_at: '2024-01-10T10:00:00Z',
  },
  {
    id: 'ws-apex-02',
    name: 'Apex Risk Advisors LLP',
    slug: 'apex-risk',
    logo_url: '/logo-shield.svg',
    gst: '27AAACR9981K1Z3',
    address: 'One BKC, 12th Floor, G-Block, Bandra Kurla Complex, Mumbai 400051',
    phone: '022-68994400',
    email: 'underwriting@apexrisk.in',
    owner_id: 'user-002',
    default_rules: {
      default_discretionary_discount: 12.5,
      default_brokerage_share: 17.5,
      auto_recommend_terrorism: true,
      default_eq_zone: 'Zone 3',
      irda_license_no: '488',
      cin_no: 'U66010MH2012PTC234120',
    },
    created_at: '2024-02-01T10:00:00Z',
  },
];

export const SEED_WORKSPACE_MEMBERS: WorkspaceMember[] = [
  {
    workspace_id: 'ws-capital-01',
    user_id: 'user-001',
    role: 'super_admin',
    status: 'active',
    joined_at: '2024-01-10T10:00:00Z',
  },
  {
    workspace_id: 'ws-capital-01',
    user_id: 'user-002',
    role: 'brokerage_owner',
    status: 'active',
    joined_at: '2024-01-10T10:00:00Z',
  },
  {
    workspace_id: 'ws-capital-01',
    user_id: 'user-003',
    role: 'admin',
    status: 'active',
    joined_at: '2024-01-15T11:30:00Z',
  },
  {
    workspace_id: 'ws-capital-01',
    user_id: 'user-004',
    role: 'underwriter',
    status: 'active',
    joined_at: '2024-02-01T09:15:00Z',
  },
  {
    workspace_id: 'ws-capital-01',
    user_id: 'user-005',
    role: 'sales_executive',
    status: 'active',
    joined_at: '2024-02-10T14:20:00Z',
  },
  {
    workspace_id: 'ws-capital-01',
    user_id: 'user-006',
    role: 'viewer',
    status: 'active',
    joined_at: '2024-02-15T16:00:00Z',
  },
];

export const SEED_CLIENTS: Client[] = [
  {
    id: 'client-krishna-01',
    workspace_id: 'ws-capital-01',
    client_name: 'Krishna & Company',
    gst: '07ALMPA9603N1ZS',
    address: 'Khasra No-309/2, Measuring 400 Sq. Yds. Pul Pehladpur, Near Lal Kuan Sunday Bazar, New Delhi - 110044',
    district: 'South East Delhi',
    state: 'Delhi',
    industry: 'FMCG Trading & Warehousing',
    notes: 'Primary stocks of Nestle food products, Bajaj Almond Oil & general cosmetics. Hypothecated to Bank of India. 0 claim ratio for past 3 years.',
    assigned_to: 'user-005',
    created_at: '2024-02-15T10:00:00Z',
    total_quotes: 2,
    total_sum_insured: 50000000,
  },
  {
    id: 'client-shivaji-02',
    workspace_id: 'ws-capital-01',
    client_name: 'Shivaji Agro Industries Pvt Ltd',
    gst: '27AALCS9821R1Z9',
    address: 'Plot A-42, MIDC Industrial Area, Baramati, Dist. Pune - 413133',
    district: 'Pune',
    state: 'Maharashtra',
    industry: 'Agro Processing & Warehousing',
    notes: 'Food grains processing and cold storage godowns. Fully equipped with automatic water sprayers.',
    assigned_to: 'user-004',
    created_at: '2024-02-18T12:00:00Z',
    total_quotes: 1,
    total_sum_insured: 120000000,
  },
  {
    id: 'client-vanguard-03',
    workspace_id: 'ws-capital-01',
    client_name: 'Vanguard Electronics Components India',
    gst: '09AAECV1102Q1Z4',
    address: 'C-18, Sector 62, Electronic City, Noida - 201301',
    district: 'Gautam Buddha Nagar',
    state: 'Uttar Pradesh',
    industry: 'Electronics Assembly & Distribution',
    notes: 'Cleanroom assembly and finished goods distribution warehouse. Hypothecated to HDFC Bank.',
    assigned_to: 'user-005',
    created_at: '2024-02-20T15:30:00Z',
    total_quotes: 1,
    total_sum_insured: 85000000,
  },
];

export const SEED_QUOTES: Quote[] = [
  {
    id: 'quote-krishna-001',
    quote_number: 'QTL-DEL-2026-0042',
    workspace_id: 'ws-capital-01',
    client_id: 'client-krishna-01',
    client_name: 'Krishna & Company',
    client_gst: '07ALMPA9603N1ZS',
    created_by: 'user-004',
    creator_name: 'Arjun Kapoor',
    occupation_code: '4002',
    occupation_description: 'Storage of Category I hazardous Goods (Godowns & Silos) subject to warranty',
    eq_zone: 'Zone 2',
    sum_insured: 5000000,
    sum_insured_breakdown: {
      building: 0,
      plant_machinery: 0,
      furniture_fixtures: 0,
      stocks: 5000000,
      others: 0,
      total: 5000000,
    },
    premium: 30700,
    gst_amount: 5526,
    total_premium: 36226,
    policy_rate: 6.14,
    status: 'approved',
    ai_confidence: 0.94,
    insurer_name: 'THE NEW INDIA ASSURANCE CO. LTD.',
    version: 1,
    created_at: '2026-03-24T11:00:00Z',
    updated_at: '2026-03-24T11:30:00Z',
    calculation_breakdown: {
      occupancy_code: '4002',
      occupancy_description: 'Storage of Category I hazardous Goods (Godowns & Silos)',
      category: 1,
      section: 'VI',
      product_type: 'BSUS',
      eq_zone: 'Zone 2',
      kutcha_construction: false,
      base_flexa_rate: 1.12,
      nia_adjusted_flexa_rate: 0.84,
      feature_discount_percent: -50,
      rate_after_discount: 0.42,
      stfi_opted: true,
      stfi_rate: 0.2625,
      eq_opted: true,
      eq_rate: 0.1875,
      terrorism_opted: false,
      terrorism_rate: 0,
      total_base_rate: 0.87,
      discretionary_discount_percent: 10,
      rate_after_discretionary: 0.783,
      floater_opted: true,
      floater_rate: 0.8613,
      final_policy_rate_per_mille: 6.14,
      total_sum_insured: 5000000,
      net_premium: 30700,
      gst_rate_percent: 18,
      gst_amount: 5526,
      total_premium: 36226,
    },
    ai_analysis: {
      business_summary: 'Trading and storage of food products (Nestle, Bajaj Almond Oil) and cosmetics. Classified under Category I Hazardous Goods godown warranty.',
      keywords: ['food', 'nestle', 'almond oil', 'cosmetics', 'godown', 'storage'],
      occupancy_candidates: [
        {
          code: '4002',
          description: 'Storage of Category I hazardous Goods (Godowns & Silos)',
          confidence: 0.94,
          reason: 'Exact match for packaged non-hazardous food and cosmetic storage under Section VI.',
          loss_cost: 0.95,
          category: 1,
        },
        {
          code: '1011',
          description: 'Showrooms and display centres',
          confidence: 0.65,
          reason: 'Alternative if premises include front-counter retail display.',
          loss_cost: 0.29,
          category: 1,
        },
      ],
      hazard_flags: [
        'Warranty required: No Category II/III hazardous goods, coir waste, or caddies permitted.',
      ],
      missing_fields: [],
      confidence_score: 0.94,
    },
  },
  {
    id: 'quote-shivaji-002',
    quote_number: 'QTL-MH-2026-0043',
    workspace_id: 'ws-capital-01',
    client_id: 'client-shivaji-02',
    client_name: 'Shivaji Agro Industries Pvt Ltd',
    client_gst: '27AALCS9821R1Z9',
    created_by: 'user-004',
    creator_name: 'Arjun Kapoor',
    occupation_code: '2060',
    occupation_description: 'Confectionery Manufacturing Plants / Sweet Meat Manufacturing Plants',
    eq_zone: 'Zone 3',
    sum_insured: 120000000,
    sum_insured_breakdown: {
      building: 40000000,
      plant_machinery: 50000000,
      furniture_fixtures: 5000000,
      stocks: 25000000,
      others: 0,
      total: 120000000,
    },
    premium: 148800,
    gst_amount: 26784,
    total_premium: 175584,
    policy_rate: 1.24,
    status: 'under_review',
    ai_confidence: 0.91,
    insurer_name: 'ICICI LOMBARD GENERAL INSURANCE',
    version: 1,
    created_at: '2026-03-25T14:00:00Z',
    updated_at: '2026-03-25T14:45:00Z',
    calculation_breakdown: {
      occupancy_code: '2060',
      occupancy_description: 'Confectionery Manufacturing Plants',
      category: 3,
      section: 'IV',
      product_type: 'BLUS',
      eq_zone: 'Zone 3',
      kutcha_construction: false,
      base_flexa_rate: 0.98,
      nia_adjusted_flexa_rate: 1.225,
      feature_discount_percent: -30,
      rate_after_discount: 0.8575,
      stfi_opted: true,
      stfi_rate: 0.3125,
      eq_opted: true,
      eq_rate: 0.125,
      terrorism_opted: true,
      terrorism_rate: 0.23,
      total_base_rate: 1.525,
      discretionary_discount_percent: 10,
      rate_after_discretionary: 1.3725,
      floater_opted: false,
      floater_rate: 1.3725,
      final_policy_rate_per_mille: 1.24,
      total_sum_insured: 120000000,
      net_premium: 148800,
      gst_rate_percent: 18,
      gst_amount: 26784,
      total_premium: 175584,
    },
  },
];

export const SEED_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'audit-001',
    workspace_id: 'ws-capital-01',
    user_id: 'user-004',
    user_name: 'Arjun Kapoor',
    user_email: 'arjun.k@capitalinsurance.co.in',
    action: 'quote.created',
    resource_type: 'quote',
    resource_id: 'quote-krishna-001',
    details: { quote_number: 'QTL-DEL-2026-0042', client: 'Krishna & Company' },
    timestamp: '2026-03-24T11:00:00Z',
  },
  {
    id: 'audit-002',
    workspace_id: 'ws-capital-01',
    user_id: 'user-004',
    user_name: 'Arjun Kapoor',
    user_email: 'arjun.k@capitalinsurance.co.in',
    action: 'quote.pdf_downloaded',
    resource_type: 'quote',
    resource_id: 'quote-krishna-001',
    details: { file_name: 'Quote Slip-KRISHNA & COMPANY-Fire Insurance Policy.pdf' },
    timestamp: '2026-03-24T11:32:00Z',
  },
  {
    id: 'audit-003',
    workspace_id: 'ws-capital-01',
    user_id: 'user-002',
    user_name: 'Rajesh Singhania',
    user_email: 'owner@capitalinsurance.co.in',
    action: 'member.invited',
    resource_type: 'member',
    resource_id: 'user-006',
    details: { email: 'rohan.auditor@capitalinsurance.co.in', role: 'viewer' },
    timestamp: '2026-03-25T10:15:00Z',
  },
];

// ==============================================================================
// SCOPED SUPABASE MULTI-TENANT QUERY HELPERS
// Ensures every database query strictly includes a workspace_id filter,
// unless authenticated caller holds the global super_admin role.
// ==============================================================================

export async function fetchScopedQuotes(workspaceId: string, isSuperAdmin = false) {
  let query = supabase.from('quotes').select('*');
  if (!isSuperAdmin) {
    query = query.eq('workspace_id', workspaceId);
  }
  const { data, error } = await query;
  if (error || !data || data.length === 0) {
    return SEED_QUOTES.filter((q) => isSuperAdmin || q.workspace_id === workspaceId);
  }
  return data as Quote[];
}

export async function fetchScopedMembers(workspaceId: string, isSuperAdmin = false) {
  let query = supabase.from('workspace_members').select('*, user:profiles(*)');
  if (!isSuperAdmin) {
    query = query.eq('workspace_id', workspaceId);
  }
  const { data, error } = await query;
  if (error || !data || data.length === 0) {
    return SEED_WORKSPACE_MEMBERS.filter((m) => isSuperAdmin || m.workspace_id === workspaceId);
  }
  return data as WorkspaceMember[];
}

export async function fetchScopedClients(workspaceId: string, isSuperAdmin = false) {
  let query = supabase.from('clients').select('*');
  if (!isSuperAdmin) {
    query = query.eq('workspace_id', workspaceId);
  }
  const { data, error } = await query;
  if (error || !data || data.length === 0) {
    return SEED_CLIENTS.filter((c) => isSuperAdmin || c.workspace_id === workspaceId);
  }
  return data as Client[];
}

export async function fetchScopedAuditLogs(workspaceId: string, isSuperAdmin = false) {
  let query = supabase.from('audit_logs').select('*').order('timestamp', { ascending: false });
  if (!isSuperAdmin) {
    query = query.eq('workspace_id', workspaceId);
  }
  const { data, error } = await query;
  if (error || !data || data.length === 0) {
    return SEED_AUDIT_LOGS.filter((a) => isSuperAdmin || a.workspace_id === workspaceId);
  }
  return data as AuditLog[];
}

