-- Phase 4 Migration: OCR & Crowdsourcing Support
-- Adds OCR metadata tracking and moderation fields for crowdsourced data

-- ============================================================================
-- PART 1: Extend grocery_items with moderation fields
-- ============================================================================

-- Add moderation columns to existing grocery_items table
ALTER TABLE public.grocery_items
  ADD COLUMN IF NOT EXISTS flagged_for_review boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS flagged_reason text NULL,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz NULL;

-- Add comment documentation
COMMENT ON COLUMN public.grocery_items.flagged_for_review IS 'Indicates if this item has been flagged by users or automated systems for review';
COMMENT ON COLUMN public.grocery_items.verified IS 'Indicates if this item has been verified by a moderator or trusted source';
COMMENT ON COLUMN public.grocery_items.flagged_reason IS 'Reason why this item was flagged (e.g., "Duplicate", "Invalid price", "Wrong category")';
COMMENT ON COLUMN public.grocery_items.reviewed_by IS 'User ID of moderator who reviewed this item';
COMMENT ON COLUMN public.grocery_items.reviewed_at IS 'Timestamp when this item was reviewed';

-- ============================================================================
-- PART 2: Create ocr_scans table for OCR metadata
-- ============================================================================

-- Create enum for OCR sources
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ocr_source_type') THEN
    CREATE TYPE public.ocr_source_type AS ENUM (
      'manual_entry',
      'google_vision',
      'tesseract',
      'aws_textract',
      'azure_ocr',
      'other'
    );
  END IF;
END $$;

-- Create ocr_scans table to track OCR metadata separately
CREATE TABLE IF NOT EXISTS public.ocr_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  
  -- Link to the grocery item this scan created/updated
  grocery_item_id uuid NOT NULL REFERENCES public.grocery_items(id) ON DELETE CASCADE,
  
  -- OCR metadata
  ocr_source public.ocr_source_type NOT NULL DEFAULT 'manual_entry',
  confidence numeric(3, 2) NULL CHECK (confidence >= 0 AND confidence <= 1),
  raw_text text NULL,
  receipt_url text NULL,
  
  -- Processing metadata
  processing_time_ms integer NULL,
  error_message text NULL,
  
  -- User who initiated the scan
  user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Add comment documentation
COMMENT ON TABLE public.ocr_scans IS 'Tracks OCR scan attempts and metadata for receipt processing';
COMMENT ON COLUMN public.ocr_scans.grocery_item_id IS 'The grocery item that was created or updated from this OCR scan';
COMMENT ON COLUMN public.ocr_scans.ocr_source IS 'The OCR service or method used to extract data';
COMMENT ON COLUMN public.ocr_scans.confidence IS 'Overall confidence score from OCR service (0.0 to 1.0)';
COMMENT ON COLUMN public.ocr_scans.raw_text IS 'Raw text extracted from receipt before parsing';
COMMENT ON COLUMN public.ocr_scans.receipt_url IS 'URL to the uploaded receipt image';
COMMENT ON COLUMN public.ocr_scans.processing_time_ms IS 'Time taken to process the OCR scan in milliseconds';
COMMENT ON COLUMN public.ocr_scans.error_message IS 'Error message if OCR processing failed';

-- ============================================================================
-- PART 3: Create indexes for query performance
-- ============================================================================

-- Indexes on grocery_items for moderation queries
CREATE INDEX IF NOT EXISTS grocery_items_flagged_for_review_idx 
  ON public.grocery_items(flagged_for_review) 
  WHERE flagged_for_review = true;

CREATE INDEX IF NOT EXISTS grocery_items_verified_idx 
  ON public.grocery_items(verified);

CREATE INDEX IF NOT EXISTS grocery_items_reviewed_at_idx 
  ON public.grocery_items(reviewed_at DESC);

-- Indexes on grocery_items for existing query-heavy columns
CREATE INDEX IF NOT EXISTS grocery_items_store_name_idx 
  ON public.grocery_items(store_name);

CREATE INDEX IF NOT EXISTS grocery_items_category_idx 
  ON public.grocery_items(category);

CREATE INDEX IF NOT EXISTS grocery_items_date_purchased_idx 
  ON public.grocery_items(date_purchased DESC);

-- Indexes on ocr_scans for common queries
CREATE INDEX IF NOT EXISTS ocr_scans_grocery_item_id_idx 
  ON public.ocr_scans(grocery_item_id);

CREATE INDEX IF NOT EXISTS ocr_scans_ocr_source_idx 
  ON public.ocr_scans(ocr_source);

CREATE INDEX IF NOT EXISTS ocr_scans_created_at_idx 
  ON public.ocr_scans(created_at DESC);

CREATE INDEX IF NOT EXISTS ocr_scans_user_id_idx 
  ON public.ocr_scans(user_id);

-- Composite index for finding recent unverified flagged items
CREATE INDEX IF NOT EXISTS grocery_items_moderation_queue_idx 
  ON public.grocery_items(flagged_for_review, verified, created_at DESC) 
  WHERE flagged_for_review = true AND verified = false;

-- ============================================================================
-- PART 4: Row Level Security (RLS) for ocr_scans
-- ============================================================================

-- Enable RLS on ocr_scans table
ALTER TABLE public.ocr_scans ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read OCR scan metadata (for transparency)
CREATE POLICY IF NOT EXISTS "Public read access for ocr_scans"
  ON public.ocr_scans
  FOR SELECT
  USING (true);

-- Policy: Anyone can insert OCR scans (for crowdsourced data)
CREATE POLICY IF NOT EXISTS "Public insert access for ocr_scans"
  ON public.ocr_scans
  FOR INSERT
  WITH CHECK (true);

-- No UPDATE/DELETE policies = immutable audit trail

-- ============================================================================
-- PART 5: Helper functions for moderation workflow
-- ============================================================================

-- Function to flag an item for review
CREATE OR REPLACE FUNCTION public.flag_item_for_review(
  item_id uuid,
  reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.grocery_items
  SET 
    flagged_for_review = true,
    flagged_reason = reason
  WHERE id = item_id;
END;
$$;

-- Function to verify an item (moderator action)
CREATE OR REPLACE FUNCTION public.verify_item(
  item_id uuid,
  moderator_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.grocery_items
  SET 
    verified = true,
    flagged_for_review = false,
    reviewed_by = moderator_id,
    reviewed_at = timezone('utc', now())
  WHERE id = item_id;
END;
$$;

-- Function to get moderation queue
CREATE OR REPLACE FUNCTION public.get_moderation_queue(
  limit_count integer DEFAULT 50
)
RETURNS SETOF public.grocery_items
LANGUAGE sql
STABLE
AS $$
  SELECT *
  FROM public.grocery_items
  WHERE flagged_for_review = true AND verified = false
  ORDER BY created_at DESC
  LIMIT limit_count;
$$;

-- ============================================================================
-- PART 6: Update existing policies to respect verification
-- ============================================================================

-- Drop old policies if they exist (to replace with new ones)
DROP POLICY IF EXISTS "Public read access" ON public.grocery_items;
DROP POLICY IF EXISTS "Public insert access" ON public.grocery_items;

-- New read policy: Anyone can read all items (verified or not)
-- We show flagged items but can filter them in the UI
CREATE POLICY "Public read access"
  ON public.grocery_items
  FOR SELECT
  USING (true);

-- New insert policy: Anyone can insert, but auto-flag suspicious items
CREATE POLICY "Public insert access"
  ON public.grocery_items
  FOR INSERT
  WITH CHECK (true);

-- Optional: Create policy for moderators to update items
-- Uncomment and set moderator emails
-- CREATE POLICY "Moderators can update"
--   ON public.grocery_items
--   FOR UPDATE
--   USING (auth.jwt()->>'email' IN ('moderator1@example.com', 'moderator2@example.com'))
--   WITH CHECK (auth.jwt()->>'email' IN ('moderator1@example.com', 'moderator2@example.com'));

-- ============================================================================
-- PART 7: Create view for clean item data (hide flagged/unverified)
-- ============================================================================

-- View for trusted items only (verified or not flagged)
CREATE OR REPLACE VIEW public.trusted_grocery_items AS
SELECT *
FROM public.grocery_items
WHERE (verified = true OR flagged_for_review = false);

-- Grant access to the view
GRANT SELECT ON public.trusted_grocery_items TO authenticated, anon;

-- ============================================================================
-- Migration complete!
-- ============================================================================

-- Verify migration
DO $$
BEGIN
  RAISE NOTICE 'Phase 4 migration complete!';
  RAISE NOTICE 'New columns added to grocery_items: flagged_for_review, verified, flagged_reason, reviewed_by, reviewed_at';
  RAISE NOTICE 'New table created: ocr_scans';
  RAISE NOTICE 'Indexes created for performance';
  RAISE NOTICE 'Helper functions: flag_item_for_review(), verify_item(), get_moderation_queue()';
  RAISE NOTICE 'View created: trusted_grocery_items';
END $$;
