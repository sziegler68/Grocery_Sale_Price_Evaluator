# Category Expansion Plan

**Date:** 2025-11-10  
**Status:** Proposed Enhancement  
**Complexity:** ⭐⭐ Medium  
**Estimated Time:** 2-3 hours

---

## Current Categories (8)

1. Meat
2. Seafood
3. Dairy
4. Produce
5. Snacks
6. Drinks
7. Household
8. Other

---

## Proposed Categories (17)

**Food Categories:**
1. Meat
2. Seafood
3. Dairy
4. Produce
5. Bakery ✨ NEW
6. Frozen ✨ NEW
7. Pantry ✨ NEW
8. Condiments ✨ NEW
9. Beverages (rename from "Drinks")
10. Snacks

**Non-Food Categories:**
11. Household
12. Personal Care ✨ NEW
13. Baby ✨ NEW
14. Pet ✨ NEW
15. Electronics ✨ NEW
16. Other

---

## Rationale

### Food Categories

**Bakery:**
- Bread, tortillas, bagels, pastries, cakes
- Currently mixed in "Other" or "Produce"

**Frozen:**
- Frozen meals, vegetables, pizza, ice cream
- Important for price tracking frozen vs. fresh

**Pantry:**
- Canned goods, pasta, rice, beans, flour, sugar
- Currently scattered across categories

**Condiments:**
- Ketchup, mayo, mustard, sauces, dressings, oils
- Currently in "Other"

**Beverages (rename from Drinks):**
- More professional/standard term
- Soda, juice, coffee, tea, alcohol

### Non-Food Categories

**Personal Care:**
- Shampoo, soap, toothpaste, deodorant
- Currently in "Household"

**Baby:**
- Diapers, formula, baby food, wipes
- Important category for families

**Pet:**
- Pet food, treats, supplies
- Important category for pet owners

**Electronics:**
- Batteries, phone accessories, chargers
- Sometimes sold at grocery stores

---

## Implementation Steps

### Step 1: Update Code Constants

**File:** `src/shared/constants/categories.ts`

```typescript
// Main categories (expanded)
export const CATEGORIES = [
  // Food
  'Meat',
  'Seafood',
  'Dairy',
  'Produce',
  'Bakery',      // ✨ NEW
  'Frozen',      // ✨ NEW
  'Pantry',      // ✨ NEW
  'Condiments',  // ✨ NEW
  'Beverages',   // Renamed from "Drinks"
  'Snacks',
  // Non-Food
  'Household',
  'Personal Care', // ✨ NEW
  'Baby',         // ✨ NEW
  'Pet',          // ✨ NEW
  'Electronics',  // ✨ NEW
  'Other',
] as const;
```

---

### Step 2: Update Supabase Enum

**Run in Supabase SQL Editor:**

```sql
-- Add new category values to enum
ALTER TYPE grocery_category ADD VALUE IF NOT EXISTS 'Bakery';
ALTER TYPE grocery_category ADD VALUE IF NOT EXISTS 'Frozen';
ALTER TYPE grocery_category ADD VALUE IF NOT EXISTS 'Pantry';
ALTER TYPE grocery_category ADD VALUE IF NOT EXISTS 'Condiments';
ALTER TYPE grocery_category ADD VALUE IF NOT EXISTS 'Beverages';
ALTER TYPE grocery_category ADD VALUE IF NOT EXISTS 'Personal Care';
ALTER TYPE grocery_category ADD VALUE IF NOT EXISTS 'Baby';
ALTER TYPE grocery_category ADD VALUE IF NOT EXISTS 'Pet';
ALTER TYPE grocery_category ADD VALUE IF NOT EXISTS 'Electronics';

-- Optional: Update existing "Drinks" to "Beverages"
UPDATE grocery_items SET category = 'Beverages' WHERE category = 'Drinks';
UPDATE shopping_list_items SET category = 'Beverages' WHERE category = 'Drinks';

-- Verify
SELECT DISTINCT category FROM grocery_items ORDER BY category;
SELECT DISTINCT category FROM shopping_list_items ORDER BY category;
```

---

### Step 3: Migration Script (Safe Approach)

**File:** `supabase/expand_categories.sql`

```sql
-- Safe category expansion migration
-- Adds new categories to enum without breaking existing data

DO $$ 
BEGIN
  -- Add new values to enum (only if they don't exist)
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'Bakery' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'grocery_category')
  ) THEN
    ALTER TYPE grocery_category ADD VALUE 'Bakery';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'Frozen' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'grocery_category')
  ) THEN
    ALTER TYPE grocery_category ADD VALUE 'Frozen';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'Pantry' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'grocery_category')
  ) THEN
    ALTER TYPE grocery_category ADD VALUE 'Pantry';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'Condiments' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'grocery_category')
  ) THEN
    ALTER TYPE grocery_category ADD VALUE 'Condiments';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'Beverages' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'grocery_category')
  ) THEN
    ALTER TYPE grocery_category ADD VALUE 'Beverages';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'Personal Care' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'grocery_category')
  ) THEN
    ALTER TYPE grocery_category ADD VALUE 'Personal Care';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'Baby' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'grocery_category')
  ) THEN
    ALTER TYPE grocery_category ADD VALUE 'Baby';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'Pet' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'grocery_category')
  ) THEN
    ALTER TYPE grocery_category ADD VALUE 'Pet';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'Electronics' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'grocery_category')
  ) THEN
    ALTER TYPE grocery_category ADD VALUE 'Electronics';
  END IF;
END $$;

-- Optional: Migrate "Drinks" to "Beverages" for consistency
UPDATE grocery_items 
SET category = 'Beverages' 
WHERE category = 'Drinks';

UPDATE shopping_list_items 
SET category = 'Beverages' 
WHERE category = 'Drinks';

-- Verify migration
SELECT 
  unnest(enum_range(NULL::grocery_category)) AS category
ORDER BY category;
```

---

### Step 4: Update Unit Preferences in Settings

**File:** `src/shared/components/Settings.tsx`

Add unit preferences for new categories:

```typescript
const categoryUnitDefaults = {
  // Food
  'Meat': 'lb',
  'Seafood': 'lb',
  'Dairy': 'lb',
  'Produce': 'lb',
  'Bakery': 'each',        // ✨ NEW
  'Frozen': 'lb',          // ✨ NEW
  'Pantry': 'lb',          // ✨ NEW
  'Condiments': 'oz',      // ✨ NEW
  'Beverages': 'gallon',   // Updated from Drinks
  'Snacks': 'oz',
  // Non-Food
  'Household': 'each',
  'Personal Care': 'oz',   // ✨ NEW
  'Baby': 'each',          // ✨ NEW
  'Pet': 'lb',             // ✨ NEW
  'Electronics': 'each',   // ✨ NEW
  'Other': 'each',
};
```

---

### Step 5: Add Category Icons (Optional Enhancement)

```typescript
// Category icons for better UX
export const CATEGORY_ICONS = {
  'Meat': '🥩',
  'Seafood': '🐟',
  'Dairy': '🧀',
  'Produce': '🥬',
  'Bakery': '🍞',
  'Frozen': '🧊',
  'Pantry': '🥫',
  'Condiments': '🍯',
  'Beverages': '🥤',
  'Snacks': '🍿',
  'Household': '🧹',
  'Personal Care': '🧴',
  'Baby': '🍼',
  'Pet': '🐾',
  'Electronics': '🔌',
  'Other': '📦',
};
```

---

## Testing Steps

1. Update code constants
2. Run Supabase migration
3. Verify enum values in Supabase
4. Add item with new category "Bakery"
5. Add item with new category "Frozen"
6. Add item with new category "Pantry"
7. Verify all forms show new categories
8. Test filters with new categories
9. Verify existing items still work
10. Check Settings unit preferences

---

## Verification Checklist

- [ ] Code constants updated
- [ ] Supabase enum expanded
- [ ] Migration script tested
- [ ] All 17 categories available in dropdowns
- [ ] Existing items unchanged
- [ ] Filters work with new categories
- [ ] Search works with new categories
- [ ] Unit preferences include new categories
- [ ] No TypeScript errors
- [ ] No console errors

---

## Rollback Plan (If Needed)

```sql
-- If something goes wrong, existing categories still work
-- New categories won't appear in dropdowns, but data is safe
-- Can remove enum values if needed (though not recommended)
```

---

## Notes

- **Backward Compatible:** Existing items remain unchanged
- **Optional Migration:** Don't need to recategorize existing items
- **"Drinks" → "Beverages":** Optional rename for consistency
- **Alphabetical Order:** Consider UI sorting (Food vs. Non-Food grouping)

---

## Future Enhancements

1. **Category Groups:**
   - Food categories
   - Non-food categories
   - Separate in UI with headers

2. **Category-Specific Quality Options:**
   - Bakery: Fresh Baked, Frozen, Day-Old
   - Frozen: Individually Frozen, Bulk Pack
   - Personal Care: Travel Size, Full Size

3. **Smart Category Suggestions:**
   - AI suggests category based on item name
   - "Milk" → auto-select "Dairy"
   - "Bread" → auto-select "Bakery"

---

## Priority

**Recommended:** Add to Sprint 3 (Medium Priority)  
**Timing:** After critical bugs fixed  
**Estimated Time:** 2-3 hours total
