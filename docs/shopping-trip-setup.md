# Shopping Trip Feature - Setup Guide

## 🎯 What's New

The Shopping Trip feature has been completely redesigned to work like the Price Checker:

### **New Workflow:**
1. Create a shopping list with target prices (per unit)
2. Start shopping trip → Set budget (whole dollars)
3. Click an item from your list
4. Enter: **Total Price** + **Quantity**
5. App calculates **Unit Price** and compares to target
6. See if it's a **Good Deal** (green) or **Bad Deal** (red)
7. Optional: Add **CRV** amount
8. Optional: **Update target price** if you found a better deal
9. Click **Add to Cart**
10. Budget meter shows progress with tax and CRV included

---

## 🔧 **Database Setup Required**

Before using the new shopping trip features, run this SQL in Supabase:

### **Step 1: Open Supabase SQL Editor**
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**

### **Step 2: Run This SQL**

```sql
-- Add CRV and Sales Tax Support to Shopping Trips

-- Add CRV column to cart_items
ALTER TABLE cart_items 
ADD COLUMN IF NOT EXISTS crv_amount DECIMAL(10,2) DEFAULT 0;

-- Add sales tax rate to shopping_trips
ALTER TABLE shopping_trips 
ADD COLUMN IF NOT EXISTS sales_tax_rate DECIMAL(5,2) DEFAULT 0;

-- Update the trigger function to include CRV and sales tax in total calculation
CREATE OR REPLACE FUNCTION update_trip_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE shopping_trips
  SET 
    total_spent = (
      SELECT COALESCE(
        SUM((price_paid * quantity) + COALESCE(crv_amount, 0)),
        0
      ) * (1 + (sales_tax_rate / 100))
      FROM cart_items
      WHERE trip_id = COALESCE(NEW.trip_id, OLD.trip_id)
    ),
    items_purchased = (
      SELECT COUNT(*)
      FROM cart_items
      WHERE trip_id = COALESCE(NEW.trip_id, OLD.trip_id)
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.trip_id, OLD.trip_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
```

### **Step 3: Click RUN**

You should see: `Success. No rows returned` ✅

---

## ⚙️ **App Settings Setup**

### **Set Your Sales Tax Rate:**
1. Go to **Settings** page
2. Scroll to **"Sales Tax"** section
3. Enter your local rate (e.g., `8.5` for 8.5%)
4. Click **Save All Settings**

This will be the default for all shopping trips. You can override it per-trip.

---

## 🧪 **How to Test**

### **Complete Workflow:**

1. **Create a Shopping List**
   - Add items with target prices (per unit)
   - Example: Milk - $3.50/gallon

2. **Start Shopping Trip**
   - Click "Start Shopping Trip"
   - Enter budget: Type `150` (whole dollars only!)
   - Select store
   - Sales tax auto-fills from settings (can override)
   - Click "Start Shopping"

3. **Add Items to Cart**
   - Click an item from your list
   - See target price: "$3.50/gallon"
   - Enter total price: Type `699` → Shows $6.99
   - Enter quantity: `2` (for 2 gallons)
   - App calculates: **$3.50/gallon** → Shows "At target price!"
   - Optional: Check "Has CRV" → Type `10` → $0.10
   - Optional: Check "Update target price" if you want to save this as new target
   - Click "Add to Cart"

4. **Watch Budget Meter**
   - Item: $6.99
   - CRV: $0.10
   - Tax (8.5%): $0.60
   - **Total added: $7.69**
   - Budget meter updates: $7.69 / $150.00 (5.1%)

5. **Continue Shopping**
   - Add more items
   - Watch budget meter turn yellow at 90%, red at 100%
   - See running total with all taxes and fees

6. **Complete Trip**
   - Click checkmark (top right)
   - Confirms and closes trip
   - Notifies other list members

---

## 🎨 **New Features in Detail**

### **Budget Input (Whole Dollars)**
- Type `150` → Budget is $150.00
- Type `200` → Budget is $200.00
- Quick buttons: $50, $100, $150, $200
- +/- $10 buttons for adjustments

### **Unit Price Comparison**
- Just like Price Checker!
- Shows unit price vs target price
- 🟢 **Green** = Good deal (below target)
- 🔴 **Red** = Bad deal (above target)
- Shows exact difference (e.g., "$0.25 under target")

### **CRV Support**
- Checkbox: "Item has CRV"
- Enter amount: Common values $0.05, $0.10
- Uses calculator-style input
- Adds to cart total automatically

### **Update Target Price**
- Checkbox appears when unit price ≠ target price
- Saves the new unit price as your target for future
- Helps you learn better prices as you shop

### **Cart Total Breakdown**
- Shows: Item total
- Shows: CRV (if any)
- Shows: Tax calculated on (Item + CRV)
- Shows: Grand total being added to cart
- All automatically included in budget meter

---

## 🐛 **Troubleshooting**

### **"Failed to add item to cart"**
- Make sure you ran the SQL migration
- Check browser console for errors

### **Budget meter not updating**
- Hard refresh (Ctrl+Shift+R)
- Check that database trigger is working

### **Sales tax not showing**
- Go to Settings and set your sales tax rate
- It should be a percentage (e.g., 8.5, not 0.085)

### **Unit price comparison not working**
- Make sure list items have target prices set
- Target prices must be per-unit (not total price)

---

## 📋 **Example Shopping Trip**

### **Shopping List: "Weekly Groceries"**
- Milk - Target: $3.50/gal
- Eggs - Target: $4.00/dozen
- Bread - Target: $2.50/loaf

### **At the Store (Costco):**
- Budget: $150
- Sales Tax: 8.5%

### **Add Milk:**
- Shelf price: $6.99 for 2 gallons
- Enter price: $6.99
- Enter quantity: 2
- Unit price: **$3.50/gal** ✅ At target!
- CRV: $0.10
- Cart addition: $7.69 (includes tax + CRV)

### **Add Eggs:**
- Shelf price: $7.99 for 2 dozen
- Enter price: $7.99
- Enter quantity: 2
- Unit price: **$4.00/dozen** ✅ At target!
- Cart addition: $8.67 (includes tax)

### **Budget Status:**
- Spent: $16.36 / $150.00 (10.9%)
- Status: 🟢 Under budget
- Remaining: $133.64

---

## ✨ **What Makes This Awesome**

1. **Smart Comparison** - Automatically converts to unit prices for fair comparison
2. **Real-time Budget** - Know exactly where you stand as you shop
3. **Learn Better Prices** - Update targets when you find deals
4. **Accurate Totals** - Includes all fees and taxes (no surprises at checkout)
5. **Shared Lists** - Family sees your updates in real-time
6. **Streamlined** - All features from Price Checker + Budget tracking in one place

---

**Built with 💚 by Greenie App Builder**
