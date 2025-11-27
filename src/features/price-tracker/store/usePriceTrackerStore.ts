import { create } from 'zustand';
import type { GroceryItem, GroceryDataResult } from '../types';
import { fetchAllItems, fetchItemWithHistory } from '../api/groceryData';

interface PriceTrackerStore {
  // State
  items: GroceryItem[];
  currentItem: GroceryItem | null;
  priceHistory: GroceryItem[];
  isLoading: boolean;
  error: string | null;
  dataSource: 'supabase' | 'mock';

  // Actions
  loadItems: () => Promise<void>;
  loadItemDetail: (itemId: string) => Promise<void>;
  clearCurrentItem: () => void;
  refreshItems: () => Promise<void>;
}

export const usePriceTrackerStore = create<PriceTrackerStore>((set, get) => ({
  // Initial state
  items: [],
  currentItem: null,
  priceHistory: [],
  isLoading: false,
  error: null,
  dataSource: 'mock',

  // Load all items
  loadItems: async () => {
    set({ isLoading: true, error: null });
    try {
      const result: GroceryDataResult = await fetchAllItems();
      set({ 
        items: result.items, 
        dataSource: result.source,
        error: result.error || null,
        isLoading: false 
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Load item detail with price history
  loadItemDetail: async (itemId) => {
    set({ isLoading: true, error: null });
    try {
      const result = await fetchItemWithHistory(itemId);
      set({ 
        currentItem: result.item,
        priceHistory: result.priceHistory,
        dataSource: result.source,
        error: result.error || null,
        isLoading: false 
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Clear current item
  clearCurrentItem: () => {
    set({ currentItem: null, priceHistory: [] });
  },

  // Refresh items list
  refreshItems: async () => {
    await get().loadItems();
  },
}));
