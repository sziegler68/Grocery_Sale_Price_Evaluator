-- Add CRV and Sales Tax Support to Shopping Trips
-- Run this migration to add CRV tracking and sales tax to shopping trips

-- Add CRV column to cart_items
ALTER TABLE cart_items 
ADD COLUMN IF NOT EXISTS crv_amount DECIMAL(10,2) DEFAULT 0;

-- Add sales tax rate to shopping_trips
ALTER TABLE shopping_trips 
ADD COLUMN IF NOT EXISTS sales_tax_rate DECIMAL(5,2) DEFAULT 0;

-- Update the trigger function to include CRV and sales tax in total calculation
-- Fix: Use DECLARE to properly access sales_tax_rate from shopping_trips
CREATE OR REPLACE FUNCTION update_trip_total()
RETURNS TRIGGER AS $$
DECLARE
  trip_tax_rate DECIMAL(5,2);
  subtotal DECIMAL(10,2);
BEGIN
  -- Get the trip's sales tax rate
  SELECT sales_tax_rate INTO trip_tax_rate
  FROM shopping_trips
  WHERE id = COALESCE(NEW.trip_id, OLD.trip_id);
  
  -- Calculate subtotal (items only, CRV NOT taxed)
  -- price_paid is TOTAL price (not per unit), so just SUM it
  SELECT COALESCE(
    SUM(price_paid),
    0
  ) INTO subtotal
  FROM cart_items
  WHERE trip_id = COALESCE(NEW.trip_id, OLD.trip_id);
  
  -- Update the trip with (subtotal + tax) + CRV
  -- IMPORTANT: CRV is added AFTER tax, not included in taxable amount
  UPDATE shopping_trips
  SET 
    total_spent = (subtotal * (1 + (COALESCE(trip_tax_rate, 0) / 100))) + (
      SELECT COALESCE(SUM(crv_amount), 0)
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
