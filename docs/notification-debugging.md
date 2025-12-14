# Notification System - Debugging Guide

## Quick Reference

All notification logs are prefixed with `[NOTIF]` or `[CHECKBOX]` for easy filtering.

---

## Console Log Prefixes

| Prefix | Meaning |
|--------|---------|
| `[NOTIF]` | Notification system events |
| `[CHECKBOX]` | Checkbox sync and notification logic |
| `✅` | Success |
| `❌` | Error |
| `⏱️` | Throttled/skipped |
| `⏭️` | Disabled/skipped |
| `📡` | Subscription event |
| `📬` | Notification received |
| `📤` | Notification sent |
| `🔔` | Function called |

---

## Chrome DevTools Filtering

### See All Notification Events
```
Filter: [NOTIF]
```

### See Only Errors
```
Filter: ❌
```

### See Checkbox Activity
```
Filter: [CHECKBOX]
```

### See Subscription Events
```
Filter: 📡
```

---

## Expected Console Logs

### When Opening a List

```
[NOTIF] 📡 Setting up notification subscription for list: abc12345...
[NOTIF] 👤 Current user: John
[NOTIF] Subscription status: SUBSCRIBED
```

**What to check:**
- ✅ Subscription status should be "SUBSCRIBED"
- ✅ User name should display correctly
- ❌ If you see errors, check Supabase connection

---

### When Checking Items (First Time)

**Device A (clicking checkboxes):**
```
[CHECKBOX] Syncing 3 checkbox changes to Supabase
[CHECKBOX] ✅ Synced to database
[CHECKBOX] Checked count: 3 User: John
[CHECKBOX] Last notification: Never
[CHECKBOX] ✅ Sending notification (1 hour passed or first activity)
[NOTIF] 🔔 notifyItemsPurchased called: {userName: "John", count: 3, customMessage: true}
[NOTIF] 📨 Sending: John started checking items off Grocery List
[NOTIF] 📤 Sending live notification: {type: "items_purchased", message: "John started...", triggeredBy: "John"}
[NOTIF] ✅ Live notification inserted into database
[NOTIF] ✅ Items purchased notification complete
```

**Device B (receiving notification):**
```
[NOTIF] 📬 Received notification: {eventType: "INSERT", new: {...}}
[NOTIF] 📝 Notification details: {type: "items_purchased", triggeredBy: "John", message: "John started checking..."}
[NOTIF] 🎉 Showing notification to user
```

**What to check:**
- ✅ Device A shows "Sending notification"
- ✅ Device A shows "inserted into database"
- ✅ Device B shows "Received notification"
- ✅ Device B shows "Showing notification to user"
- ❌ If Device B doesn't receive, check Real-Time replication in Supabase

---

### When Checking Items (Within 1 Hour)

**Device A:**
```
[CHECKBOX] Syncing 5 checkbox changes to Supabase
[CHECKBOX] ✅ Synced to database
[CHECKBOX] Checked count: 5 User: John
[CHECKBOX] Last notification: 245s ago
[CHECKBOX] ⏱️ Skipping notification (within 1 hour window)
```

**Device B:**
```
(No notification logs - correctly throttled)
```

**What to check:**
- ✅ "Skipping notification (within 1 hour window)" message
- ✅ Time shows seconds since last notification
- ✅ No notification sent to Device B

---

### When Starting Shopping Trip

**Device A:**
```
(Trip start code runs)
[NOTIF] 🔔 Sending trip started notification
[NOTIF] 📤 Sending live notification: {type: "trip_started", ...}
[NOTIF] ✅ Live notification inserted into database
```

**Device B:**
```
[NOTIF] 📬 Received notification: {...}
[NOTIF] 📝 Notification details: {type: "trip_started", message: "John started shopping trip..."}
[NOTIF] 🎉 Showing notification to user
[NOTIF] 🔔 Sending browser notification
```

**What to check:**
- ✅ Trip notifications always send (no throttle)
- ✅ Message includes store name and budget

---

### When Manual Buttons Pressed

**Device A (clicking "Mark Complete"):**
```
[NOTIF] 🔔 Manual notification: Shopping Complete
[NOTIF] 📤 Sending live notification: {type: "shopping_complete", ...}
[NOTIF] ✅ Live notification inserted into database
```

**Device B:**
```
[NOTIF] 📬 Received notification
[NOTIF] 🎉 Showing notification to user
```

---

## Common Issues & Solutions

### Issue 1: "Subscription status: CHANNEL_ERROR"

**Symptoms:**
```
[NOTIF] Subscription status: CHANNEL_ERROR
```

**Cause:** Real-time not enabled in Supabase

**Fix:**
1. Go to Supabase Dashboard → Database → Replication
2. Enable "Realtime" for `public` schema
3. Add `live_notifications` table to replication
4. Refresh app

---

### Issue 2: "❌ Failed to send live notification: relation does not exist"

**Symptoms:**
```
[NOTIF] ❌ Failed to send live notification: {code: "42P01", message: "relation 'live_notifications' does not exist"}
```

**Cause:** `live_notifications` table not created

**Fix:**
1. Run `supabase/live_notifications_schema.sql` in Supabase SQL Editor
2. Verify table exists in Supabase dashboard
3. Refresh app

---

### Issue 3: "❌ Failed to check notification throttle: function does not exist"

**Symptoms:**
```
[NOTIF] ❌ Failed to check notification throttle: function "should_send_notification" does not exist
```

**Cause:** RPC functions not created

**Fix:**
1. Run `supabase/notifications_schema.sql` in Supabase SQL Editor
2. Verify functions exist:
   - `should_send_notification`
   - `record_notification`
3. Refresh app

---

### Issue 4: Device B never receives notifications

**Symptoms:**
```
Device A: [NOTIF] ✅ Live notification inserted into database
Device B: (no logs at all)
```

**Cause:** Real-time subscription not established

**Fix:**
1. Check Device B console for subscription logs
2. Look for `[NOTIF] 📡 Setting up notification subscription`
3. Look for `[NOTIF] Subscription status: SUBSCRIBED`
4. If missing, check Supabase real-time settings

---

### Issue 5: "⏭️ Notifications disabled in settings"

**Symptoms:**
```
[NOTIF] 🔔 notifyItemsPurchased called: {...}
[NOTIF] ⏭️ Notifications disabled in settings
```

**Cause:** User disabled notifications in Settings

**Fix:**
1. Go to Settings page
2. Enable "Enable Notifications"
3. Enable specific notification types
4. Try again

---

### Issue 6: "⚠️ No user name set - cannot send notification"

**Symptoms:**
```
[CHECKBOX] ⚠️ No user name set - cannot send notification
```

**Cause:** User hasn't set their name for the list

**Fix:**
1. When opening list, set your name in the modal
2. Or manually add name via list settings

---

## Testing Checklist

### Test 1: Subscription Setup
- [ ] Open list on Device A
- [ ] Check console for: `[NOTIF] 📡 Setting up notification subscription`
- [ ] Check console for: `[NOTIF] Subscription status: SUBSCRIBED`
- [ ] Verify user name shows correctly

### Test 2: Send Notification (Device A)
- [ ] Click "Mark as Complete" button
- [ ] Check console for: `[NOTIF] 📤 Sending live notification`
- [ ] Check console for: `[NOTIF] ✅ Live notification inserted into database`
- [ ] No errors should appear

### Test 3: Receive Notification (Device B)
- [ ] Within 5 seconds, check Device B console
- [ ] Look for: `[NOTIF] 📬 Received notification`
- [ ] Look for: `[NOTIF] 🎉 Showing notification to user`
- [ ] Toast notification should appear on screen

### Test 4: Self-Filter
- [ ] Device A sends notification
- [ ] Device A console shows: `[NOTIF] ⏭️ Skipping - triggered by current user`
- [ ] Device A should NOT see toast notification

### Test 5: Throttling
- [ ] Check off first item
- [ ] Console: `[CHECKBOX] ✅ Sending notification (1 hour passed or first activity)`
- [ ] Check off 5 more items within 1 hour
- [ ] Console: `[CHECKBOX] ⏱️ Skipping notification (within 1 hour window)`

---

## Disabling Debug Logs

To disable verbose logging in production:

**File: `notificationService.ts`**
```typescript
// Change this line from:
const DEBUG_NOTIFICATIONS = true;

// To:
const DEBUG_NOTIFICATIONS = false;
```

This will silence all `[NOTIF]` logs while keeping errors visible.

---

## Advanced Debugging

### See Real-Time Events in Browser

**Chrome DevTools → Network → WS (WebSocket tab)**
- Should see connection to Supabase realtime server
- Look for messages flowing when notifications sent

### Test Notification Delivery Without Code

**Supabase SQL Editor:**
```sql
-- Manually insert a test notification
INSERT INTO public.live_notifications (list_id, message, notification_type, triggered_by)
VALUES (
  'YOUR_LIST_ID_HERE',
  'Test notification from SQL',
  'test',
  'Admin'
);
```

If Device B receives this, real-time is working!

### Check Notification History

**Supabase SQL Editor:**
```sql
-- See recent notifications sent
SELECT * FROM public.notification_history
ORDER BY last_sent DESC
LIMIT 10;

-- See recent live notifications
SELECT * FROM public.live_notifications
ORDER BY created_at DESC
LIMIT 10;
```

---

## Performance Impact

Debug logging adds minimal overhead:
- ~0.1ms per log statement
- No blocking operations
- Logs only to browser console
- Safe to leave enabled during testing

Disable for production to reduce console noise.
