-- ==============================================================================
-- QUOTELY MULTI-TENANT INSURANCE OPERATING SYSTEM
-- PostgreSQL Schema with Row-Level Security (RLS)
-- Compatible with Supabase Auth & Storage
-- ==============================================================================

-- 1. PROFILES (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    avatar TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. WORKSPACES (Brokerage Firms)
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    gst TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    owner_id UUID NOT NULL REFERENCES public.profiles(id),
    default_rules JSONB DEFAULT '{"default_discretionary_discount": 10, "default_brokerage_share": 15, "auto_recommend_terrorism": false, "default_eq_zone": "Zone 2", "irda_license_no": "236", "cin_no": "U74999DL2003PTC119576"}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. WORKSPACE MEMBERS (Multi-tenant Role Based Access)
CREATE TYPE public.user_role AS ENUM (
    'super_admin',
    'brokerage_owner',
    'admin',
    'underwriter',
    'sales_executive',
    'viewer'
);

CREATE TABLE IF NOT EXISTS public.workspace_members (
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role public.user_role DEFAULT 'underwriter'::public.user_role NOT NULL,
    status TEXT DEFAULT 'active' NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    PRIMARY KEY (workspace_id, user_id)
);

-- 4. CLIENTS (Workspace Scoped CRM)
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    client_name TEXT NOT NULL,
    gst TEXT NOT NULL,
    address TEXT NOT NULL,
    district TEXT NOT NULL,
    state TEXT NOT NULL,
    industry TEXT NOT NULL,
    notes TEXT,
    assigned_to UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. QUOTES (Commercial Underwriting Quotes)
CREATE TABLE IF NOT EXISTS public.quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_number TEXT NOT NULL,
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES public.profiles(id),
    occupation_code TEXT NOT NULL,
    occupation_description TEXT NOT NULL,
    eq_zone TEXT NOT NULL,
    sum_insured NUMERIC(15, 2) NOT NULL,
    sum_insured_breakdown JSONB NOT NULL,
    premium NUMERIC(12, 2) NOT NULL,
    gst_amount NUMERIC(12, 2) NOT NULL,
    total_premium NUMERIC(12, 2) NOT NULL,
    policy_rate NUMERIC(8, 4) NOT NULL,
    status TEXT DEFAULT 'draft' NOT NULL,
    ai_confidence NUMERIC(4, 2) NOT NULL,
    ai_analysis JSONB,
    calculation_breakdown JSONB NOT NULL,
    insurer_name TEXT DEFAULT 'THE NEW INDIA ASSURANCE CO. LTD.',
    pdf_url TEXT,
    version INT DEFAULT 1 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. UPLOADED DOCUMENTS (Proposals, RFQs, Photos, Slips)
CREATE TABLE IF NOT EXISTS public.uploaded_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    document_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    ocr_status TEXT DEFAULT 'completed' NOT NULL,
    extracted_data JSONB,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. AUDIT LOGS (Immutable Workspace Activity Record)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    details JSONB,
    timestamp TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploaded_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function: Is user a member of workspace?
CREATE OR REPLACE FUNCTION public.is_workspace_member(ws_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.workspace_members
        WHERE workspace_id = ws_id
        AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: Users can view their own profile, or members of mutual workspaces
CREATE POLICY "Users can view profiles in their workspaces"
ON public.profiles FOR SELECT
USING (
    id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.workspace_members wm1
        JOIN public.workspace_members wm2 ON wm1.workspace_id = wm2.workspace_id
        WHERE wm1.user_id = auth.uid() AND wm2.user_id = profiles.id
    )
);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (id = auth.uid());

-- Workspaces: Visible to their members
CREATE POLICY "Members can view their workspaces"
ON public.workspaces FOR SELECT
USING (public.is_workspace_member(id));

CREATE POLICY "Owners and Admins can update workspaces"
ON public.workspaces FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.workspace_members
        WHERE workspace_id = id
        AND user_id = auth.uid()
        AND role IN ('brokerage_owner', 'admin', 'super_admin')
    )
);

-- Workspace Members
CREATE POLICY "Members can view team list"
ON public.workspace_members FOR SELECT
USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Admins can manage team members"
ON public.workspace_members FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.workspace_members
        WHERE workspace_id = workspace_members.workspace_id
        AND user_id = auth.uid()
        AND role IN ('brokerage_owner', 'admin', 'super_admin')
    )
);

-- Clients: Workspace isolated
CREATE POLICY "Workspace members can access clients"
ON public.clients FOR ALL
USING (public.is_workspace_member(workspace_id));

-- Quotes: Workspace isolated
CREATE POLICY "Workspace members can access quotes"
ON public.quotes FOR ALL
USING (public.is_workspace_member(workspace_id));

-- Uploaded Documents: Workspace isolated
CREATE POLICY "Workspace members can access documents"
ON public.uploaded_documents FOR ALL
USING (public.is_workspace_member(workspace_id));

-- Audit Logs: Workspace isolated
CREATE POLICY "Workspace members can view audit logs"
ON public.audit_logs FOR SELECT
USING (public.is_workspace_member(workspace_id));

CREATE POLICY "System can insert audit logs"
ON public.audit_logs FOR INSERT
WITH CHECK (public.is_workspace_member(workspace_id));

-- 8. AI REQUESTS (Token & Cost Observability)
CREATE TABLE IF NOT EXISTS public.ai_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    endpoint TEXT NOT NULL,
    model TEXT NOT NULL,
    input_tokens INT NOT NULL,
    output_tokens INT NOT NULL,
    cost_usd NUMERIC(10, 6) NOT NULL,
    latency_ms INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.ai_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can view ai requests"
ON public.ai_requests FOR SELECT
USING (public.is_workspace_member(workspace_id));

CREATE POLICY "System can insert ai requests"
ON public.ai_requests FOR INSERT
WITH CHECK (public.is_workspace_member(workspace_id));

-- 9. WORKSPACE INVITATIONS (Invitation-only Onboarding)
CREATE TABLE IF NOT EXISTS public.workspace_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role public.user_role DEFAULT 'underwriter'::public.user_role NOT NULL,
    token TEXT NOT NULL UNIQUE,
    invited_by UUID NOT NULL REFERENCES public.profiles(id),
    status TEXT DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL
);

ALTER TABLE public.workspace_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage invitations"
ON public.workspace_invitations FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.workspace_members
        WHERE workspace_id = workspace_invitations.workspace_id
        AND user_id = auth.uid()
        AND role IN ('brokerage_owner', 'admin', 'super_admin')
    )
);
