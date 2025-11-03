-- Migration to update categories and quality enums
-- Run this in your Supabase SQL Editor

-- Step 1: Add new category values to the enum
ALTER TYPE public.grocery_category ADD VALUE IF NOT EXISTS 'Beef';
ALTER TYPE public.grocery_category ADD VALUE IF NOT EXISTS 'Pork';
ALTER TYPE public.grocery_category ADD VALUE IF NOT EXISTS 'Chicken';
ALTER TYPE public.grocery_category ADD VALUE IF NOT EXISTS 'Seafood';

-- Step 2: Update existing 'Meat' entries to a specific meat type (optional)
-- Uncomment the line below if you want to convert existing 'Meat' entries to 'Beef'
-- UPDATE public.grocery_items SET category = 'Beef' WHERE category = 'Meat';

-- Step 3: Add new meat quality values to the enum
ALTER TYPE public.meat_quality ADD VALUE IF NOT EXISTS 'Grassfed';
ALTER TYPE public.meat_quality ADD VALUE IF NOT EXISTS 'Organic';
ALTER TYPE public.meat_quality ADD VALUE IF NOT EXISTS 'Regular';
ALTER TYPE public.meat_quality ADD VALUE IF NOT EXISTS 'Free Range';
ALTER TYPE public.meat_quality ADD VALUE IF NOT EXISTS 'Fresh';
ALTER TYPE public.meat_quality ADD VALUE IF NOT EXISTS 'Farm Raised';
ALTER TYPE public.meat_quality ADD VALUE IF NOT EXISTS 'Frozen';

-- Note: PostgreSQL doesn't allow removing enum values easily.
-- The old 'Meat' category will still exist in the database but won't be used in the UI.
