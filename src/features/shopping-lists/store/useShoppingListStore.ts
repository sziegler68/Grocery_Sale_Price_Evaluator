import { create } from 'zustand';
import type { ShoppingList, ShoppingListItem } from '../types';
import { 
  getItemsForList, 
  addItemToList, 
  updateItem, 
  deleteItem,
  checkItem,
  uncheckItem,
  getShoppingListByCode,
  deleteShoppingList,
  clearAllItems
} from '../api';
import { getSupabaseClient, isSupabaseConfigured } from '@shared/api/supabaseClient';

interface ShoppingListStore {
  // State
  lists: ShoppingList[];
  currentList: ShoppingList | null;
  items: ShoppingListItem[];
  isLoading: boolean;
  error: string | null;
  activeSubscriptions: Map<string, () => void>; // Track active subscriptions for cleanup

  // Actions
  loadLists: () => Promise<void>;
  loadListByShareCode: (shareCode: string) => Promise<ShoppingList | null>;
  loadListItems: (listId: string) => Promise<void>;
  addItem: (item: any) => Promise<void>;
  updateItem: (itemId: string, updates: any) => Promise<void>;
  deleteItem: (itemId: string) => Promise<void>;
  deleteList: (listId: string) => Promise<void>;
  clearItems: (listId: string) => Promise<void>;
  toggleItem: (itemId: string, isChecked: boolean) => Promise<void>;
  setCurrentList: (list: ShoppingList | null) => void;
  optimisticToggleItem: (itemId: string, isChecked: boolean) => void;
  
  // Real-time subscriptions
  subscribeToList: (listId: string) => () => void;
  subscribeToNotifications: (listId: string, userName: string | null, onNotification: (notification: any) => void) => () => void;
  unsubscribeFromList: () => void;
  cleanupAllSubscriptions: () => void;
}

export const useShoppingListStore = create<ShoppingListStore>((set, get) => ({
  // Initial state
  lists: [],
  currentList: null,
  items: [],
  isLoading: false,
  error: null,
  activeSubscriptions: new Map(),

  // Load all lists for user
  loadLists: async () => {
    set({ isLoading: true, error: null });
    try {
      // This would need the user's share codes - simplified for now
      set({ lists: [], isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Load a list by share code and set as current
  loadListByShareCode: async (shareCode: string) => {
    set({ isLoading: true, error: null });
    try {
      const list = await getShoppingListByCode(shareCode);
      if (list) {
        set({ currentList: list, isLoading: false });
        // Also load items for this list
        await get().loadListItems(list.id);
        return list;
      } else {
        set({ currentList: null, isLoading: false, error: 'List not found' });
        return null;
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false, currentList: null });
      throw error;
    }
  },

  // Load items for a specific list
  loadListItems: async (listId: string) => {
    set({ isLoading: true, error: null });
    try {
      const items = await getItemsForList(listId);
      set({ items, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Add item to list
  addItem: async (itemData) => {
    try {
      await addItemToList(itemData);
      const { currentList } = get();
      if (currentList) {
        await get().loadListItems(currentList.id);
      }
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  // Update item
  updateItem: async (itemId, updates) => {
    try {
      await updateItem(itemId, updates);
      const { currentList } = get();
      if (currentList) {
        await get().loadListItems(currentList.id);
      }
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  // Delete item
  deleteItem: async (itemId) => {
    try {
      await deleteItem(itemId);
      set(state => ({ 
        items: state.items.filter(item => item.id !== itemId) 
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  // Delete entire list
  deleteList: async (listId) => {
    try {
      await deleteShoppingList(listId);
      set(state => ({
        lists: state.lists.filter(list => list.id !== listId),
        currentList: state.currentList?.id === listId ? null : state.currentList,
        items: state.currentList?.id === listId ? [] : state.items
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  // Clear all items from list
  clearItems: async (listId) => {
    try {
      await clearAllItems(listId);
      set({ items: [] });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  // Toggle item checked status
  toggleItem: async (itemId, isChecked) => {
    try {
      if (isChecked) {
        await checkItem(itemId);
      } else {
        await uncheckItem(itemId);
      }
      set(state => ({
        items: state.items.map(item =>
          item.id === itemId ? { ...item, is_checked: isChecked } : item
        )
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  // Set current list
  setCurrentList: (list) => {
    set({ currentList: list });
  },

  // Optimistic toggle for instant UI feedback (doesn't call API)
  optimisticToggleItem: (itemId, isChecked) => {
    set(state => ({
      items: state.items.map(item =>
        item.id === itemId 
          ? { ...item, is_checked: isChecked, checked_at: isChecked ? new Date().toISOString() : null }
          : item
      )
    }));
  },

  // Subscribe to real-time updates for a list
  subscribeToList: (listId: string) => {
    if (!isSupabaseConfigured) return () => {};

    const subscriptionKey = `list-items-${listId}`;
    
    // Clean up existing subscription if any
    const existing = get().activeSubscriptions.get(subscriptionKey);
    if (existing) {
      existing();
    }

    const supabase = getSupabaseClient();
    const channel = supabase
      .channel(subscriptionKey)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'shopping_list_items',
          filter: `list_id=eq.${listId}`
        },
        (payload) => {
          console.log('[REALTIME] Shopping list item change detected:', payload.eventType, payload);
          
          const { eventType, new: newRecord, old: oldRecord } = payload;
          
          // Update Zustand state directly based on the event type
          if (eventType === 'INSERT' && newRecord) {
            console.log('[REALTIME] Adding new item to state');
            set(state => ({
              items: [...state.items, newRecord as ShoppingListItem]
            }));
          } else if (eventType === 'UPDATE' && newRecord) {
            console.log('[REALTIME] Updating item in state');
            set(state => ({
              items: state.items.map(item =>
                item.id === newRecord.id ? (newRecord as ShoppingListItem) : item
              )
            }));
          } else if (eventType === 'DELETE' && oldRecord) {
            console.log('[REALTIME] Removing item from state');
            set(state => ({
              items: state.items.filter(item => item.id !== oldRecord.id)
            }));
          } else {
            // Fallback: reload from database if payload format is unexpected
            console.log('[REALTIME] Unexpected payload format, reloading from database');
            get().loadListItems(listId);
          }
        }
      )
      .subscribe((status) => {
        console.log('[REALTIME] Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('[REALTIME] ✅ Successfully subscribed to shopping list items');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[REALTIME] ❌ Channel error - check Supabase Realtime is enabled');
        } else if (status === 'TIMED_OUT') {
          console.error('[REALTIME] ⏱️ Subscription timed out');
        }
      });

    const unsubscribe = () => {
      console.log('[REALTIME] 🔌 Unsubscribing from shopping list items');
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

  // Subscribe to live notifications for a list
  subscribeToNotifications: (listId: string, userName: string | null, onNotification: (notification: any) => void) => {
    if (!isSupabaseConfigured) return () => {};

    const subscriptionKey = `notifications-${listId}`;
    
    // Clean up existing subscription if any
    const existing = get().activeSubscriptions.get(subscriptionKey);
    if (existing) {
      existing();
    }

    const supabase = getSupabaseClient();
    
    console.log('[STORE] 📡 Setting up notification subscription for list:', listId.substring(0, 8) + '...');
    
    const channel = supabase
      .channel(subscriptionKey)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_notifications',
          filter: `list_id=eq.${listId}`,
        },
        (payload) => {
          console.log('[STORE] 📬 Received notification:', payload);
          
          const notification = payload.new as any;
          
          // Don't show notifications triggered by yourself
          if (userName && notification.triggered_by === userName) {
            console.log('[STORE] ⏭️ Skipping - triggered by current user');
            return;
          }
          
          // Call the component's callback
          onNotification(notification);
        }
      )
      .subscribe((status) => {
        console.log('[STORE] 📡 Notification subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('[STORE] ✅ Successfully subscribed to notifications');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[STORE] ❌ Error subscribing to notifications - check Supabase realtime is enabled for live_notifications table');
        } else if (status === 'TIMED_OUT') {
          console.error('[STORE] ⏱️ Subscription timed out - check network connection');
        }
      });

    const unsubscribe = () => {
      console.log('[STORE] 🔌 Unsubscribing from notifications');
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

  // Unsubscribe from all
  unsubscribeFromList: () => {
    if (!isSupabaseConfigured) return;
    const supabase = getSupabaseClient();
    supabase.removeAllChannels();
    set({ activeSubscriptions: new Map() });
  },

  // Clean up all tracked subscriptions
  cleanupAllSubscriptions: () => {
    const { activeSubscriptions } = get();
    console.log('[STORE] 🧹 Cleaning up', activeSubscriptions.size, 'subscriptions');
    activeSubscriptions.forEach(unsubscribe => unsubscribe());
    set({ activeSubscriptions: new Map() });
  },
}));
