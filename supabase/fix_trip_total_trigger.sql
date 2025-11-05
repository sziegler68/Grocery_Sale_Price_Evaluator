-- Fix the update_trip_total trigger to properly calculate tax
-- The sales_tax_rate needs to be fetched from the shopping_trips table

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
  SELECT COALESCE(
    SUM(price_paid * quantity),
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
-- Triggers: cart_items_insert_trigger, cart_items_update_trigger, cart_items_delete_trigger
