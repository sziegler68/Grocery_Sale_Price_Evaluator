# Database Migration Guide

## Updating Categories and Quality Enums

If you're using Supabase and encountering errors when adding items with the new categories (Beef, Pork, Chicken, Seafood), you need to update your database enums.

### Option 1: Run Migration Script (Recommended)

1. Go to your Supabase Dashboard
2. Click on "SQL Editor" in the left sidebar
3. Create a new query
4. Copy and paste the contents of `supabase/migration_update_categories.sql`
5. Click "Run" to execute the migration

### Option 2: Recreate the Database

If you're starting fresh or don't have important data:

1. Go to your Supabase Dashboard
2. Navigate to the "SQL Editor"
3. Drop the existing table (WARNING: This will delete all data):
   ```sql
   DROP TABLE IF EXISTS public.grocery_items CASCADE;
   DROP TYPE IF EXISTS public.grocery_category CASCADE;
   DROP TYPE IF EXISTS public.meat_quality CASCADE;
   ```
4. Copy and paste the entire contents of `supabase/schema.sql`
5. Click "Run" to create the updated schema

### What Changed

**New Categories:**
- Added: `Beef`, `Pork`, `Chicken`, `Seafood`
- Kept: `Meat` (for backward compatibility), `Dairy`, `Produce`, `Snacks`, `Drinks`, `Household`, `Other`

**New Quality Options:**
- **Beef**: Choice, Prime, Wagyu, Grassfed, Organic
- **Pork**: Regular, Organic
- **Chicken**: Regular, Organic, Free Range
- **Seafood**: Fresh, Farm Raised, Frozen

### Troubleshooting

If you see errors like:
- "invalid input value for enum grocery_category"
- "invalid input value for enum meat_quality"

This means your database hasn't been updated yet. Follow Option 1 above to run the migration.

### Note on Mock Data

If you haven't configured Supabase (no credentials), the app will use mock data and won't have this issue. The error only occurs when actually saving to a Supabase database with the old schema.
