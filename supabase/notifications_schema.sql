-- Notifications for Shopping Lists
-- Run this in your Supabase SQL Editor

-- ============================================
-- TABLE: Notification History (for throttling)
-- ============================================
CREATE TABLE IF NOT EXISTS public.notification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES public.shopping_lists(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'items_added', 'items_purchased', 'shopping_complete', 'missing_items'
  last_sent TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  item_count INTEGER DEFAULT 0,
  triggered_by TEXT
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_notification_history_list 
ON public.notification_history(list_id, event_type, last_sent);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE public.notification_history ENABLE ROW LEVEL SECURITY;

-- Anyone can read notification history
CREATE POLICY "Public read notification history"
ON public.notification_history
FOR SELECT
USING (true);

-- Anyone can insert notification history
CREATE POLICY "Public insert notification history"
ON public.notification_history
FOR INSERT
WITH CHECK (true);

-- Anyone can update notification history
CREATE POLICY "Public update notification history"
ON public.notification_history
FOR UPDATE
USING (true)
WITH CHECK (true);

-- ============================================
-- HELPER FUNCTION: Check if notification should be sent
-- ============================================
CREATE OR REPLACE FUNCTION should_send_notification(
  p_list_id UUID,
  p_event_type TEXT,
  p_throttle_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN AS $$
DECLARE
  last_notification TIMESTAMPTZ;
BEGIN
  -- Get the last notification time for this list and event type
  SELECT last_sent INTO last_notification
  FROM public.notification_history
  WHERE list_id = p_list_id 
    AND event_type = p_event_type
  ORDER BY last_sent DESC
  LIMIT 1;
  
  -- If no notification exists, or it's been more than throttle minutes, allow
  IF last_notification IS NULL OR 
     NOW() - last_notification > (p_throttle_minutes || ' minutes')::INTERVAL THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- HELPER FUNCTION: Record notification sent
-- ============================================
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
