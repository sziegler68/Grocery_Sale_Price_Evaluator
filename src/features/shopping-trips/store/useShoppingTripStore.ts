import { create } from 'zustand';
import type { ShoppingTrip, CartItem } from '../types';
import { 
  createShoppingTrip, 
  getTripById, 
  getCartItems,
  completeTrip as completeTripAPI
} from '../api';
import {
  addItemToCart as addItemToCartService,
  updateCartItem as updateCartItemService,
  removeItemFromCart as removeItemFromCartService,
} from '../services/tripService';

interface ShoppingTripStore {
  // State
  currentTrip: ShoppingTrip | null;
  cartItems: CartItem[];
  isLoading: boolean;
  error: string | null;

  // Actions
  startTrip: (listId: string, budget: number, storeName: string, salesTaxRate?: number) => Promise<ShoppingTrip>;
  loadTrip: (tripId: string) => Promise<void>;
  loadCartItems: (tripId: string) => Promise<void>;
  addToCart: (item: any) => Promise<void>;
  updateCartItem: (itemId: string, updates: any) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  finishTrip: (tripId: string) => Promise<void>;
  clearTrip: () => void;
}

export const useShoppingTripStore = create<ShoppingTripStore>((set, get) => ({
  // Initial state
  currentTrip: null,
  cartItems: [],
  isLoading: false,
  error: null,

  // Start a new shopping trip
  startTrip: async (listId, budget, storeName, salesTaxRate) => {
    set({ isLoading: true, error: null });
    try {
      const trip = await createShoppingTrip({ 
        list_id: listId, 
        budget, 
        store_name: storeName,
        sales_tax_rate: salesTaxRate 
      });
      set({ currentTrip: trip, cartItems: [], isLoading: false });
      return trip;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Load existing trip
  loadTrip: async (tripId) => {
    set({ isLoading: true, error: null });
    try {
      const trip = await getTripById(tripId);
      set({ currentTrip: trip, isLoading: false });
      // Also load cart items
      await get().loadCartItems(tripId);
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Load cart items for a trip
  loadCartItems: async (tripId) => {
    try {
      const items = await getCartItems(tripId);
      set({ cartItems: items });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  // Add item to cart using service (with validation & normalization)
  addToCart: async (itemData) => {
    try {
      const result = await addItemToCartService(itemData);
      
      if (!result.success) {
        set({ error: result.error || 'Failed to add item' });
        throw new Error(result.error || 'Failed to add item');
      }
      
      // Reload trip and cart to get updated values
      const { currentTrip } = get();
      if (currentTrip) {
        await get().loadTrip(currentTrip.id);
      }
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  // Update cart item using service (with validation & normalization)
  updateCartItem: async (itemId, updates) => {
    try {
      const result = await updateCartItemService(itemId, updates);
      
      if (!result.success) {
        set({ error: result.error || 'Failed to update item' });
        throw new Error(result.error || 'Failed to update item');
      }
      
      // Reload trip and cart items to get updated values
      const { currentTrip } = get();
      if (currentTrip) {
        await get().loadTrip(currentTrip.id);
      }
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  // Remove item from cart using service
  removeFromCart: async (itemId) => {
    try {
      const result = await removeItemFromCartService(itemId);
      
      if (!result.success) {
        set({ error: result.error || 'Failed to remove item' });
        throw new Error(result.error || 'Failed to remove item');
      }
      
      // Reload trip to update totals
      const { currentTrip } = get();
      if (currentTrip) {
        await get().loadTrip(currentTrip.id);
      }
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  // Complete the shopping trip
  finishTrip: async (tripId) => {
    set({ isLoading: true });
    try {
      await completeTripAPI(tripId);
      set({ currentTrip: null, cartItems: [], isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Clear current trip
  clearTrip: () => {
    set({ currentTrip: null, cartItems: [] });
  },
}));
