-- Live Notifications for Shopping Lists
-- This table stores notifications that get delivered to all users in real-time
-- Run this in your Supabase SQL Editor

-- ============================================
-- TABLE: Live Notifications (for delivery)
-- ============================================
CREATE TABLE IF NOT EXISTS public.live_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES public.shopping_lists(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL, -- 'shopping_complete', 'missing_items', 'items_purchased', 'items_added'
  triggered_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 hour')
);

-- Index for fast lookups and automatic cleanup
CREATE INDEX IF NOT EXISTS idx_live_notifications_list_created 
ON public.live_notifications(list_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_live_notifications_expires 
ON public.live_notifications(expires_at);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE public.live_notifications ENABLE ROW LEVEL SECURITY;

-- Anyone can read live notifications
CREATE POLICY "Public read live notifications"
ON public.live_notifications
FOR SELECT
USING (true);

-- Anyone can insert live notifications
CREATE POLICY "Public insert live notifications"
ON public.live_notifications
FOR INSERT
WITH CHECK (true);

-- Auto-delete expired notifications (cleanup function)
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM public.live_notifications
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Optional: Set up a scheduled job to run cleanup (if you have pg_cron enabled)
-- SELECT cron.schedule('cleanup-notifications', '*/30 * * * *', 'SELECT cleanup_expired_notifications()');
