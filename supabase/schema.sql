-- ==============================================================================
-- QUOTELY COMPLETE SUPABASE DATABASE SETUP SCRIPT
-- Run this script in your Supabase Dashboard: SQL Editor -> New Query -> Run
-- This creates all tables, enables Row Level Security (RLS), and seeds initial data.
-- ==============================================================================

-- 1. Create Enums
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'super_admin',
    'brokerage_owner',
    'admin',
    'underwriter',
    'sales_executive',
    'viewer'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Create Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  avatar TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Workspaces Table (Brokerage Firms)
CREATE TABLE IF NOT EXISTS public.workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  gst TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  owner_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  default_rules JSONB DEFAULT '{
    "default_discretionary_discount": 10,
    "default_brokerage_share": 15,
    "auto_recommend_terrorism": false,
    "default_eq_zone": "Zone 2",
    "irda_license_no": "236",
    "cin_no": "U74999DL2003PTC119576"
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Workspace Members Table (Multi-Tenant Binding & RBAC)
CREATE TABLE IF NOT EXISTS public.workspace_members (
  id BIGSERIAL PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'underwriter',
  status TEXT NOT NULL DEFAULT 'active',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

-- 5. Create Clients Table
CREATE TABLE IF NOT EXISTS public.clients (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  gst TEXT NOT NULL,
  address TEXT NOT NULL,
  district TEXT NOT NULL,
  state TEXT NOT NULL,
  industry TEXT NOT NULL,
  notes TEXT,
  assigned_to TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  total_quotes INT DEFAULT 0,
  total_sum_insured NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create Quotes Table
CREATE TABLE IF NOT EXISTS public.quotes (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  quote_number TEXT NOT NULL UNIQUE,
  client_id TEXT REFERENCES public.clients(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  client_gst TEXT,
  created_by TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  creator_name TEXT NOT NULL,
  occupation_code TEXT NOT NULL,
  occupation_description TEXT NOT NULL,
  eq_zone TEXT NOT NULL,
  sum_insured NUMERIC NOT NULL,
  sum_insured_breakdown JSONB NOT NULL,
  premium NUMERIC NOT NULL,
  gst_amount NUMERIC NOT NULL,
  total_premium NUMERIC NOT NULL,
  policy_rate NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  ai_confidence NUMERIC DEFAULT 0.95,
  insurer_name TEXT NOT NULL DEFAULT 'ICICI LOMBARD GENERAL INSURANCE',
  version INT DEFAULT 1,
  calculation_breakdown JSONB NOT NULL,
  ai_analysis JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create Audit Logs Table (Immutable Compliance Trail)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  details JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Create AI Requests Telemetry Table
CREATE TABLE IF NOT EXISTS public.ai_requests (
  id BIGSERIAL PRIMARY KEY,
  workspace_id TEXT REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  endpoint TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INT NOT NULL,
  output_tokens INT NOT NULL,
  cost_usd NUMERIC(10, 7) NOT NULL,
  latency_ms INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_requests ENABLE ROW LEVEL SECURITY;

-- Helper function: check if authenticated user is platform super admin
CREATE OR REPLACE FUNCTION auth.is_platform_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    COALESCE(auth.jwt() ->> 'role', '') = 'super_admin'
    OR EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.user_id = auth.uid()::text AND wm.role = 'super_admin'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "workspaces_select_policy" ON public.workspaces;
CREATE POLICY "workspaces_select_policy" ON public.workspaces FOR SELECT USING (true);

DROP POLICY IF EXISTS "workspace_members_select_policy" ON public.workspace_members;
CREATE POLICY "workspace_members_select_policy" ON public.workspace_members FOR SELECT USING (true);

DROP POLICY IF EXISTS "quotes_select_policy" ON public.quotes;
CREATE POLICY "quotes_select_policy" ON public.quotes FOR ALL USING (true);

DROP POLICY IF EXISTS "clients_select_policy" ON public.clients;
CREATE POLICY "clients_select_policy" ON public.clients FOR ALL USING (true);

DROP POLICY IF EXISTS "audit_logs_select_policy" ON public.audit_logs;
CREATE POLICY "audit_logs_select_policy" ON public.audit_logs FOR ALL USING (true);

DROP POLICY IF EXISTS "ai_requests_select_policy" ON public.ai_requests;
CREATE POLICY "ai_requests_select_policy" ON public.ai_requests FOR ALL USING (true);

-- ==============================================================================
-- SEED INITIAL MOCK DATA INTO SUPABASE
-- ==============================================================================

-- Profiles
INSERT INTO public.profiles (id, name, email, phone, avatar) VALUES
('user-001', 'Vikramaditya Sharma', 'superadmin@quotely.ai', '+91 98110 99881', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'),
('user-002', 'Rajesh Singhania', 'owner@capitalinsurance.co.in', '+91 98200 44551', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'),
('user-003', 'Priya Malhotra', 'priya@capitalinsurance.co.in', '+91 98711 23456', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'),
('user-004', 'Arjun Kapoor', 'arjun.k@capitalinsurance.co.in', '+91 99100 87654', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'),
('user-005', 'Sneha Verma', 'sneha.v@capitalinsurance.co.in', '+91 98102 34567', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150'),
('user-006', 'Rohan Gupta (Auditor)', 'rohan.auditor@capitalinsurance.co.in', '+91 97111 65432', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150')
ON CONFLICT (id) DO NOTHING;

-- Workspaces
INSERT INTO public.workspaces (id, name, slug, gst, address, phone, email, owner_id) VALUES
('ws-capital-01', 'Capital Insurance Brokers Pvt Ltd', 'capital-insurance', '07AABC1234F1Z5', '706, 7th Floor, Netaji Subhash Place, New Delhi 110034', '011-45631850', 'contact@capitalinsurance.co.in', 'user-002'),
('ws-apex-02', 'Apex Risk Advisors LLP', 'apex-risk', '27AAACR9981K1Z3', 'One BKC, 12th Floor, Bandra Kurla Complex, Mumbai 400051', '022-68912300', 'underwrite@apexrisk.in', 'user-001')
ON CONFLICT (id) DO NOTHING;

-- Workspace Members
INSERT INTO public.workspace_members (workspace_id, user_id, role, status) VALUES
('ws-capital-01', 'user-002', 'brokerage_owner', 'active'),
('ws-capital-01', 'user-003', 'admin', 'active'),
('ws-capital-01', 'user-004', 'underwriter', 'active'),
('ws-capital-01', 'user-005', 'sales_executive', 'active'),
('ws-capital-01', 'user-006', 'viewer', 'active'),
('ws-apex-02', 'user-001', 'super_admin', 'active')
ON CONFLICT (workspace_id, user_id) DO NOTHING;

-- Clients
INSERT INTO public.clients (id, workspace_id, client_name, gst, address, district, state, industry, notes, assigned_to, total_quotes, total_sum_insured) VALUES
('client-krishna-01', 'ws-capital-01', 'Krishna & Company (Tool Makers)', '07AAACK1234F1Z5', 'Plot 42, Sector 8, IMT Manesar, Gurugram, Haryana 122051', 'Gurugram', 'Haryana', 'Precision CNC Machining & Metal Fabrication', 'Key commercial account. High-value plant & machinery with automated fire hydrant and sprinkler setup.', 'user-004', 1, 53800000),
('client-shivaji-02', 'ws-capital-01', 'Shivaji Agro Industries Pvt Ltd', '27AALCS9821R1Z9', 'MIDC Industrial Estate, Waluj, Chhatrapati Sambhajinagar, Maharashtra 431136', 'Aurangabad', 'Maharashtra', 'Agro-processing & Confectionery Manufacturing', 'Expansion project underway with new warehouse facility.', 'user-004', 1, 120000000)
ON CONFLICT (id) DO NOTHING;

-- Quotes
INSERT INTO public.quotes (
  id, workspace_id, quote_number, client_id, client_name, client_gst, created_by, creator_name,
  occupation_code, occupation_description, eq_zone, sum_insured, sum_insured_breakdown,
  premium, gst_amount, total_premium, policy_rate, status, ai_confidence, insurer_name, version,
  calculation_breakdown
) VALUES (
  'quote-krishna-001',
  'ws-capital-01',
  'QTL-DEL-2026-0042',
  'client-krishna-01',
  'Krishna & Company (Tool Makers)',
  '07AAACK1234F1Z5',
  'user-004',
  'Arjun Kapoor',
  '1023',
  'Engineering Workshops (Metal & Steel Works, CNC Stamping & Machining)',
  'Zone 4',
  53800000,
  '{"building": 15000000, "plant_machinery": 26000000, "stocks": 12800000, "furniture_fixtures": 0, "others": 0, "total": 53800000}'::jsonb,
  33033,
  5946,
  38979,
  0.614,
  'approved',
  0.96,
  'ICICI LOMBARD GENERAL INSURANCE',
  1,
  '{"occupancy_code": "1023", "category": 1, "product_type": "BLUS", "eq_zone": "Zone 4", "net_premium": 33033, "gst_amount": 5946, "total_premium": 38979}'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Audit Logs
INSERT INTO public.audit_logs (id, workspace_id, user_id, user_name, user_email, action, resource_type, resource_id, details) VALUES
('audit-001', 'ws-capital-01', 'user-004', 'Arjun Kapoor', 'arjun.k@capitalinsurance.co.in', 'quote.created', 'quote', 'quote-krishna-001', '{"quote_number": "QTL-DEL-2026-0042", "client": "Krishna & Company"}'::jsonb),
('audit-002', 'ws-capital-01', 'user-004', 'Arjun Kapoor', 'arjun.k@capitalinsurance.co.in', 'quote.pdf_downloaded', 'quote', 'quote-krishna-001', '{"file_name": "Quote Slip-KRISHNA & COMPANY.pdf"}'::jsonb),
('audit-003', 'ws-capital-01', 'user-002', 'Rajesh Singhania', 'owner@capitalinsurance.co.in', 'member.invited', 'member', 'user-006', '{"email": "rohan.auditor@capitalinsurance.co.in", "role": "viewer"}'::jsonb)
ON CONFLICT (id) DO NOTHING;
