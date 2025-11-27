-- RLS Policies for Public Collaborative Database
-- Run this in your Supabase SQL Editor

-- First, drop the old restrictive policies
DROP POLICY IF EXISTS "Users can manage their grocery items" ON public.grocery_items;
DROP POLICY IF EXISTS "Service role can read all grocery items" ON public.grocery_items;

-- Enable RLS (if not already enabled)
ALTER TABLE public.grocery_items ENABLE ROW LEVEL SECURITY;

-- Policy 1: Anyone can SELECT (read) all items
CREATE POLICY "Public read access"
ON public.grocery_items
FOR SELECT
USING (true);

-- Policy 2: Anyone can INSERT (add) new items
CREATE POLICY "Public insert access"
ON public.grocery_items
FOR INSERT
WITH CHECK (true);

-- Policy 3: NOBODY can UPDATE (modify) existing items
-- (No update policy = no updates allowed for public users)

-- Policy 4: NOBODY can DELETE items
-- (No delete policy = no deletes allowed for public users)

-- Optional: If you want to keep admin access for yourself
-- Create a policy that allows a specific email to update/delete
-- Replace 'your-email@example.com' with your actual email

-- CREATE POLICY "Admin can update"
-- ON public.grocery_items
-- FOR UPDATE
-- USING (auth.jwt()->>'email' = 'your-email@example.com')
-- WITH CHECK (auth.jwt()->>'email' = 'your-email@example.com');

-- CREATE POLICY "Admin can delete"
-- ON public.grocery_items
-- FOR DELETE
-- USING (auth.jwt()->>'email' = 'your-email@example.com');
