-- Migration: Expand quality tracking system
-- Replaces single meat_quality enum with granular quality fields

-- Add new quality columns to grocery_prices
ALTER TABLE grocery_prices 
ADD COLUMN IF NOT EXISTS organic BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS grass_fed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS freshness TEXT CHECK (freshness IN ('Fresh', 'Previously Frozen', 'Frozen')),
ADD COLUMN IF NOT EXISTS meat_grade TEXT CHECK (meat_grade IN ('Choice', 'Prime', 'Wagyu')),
ADD COLUMN IF NOT EXISTS seafood_source TEXT CHECK (seafood_source IN ('Wild', 'Farm Raised'));

-- Migrate existing meat_quality data to new columns
UPDATE grocery_prices 
SET organic = TRUE 
WHERE meat_quality = 'Organic';

UPDATE grocery_prices
SET grass_fed = TRUE
WHERE meat_quality = 'Grassfed';

UPDATE grocery_prices
SET meat_grade = 'Choice'
WHERE meat_quality = 'Choice';

UPDATE grocery_prices
SET meat_grade = 'Prime'
WHERE meat_quality = 'Prime';

UPDATE grocery_prices
SET meat_grade = 'Wagyu'
WHERE meat_quality = 'Wagyu';

-- Add same quality columns to shopping_list_items
ALTER TABLE shopping_list_items
ADD COLUMN IF NOT EXISTS organic BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS grass_fed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS freshness TEXT CHECK (freshness IN ('Fresh', 'Previously Frozen', 'Frozen')),
ADD COLUMN IF NOT EXISTS meat_grade TEXT CHECK (meat_grade IN ('Choice', 'Prime', 'Wagyu')),
ADD COLUMN IF NOT EXISTS seafood_source TEXT CHECK (seafood_source IN ('Wild', 'Farm Raised'));

-- Update categories enum to use consolidated categories
-- NOTE: This will need manual data migration if you have existing data in old categories
DO $$ 
BEGIN
  -- Update Beef/Pork/Chicken to "Meat"
  UPDATE grocery_prices SET category = 'Meat' WHERE category IN ('Beef', 'Pork', 'Chicken');
  UPDATE shopping_list_items SET category = 'Meat' WHERE category IN ('Beef', 'Pork', 'Chicken', 'Meats');
  
  -- Seafood stays as-is
  -- Other categories stay as-is
END $$;

-- Optional: Drop the old meat_quality column after migration
-- UNCOMMENT THE NEXT LINE AFTER VERIFYING DATA MIGRATION
-- ALTER TABLE grocery_prices DROP COLUMN IF EXISTS meat_quality;

-- Add indexes for common quality queries
CREATE INDEX IF NOT EXISTS idx_grocery_prices_organic ON grocery_prices(organic) WHERE organic = TRUE;
CREATE INDEX IF NOT EXISTS idx_grocery_prices_freshness ON grocery_prices(freshness) WHERE freshness IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_grocery_prices_meat_grade ON grocery_prices(meat_grade) WHERE meat_grade IS NOT NULL;
