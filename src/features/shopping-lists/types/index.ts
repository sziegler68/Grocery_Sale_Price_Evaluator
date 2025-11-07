/**
 * TypeScript types for Shopping Lists feature
 */

export interface ShoppingList {
  id: string;
  name: string;
  share_code: string;
  created_at: string;
}

export interface ShoppingListItem {
  id: string;
  list_id: string;
  item_name: string;
  category: string;
  quantity: number;
  unit_type: string | null;
  target_price: number | null;
  is_checked: boolean;
  checked_at: string | null;
  notes: string | null;
  added_by: string | null;
  added_at: string;
}

export interface CreateShoppingListInput {
  name: string;
}

export interface AddItemToListInput {
  list_id: string;
  item_name: string;
  category: string;
  quantity?: number;
  unit_type?: string;
  target_price?: number;
  notes?: string;
  added_by?: string;
}

export interface UpdateItemInput {
  item_name?: string;
  category?: string;
  quantity?: number;
  unit_type?: string;
  target_price?: number;
  notes?: string;
  is_checked?: boolean;
}

// Category display names and order
export const SHOPPING_LIST_CATEGORIES = [
  'Dairy',
  'Drinks',
  'Household',
  'Meats',
  'Other',
  'Produce',
  'Snacks',
] as const;

export type ShoppingListCategory = typeof SHOPPING_LIST_CATEGORIES[number];

// Map grocery item categories to shopping list categories
export const CATEGORY_MAP: Record<string, ShoppingListCategory> = {
  'Beef': 'Meats',
  'Pork': 'Meats',
  'Chicken': 'Meats',
  'Seafood': 'Meats',
  'Dairy': 'Dairy',
  'Produce': 'Produce',
  'Snacks': 'Snacks',
  'Drinks': 'Drinks',
  'Household': 'Household',
  'Other': 'Other',
};

// Helper to map category to display category
export const mapToShoppingListCategory = (category: string): ShoppingListCategory => {
  return CATEGORY_MAP[category] || 'Other';
};
