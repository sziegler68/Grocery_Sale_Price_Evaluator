-- ============================================
-- SEED TOP 50 US CITIES - TAX RATES
-- Run this in Supabase SQL Editor
-- ============================================

-- Insert top 50 US cities by population with approximate tax rates
-- Note: These are approximate combined state + local rates as of 2024
-- Users should verify rates for their specific location

INSERT INTO public.tax_jurisdictions (zip_code, state_code, city, total_rate)
VALUES 
  -- California
  ('90001', 'CA', 'Los Angeles', 0.0950),
  ('90210', 'CA', 'Beverly Hills', 0.0950),
  ('94102', 'CA', 'San Francisco', 0.0850),
  ('92101', 'CA', 'San Diego', 0.0775),
  ('95101', 'CA', 'San Jose', 0.0913),
  ('94601', 'CA', 'Oakland', 0.1025),
  ('95814', 'CA', 'Sacramento', 0.0825),
  ('92802', 'CA', 'Anaheim', 0.0775),
  
  -- Texas
  ('75201', 'TX', 'Dallas', 0.0825),
  ('77002', 'TX', 'Houston', 0.0825),
  ('78701', 'TX', 'Austin', 0.0825),
  ('78205', 'TX', 'San Antonio', 0.0825),
  ('76102', 'TX', 'Fort Worth', 0.0825),
  ('79901', 'TX', 'El Paso', 0.0825),
  
  -- New York
  ('10001', 'NY', 'New York', 0.0850),
  ('14202', 'NY', 'Buffalo', 0.0850),
  ('13202', 'NY', 'Syracuse', 0.0800),
  
  -- Florida
  ('33101', 'FL', 'Miami', 0.0700),
  ('32801', 'FL', 'Orlando', 0.0650),
  ('33602', 'FL', 'Tampa', 0.0750),
  ('32202', 'FL', 'Jacksonville', 0.0700),
  
  -- Illinois
  ('60601', 'IL', 'Chicago', 0.1025),
  ('62701', 'IL', 'Springfield', 0.0850),
  
  -- Pennsylvania
  ('19102', 'PA', 'Philadelphia', 0.0800),
  ('15222', 'PA', 'Pittsburgh', 0.0700),
  
  -- Arizona
  ('85001', 'AZ', 'Phoenix', 0.0830),
  ('85701', 'AZ', 'Tucson', 0.0860),
  
  -- Ohio
  ('43215', 'OH', 'Columbus', 0.0775),
  ('44114', 'OH', 'Cleveland', 0.0800),
  ('45202', 'OH', 'Cincinnati', 0.0725),
  
  -- North Carolina
  ('28202', 'NC', 'Charlotte', 0.0725),
  ('27601', 'NC', 'Raleigh', 0.0725),
  
  -- Indiana
  ('46204', 'IN', 'Indianapolis', 0.0700),
  
  -- Washington
  ('98101', 'WA', 'Seattle', 0.1010),
  ('99201', 'WA', 'Spokane', 0.0890),
  
  -- Colorado
  ('80202', 'CO', 'Denver', 0.0810),
  ('80903', 'CO', 'Colorado Springs', 0.0810),
  
  -- Tennessee
  ('37203', 'TN', 'Nashville', 0.0925),
  ('38103', 'TN', 'Memphis', 0.0925),
  
  -- Massachusetts
  ('02108', 'MA', 'Boston', 0.0625),
  
  -- Michigan
  ('48226', 'MI', 'Detroit', 0.0600),
  
  -- Oregon (no sales tax)
  ('97201', 'OR', 'Portland', 0.0000),
  
  -- Nevada
  ('89101', 'NV', 'Las Vegas', 0.0825),
  
  -- Georgia
  ('30303', 'GA', 'Atlanta', 0.0890),
  
  -- Virginia
  ('23219', 'VA', 'Richmond', 0.0600),
  ('23510', 'VA', 'Norfolk', 0.0600),
  
  -- Wisconsin
  ('53202', 'WI', 'Milwaukee', 0.0560),
  
  -- Minnesota
  ('55401', 'MN', 'Minneapolis', 0.0788)
ON CONFLICT (zip_code) DO UPDATE SET
  state_code = EXCLUDED.state_code,
  city = EXCLUDED.city,
  total_rate = EXCLUDED.total_rate,
  updated_at = NOW();

-- Add basic tax rules for common categories
-- This is a simplified approach - actual rules vary by state
DO $$
DECLARE
  jurisdiction_record RECORD;
BEGIN
  FOR jurisdiction_record IN 
    SELECT id, state_code FROM public.tax_jurisdictions
  LOOP
    -- Groceries (most states exempt, some don't)
    INSERT INTO public.tax_rules (jurisdiction_id, category, is_taxable, crv_rate)
    VALUES (
      jurisdiction_record.id, 
      'Groceries', 
      CASE 
        WHEN jurisdiction_record.state_code IN ('CA', 'IL', 'TN', 'VA') THEN FALSE
        ELSE TRUE
      END,
      0
    )
    ON CONFLICT DO NOTHING;
    
    -- Produce (generally exempt)
    INSERT INTO public.tax_rules (jurisdiction_id, category, is_taxable, crv_rate)
    VALUES (jurisdiction_record.id, 'Produce', FALSE, 0)
    ON CONFLICT DO NOTHING;
    
    -- Meat (generally exempt)
    INSERT INTO public.tax_rules (jurisdiction_id, category, is_taxable, crv_rate)
    VALUES (jurisdiction_record.id, 'Meat', FALSE, 0)
    ON CONFLICT DO NOTHING;
    
    -- Dairy (generally exempt)
    INSERT INTO public.tax_rules (jurisdiction_id, category, is_taxable, crv_rate)
    VALUES (jurisdiction_record.id, 'Dairy', FALSE, 0)
    ON CONFLICT DO NOTHING;
    
    -- Soda (taxable, CRV in CA, OR, MI, etc.)
    INSERT INTO public.tax_rules (jurisdiction_id, category, is_taxable, crv_rate)
    VALUES (
      jurisdiction_record.id, 
      'Soda', 
      TRUE,
      CASE 
        WHEN jurisdiction_record.state_code IN ('CA', 'OR', 'MI') THEN 0.05
        ELSE 0
      END
    )
    ON CONFLICT DO NOTHING;
    
    -- Alcohol (always taxable)
    INSERT INTO public.tax_rules (jurisdiction_id, category, is_taxable, crv_rate)
    VALUES (jurisdiction_record.id, 'Alcohol', TRUE, 0)
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- Verify the data
SELECT COUNT(*) as total_jurisdictions FROM public.tax_jurisdictions;
SELECT COUNT(*) as total_rules FROM public.tax_rules;
