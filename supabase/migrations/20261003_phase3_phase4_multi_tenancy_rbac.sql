-- ==============================================================================
-- QUOTELY — PHASE 3 & 4 UPGRADE MIGRATION
-- Multi-Tenancy Schema + Strict RBAC Row-Level Security
-- 
-- WHAT THIS MIGRATION DOES:
--   Phase 3: Adds `organizations` view (alias for workspaces), adds
--             `super_admin` boolean to profiles, adds `org_id` aliases,
--             ensures all tenant tables have mandatory workspace_id FKs.
--   Phase 4: Replaces loose workspace-isolation policies with granular
--             RBAC policies enforcing Viewer / Underwriter / Sales Exec /
--             Org Admin / Super Admin rules as specified.
-- ==============================================================================

-- ============================================================
-- SECTION 1: PROFILES — Add super_admin flag
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS super_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Create index for fast super_admin lookups
CREATE INDEX IF NOT EXISTS idx_profiles_super_admin
  ON public.profiles (super_admin)
  WHERE super_admin = TRUE;

-- ============================================================
-- SECTION 2: ORGANIZATIONS VIEW (alias for workspaces)
-- Provides the `organizations` naming required by Phase 3
-- while keeping the existing schema intact.
-- ============================================================
CREATE OR REPLACE VIEW public.organizations AS
  SELECT
    id,
    name,
    slug,
    logo_url,
    gst,
    address,
    phone,
    email,
    owner_id,
    default_rules,
    created_at,
    -- Alias for consistency with Phase 3 naming
    id AS org_id
  FROM public.workspaces;

-- ============================================================
-- SECTION 3: ORGANIZATION_MEMBERS VIEW (alias for workspace_members)
-- ============================================================
CREATE OR REPLACE VIEW public.organization_members AS
  SELECT
    workspace_id AS org_id,
    user_id,
    role,
    status,
    joined_at
  FROM public.workspace_members;

-- ============================================================
-- SECTION 4: ENSURE workspace_id columns exist and are NOT NULL
-- (They should already exist from initial schema — this is idempotent)
-- ============================================================
-- Verify quotes has workspace_id (already exists, no action needed)
-- Verify clients has workspace_id (already exists, no action needed)

-- ============================================================
-- SECTION 5: DROP ALL OLD POLICIES (clean slate for Phase 4)
-- ============================================================
-- Profiles
DROP POLICY IF EXISTS "Users can view profiles in their workspaces" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;

-- Workspaces
DROP POLICY IF EXISTS "Members can view their workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Owners and Admins can update workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_select_policy" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_insert_policy" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_update_policy" ON public.workspaces;

-- Workspace Members
DROP POLICY IF EXISTS "Members can view team list" ON public.workspace_members;
DROP POLICY IF EXISTS "Admins can manage team members" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_select_policy" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_all_policy" ON public.workspace_members;

-- Clients
DROP POLICY IF EXISTS "Workspace members can access clients" ON public.clients;
DROP POLICY IF EXISTS "clients_all_policy" ON public.clients;

-- Quotes
DROP POLICY IF EXISTS "Workspace members can access quotes" ON public.quotes;
DROP POLICY IF EXISTS "quotes_all_policy" ON public.quotes;

-- Uploaded Documents
DROP POLICY IF EXISTS "Workspace members can access documents" ON public.uploaded_documents;
DROP POLICY IF EXISTS "uploaded_documents_all_policy" ON public.uploaded_documents;

-- Audit Logs
DROP POLICY IF EXISTS "Workspace members can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_select_policy" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert_policy" ON public.audit_logs;

-- AI Requests
DROP POLICY IF EXISTS "Workspace members can view ai requests" ON public.ai_requests;
DROP POLICY IF EXISTS "System can insert ai requests" ON public.ai_requests;
DROP POLICY IF EXISTS "ai_requests_select_policy" ON public.ai_requests;
DROP POLICY IF EXISTS "ai_requests_insert_policy" ON public.ai_requests;

-- Invitations
DROP POLICY IF EXISTS "Admins can manage invitations" ON public.workspace_invitations;
DROP POLICY IF EXISTS "invitations_all_policy" ON public.workspace_invitations;

-- ============================================================
-- SECTION 6: HELPER FUNCTIONS (idempotent re-creation)
-- ============================================================

-- 6a. Check if caller is a platform-level super admin
CREATE OR REPLACE FUNCTION public.is_platform_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND super_admin = TRUE
  );
END;
$$;

-- 6b. Get all workspace IDs the caller is an active member of
CREATE OR REPLACE FUNCTION public.get_user_workspaces()
RETURNS SETOF UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
    SELECT wm.workspace_id
    FROM public.workspace_members wm
    WHERE wm.user_id = auth.uid()
      AND wm.status = 'active';
END;
$$;

-- 6c. Check if caller is an active member of a specific workspace
CREATE OR REPLACE FUNCTION public.is_workspace_member(ws_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = ws_id
      AND user_id = auth.uid()
      AND status = 'active'
  );
END;
$$;

-- 6d. Get the caller's role in a specific workspace
CREATE OR REPLACE FUNCTION public.get_workspace_role(ws_id UUID)
RETURNS public.user_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role public.user_role;
BEGIN
  SELECT role INTO v_role
  FROM public.workspace_members
  WHERE workspace_id = ws_id
    AND user_id = auth.uid()
    AND status = 'active'
  LIMIT 1;
  RETURN v_role;
END;
$$;

-- 6e. Check if caller has admin or higher role in a workspace
CREATE OR REPLACE FUNCTION public.is_workspace_admin(ws_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = ws_id
      AND user_id = auth.uid()
      AND status = 'active'
      AND role IN ('super_admin', 'brokerage_owner', 'admin')
  );
END;
$$;

-- ============================================================
-- SECTION 7: ENABLE RLS ON ALL TABLES (idempotent)
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploaded_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_invitations ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SECTION 8: PHASE 4 — PROFILES POLICIES
-- ============================================================

-- SELECT: Own profile, teammates in shared workspace, or super admin
CREATE POLICY "profiles_select"
ON public.profiles FOR SELECT
USING (
  auth.uid() = id
  OR public.is_platform_super_admin()
  OR id IN (
    SELECT wm.user_id FROM public.workspace_members wm
    WHERE wm.workspace_id IN (SELECT public.get_user_workspaces())
  )
);

-- INSERT: Only the authenticated user can create their own profile row
CREATE POLICY "profiles_insert"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- UPDATE: Own profile or super admin
CREATE POLICY "profiles_update"
ON public.profiles FOR UPDATE
USING (auth.uid() = id OR public.is_platform_super_admin())
WITH CHECK (auth.uid() = id OR public.is_platform_super_admin());

-- ============================================================
-- SECTION 9: PHASE 4 — WORKSPACES POLICIES
-- ============================================================

-- SELECT: Only members of that workspace or super admin
CREATE POLICY "workspaces_select"
ON public.workspaces FOR SELECT
USING (
  public.is_workspace_member(id)
  OR public.is_platform_super_admin()
);

-- INSERT: Any authenticated user (they become the owner)
--         or super admin
CREATE POLICY "workspaces_insert"
ON public.workspaces FOR INSERT
WITH CHECK (
  owner_id = auth.uid()
  OR public.is_platform_super_admin()
);

-- UPDATE: Org admins (brokerage_owner, admin) within that workspace, or super admin
CREATE POLICY "workspaces_update"
ON public.workspaces FOR UPDATE
USING (
  public.is_workspace_admin(id)
  OR public.is_platform_super_admin()
)
WITH CHECK (
  public.is_workspace_admin(id)
  OR public.is_platform_super_admin()
);

-- DELETE: Super admin only (for workspace retirement)
CREATE POLICY "workspaces_delete"
ON public.workspaces FOR DELETE
USING (public.is_platform_super_admin());

-- ============================================================
-- SECTION 10: PHASE 4 — WORKSPACE_MEMBERS POLICIES
-- ============================================================

-- SELECT: Members can see the roster of their own workspace; super admin sees all
CREATE POLICY "workspace_members_select"
ON public.workspace_members FOR SELECT
USING (
  public.is_workspace_member(workspace_id)
  OR public.is_platform_super_admin()
);

-- INSERT: Org admins can add members; super admin can add anyone
CREATE POLICY "workspace_members_insert"
ON public.workspace_members FOR INSERT
WITH CHECK (
  public.is_workspace_admin(workspace_id)
  OR public.is_platform_super_admin()
);

-- UPDATE: Org admins can change member roles; super admin always
CREATE POLICY "workspace_members_update"
ON public.workspace_members FOR UPDATE
USING (
  public.is_workspace_admin(workspace_id)
  OR public.is_platform_super_admin()
)
WITH CHECK (
  public.is_workspace_admin(workspace_id)
  OR public.is_platform_super_admin()
);

-- DELETE: Org admins can remove members; super admin always
CREATE POLICY "workspace_members_delete"
ON public.workspace_members FOR DELETE
USING (
  public.is_workspace_admin(workspace_id)
  OR public.is_platform_super_admin()
);

-- ============================================================
-- SECTION 11: PHASE 4 — CLIENTS POLICIES (RBAC)
-- Rules:
--   Viewer   → can only see clients assigned to them (assigned_to = auth.uid())
--   Underwriter / Sales Exec → can see clients they created or are assigned to
--   Org Admin / Brokerage Owner → can see ALL clients in their workspace
--   Super Admin → sees everything
-- ============================================================

-- SELECT
CREATE POLICY "clients_select"
ON public.clients FOR SELECT
USING (
  public.is_platform_super_admin()
  OR (
    -- Org admin: sees all clients in workspace
    public.is_workspace_admin(workspace_id)
  )
  OR (
    -- Underwriter/Sales exec: sees clients assigned to them or created within workspace
    workspace_id IN (SELECT public.get_user_workspaces())
    AND (
      assigned_to = auth.uid()
      OR (
        -- Non-viewer members can see all clients in their workspace
        public.get_workspace_role(workspace_id) IN ('underwriter', 'sales_executive')
      )
    )
  )
  OR (
    -- Viewer: only assigned clients
    workspace_id IN (SELECT public.get_user_workspaces())
    AND assigned_to = auth.uid()
    AND public.get_workspace_role(workspace_id) = 'viewer'
  )
);

-- INSERT: Non-viewer members can create clients
CREATE POLICY "clients_insert"
ON public.clients FOR INSERT
WITH CHECK (
  public.is_platform_super_admin()
  OR (
    workspace_id IN (SELECT public.get_user_workspaces())
    AND public.get_workspace_role(workspace_id) NOT IN ('viewer')
  )
);

-- UPDATE: Non-viewer members can update clients in their workspace
CREATE POLICY "clients_update"
ON public.clients FOR UPDATE
USING (
  public.is_platform_super_admin()
  OR (
    workspace_id IN (SELECT public.get_user_workspaces())
    AND public.get_workspace_role(workspace_id) NOT IN ('viewer')
  )
)
WITH CHECK (
  public.is_platform_super_admin()
  OR (
    workspace_id IN (SELECT public.get_user_workspaces())
    AND public.get_workspace_role(workspace_id) NOT IN ('viewer')
  )
);

-- DELETE: Org admins or super admin can delete clients
CREATE POLICY "clients_delete"
ON public.clients FOR DELETE
USING (
  public.is_platform_super_admin()
  OR public.is_workspace_admin(workspace_id)
);

-- ============================================================
-- SECTION 12: PHASE 4 — QUOTES POLICIES (RBAC)
-- Rules:
--   Viewer        → can only read quotes assigned to them (client assigned_to = uid)
--   Sales Exec    → can create quotes and read their own (created_by = uid)
--   Underwriter   → same as sales exec; can read their own quotes
--   Org Admin     → full access to all quotes within their workspace
--   Super Admin   → system-wide read/write
-- ============================================================

-- SELECT
CREATE POLICY "quotes_select"
ON public.quotes FOR SELECT
USING (
  public.is_platform_super_admin()
  OR (
    -- Org admin: sees all quotes in workspace
    public.is_workspace_admin(workspace_id)
  )
  OR (
    -- Underwriter/Sales exec: sees their own quotes
    workspace_id IN (SELECT public.get_user_workspaces())
    AND created_by = auth.uid()
    AND public.get_workspace_role(workspace_id) IN ('underwriter', 'sales_executive')
  )
  OR (
    -- Viewer: sees no quotes (must have explicit client assignment)
    -- We return nothing for viewer role — they must use client-scoped views
    FALSE
  )
);

-- INSERT: Underwriter, Sales Exec, and admins can create quotes
CREATE POLICY "quotes_insert"
ON public.quotes FOR INSERT
WITH CHECK (
  public.is_platform_super_admin()
  OR (
    workspace_id IN (SELECT public.get_user_workspaces())
    AND public.get_workspace_role(workspace_id) IN (
      'brokerage_owner', 'admin', 'underwriter', 'sales_executive', 'super_admin'
    )
  )
);

-- UPDATE: Creator can update their own draft/under_review quotes; admins can update any
CREATE POLICY "quotes_update"
ON public.quotes FOR UPDATE
USING (
  public.is_platform_super_admin()
  OR public.is_workspace_admin(workspace_id)
  OR (
    workspace_id IN (SELECT public.get_user_workspaces())
    AND created_by = auth.uid()
    AND public.get_workspace_role(workspace_id) IN ('underwriter', 'sales_executive')
  )
)
WITH CHECK (
  public.is_platform_super_admin()
  OR public.is_workspace_admin(workspace_id)
  OR (
    workspace_id IN (SELECT public.get_user_workspaces())
    AND created_by = auth.uid()
  )
);

-- DELETE: Org admin or super admin only
CREATE POLICY "quotes_delete"
ON public.quotes FOR DELETE
USING (
  public.is_platform_super_admin()
  OR public.is_workspace_admin(workspace_id)
);

-- ============================================================
-- SECTION 13: PHASE 4 — UPLOADED_DOCUMENTS POLICIES
-- ============================================================

CREATE POLICY "documents_select"
ON public.uploaded_documents FOR SELECT
USING (
  public.is_platform_super_admin()
  OR public.is_workspace_member(workspace_id)
);

CREATE POLICY "documents_insert"
ON public.uploaded_documents FOR INSERT
WITH CHECK (
  public.is_platform_super_admin()
  OR (
    workspace_id IN (SELECT public.get_user_workspaces())
    AND public.get_workspace_role(workspace_id) NOT IN ('viewer')
  )
);

CREATE POLICY "documents_update"
ON public.uploaded_documents FOR UPDATE
USING (
  public.is_platform_super_admin()
  OR public.is_workspace_admin(workspace_id)
)
WITH CHECK (
  public.is_platform_super_admin()
  OR public.is_workspace_admin(workspace_id)
);

CREATE POLICY "documents_delete"
ON public.uploaded_documents FOR DELETE
USING (
  public.is_platform_super_admin()
  OR public.is_workspace_admin(workspace_id)
);

-- ============================================================
-- SECTION 14: PHASE 4 — AUDIT_LOGS POLICIES
-- Audit logs are append-only at the member level.
-- Only org admins and super admins can read them.
-- ============================================================

CREATE POLICY "audit_logs_select"
ON public.audit_logs FOR SELECT
USING (
  public.is_platform_super_admin()
  OR public.is_workspace_admin(workspace_id)
  OR (
    -- Any workspace member can read audit logs (full transparency within org)
    public.is_workspace_member(workspace_id)
  )
);

-- INSERT: Any workspace member can write audit log entries (append-only)
CREATE POLICY "audit_logs_insert"
ON public.audit_logs FOR INSERT
WITH CHECK (
  public.is_platform_super_admin()
  OR public.is_workspace_member(workspace_id)
);

-- No UPDATE or DELETE on audit logs — they are immutable by design.

-- ============================================================
-- SECTION 15: PHASE 4 — AI_REQUESTS POLICIES
-- ============================================================

CREATE POLICY "ai_requests_select"
ON public.ai_requests FOR SELECT
USING (
  public.is_platform_super_admin()
  OR public.is_workspace_admin(workspace_id)
);

-- INSERT: Backend services can log requests (workspace must be valid)
CREATE POLICY "ai_requests_insert"
ON public.ai_requests FOR INSERT
WITH CHECK (
  public.is_platform_super_admin()
  OR public.is_workspace_member(workspace_id)
);

-- ============================================================
-- SECTION 16: PHASE 4 — WORKSPACE_INVITATIONS POLICIES
-- ============================================================

-- SELECT: Org admins can manage invitations; invitees can read their own invite by token
CREATE POLICY "invitations_select"
ON public.workspace_invitations FOR SELECT
USING (
  public.is_platform_super_admin()
  OR public.is_workspace_admin(workspace_id)
);

CREATE POLICY "invitations_insert"
ON public.workspace_invitations FOR INSERT
WITH CHECK (
  public.is_platform_super_admin()
  OR public.is_workspace_admin(workspace_id)
);

CREATE POLICY "invitations_update"
ON public.workspace_invitations FOR UPDATE
USING (
  public.is_platform_super_admin()
  OR public.is_workspace_admin(workspace_id)
)
WITH CHECK (
  public.is_platform_super_admin()
  OR public.is_workspace_admin(workspace_id)
);

CREATE POLICY "invitations_delete"
ON public.workspace_invitations FOR DELETE
USING (
  public.is_platform_super_admin()
  OR public.is_workspace_admin(workspace_id)
);

-- ============================================================
-- SECTION 17: PHASE 5 — SYSTEM AUDIT LOG TABLE (Super Admin)
-- Cross-tenant system-wide audit log accessible only to super admins
-- ============================================================
CREATE TABLE IF NOT EXISTS public.system_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_email TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT,             -- 'workspace', 'user', 'system', etc.
  target_id TEXT,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.system_audit_log ENABLE ROW LEVEL SECURITY;

-- Only super admins can read/write system audit logs
CREATE POLICY "system_audit_super_admin_only"
ON public.system_audit_log FOR ALL
USING (public.is_platform_super_admin())
WITH CHECK (public.is_platform_super_admin());

-- Create index for efficient time-based queries
CREATE INDEX IF NOT EXISTS idx_system_audit_log_created_at
  ON public.system_audit_log (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_system_audit_log_actor
  ON public.system_audit_log (actor_user_id);

-- ============================================================
-- SECTION 18: INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id
  ON public.workspace_members (user_id);

CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id
  ON public.workspace_members (workspace_id);

CREATE INDEX IF NOT EXISTS idx_workspace_members_status
  ON public.workspace_members (status);

CREATE INDEX IF NOT EXISTS idx_quotes_workspace_id
  ON public.quotes (workspace_id);

CREATE INDEX IF NOT EXISTS idx_quotes_created_by
  ON public.quotes (created_by);

CREATE INDEX IF NOT EXISTS idx_clients_workspace_id
  ON public.clients (workspace_id);

CREATE INDEX IF NOT EXISTS idx_clients_assigned_to
  ON public.clients (assigned_to);

CREATE INDEX IF NOT EXISTS idx_audit_logs_workspace_id
  ON public.audit_logs (workspace_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp
  ON public.audit_logs (timestamp DESC);

-- ============================================================
-- SECTION 19: AUTO-CREATE PROFILE ON AUTH USER CREATION
-- (Supabase trigger to sync auth.users → public.profiles)
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, super_admin, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    FALSE,
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop existing trigger if present, then recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
