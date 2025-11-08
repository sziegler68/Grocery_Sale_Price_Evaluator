# Phase 4 Migration Guide: OCR & Crowdsourcing Support

This guide covers the database migration for Phase 4, which adds OCR metadata tracking and moderation fields for crowdsourced grocery price data.

---

## Overview

**What's Added:**
- Moderation fields on `grocery_items` table (flagging, verification)
- New `ocr_scans` table to track OCR metadata separately
- Performance indexes for query-heavy columns
- Helper functions for moderation workflow
- View for trusted items only

**Breaking Changes:**
- None. All new columns have default values or are nullable.
- Existing queries continue to work unchanged.

---

## Prerequisites

Before running the migration:

1. **Backup your database:**
   ```bash
   # Supabase CLI
   supabase db dump -f backup_pre_phase4.sql
   
   # Or via SQL
   pg_dump your_database > backup_pre_phase4.sql
   ```

2. **Test on staging first** if you have a production database.

3. **Ensure admin access** to run migrations.

---

## Migration Steps

### Step 1: Run the Migration

**Via Supabase Dashboard:**
1. Navigate to SQL Editor in Supabase dashboard
2. Copy contents of `/supabase/phase4_ocr_moderation_migration.sql`
3. Paste into SQL editor
4. Click "Run"
5. Verify success message at bottom

**Via Supabase CLI:**
```bash
cd your-project-root
supabase db push
# Or for specific file:
supabase db execute -f supabase/phase4_ocr_moderation_migration.sql
```

**Via psql:**
```bash
psql -U postgres -d your_database -f supabase/phase4_ocr_moderation_migration.sql
```

### Step 2: Verify Migration Success

Run this query to check all new structures exist:

```sql
-- Check new columns on grocery_items
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'grocery_items'
  AND column_name IN ('flagged_for_review', 'verified', 'flagged_reason', 'reviewed_by', 'reviewed_at');

-- Should return 5 rows

-- Check ocr_scans table exists
SELECT table_name 
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'ocr_scans';

-- Should return 1 row

-- Check indexes
SELECT indexname
FROM pg_indexes
WHERE tablename IN ('grocery_items', 'ocr_scans')
  AND indexname LIKE '%phase4%' OR indexname LIKE '%flagged%' OR indexname LIKE '%verified%' OR indexname LIKE '%ocr%';

-- Should return multiple indexes

-- Check helper functions
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('flag_item_for_review', 'verify_item', 'get_moderation_queue');

-- Should return 3 rows

-- Check trusted_grocery_items view
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public' AND table_name = 'trusted_grocery_items';

-- Should return 1 row
```

### Step 3: Test the New Features

**Test auto-defaults:**
```sql
-- New items should have default moderation values
INSERT INTO grocery_items (item_name, category, store_name, price, quantity, unit_type, unit_price, date_purchased)
VALUES ('Test Item', 'Other', 'Test Store', 5.99, 1, 'each', 5.99, CURRENT_DATE)
RETURNING flagged_for_review, verified;

-- Should return: flagged_for_review=false, verified=false
```

**Test flagging:**
```sql
-- Get the test item ID
SELECT id FROM grocery_items WHERE item_name = 'Test Item' ORDER BY created_at DESC LIMIT 1;

-- Flag it (replace <item_id> with actual ID)
SELECT flag_item_for_review('<item_id>', 'Testing phase 4 migration');

-- Verify it was flagged
SELECT flagged_for_review, flagged_reason FROM grocery_items WHERE id = '<item_id>';

-- Should show: flagged_for_review=true, flagged_reason='Testing phase 4 migration'
```

**Test verification:**
```sql
-- Verify the item (replace <item_id> and <user_id>)
SELECT verify_item('<item_id>', '<user_id>');

-- Check it's verified
SELECT verified, flagged_for_review, reviewed_by, reviewed_at 
FROM grocery_items WHERE id = '<item_id>';

-- Should show: verified=true, flagged_for_review=false, reviewed_by and reviewed_at populated
```

**Test moderation queue:**
```sql
-- Get flagged items
SELECT * FROM get_moderation_queue(10);

-- Should return items where flagged_for_review=true AND verified=false
```

**Test OCR scans:**
```sql
-- Create a test OCR scan (replace <item_id>)
INSERT INTO ocr_scans (grocery_item_id, ocr_source, confidence, raw_text, receipt_url)
VALUES (
  '<item_id>',
  'google_vision',
  0.95,
  'Test receipt text...',
  'https://example.com/receipt.jpg'
)
RETURNING *;

-- Query OCR scans for an item
SELECT * FROM ocr_scans WHERE grocery_item_id = '<item_id>';
```

**Test trusted items view:**
```sql
-- Should only show unverified OR verified items
SELECT count(*) FROM trusted_grocery_items;

-- Compare to all items
SELECT count(*) FROM grocery_items;

-- trusted_grocery_items should be <= grocery_items
```

---

## Rollback Instructions

If you need to rollback (e.g., migration failed or found issues):

### Step 1: Run Rollback Script

**Via Supabase Dashboard:**
1. Navigate to SQL Editor
2. Copy contents of `/supabase/phase4_rollback.sql`
3. Paste and run

**Via Supabase CLI:**
```bash
supabase db execute -f supabase/phase4_rollback.sql
```

**Via psql:**
```bash
psql -U postgres -d your_database -f supabase/phase4_rollback.sql
```

### Step 2: Verify Rollback Success

```sql
-- Check columns were removed
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'grocery_items'
  AND column_name IN ('flagged_for_review', 'verified');

-- Should return 0 rows

-- Check table was dropped
SELECT table_name 
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'ocr_scans';

-- Should return 0 rows

-- Check functions were dropped
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('flag_item_for_review', 'verify_item', 'get_moderation_queue');

-- Should return 0 rows
```

---

## Performance Impact

**Indexes Added:**
- `grocery_items_flagged_for_review_idx` (partial, only flagged items)
- `grocery_items_verified_idx`
- `grocery_items_store_name_idx`
- `grocery_items_category_idx`
- `ocr_scans_grocery_item_id_idx`
- `ocr_scans_ocr_source_idx`
- `grocery_items_moderation_queue_idx` (composite, for moderation UI)

**Expected Impact:**
- Queries filtering by `flagged_for_review`, `verified`, `store_name`, or `category` will be faster
- Moderation queue queries will be significantly faster (composite index)
- OCR scan lookups by item ID will be fast
- Minimal impact on inserts (< 5% slower due to index updates)

**Monitoring:**
```sql
-- Check index usage after a week
SELECT 
  schemaname, tablename, indexname, 
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE tablename IN ('grocery_items', 'ocr_scans')
ORDER BY idx_scan DESC;
```

---

## Application Integration

### TypeScript Types

New types are available in:
- `src/features/price-tracker/types/index.ts` - Updated `GroceryItem` type
- `src/shared/types/ocr.ts` - OCR and moderation types

### Using Moderation Fields

```typescript
// Check if item is flagged
if (item.flagged_for_review) {
  // Show warning banner
  console.warn('Item flagged:', item.flagged_reason);
}

// Check if item is verified
if (item.verified) {
  // Show verified badge
  renderVerifiedBadge();
}

// Filter out flagged items in UI
const trustedItems = items.filter(item => !item.flagged_for_review || item.verified);
```

### Using OCR Metadata

```typescript
import { ingestGroceryItem } from '@features/price-tracker/services/itemIngestion';

// Ingest item with OCR metadata
const result = await ingestGroceryItem({
  itemName: 'Organic Milk',
  price: 4.99,
  quantity: 1,
  storeName: 'Whole Foods',
  unitType: 'gallon',
  category: 'Dairy',
  
  // Phase 4: OCR fields
  ocr_source: 'google_vision',
  ocr_confidence: 0.92,
  ocr_raw_text: 'Raw receipt text...',
  receipt_url: 'https://example.com/receipt.jpg',
  auto_flag_if_suspicious: true, // Auto-flag if confidence < 50%
});

if (!result.success) {
  console.error('Ingestion failed:', result.error);
}
```

---

## Troubleshooting

### Error: "column already exists"

**Cause:** Migration was partially run before.

**Fix:**
```sql
-- Check which columns exist
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'grocery_items' 
  AND column_name IN ('flagged_for_review', 'verified', 'flagged_reason', 'reviewed_by', 'reviewed_at');

-- If some exist, manually drop them first
ALTER TABLE grocery_items DROP COLUMN IF EXISTS flagged_for_review CASCADE;
-- ... repeat for other columns

-- Then re-run migration
```

### Error: "type already exists"

**Cause:** `ocr_source_type` enum was created in a previous attempt.

**Fix:**
```sql
-- Drop the enum
DROP TYPE IF EXISTS public.ocr_source_type CASCADE;

-- Re-run migration
```

### Error: "relation ocr_scans already exists"

**Cause:** Table exists from previous migration attempt.

**Fix:**
```sql
-- Drop the table
DROP TABLE IF EXISTS public.ocr_scans CASCADE;

-- Re-run migration
```

### Slow Queries After Migration

**Check:**
```sql
-- Analyze tables to update statistics
ANALYZE grocery_items;
ANALYZE ocr_scans;

-- Reindex if needed
REINDEX TABLE grocery_items;
REINDEX TABLE ocr_scans;
```

---

## Next Steps

After successful migration:

1. **Update TypeScript types** in your codebase (if not already done)
2. **Test the moderation workflow** in staging
3. **Plan OCR integration** (Phase 5)
4. **Set up monitoring** for flagged items
5. **Train moderators** on the new workflow

---

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the migration SQL comments
3. Check Supabase logs for detailed errors
4. Run rollback if needed and report the issue

---

## Migration Checklist

- [ ] Backup database
- [ ] Run migration on staging
- [ ] Verify all structures created
- [ ] Test moderation functions
- [ ] Test OCR scans
- [ ] Monitor performance
- [ ] Update application code
- [ ] Deploy to production
- [ ] Verify production migration
- [ ] Monitor for 24 hours
- [ ] Document any issues

---

## References

- Migration SQL: `/supabase/phase4_ocr_moderation_migration.sql`
- Rollback SQL: `/supabase/phase4_rollback.sql`
- Types: `/src/shared/types/ocr.ts`
- Service: `/src/features/price-tracker/services/itemIngestion.ts`
