# Zip Code Tax Rate Setup Guide

## Overview
This guide explains how to populate the tax database with zip code data for all 50 US states.

## Current Status
✅ **CSV Data**: All 50 states + DC + PR tax rate data available in `docs/state_tax_rates/`  
✅ **Database Schema**: `tax_jurisdictions` table created (see `supabase/tax_schema_v2.sql`)  
✅ **Import Script**: `supabase/import_zip_tax_rates.cjs` ready to generate SQL  
✅ **SQL File Generated**: `supabase/tax_jurisdictions_import.sql` (41,121 lines, ~40,000 zip codes)  
✅ **Frontend Integration**: Settings page already implements the workflow  
✅ **Service Layer**: `taxService.ts` updated to fetch by state_code

## Data Summary
- **Total Zip Codes**: ~40,000
- **States Covered**: All 50 states + DC + PR
- **Data Source**: TAXRATES_ZIP5_*.csv files (December 2025 rates)
- **Fields**: ZipCode, State, City/Region, Combined Tax Rate

## Setup Steps

### 1. Run the Database Schema (if not already done)

```bash
# In Supabase SQL Editor, run:
supabase/tax_schema_v2.sql
```

This creates:
- `tax_jurisdictions` table (zip_code, state_code, city, total_rate)
- `tax_rules` table (for future category-specific rules)
- Indexes for fast lookups
- RLS policies for public read access

### 2. Import the Zip Code Data

**Option A: Run the entire SQL file** (Recommended for initial setup)

```bash
# In Supabase SQL Editor, copy and paste the contents of:
supabase/tax_jurisdictions_import.sql
```

⚠️ **Warning**: This is a large file (41,121 lines). Supabase SQL Editor may time out. If it does, use Option B.

**Option B: Import in batches** (If SQL Editor times out)

Split the SQL file into smaller chunks:

```powershell
# Split into 10 files of ~4,000 lines each
$lines = Get-Content "supabase\tax_jurisdictions_import.sql"
$chunkSize = 4000
for ($i = 0; $i -lt $lines.Count; $i += $chunkSize) {
    $chunk = $lines[$i..([Math]::Min($i + $chunkSize - 1, $lines.Count - 1))]
    $chunk | Out-File "supabase\tax_import_part_$($i/$chunkSize + 1).sql"
}
```

Then run each part file in Supabase SQL Editor sequentially.

**Option C: Use Supabase CLI** (Fastest)

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run the migration
supabase db push --file supabase/tax_jurisdictions_import.sql
```

### 3. Verify the Import

Run this query in Supabase SQL Editor:

```sql
-- Check total count
SELECT COUNT(*) FROM public.tax_jurisdictions;
-- Should return ~40,000

-- Check a specific zip code (e.g., Beverly Hills 90210)
SELECT * FROM public.tax_jurisdictions WHERE zip_code = '90210';
-- Should return: 90210, CA, Beverly Hills, 0.0950

-- Check states covered
SELECT state_code, COUNT(*) as zip_count 
FROM public.tax_jurisdictions 
GROUP BY state_code 
ORDER BY state_code;
-- Should show all 50 states + DC + PR
```

### 4. Test in the App

1. Open the app and go to **Settings**
2. Enter a zip code (e.g., `90210`)
3. Click **"Sync Tax"**
4. Verify the tax rate appears correctly
5. Check that it's saved (refresh the page and verify it persists)

## User Workflow

### Initial Setup
1. User opens app for first time
2. Onboarding wizard prompts for zip code
3. App fetches tax rate from database
4. Rate is stored in localStorage

### Settings Page
1. User can change zip code anytime
2. Click "Sync Tax" to fetch new rate
3. Enable "Manual Override" to edit rate directly
4. Manual override persists until user syncs again

### Shopping Trip
1. Tax rate is pulled from localStorage (no database call)
2. User can override rate for this specific trip
3. Override only applies to current trip

## Database Architecture

### tax_jurisdictions Table
```sql
CREATE TABLE public.tax_jurisdictions (
  id UUID PRIMARY KEY,
  zip_code TEXT UNIQUE NOT NULL,      -- 5-digit zip
  state_code TEXT NOT NULL,            -- 2-letter state code
  city TEXT NOT NULL,                  -- City/region name
  total_rate DECIMAL(5, 4) NOT NULL,   -- Combined tax rate (0.0950 = 9.5%)
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### tax_rules Table (Future Use)
```sql
CREATE TABLE public.tax_rules (
  id UUID PRIMARY KEY,
  state_code TEXT NOT NULL,            -- Links to state, not zip
  category TEXT NOT NULL,              -- 'Produce', 'Beverages', etc.
  is_taxable BOOLEAN DEFAULT TRUE,
  crv_rate DECIMAL(4, 2) DEFAULT 0,    -- CRV fee per container
  created_at TIMESTAMPTZ,
  UNIQUE(state_code, category)
);
```

**Note**: Tax rules are state-level, not per-zip-code. This avoids millions of duplicate rows.

## Future Enhancements

### Category-Specific Tax Rules
Once you research the rules for each state, you can populate `tax_rules`:

```sql
-- Example: California rules
INSERT INTO public.tax_rules (state_code, category, is_taxable, crv_rate)
VALUES 
  ('CA', 'Produce', FALSE, 0),      -- Groceries exempt
  ('CA', 'Meat', FALSE, 0),
  ('CA', 'Beverages', TRUE, 0.05),  -- Taxable + CRV
  ('CA', 'Snacks', TRUE, 0);        -- Taxable, no CRV
```

Then update `taxService.calculateTax()` to use these rules.

### Per-Trip Tax Override
Add a `tax_rate_override` field to the `shopping_trips` table to allow users to override the rate for a specific trip.

## Troubleshooting

### "Zip code not found"
- Verify the zip code is valid (5 digits)
- Check if it exists in the database: `SELECT * FROM tax_jurisdictions WHERE zip_code = 'XXXXX'`
- If missing, user can enable "Manual Override" to set the rate

### SQL Import Timeout
- Use Option B (batches) or Option C (Supabase CLI)
- Alternatively, import via CSV using Supabase Dashboard

### Tax Rate Incorrect
- Verify the source CSV data is correct
- Re-run the import script to regenerate SQL
- Check for typos in the CSV parsing logic

## Maintenance

### Updating Tax Rates
Tax rates change periodically (usually annually). To update:

1. Download new CSV files from your data source
2. Replace files in `docs/state_tax_rates/`
3. Re-run the import script: `node supabase/import_zip_tax_rates.cjs > supabase/tax_jurisdictions_import.sql`
4. Run the new SQL file in Supabase (it will UPDATE existing records due to `ON CONFLICT` clause)

## Files Reference

- **CSV Data**: `docs/state_tax_rates/TAXRATES_ZIP5_*.csv`
- **Database Schema**: `supabase/tax_schema_v2.sql`
- **Import Script**: `supabase/import_zip_tax_rates.cjs`
- **Generated SQL**: `supabase/tax_jurisdictions_import.sql`
- **Service Layer**: `src/shared/services/taxService.ts`
- **Types**: `src/shared/types/tax.ts`
- **Settings UI**: `src/features/settings/SettingsPage.tsx`
- **Settings Utils**: `src/shared/utils/settings.ts`

## Contact

If you encounter issues, check:
1. Supabase logs for SQL errors
2. Browser console for frontend errors
3. Network tab for failed API calls
