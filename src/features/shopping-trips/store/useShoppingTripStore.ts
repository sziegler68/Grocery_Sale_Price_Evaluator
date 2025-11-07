import { create } from 'zustand';
import type { ShoppingTrip, CartItem } from '../types';
import { 
  createShoppingTrip, 
  getTripById, 
  addItemToCart, 
  removeCartItem, 
  completeTrip,
  getCartItems,
  updateCartItem as updateCartItemAPI
} from '../api';

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

  // Add item to cart
  addToCart: async (itemData) => {
    try {
      const newItem = await addItemToCart(itemData);
      set(state => ({ 
        cartItems: [...state.cartItems, newItem] 
      }));
      
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

  // Update cart item
  updateCartItem: async (itemId, updates) => {
    try {
      await updateCartItemAPI(itemId, updates);
      
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

  // Remove item from cart
  removeFromCart: async (itemId) => {
    try {
      await removeCartItem(itemId);
      set(state => ({
        cartItems: state.cartItems.filter(item => item.id !== itemId)
      }));
      
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
      await completeTrip(tripId);
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
