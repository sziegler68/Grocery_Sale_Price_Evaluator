/**
 * TypeScript types for Price Tracker feature
 */

export type GroceryItem = {
  id: string;
  itemName: string;
  category: string;
  meatQuality?: string | undefined;
  storeName: string;
  price: number;
  quantity: number;
  unitType: string;
  unitPrice: number;
  datePurchased: Date;
  notes?: string;
  targetPrice?: number;
  userId?: string;
};

export type DataSource = 'supabase' | 'mock';

export type GroceryDataResult = {
  items: GroceryItem[];
  source: DataSource;
  error?: string;
};

export type GroceryItemDetailResult = {
  item: GroceryItem | null;
  priceHistory: GroceryItem[];
  source: DataSource;
  error?: string;
};
