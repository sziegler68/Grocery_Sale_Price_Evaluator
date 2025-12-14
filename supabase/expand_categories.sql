-- Category Expansion Migration
-- Adds 9 new categories: Bakery, Frozen, Pantry, Condiments, Beverages, Personal Care, Baby, Pet, Electronics
-- Date: 2025-11-10

-- Safe migration - only adds values if they don't exist
DO $$ 
BEGIN
  -- Add Bakery
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'Bakery' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'grocery_category')
  ) THEN
    ALTER TYPE grocery_category ADD VALUE 'Bakery';
  END IF;
  
  -- Add Frozen
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'Frozen' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'grocery_category')
  ) THEN
    ALTER TYPE grocery_category ADD VALUE 'Frozen';
  END IF;
  
  -- Add Pantry
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'Pantry' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'grocery_category')
  ) THEN
    ALTER TYPE grocery_category ADD VALUE 'Pantry';
  END IF;
  
  -- Add Condiments
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'Condiments' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'grocery_category')
  ) THEN
    ALTER TYPE grocery_category ADD VALUE 'Condiments';
  END IF;
  
  -- Add Beverages
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'Beverages' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'grocery_category')
  ) THEN
    ALTER TYPE grocery_category ADD VALUE 'Beverages';
  END IF;
  
  -- Add Personal Care
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'Personal Care' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'grocery_category')
  ) THEN
    ALTER TYPE grocery_category ADD VALUE 'Personal Care';
  END IF;
  
  -- Add Baby
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'Baby' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'grocery_category')
  ) THEN
    ALTER TYPE grocery_category ADD VALUE 'Baby';
  END IF;
  
  -- Add Pet
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'Pet' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'grocery_category')
  ) THEN
    ALTER TYPE grocery_category ADD VALUE 'Pet';
  END IF;
  
  -- Add Electronics
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'Electronics' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'grocery_category')
  ) THEN
    ALTER TYPE grocery_category ADD VALUE 'Electronics';
  END IF;
END $$;

-- Optional: Migrate "Drinks" to "Beverages" for consistency
-- Uncomment if you want to rename existing data
-- UPDATE grocery_items 
-- SET category = 'Beverages' 
-- WHERE category = 'Drinks';

-- UPDATE shopping_list_items 
-- SET category = 'Beverages' 
-- WHERE category = 'Drinks';

-- Verify all category values
SELECT 
  unnest(enum_range(NULL::grocery_category)) AS category
ORDER BY category;

-- Check current category distribution
SELECT category, COUNT(*) 
FROM grocery_items 
GROUP BY category 
ORDER BY category;
