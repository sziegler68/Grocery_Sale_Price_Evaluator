-- ============================================
-- TEST ZIP CODES - ONE PER STATE
-- Use these to test tax calculations in your app
-- ============================================

-- Query to get one representative zip code per state
SELECT 
  state_code,
  zip_code,
  city,
  total_rate,
  ROUND((total_rate * 100)::NUMERIC, 2) || '%' as rate_percentage,
  CASE 
    WHEN state_code IN ('AK', 'DE', 'MT', 'NH', 'OR') THEN 'No Sales Tax'
    WHEN state_code IN ('HI', 'MS', 'SD') THEN 'Taxes Groceries'
    ELSE 'Grocery Exemption'
  END as tax_type,
  CASE 
    WHEN state_code IN ('CA', 'CT', 'IA', 'ME', 'MA', 'MI', 'NY', 'VT', 'HI') THEN 'Yes ($0.05)'
    ELSE 'No'
  END as has_crv
FROM (
  SELECT DISTINCT ON (state_code)
    state_code,
    zip_code,
    city,
    total_rate
  FROM tax_jurisdictions
  ORDER BY state_code, zip_code
) as one_per_state
ORDER BY state_code;
