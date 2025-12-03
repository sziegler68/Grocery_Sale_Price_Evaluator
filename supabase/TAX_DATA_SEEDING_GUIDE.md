# Tax Data Seeding Guide

Once you've compiled your tax data (by state, jurisdiction, and zip code), you can seed it into the database using this SQL template.

## Seeding Format

For each jurisdiction (zip code):

```sql
-- Insert jurisdiction
INSERT INTO public.tax_jurisdictions (zip_code, state_code, city, total_rate)
VALUES ('ZIP_CODE', 'STATE', 'CITY_NAME', RATE_AS_DECIMAL)
ON CONFLICT (zip_code) DO NOTHING;

-- Insert rules for that jurisdiction
DO $$
DECLARE
  jurisdiction_id UUID;
BEGIN
  SELECT id INTO jurisdiction_id FROM public.tax_jurisdictions WHERE zip_code = 'ZIP_CODE';
  
  IF jurisdiction_id IS NOT NULL THEN
    -- Example: Groceries exempt
    INSERT INTO public.tax_rules (jurisdiction_id, category, is_taxable, crv_rate)
    VALUES (jurisdiction_id, 'Groceries', FALSE, 0);
    
    -- Example: Soda with CRV
    INSERT INTO public.tax_rules (jurisdiction_id, category, is_taxable, crv_rate)
    VALUES (jurisdiction_id, 'Beverages', TRUE, 0.05);
    
    -- Add more rules as needed
  END IF;
END $$;
```

## Category Mapping

The app uses these categories (from `CATEGORIES` constant):
- Meat
- Seafood
- Dairy
- Produce
- Bakery
- Frozen
- Pantry
- Condiments
- Beverages
- Snacks
- Household
- Personal Care
- Baby
- Pet
- Electronics
- Other

Map your tax rules to these categories.

## CRV Notes

- CRV (California Redemption Value) is typically a flat fee per container
- Common values: $0.05 (< 24oz), $0.10 (≥ 24oz)
- Set `crv_rate` to the flat amount (e.g., 0.05 for 5 cents)

## Bulk Import

For bulk data, you can:
1. Create a CSV with your data
2. Use a script to generate SQL INSERT statements
3. Or use Supabase's CSV import feature in the dashboard
