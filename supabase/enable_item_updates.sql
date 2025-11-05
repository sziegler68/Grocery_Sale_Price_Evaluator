-- Enable UPDATE access for grocery_items
-- This allows users to edit items they or others have added

-- Policy: Anyone can UPDATE (edit) items
CREATE POLICY IF NOT EXISTS "Public update access"
ON public.grocery_items
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Note: If you want to restrict updates to only the user who created the item,
-- you can use this policy instead:
-- 
-- CREATE POLICY IF NOT EXISTS "Users can update their own items"
-- ON public.grocery_items
-- FOR UPDATE
-- USING (auth.uid() = user_id)
-- WITH CHECK (auth.uid() = user_id);
