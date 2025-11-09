# Shopping Trip Feature - Architecture Audit

## Executive Summary

**Verdict: ⚠️ VIOLATION OF SINGLE SOURCE OF TRUTH**

The shopping trip feature has a **critical design flaw**: tax is calculated in **3 different places** using the same formula but separate implementations. This violates DRY and single source of truth principles.

---

## Data Flow Analysis

### 1. Trip Creation
✅ **Location:** `StartShoppingTripModal.tsx` → `ShoppingListDetail.tsx` → `createShoppingTrip()`
- **Status:** GOOD
- User enters: budget, store, tax rate
- Saves: `shopping_trips.sales_tax_rate` (single source)

### 2. Adding Item to Cart

#### Step 2a: QuickPriceInput Preview Calculation
📍 **Location:** `QuickPriceInput.tsx` lines 96-99
```typescript
const totalCrv = crvPerContainer * containerCount;
const taxAmount = totalPrice * (salesTaxRate / 100); // ⚠️ CALCULATION #1
const cartAddition = totalPrice + taxAmount + totalCrv;
```
- **Purpose:** Show preview to user before confirming
- **Tax calculation:** `price * (rate / 100)`

#### Step 2b: Data Passed to Handler
📍 **Location:** `QuickPriceInput.tsx` line 114
```typescript
onConfirm({
  price: totalPrice,      // Pre-tax total (e.g., $11.99)
  quantity: quantityNum,
  crvAmount: totalCrv,    // Total CRV (e.g., $0.60)
  updateTargetPrice: updateTarget
});
// ❌ TAX AMOUNT NOT PASSED!
```

#### Step 2c: Data Saved to Database
📍 **Location:** `addItemToCart()` in `api/index.ts`
```sql
INSERT INTO cart_items (
  price_paid,    -- $11.99
  crv_amount,    -- $0.60
  -- NO tax_amount column!
)
```

### 3. Displaying Individual Cart Item
📍 **Location:** `CartItemCard.tsx` lines 18-21
```typescript
const taxAmount = item.price_paid * (salesTaxRate / 100); // ⚠️ CALCULATION #2
const total = item.price_paid + taxAmount + item.crv_amount;
```
- **Tax calculation:** `price * (rate / 100)` (DUPLICATE!)
- **Depends on:** `trip.sales_tax_rate` being passed as prop

### 4. Calculating Trip Total (Budget Tracker)
📍 **Location:** Supabase trigger `update_trip_total()`
```sql
SELECT sales_tax_rate INTO trip_tax_rate FROM shopping_trips;
SELECT SUM(price_paid) INTO subtotal FROM cart_items;
-- ⚠️ CALCULATION #3
total_spent = (subtotal * (1 + (trip_tax_rate / 100))) + SUM(crv_amount)
```
- **Tax calculation:** `subtotal * (1 + rate / 100)` (DUPLICATE!)

---

## Identified Issues

### 🔴 CRITICAL: Tax Calculated 3 Times
**Problem:** Same formula implemented in 3 locations:
1. QuickPriceInput (client-side preview)
2. CartItemCard (client-side display)
3. Supabase trigger (database calculation)

**Risk:**
- If tax formula needs to change (e.g., compound tax, tax exemptions, rounding rules), must update 3 places
- Easy to introduce bugs where calculations diverge
- Already happened: originally QuickPriceInput showed tax, CartItemCard didn't

**Evidence of Brittleness:**
- User reported: "add item window shows tax, but cart doesn't"
- Root cause: `trip.sales_tax_rate` was 0 because `handleStartTrip` didn't save it
- Fix required updating multiple files

### 🟡 MEDIUM: Missing Tax Storage
**Problem:** Database stores `price_paid` and `crv_amount` but NOT `tax_amount`

**Current Architecture:**
```
QuickPriceInput calculates: price + tax + crv = $13.82
Database stores:            price + 0    + crv = $12.59
CartItemCard recalculates:  price + tax + crv = $13.82
```

**This means:**
- Tax is "virtual" - calculated on-the-fly everywhere
- If `sales_tax_rate` changes mid-trip, all items retroactively show different totals
- No audit trail of actual tax paid per item

### 🟡 MEDIUM: Data Integrity Risk
**Problem:** `trip.sales_tax_rate` is the single source, but can become disconnected

**Scenarios that can break:**
1. User updates Settings tax rate mid-trip → doesn't affect current trip (GOOD)
2. Database migration fails to add `sales_tax_rate` column → defaults to 0 (BAD)
3. `handleStartTrip` forgets to pass tax rate → saves 0 (BAD - just fixed!)
4. Someone manually edits database → trip total becomes wrong

### 🟢 MINOR: Structure Issues
**Problem:** Type definitions don't match reality

**Example:**
```typescript
// types/index.ts - says this is what we store:
export interface CartItem {
  price_paid: number;  // "The price paid for this item"
  crv_amount: number;  // "CRV fee"
  // No tax_amount!
}

// But in reality:
// - price_paid is PRE-TAX total
// - tax is calculated from trip.sales_tax_rate
// - user sees: price + TAX + crv
```

**Comment clarity:**
- `price_paid` comment should specify "pre-tax total"
- Should document that tax is calculated, not stored

---

## Architecture Violations

### Violation 1: Not DRY (Don't Repeat Yourself)
Tax calculation formula exists in 3 places:
- **QuickPriceInput.tsx**: `totalPrice * (salesTaxRate / 100)`
- **CartItemCard.tsx**: `item.price_paid * (salesTaxRate / 100)`
- **fix_trip_total_trigger.sql**: `subtotal * (1 + (trip_tax_rate / 100))`

### Violation 2: Not Single Source of Truth
Tax amount doesn't exist in database - it's recalculated everywhere:
- QuickPriceInput: calculates for preview
- CartItemCard: calculates for display
- Supabase trigger: calculates for total
- **None of them store the result!**

### Violation 3: Tight Coupling
CartItemCard MUST receive `salesTaxRate` prop from parent, which MUST get it from trip, which MUST have been saved correctly during creation. Chain of dependencies means one missing link breaks everything.

---

## Proposed Solutions

### Option A: Store Tax Amount (Recommended)
**Add `tax_amount` column to `cart_items` table**

**Changes:**
1. Migration: `ALTER TABLE cart_items ADD COLUMN tax_amount DECIMAL(10,2) DEFAULT 0`
2. QuickPriceInput: Calculate tax once, pass it to `onConfirm()`
3. addItemToCart: Save `tax_amount` to database
4. CartItemCard: Display `item.tax_amount` (no calculation!)
5. Supabase trigger: `SUM(price_paid + tax_amount + crv_amount)` (no calculation!)

**Pros:**
- True single source of truth
- Tax is immutable once saved (audit trail)
- No recalculation = no formula bugs
- Easier to support tax exemptions, multiple tax rates, etc.

**Cons:**
- Requires database migration
- Existing cart items need backfill (can calculate from current logic)

### Option B: Centralize Tax Calculation Function
**Create shared utility for tax calculation**

**Changes:**
1. Create `src/features/shopping-trips/utils/taxCalculation.ts`:
   ```typescript
   export const calculateTax = (amount: number, taxRate: number): number => {
     return amount * (taxRate / 100);
   };
   ```
2. Use everywhere: QuickPriceInput, CartItemCard, (Supabase trigger can't use it)

**Pros:**
- DRY principle (for client-side code)
- Easier to change formula in one place

**Cons:**
- Still recalculating everywhere
- Supabase trigger still has duplicate formula
- Doesn't solve "tax changes mid-trip" problem

### Option C: Accept Current Architecture (Not Recommended)
**Document that tax is always calculated, never stored**

**Changes:**
1. Add comments explaining the design
2. Add tests to verify calculations match in all 3 places
3. Create a "tax calculation validation" test

**Pros:**
- No code changes needed

**Cons:**
- Still violates single source of truth
- Maintenance burden (must keep 3 formulas in sync)
- Tax can retroactively change if rate changes

---

## Robustness Analysis

### Will it break in edge cases?

#### ✅ Different tax rates per store
- **Works:** Each trip stores its own `sales_tax_rate`
- User can override default when starting trip

#### ✅ CRV containers ≠ quantity
- **Works:** Separate inputs for quantity vs CRV container count
- Example: 24oz bottle = 1 quantity, 1 CRV container

#### ⚠️ Tax rate changes mid-trip
- **Risk:** If user updates Settings tax rate while shopping, what happens?
- **Current behavior:** Existing trip keeps old rate (GOOD)
- **But:** If trip has 0% rate (bug), there's no way to fix it without direct DB edit

#### ❌ Database migration not run
- **Breaks:** If `sales_tax_rate` column doesn't exist, trips created with 0%
- **No fallback:** Code doesn't check if column exists

#### ❌ QuickPriceInput gets wrong `salesTaxRate` prop
- **Risk:** If `ShoppingTripView` passes `0` or `undefined`
- **Current:** Uses `trip.sales_tax_rate || getSalesTaxRate()` as fallback (OK)

#### ❌ Item edited after trip completed
- **Risk:** If cart item is updated, trigger recalculates trip total even if trip is completed
- **No guard:** Trigger doesn't check `completed_at IS NULL`

---

## Structure & Formatting Compliance

### ✅ Follows Feature-Based Architecture
```
src/features/shopping-trips/
  ├── api/           # API calls
  ├── components/    # UI components
  ├── services/      # Business logic
  ├── store/         # Zustand state
  └── types/         # TypeScript types
```

### ✅ TypeScript Types Well-Defined
- Clear interfaces for all entities
- Proper optional fields marked with `?`
- Decimal precision documented in comments

### ✅ Component Separation
- StartShoppingTripModal: Trip creation
- ShoppingTripView: Orchestrator
- CartItemCard: Item display
- BudgetMeter: Budget tracking
- TripHeader: Trip header

### ⚠️ Prop Drilling
CartItemCard needs `salesTaxRate` from ShoppingTripView from trip.
Could use Zustand store instead, but current pattern is acceptable.

---

## Recommendations

### Immediate (High Priority)
1. **Add tax_amount column** to cart_items table (Option A)
2. **Guard against editing completed trips** in Supabase trigger
3. **Add validation** in QuickPriceInput if `salesTaxRate === 0`

### Short Term (Medium Priority)
4. **Add integration test** that verifies:
   - QuickPriceInput preview = CartItemCard display = trip.total_spent
5. **Improve error handling** if trip creation fails
6. **Add comment to types** explaining that `price_paid` is pre-tax

### Long Term (Nice to Have)
7. **Consider tax exemptions** (some items don't have sales tax)
8. **Support multiple tax types** (state + local + special district)
9. **Add rounding rules** (some jurisdictions round tax differently)

---

## Verdict

**Current State: 6/10**
- ✅ Works correctly when everything goes right
- ✅ Follows project structure conventions
- ❌ Violates DRY and single source of truth
- ⚠️ Brittle to edge cases (already broke once)
- ⚠️ Will be painful to maintain if tax logic gets more complex

**After Implementing Option A: 9/10**
- Would achieve true single source of truth
- Would be resilient to edge cases
- Would be easy to extend for complex tax scenarios
