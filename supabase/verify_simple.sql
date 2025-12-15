-- ============================================
-- SIMPLE VERIFICATION QUERIES
-- Run these ONE AT A TIME in Supabase SQL Editor
-- ============================================

-- QUERY 1: Total count
SELECT COUNT(*) as total_zip_codes 
FROM public.tax_jurisdictions;

-- QUERY 2: Count of states
SELECT COUNT(DISTINCT state_code) as total_states
FROM public.tax_jurisdictions;

-- QUERY 3: Breakdown by state
SELECT 
  state_code,
  COUNT(*) as zip_count,
  MIN(total_rate) as min_rate,
  MAX(total_rate) as max_rate,
  ROUND(AVG(total_rate)::NUMERIC, 4) as avg_rate
FROM public.tax_jurisdictions
GROUP BY state_code
ORDER BY state_code;

-- QUERY 4: Check for nulls
SELECT COUNT(*) as records_with_nulls
FROM public.tax_jurisdictions
WHERE zip_code IS NULL 
   OR state_code IS NULL 
   OR city IS NULL 
   OR total_rate IS NULL;

-- QUERY 5: Sample data
SELECT 
  zip_code,
  state_code,
  city,
  total_rate,
  ROUND((total_rate * 100)::NUMERIC, 2) || '%' as rate_percentage
FROM public.tax_jurisdictions
WHERE state_code IN ('CA', 'NY', 'TX', 'FL', 'IL')
ORDER BY state_code, zip_code
LIMIT 20;
