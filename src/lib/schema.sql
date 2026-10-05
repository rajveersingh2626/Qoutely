-- ==============================================================================
-- QUOTELY CONSOLIDATED SUPABASE SECURITY ADVISOR & MULTI-TENANCY MIGRATION
-- Migration: 20261003_consolidated_security_advisor_fix.sql
-- 
-- SUMMARY OF FIXES:
-- 1. Security Definer Views:
--    - Drops legacy public.organizations and public.organization_members views.
--    - Creates public.organizations and public.organization_members as standard base tables.
--    - Sets security_invoker = true on any existing or future views.
-- 2. Multiple Permissive Policies Warning:
--    - Drops all fragmented/overlapping permissive policies across all tables.
--    - Replaces with exactly ONE consolidated policy per action (SELECT, INSERT, UPDATE, DELETE).
-- 3. Auth RLS InitPlan Optimization:
--    - Replaces all bare auth.uid() calls with (SELECT auth.uid()) subqueries to eliminate
--      RLS initialization plan warnings and achieve optimal query execution speed.
-- 4. Clean Database Wipe:
--    - Safely truncates/deletes all application records in reverse foreign-key order.
--    - Cleans test accounts in auth.users leaving only primary accounts.
-- 5. Schema Enforcement:
--    - organizations (id, name, created_at)
--    - profiles (id, full_name, email, is_super_admin, created_at)
--    - organization_members (id, org_id, user_id, role, created_at)
--    - clients & quotes with explicit org_id FK and strict RLS enforcement.
-- 6. Initial Multi-Tenant Seed:
--    - Super Admin: Rajveer Singh Marwah (is_super_admin: true)
--    - Organization: Capital Brokers
--    - Member: Dinesh Gupta (underwriter / admin)
-- ==============================================================================

-- ==============================================================================
-- STEP 1: DROP LEGACY VIEWS & ENSURE SECURITY INVOKER
-- ==============================================================================
DROP VIEW IF EXISTS public.organizations CASCADE;
DROP VIEW IF EXISTS public.organization_members CASCADE;

-- If any other views exist, enforce security_invoker = on
DO $$
DECLARE
  v_view RECORD;
BEGIN
  FOR v_view IN (
    SELECT table_name
    FROM information_schema.views
    WHERE table_schema = 'public'
  ) LOOP
    EXECUTE format('ALTER VIEW public.%I SET (security_invoker = on);', v_view.table_name);
  END LOOP;
END $$;

-- ==============================================================================
-- STEP 2: TEMPORARILY DISABLE RLS FOR CLEAN WIPE
-- ==============================================================================
ALTER TABLE IF EXISTS public.uploaded_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ai_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.workspace_invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.quotes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.workspace_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.workspaces DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.organization_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.organizations DISABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- STEP 3: DROP ALL EXISTING POLICIES (ELIMINATES MULTIPLE PERMISSIVE POLICIES)
-- ==============================================================================
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN (
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I;', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

-- ==============================================================================
-- STEP 4: CLEAN DATABASE WIPE (REVERSE FOREIGN KEY ORDER)
-- ==============================================================================
-- Truncate application data tables
TRUNCATE TABLE
  public.uploaded_documents,
  public.ai_requests,
  public.workspace_invitations,
  public.audit_logs,
  public.quotes,
  public.clients,
  public.workspace_members,
  public.workspaces
CASCADE;

-- Truncate profiles
TRUNCATE TABLE public.profiles CASCADE;

-- Clean test users in auth.users (retaining only primary seed emails)
DELETE FROM auth.users
WHERE email NOT IN (
  'rajveer@capitalbrokers.in',
  'dinesh@capitalbrokers.in'
);

-- ==============================================================================
-- STEP 5: SCHEMA ENFORCEMENT — CREATE OR ALIGN TABLES
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 5.1 ORGANIZATIONS (Standard Base Table — NOT a view)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 5.2 PROFILES (Extends auth.users with full_name and is_super_admin)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT NOT NULL UNIQUE,
  is_super_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Ensure canonical columns exist if table was pre-existing
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- If 'name' column exists, drop its NOT NULL constraint so inserts with just full_name succeed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'name'
  ) THEN
    ALTER TABLE public.profiles ALTER COLUMN name DROP NOT NULL;
  ELSE
    ALTER TABLE public.profiles ADD COLUMN name TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'super_admin'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN super_admin BOOLEAN GENERATED ALWAYS AS (is_super_admin) STORED;
  END IF;
END $$;

-- Trigger to keep full_name and name in sync automatically
CREATE OR REPLACE FUNCTION public.sync_profile_names()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.full_name IS NULL AND NEW.name IS NOT NULL THEN
    NEW.full_name := NEW.name;
  ELSIF NEW.name IS NULL AND NEW.full_name IS NOT NULL THEN
    NEW.name := NEW.full_name;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_names ON public.profiles;
CREATE TRIGGER trg_sync_profile_names
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_names();


-- ------------------------------------------------------------------------------
-- 5.3 ORGANIZATION_MEMBERS (Standard Base Table — Multi-tenant Membership)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'underwriter', 'sales')),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT organization_members_org_user_uniq UNIQUE (org_id, user_id)
);

-- ------------------------------------------------------------------------------
-- 5.4 WORKSPACES & WORKSPACE_MEMBERS (Legacy alignment)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  gst TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  default_rules JSONB DEFAULT '{"default_discretionary_discount": 10, "default_brokerage_share": 15, "auto_recommend_terrorism": false, "default_eq_zone": "Zone 2", "irda_license_no": "236", "cin_no": "U74999DL2003PTC119576"}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 5.5 CLIENTS (With explicit org_id FK)
-- ------------------------------------------------------------------------------
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- ------------------------------------------------------------------------------
-- 5.6 QUOTES (With explicit org_id FK)
-- ------------------------------------------------------------------------------
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- ------------------------------------------------------------------------------
-- 5.7 AUDIT LOGS (With org_id)
-- ------------------------------------------------------------------------------
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- ------------------------------------------------------------------------------
-- 5.8 WORKSPACE REMINDER USAGE (Monthly Quota Persistence)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workspace_reminder_usage (
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  billing_month TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (workspace_id, billing_month)
);

-- ==============================================================================
-- STEP 6: PERFORMANCE INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_is_super_admin
  ON public.profiles (is_super_admin) WHERE is_super_admin = TRUE;

CREATE INDEX IF NOT EXISTS idx_org_members_user_id
  ON public.organization_members (user_id);

CREATE INDEX IF NOT EXISTS idx_org_members_org_id
  ON public.organization_members (org_id);

CREATE INDEX IF NOT EXISTS idx_clients_org_id
  ON public.clients (org_id);

CREATE INDEX IF NOT EXISTS idx_quotes_org_id
  ON public.quotes (org_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_org_id
  ON public.audit_logs (org_id);

-- ==============================================================================
-- STEP 7: RE-ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ==============================================================================
ALTER TABLE public.organizations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploaded_documents    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_requests           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_invitations ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- STEP 8: CONSOLIDATED RLS POLICIES (ONE POLICY PER ACTION PER TABLE)
-- All policies utilize (SELECT auth.uid()) to avoid InitPlan linter warnings.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 8.1 ORGANIZATIONS
-- ------------------------------------------------------------------------------
CREATE POLICY "organizations_select" ON public.organizations
FOR SELECT USING (
  id IN (
    SELECT om.org_id FROM public.organization_members om
    WHERE om.user_id = (SELECT auth.uid())
  )
  OR (SELECT p.is_super_admin FROM public.profiles p WHERE p.id = (SELECT auth.uid())) = TRUE
);

CREATE POLICY "organizations_insert" ON public.organizations
FOR INSERT WITH CHECK (
  (SELECT p.is_super_admin FROM public.profiles p WHERE p.id = (SELECT auth.uid())) = TRUE
);

CREATE POLICY "organizations_update" ON public.organizations
FOR UPDATE USING (
  id IN (
    SELECT om.org_id FROM public.organization_members om
    WHERE om.user_id = (SELECT auth.uid()) AND om.role = 'admin'
  )
  OR (SELECT p.is_super_admin FROM public.profiles p WHERE p.id = (SELECT auth.uid())) = TRUE
) WITH CHECK (
  id IN (
    SELECT om.org_id FROM public.organization_members om
    WHERE om.user_id = (SELECT auth.uid()) AND om.role = 'admin'
  )
  OR (SELECT p.is_super_admin FROM public.profiles p WHERE p.id = (SELECT auth.uid())) = TRUE
);

CREATE POLICY "organizations_delete" ON public.organizations
FOR DELETE USING (
  (SELECT p.is_super_admin FROM public.profiles p WHERE p.id = (SELECT auth.uid())) = TRUE
);

-- ------------------------------------------------------------------------------
-- 8.2 ORGANIZATION_MEMBERS
-- ------------------------------------------------------------------------------
CREATE POLICY "organization_members_select" ON public.organization_members
FOR SELECT USING (
  org_id IN (
    SELECT om.org_id FROM public.organization_members om
    WHERE om.user_id = (SELECT auth.uid())
  )
  OR (SELECT p.is_super_admin FROM public.profiles p WHERE p.id = (SELECT auth.uid())) = TRUE
);

CREATE POLICY "organization_members_insert" ON public.organization_members
FOR INSERT WITH CHECK (
  org_id IN (
    SELECT om.org_id FROM public.organization_members om
    WHERE om.user_id = (SELECT auth.uid()) AND om.role = 'admin'
  )
  OR (SELECT p.is_super_admin FROM public.profiles p WHERE p.id = (SELECT auth.uid())) = TRUE
);

CREATE POLICY "organization_members_update" ON public.organization_members
FOR UPDATE USING (
  org_id IN (
    SELECT om.org_id FROM public.organization_members om
    WHERE om.user_id = (SELECT auth.uid()) AND om.role = 'admin'
  )
  OR (SELECT p.is_super_admin FROM public.profiles p WHERE p.id = (SELECT auth.uid())) = TRUE
) WITH CHECK (
  org_id IN (
    SELECT om.org_id FROM public.organization_members om
    WHERE om.user_id = (SELECT auth.uid()) AND om.role = 'admin'
  )
  OR (SELECT p.is_super_admin FROM public.profiles p WHERE p.id = (SELECT auth.uid())) = TRUE
);

CREATE POLICY "organization_members_delete" ON public.organization_members
FOR DELETE USING (
  org_id IN (
    SELECT om.org_id FROM public.organization_members om
    WHERE om.user_id = (SELECT auth.uid()) AND om.role = 'admin'
  )
  OR (SELECT p.is_super_admin FROM public.profiles p WHERE p.id = (SELECT auth.uid())) = TRUE
);

-- ------------------------------------------------------------------------------
-- 8.3 PROFILES
-- ------------------------------------------------------------------------------
CREATE POLICY "profiles_select" ON public.profiles
FOR SELECT USING (
  id = (SELECT auth.uid())
  OR id IN (
    SELECT om2.user_id
    FROM public.organization_members om1
    JOIN public.organization_members om2 ON om1.org_id = om2.org_id
    WHERE om1.user_id = (SELECT auth.uid())
  )
  OR (SELECT p.is_super_admin FROM public.profiles p WHERE p.id = (SELECT auth.uid())) = TRUE
);

CREATE POLICY "profiles_insert" ON public.profiles
FOR INSERT WITH CHECK (
  id = (SELECT auth.uid())
  OR (SELECT p.is_super_admin FROM public.profiles p WHERE p.id = (SELECT auth.uid())) = TRUE
);

CREATE POLICY "profiles_update" ON public.profiles
FOR UPDATE USING (
  id = (SELECT auth.uid())
  OR (SELECT p.is_super_admin FROM public.profiles p WHERE p.id = (SELECT auth.uid())) = TRUE
) WITH CHECK (
  id = (SELECT auth.uid())
  OR (SELECT p.is_super_admin FROM public.profiles p WHERE p.id = (SELECT auth.uid())) = TRUE
);

CREATE POLICY "profiles_delete" ON public.profiles
FOR DELETE USING (
  (SELECT p.is_super_admin FROM public.profiles p WHERE p.id = (SELECT auth.uid())) = TRUE
);

-- ------------------------------------------------------------------------------
-- 8.4 CLIENTS
-- ------------------------------------------------------------------------------
CREATE POLICY "clients_select" ON public.clients
FOR SELECT USING (
  org_id IN (
    SELECT om.org_id FROM public.organization_members om
    WHERE om.user_id = (SELECT auth.uid())
  )
  OR workspace_id IN (
    SELECT wm.workspace_id FROM public.workspace_members wm
    WHERE wm.user_id = (SELECT auth.uid())
  )
  OR (SELECT p.is_super_admin FROM public.profiles p WHERE p.id = (SELECT auth.uid())) = TRUE
);

CREATE POLICY "clients_insert" ON public.clients
FOR INSERT WITH CHECK (
  org_id IN (
    SELECT om.org_id FROM public.organization_members om
    WHERE om.user_id = (SELECT auth.uid())
  )
  OR workspace_id IN (
    SELECT wm.workspace_id FROM public.workspace_members wm
    WHERE wm.user_id = (SELECT auth.uid())
  )
  OR (SELECT p.is_super_admin FROM public.profiles p WHERE p.id = (SELECT auth.uid())) = TRUE
);

CREATE POLICY "clients_update" ON public.clients
FOR UPDATE USING (
  org_id IN (
    SELECT om.org_id FROM public.organization_members om
    WHERE om.user_id = (SELECT auth.uid())
  )
  OR workspace_id IN (
    SELECT wm.workspace_id FROM public.workspace_members wm
    WHERE wm.user_id = (SELECT auth.uid())
  )
  OR (SELECT p.is_super_admin FROM public.profiles p WHERE p.id = (SELECT auth.uid())) = TRUE
) WITH CHECK (
  org_id IN (
    SELECT om.org_id FROM public.organization_members om
    WHERE om.user_id = (SELECT auth.uid())
  )
  OR workspace_id IN (
    SELECT wm.workspace_id FROM public.workspace_members wm
    WHERE wm.user_id = (SELECT auth.uid())
  )
  OR (SELECT p.is_super_admin FROM public.profiles p WHERE p.id = (SELECT auth.uid())) = TRUE
);

CREATE POLICY "clients_delete" ON public.clients
FOR DELETE USING (
  org_id IN (
    SELECT om.org_id FROM public.organization_members om
    WHERE om.user_id = (SELECT auth.uid()) AND om.role = 'admin'
  )
  OR workspace_id IN (
    SELECT wm.workspace_id FROM public.workspace_members wm
    WHERE wm.user_id = (SELECT auth.uid()) AND wm.role IN ('brokerage_owner', 'admin', 'super_admin')
  )
  OR (SELECT p.is_super_admin FROM public.profiles p WHERE p.id = (SELECT auth.uid())) = TRUE
);

-- ------------------------------------------------------------------------------
-- 8.5 QUOTES
-- ------------------------------------------------------------------------------
CREATE POLICY "quotes_select" ON public.quotes
FOR SELECT USING (
  org_id IN (
    SELECT om.org_id FROM public.organization_members om
    WHERE om.user_id = (SELECT auth.uid())
  )
  OR workspace_id IN (
    SELECT wm.workspace_id FROM public.workspace_members wm
    WHERE wm.user_id = (SELECT auth.uid())
  )
  OR (SELECT p.is_super_admin FROM public.profiles p WHERE p.id = (SELECT auth.uid())) = TRUE
);

CREATE POLICY "quotes_insert" ON public.quotes
FOR INSERT WITH CHECK (
  org_id IN (
    SELECT om.org_id FROM public.organization_members om
    WHERE om.user_id = (SELECT auth.uid())
  )
  OR workspace_id IN (
    SELECT wm.workspace_id FROM public.workspace_members wm
    WHERE wm.user_id = (SELECT auth.uid())
  )
  OR (SELECT p.is_super_admin FROM public.profiles p WHERE p.id = (SELECT auth.uid())) = TRUE
);

CREATE POLICY "quotes_update" ON public.quotes
FOR UPDATE USING (
  org_id IN (
    SELECT om.org_id FROM public.organization_members om
    WHERE om.user_id = (SELECT auth.uid())
  )
  OR workspace_id IN (
    SELECT wm.workspace_id FROM public.workspace_members wm
    WHERE wm.user_id = (SELECT auth.uid())
  )
  OR (SELECT p.is_super_admin FROM public.profiles p WHERE p.id = (SELECT auth.uid())) = TRUE
) WITH CHECK (
  org_id IN (
    SELECT om.org_id FROM public.organization_members om
    WHERE om.user_id = (SELECT auth.uid())
  )
  OR workspace_id IN (
    SELECT wm.workspace_id FROM public.workspace_members wm
    WHERE wm.user_id = (SELECT auth.uid())
  )
  OR (SELECT p.is_super_admin FROM public.profiles p WHERE p.id = (SELECT auth.uid())) = TRUE
);

CREATE POLICY "quotes_delete" ON public.quotes
FOR DELETE USING (
  org_id IN (
    SELECT om.org_id FROM public.organization_members om
    WHERE om.user_id = (SELECT auth.uid()) AND om.role = 'admin'
  )
  OR workspace_id IN (
    SELECT wm.workspace_id FROM public.workspace_members wm
    WHERE wm.user_id = (SELECT auth.uid()) AND wm.role IN ('brokerage_owner', 'admin', 'super_admin')
  )
  OR (SELECT p.is_super_admin FROM public.profiles p WHERE p.id = (SELECT auth.uid())) = TRUE
);

-- ------------------------------------------------------------------------------
-- 8.6 AUDIT_LOGS
-- ------------------------------------------------------------------------------
CREATE POLICY "audit_logs_select" ON public.audit_logs
FOR SELECT USING (
  org_id IN (
    SELECT om.org_id FROM public.organization_members om
    WHERE om.user_id = (SELECT auth.uid())
  )
  OR workspace_id IN (
    SELECT wm.workspace_id FROM public.workspace_members wm
    WHERE wm.user_id = (SELECT auth.uid())
  )
  OR (SELECT p.is_super_admin FROM public.profiles p WHERE p.id = (SELECT auth.uid())) = TRUE
);

CREATE POLICY "audit_logs_insert" ON public.audit_logs
FOR INSERT WITH CHECK (
  user_id = (SELECT auth.uid())
  OR org_id IN (
    SELECT om.org_id FROM public.organization_members om
    WHERE om.user_id = (SELECT auth.uid())
  )
  OR (SELECT p.is_super_admin FROM public.profiles p WHERE p.id = (SELECT auth.uid())) = TRUE
);

-- ------------------------------------------------------------------------------
-- 8.7 WORKSPACES & WORKSPACE_MEMBERS (Legacy compatibility)
-- ------------------------------------------------------------------------------
CREATE POLICY "workspaces_select" ON public.workspaces
FOR SELECT USING (
  id IN (
    SELECT wm.workspace_id FROM public.workspace_members wm
    WHERE wm.user_id = (SELECT auth.uid())
  )
  OR (SELECT p.is_super_admin FROM public.profiles p WHERE p.id = (SELECT auth.uid())) = TRUE
);

CREATE POLICY "workspaces_insert" ON public.workspaces
FOR INSERT WITH CHECK (
  owner_id = (SELECT auth.uid())
  OR (SELECT p.is_super_admin FROM public.profiles p WHERE p.id = (SELECT auth.uid())) = TRUE
);

CREATE POLICY "workspaces_update" ON public.workspaces
FOR UPDATE USING (
  id IN (
    SELECT wm.workspace_id FROM public.workspace_members wm
    WHERE wm.user_id = (SELECT auth.uid()) AND wm.role IN ('brokerage_owner', 'admin', 'super_admin')
  )
  OR (SELECT p.is_super_admin FROM public.profiles p WHERE p.id = (SELECT auth.uid())) = TRUE
) WITH CHECK (
  id IN (
    SELECT wm.workspace_id FROM public.workspace_members wm
    WHERE wm.user_id = (SELECT auth.uid()) AND wm.role IN ('brokerage_owner', 'admin', 'super_admin')
  )
  OR (SELECT p.is_super_admin FROM public.profiles p WHERE p.id = (SELECT auth.uid())) = TRUE
);

CREATE POLICY "workspaces_delete" ON public.workspaces
FOR DELETE USING (
  (SELECT p.is_super_admin FROM public.profiles p WHERE p.id = (SELECT auth.uid())) = TRUE
);

CREATE POLICY "workspace_members_select" ON public.workspace_members
FOR SELECT USING (
  workspace_id IN (
    SELECT wm.workspace_id FROM public.workspace_members wm
    WHERE wm.user_id = (SELECT auth.uid())
  )
  OR (SELECT p.is_super_admin FROM public.profiles p WHERE p.id = (SELECT auth.uid())) = TRUE
);

CREATE POLICY "workspace_members_insert" ON public.workspace_members
FOR INSERT WITH CHECK (
  workspace_id IN (
    SELECT wm.workspace_id FROM public.workspace_members wm
    WHERE wm.user_id = (SELECT auth.uid()) AND wm.role IN ('brokerage_owner', 'admin', 'super_admin')
  )
  OR (SELECT p.is_super_admin FROM public.profiles p WHERE p.id = (SELECT auth.uid())) = TRUE
);

CREATE POLICY "workspace_members_update" ON public.workspace_members
FOR UPDATE USING (
  workspace_id IN (
    SELECT wm.workspace_id FROM public.workspace_members wm
    WHERE wm.user_id = (SELECT auth.uid()) AND wm.role IN ('brokerage_owner', 'admin', 'super_admin')
  )
  OR (SELECT p.is_super_admin FROM public.profiles p WHERE p.id = (SELECT auth.uid())) = TRUE
) WITH CHECK (
  workspace_id IN (
    SELECT wm.workspace_id FROM public.workspace_members wm
    WHERE wm.user_id = (SELECT auth.uid()) AND wm.role IN ('brokerage_owner', 'admin', 'super_admin')
  )
  OR (SELECT p.is_super_admin FROM public.profiles p WHERE p.id = (SELECT auth.uid())) = TRUE
);

CREATE POLICY "workspace_members_delete" ON public.workspace_members
FOR DELETE USING (
  workspace_id IN (
    SELECT wm.workspace_id FROM public.workspace_members wm
    WHERE wm.user_id = (SELECT auth.uid()) AND wm.role IN ('brokerage_owner', 'admin', 'super_admin')
  )
  OR (SELECT p.is_super_admin FROM public.profiles p WHERE p.id = (SELECT auth.uid())) = TRUE
);

-- ------------------------------------------------------------------------------
-- 8.8 UPLOADED_DOCUMENTS, AI_REQUESTS, WORKSPACE_INVITATIONS
-- ------------------------------------------------------------------------------
CREATE POLICY "uploaded_documents_select" ON public.uploaded_documents
FOR SELECT USING (
  workspace_id IN (
    SELECT wm.workspace_id FROM public.workspace_members wm
    WHERE wm.user_id = (SELECT auth.uid())
  )
  OR (SELECT p.is_super_admin FROM public.profiles p WHERE p.id = (SELECT auth.uid())) = TRUE
);

CREATE POLICY "uploaded_documents_insert" ON public.uploaded_documents
FOR INSERT WITH CHECK (
  workspace_id IN (
    SELECT wm.workspace_id FROM public.workspace_members wm
    WHERE wm.user_id = (SELECT auth.uid())
  )
  OR (SELECT p.is_super_admin FROM public.profiles p WHERE p.id = (SELECT auth.uid())) = TRUE
);

CREATE POLICY "uploaded_documents_update" ON public.uploaded_documents
FOR UPDATE USING (
  workspace_id IN (
    SELECT wm.workspace_id FROM public.workspace_members wm
    WHERE wm.user_id = (SELECT auth.uid()) AND wm.role IN ('brokerage_owner', 'admin', 'super_admin')
  )
  OR (SELECT p.is_super_admin FROM public.profiles p WHERE p.id = (SELECT auth.uid())) = TRUE
) WITH CHECK (
  workspace_id IN (
    SELECT wm.workspace_id FROM public.workspace_members wm
    WHERE wm.user_id = (SELECT auth.uid()) AND wm.role IN ('brokerage_owner', 'admin', 'super_admin')
  )
  OR (SELECT p.is_super_admin FROM public.profiles p WHERE p.id = (SELECT auth.uid())) = TRUE
);

CREATE POLICY "uploaded_documents_delete" ON public.uploaded_documents
FOR DELETE USING (
  workspace_id IN (
    SELECT wm.workspace_id FROM public.workspace_members wm
    WHERE wm.user_id = (SELECT auth.uid()) AND wm.role IN ('brokerage_owner', 'admin', 'super_admin')
  )
  OR (SELECT p.is_super_admin FROM public.profiles p WHERE p.id = (SELECT auth.uid())) = TRUE
);

CREATE POLICY "ai_requests_select" ON public.ai_requests
FOR SELECT USING (
  workspace_id IN (
    SELECT wm.workspace_id FROM public.workspace_members wm
    WHERE wm.user_id = (SELECT auth.uid())
  )
  OR (SELECT p.is_super_admin FROM public.profiles p WHERE p.id = (SELECT auth.uid())) = TRUE
);

CREATE POLICY "ai_requests_insert" ON public.ai_requests
FOR INSERT WITH CHECK (
  workspace_id IN (
    SELECT wm.workspace_id FROM public.workspace_members wm
    WHERE wm.user_id = (SELECT auth.uid())
  )
  OR (SELECT p.is_super_admin FROM public.profiles p WHERE p.id = (SELECT auth.uid())) = TRUE
);

CREATE POLICY "workspace_invitations_select" ON public.workspace_invitations
FOR SELECT USING (
  workspace_id IN (
    SELECT wm.workspace_id FROM public.workspace_members wm
    WHERE wm.user_id = (SELECT auth.uid())
  )
  OR (SELECT p.is_super_admin FROM public.profiles p WHERE p.id = (SELECT auth.uid())) = TRUE
);

CREATE POLICY "workspace_invitations_insert" ON public.workspace_invitations
FOR INSERT WITH CHECK (
  workspace_id IN (
    SELECT wm.workspace_id FROM public.workspace_members wm
    WHERE wm.user_id = (SELECT auth.uid()) AND wm.role IN ('brokerage_owner', 'admin', 'super_admin')
  )
  OR (SELECT p.is_super_admin FROM public.profiles p WHERE p.id = (SELECT auth.uid())) = TRUE
);

CREATE POLICY "workspace_invitations_update" ON public.workspace_invitations
FOR UPDATE USING (
  workspace_id IN (
    SELECT wm.workspace_id FROM public.workspace_members wm
    WHERE wm.user_id = (SELECT auth.uid()) AND wm.role IN ('brokerage_owner', 'admin', 'super_admin')
  )
  OR (SELECT p.is_super_admin FROM public.profiles p WHERE p.id = (SELECT auth.uid())) = TRUE
) WITH CHECK (
  workspace_id IN (
    SELECT wm.workspace_id FROM public.workspace_members wm
    WHERE wm.user_id = (SELECT auth.uid()) AND wm.role IN ('brokerage_owner', 'admin', 'super_admin')
  )
  OR (SELECT p.is_super_admin FROM public.profiles p WHERE p.id = (SELECT auth.uid())) = TRUE
);

CREATE POLICY "workspace_invitations_delete" ON public.workspace_invitations
FOR DELETE USING (
  workspace_id IN (
    SELECT wm.workspace_id FROM public.workspace_members wm
    WHERE wm.user_id = (SELECT auth.uid()) AND wm.role IN ('brokerage_owner', 'admin', 'super_admin')
  )
  OR (SELECT p.is_super_admin FROM public.profiles p WHERE p.id = (SELECT auth.uid())) = TRUE
);

-- ==============================================================================
-- STEP 9: SEED INITIAL ENTITIES
-- ==============================================================================

-- 9.1 Ensure Auth Users Exist (Safe UPSERT into auth.users)
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
VALUES
  (
    'cd01d968-c52e-4809-9a45-0ddd62026e73'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    'authenticated',
    'rajveer@capitalbrokers.in',
    crypt('Password123!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Rajveer Singh Marwah"}'::jsonb,
    NOW(),
    NOW()
  ),
  (
    '664e9b3c-1f0b-4fcb-ae7f-1fbb156bbc3f'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    'authenticated',
    'dinesh@capitalbrokers.in',
    crypt('Password123!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Dinesh Gupta"}'::jsonb,
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data;

-- 9.2 Seed Profiles (Rajveer: Super Admin, Dinesh: Member)
INSERT INTO public.profiles (id, name, full_name, email, is_super_admin, created_at)
VALUES
  (
    'cd01d968-c52e-4809-9a45-0ddd62026e73'::uuid,
    'Rajveer Singh Marwah',
    'Rajveer Singh Marwah',
    'rajveer@capitalbrokers.in',
    TRUE,
    NOW()
  ),
  (
    '664e9b3c-1f0b-4fcb-ae7f-1fbb156bbc3f'::uuid,
    'Dinesh Gupta',
    'Dinesh Gupta',
    'dinesh@capitalbrokers.in',
    FALSE,
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  is_super_admin = EXCLUDED.is_super_admin;

-- 9.3 Seed Organization: Capital Brokers
INSERT INTO public.organizations (id, name, created_at)
VALUES (
  'a1000000-0000-0000-0000-000000000001'::uuid,
  'Capital Brokers',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name;

-- 9.4 Seed Organization Members
INSERT INTO public.organization_members (id, org_id, user_id, role, created_at)
VALUES
  (
    'b1000000-0000-0000-0000-000000000001'::uuid,
    'a1000000-0000-0000-0000-000000000001'::uuid,
    'cd01d968-c52e-4809-9a45-0ddd62026e73'::uuid,
    'admin',
    NOW()
  ),
  (
    'b1000000-0000-0000-0000-000000000002'::uuid,
    'a1000000-0000-0000-0000-000000000001'::uuid,
    '664e9b3c-1f0b-4fcb-ae7f-1fbb156bbc3f'::uuid,
    'underwriter',
    NOW()
  )
ON CONFLICT (org_id, user_id) DO UPDATE SET
  role = EXCLUDED.role;

-- 9.5 Sync to Legacy Workspaces Table
INSERT INTO public.workspaces (
  id, name, slug, gst, address, phone, email, owner_id, default_rules, created_at
)
VALUES (
  'a1000000-0000-0000-0000-000000000001'::uuid,
  'Capital Brokers',
  'capital-brokers',
  '07AAICA1234A1Z5',
  '706, Netaji Subhash Place, New Delhi 110034',
  '+91 11 4563 1850',
  'contact@capitalbrokers.in',
  'cd01d968-c52e-4809-9a45-0ddd62026e73'::uuid,
  '{
    "default_discretionary_discount": 10,
    "default_brokerage_share": 15,
    "auto_recommend_terrorism": false,
    "default_eq_zone": "Zone 2",
    "irda_license_no": "236",
    "cin_no": "U74999DL2003PTC119576"
  }'::jsonb,
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  owner_id = EXCLUDED.owner_id;

INSERT INTO public.workspace_members (workspace_id, user_id, role, status, joined_at)
VALUES
  (
    'a1000000-0000-0000-0000-000000000001'::uuid,
    'cd01d968-c52e-4809-9a45-0ddd62026e73'::uuid,
    'brokerage_owner',
    'active',
    NOW()
  ),
  (
    'a1000000-0000-0000-0000-000000000001'::uuid,
    '664e9b3c-1f0b-4fcb-ae7f-1fbb156bbc3f'::uuid,
    'underwriter',
    'active',
    NOW()
  )
ON CONFLICT (workspace_id, user_id) DO UPDATE SET
  role = EXCLUDED.role,
  status = EXCLUDED.status;

-- ==============================================================================
-- STEP 10: USER SIGNUP PROFILE SYNC TRIGGER
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name TEXT;
BEGIN
  v_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
  INSERT INTO public.profiles (id, name, full_name, email, is_super_admin, created_at)
  VALUES (
    NEW.id,
    v_name,
    v_name,
    NEW.email,
    FALSE,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

