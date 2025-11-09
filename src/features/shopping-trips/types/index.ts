// TypeScript types for shopping trip budget tracking

export interface ShoppingTrip {
  id: string;
  list_id: string;
  budget: number;
  store_name: string;
  started_at: string;
  completed_at?: string;
  total_spent: number;
  items_purchased: number;
  sales_tax_rate: number; // Percentage (e.g., 8.5 for 8.5%)
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  trip_id: string;
  list_item_id?: string;
  item_name: string;
  price_paid: number; // Pre-tax total for the quantity purchased
  tax_amount: number; // Calculated sales tax (stored, not recalculated)
  quantity: number;
  unit_type?: string;
  category?: string;
  target_price?: number;
  crv_amount: number; // California Redemption Value
  added_at: string;
}

export interface CreateTripInput {
  list_id: string;
  budget: number;
  store_name: string;
  sales_tax_rate?: number; // Optional, defaults to user's settings
}

export interface AddCartItemInput {
  trip_id: string;
  list_item_id?: string;
  item_name: string;
  price_paid: number; // Pre-tax total
  tax_amount: number; // Calculated sales tax
  quantity?: number;
  unit_type?: string;
  category?: string;
  target_price?: number;
  crv_amount?: number; // CRV fee for this item
}

// Cart totals computed by service layer
export interface CartTotals {
  subtotal: number;    // Sum of all price_paid
  tax: number;         // Sum of all tax_amount
  crv: number;         // Sum of all crv_amount
  total: number;       // subtotal + tax + crv
  itemCount: number;   // Number of items in cart
}

export interface BudgetStatus {
  percentage: number;
  remaining: number;
  status: 'under' | 'approaching' | 'at' | 'over';
  color: 'green' | 'yellow' | 'red';
}

export const calculateBudgetStatus = (totalSpent: number, budget: number): BudgetStatus => {
  const percentage = (totalSpent / budget) * 100;
  const remaining = budget - totalSpent;
  
  let status: BudgetStatus['status'];
  let color: BudgetStatus['color'];
  
  if (percentage < 90) {
    status = 'under';
    color = 'green';
  } else if (percentage < 100) {
    status = 'approaching';
    color = 'yellow';
  } else if (percentage < 110) {
    status = 'at';
    color = 'red';
  } else {
    status = 'over';
    color = 'red';
  }
  
  return {
    percentage,
    remaining,
    status,
    color
  };
};
