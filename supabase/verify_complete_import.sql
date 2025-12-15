-- ============================================
-- COMPREHENSIVE TAX IMPORT VERIFICATION
-- Run this to verify all 10 parts imported successfully
-- ============================================

-- 1. Total count of all zip codes
SELECT 
  'Total Zip Codes Imported' as metric,
  COUNT(*) as count,
  'Expected: ~42,000+' as expected
FROM public.tax_jurisdictions;

-- 2. Count by state (should show all 50 states + DC)
SELECT 
  'States/Territories Imported' as metric,
  COUNT(DISTINCT state_code) as count,
  'Expected: 52 (50 states + DC + territories)' as expected
FROM public.tax_jurisdictions;

-- 3. Breakdown by state
SELECT 
  state_code,
  COUNT(*) as zip_count,
  MIN(total_rate) as min_rate,
  MAX(total_rate) as max_rate,
  AVG(total_rate)::DECIMAL(5,4) as avg_rate
FROM public.tax_jurisdictions
GROUP BY state_code
ORDER BY state_code;

-- 4. Check for any null or invalid data
SELECT 
  'Records with NULL values' as issue,
  COUNT(*) as count
FROM public.tax_jurisdictions
WHERE zip_code IS NULL 
   OR state_code IS NULL 
   OR city IS NULL 
   OR total_rate IS NULL;

-- 5. Sample records from different states
SELECT 
  zip_code,
  state_code,
  city,
  total_rate,
  (total_rate * 100)::DECIMAL(5,2) || '%' as rate_percentage
FROM public.tax_jurisdictions
WHERE state_code IN ('CA', 'NY', 'TX', 'FL', 'IL')
ORDER BY state_code, zip_code
LIMIT 20;

-- 6. Check for duplicate zip codes (should be 0)
SELECT 
  'Duplicate Zip Codes' as issue,
  COUNT(*) as count
FROM (
  SELECT zip_code, COUNT(*) as cnt
  FROM public.tax_jurisdictions
  GROUP BY zip_code
  HAVING COUNT(*) > 1
) duplicates;
