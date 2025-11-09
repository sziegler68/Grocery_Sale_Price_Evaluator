import { create } from 'zustand';
import type { ShoppingTrip, CartItem, CartTotals } from '../types';
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
  computeCartTotals,
} from '../services/tripService';
import { getSupabaseClient, isSupabaseConfigured } from '@shared/api/supabaseClient';

interface ShoppingTripStore {
  // State
  currentTrip: ShoppingTrip | null;
  cartItems: CartItem[];
  cartTotals: CartTotals; // Cached totals (single source of truth)
  isLoading: boolean;
  error: string | null;
  activeSubscriptions: Map<string, () => void>; // Track active subscriptions for cleanup

  // Actions
  startTrip: (listId: string, budget: number, storeName: string, salesTaxRate?: number) => Promise<ShoppingTrip>;
  loadTrip: (tripId: string) => Promise<void>;
  loadCartItems: (tripId: string) => Promise<void>;
  addToCart: (item: any) => Promise<void>;
  updateCartItem: (itemId: string, updates: any) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  finishTrip: (tripId: string) => Promise<void>;
  clearTrip: () => void;
  
  // Real-time subscriptions
  subscribeToCartUpdates: (tripId: string) => () => void;
  subscribeToTripUpdates: (tripId: string) => () => void;
  cleanupAllSubscriptions: () => void;
}

export const useShoppingTripStore = create<ShoppingTripStore>((set, get) => ({
  // Initial state
  currentTrip: null,
  cartItems: [],
  cartTotals: { subtotal: 0, tax: 0, crv: 0, total: 0, itemCount: 0 },
  isLoading: false,
  error: null,
  activeSubscriptions: new Map(),

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
      const totals = computeCartTotals(items); // Compute totals from loaded items
      set({ cartItems: items, cartTotals: totals });
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
      set({ 
        currentTrip: null, 
        cartItems: [], 
        cartTotals: { subtotal: 0, tax: 0, crv: 0, total: 0, itemCount: 0 },
        isLoading: false 
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Clear current trip
  clearTrip: () => {
    set({ 
      currentTrip: null, 
      cartItems: [], 
      cartTotals: { subtotal: 0, tax: 0, crv: 0, total: 0, itemCount: 0 }
    });
  },

  // Subscribe to cart_items changes
  subscribeToCartUpdates: (tripId: string) => {
    if (!isSupabaseConfigured) return () => {};

    const subscriptionKey = `cart-items-${tripId}`;
    
    // Clean up existing subscription if any
    const existing = get().activeSubscriptions.get(subscriptionKey);
    if (existing) {
      existing();
    }

    const supabase = getSupabaseClient();
    
    console.log('[STORE] 📡 Setting up cart items subscription for trip:', tripId.substring(0, 8) + '...');
    
    const channel = supabase
      .channel(subscriptionKey)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'cart_items',
          filter: `trip_id=eq.${tripId}`
        },
        () => {
          console.log('[STORE] 🛒 Cart items changed, reloading...');
          // Reload cart items when changes occur
          get().loadCartItems(tripId);
        }
      )
      .subscribe();

    const unsubscribe = () => {
      console.log('[STORE] 🔌 Unsubscribing from cart updates');
      channel.unsubscribe();
      set(state => {
        const newSubs = new Map(state.activeSubscriptions);
        newSubs.delete(subscriptionKey);
        return { activeSubscriptions: newSubs };
      });
    };

    // Track this subscription
    set(state => {
      const newSubs = new Map(state.activeSubscriptions);
      newSubs.set(subscriptionKey, unsubscribe);
      return { activeSubscriptions: newSubs };
    });

    return unsubscribe;
  },

  // Subscribe to shopping_trips changes (for budget meter updates)
  subscribeToTripUpdates: (tripId: string) => {
    if (!isSupabaseConfigured) return () => {};

    const subscriptionKey = `trip-${tripId}`;
    
    // Clean up existing subscription if any
    const existing = get().activeSubscriptions.get(subscriptionKey);
    if (existing) {
      existing();
    }

    const supabase = getSupabaseClient();
    
    console.log('[STORE] 📡 Setting up trip updates subscription for trip:', tripId.substring(0, 8) + '...');
    
    const channel = supabase
      .channel(subscriptionKey)
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'shopping_trips',
          filter: `id=eq.${tripId}`
        },
        () => {
          console.log('[STORE] 💰 Trip totals changed, reloading...');
          // Reload trip when totals change
          get().loadTrip(tripId);
        }
      )
      .subscribe();

    const unsubscribe = () => {
      console.log('[STORE] 🔌 Unsubscribing from trip updates');
      channel.unsubscribe();
      set(state => {
        const newSubs = new Map(state.activeSubscriptions);
        newSubs.delete(subscriptionKey);
        return { activeSubscriptions: newSubs };
      });
    };

    // Track this subscription
    set(state => {
      const newSubs = new Map(state.activeSubscriptions);
      newSubs.set(subscriptionKey, unsubscribe);
      return { activeSubscriptions: newSubs };
    });

    return unsubscribe;
  },

  // Clean up all tracked subscriptions
  cleanupAllSubscriptions: () => {
    const { activeSubscriptions } = get();
    console.log('[STORE] 🧹 Cleaning up', activeSubscriptions.size, 'subscriptions');
    activeSubscriptions.forEach(unsubscribe => unsubscribe());
    set({ activeSubscriptions: new Map() });
  },
}));
