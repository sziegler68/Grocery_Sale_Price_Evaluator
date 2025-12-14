# Bugfix Roadmap – November 2025

**Status:** Ready for Implementation  
**Branch:** `refactor/professional-architecture-overhaul`  
**Scope:** Post-refactor stability sprint - UX polish, data integrity, notifications

---

## Summary

- **Total Issues:** 12 bugs identified
- **Categories:** Global (2), Price Checker (1), Shopping Lists (2), Shopping Trips (3), Search Database (3), Settings (2)
- **Approach:** Fix data integrity issues first, then UX polish
- **No architectural changes required** - all fixes work with current structure

---

## Bug Inventory

### 🔴 HIGH PRIORITY - Data Integrity & Core Functionality

#### 1. Best Price Logic Shows Wrong Values
**Location:** Search Database  
**Symptom:** Shows $32/lb as "best price" when target is $24/lb  
**Investigation:**
- Function `getBestPriceByItemName()` uses `Math.min()` correctly
- Issue might be UI display logic confusing users
- Need to test actual output vs expected behavior

**Files:**
- `src/features/price-tracker/api/groceryData.ts:326-331`
- `src/features/price-tracker/components/ItemCard.tsx:22`
- `src/features/price-tracker/components/Items.tsx:93`

**Fix:**
1. Test "Best Prices Only" filter to confirm actual bug
2. If function is wrong: fix comparison logic
3. If display is wrong: improve visual indicators (green border vs cyan vs red)
4. Add tooltip explaining "best price" = lowest you've paid for this item

---

#### 2. Search Filters & Sort Not Working
**Location:** Search Database  
**Symptom:** Filters/sorting don't apply correctly  
**Investigation:**
- Code looks correct (lines 30-84 in Items.tsx)
- Might be regression from new store integration
- Filter state changes not triggering re-render

**Files:**
- `src/features/price-tracker/components/Items.tsx:30-84`
- `src/features/price-tracker/components/SearchFilter.tsx`
- `src/features/price-tracker/store/usePriceTrackerStore.ts`

**Fix:**
1. Test each filter individually
2. Check if `filteredItems` state updates when filters change
3. Verify `useEffect` dependencies are correct
4. Make "Below Target" and "Above Target" mutually exclusive (radio instead of checkboxes)
5. Remove "??" from "Above Target Only ??" label (line 192)

---

#### 3. Notifications Don't Fire
**Location:** Settings / Global  
**Symptom:** Real-time notifications not delivered  
**Investigation:**
- Multiple potential causes:
  - Supabase RLS policies on `live_notifications` table
  - Realtime subscription not set up correctly
  - Browser notification permission denied
  - 1-hour throttling too aggressive

**Files:**
- `src/features/notifications/api/index.ts`
- `src/features/notifications/store/useNotificationStore.ts`
- `src/features/shopping-lists/components/ShoppingListDetail.tsx:43`
- `supabase/live_notifications_schema.sql`

**Fix:**
1. Add debug logging to notification flow
2. Test Supabase realtime connection in console
3. Verify RLS policies allow insert/read for all users
4. Check browser notification permission status
5. Temporarily disable throttling to test
6. Verify `subscribeToNotifications` is called and cleanup works

---

#### 4. Shopping Trip: Items Persist After Removal
**Location:** Shopping Trips  
**Symptom:** Removing item from cart leaves price data in database  
**Decision:** KEEP THIS BEHAVIOR - it's actually desired  
**Action Required:**
- Add UI copy explaining behavior: "Removed items stay in your price history"
- Update documentation
- Consider adding explicit "Delete from database" option in Search Database page

**Files:**
- `src/features/shopping-trips/components/ShoppingTripView.tsx`
- Documentation only - no code changes

---

### 🟠 MEDIUM PRIORITY - UX Issues

#### 5. Double Banner Messages
**Location:** Global  
**Symptom:** Toasts/banners fire twice for same event  
**Investigation:**
- Multiple components independently showing Supabase connection banners
- Found in: `Items.tsx`, `ItemDetail.tsx`, possibly others

**Files:**
- `src/features/price-tracker/components/Items.tsx:100-111`
- `src/features/price-tracker/components/ItemDetail.tsx`
- Other components with data source banners

**Fix:**
1. Create shared `DataSourceBanner.tsx` component
2. Render once at app level (in `App.tsx` or `Header.tsx`)
3. Remove from individual page components
4. OR: Use context to prevent duplicate renders

---

#### 6. Double Loading Bars
**Location:** Global  
**Symptom:** Multiple loading indicators show simultaneously  
**Investigation:**
- Component-level AND app-level loaders both showing
- Each component has own `isLoading` state from store

**Files:**
- `src/features/price-tracker/components/Items.tsx:139-142`
- `src/features/shopping-lists/components/ShoppingListDetail.tsx:558`
- `src/features/price-tracker/components/EditItem.tsx:63`
- Multiple other components

**Fix:**
1. Audit all loading states - identify which are necessary
2. Centralize app-level loading in store
3. Component loaders should only affect component area, not full page
4. Remove text like "Loading items?" - use consistent spinner instead

---

#### 7. Price Checker: Quality Selector UX Needs Improvement
**Location:** Price Checker (Add Item form)  
**Symptom:** Dropdown is confusing, need fixed checkboxes  
**Requirements:**
- **Always available:** Organic, Fresh, Frozen
- **Meat only:** Choice, Prime, Wagyu, Grass Fed (radio group - only one)
- **Seafood only:** Previously Frozen, Farm Raised, Wild
- Checkboxes grayed out unless category selected
- Allow combinations: "Organic" + "Grass Fed" + "Choice"

**Files:**
- `src/features/price-tracker/components/AddItemForm.tsx:10-15`
- `src/features/price-tracker/types/index.ts` (might need array field)

**Fix:**
1. Create new checkbox grid component
2. Add conditional enable/disable logic based on category
3. Update form validation to accept multiple qualities
4. Consider: Store as array or comma-separated string?
5. Update ItemCard display to show multiple quality badges

---

#### 8. Shopping Lists: Categories Don't Match Price Checker
**Location:** Shopping Lists  
**Symptom:** Different category lists in shopping lists vs price tracker  
**Investigation:**
- Shopping lists: `SHOPPING_LIST_CATEGORIES`
- Price tracker: `categories` array in AddItemForm
- Not synced

**Files:**
- `src/features/shopping-lists/types/index.ts`
- `src/features/price-tracker/components/AddItemForm.tsx:10`

**Fix:**
1. Create shared constants file: `src/shared/constants/categories.ts`
2. Export single source of truth
3. Update both features to import from shared location
4. Decide on final category list (with user input on Meat/Seafood consolidation)

---

#### 9. Shopping Lists: Missing Quality Checkboxes
**Location:** Shopping Lists (Add Item modal)  
**Symptom:** Can't specify quality when adding items to list  
**Dependency:** Must complete Price Checker quality checkboxes (#7) first

**Files:**
- `src/features/shopping-lists/components/AddItemToListModal.tsx`
- `src/features/shopping-lists/types/index.ts`

**Fix:**
1. Copy quality checkbox component from price tracker
2. Add to shopping list item form
3. Add quality field to `ShoppingListItem` type
4. Display quality badges on list items
5. Update Supabase schema if needed

---

#### 10. Settings: "Grant Notification Permission" Button Never Hides
**Location:** Settings  
**Symptom:** Button stays visible even after permission granted  
**Investigation:**
- No conditional rendering based on `Notification.permission`
- Button always shows

**Files:**
- `src/shared/components/Settings.tsx:125-133`

**Fix:**
```typescript
// Check permission on mount
useEffect(() => {
  if ('Notification' in window) {
    setNotificationGranted(Notification.permission === 'granted');
  }
}, []);

// Conditional render
{Notification.permission !== 'granted' && (
  <button onClick={handleRequestPushPermission}>
    Grant Push Notification Permission
  </button>
)}

{Notification.permission === 'granted' && (
  <div className="text-success">✓ Notifications Enabled</div>
)}
```

---

#### 11. Shopping Trip: Auto-Suggest Not Showing Again
**Location:** Shopping Trips  
**Symptom:** Typeahead dropdown doesn't reopen after first use  
**Investigation:**
- `showSuggestions` state not resetting after form submission
- `suggestions` array not recalculated on modal reopen
- Input focus not triggering suggestion state

**Files:**
- `src/features/price-tracker/components/AddItemForm.tsx:123-167`
- `src/features/price-tracker/components/QuickPriceInput.tsx` (if used)

**Fix:**
1. Ensure form `reset()` clears item name properly
2. Add `onFocus` handler to re-enable suggestions
3. Reset `showSuggestions` to `true` on input focus
4. Verify `useEffect` dependencies trigger on name change

---

### 🟢 LOW PRIORITY - Polish

#### 12. Shopping Trip: "?" Appears in Quantity
**Location:** Shopping Trips / Shopping Lists  
**Symptom:** Stray "?" character before quantity display  
**Investigation:** FOUND - Hardcoded in template

**Files:**
- `src/features/shopping-lists/components/ShoppingListItem.tsx:137`

**Current Code:**
```typescript
<span className="ml-2 text-sm text-gray-500">?{item.quantity}</span>
```

**Fix:**
```typescript
<span className="ml-2 text-sm text-gray-500">{item.quantity}</span>
```

---

#### 13. Search Database: Auto-Suggest Position Wrong
**Location:** Search Database  
**Symptom:** Dropdown appears detached from input  
**Investigation:** ROOT CAUSE FOUND

**Files:**
- `src/features/price-tracker/components/SearchFilter.tsx:72-81`
- `src/features/price-tracker/components/AddItemForm.tsx:148-157`

**Current Code:**
```typescript
setDropdownPosition({
  top: rect.bottom + window.scrollY + 4,  // ❌ WRONG
  left: rect.left + window.scrollX,       // ❌ WRONG
  width: rect.width,
});

// Using fixed positioning
<div style={{ position: 'fixed', ... }}>
```

**Problem:** Using `position: fixed` (viewport-relative) but adding scroll offsets

**Fix:**
```typescript
setDropdownPosition({
  top: rect.bottom + 4,  // ✅ No scroll offset
  left: rect.left,       // ✅ No scroll offset
  width: rect.width,
});
```

---

## Implementation Order

### Phase 1: Quick Wins (Start Here)
**Goal:** Immediate visible improvements, build momentum

1. ✅ Remove "?" from quantity (1 line change)
2. ✅ Fix auto-suggest position (remove scroll offsets)
3. ✅ Remove "??" from filter label (cosmetic)
4. ✅ Fix notification permission button (conditional render)

**Push to GitHub after this phase for quick validation**

---

### Phase 2: Data Integrity (Critical)
**Goal:** Fix core functionality bugs

1. ✅ Test and fix best price logic
2. ✅ Fix search filters and sort
3. ✅ Debug and fix notifications (comprehensive logging first)
4. ✅ Add UI copy for removed cart items behavior

**Push to GitHub, test thoroughly**

---

### Phase 3: Global UX (Polish)
**Goal:** Clean up duplicate UI elements

1. ✅ Consolidate duplicate banners
2. ✅ Consolidate duplicate loading bars
3. ✅ Fix auto-suggest not showing again

**Push to GitHub**

---

### Phase 4: Category & Quality (Feature Parity)
**Goal:** Consistent data model across features

1. ✅ Create shared category constants
2. ✅ Implement quality checkboxes in Price Checker
3. ✅ Sync categories to Shopping Lists
4. ✅ Add quality checkboxes to Shopping Lists

**Push to GitHub, full regression test**

---

## Open Questions (Need User Input)

### 1. Best Price Bug
**Question:** Should I test the current behavior first or assume the function is broken?  
**Options:**
- A) Test first, then fix based on findings
- B) Assume display logic is confusing, improve UI indicators

### 2. Category Consolidation
**Question:** Do you want to consolidate Beef/Pork/Chicken into "Meat" category?  
**Options:**
- A) Consolidate: UI shows "Meat", quality checkboxes determine specificity
- B) Keep separate: Maintain current granularity

### 3. Quality Checkbox Multi-Select
**Question:** Confirmed behavior from your doc - "Choice/Prime/Wagyu radio group, but can combine with Organic/Grass-Fed"?  
**Confirmation:** YES ✓

### 4. Shopping Trip Auto-Save
**Question:** When should items be saved to price database?  
**Options:**
- A) Current: Only when trip completes
- B) New: Immediately when added to cart
- **Your decision:** Keep current behavior, just clarify in UI

---

## Testing Checklist (After All Fixes)

- [ ] Best price filter shows correct lowest prices
- [ ] All search filters work independently and combined
- [ ] Notifications fire for: items added, items checked, trip complete
- [ ] No duplicate banners anywhere in app
- [ ] No duplicate loading indicators
- [ ] Quantity displays correctly (no "?")
- [ ] Auto-suggest works on second/third use
- [ ] Auto-suggest dropdown positioned correctly
- [ ] Quality checkboxes enable/disable based on category
- [ ] Quality badges display correctly on items
- [ ] Categories match between Price Checker and Shopping Lists
- [ ] Notification permission button hides when granted

---

## Next Steps

1. Get answers to open questions
2. Start Phase 1 (quick wins)
3. Push after each phase for validation
4. Full regression test after Phase 4

**Ready to start when you give the word!** 🚀
