-- ============================================
-- TAX INFRASTRUCTURE SCHEMA V2
-- Updated to support state-level tax rules
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Create Tax Jurisdictions Table (Zip Code → Tax Rate mapping)
CREATE TABLE IF NOT EXISTS public.tax_jurisdictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zip_code TEXT UNIQUE NOT NULL,
  state_code TEXT NOT NULL,
  city TEXT NOT NULL,
  total_rate DECIMAL(5, 4) NOT NULL DEFAULT 0, -- e.g., 0.0950 for 9.5%
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tax_jurisdictions_zip ON public.tax_jurisdictions(zip_code);
CREATE INDEX IF NOT EXISTS idx_tax_jurisdictions_state ON public.tax_jurisdictions(state_code);

-- 2. Create Tax Rules Table (State-level category rules)
-- Each state has one set of rules that apply to all zip codes in that state
CREATE TABLE IF NOT EXISTS public.tax_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_code TEXT NOT NULL, -- e.g., 'CA', 'NY', 'TX'
  category TEXT NOT NULL, -- e.g., 'Produce', 'Beverages', 'Snacks'
  is_taxable BOOLEAN DEFAULT TRUE,
  crv_rate DECIMAL(4, 2) DEFAULT 0, -- e.g., 0.05 or 0.10 (flat fee per container)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(state_code, category) -- One rule per category per state
);

CREATE INDEX IF NOT EXISTS idx_tax_rules_state ON public.tax_rules(state_code);
CREATE INDEX IF NOT EXISTS idx_tax_rules_state_category ON public.tax_rules(state_code, category);

-- 3. Enable RLS
ALTER TABLE public.tax_jurisdictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_rules ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Allow public read access (authenticated and anon)
DROP POLICY IF EXISTS "Public read tax jurisdictions" ON public.tax_jurisdictions;
CREATE POLICY "Public read tax jurisdictions"
ON public.tax_jurisdictions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read tax rules" ON public.tax_rules;
CREATE POLICY "Public read tax rules"
ON public.tax_rules FOR SELECT USING (true);

-- Allow authenticated users to insert (for seeding/admin purposes)
DROP POLICY IF EXISTS "Authenticated insert tax jurisdictions" ON public.tax_jurisdictions;
CREATE POLICY "Authenticated insert tax jurisdictions"
ON public.tax_jurisdictions FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated insert tax rules" ON public.tax_rules;
CREATE POLICY "Authenticated insert tax rules"
ON public.tax_rules FOR INSERT TO authenticated WITH CHECK (true);

-- Allow authenticated users to update
DROP POLICY IF EXISTS "Authenticated update tax jurisdictions" ON public.tax_jurisdictions;
CREATE POLICY "Authenticated update tax jurisdictions"
ON public.tax_jurisdictions FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated update tax rules" ON public.tax_rules;
CREATE POLICY "Authenticated update tax rules"
ON public.tax_rules FOR UPDATE TO authenticated USING (true);

-- 5. Sample Data (Beverly Hills 90210)
INSERT INTO public.tax_jurisdictions (zip_code, state_code, city, total_rate)
VALUES ('90210', 'CA', 'Beverly Hills', 0.0950)
ON CONFLICT (zip_code) DO NOTHING;

-- Sample CA tax rules (applied to all CA zip codes)
INSERT INTO public.tax_rules (state_code, category, is_taxable, crv_rate)
VALUES 
  ('CA', 'Produce', FALSE, 0),
  ('CA', 'Meat', FALSE, 0),
  ('CA', 'Seafood', FALSE, 0),
  ('CA', 'Dairy', FALSE, 0),
  ('CA', 'Bakery', FALSE, 0),
  ('CA', 'Frozen', FALSE, 0),
  ('CA', 'Pantry', FALSE, 0),
  ('CA', 'Condiments', FALSE, 0),
  ('CA', 'Beverages', TRUE, 0.05), -- Taxable with CRV
  ('CA', 'Snacks', TRUE, 0),
  ('CA', 'Prepared Food', TRUE, 0),
  ('CA', 'Household', TRUE, 0),
  ('CA', 'Personal Care', TRUE, 0),
  ('CA', 'Baby', TRUE, 0),
  ('CA', 'Pet', TRUE, 0),
  ('CA', 'Other', TRUE, 0)
ON CONFLICT (state_code, category) DO NOTHING;
