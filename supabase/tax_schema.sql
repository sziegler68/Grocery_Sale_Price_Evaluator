-- ============================================
-- TAX INFRASTRUCTURE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Create Tax Jurisdictions Table
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

-- 2. Create Tax Rules Table (for exceptions and CRV)
CREATE TABLE IF NOT EXISTS public.tax_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction_id UUID REFERENCES public.tax_jurisdictions(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- e.g., 'Groceries', 'Soda', 'Alcohol'
  is_taxable BOOLEAN DEFAULT TRUE,
  crv_rate DECIMAL(4, 2) DEFAULT 0, -- e.g., 0.05 or 0.10
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tax_rules_jurisdiction ON public.tax_rules(jurisdiction_id);
CREATE INDEX IF NOT EXISTS idx_tax_rules_category ON public.tax_rules(jurisdiction_id, category);

-- 3. Enable RLS
ALTER TABLE public.tax_jurisdictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_rules ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Allow public read access (authenticated and anon)
CREATE POLICY "Public read tax jurisdictions"
ON public.tax_jurisdictions FOR SELECT USING (true);

CREATE POLICY "Public read tax rules"
ON public.tax_rules FOR SELECT USING (true);

-- Allow authenticated users to insert (for seeding/admin purposes, or if we allow crowdsourcing later)
CREATE POLICY "Authenticated insert tax jurisdictions"
ON public.tax_jurisdictions FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated insert tax rules"
ON public.tax_rules FOR INSERT TO authenticated WITH CHECK (true);

-- 5. Seed Data (Example: Beverly Hills 90210)
INSERT INTO public.tax_jurisdictions (zip_code, state_code, city, total_rate)
VALUES ('90210', 'CA', 'Beverly Hills', 0.0950)
ON CONFLICT (zip_code) DO NOTHING;

-- Seed Rules for 90210 (California rules approximation)
DO $$
DECLARE
  jurisdiction_id UUID;
BEGIN
  SELECT id INTO jurisdiction_id FROM public.tax_jurisdictions WHERE zip_code = '90210';
  
  IF jurisdiction_id IS NOT NULL THEN
    -- Groceries are generally exempt in CA
    INSERT INTO public.tax_rules (jurisdiction_id, category, is_taxable, crv_rate)
    VALUES (jurisdiction_id, 'Groceries', FALSE, 0);

    -- Alcohol is taxable
    INSERT INTO public.tax_rules (jurisdiction_id, category, is_taxable, crv_rate)
    VALUES (jurisdiction_id, 'Alcohol', TRUE, 0);
    
    -- Soda has CRV
    INSERT INTO public.tax_rules (jurisdiction_id, category, is_taxable, crv_rate)
    VALUES (jurisdiction_id, 'Soda', TRUE, 0.05);
  END IF;
END $$;
