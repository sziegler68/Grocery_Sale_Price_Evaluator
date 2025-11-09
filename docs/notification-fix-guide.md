# Notification Troubleshooting Guide

## Issue: Notifications not firing

If notifications aren't working, follow these debugging steps:

### 1. Check Browser Console

Open browser dev tools and look for these log messages:
- `[STORE] 📡 Setting up notification subscription` - Subscription is being created
- `[STORE] 📡 Notification subscription status: SUBSCRIBED` - Successfully connected
- `[STORE] 📬 Received notification:` - Notification received from Supabase

### 2. Enable Supabase Realtime (CRITICAL)

**The `live_notifications` table MUST have realtime enabled in Supabase!**

1. Go to your Supabase Dashboard
2. Navigate to **Database** → **Replication**
3. Find the `live_notifications` table
4. **Enable** realtime replication for this table
5. Save changes

Without this, subscriptions will fail silently!

### 3. Verify RLS Policies

Run this query in Supabase SQL Editor to check policies:

```sql
SELECT * FROM pg_policies WHERE tablename = 'live_notifications';
```

Should see:
- `Public read live notifications` (SELECT)
- `Public insert live notifications` (INSERT)

### 4. Test Notification Insert

Run this in Supabase SQL Editor to manually trigger a notification:

```sql
INSERT INTO live_notifications (list_id, message, notification_type, triggered_by)
VALUES (
  '<your-list-id>',
  'Test notification',
  'test',
  'TestUser'
);
```

If you see the notification in the app, realtime is working!

### 5. Check Browser Notification Permission

```javascript
console.log(Notification.permission); // Should be "granted"
```

If it's "denied", users need to reset browser permissions for your site.

### 6. Common Issues

| Issue | Fix |
|-------|-----|
| Subscription status: CHANNEL_ERROR | Enable realtime in Supabase for `live_notifications` table |
| Subscription status: TIMED_OUT | Check network connection, verify Supabase URL is correct |
| Notifications received but not displayed | Check if triggered_by matches current user (self-notifications are filtered) |
| Browser notification not showing | Check Settings page - "Grant Permission" must be clicked |

### 7. Throttling

Checkbox notifications are throttled to 1 per hour per list. Check logs:
- `[CHECKBOX] ✅ Sending notification (1 hour passed or first activity)` - Will send
- `[CHECKBOX] ⏱️ Skipping notification (within 1 hour window)` - Throttled

### 8. Enhanced Logging

All notification activity is logged with `[NOTIF]` or `[STORE]` prefixes. Search console for these to trace the flow.

---

## Quick Fix Checklist

- [ ] Supabase realtime enabled for `live_notifications` table
- [ ] RLS policies exist (run `SELECT * FROM pg_policies WHERE tablename = 'live_notifications'`)
- [ ] Browser notification permission granted (check Settings page)
- [ ] Not testing with same user (self-notifications are filtered)
- [ ] Network connection active
- [ ] Not within 1-hour throttle window (for checkbox notifications)
