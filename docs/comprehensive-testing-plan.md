# Comprehensive App Testing Plan
**Date:** 2025-11-10  
**Branch:** `refactor/professional-architecture-overhaul`  
**Approach:** New User Journey + Feature Deep Dive

---

## Testing Instructions

**How to Use This Document:**
1. Start fresh (clear browser cache or use incognito mode)
2. Go through each section in order
3. Check off ✅ items as you complete them
4. Document bugs in the "🐛 BUGS FOUND" section at the bottom
5. Rate severity: 🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low
6. Note the exact steps to reproduce

---

## Part 1: First-Time User Experience (Cold Start)

### 1.1 Initial App Load
- [ ] Open app URL
- [ ] Page loads without errors (check browser console - F12)
- [ ] No infinite loading spinners
- [ ] Header displays correctly
- [ ] Footer displays correctly
- [ ] Dark mode toggle works (if available)

**Test:** Switch between light/dark mode - does theme persist on page refresh?

---

### 1.2 Navigation & Home Page
- [ ] Navigate to Home page
- [ ] All navigation links in header work
- [ ] Home page displays welcome content
- [ ] No broken images or missing icons
- [ ] Mobile responsive (resize browser to phone width)

**Test:** Click each nav link and back - does navigation feel smooth?

---

## Part 2: Settings & Permissions (Set Up)

### 2.1 Settings Page - Basic
- [ ] Navigate to Settings
- [ ] Page loads without errors
- [ ] User name field is visible
- [ ] Can enter/update user name
- [ ] User name saves successfully
- [ ] User name persists after page refresh

**Test:** Leave name blank and try to save - does validation work?

---

### 2.2 Settings Page - Notifications
- [ ] Notification settings section visible
- [ ] "Grant Push Notification Permission" button shows if not granted
- [ ] Click button to grant notification permission
- [ ] Browser prompts for notification permission
- [ ] After granting, button disappears OR shows success message
- [ ] Success indicator shows: "✓ Notifications Enabled"

**Test:** Deny notifications - does app handle gracefully? Can you retry?

---

### 2.3 Settings Page - Dark Mode
- [ ] Dark mode toggle switch visible
- [ ] Toggle works immediately (no page refresh needed)
- [ ] Dark mode preference persists after page refresh
- [ ] All pages respect dark mode setting

**Test:** Toggle dark mode on multiple pages - is theme consistent everywhere?

---

## Part 3: Price Tracker / Search Database (Core Feature #1)

### 3.1 Search Database - Initial View
- [ ] Navigate to "Search Database" (or "Price Tracker")
- [ ] Page loads without errors
- [ ] Shows message if no items exist yet
- [ ] OR shows existing items in database
- [ ] No duplicate loading spinners
- [ ] No duplicate "Data source" banners

**Test:** Watch for any double-loading indicators or duplicate messages

---

### 3.2 Add First Item - Basic Fields
- [ ] Click "Add Item" button
- [ ] Modal/form opens
- [ ] All fields are visible and labeled:
  - Item Name (required)
  - Store Name (required)
  - Price (required)
  - Unit (dropdown)
  - Category (dropdown)
  - Quality (checkboxes)
  - Date Purchased

**Test Data:**
- **Item:** Chicken Breast
- **Store:** Trader Joe's
- **Price:** 4.99
- **Unit:** lb
- **Category:** Meat

- [ ] Fill out form with test data
- [ ] Submit form
- [ ] Success message/toast appears
- [ ] Modal closes
- [ ] New item appears in list immediately (no page refresh needed)

**Test:** Try to submit with missing required fields - does validation work?

---

### 3.3 Add Item - Quality Checkboxes
- [ ] Open Add Item form again
- [ ] Quality checkboxes are visible
- [ ] **Always available:** Organic, Fresh, Frozen (can check multiple)
- [ ] Select "Meat" category
- [ ] **Meat-specific options appear:** Choice, Prime, Wagyu, Grass Fed
- [ ] Meat quality options are radio buttons (only one selectable)
- [ ] Can combine general + specific: e.g., "Organic" + "Grass Fed"

**Test Data:**
- **Item:** Ground Beef
- **Store:** Whole Foods
- **Price:** 8.99
- **Unit:** lb
- **Category:** Meat
- **Quality:** Organic, Grass Fed

- [ ] Submit item
- [ ] Item appears with quality badges/indicators

**Test:** Switch to "Seafood" category - do different quality options appear?

---

### 3.4 Add Item - Auto-Suggest
- [ ] Open Add Item form
- [ ] Start typing an item name that already exists (e.g., "Chick...")
- [ ] Auto-suggest dropdown appears below input
- [ ] Dropdown positioned correctly (not floating in wrong place)
- [ ] Click a suggestion
- [ ] Form auto-fills with item details
- [ ] Can override auto-filled values

**Test:** Close form and reopen - does auto-suggest work again on second try?

---

### 3.5 Add Multiple Items (Build Database)
Add these items to build a realistic database:

- [ ] **Milk** - Safeway - $3.49 - gallon - Dairy - Organic
- [ ] **Eggs** - Costco - $4.99 - dozen - Dairy - Organic
- [ ] **Salmon** - Whole Foods - $12.99 - lb - Seafood - Wild
- [ ] **Banana** - Trader Joe's - $0.19 - each - Produce - Organic
- [ ] **Bread** - Safeway - $2.99 - loaf - Bakery - Fresh
- [ ] **Chicken Breast** - Costco - $2.99 - lb - Meat - Fresh (different price/store)

**Test:** Does the app handle 6+ items without performance issues?

---

### 3.6 View Item List
- [ ] All added items appear in list
- [ ] Item cards show: name, store, price, unit, date
- [ ] Quality badges display correctly
- [ ] Price is formatted correctly (e.g., $4.99, not 4.99 or $4.990000)
- [ ] No "?" appearing in unexpected places

**Test:** Scroll through list - is layout consistent? Any visual glitches?

---

### 3.7 Search & Filters - Search Bar
- [ ] Search bar visible at top
- [ ] Type "chicken" in search
- [ ] List filters to show only chicken items
- [ ] Clear search
- [ ] All items reappear

**Test:** Search for item that doesn't exist - does it show "No results"?

---

### 3.8 Search & Filters - Category Filter
- [ ] Category filter dropdown visible
- [ ] Select "Meat" category
- [ ] Only meat items appear
- [ ] Select "All Categories"
- [ ] All items reappear

**Test:** Select multiple filters in sequence - does each one work?

---

### 3.9 Search & Filters - Store Filter
- [ ] Store filter dropdown visible
- [ ] Select "Costco"
- [ ] Only Costco items appear
- [ ] Clear filter
- [ ] All items reappear

**Test:** Combine store + category filters - do they work together?

---

### 3.10 Search & Filters - Price Filters
- [ ] "Below Target Only" checkbox visible
- [ ] "Above Target Only" checkbox visible (should NOT have "??" in label)
- [ ] Check "Below Target Only"
- [ ] Items filter accordingly
- [ ] Uncheck filter
- [ ] Check "Above Target Only"
- [ ] Items filter accordingly

**Test:** Try to check both "Below" and "Above" - are they mutually exclusive?

---

### 3.11 Search & Filters - Best Price Filter
- [ ] "Best Prices Only" checkbox visible
- [ ] Check "Best Prices Only"
- [ ] Only lowest price for each item shows
- [ ] For "Chicken Breast" - should show $2.99 (Costco), not $4.99 (Trader Joe's)

**Test:** Verify best price logic is correct - compare prices manually

---

### 3.12 Sort Options
- [ ] Sort dropdown visible (e.g., "Sort by: Name, Price, Date, Store")
- [ ] Select "Sort by Price (Low to High)"
- [ ] Items reorder correctly (lowest price first)
- [ ] Select "Sort by Price (High to Low)"
- [ ] Items reorder correctly (highest price first)
- [ ] Select "Sort by Name (A-Z)"
- [ ] Items alphabetized

**Test:** Does sorting work with filters active?

---

### 3.13 View Item Details
- [ ] Click on an item card
- [ ] Item detail page/modal opens
- [ ] Shows all item information:
  - Name
  - Store
  - Price & unit price
  - Category
  - Quality
  - Date purchased
  - Price history (if available)

**Test:** Can you navigate back to list easily?

---

### 3.14 Edit Item
- [ ] From item detail view, click "Edit" button
- [ ] Edit form opens with pre-filled data
- [ ] Change price from $4.99 to $5.99
- [ ] Save changes
- [ ] Success message appears
- [ ] Updated price shows in list
- [ ] Price history updated (if tracking enabled)

**Test:** Try to save invalid data (negative price) - does validation work?

---

### 3.15 Delete Item
- [ ] Open item detail
- [ ] Click "Delete" button
- [ ] Confirmation dialog appears (should ask "Are you sure?")
- [ ] Confirm deletion
- [ ] Item removed from list
- [ ] Success message appears

**Test:** Delete an item, then refresh page - is it still gone?

---

## Part 4: Shopping Lists (Core Feature #2)

### 4.1 Shopping Lists - Initial View
- [ ] Navigate to "Shopping Lists"
- [ ] Page loads without errors
- [ ] Shows message if no lists exist
- [ ] "Create New List" button visible

**Test:** Check console for any errors

---

### 4.2 Create First Shopping List
- [ ] Click "Create New List" button
- [ ] Modal/form opens
- [ ] Enter list name: "Weekly Groceries"
- [ ] Submit
- [ ] New list appears
- [ ] Can click on list to open it

**Test:** Try to create list with empty name - does validation work?

---

### 4.3 View Empty Shopping List
- [ ] Open "Weekly Groceries" list
- [ ] Shows empty state message
- [ ] "Add Item" button visible
- [ ] List name displayed as header
- [ ] Back/close button works

---

### 4.4 Add Item to Shopping List - Manual Entry
- [ ] Click "Add Item"
- [ ] Form/modal opens with fields:
  - Item name (required)
  - Quantity (default: 1)
  - Category (dropdown)
  - Quality (checkboxes)
  - Target price (optional)
  - Notes (optional)

**Test Data:**
- **Item:** Milk
- **Quantity:** 2
- **Category:** Dairy
- **Quality:** Organic
- **Target Price:** 3.49

- [ ] Fill form and submit
- [ ] Item appears in shopping list
- [ ] Quantity shows correctly (no "?" character)
- [ ] Quality badges display

**Test:** Quantity should show "2" not "?2"

---

### 4.5 Add Item to Shopping List - Quality Checkboxes
- [ ] Open Add Item form
- [ ] Select "Meat" category
- [ ] Meat-specific quality options appear (Choice, Prime, Wagyu, Grass Fed)
- [ ] Select "Seafood" category
- [ ] Seafood-specific options appear (Previously Frozen, Farm Raised, Wild)
- [ ] Quality checkboxes work same as Price Tracker

**Test Data:**
- **Item:** Salmon
- **Quantity:** 1
- **Category:** Seafood
- **Quality:** Wild
- **Target Price:** 10.99

- [ ] Submit item
- [ ] Item appears with correct quality badge

---

### 4.6 Add Item to Shopping List - Auto-Suggest
- [ ] Open Add Item form
- [ ] Start typing "Chick..."
- [ ] Auto-suggest dropdown appears
- [ ] Suggestions pulled from Price Tracker database
- [ ] Click suggestion
- [ ] Form pre-fills with item details (category, last price as target)
- [ ] Can adjust quantity/target price

**Test:** Does auto-suggest show items from Price Tracker database?

---

### 4.7 Build Shopping List
Add these items to "Weekly Groceries":

- [ ] Milk - 2 - Dairy - Organic - $3.49
- [ ] Eggs - 1 - Dairy - Organic - $4.99
- [ ] Chicken Breast - 3 - Meat - Fresh - $4.99
- [ ] Banana - 6 - Produce - $0.19
- [ ] Bread - 1 - Bakery - Fresh - $2.99

**Test:** Can you add 5+ items smoothly?

---

### 4.8 View Shopping List Items
- [ ] All items appear in list
- [ ] Grouped by category (optional feature)
- [ ] Each item shows:
  - Name
  - Quantity
  - Quality badges
  - Target price (if set)
  - Checkbox to mark as "needed"

**Test:** Are items easy to read and visually organized?

---

### 4.9 Check/Uncheck Items
- [ ] Click checkbox next to "Milk"
- [ ] Item marks as checked (visual change: strikethrough or gray out)
- [ ] Click again to uncheck
- [ ] Item returns to normal state

**Test:** Check multiple items - does state persist?

---

### 4.10 Edit Item in Shopping List
- [ ] Click on item (or Edit icon)
- [ ] Edit form opens
- [ ] Change quantity from 2 to 3
- [ ] Save changes
- [ ] Updated quantity displays

**Test:** Edit target price - does it update correctly?

---

### 4.11 Delete Item from Shopping List
- [ ] Click delete icon on an item
- [ ] Confirmation dialog (optional)
- [ ] Item removed from list

**Test:** Delete item, refresh page - is it still gone?

---

### 4.12 Category Consistency Check
- [ ] Open Price Tracker in new tab
- [ ] Note available categories
- [ ] Return to Shopping Lists
- [ ] Open Add Item form
- [ ] Compare category dropdowns

**Test:** Are categories identical between Price Tracker and Shopping Lists?

---

### 4.13 Create Multiple Shopping Lists
- [ ] Go back to shopping lists main view
- [ ] Create new list: "Party Shopping"
- [ ] Create new list: "Monthly Staples"
- [ ] All three lists appear
- [ ] Can switch between lists easily

**Test:** Add items to different lists - does data stay separate?

---

### 4.14 Delete Shopping List
- [ ] Find delete button for "Party Shopping" list
- [ ] Click delete
- [ ] Confirmation dialog appears
- [ ] Confirm deletion
- [ ] List removed
- [ ] Other lists still intact

**Test:** Delete list with items - are items also deleted?

---

## Part 5: Shopping Trips (Core Feature #3)

### 5.1 Shopping Trips - Initial View
- [ ] Navigate to "Shopping Trips"
- [ ] Page loads without errors
- [ ] Shows message if no trips exist
- [ ] "Start New Trip" button visible
- [ ] OR shows list of past trips

---

### 5.2 Start New Shopping Trip - Basic
- [ ] Click "Start New Trip"
- [ ] Modal opens with fields:
  - Store name (required)
  - List to shop from (dropdown - optional)
  - Date (default: today)

**Test Data:**
- **Store:** Costco
- **List:** Weekly Groceries

- [ ] Submit form
- [ ] Trip created
- [ ] Redirects to active trip view
- [ ] Shows empty cart message

---

### 5.3 Shopping Trip - Add Item to Cart (Manual)
- [ ] Click "Add Item to Cart"
- [ ] Form opens with fields:
  - Item name (required)
  - Price (required)
  - Quantity (default: 1)
  - Unit (dropdown)
  - Category (dropdown)
  - Quality (checkboxes)

**Test Data:**
- **Item:** Chicken Breast
- **Price:** 2.99
- **Quantity:** 3
- **Unit:** lb
- **Category:** Meat

- [ ] Submit item
- [ ] Item appears in cart
- [ ] Running subtotal updates
- [ ] Quantity shows correctly (no "?" character)

**Test:** Does subtotal calculate correctly? (3 × $2.99 = $8.97)

---

### 5.4 Shopping Trip - Add Item to Cart (From List)
- [ ] If shopping from a list, list items appear on screen
- [ ] Each list item has "Add to Cart" button
- [ ] Click "Add to Cart" on "Milk"
- [ ] Quick add form opens (pre-filled with item name, suggested price)
- [ ] Enter actual price: $3.49
- [ ] Submit
- [ ] Item added to cart
- [ ] List item marks as "in cart" or changes color

**Test:** Does app suggest target price from shopping list?

---

### 5.5 Shopping Trip - Auto-Suggest in Cart
- [ ] Add item manually to cart
- [ ] Start typing item name
- [ ] Auto-suggest dropdown appears
- [ ] Dropdown positioned correctly
- [ ] Click suggestion
- [ ] Form pre-fills with item details and last known price

**Test:** Does auto-suggest work on second/third use?

---

### 5.6 Build Shopping Cart
Add these items to cart:

- [ ] Milk - $3.49 - 2 - gallon - Dairy
- [ ] Eggs - $4.99 - 1 - dozen - Dairy
- [ ] Chicken Breast - $2.99 - 3 - lb - Meat
- [ ] Salmon - $11.99 - 1 - lb - Seafood
- [ ] Banana - $0.19 - 6 - each - Produce
- [ ] Bread - $2.99 - 1 - loaf - Bakery

**Calculate Expected Subtotal:**
- Milk: $3.49 × 2 = $6.98
- Eggs: $4.99 × 1 = $4.99
- Chicken: $2.99 × 3 = $8.97
- Salmon: $11.99 × 1 = $11.99
- Banana: $0.19 × 6 = $1.14
- Bread: $2.99 × 1 = $2.99
- **Expected Subtotal: $37.06**

- [ ] Subtotal matches expected calculation

**Test:** Math accuracy - does subtotal update correctly as items are added?

---

### 5.7 Shopping Trip - Tax & Fees
- [ ] Tax rate field visible (or in settings)
- [ ] Enter tax rate: 8.5%
- [ ] Tax amount calculates automatically
- [ ] CRV (California Redemption Value) field visible (optional)
- [ ] Enter CRV: $0.50
- [ ] Total updates: Subtotal + Tax + CRV

**Expected:**
- Subtotal: $37.06
- Tax (8.5%): $3.15
- CRV: $0.50
- **Total: $40.71**

- [ ] Total matches expected

**Test:** Change tax rate - does total recalculate immediately?

---

### 5.8 Shopping Trip - Edit Cart Item
- [ ] Click edit icon on cart item
- [ ] Edit form opens
- [ ] Change quantity from 3 to 2
- [ ] Save changes
- [ ] Quantity updates
- [ ] Subtotal recalculates correctly

**Test:** Edit price - does subtotal update?

---

### 5.9 Shopping Trip - Remove Cart Item
- [ ] Click remove/delete icon on cart item
- [ ] Confirmation dialog (optional)
- [ ] Item removed from cart
- [ ] Subtotal recalculates

**Test:** Remove item, then refresh page - is it still gone?

---

### 5.10 Shopping Trip - Complete Trip
- [ ] "Complete Trip" or "Finish Shopping" button visible
- [ ] Click button
- [ ] Confirmation dialog: "Complete trip and save prices to database?"
- [ ] Confirm
- [ ] Trip marked as complete
- [ ] Redirects to trip summary or trips list
- [ ] All cart items saved to Price Tracker database

**Test:** Go to Price Tracker - do you see the new prices?

---

### 5.11 Shopping Trip - View Completed Trip
- [ ] Navigate back to Shopping Trips list
- [ ] Completed trip appears in history
- [ ] Shows: Store name, date, total, item count
- [ ] Click on completed trip
- [ ] View shows all items purchased
- [ ] Cannot edit completed trip (read-only)

**Test:** Try to add items to completed trip - should be disabled

---

### 5.12 Shopping Trip - Abandoned Trip
- [ ] Start a new trip
- [ ] Add 2-3 items to cart
- [ ] Navigate away (don't complete trip)
- [ ] Return to Shopping Trips page

**Test:** Does abandoned trip still appear? Can you resume or delete it?

---

## Part 6: Notifications (Real-Time Features)

### 6.1 Notification Setup
- [ ] Ensure notifications are enabled (from Settings)
- [ ] Open app in two browser windows/tabs (Side by side)

---

### 6.2 Shopping List Notifications
**Window 1:** Open "Weekly Groceries" shopping list  
**Window 2:** Open same list

- [ ] **In Window 1:** Add new item "Butter"
- [ ] **In Window 2:** Item appears automatically (no refresh needed)
- [ ] Toast notification appears: "New item added"
- [ ] **In Window 1:** Check off "Milk" item
- [ ] **In Window 2:** "Milk" automatically marks as checked
- [ ] Toast notification appears

**Test:** Is real-time sync happening? Or do you need to refresh?

---

### 6.3 Shopping Trip Notifications
**Window 1:** Start shopping trip  
**Window 2:** Open shopping trips page

- [ ] **In Window 1:** Add item to cart
- [ ] **In Window 2:** Cart updates automatically
- [ ] **In Window 1:** Complete trip
- [ ] **In Window 2:** Trip status updates to "Completed"
- [ ] Notification shows: "Trip completed"

**Test:** Do notifications fire? Check browser notification tray

---

### 6.4 Price Database Notifications
**Window 1:** Open Price Tracker  
**Window 2:** Open Price Tracker

- [ ] **In Window 1:** Add new item
- [ ] **In Window 2:** Item appears in list automatically
- [ ] **In Window 1:** Edit item price
- [ ] **In Window 2:** Price updates automatically

**Test:** Real-time updates working across all features?

---

### 6.5 Notification Throttling
- [ ] Add 5 items rapidly to a shopping list
- [ ] Check if you receive 5 separate notifications
- [ ] OR if notifications are batched/throttled

**Test:** Are notifications throttled (1 per hour)? Or do they fire immediately?

---

## Part 7: Edge Cases & Error Handling

### 7.1 Offline Behavior
- [ ] Disconnect from internet (turn off WiFi)
- [ ] Try to add item to shopping list
- [ ] Error message appears (graceful failure)
- [ ] Reconnect to internet
- [ ] Try again - should work

**Test:** Does app detect online/offline status?

---

### 7.2 Invalid Data Entry
- [ ] Try to add item with negative price
- [ ] Validation error appears
- [ ] Try to add item with price = 0
- [ ] Try to add item with quantity = 0
- [ ] Try to add item with 1000+ character name

**Test:** Does validation catch all invalid inputs?

---

### 7.3 Large Data Sets
- [ ] Add 50+ items to Price Tracker
- [ ] Navigate to Search Database
- [ ] Check for performance issues:
  - Loading time
  - Scrolling smoothness
  - Filter response time
  - Search response time

**Test:** Does app handle large datasets without lag?

---

### 7.4 Special Characters in Names
- [ ] Add item with special characters: "Café Latté (Organic)"
- [ ] Add item with emoji: "🍌 Banana"
- [ ] Add item with apostrophe: "Ben & Jerry's Ice Cream"
- [ ] All items save and display correctly

**Test:** Do special characters break anything?

---

### 7.5 Concurrent Edits (Conflict Resolution)
**Window 1 & 2:** Both open same shopping list

- [ ] **In Window 1:** Edit item "Milk" price to $3.99
- [ ] **In Window 2:** Edit same item price to $4.49
- [ ] **Both:** Save changes

**Test:** Which edit wins? Is there conflict resolution? Does app crash?

---

### 7.6 Browser Compatibility
Test in multiple browsers (if available):

- [ ] Chrome/Brave/Edge (Chromium-based)
- [ ] Firefox
- [ ] Safari (Mac/iOS)

**Test:** Does app work consistently across browsers?

---

### 7.7 Mobile Responsiveness
- [ ] Resize browser to phone width (375px)
- [ ] Navigate through all pages
- [ ] Forms are usable (no cut-off buttons)
- [ ] Lists scroll properly
- [ ] Dropdowns and modals fit on screen
- [ ] Touch targets large enough

**Test:** Is app fully functional on mobile?

---

### 7.8 Session Persistence
- [ ] Add items to shopping list
- [ ] Close browser completely
- [ ] Reopen app
- [ ] Data still present

**Test:** Does data persist across sessions?

---

### 7.9 Long-Running Session
- [ ] Keep app open for 30+ minutes
- [ ] Try to add/edit items
- [ ] Check if session expires or requires re-auth

**Test:** Does app stay connected to Supabase over time?

---

## Part 8: Visual & UX Quality

### 8.1 Visual Consistency
- [ ] All buttons styled consistently
- [ ] All form inputs styled consistently
- [ ] Spacing/padding feels balanced
- [ ] Colors consistent with theme (light/dark mode)
- [ ] No overlapping text or elements
- [ ] Icons align properly with text

---

### 8.2 Loading States
- [ ] When data loads, spinner/skeleton shows
- [ ] Loading indicators appear in right context (component vs full page)
- [ ] No infinite loading states
- [ ] No multiple simultaneous loading spinners for same action

---

### 8.3 Empty States
- [ ] Empty shopping list shows helpful message
- [ ] Empty shopping trip shows helpful message
- [ ] Empty Price Tracker shows helpful message
- [ ] Empty states include clear call-to-action

---

### 8.4 Success/Error Messages
- [ ] Success messages appear after actions (add, edit, delete)
- [ ] Success messages auto-dismiss (don't stay forever)
- [ ] Error messages appear when actions fail
- [ ] Error messages are helpful (not generic "Error occurred")

---

### 8.5 Banners & Announcements
- [ ] No duplicate banners (e.g., "Using cached data" appears once)
- [ ] Data source banners are accurate
- [ ] Banners dismissible (if appropriate)

---

### 8.6 Accessibility Quick Check
- [ ] Can navigate with keyboard (Tab key)
- [ ] Focus indicators visible
- [ ] Buttons/links have hover states
- [ ] Modals can be closed with Escape key

---

## Part 9: Advanced Features (If Implemented)

### 9.1 OCR / Receipt Scanning
- [ ] OCR feature accessible
- [ ] Can upload receipt image
- [ ] OCR processes image
- [ ] Extracted items appear correctly
- [ ] Can review/edit before adding to database

---

### 9.2 Moderation / Crowdsourcing
- [ ] Moderation queue visible
- [ ] Flagged items appear
- [ ] Can approve/reject items
- [ ] Verified status updates

---

## Part 10: Performance & Console Checks

### 10.1 Browser Console (F12)
- [ ] Open Developer Console
- [ ] Navigate through entire app
- [ ] Check for:
  - ❌ Red errors
  - ⚠️ Warnings (note if excessive)
  - Network errors (failed requests)

**Test:** Clean console = healthy app

---

### 10.2 Network Tab
- [ ] Open Network tab in DevTools
- [ ] Navigate through app
- [ ] Check for:
  - Failed requests (status 400, 500)
  - Slow requests (>5 seconds)
  - Repeated requests (infinite loops)

---

### 10.3 React DevTools (If Installed)
- [ ] Check component tree structure
- [ ] Look for excessive re-renders
- [ ] Check for memory leaks (Components tab)

---

# 🐛 BUGS FOUND - Documentation Section

**Instructions:** Document bugs below using this format:

---

## Bug #1: [Short Title]
**Severity:** 🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low  
**Page/Feature:** [e.g., Shopping Lists - Add Item]  
**Description:** [What happened?]

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Behavior:** [What should happen?]  
**Actual Behavior:** [What actually happened?]  
**Screenshot/Video:** [Link or description]  
**Browser/Device:** [e.g., Chrome 120, Windows 11]  
**Console Errors:** [Copy any errors from browser console]

---

## Bug #2: [Short Title]
**Severity:** 🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low  
**Page/Feature:**  
**Description:**

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Behavior:**  
**Actual Behavior:**  
**Screenshot/Video:**  
**Browser/Device:**  
**Console Errors:**

---

## Bug #3: [Short Title]
_(Add more sections as needed)_

---

# 📊 Testing Summary

**Date Completed:** ________________  
**Total Time:** _______ hours  
**Total Bugs Found:** _______  
- 🔴 Critical: _____
- 🟠 High: _____
- 🟡 Medium: _____
- 🟢 Low: _____

**Overall Assessment:**  
- [ ] App is production-ready
- [ ] App needs minor fixes before production
- [ ] App needs major fixes before production
- [ ] App has critical blockers

**Notes:**
[General observations, patterns noticed, areas of concern]

---

# ✅ Quick Reference - Test Checklist

**Part 1:** First-Time User Experience - ___/6 tests  
**Part 2:** Settings & Permissions - ___/13 tests  
**Part 3:** Price Tracker / Search Database - ___/60+ tests  
**Part 4:** Shopping Lists - ___/45+ tests  
**Part 5:** Shopping Trips - ___/40+ tests  
**Part 6:** Notifications - ___/20+ tests  
**Part 7:** Edge Cases & Error Handling - ___/30+ tests  
**Part 8:** Visual & UX Quality - ___/20+ tests  
**Part 9:** Advanced Features - ___/10 tests (if applicable)  
**Part 10:** Performance & Console - ___/10 tests  

**Total Progress:** _____/250+ tests completed

---

## Tips for Effective Testing

1. **Take Breaks:** Test in 30-minute focused sessions
2. **Use Incognito:** Start fresh each session to catch setup issues
3. **Note Patterns:** If one feature has a bug, check similar features
4. **Test Realistically:** Use real grocery items and realistic prices
5. **Think Like Users:** Try to "break" things with unexpected inputs
6. **Document As You Go:** Don't wait until end to write up bugs
7. **Screenshot Everything:** Visual evidence helps debugging
8. **Check Mobile:** Most grocery shoppers will use phones

---

## Next Steps After Testing

1. Review all bugs found
2. Prioritize by severity
3. Create GitHub issues (or update bugfix roadmap)
4. Fix critical blockers first
5. Re-test after fixes
6. Iterate until production-ready

**Good luck! 🚀 You've got this!**
