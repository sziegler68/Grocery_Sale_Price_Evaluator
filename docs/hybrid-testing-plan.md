# Hybrid Testing Plan - Post-Refactor Validation
**Date:** 2025-11-10  
**Branch:** `refactor/professional-architecture-overhaul`  
**Approach:** Technical Validation → User Journey Testing

---

## Overview

This plan combines technical infrastructure validation with comprehensive user experience testing. Execute phases sequentially - if Phase 1 reveals critical issues, fix them before proceeding to Phase 2.

---

# PHASE 1: Technical Validation & Infrastructure

**Goal:** Verify that the refactored architecture is stable and properly configured

## 1.1 Database & Schema Validation

### Supabase Console Checks
- [ ] Log into Supabase dashboard
- [ ] Navigate to Table Editor
- [ ] Verify all tables exist:
  - `grocery_items` (price tracker)
  - `shopping_lists`
  - `shopping_list_items`
  - `shopping_trips`
  - `shopping_trip_items`
  - `live_notifications`
  - `notifications`
- [ ] Check `grocery_items` table columns include:
  - Quality fields (new)
  - Tax-related fields
  - Category enum matches code
- [ ] Check `shopping_list_items` has quality fields
- [ ] Check `shopping_trip_items` has quality/tax fields

### Migration Verification
- [ ] Open `/workspace/supabase/` folder
- [ ] Review recent migration files
- [ ] Confirm migrations have been applied to Supabase (check migration history)
- [ ] If any migrations pending, apply them now

### Category Enum Check
- [ ] In Supabase, check category enum values
- [ ] Compare with `/workspace/src/shared/constants/categories.ts`
- [ ] Verify they match exactly (especially "Meat" vs "Meats")

---

## 1.2 Development Environment Setup

### Clean Start
- [ ] Clear browser cache (Ctrl+Shift+Delete)
- [ ] Clear local storage: 
  - Open DevTools (F12)
  - Application tab → Local Storage → Clear All
- [ ] Clear session storage:
  - Application tab → Session Storage → Clear All
- [ ] Close all browser tabs for the app
- [ ] Optional: Use incognito/private window for completely fresh session

### Build & Start Application
- [ ] Terminal: `npm install` (verify dependencies)
- [ ] Terminal: `npm run build` (verify build succeeds, no TypeScript errors)
- [ ] Terminal: `npm run dev` (start development server)
- [ ] Note the local URL (e.g., http://localhost:5173)
- [ ] Open app in browser
- [ ] Check browser console (F12) - should have zero errors on initial load

---

## 1.3 Initial Console & Network Validation

### Browser Console Check
- [ ] Open DevTools (F12) → Console tab
- [ ] Refresh page
- [ ] Check for:
  - ❌ Red errors (document any found)
  - ⚠️ Warnings (note if excessive, ignore common React warnings)
  - Supabase connection messages (should see "Connected" or similar)
- [ ] Console should be mostly clean

### Network Tab Inspection
- [ ] DevTools → Network tab
- [ ] Refresh page
- [ ] Check for:
  - Supabase API requests succeeding (status 200)
  - No failed requests (status 400, 500)
  - Reasonable load times (no requests hanging)
- [ ] Keep Network tab open during testing to catch issues

### Supabase Realtime Connection
- [ ] In console, look for Supabase realtime connection logs
- [ ] Should see: "Realtime connected" or similar
- [ ] If errors, note them before proceeding

---

## 1.4 Global UI/UX Baseline

### Header & Footer
- [ ] Header renders correctly (logo, nav links, dark mode toggle)
- [ ] Footer renders correctly (links, copyright, version)
- [ ] All nav links are clickable (don't test destinations yet)
- [ ] No visual glitches (overlapping text, broken layout)

### Dark Mode Toggle
- [ ] Toggle dark mode ON
- [ ] Check that theme applies immediately (no refresh needed)
- [ ] Toggle dark mode OFF
- [ ] Refresh page
- [ ] Verify theme preference persisted

### Initial Navigation
- [ ] Click each main navigation link once:
  - Home
  - Price Tracker / Search Database
  - Shopping Lists
  - Shopping Trips
  - Settings
  - Help (if available)
  - Analytics (if available)
- [ ] Each page loads without console errors
- [ ] No unexpected redirects or 404 errors
- [ ] Return to Home

---

## 1.5 Authentication & Identity (If Applicable)

- [ ] Check if app requires login/signup
- [ ] If yes, authenticate successfully
- [ ] If no, verify anonymous/demo mode works
- [ ] Check console for auth-related errors
- [ ] Verify user identity persists across page refreshes

---

## 1.6 Error Boundary & Fallback Testing

### Simulate Network Failure
- [ ] DevTools → Network tab → Throttling dropdown
- [ ] Select "Offline"
- [ ] Try to navigate to a page that requires data
- [ ] Verify app shows graceful error message (not white screen)
- [ ] Error boundary catches failure
- [ ] Switch back to "Online"
- [ ] App recovers without full page refresh

### Simulate API Failure (Optional)
- [ ] DevTools → Network tab → Right-click on Supabase request
- [ ] "Block request URL" or use extension to block API
- [ ] Attempt to load data
- [ ] Verify error handling (toast, banner, or error message)
- [ ] Unblock request
- [ ] App recovers

---

## 1.7 Store & State Management Validation

### Zustand Store Inspection (Dev Mode)
- [ ] Open React DevTools (if installed)
- [ ] Check for Zustand stores in component tree:
  - `usePriceTrackerStore`
  - `useShoppingListStore`
  - `useShoppingTripStore`
  - `useNotificationStore`
- [ ] Verify stores initialize without errors
- [ ] Check that state updates when actions are triggered

### State Persistence
- [ ] Perform an action that updates state (e.g., add item)
- [ ] Refresh page
- [ ] Verify state persists (item still there)
- [ ] Check local storage for any persisted state keys

---

## 1.8 Shared Components Regression

### QualitySelector Component
- [ ] Navigate to Price Tracker → Add Item
- [ ] Quality selector appears
- [ ] Select different categories (Meat, Seafood, Produce)
- [ ] Verify category-specific options appear/disappear correctly
- [ ] No console errors when toggling categories

### Settings Modal
- [ ] Open Settings
- [ ] Modal opens without errors
- [ ] All settings fields render
- [ ] Can close modal (X button, outside click, Escape key)
- [ ] No console errors

### Help Overlay (If Available)
- [ ] Click Help link
- [ ] Help content displays
- [ ] Can close help
- [ ] No console errors

---

## 1.9 Accessibility Quick Pass

### Keyboard Navigation
- [ ] Tab through page elements
- [ ] Focus indicators visible (blue outline or similar)
- [ ] Can reach all interactive elements (buttons, links, inputs)
- [ ] Can activate buttons with Enter/Space
- [ ] Can close modals with Escape key

### ARIA Labels (Spot Check)
- [ ] Inspect a few buttons/inputs in DevTools
- [ ] Check for `aria-label` or `aria-labelledby` on icon-only buttons
- [ ] Note any accessibility warnings in console

---

## 1.10 Performance Baseline

### React Profiler (Optional - If Available)
- [ ] Open React DevTools → Profiler tab
- [ ] Click record
- [ ] Perform common actions (navigate, add item, filter list)
- [ ] Stop recording
- [ ] Review for any excessive re-renders (>10ms render times)
- [ ] Note any components that re-render excessively

### Browser Performance
- [ ] DevTools → Performance tab (or Lighthouse)
- [ ] Record page load
- [ ] Check for:
  - Reasonable load time
  - No long tasks blocking main thread
  - No memory leaks (check memory tab over time)

---

## 1.11 Mobile/Responsive Viewport Test

### Resize Browser
- [ ] DevTools → Toggle device toolbar (Ctrl+Shift+M)
- [ ] Test common viewport sizes:
  - Mobile: 375x667 (iPhone SE)
  - Tablet: 768x1024 (iPad)
  - Desktop: 1920x1080
- [ ] Navigate to each main page
- [ ] Verify layout adapts (no horizontal scroll, readable text, usable buttons)
- [ ] Modals fit on screen
- [ ] Forms are usable (inputs not cut off)

---

## ✅ Phase 1 Checkpoint

**Before proceeding to Phase 2, ensure:**
- [ ] Zero critical console errors
- [ ] Supabase connected successfully
- [ ] All main pages load
- [ ] Dark mode works
- [ ] Error boundaries function
- [ ] Responsive layout acceptable
- [ ] No build/TypeScript errors

**If any critical issues found:**
- Document them
- Fix blockers before Phase 2
- Re-run Phase 1 after fixes

---

# PHASE 2: User Journey & Feature Testing

**Goal:** Validate all features work end-to-end from user perspective

## 2.1 Settings & User Setup

### User Name Setup
- [ ] Navigate to Settings
- [ ] User name field visible
- [ ] Enter test name: "Test User"
- [ ] Save settings
- [ ] Success message appears
- [ ] Refresh page
- [ ] User name still shows "Test User"

### Notification Permissions
- [ ] "Grant Push Notification Permission" button visible (or success message if already granted)
- [ ] Click button to grant permission
- [ ] Browser prompts for permission
- [ ] Grant permission
- [ ] Button disappears OR shows "✓ Notifications Enabled"
- [ ] Refresh page
- [ ] Button remains hidden (permission persisted)

**Test:** If you deny permission, does button allow retry?

---

## 2.2 Price Tracker - Create Database

### Add First Item
- [ ] Navigate to Price Tracker / Search Database
- [ ] Click "Add Item" button
- [ ] Modal opens with form

**Test Data #1:**
- Item Name: Chicken Breast
- Store Name: Trader Joe's
- Price: 4.99
- Unit: lb
- Category: Meat
- Quality: Fresh

- [ ] Fill form with test data
- [ ] Submit form
- [ ] Success toast/message appears
- [ ] Modal closes
- [ ] Item appears in list immediately
- [ ] Item shows correct price: $4.99 (not 4.99 or $4.990000)
- [ ] Quality badge shows "Fresh"

### Add Item with Multiple Quality Tags
- [ ] Click "Add Item" again
- [ ] Enter item name: Ground Beef
- [ ] Store: Whole Foods
- [ ] Price: 8.99
- [ ] Unit: lb
- [ ] Category: Meat
- [ ] Quality: Check "Organic" and "Grass Fed" (multiple)
- [ ] Submit
- [ ] Item appears with both quality badges

**Test:** Do quality checkboxes allow multiple selections for general qualities?

### Add Item - Category-Specific Qualities
- [ ] Add Item: Salmon
- [ ] Store: Costco
- [ ] Price: 12.99
- [ ] Unit: lb
- [ ] Category: Seafood
- [ ] Verify Seafood-specific qualities appear (Previously Frozen, Farm Raised, Wild)
- [ ] Select "Wild"
- [ ] Submit
- [ ] Item appears with "Wild" badge

**Test:** Switch category from Meat → Seafood - do quality options change?

### Build Price Database
Add these items (copy from clipboard for speed):

- [ ] Milk - Safeway - $3.49 - gallon - Dairy - Organic
- [ ] Eggs - Costco - $4.99 - dozen - Dairy - Organic  
- [ ] Banana - Trader Joe's - $0.19 - each - Produce
- [ ] Bread - Safeway - $2.99 - loaf - Bakery - Fresh
- [ ] Butter - Whole Foods - $5.99 - lb - Dairy - Organic
- [ ] Rice - Costco - $12.99 - 20lb bag - Pantry
- [ ] Chicken Breast - Costco - $2.99 - lb - Meat - Fresh (duplicate item, different store/price)

**Verify:** All 10 items now in database

---

## 2.3 Price Tracker - Auto-Suggest Testing

### First Use
- [ ] Click "Add Item"
- [ ] Start typing "Chick..."
- [ ] Auto-suggest dropdown appears
- [ ] Dropdown positioned correctly (directly below input, not floating elsewhere)
- [ ] Dropdown shows: Chicken Breast (Trader Joe's) and Chicken Breast (Costco)
- [ ] Click suggestion for Costco
- [ ] Form pre-fills with item details
- [ ] Can override pre-filled values
- [ ] Cancel form

### Second Use (Regression Test)
- [ ] Click "Add Item" again
- [ ] Start typing "Salm..."
- [ ] Auto-suggest dropdown appears again
- [ ] Dropdown positioned correctly

**Test:** Does auto-suggest work on 2nd, 3rd, 4th usage?

---

## 2.4 Price Tracker - Search & Filter Testing

### Search Bar
- [ ] Type "chicken" in search bar
- [ ] List filters to show only chicken items (2 results)
- [ ] Type "XYZ" (item that doesn't exist)
- [ ] Shows "No results" or empty state
- [ ] Clear search
- [ ] All items reappear

### Category Filter
- [ ] Select "Meat" from category dropdown
- [ ] Only meat items appear (3 items: Chicken Breast × 2, Ground Beef)
- [ ] Select "Dairy" 
- [ ] Only dairy items appear
- [ ] Select "All Categories"
- [ ] All items reappear

**Test:** Category filter works independently

### Store Filter
- [ ] Select "Costco" from store dropdown
- [ ] Only Costco items appear (4 items)
- [ ] Select "Trader Joe's"
- [ ] Only Trader Joe's items appear
- [ ] Clear filter
- [ ] All items reappear

**Test:** Store filter works independently

### Combined Filters
- [ ] Select Category: Meat
- [ ] Select Store: Costco
- [ ] Only shows: Chicken Breast (Costco, $2.99)
- [ ] Clear both filters
- [ ] All items reappear

**Test:** Filters work together correctly

### Price Filters
- [ ] Check "Below Target Only" checkbox
- [ ] Note: label should NOT have "??" (should say "Below Target Only")
- [ ] Items filter (requires target prices set)
- [ ] Uncheck "Below Target Only"
- [ ] Check "Above Target Only"
- [ ] Note: label should NOT have "??" 
- [ ] Items filter accordingly
- [ ] Try to check both "Below" and "Above" simultaneously

**Test:** Are "Below Target" and "Above Target" mutually exclusive?

### Best Price Filter
- [ ] Check "Best Prices Only"
- [ ] Should show only lowest price for each unique item
- [ ] For Chicken Breast: should show $2.99 (Costco) only, not $4.99 (Trader Joe's)
- [ ] Uncheck filter
- [ ] Both Chicken Breast entries reappear

**Test:** Best price logic is correct (shows minimum price per item)

---

## 2.5 Price Tracker - Sorting

- [ ] Sort by: Price (Low to High)
- [ ] Items reorder: Banana ($0.19) should be first
- [ ] Sort by: Price (High to Low)
- [ ] Items reorder: Rice ($12.99) or Salmon ($12.99) should be first
- [ ] Sort by: Name (A-Z)
- [ ] Items alphabetized: Banana, Bread, Butter, etc.
- [ ] Sort by: Store
- [ ] Items grouped by store name

**Test:** Does sorting work with active filters?

---

## 2.6 Price Tracker - Item Actions

### View Item Detail
- [ ] Click on any item card
- [ ] Item detail page/modal opens
- [ ] Shows all information: name, store, price, unit, category, quality, date
- [ ] If multiple entries for same item exist, shows price history

### Edit Item
- [ ] Click "Edit" button
- [ ] Edit form opens with pre-filled data
- [ ] Change price from $4.99 to $5.49
- [ ] Save changes
- [ ] Success message appears
- [ ] Updated price shows in list ($5.49)
- [ ] No console errors

**Test:** Try to save invalid data (negative price) - does validation prevent it?

### Delete Item
- [ ] Click "Delete" button on an item
- [ ] Confirmation dialog appears
- [ ] Confirm deletion
- [ ] Item removed from list
- [ ] Success message appears
- [ ] Refresh page
- [ ] Item still gone (persisted)

---

## 2.7 Shopping Lists - Create & Manage Lists

### Create First List
- [ ] Navigate to Shopping Lists
- [ ] Click "Create New List" button
- [ ] Enter name: "Weekly Groceries"
- [ ] Submit
- [ ] List appears in list view
- [ ] Click to open list
- [ ] Shows empty state message

**Test:** Try to create list with empty name - does validation work?

### Create Additional Lists
- [ ] Return to Shopping Lists main view
- [ ] Create list: "Party Shopping"
- [ ] Create list: "Monthly Staples"
- [ ] All 3 lists visible
- [ ] Can click each to view

---

## 2.8 Shopping Lists - Add Items

### Manual Item Entry
- [ ] Open "Weekly Groceries" list
- [ ] Click "Add Item"
- [ ] Form opens

**Test Data:**
- Item: Milk
- Quantity: 2
- Category: Dairy
- Quality: Organic
- Target Price: 3.49

- [ ] Fill form and submit
- [ ] Item appears in list
- [ ] Quantity shows "2" (NOT "?2" - no question mark)
- [ ] Quality badge shows "Organic"
- [ ] Target price shows "$3.49"

**Test:** Check for stray "?" characters anywhere

### Add Item with Auto-Suggest
- [ ] Click "Add Item"
- [ ] Start typing "Chick..."
- [ ] Auto-suggest shows items from Price Tracker database
- [ ] Click "Chicken Breast (Costco, $2.99)"
- [ ] Form pre-fills with:
  - Item name: Chicken Breast
  - Category: Meat
  - Target price: $2.99 (last known price)
- [ ] Set quantity: 3
- [ ] Submit
- [ ] Item appears in list with correct data

### Add Item - Quality Checkboxes
- [ ] Click "Add Item"
- [ ] Select Category: Meat
- [ ] Meat-specific quality options appear
- [ ] Select "Seafood"
- [ ] Seafood-specific options appear
- [ ] Verify quality behavior matches Price Tracker

**Test:** Quality checkboxes work identically in both features

### Build Shopping List
Add these items to "Weekly Groceries":

- [ ] Milk - 2 - Dairy - Organic - $3.49
- [ ] Eggs - 1 - Dairy - Organic - $4.99
- [ ] Chicken Breast - 3 - Meat - Fresh - $2.99
- [ ] Salmon - 1 - Seafood - Wild - $12.99
- [ ] Banana - 6 - Produce - $0.19
- [ ] Bread - 1 - Bakery - Fresh - $2.99
- [ ] Butter - 1 - Dairy - Organic - $5.99

**Verify:** 7 items in "Weekly Groceries" list

---

## 2.9 Shopping Lists - Item Management

### Check/Uncheck Items
- [ ] Click checkbox next to "Milk"
- [ ] Item marks as checked (strikethrough or style change)
- [ ] Click again to uncheck
- [ ] Item returns to normal state
- [ ] Check multiple items
- [ ] State persists (visual indication remains)

### Edit List Item
- [ ] Click edit icon on "Milk"
- [ ] Edit form opens
- [ ] Change quantity from 2 to 3
- [ ] Save changes
- [ ] Quantity updates to 3
- [ ] No console errors

### Delete List Item
- [ ] Click delete icon on "Butter"
- [ ] Confirmation (optional)
- [ ] Item removed
- [ ] List now has 6 items

### Category Consistency Check
- [ ] Note categories available in Shopping Lists
- [ ] Compare with Price Tracker categories
- [ ] Both features should use identical category list

**Test:** Are categories synchronized across features?

---

## 2.10 Shopping Lists - Delete List

- [ ] Return to Shopping Lists main view
- [ ] Find "Party Shopping" list
- [ ] Click delete button
- [ ] Confirmation dialog appears
- [ ] Confirm deletion
- [ ] List removed
- [ ] "Weekly Groceries" and "Monthly Staples" remain

---

## 2.11 Shopping Trips - Start Trip

### Create New Trip
- [ ] Navigate to Shopping Trips
- [ ] Click "Start New Trip"
- [ ] Modal opens

**Test Data:**
- Store: Costco
- Shopping List: Weekly Groceries (select from dropdown)

- [ ] Submit form
- [ ] Trip created
- [ ] Redirects to active trip view
- [ ] Shows empty cart
- [ ] Shows shopping list items on side (if applicable)

---

## 2.12 Shopping Trips - Add Items to Cart

### Manual Item Entry
- [ ] Click "Add Item to Cart"
- [ ] Form opens

**Test Data:**
- Item: Chicken Breast
- Price: 2.99
- Quantity: 3
- Unit: lb
- Category: Meat

- [ ] Fill and submit
- [ ] Item appears in cart
- [ ] Subtotal shows: $8.97 (3 × $2.99)
- [ ] Quantity displays correctly (no "?" character)

### Add from Shopping List
- [ ] Find "Milk" in shopping list panel
- [ ] Click "Add to Cart" button next to it
- [ ] Quick-add form opens
- [ ] Pre-filled with: Milk, target price $3.49
- [ ] Change actual price to: $3.49
- [ ] Set quantity: 2
- [ ] Submit
- [ ] Item added to cart
- [ ] Subtotal updates: $8.97 + $6.98 = $15.95

### Build Shopping Cart
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

- [ ] Verify subtotal shows $37.06

**Test:** Math accuracy - does app calculate correctly?

---

## 2.13 Shopping Trips - Tax & Total Calculation

### Set Tax Rate
- [ ] Find tax rate input field
- [ ] Enter: 8.5%
- [ ] Tax amount calculates automatically

**Expected Tax:** $37.06 × 0.085 = $3.15

- [ ] Verify tax amount: $3.15

### Add CRV (If Applicable)
- [ ] Find CRV field
- [ ] Enter: $0.50
- [ ] Total updates

**Expected Total:** $37.06 + $3.15 + $0.50 = $40.71

- [ ] Verify total: $40.71

**Test:** Change tax rate to 10% - does total recalculate immediately?

---

## 2.14 Shopping Trips - Cart Management

### Edit Cart Item
- [ ] Click edit icon on "Chicken Breast"
- [ ] Change quantity from 3 to 2
- [ ] Save
- [ ] Quantity updates
- [ ] Subtotal recalculates: $37.06 - $2.99 = $34.07
- [ ] Tax recalculates
- [ ] Total updates

### Remove Cart Item
- [ ] Click remove icon on "Bread"
- [ ] Confirmation (optional)
- [ ] Item removed
- [ ] Subtotal recalculates
- [ ] Total updates
- [ ] Cart now has 5 items

### Auto-Suggest in Cart
- [ ] Add another item to cart
- [ ] Start typing item name
- [ ] Auto-suggest dropdown appears
- [ ] Positioned correctly

**Test:** Does auto-suggest work after adding multiple items?

---

## 2.15 Shopping Trips - Complete Trip

### Finish Shopping
- [ ] Click "Complete Trip" or "Finish Shopping" button
- [ ] Confirmation dialog appears: "Save all prices to database?"
- [ ] Confirm
- [ ] Trip marked as complete
- [ ] Success message appears
- [ ] Redirects to trip summary or trips list

### Verify Data Saved
- [ ] Navigate to Price Tracker / Search Database
- [ ] Find items that were in cart
- [ ] Verify new prices appear in database
- [ ] Check that price history updated (if viewing item detail)

**Test:** Do shopping trip items save to Price Tracker correctly?

---

## 2.16 Shopping Trips - View History

### View Completed Trip
- [ ] Navigate to Shopping Trips
- [ ] Find completed trip in list
- [ ] Shows: Store name, date, total, item count
- [ ] Click to view details
- [ ] Shows all items purchased
- [ ] Shows final totals (subtotal, tax, total)
- [ ] View is read-only (cannot edit completed trip)

### Abandoned Trip Test
- [ ] Start a new trip
- [ ] Add 2 items to cart
- [ ] Navigate away without completing
- [ ] Go back to Shopping Trips

**Test:** Does abandoned trip appear? Can you resume or delete it?

---

## 2.17 Real-Time Notifications - Setup

### Two-Window Setup
- [ ] Open app in two browser windows side by side
- [ ] Window 1: Navigate to Shopping Lists → "Weekly Groceries"
- [ ] Window 2: Navigate to same list
- [ ] Both windows showing same list

---

## 2.18 Real-Time Notifications - Shopping List Sync

### Add Item Sync
- [ ] **Window 1:** Add new item "Coffee"
- [ ] **Window 2:** Watch for item to appear automatically
- [ ] Item appears without manual refresh
- [ ] Toast notification shows: "Item added" (optional)

**Test:** Does real-time sync work?

### Check Item Sync
- [ ] **Window 1:** Check off "Milk" item
- [ ] **Window 2:** Watch for checkbox to update automatically
- [ ] Checkbox marks checked in Window 2
- [ ] Toast notification shows (optional)

### Edit Item Sync
- [ ] **Window 1:** Edit "Coffee" quantity to 2
- [ ] **Window 2:** Quantity updates automatically

**Test:** All CRUD operations sync in real-time?

---

## 2.19 Real-Time Notifications - Shopping Trip Sync

**Setup:**
- [ ] Window 1: Start shopping trip
- [ ] Window 2: Navigate to Shopping Trips page

### Cart Update Sync
- [ ] **Window 1:** Add item to cart
- [ ] **Window 2:** Cart count updates (if visible)
- [ ] **Window 1:** Complete trip
- [ ] **Window 2:** Trip status updates to "Completed"
- [ ] Toast notification shows: "Trip completed"

**Test:** Real-time sync works for shopping trips?

---

## 2.20 Real-Time Notifications - Price Database Sync

**Setup:**
- [ ] Window 1: Price Tracker page
- [ ] Window 2: Price Tracker page

### Add Item Sync
- [ ] **Window 1:** Add new item
- [ ] **Window 2:** Item appears in list automatically

### Edit Item Sync
- [ ] **Window 1:** Edit item price
- [ ] **Window 2:** Price updates automatically

**Test:** Price database has real-time sync?

---

## 2.21 Real-Time Notifications - Browser Notifications

### Check Permission
- [ ] Verify browser notifications granted (from Settings earlier)
- [ ] Minimize browser or switch to different app

### Trigger Notification
- [ ] Have someone else (or use Window 2) add item to shared list
- [ ] Check if browser notification appears (desktop notification)
- [ ] Check notification content (should show what changed)

**Test:** Do browser notifications fire when app is backgrounded?

---

## 2.22 Edge Cases - Invalid Data

### Negative Price
- [ ] Try to add item with price: -5.99
- [ ] Validation error appears
- [ ] Cannot submit form

### Zero Price
- [ ] Try to add item with price: 0
- [ ] Check if allowed or blocked

### Zero Quantity
- [ ] Try to add item with quantity: 0
- [ ] Validation error or default to 1

### Extremely Long Name
- [ ] Try to add item with 500 character name
- [ ] Check if truncated or rejected

### Special Characters
- [ ] Add item: "Café Latté (Organic)"
- [ ] Add item: "Ben & Jerry's Ice Cream"
- [ ] Add item: "🍌 Banana Emoji"
- [ ] All items save and display correctly

**Test:** Does app handle special characters gracefully?

---

## 2.23 Edge Cases - Concurrent Edits

**Setup:**
- [ ] Window 1 & 2: Both open same shopping list
- [ ] Both show "Milk" item

### Conflict Test
- [ ] **Window 1:** Edit "Milk" quantity to 3
- [ ] **Window 2:** Edit "Milk" quantity to 5 (before Window 1 saves)
- [ ] **Both:** Save changes

**Observe:** Which edit wins? Does app crash? Conflict resolution?

---

## 2.24 Edge Cases - Offline Behavior

### Disconnect Test
- [ ] Turn off WiFi or set DevTools to Offline mode
- [ ] Try to add item to shopping list
- [ ] Error message appears (graceful failure)
- [ ] App doesn't crash
- [ ] Reconnect to internet
- [ ] Try again - should work

**Test:** Does app handle offline gracefully?

---

## 2.25 Edge Cases - Session Persistence

### Long Session Test
- [ ] Add several items to shopping list
- [ ] Wait 5-10 minutes (browse other tabs, but keep app open)
- [ ] Return to app
- [ ] Try to add another item
- [ ] Should work without re-authentication

**Test:** Does Supabase session stay alive?

### Cross-Session Persistence
- [ ] Add items to shopping list
- [ ] Close browser completely
- [ ] Reopen browser
- [ ] Navigate to app
- [ ] Shopping list items still present

**Test:** Does data persist across sessions?

---

## 2.26 Visual Quality Checks

### Consistency Audit
- [ ] All buttons styled consistently across pages
- [ ] All form inputs styled consistently
- [ ] Spacing/padding feels balanced
- [ ] Colors match theme (light/dark mode)
- [ ] No overlapping text
- [ ] Icons align properly with text

### Loading States
- [ ] When loading data, appropriate spinner/skeleton shows
- [ ] Loading indicator appears in correct context (component, not full page)
- [ ] No infinite loading states
- [ ] No duplicate loading spinners

### Empty States
- [ ] Empty shopping list shows helpful message + CTA
- [ ] Empty cart shows helpful message + CTA
- [ ] Empty Price Tracker shows helpful message + CTA
- [ ] Empty states are clear and actionable

### Success/Error Messages
- [ ] Success toasts appear after actions
- [ ] Success messages auto-dismiss after a few seconds
- [ ] Error messages appear when actions fail
- [ ] Error messages are specific (not generic "Error occurred")

### Banners
- [ ] No duplicate data source banners
- [ ] Only one banner visible per page
- [ ] Banners are dismissible (if appropriate)

---

## 2.27 Advanced Features (If Implemented)

### OCR / Receipt Scanning
- [ ] OCR feature accessible from navigation
- [ ] Can upload image or use camera
- [ ] Image processes without errors
- [ ] Extracted items appear for review
- [ ] Can edit extracted data before adding
- [ ] Items save to database correctly

### Moderation Queue
- [ ] Moderation dashboard accessible
- [ ] Flagged items appear in queue
- [ ] Can approve/reject items
- [ ] Actions update database
- [ ] Only accessible to authorized users

---

## ✅ Phase 2 Checkpoint

**Feature Completeness Check:**
- [ ] Price Tracker fully functional (add, edit, delete, filter, sort, search)
- [ ] Shopping Lists fully functional (create, add items, check off, delete)
- [ ] Shopping Trips fully functional (start, add to cart, calculate totals, complete)
- [ ] Real-time notifications working across features
- [ ] Quality checkboxes consistent across features
- [ ] Categories synchronized across features
- [ ] Auto-suggest works reliably
- [ ] Edge cases handled gracefully

**Data Integrity Check:**
- [ ] Math calculations accurate (subtotals, tax, totals)
- [ ] Best price logic correct
- [ ] Filter/sort logic correct
- [ ] Data persists across refreshes
- [ ] No data loss or corruption

**UX Quality Check:**
- [ ] No "?" characters in unexpected places
- [ ] No duplicate loading/banners
- [ ] Dark mode consistent
- [ ] Mobile responsive
- [ ] Error messages helpful
- [ ] Success feedback clear

---

# 📋 Bug Tracking Template

For each bug found, document using this format:

---

## Bug #[X]: [Short Title]

**Severity:** 🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low  
**Phase:** Phase 1 | Phase 2  
**Feature Area:** [e.g., Shopping Lists, Price Tracker, Notifications]  

**Description:**  
[What happened? Be specific.]

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Behavior:**  
[What should happen?]

**Actual Behavior:**  
[What actually happened?]

**Screenshots/Video:**  
[If applicable]

**Browser Console Errors:**  
```
[Paste any console errors here]
```

**Network Errors:**  
[Any failed API requests?]

**Environment:**
- Browser: [Chrome 120, Firefox 121, etc.]
- OS: [Windows 11, macOS 14, etc.]
- Device: [Desktop, Mobile, etc.]

---

# 📊 Testing Summary Template

**Date Completed:** _______________  
**Tester:** _______________  
**Branch:** `refactor/professional-architecture-overhaul`  
**Commit Hash:** _______________

## Phase 1 Results
- [ ] Passed - No critical issues
- [ ] Passed with minor issues
- [ ] Failed - Critical blockers found

**Issues Found:** _____  
**Critical Blockers:** _____  

## Phase 2 Results
- [ ] Passed - All features functional
- [ ] Passed with minor bugs
- [ ] Failed - Major features broken

**Total Bugs Found:** _____  
- 🔴 Critical: _____
- 🟠 High: _____
- 🟡 Medium: _____
- 🟢 Low: _____

## Production Readiness
- [ ] Ready for production
- [ ] Ready after minor fixes
- [ ] Needs major fixes
- [ ] Not ready - critical blockers

## Recommendations
[List recommended fixes, priorities, and next steps]

---

# 🎯 Success Criteria

**Phase 1 Success:**
- Zero critical console errors
- All pages load successfully
- Supabase connected
- Dark mode functional
- Error boundaries working

**Phase 2 Success:**
- All CRUD operations work
- Real-time sync functional
- Math calculations accurate
- Data persists correctly
- No data loss or corruption
- Quality/category features work
- Auto-suggest reliable

**Production Ready:**
- Zero critical bugs
- Fewer than 5 high-priority bugs
- UX polish complete (no "?" chars, duplicate loaders, etc.)
- All documented features working
- Performance acceptable
- Mobile responsive

---

**Good luck with testing! 🚀**
