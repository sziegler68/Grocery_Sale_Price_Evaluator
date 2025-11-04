# Shopping List Notifications - Setup Guide

## Overview

The shopping list notifications use a **real-time delivery system** via Supabase. Notifications are delivered instantly to all users viewing the same list.

---

## How It Works

### 1. **Live Notifications Table**
- Stores notification messages in the database
- Each notification includes: message, type, sender, and timestamp
- Notifications auto-expire after 1 hour

### 2. **Real-Time Subscription**
- Each user subscribes to notifications for their active list
- When a notification is inserted, Supabase pushes it to all subscribers instantly
- Notifications appear as toast messages and browser notifications

### 3. **Notification Types**
- **Items Purchased**: Batched notifications when items are checked off (every 5 seconds)
- **Shopping Complete**: Manual button - user marks shopping as done
- **Missing Items**: Manual button - user indicates some items weren't found

---

## Database Setup

### Step 1: Run the SQL Schema

In your Supabase dashboard, go to **SQL Editor** and run:

```sql
-- File: supabase/live_notifications_schema.sql
```

This creates:
- `live_notifications` table
- RLS policies for public read/write
- Indexes for performance
- Auto-cleanup function for expired notifications

### Step 2: Verify Table Creation

In Supabase dashboard → **Table Editor**, verify you see:
- `live_notifications` table
- Columns: id, list_id, message, notification_type, triggered_by, created_at, expires_at

### Step 3: Test Real-Time Subscriptions

In Supabase dashboard → **Database** → **Replication**:
- Ensure "Realtime" is enabled for the `public` schema
- Verify `live_notifications` table is included in replication

---

## Testing Notifications

### Test 1: Manual Notifications

1. **Device A**: Open shopping list
2. **Device B**: Open the same shopping list (using share code)
3. **Device A**: Click "Mark as Complete" button
4. **Device B**: Should see toast notification appear instantly
5. **Device A**: Should see "Shopping marked as complete!" success message

### Test 2: Auto Notifications (Checkbox)

1. **Device A**: Check off 3-5 items rapidly
2. Wait 5 seconds
3. **Device B**: Should see notification like "User checked 5 items from Grocery List"

### Test 3: Browser Notifications

1. **Both devices**: Enable browser notifications in Settings
2. **Device A**: Send a notification
3. **Device B**: Should see:
   - Toast notification in app
   - Browser notification (if tab is not active)

---

## Troubleshooting

### Issue: "Failed to send notification"

**Cause**: Supabase RPC functions or table don't exist

**Fix**:
1. Run `supabase/notifications_schema.sql` (for history/throttling)
2. Run `supabase/live_notifications_schema.sql` (for delivery)
3. Verify both tables exist in Supabase dashboard

### Issue: "Notification sent successfully" but not received

**Cause**: Real-time subscriptions not working

**Fix**:
1. Check Supabase dashboard → **Database** → **Replication**
2. Ensure "Realtime" is enabled for `public` schema
3. Verify `live_notifications` is in replication list
4. Check browser console for subscription errors

### Issue: Notifications delayed or not appearing

**Cause**: Subscription not established or network issues

**Fix**:
1. Refresh both devices
2. Check browser console for errors
3. Verify Supabase URL and anon key are correct
4. Test with both devices on same WiFi network

### Issue: Browser notifications not showing

**Cause**: Permission not granted or notifications disabled

**Fix**:
1. Check browser notification permission (should be "granted")
2. In app Settings → Enable "Browser Notifications"
3. Make sure notifications aren't blocked at OS level (iOS/Android settings)

---

## Notification Settings

Users can control notifications in **Settings** page:

- **Enable Notifications**: Master toggle
- **Browser Notifications**: Show desktop/mobile notifications
- **Notification Types**:
  - Items Added
  - Items Purchased
  - Shopping Complete

---

## Technical Details

### Batching & Throttling

**Checkbox Changes**:
- Batched over 5-second window
- Prevents notification spam during rapid checking
- One notification for multiple checks

**Manual Notifications**:
- Not throttled (sent immediately)
- Each manual button click = one notification

### Auto-Cleanup

Notifications older than 1 hour are automatically cleaned up to prevent database bloat.

Optional: Enable pg_cron for automatic cleanup every 30 minutes:
```sql
SELECT cron.schedule(
  'cleanup-notifications', 
  '*/30 * * * *', 
  'SELECT cleanup_expired_notifications()'
);
```

---

## Security

- **Public read/write**: Anyone can send/receive notifications for lists they have access to
- **RLS policies**: Enable row-level security but allow public access (collaborative feature)
- **No authentication required**: Works with anonymous users sharing list codes
- **No sensitive data**: Notifications only contain public list information

---

## Development Tips

### Testing Locally

1. Open app in two browser windows (Chrome + Firefox, or Chrome regular + incognito)
2. Use same share code in both
3. Set different user names
4. Send notifications from one window
5. Verify receipt in other window

### Debugging

Check browser console for:
```javascript
// Subscription established
console.log('Subscribed to notifications');

// Notification received
console.log('Received notification:', payload);

// Errors
console.error('Failed to send notification:', error);
```

---

## Future Enhancements

Potential improvements:
- [ ] Web Push API for notifications when app is closed
- [ ] Service worker for offline notification queuing
- [ ] Email notifications as backup
- [ ] Notification preferences per list
- [ ] Sound effects for notifications
- [ ] Notification history view
