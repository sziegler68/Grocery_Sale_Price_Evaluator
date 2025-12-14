-- Migration: Add on_sale column to cart_items table
-- Description: Adds a boolean column to track whether an item was purchased on sale
-- Date: 2025-11-26

-- Add on_sale column to cart_items table
ALTER TABLE cart_items
ADD COLUMN IF NOT EXISTS on_sale BOOLEAN DEFAULT FALSE;

-- Add comment to document the column
COMMENT ON COLUMN cart_items.on_sale IS 'Indicates whether the item was purchased on sale';
