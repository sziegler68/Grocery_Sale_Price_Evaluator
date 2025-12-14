# Supabase RLS Setup for Public Collaborative Database

## Goal
Create a shared grocery price database where:
- ? Anyone can read all items
- ? Anyone can add new items
- ? Nobody can delete items
- ? Nobody can modify existing items

This protects your data from malicious users while allowing crowdsourced contributions.

## Step 1: Apply the RLS Policies

1. Go to your Supabase Dashboard
2. Click **SQL Editor** in the left sidebar
3. Create a new query
4. Copy and paste the contents of `supabase/public_collaborative_policies.sql`
5. Click **Run** to execute

## Step 2: Verify the Policies

After running the SQL, verify in your Supabase dashboard:

1. Go to **Authentication** ? **Policies**
2. Find the `grocery_items` table
3. You should see:
   - ? "Public read access" - SELECT for everyone
   - ? "Public insert access" - INSERT for everyone
   - ? No UPDATE policy (prevents modifications)
   - ? No DELETE policy (prevents deletions)

## Step 3: Test It Out

### Test READ (should work):
```javascript
const { data } = await supabase.from('grocery_items').select('*');
// ? Should return all items
```

### Test INSERT (should work):
```javascript
const { data } = await supabase.from('grocery_items').insert({
  item_name: 'Test Banana',
  category: 'Produce',
  // ... other fields
});
// ? Should successfully add the item
```

### Test UPDATE (should fail):
```javascript
const { error } = await supabase.from('grocery_items')
  .update({ price: 999 })
  .eq('id', 'some-id');
// ? Should fail with permission error
```

### Test DELETE (should fail):
```javascript
const { error } = await supabase.from('grocery_items')
  .delete()
  .eq('id', 'some-id');
// ? Should fail with permission error
```

## Optional: Keep Admin Access for Yourself

If you want to maintain the ability to fix/delete bad data, uncomment the admin policies in the SQL file and replace `'your-email@example.com'` with your actual email.

Then you can:
1. Sign in to Supabase with your email
2. Use the Supabase dashboard or authenticated API calls
3. Update or delete items as needed

## Security Notes

### ? What This Protects Against:
- Malicious users clearing your entire table
- Users modifying prices to show false data
- Accidental data corruption from app bugs
- Spam updates changing legitimate entries

### ?? What This Doesn't Protect Against:
- **Spam inserts**: Users can still add unlimited items
  - *Solution*: Add rate limiting or require email verification
- **Duplicate entries**: Users can add the same item multiple times
  - *Solution*: App-level validation or unique constraints
- **Fake data**: Users can add items with wrong prices
  - *Solution*: Community voting/flagging system (future feature)

## Rate Limiting (Recommended)

To prevent spam inserts, consider adding:

1. **Supabase Edge Function** to rate limit inserts
2. **Database trigger** to prevent too many inserts from same IP
3. **App-level throttling** (limit users to X items per hour)

Example trigger to limit inserts:
```sql
-- Add a timestamp column for rate limiting
ALTER TABLE public.grocery_items 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_created_at ON public.grocery_items(created_at);
```

Then in your app, check recent insert count before allowing more.

## Monitoring

Regularly check your database for:
- Unusually high number of inserts
- Suspicious patterns (same user adding 1000 items)
- Duplicate entries

You can query this in SQL Editor:
```sql
-- Count items added in last hour
SELECT COUNT(*) FROM grocery_items 
WHERE created_at > NOW() - INTERVAL '1 hour';

-- Find potential spam (many items from same "session")
SELECT item_name, COUNT(*) as count 
FROM grocery_items 
GROUP BY item_name 
HAVING COUNT(*) > 10
ORDER BY count DESC;
```

## Rollback

If you need to revert to the old policies (user-specific):
```sql
-- Drop public policies
DROP POLICY IF EXISTS "Public read access" ON public.grocery_items;
DROP POLICY IF EXISTS "Public insert access" ON public.grocery_items;

-- Restore user-specific policies
CREATE POLICY "Users can manage their grocery items"
ON public.grocery_items
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

## Questions?

- **Q: Can users see each other's items?**
  - A: Yes! That's the point - everyone contributes to a shared database.

- **Q: What if someone adds fake prices?**
  - A: Since deletes are disabled, you'd need admin access to remove them. Consider adding a "report" feature in the future.

- **Q: Can I make it so users can only edit their own items?**
  - A: Yes, but you'd need to add a `user_id` field and require authentication. Then use: `USING (auth.uid() = user_id)` for updates.

- **Q: How do I clean up spam?**
  - A: Use your admin account (if you set it up) or access the Supabase dashboard directly to delete items.
