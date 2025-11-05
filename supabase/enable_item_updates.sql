-- Enable UPDATE access for grocery_items
-- This allows users to edit items they or others have added

-- Drop the policy if it exists, then create it
DROP POLICY IF EXISTS "Public update access" ON public.grocery_items;

-- Policy: Anyone can UPDATE (edit) items
CREATE POLICY "Public update access"
ON public.grocery_items
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Note: If you want to restrict updates to only the user who created the item,
-- you can use this policy instead:
-- 
-- DROP POLICY IF EXISTS "Public update access" ON public.grocery_items;
-- CREATE POLICY "Users can update their own items"
-- ON public.grocery_items
-- FOR UPDATE
-- USING (auth.uid() = user_id)
-- WITH CHECK (auth.uid() = user_id);
