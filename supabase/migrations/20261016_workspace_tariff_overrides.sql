-- ==============================================================================
-- Migration: 20261016_workspace_tariff_overrides.sql
-- Table: workspace_tariff_overrides
-- Purpose: Store per-workspace / per-user customized occupancy tariff rates
--          with AIFT / IIB compliance metadata.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.workspace_tariff_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  occupancy_code TEXT NOT NULL,
  custom_flexa_rate NUMERIC(10, 4),
  custom_loss_cost NUMERIC(10, 4),
  custom_discretionary_discount NUMERIC(5, 2),
  custom_category INTEGER CHECK (custom_category IN (1, 2, 3, 4)),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, occupancy_code)
);

CREATE INDEX IF NOT EXISTS idx_workspace_tariff_overrides_ws 
  ON public.workspace_tariff_overrides(workspace_id);

CREATE INDEX IF NOT EXISTS idx_workspace_tariff_overrides_code 
  ON public.workspace_tariff_overrides(occupancy_code);

-- Enable Row-Level Security
ALTER TABLE public.workspace_tariff_overrides ENABLE ROW LEVEL SECURITY;

-- Consolidated SELECT policy for members of the workspace
DROP POLICY IF EXISTS "workspace_members_tariff_overrides_select" ON public.workspace_tariff_overrides;
CREATE POLICY "workspace_members_tariff_overrides_select"
  ON public.workspace_tariff_overrides
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT wm.workspace_id FROM public.workspace_members wm WHERE wm.user_id = (SELECT auth.uid())
    )
  );

-- Consolidated ALL (Insert/Update/Delete) policy for privileged roles
DROP POLICY IF EXISTS "workspace_members_tariff_overrides_modify" ON public.workspace_tariff_overrides;
CREATE POLICY "workspace_members_tariff_overrides_modify"
  ON public.workspace_tariff_overrides
  FOR ALL
  USING (
    workspace_id IN (
      SELECT wm.workspace_id FROM public.workspace_members wm 
      WHERE wm.user_id = (SELECT auth.uid()) 
      AND wm.role IN ('super_admin', 'brokerage_owner', 'admin', 'underwriter')
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT wm.workspace_id FROM public.workspace_members wm 
      WHERE wm.user_id = (SELECT auth.uid()) 
      AND wm.role IN ('super_admin', 'brokerage_owner', 'admin', 'underwriter')
    )
  );
