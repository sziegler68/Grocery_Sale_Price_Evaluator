-- Migration: Add tax_amount column to cart_items for single source of truth
-- This eliminates the need to recalculate tax in multiple places

-- Add tax_amount column to store the calculated tax per item
ALTER TABLE cart_items 
ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10,2) DEFAULT 0;

-- Update the trigger to simply SUM stored values (no calculation!)
CREATE OR REPLACE FUNCTION update_trip_total()
RETURNS TRIGGER AS $$
BEGIN
  -- Simple SUM of stored values - no more calculation!
  -- Each cart item already has: price_paid, tax_amount, crv_amount
  UPDATE shopping_trips
  SET 
    total_spent = (
      SELECT COALESCE(SUM(price_paid + tax_amount + crv_amount), 0)
      FROM cart_items
      WHERE trip_id = COALESCE(NEW.trip_id, OLD.trip_id)
    ),
    items_purchased = (
      SELECT COUNT(*)
      FROM cart_items
      WHERE trip_id = COALESCE(NEW.trip_id, OLD.trip_id)
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.trip_id, OLD.trip_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers remain the same (they call the updated function)
-- cart_items_insert_trigger, cart_items_update_trigger, cart_items_delete_trigger

-- Backfill existing cart items with calculated tax
-- (for any active trips created before this migration)
UPDATE cart_items ci
SET tax_amount = ci.price_paid * (
  SELECT COALESCE(st.sales_tax_rate, 0) / 100
  FROM shopping_trips st
  WHERE st.id = ci.trip_id
)
WHERE tax_amount = 0 AND EXISTS (
  SELECT 1 FROM shopping_trips st 
  WHERE st.id = ci.trip_id 
  AND st.completed_at IS NULL
);
