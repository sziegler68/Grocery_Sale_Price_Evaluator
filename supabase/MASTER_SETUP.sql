-- ============================================
-- MASTER DATABASE SETUP
-- Run this ONCE in Supabase SQL Editor to set up entire database
-- ============================================

-- ============================================
-- STEP 1: Enable Extensions
-- ============================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- STEP 2: Create Enums
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'grocery_category') THEN
    CREATE TYPE public.grocery_category AS ENUM (
      'Beef',
      'Pork',
      'Chicken',
      'Seafood',
      'Meat',
      'Dairy',
      'Produce',
      'Bakery',
      'Pantry',
      'Snacks',
      'Drinks',
      'Household',
      'Other'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'meat_quality') THEN
    CREATE TYPE public.meat_quality AS ENUM (
      'Choice',
      'Prime',
      'Wagyu',
      'Grassfed',
      'Organic',
      'Regular',
      'Free Range',
      'Fresh',
      'Farm Raised',
      'Frozen'
    );
  END IF;
END $$;

-- ============================================
-- STEP 3: Create grocery_items Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.grocery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  user_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,

  item_name TEXT NOT NULL,
  category public.grocery_category NOT NULL,
  meat_quality public.meat_quality NULL,

  store_name TEXT NOT NULL,
  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  quantity NUMERIC(12, 3) NOT NULL CHECK (quantity > 0),
  unit_type TEXT NOT NULL,
  unit_price NUMERIC(12, 4) NOT NULL CHECK (unit_price >= 0),
  date_purchased DATE NOT NULL,

  notes TEXT NULL,
  target_price NUMERIC(12, 4) NULL CHECK (target_price >= 0),
  
  -- Quality tracking fields (added immediately)
  organic BOOLEAN DEFAULT FALSE,
  grass_fed BOOLEAN DEFAULT FALSE,
  freshness TEXT CHECK (freshness IN ('Fresh', 'Previously Frozen', 'Frozen')),
  meat_grade TEXT CHECK (meat_grade IN ('Choice', 'Prime', 'Wagyu')),
  seafood_source TEXT CHECK (seafood_source IN ('Wild', 'Farm Raised'))
);

CREATE INDEX IF NOT EXISTS grocery_items_user_id_idx ON public.grocery_items(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS grocery_items_name_idx ON public.grocery_items(item_name);
CREATE INDEX IF NOT EXISTS idx_grocery_items_organic ON public.grocery_items(organic) WHERE organic = TRUE;
CREATE INDEX IF NOT EXISTS idx_grocery_items_freshness ON public.grocery_items(freshness) WHERE freshness IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_grocery_items_meat_grade ON public.grocery_items(meat_grade) WHERE meat_grade IS NOT NULL;

-- ============================================
-- STEP 4: Create Shopping Lists Tables
-- ============================================
CREATE TABLE IF NOT EXISTS public.shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  share_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shopping_lists_share_code 
ON public.shopping_lists(share_code);

CREATE TABLE IF NOT EXISTS public.shopping_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES public.shopping_lists(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity NUMERIC DEFAULT 1,
  unit_type TEXT,
  target_price NUMERIC,
  is_checked BOOLEAN DEFAULT false,
  checked_at TIMESTAMPTZ,
  notes TEXT,
  added_by TEXT,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Quality tracking fields (added immediately)
  organic BOOLEAN DEFAULT FALSE,
  grass_fed BOOLEAN DEFAULT FALSE,
  freshness TEXT CHECK (freshness IN ('Fresh', 'Previously Frozen', 'Frozen')),
  meat_grade TEXT CHECK (meat_grade IN ('Choice', 'Prime', 'Wagyu')),
  seafood_source TEXT CHECK (seafood_source IN ('Wild', 'Farm Raised'))
);

CREATE INDEX IF NOT EXISTS idx_shopping_list_items_list_id 
ON public.shopping_list_items(list_id);

CREATE INDEX IF NOT EXISTS idx_shopping_list_items_sorting 
ON public.shopping_list_items(list_id, is_checked, category, added_at);

-- ============================================
-- STEP 5: Create Shopping Trips Tables
-- ============================================
CREATE TABLE IF NOT EXISTS shopping_trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_id UUID REFERENCES shopping_lists(id) ON DELETE CASCADE,
  budget DECIMAL(10,2) NOT NULL,
  store_name VARCHAR(100),
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  total_spent DECIMAL(10,2) DEFAULT 0,
  items_purchased INTEGER DEFAULT 0,
  sales_tax_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

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
  crv_amount DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  added_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shopping_trips_list ON shopping_trips(list_id);
CREATE INDEX IF NOT EXISTS idx_shopping_trips_active ON shopping_trips(completed_at) WHERE completed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cart_items_trip ON cart_items(trip_id);

-- ============================================
-- STEP 6: Create Notifications Tables
-- ============================================
CREATE TABLE IF NOT EXISTS public.live_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES public.shopping_lists(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  triggered_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 hour')
);

CREATE INDEX IF NOT EXISTS idx_live_notifications_list_created 
ON public.live_notifications(list_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_live_notifications_expires 
ON public.live_notifications(expires_at);

CREATE TABLE IF NOT EXISTS public.notification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES public.shopping_lists(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  last_sent TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  item_count INTEGER DEFAULT 0,
  triggered_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_notification_history_list 
ON public.notification_history(list_id, event_type, last_sent);

-- ============================================
-- STEP 7: Enable Row Level Security
-- ============================================
ALTER TABLE public.grocery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_history ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 8: Create RLS Policies - grocery_items
-- ============================================
CREATE POLICY IF NOT EXISTS "Public read access"
ON public.grocery_items FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Public insert access"
ON public.grocery_items FOR INSERT WITH CHECK (true);

-- ============================================
-- STEP 9: Create RLS Policies - shopping_lists
-- ============================================
CREATE POLICY IF NOT EXISTS "Anyone can create shopping lists"
ON public.shopping_lists FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Public read shopping lists"
ON public.shopping_lists FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Public update shopping lists"
ON public.shopping_lists FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Public delete shopping lists"
ON public.shopping_lists FOR DELETE USING (true);

-- ============================================
-- STEP 10: Create RLS Policies - shopping_list_items
-- ============================================
CREATE POLICY IF NOT EXISTS "Anyone can add shopping list items"
ON public.shopping_list_items FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Public read shopping list items"
ON public.shopping_list_items FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Public update shopping list items"
ON public.shopping_list_items FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Public delete shopping list items"
ON public.shopping_list_items FOR DELETE USING (true);

-- ============================================
-- STEP 11: Create RLS Policies - shopping_trips
-- ============================================
DROP POLICY IF EXISTS "Public read trips" ON shopping_trips;
DROP POLICY IF EXISTS "Public create trips" ON shopping_trips;
DROP POLICY IF EXISTS "Public update trips" ON shopping_trips;
DROP POLICY IF EXISTS "Public delete trips" ON shopping_trips;

CREATE POLICY "Public read trips" ON shopping_trips FOR SELECT USING (true);
CREATE POLICY "Public create trips" ON shopping_trips FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update trips" ON shopping_trips FOR UPDATE USING (true);
CREATE POLICY "Public delete trips" ON shopping_trips FOR DELETE USING (true);

-- ============================================
-- STEP 12: Create RLS Policies - cart_items
-- ============================================
DROP POLICY IF EXISTS "Public read cart items" ON cart_items;
DROP POLICY IF EXISTS "Public create cart items" ON cart_items;
DROP POLICY IF EXISTS "Public update cart items" ON cart_items;
DROP POLICY IF EXISTS "Public delete cart items" ON cart_items;

CREATE POLICY "Public read cart items" ON cart_items FOR SELECT USING (true);
CREATE POLICY "Public create cart items" ON cart_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update cart items" ON cart_items FOR UPDATE USING (true);
CREATE POLICY "Public delete cart items" ON cart_items FOR DELETE USING (true);

-- ============================================
-- STEP 13: Create RLS Policies - notifications
-- ============================================
CREATE POLICY IF NOT EXISTS "Public read live notifications"
ON public.live_notifications FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Public insert live notifications"
ON public.live_notifications FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Public read notification history"
ON public.notification_history FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Public insert notification history"
ON public.notification_history FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Public update notification history"
ON public.notification_history FOR UPDATE USING (true) WITH CHECK (true);

-- ============================================
-- STEP 14: Create Helper Functions
-- ============================================

-- Generate share codes for shopping lists
CREATE OR REPLACE FUNCTION generate_share_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := 'SHOP-';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Update trip total when cart changes
CREATE OR REPLACE FUNCTION update_trip_total()
RETURNS TRIGGER AS $$
BEGIN
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

-- Cleanup expired notifications
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM public.live_notifications
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Check if notification should be sent (throttling)
CREATE OR REPLACE FUNCTION should_send_notification(
  p_list_id UUID,
  p_event_type TEXT,
  p_throttle_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN AS $$
DECLARE
  last_notification TIMESTAMPTZ;
BEGIN
  SELECT last_sent INTO last_notification
  FROM public.notification_history
  WHERE list_id = p_list_id 
    AND event_type = p_event_type
  ORDER BY last_sent DESC
  LIMIT 1;
  
  IF last_notification IS NULL OR 
     NOW() - last_notification > (p_throttle_minutes || ' minutes')::INTERVAL THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Record notification sent
CREATE OR REPLACE FUNCTION record_notification(
  p_list_id UUID,
  p_event_type TEXT,
  p_item_count INTEGER,
  p_triggered_by TEXT
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.notification_history (list_id, event_type, item_count, triggered_by)
  VALUES (p_list_id, p_event_type, p_item_count, p_triggered_by);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 15: Create Triggers
-- ============================================

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

-- ============================================
-- STEP 16: Enable Realtime (for subscriptions)
-- ============================================

-- Enable realtime for tables that need live updates
ALTER PUBLICATION supabase_realtime ADD TABLE grocery_items;
ALTER PUBLICATION supabase_realtime ADD TABLE shopping_lists;
ALTER PUBLICATION supabase_realtime ADD TABLE shopping_list_items;
ALTER PUBLICATION supabase_realtime ADD TABLE shopping_trips;
ALTER PUBLICATION supabase_realtime ADD TABLE cart_items;
ALTER PUBLICATION supabase_realtime ADD TABLE live_notifications;

-- ============================================
-- SETUP COMPLETE!
-- ============================================

-- Verify tables created
SELECT 
  schemaname,
  tablename
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
