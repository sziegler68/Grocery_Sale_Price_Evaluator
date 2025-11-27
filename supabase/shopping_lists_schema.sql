-- Shopping Lists Feature - Database Schema
-- Run this in your Supabase SQL Editor

-- ============================================
-- TABLE 1: Shopping Lists (the list itself)
-- ============================================
CREATE TABLE IF NOT EXISTS public.shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  share_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by share code
CREATE INDEX IF NOT EXISTS idx_shopping_lists_share_code 
ON public.shopping_lists(share_code);

-- ============================================
-- TABLE 2: Shopping List Items
-- ============================================
CREATE TABLE IF NOT EXISTS public.shopping_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES public.shopping_lists(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  category TEXT NOT NULL,  -- For grouping (Dairy, Meats, Produce, etc.)
  quantity NUMERIC DEFAULT 1,
  unit_type TEXT,  -- pound, gallon, each, etc.
  target_price NUMERIC,
  is_checked BOOLEAN DEFAULT false,
  checked_at TIMESTAMPTZ,  -- When item was checked
  notes TEXT,
  added_by TEXT,  -- User's name like "Mom" or "John"
  added_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_shopping_list_items_list_id 
ON public.shopping_list_items(list_id);

CREATE INDEX IF NOT EXISTS idx_shopping_list_items_sorting 
ON public.shopping_list_items(list_id, is_checked, category, added_at);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Shopping Lists Policies
-- ============================================

-- Anyone can create a new list
CREATE POLICY "Anyone can create shopping lists"
ON public.shopping_lists
FOR INSERT
WITH CHECK (true);

-- Anyone can read lists (we'll filter by share_code in app logic)
CREATE POLICY "Public read shopping lists"
ON public.shopping_lists
FOR SELECT
USING (true);

-- Anyone can update lists (for renaming)
CREATE POLICY "Public update shopping lists"
ON public.shopping_lists
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Anyone can delete lists (if they have the code)
CREATE POLICY "Public delete shopping lists"
ON public.shopping_lists
FOR DELETE
USING (true);

-- ============================================
-- Shopping List Items Policies
-- ============================================

-- Anyone can add items
CREATE POLICY "Anyone can add shopping list items"
ON public.shopping_list_items
FOR INSERT
WITH CHECK (true);

-- Anyone can read items
CREATE POLICY "Public read shopping list items"
ON public.shopping_list_items
FOR SELECT
USING (true);

-- Anyone can update items (check/uncheck, edit)
CREATE POLICY "Public update shopping list items"
ON public.shopping_list_items
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Anyone can delete items
CREATE POLICY "Public delete shopping list items"
ON public.shopping_list_items
FOR DELETE
USING (true);

-- ============================================
-- HELPER FUNCTION: Generate Share Code
-- ============================================

-- Function to generate random share codes like "SHOP-K7P2M9"
CREATE OR REPLACE FUNCTION generate_share_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Exclude confusing chars like 0, O, 1, I
  result TEXT := 'SHOP-';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TEST QUERIES (for verification)
-- ============================================

-- Test 1: Create a list
-- INSERT INTO shopping_lists (name, share_code) 
-- VALUES ('Test Family List', generate_share_code());

-- Test 2: Add item to list
-- INSERT INTO shopping_list_items (list_id, item_name, category, target_price, unit_type, added_by)
-- VALUES (
--   (SELECT id FROM shopping_lists WHERE name = 'Test Family List'),
--   'Bananas',
--   'Produce',
--   1.79,
--   'pound',
--   'Test User'
-- );

-- Test 3: Query items by list
-- SELECT * FROM shopping_list_items 
-- WHERE list_id = (SELECT id FROM shopping_lists WHERE name = 'Test Family List')
-- ORDER BY is_checked, category, added_at;
