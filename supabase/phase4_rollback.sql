-- Phase 4 Rollback: Remove OCR & Moderation features
-- Run this if you need to rollback the Phase 4 migration

-- ============================================================================
-- ROLLBACK PART 1: Drop helper functions
-- ============================================================================

DROP FUNCTION IF EXISTS public.flag_item_for_review(uuid, text);
DROP FUNCTION IF EXISTS public.verify_item(uuid, uuid);
DROP FUNCTION IF EXISTS public.get_moderation_queue(integer);

-- ============================================================================
-- ROLLBACK PART 2: Drop view
-- ============================================================================

DROP VIEW IF EXISTS public.trusted_grocery_items;

-- ============================================================================
-- ROLLBACK PART 3: Drop indexes
-- ============================================================================

-- Moderation indexes
DROP INDEX IF EXISTS public.grocery_items_flagged_for_review_idx;
DROP INDEX IF EXISTS public.grocery_items_verified_idx;
DROP INDEX IF EXISTS public.grocery_items_reviewed_at_idx;
DROP INDEX IF EXISTS public.grocery_items_moderation_queue_idx;

-- Query performance indexes (optional - only if not needed)
-- DROP INDEX IF EXISTS public.grocery_items_store_name_idx;
-- DROP INDEX IF EXISTS public.grocery_items_category_idx;
-- DROP INDEX IF EXISTS public.grocery_items_date_purchased_idx;

-- OCR scans indexes
DROP INDEX IF EXISTS public.ocr_scans_grocery_item_id_idx;
DROP INDEX IF EXISTS public.ocr_scans_ocr_source_idx;
DROP INDEX IF EXISTS public.ocr_scans_created_at_idx;
DROP INDEX IF EXISTS public.ocr_scans_user_id_idx;

-- ============================================================================
-- ROLLBACK PART 4: Drop ocr_scans table
-- ============================================================================

DROP TABLE IF EXISTS public.ocr_scans CASCADE;

-- ============================================================================
-- ROLLBACK PART 5: Drop enum type
-- ============================================================================

DROP TYPE IF EXISTS public.ocr_source_type CASCADE;

-- ============================================================================
-- ROLLBACK PART 6: Remove moderation columns from grocery_items
-- ============================================================================

ALTER TABLE public.grocery_items
  DROP COLUMN IF EXISTS flagged_for_review,
  DROP COLUMN IF EXISTS verified,
  DROP COLUMN IF EXISTS flagged_reason,
  DROP COLUMN IF EXISTS reviewed_by,
  DROP COLUMN IF EXISTS reviewed_at;

-- ============================================================================
-- ROLLBACK PART 7: Restore original policies
-- ============================================================================

-- Drop Phase 4 policies
DROP POLICY IF EXISTS "Public read access" ON public.grocery_items;
DROP POLICY IF EXISTS "Public insert access" ON public.grocery_items;

-- Recreate original simple policies
CREATE POLICY "Public read access"
  ON public.grocery_items
  FOR SELECT
  USING (true);

CREATE POLICY "Public insert access"
  ON public.grocery_items
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- Rollback complete!
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Phase 4 rollback complete!';
  RAISE NOTICE 'Removed: ocr_scans table, moderation columns, indexes, helper functions, view';
  RAISE NOTICE 'Restored: original grocery_items policies';
END $$;
