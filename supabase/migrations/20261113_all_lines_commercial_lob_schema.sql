-- ==============================================================================
-- MIGRATION: 20261113_all_lines_commercial_lob_schema.sql
-- PURPOSE: Master All-Lines Commercial LOB Schema & Motor/Fleet Auxiliary Table
-- MILESTONES: M12 (Motor & Fleet) through M17 (Specialty Lines)
-- ==============================================================================

-- 1. RELAX FIRE-SPECIFIC NOT-NULL CONSTRAINTS ON QUOTES
ALTER TABLE public.quotes 
  ALTER COLUMN occupation_code DROP NOT NULL,
  ALTER COLUMN occupation_code SET DEFAULT 'N/A',
  ALTER COLUMN occupation_description DROP NOT NULL,
  ALTER COLUMN occupation_description SET DEFAULT 'Commercial Insurance Line',
  ALTER COLUMN eq_zone DROP NOT NULL,
  ALTER COLUMN eq_zone SET DEFAULT 'N/A';

-- 2. ADD LOB_CATEGORY AND CHECK CONSTRAINT (7 COMMERCIAL DOMAINS)
ALTER TABLE public.quotes 
  ADD COLUMN IF NOT EXISTS lob_category TEXT DEFAULT 'property' NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'quotes_lob_category_check'
  ) THEN
    ALTER TABLE public.quotes 
      ADD CONSTRAINT quotes_lob_category_check 
      CHECK (lob_category IN ('property', 'motor', 'marine', 'engineering', 'liability', 'benefits', 'specialty'));
  END IF;
END $$;

-- 3. ADD INSURANCE_LINE AND CHECK CONSTRAINT (27 SPECIALIZED COMMERCIAL LINES)
ALTER TABLE public.quotes 
  ADD COLUMN IF NOT EXISTS insurance_line TEXT DEFAULT 'fire' NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'quotes_insurance_line_check'
  ) THEN
    ALTER TABLE public.quotes 
      ADD CONSTRAINT quotes_insurance_line_check 
      CHECK (insurance_line IN (
        -- Property & Assets
        'fire', 'business_interruption', 'burglary', 'iar',
        -- Motor & Fleet
        'motor_fleet', 'motor_gcv', 'motor_pcv', 'motor_misc',
        -- Marine & Logistics
        'marine_cargo_inland', 'marine_cargo_ocean', 'marine_open_policy', 'marine_hull',
        -- Engineering & Projects
        'car', 'ear', 'mb', 'eei', 'bpp',
        -- Corporate Liability & Casualty
        'cgl', 'public_liability', 'product_liability', 'pi', 'do', 'cyber', 'crime_fidelity',
        -- Employee Benefits & Group Life
        'ghi', 'gpa', 'wc', 'gtli', 'keyman',
        -- Specialty & Financial
        'surety_bond', 'trade_credit', 'environmental_liability'
      ));
  END IF;
END $$;

-- 4. ADD LINE-AGNOSTIC RISK DETAILS & POLICY LIFECYCLE FIELDS
ALTER TABLE public.quotes 
  ADD COLUMN IF NOT EXISTS risk_details JSONB DEFAULT '{}'::jsonb NOT NULL,
  ADD COLUMN IF NOT EXISTS policy_number TEXT,
  ADD COLUMN IF NOT EXISTS policy_start_date DATE,
  ADD COLUMN IF NOT EXISTS policy_end_date DATE,
  ADD COLUMN IF NOT EXISTS tpa_name TEXT,
  ADD COLUMN IF NOT EXISTS co_insurance JSONB DEFAULT '[]'::jsonb;

-- 5. PERFORMANCE INDEXES FOR QUOTES
CREATE INDEX IF NOT EXISTS idx_quotes_lob_category ON public.quotes (lob_category);
CREATE INDEX IF NOT EXISTS idx_quotes_insurance_line ON public.quotes (insurance_line);
CREATE INDEX IF NOT EXISTS idx_quotes_policy_number ON public.quotes (policy_number) WHERE policy_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_quotes_policy_dates ON public.quotes (policy_start_date, policy_end_date);

-- ==============================================================================
-- 6. AUXILIARY TABLE: FLEET VEHICLES (MILESTONE 12)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.fleet_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Vehicle Identification
  reg_number TEXT NOT NULL,
  chassis_number TEXT,
  engine_number TEXT,
  make_model_variant TEXT NOT NULL,
  manufacturing_year INTEGER NOT NULL,
  registration_date DATE,
  
  -- Rating Dimensions
  vehicle_class TEXT NOT NULL CHECK (vehicle_class IN ('gcv', 'pcv', 'misc_construction', 'private_commercial')),
  sub_category TEXT NOT NULL,
  gvw_kg NUMERIC(10, 2),
  seating_capacity INTEGER,
  cubic_capacity_cc NUMERIC(8, 2),
  rto_zone TEXT NOT NULL CHECK (rto_zone IN ('Zone A', 'Zone B', 'Zone C')),
  
  -- Valuation & IDV
  idv_vehicle NUMERIC(15, 2) NOT NULL,
  idv_trailer NUMERIC(15, 2) DEFAULT 0,
  idv_electrical_accessories NUMERIC(15, 2) DEFAULT 0,
  idv_non_electrical_accessories NUMERIC(15, 2) DEFAULT 0,
  idv_cng_lpg_kit NUMERIC(15, 2) DEFAULT 0,
  total_idv NUMERIC(15, 2) NOT NULL,
  
  -- Endorsements & Rating Adjustments
  imt_endorsements JSONB DEFAULT '[]'::jsonb,
  ncb_percentage NUMERIC(5, 2) DEFAULT 0 CHECK (ncb_percentage >= 0 AND ncb_percentage <= 50),
  
  -- Computed Premium Breakdown
  basic_od_premium NUMERIC(12, 2) NOT NULL,
  add_on_premium NUMERIC(12, 2) DEFAULT 0,
  ncb_discount_amount NUMERIC(12, 2) DEFAULT 0,
  net_od_premium NUMERIC(12, 2) NOT NULL,
  statutory_tp_premium NUMERIC(12, 2) NOT NULL,
  tp_add_on_premium NUMERIC(12, 2) DEFAULT 0,
  net_tp_premium NUMERIC(12, 2) NOT NULL,
  total_net_premium NUMERIC(12, 2) NOT NULL,
  gst_amount NUMERIC(12, 2) NOT NULL,
  total_gross_premium NUMERIC(12, 2) NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Performance Indexes for Fleet Vehicles
CREATE INDEX IF NOT EXISTS idx_fleet_vehicles_quote_id ON public.fleet_vehicles (quote_id);
CREATE INDEX IF NOT EXISTS idx_fleet_vehicles_workspace_id ON public.fleet_vehicles (workspace_id);
CREATE INDEX IF NOT EXISTS idx_fleet_vehicles_org_id ON public.fleet_vehicles (org_id);
CREATE INDEX IF NOT EXISTS idx_fleet_vehicles_reg_number ON public.fleet_vehicles (reg_number);

-- ==============================================================================
-- 7. ROW LEVEL SECURITY ON FLEET VEHICLES
-- Strictly mirrors public.quotes multi-tenant isolation pattern
-- ==============================================================================
ALTER TABLE public.fleet_vehicles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fleet_vehicles_select" ON public.fleet_vehicles;
CREATE POLICY "fleet_vehicles_select" ON public.fleet_vehicles
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

DROP POLICY IF EXISTS "fleet_vehicles_insert" ON public.fleet_vehicles;
CREATE POLICY "fleet_vehicles_insert" ON public.fleet_vehicles
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

DROP POLICY IF EXISTS "fleet_vehicles_update" ON public.fleet_vehicles;
CREATE POLICY "fleet_vehicles_update" ON public.fleet_vehicles
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

DROP POLICY IF EXISTS "fleet_vehicles_delete" ON public.fleet_vehicles;
CREATE POLICY "fleet_vehicles_delete" ON public.fleet_vehicles
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
