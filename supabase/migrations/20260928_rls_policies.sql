-- ==============================================================================
-- QUOTELY MULTI-TENANT ROW LEVEL SECURITY (RLS) POLICIES
-- Fixed: Helper functions moved to public schema (auth schema is restricted)
-- ==============================================================================

-- 1. Helper function: Check if current user is Platform Super Admin
CREATE OR REPLACE FUNCTION public.is_platform_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.user_id = auth.uid()
      AND wm.role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Helper function: Get user's enrolled workspace_ids  
CREATE OR REPLACE FUNCTION public.get_user_workspaces()
RETURNS SETOF UUID AS $$
BEGIN
  RETURN QUERY
  SELECT wm.workspace_id
  FROM public.workspace_members wm
  WHERE wm.user_id = auth.uid()
    AND wm.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- PROFILES RLS
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles
FOR SELECT USING (
  id = auth.uid()
  OR public.is_platform_super_admin()
  OR id IN (
    SELECT wm.user_id
    FROM public.workspace_members wm
    WHERE wm.workspace_id IN (SELECT public.get_user_workspaces())
  )
);

DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
CREATE POLICY "profiles_insert_policy" ON public.profiles
FOR INSERT WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy" ON public.profiles
FOR UPDATE USING (id = auth.uid() OR public.is_platform_super_admin());

-- ==============================================================================
-- WORKSPACES RLS
-- ==============================================================================
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workspaces_select_policy" ON public.workspaces;
CREATE POLICY "workspaces_select_policy" ON public.workspaces
FOR SELECT USING (
  public.is_workspace_member(id) OR public.is_platform_super_admin()
);

DROP POLICY IF EXISTS "workspaces_insert_policy" ON public.workspaces;
CREATE POLICY "workspaces_insert_policy" ON public.workspaces
FOR INSERT WITH CHECK (owner_id = auth.uid() OR public.is_platform_super_admin());

DROP POLICY IF EXISTS "workspaces_update_policy" ON public.workspaces;
CREATE POLICY "workspaces_update_policy" ON public.workspaces
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = id
    AND user_id = auth.uid()
    AND role IN ('brokerage_owner', 'admin', 'super_admin')
  )
  OR public.is_platform_super_admin()
);

-- ==============================================================================
-- WORKSPACE MEMBERS RLS
-- ==============================================================================
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workspace_members_select_policy" ON public.workspace_members;
CREATE POLICY "workspace_members_select_policy" ON public.workspace_members
FOR SELECT USING (
  public.is_workspace_member(workspace_id) OR public.is_platform_super_admin()
);

DROP POLICY IF EXISTS "workspace_members_all_policy" ON public.workspace_members;
CREATE POLICY "workspace_members_all_policy" ON public.workspace_members
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members wm2
    WHERE wm2.workspace_id = workspace_members.workspace_id
    AND wm2.user_id = auth.uid()
    AND wm2.role IN ('brokerage_owner', 'admin', 'super_admin')
  )
  OR public.is_platform_super_admin()
);

-- ==============================================================================
-- CLIENTS RLS
-- ==============================================================================
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clients_all_policy" ON public.clients;
CREATE POLICY "clients_all_policy" ON public.clients
FOR ALL USING (
  public.is_workspace_member(workspace_id) OR public.is_platform_super_admin()
);

-- ==============================================================================
-- QUOTES RLS
-- ==============================================================================
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quotes_all_policy" ON public.quotes;
CREATE POLICY "quotes_all_policy" ON public.quotes
FOR ALL USING (
  public.is_workspace_member(workspace_id) OR public.is_platform_super_admin()
);

-- ==============================================================================
-- UPLOADED DOCUMENTS RLS
-- ==============================================================================
ALTER TABLE public.uploaded_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "uploaded_documents_all_policy" ON public.uploaded_documents;
CREATE POLICY "uploaded_documents_all_policy" ON public.uploaded_documents
FOR ALL USING (
  public.is_workspace_member(workspace_id) OR public.is_platform_super_admin()
);

-- ==============================================================================
-- AUDIT LOGS RLS
-- ==============================================================================
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_select_policy" ON public.audit_logs;
CREATE POLICY "audit_logs_select_policy" ON public.audit_logs
FOR SELECT USING (
  public.is_workspace_member(workspace_id) OR public.is_platform_super_admin()
);

DROP POLICY IF EXISTS "audit_logs_insert_policy" ON public.audit_logs;
CREATE POLICY "audit_logs_insert_policy" ON public.audit_logs
FOR INSERT WITH CHECK (
  public.is_workspace_member(workspace_id)
);

-- ==============================================================================
-- AI REQUESTS RLS
-- ==============================================================================
ALTER TABLE public.ai_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_requests_select_policy" ON public.ai_requests;
CREATE POLICY "ai_requests_select_policy" ON public.ai_requests
FOR SELECT USING (
  public.is_workspace_member(workspace_id) OR public.is_platform_super_admin()
);

DROP POLICY IF EXISTS "ai_requests_insert_policy" ON public.ai_requests;
CREATE POLICY "ai_requests_insert_policy" ON public.ai_requests
FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id));

-- ==============================================================================
-- WORKSPACE INVITATIONS RLS
-- ==============================================================================
ALTER TABLE public.workspace_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invitations_all_policy" ON public.workspace_invitations;
CREATE POLICY "invitations_all_policy" ON public.workspace_invitations
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = workspace_invitations.workspace_id
    AND user_id = auth.uid()
    AND role IN ('brokerage_owner', 'admin', 'super_admin')
  )
  OR public.is_platform_super_admin()
);
