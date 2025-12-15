-- ============================================
-- POPULATE TAX RULES FOR ALL STATES
-- State-specific category taxability and CRV rates
-- Run this after importing tax_jurisdictions data
-- ============================================

BEGIN;

-- Note: If re-running, you may want to delete existing rules first
-- DELETE FROM public.tax_rules;

-- ============================================
-- CALIFORNIA (CA) - Most grocery items exempt, CRV on beverages
-- ============================================
INSERT INTO public.tax_rules (state_code, category, is_taxable, crv_rate) VALUES
  ('CA', 'Produce', FALSE, 0),
  ('CA', 'Meat', FALSE, 0),
  ('CA', 'Seafood', FALSE, 0),
  ('CA', 'Dairy', FALSE, 0),
  ('CA', 'Bakery', FALSE, 0),
  ('CA', 'Frozen', FALSE, 0),
  ('CA', 'Pantry', FALSE, 0),
  ('CA', 'Condiments', FALSE, 0),
  ('CA', 'Beverages', FALSE, 0.05), -- CRV: $0.05 for <24oz, $0.10 for >=24oz (simplified to 0.05)
  ('CA', 'Snacks', TRUE, 0), -- Candy/snacks are taxable
  ('CA', 'Prepared Food', TRUE, 0),
  ('CA', 'Household', TRUE, 0),
  ('CA', 'Personal Care', TRUE, 0),
  ('CA', 'Baby', TRUE, 0),
  ('CA', 'Pet', TRUE, 0),
  ('CA', 'Other', TRUE, 0);

-- ============================================
-- STATES WITH NO SALES TAX (groceries and everything exempt)
-- AK, DE, MT, NH, OR
-- ============================================
INSERT INTO public.tax_rules (state_code, category, is_taxable, crv_rate)
SELECT state, category, FALSE, 0
FROM (VALUES ('AK'), ('DE'), ('MT'), ('NH'), ('OR')) AS states(state)
CROSS JOIN (VALUES 
  ('Produce'), ('Meat'), ('Seafood'), ('Dairy'), ('Bakery'), 
  ('Frozen'), ('Pantry'), ('Condiments'), ('Beverages'), ('Snacks'),
  ('Prepared Food'), ('Household'), ('Personal Care'), ('Baby'), ('Pet'), ('Other')
) AS categories(category);

-- ============================================
-- STATES WITH GROCERY EXEMPTION (most food exempt, non-food taxable)
-- AL, AR, AZ, CO, CT, FL, GA, IA, ID, IL, IN, KS, KY, LA, MA, MD, ME, MI, MN, MO, 
-- NC, ND, NE, NJ, NM, NV, NY, OH, OK, PA, RI, SC, TN, TX, UT, VA, VT, WA, WI, WV, WY, DC
-- ============================================
INSERT INTO public.tax_rules (state_code, category, is_taxable, crv_rate)
SELECT state, category, 
  CASE 
    WHEN category IN ('Produce', 'Meat', 'Seafood', 'Dairy', 'Bakery', 'Frozen', 'Pantry', 'Condiments', 'Beverages') THEN FALSE
    ELSE TRUE
  END as is_taxable,
  CASE 
    WHEN state IN ('CT', 'IA', 'ME', 'MA', 'MI', 'NY', 'OR', 'VT') AND category = 'Beverages' THEN 0.05
    WHEN state = 'HI' AND category = 'Beverages' THEN 0.05
    ELSE 0
  END as crv_rate
FROM (VALUES 
  ('AL'), ('AR'), ('AZ'), ('CO'), ('CT'), ('FL'), ('GA'), ('IA'), ('ID'), ('IL'), 
  ('IN'), ('KS'), ('KY'), ('LA'), ('MA'), ('MD'), ('ME'), ('MI'), ('MN'), ('MO'),
  ('NC'), ('ND'), ('NE'), ('NJ'), ('NM'), ('NV'), ('NY'), ('OH'), ('OK'), ('PA'),
  ('RI'), ('SC'), ('TN'), ('TX'), ('UT'), ('VA'), ('VT'), ('WA'), ('WI'), ('WV'), ('WY'), ('DC')
) AS states(state)
CROSS JOIN (VALUES 
  ('Produce'), ('Meat'), ('Seafood'), ('Dairy'), ('Bakery'), 
  ('Frozen'), ('Pantry'), ('Condiments'), ('Beverages'), ('Snacks'),
  ('Prepared Food'), ('Household'), ('Personal Care'), ('Baby'), ('Pet'), ('Other')
) AS categories(category);

-- ============================================
-- STATES THAT TAX GROCERIES (everything taxable)
-- HI, MS, SD
-- ============================================
INSERT INTO public.tax_rules (state_code, category, is_taxable, crv_rate)
SELECT state, category, TRUE,
  CASE 
    WHEN state = 'HI' AND category = 'Beverages' THEN 0.05
    ELSE 0
  END as crv_rate
FROM (VALUES ('HI'), ('MS'), ('SD')) AS states(state)
CROSS JOIN (VALUES 
  ('Produce'), ('Meat'), ('Seafood'), ('Dairy'), ('Bakery'), 
  ('Frozen'), ('Pantry'), ('Condiments'), ('Beverages'), ('Snacks'),
  ('Prepared Food'), ('Household'), ('Personal Care'), ('Baby'), ('Pet'), ('Other')
) AS categories(category);

-- ============================================
-- TERRITORIES (apply general rules)
-- AS, GU, MP, PR, VI
-- ============================================
INSERT INTO public.tax_rules (state_code, category, is_taxable, crv_rate)
SELECT state, category, 
  CASE 
    WHEN category IN ('Produce', 'Meat', 'Seafood', 'Dairy', 'Bakery', 'Frozen', 'Pantry', 'Condiments', 'Beverages') THEN FALSE
    ELSE TRUE
  END as is_taxable,
  0 as crv_rate
FROM (VALUES ('AS'), ('GU'), ('MP'), ('PR'), ('VI')) AS states(state)
CROSS JOIN (VALUES 
  ('Produce'), ('Meat'), ('Seafood'), ('Dairy'), ('Bakery'), 
  ('Frozen'), ('Pantry'), ('Condiments'), ('Beverages'), ('Snacks'),
  ('Prepared Food'), ('Household'), ('Personal Care'), ('Baby'), ('Pet'), ('Other')
) AS categories(category);

COMMIT;

-- Verification query
SELECT 
  state_code,
  COUNT(*) as rule_count,
  SUM(CASE WHEN is_taxable THEN 1 ELSE 0 END) as taxable_categories,
  SUM(CASE WHEN crv_rate > 0 THEN 1 ELSE 0 END) as categories_with_crv
FROM public.tax_rules
GROUP BY state_code
ORDER BY state_code;
