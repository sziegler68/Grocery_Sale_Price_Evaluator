-- Fix the grocery_category enum to include new consolidated categories

-- Add 'Meat' to the enum (if it doesn't exist)
DO $$ 
BEGIN
  -- Check if 'Meat' already exists in the enum
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'Meat' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'grocery_category')
  ) THEN
    -- Add 'Meat' to the enum
    ALTER TYPE grocery_category ADD VALUE 'Meat';
  END IF;
END $$;

-- Now update the data to use 'Meat' instead of old categories
UPDATE grocery_items 
SET category = 'Meat' 
WHERE category IN ('Beef', 'Pork', 'Chicken');

UPDATE shopping_list_items 
SET category = 'Meat' 
WHERE category IN ('Beef', 'Pork', 'Chicken', 'Meats');

-- Verify the changes
SELECT DISTINCT category FROM grocery_items ORDER BY category;
SELECT DISTINCT category FROM shopping_list_items ORDER BY category;
