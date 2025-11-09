-- Add tax_amount column to cart_items for single source of truth
-- Tax should be calculated ONCE in QuickPriceInput and stored, not recalculated everywhere

ALTER TABLE cart_items 
ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10,2) DEFAULT 0;

-- Update the trigger to use stored tax_amount instead of recalculating
CREATE OR REPLACE FUNCTION update_trip_total()
RETURNS TRIGGER AS $$
BEGIN
  -- Sum the actual stored values: price_paid + tax_amount + crv_amount
  -- NO MORE CALCULATION - just sum what's already calculated!
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

-- The existing triggers will automatically use the updated function
-- Triggers: cart_items_insert_trigger, cart_items_update_trigger, cart_items_delete_trigger
