# Phase 6: Regression Test Checklist

This document provides a comprehensive checklist for manually testing all core flows after the refactoring and OCR integration.

---

## Test Environment Setup

### Single Browser Test
- [ ] Clear browser cache and local storage
- [ ] Sign in with a test user account
- [ ] Verify dark mode is working

### Multi-Browser Test
- [ ] Open app in Browser 1 (e.g., Chrome)
- [ ] Open app in Browser 2 (e.g., Firefox or incognito)
- [ ] Sign in with the same user in both browsers

---

## 1. Shopping Lists - CRUD Operations

### Create List
- [ ] Click "Create New List"
- [ ] Enter list name
- [ ] Verify list appears in list view
- [ ] **Multi-browser:** Verify list appears in Browser 2 (real-time sync)

### Add Items to List
- [ ] Open a shopping list
- [ ] Click "Add Item"
- [ ] Enter item name
- [ ] Enter target price (optional)
- [ ] Click "Add"
- [ ] Verify item appears in list
- [ ] **Multi-browser:** Verify item appears in Browser 2

### Check/Uncheck Items
- [ ] Click checkbox to check item
- [ ] Verify item moves to "Checked" section
- [ ] Verify checkbox shows optimistic update (immediate)
- [ ] **Multi-browser:** Verify check status updates in Browser 2
- [ ] Uncheck item
- [ ] Verify item moves back to correct category
- [ ] **Multi-browser:** Verify uncheck updates in Browser 2

### Edit Item
- [ ] Click item to open detail
- [ ] Click "Edit"
- [ ] Change item name or target price
- [ ] Save changes
- [ ] Verify changes persist
- [ ] **Multi-browser:** Verify changes appear in Browser 2

### Delete Item
- [ ] Click item to open detail
- [ ] Click "Delete"
- [ ] Confirm deletion
- [ ] Verify item is removed
- [ ] **Multi-browser:** Verify deletion in Browser 2

### Clear All Items
- [ ] Click "Clear All" button
- [ ] Confirm action
- [ ] Verify all items are removed (but list remains)
- [ ] **Multi-browser:** Verify items cleared in Browser 2

### Delete List
- [ ] Click "Delete List"
- [ ] Confirm deletion
- [ ] Verify list is removed from list view
- [ ] **Multi-browser:** Verify list removed in Browser 2

---

## 2. Shopping Trips

### Start Shopping Trip
- [ ] Open a shopping list with items
- [ ] Click "Start Shopping Trip"
- [ ] Enter store name
- [ ] Enter budget
- [ ] Click "Start Trip"
- [ ] Verify shopping trip view opens
- [ ] Verify list items are visible
- [ ] **Multi-browser:** Verify notification appears in Browser 2

### Add Price to Cart
- [ ] Click list item
- [ ] Enter price paid
- [ ] Enter quantity
- [ ] Click "Add to Cart"
- [ ] Verify item appears in cart section
- [ ] Verify total updates
- [ ] Verify budget comparison updates
- [ ] **Multi-browser:** Verify cart item appears in Browser 2
- [ ] **Multi-browser:** Verify total updates in Browser 2

### Edit Cart Item
- [ ] Click cart item
- [ ] Click "Edit"
- [ ] Change price or quantity
- [ ] Save changes
- [ ] Verify cart item updates
- [ ] Verify total recalculates
- [ ] **Multi-browser:** Verify cart updates in Browser 2
- [ ] **Multi-browser:** Verify total updates in Browser 2

### Remove from Cart
- [ ] Click cart item
- [ ] Click "Remove from Cart"
- [ ] Confirm removal
- [ ] Verify item removed from cart
- [ ] Verify total updates
- [ ] **Multi-browser:** Verify removal in Browser 2

### Complete Trip
- [ ] Add multiple items to cart
- [ ] Click "Complete Trip"
- [ ] Verify trip summary shows
- [ ] Verify items exported to price tracker
- [ ] Verify list returns to normal view
- [ ] Verify notification sent
- [ ] **Multi-browser:** Verify trip completion notification in Browser 2

---

## 3. Price Tracker

### Add Item Manually
- [ ] Go to Price Tracker
- [ ] Click "Add Item"
- [ ] Enter all required fields:
  - Item name
  - Store name
  - Price
  - Quantity
  - Unit type
  - Category
- [ ] Click "Save"
- [ ] Verify item appears in price tracker
- [ ] Verify normalization (capitalization, store name standardization)

### Duplicate Detection
- [ ] Try adding the same item again
- [ ] Verify fuzzy match warning appears
- [ ] Verify user can choose to:
  - Add anyway
  - Update existing item
  - Cancel

### View Item History
- [ ] Click on an item
- [ ] Verify price history chart appears
- [ ] Verify all purchases shown in list
- [ ] Verify date range filter works

### Filter by Store
- [ ] Use store filter dropdown
- [ ] Verify only items from selected store appear
- [ ] Clear filter
- [ ] Verify all items reappear

### Filter by Category
- [ ] Use category filter
- [ ] Verify only items from selected category appear
- [ ] Try multiple category selections
- [ ] Clear filter

### Search Items
- [ ] Enter item name in search box
- [ ] Verify results update in real-time
- [ ] Try partial matches
- [ ] Verify fuzzy search works

---

## 4. OCR Workflow

### Upload Receipt (Mock)
- [ ] Go to Price Tracker or Shopping List
- [ ] Click "Scan Receipt" button
- [ ] Upload a receipt image (or use camera)
- [ ] Verify loading state shows
- [ ] Verify OCR results appear
- [ ] Verify extracted items show:
  - Item names
  - Prices
  - Store name
  - Date
  - Confidence scores

### Review OCR Results
- [ ] Verify flagged items are highlighted (low confidence)
- [ ] Click "Edit" on an item
- [ ] Modify item name or price
- [ ] Save changes
- [ ] Verify changes reflected

### Confirm OCR Items
- [ ] Click "Confirm Items"
- [ ] Verify items are ingested
- [ ] Verify items appear in price tracker
- [ ] Verify OCR metadata is saved (source, confidence, receipt URL)

### OCR History
- [ ] Go to OCR History view
- [ ] Verify recent scans are listed
- [ ] Click on a scan
- [ ] Verify scan details show:
  - Receipt image
  - Extracted text
  - Metadata
  - Confidence score

---

## 5. Moderation Queue

### View Moderation Dashboard
- [ ] Go to Moderation Dashboard (admin view)
- [ ] Verify statistics show:
  - Flagged items count
  - Verified items count
  - Verification rate
- [ ] Verify counts are accurate

### Review Flagged Items
- [ ] Click "Review Queue"
- [ ] Verify flagged items are listed
- [ ] Verify flag reasons are shown
- [ ] Click on an item to view details

### Verify Item
- [ ] Select a flagged item
- [ ] Click "Verify Item"
- [ ] Verify item is removed from queue
- [ ] Verify item is marked as verified in database
- [ ] Verify flagged count decreases

### Reject Item
- [ ] Select a flagged item
- [ ] Click "Reject Item"
- [ ] Verify item is removed from queue
- [ ] Verify item is not shown in price tracker anymore
- [ ] Verify flagged count decreases

### Quick Actions
- [ ] Use quick verify/reject buttons on queue cards
- [ ] Verify actions work without opening detail view
- [ ] Verify counts update immediately

---

## 6. Real-Time Subscriptions

### Shopping List Real-Time Sync
- [ ] **Browser 1:** Add item to list
- [ ] **Browser 2:** Verify item appears immediately (within 1-2 seconds)
- [ ] **Browser 1:** Check item
- [ ] **Browser 2:** Verify item moves to checked section
- [ ] **Browser 1:** Delete item
- [ ] **Browser 2:** Verify item disappears

### Shopping Trip Real-Time Sync
- [ ] **Browser 1:** Add item to cart
- [ ] **Browser 2:** Verify item appears in cart
- [ ] **Browser 2:** Verify total updates
- [ ] **Browser 1:** Edit cart item price
- [ ] **Browser 2:** Verify price and total update
- [ ] **Browser 1:** Remove cart item
- [ ] **Browser 2:** Verify item removed

### Notifications Real-Time Sync
- [ ] **Browser 1:** Start shopping trip
- [ ] **Browser 2:** Verify notification appears
- [ ] **Browser 1:** Complete shopping trip
- [ ] **Browser 2:** Verify completion notification appears

### Subscription Cleanup
- [ ] Open shopping list in Browser 1
- [ ] Verify real-time updates work
- [ ] Navigate away from list
- [ ] Check browser console for subscription cleanup messages
- [ ] Verify no subscription leaks (no warnings in console)
- [ ] Return to list
- [ ] Verify real-time updates still work

---

## 7. Error Handling

### Network Errors
- [ ] Disconnect internet
- [ ] Try to add an item
- [ ] Verify error toast appears
- [ ] Reconnect internet
- [ ] Retry action
- [ ] Verify success toast appears

### Invalid Input
- [ ] Try to add item with empty name
- [ ] Verify validation error shows
- [ ] Try to add item with negative price
- [ ] Verify validation error shows
- [ ] Try to add item with invalid quantity
- [ ] Verify validation error shows

### OCR Errors (Simulated)
- [ ] Upload a non-image file for OCR
- [ ] Verify error message shows
- [ ] Upload image larger than 5MB
- [ ] Verify file size error shows

### Duplicate Handling
- [ ] Add an item to price tracker
- [ ] Try adding same item again
- [ ] Verify fuzzy match warning appears
- [ ] Choose "Update Existing"
- [ ] Verify existing item is updated, not duplicated

### Permission Errors
- [ ] Try to access another user's private list (if applicable)
- [ ] Verify permission denied error
- [ ] Sign out
- [ ] Try to access app features
- [ ] Verify redirect to login

---

## 8. UI/UX Checks

### Loading States
- [ ] Verify loading spinners show during data fetches
- [ ] Verify skeleton screens show for lists
- [ ] Verify "Processing..." states for async actions

### Toasts/Notifications
- [ ] Verify success toast for all create/update/delete actions
- [ ] Verify error toasts for failures
- [ ] Verify toasts auto-dismiss after 3-5 seconds
- [ ] Verify multiple toasts stack properly

### Modals
- [ ] Verify all modals can be closed with X button
- [ ] Verify modals can be closed with Cancel button
- [ ] Verify modals close with Escape key
- [ ] Verify clicking outside modal closes it
- [ ] Verify modal backdrop dims background

### Responsive Design
- [ ] Test on mobile screen size (< 640px)
- [ ] Verify layout adapts
- [ ] Verify touch targets are large enough
- [ ] Test on tablet size (640-1024px)
- [ ] Test on desktop size (> 1024px)

### Dark Mode
- [ ] Verify all components use dark theme
- [ ] Verify text is readable on dark backgrounds
- [ ] Verify no white flash on page load

---

## 9. Data Persistence

### Local Storage
- [ ] Add items to shopping list
- [ ] Refresh page
- [ ] Verify items still appear
- [ ] Close browser
- [ ] Reopen app
- [ ] Verify data persists

### Supabase Sync
- [ ] Add item in Browser 1
- [ ] Close Browser 1
- [ ] Open Browser 2
- [ ] Verify item appears (data is in Supabase, not just local)

---

## 10. Performance

### Load Times
- [ ] Measure initial page load time (should be < 3 seconds)
- [ ] Measure shopping list load time (should be < 2 seconds)
- [ ] Measure price tracker load time (should be < 2 seconds)

### Real-Time Latency
- [ ] Make change in Browser 1
- [ ] Measure time for update to appear in Browser 2
- [ ] Should be < 2 seconds

### OCR Processing Time
- [ ] Upload receipt
- [ ] Measure processing time
- [ ] Should be < 6 seconds (mock endpoint simulates 1s delay)

---

## 11. Regression-Specific Tests

### Verify No Broken Flows
- [ ] Verify old code paths are removed (no direct API calls in components)
- [ ] Verify all state management uses Zustand stores
- [ ] Verify all mutations go through store actions
- [ ] Verify all real-time updates use store subscriptions

### Verify Service Layer Integration
- [ ] Verify `ingestGroceryItem()` is used everywhere items are created
- [ ] Verify `tripService` functions are used for cart operations
- [ ] Verify normalization utilities are used
- [ ] Verify validation utilities are used
- [ ] Verify fuzzy matching is applied

### Verify Phase 4 Integration
- [ ] Verify OCR metadata fields exist in grocery_items
- [ ] Verify OCR scans are persisted in ocr_scans table
- [ ] Verify flagged items trigger moderation workflow
- [ ] Verify suspicious items are auto-flagged

---

## Test Results Summary

Date: ___________
Tester: ___________

| Section | Pass | Fail | Notes |
|---------|------|------|-------|
| 1. Shopping Lists CRUD | ☐ | ☐ | |
| 2. Shopping Trips | ☐ | ☐ | |
| 3. Price Tracker | ☐ | ☐ | |
| 4. OCR Workflow | ☐ | ☐ | |
| 5. Moderation Queue | ☐ | ☐ | |
| 6. Real-Time Subscriptions | ☐ | ☐ | |
| 7. Error Handling | ☐ | ☐ | |
| 8. UI/UX Checks | ☐ | ☐ | |
| 9. Data Persistence | ☐ | ☐ | |
| 10. Performance | ☐ | ☐ | |
| 11. Regression-Specific | ☐ | ☐ | |

**Overall Status:** ☐ PASS ☐ FAIL

**Critical Issues Found:**
- 
- 
- 

**Non-Critical Issues:**
- 
- 
- 

---

## Automated Test Ideas (Future)

For future test automation, consider:

1. **Unit Tests:**
   - Normalization utilities (`normalizeItemName`, etc.)
   - Validation utilities (`validatePrice`, etc.)
   - Fuzzy matching (`calculateSimilarity`)
   - Receipt text parser (`parseReceiptText`)

2. **Integration Tests:**
   - Item ingestion service (`ingestGroceryItem`)
   - Trip service (`addItemToCart`, etc.)
   - Store actions (Zustand)

3. **E2E Tests (Cypress/Playwright):**
   - Complete shopping list flow
   - Complete shopping trip flow
   - OCR workflow (with mock API)
   - Multi-browser real-time sync

4. **API Tests:**
   - Supabase API functions
   - Serverless OCR endpoint
   - Moderation API functions

---

## Notes

- This checklist is extensive and may take 2-4 hours to complete thoroughly
- Focus on critical paths first (shopping lists, trips, price tracker)
- OCR and moderation features can be tested with mock data
- Real-time sync tests require two browser windows
- Report any issues immediately via GitHub Issues or project tracker
