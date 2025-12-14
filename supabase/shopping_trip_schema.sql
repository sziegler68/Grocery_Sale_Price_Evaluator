-- Shopping Trip Budget Tracking Schema
-- This schema supports real-time cart tracking during shopping trips

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Shopping trips table
-- Tracks each shopping trip with budget and totals
CREATE TABLE IF NOT EXISTS shopping_trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_id UUID REFERENCES shopping_lists(id) ON DELETE CASCADE,
  budget DECIMAL(10,2) NOT NULL,
  store_name VARCHAR(100),
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  total_spent DECIMAL(10,2) DEFAULT 0,
  items_purchased INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Cart items table
-- Temporary items added during a shopping trip
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES shopping_trips(id) ON DELETE CASCADE,
  list_item_id UUID REFERENCES shopping_list_items(id) ON DELETE SET NULL,
  item_name VARCHAR(255) NOT NULL,
  price_paid DECIMAL(10,2) NOT NULL,
  quantity DECIMAL(10,2) DEFAULT 1,
  unit_type VARCHAR(50),
  category VARCHAR(100),
  target_price DECIMAL(10,2),
  added_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_shopping_trips_list ON shopping_trips(list_id);
CREATE INDEX IF NOT EXISTS idx_shopping_trips_active ON shopping_trips(completed_at) WHERE completed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cart_items_trip ON cart_items(trip_id);

-- RLS Policies - Public access (same as shopping lists)
ALTER TABLE shopping_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read trips" ON shopping_trips;
DROP POLICY IF EXISTS "Public create trips" ON shopping_trips;
DROP POLICY IF EXISTS "Public update trips" ON shopping_trips;
DROP POLICY IF EXISTS "Public delete trips" ON shopping_trips;

DROP POLICY IF EXISTS "Public read cart items" ON cart_items;
DROP POLICY IF EXISTS "Public create cart items" ON cart_items;
DROP POLICY IF EXISTS "Public update cart items" ON cart_items;
DROP POLICY IF EXISTS "Public delete cart items" ON cart_items;

-- Shopping trips policies
CREATE POLICY "Public read trips" ON shopping_trips
  FOR SELECT USING (true);

CREATE POLICY "Public create trips" ON shopping_trips
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public update trips" ON shopping_trips
  FOR UPDATE USING (true);

CREATE POLICY "Public delete trips" ON shopping_trips
  FOR DELETE USING (true);

-- Cart items policies
CREATE POLICY "Public read cart items" ON cart_items
  FOR SELECT USING (true);

CREATE POLICY "Public create cart items" ON cart_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public update cart items" ON cart_items
  FOR UPDATE USING (true);

CREATE POLICY "Public delete cart items" ON cart_items
  FOR DELETE USING (true);

-- Function to update total_spent when cart items change
CREATE OR REPLACE FUNCTION update_trip_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE shopping_trips
  SET 
    total_spent = (
      SELECT COALESCE(SUM(price_paid * quantity), 0)
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

-- Triggers to automatically update trip totals
DROP TRIGGER IF EXISTS cart_items_insert_trigger ON cart_items;
CREATE TRIGGER cart_items_insert_trigger
  AFTER INSERT ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION update_trip_total();

DROP TRIGGER IF EXISTS cart_items_update_trigger ON cart_items;
CREATE TRIGGER cart_items_update_trigger
  AFTER UPDATE ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION update_trip_total();

DROP TRIGGER IF EXISTS cart_items_delete_trigger ON cart_items;
CREATE TRIGGER cart_items_delete_trigger
  AFTER DELETE ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION update_trip_total();
