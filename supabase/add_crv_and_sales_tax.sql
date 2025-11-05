-- Add CRV and Sales Tax Support to Shopping Trips
-- Run this migration to add CRV tracking and sales tax to shopping trips

-- Add CRV column to cart_items
ALTER TABLE cart_items 
ADD COLUMN IF NOT EXISTS crv_amount DECIMAL(10,2) DEFAULT 0;

-- Add sales tax rate to shopping_trips
ALTER TABLE shopping_trips 
ADD COLUMN IF NOT EXISTS sales_tax_rate DECIMAL(5,2) DEFAULT 0;

-- Update the trigger function to include CRV and sales tax in total calculation
CREATE OR REPLACE FUNCTION update_trip_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE shopping_trips
  SET 
    total_spent = (
      SELECT COALESCE(
        SUM((price_paid * quantity) + COALESCE(crv_amount, 0)),
        0
      ) * (1 + (sales_tax_rate / 100))
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
-- No need to recreate triggers
