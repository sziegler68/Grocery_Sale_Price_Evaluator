import { create } from 'zustand';
import type { ShoppingList, ShoppingListItem } from '../types';
import { 
  getItemsForList, 
  addItemToList, 
  updateItem, 
  deleteItem,
  checkItem,
  uncheckItem 
} from '../api';
import { getSupabaseClient, isSupabaseConfigured } from '../../../../supabaseClient';

interface ShoppingListStore {
  // State
  lists: ShoppingList[];
  currentList: ShoppingList | null;
  items: ShoppingListItem[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadLists: () => Promise<void>;
  loadListItems: (listId: string) => Promise<void>;
  addItem: (item: any) => Promise<void>;
  updateItem: (itemId: string, updates: any) => Promise<void>;
  deleteItem: (itemId: string) => Promise<void>;
  toggleItem: (itemId: string, isChecked: boolean) => Promise<void>;
  setCurrentList: (list: ShoppingList | null) => void;
  
  // Real-time subscriptions
  subscribeToList: (listId: string) => () => void;
  unsubscribeFromList: () => void;
}

export const useShoppingListStore = create<ShoppingListStore>((set, get) => ({
  // Initial state
  lists: [],
  currentList: null,
  items: [],
  isLoading: false,
  error: null,

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

  // Subscribe to real-time updates for a list
  subscribeToList: (listId: string) => {
    if (!isSupabaseConfigured) return () => {};

    const supabase = getSupabaseClient();
    const channel = supabase
      .channel(`list-${listId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'shopping_list_items',
          filter: `list_id=eq.${listId}`
        },
        () => {
          // Reload items when changes occur
          get().loadListItems(listId);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  },

  // Unsubscribe from all
  unsubscribeFromList: () => {
    if (!isSupabaseConfigured) return;
    const supabase = getSupabaseClient();
    supabase.removeAllChannels();
  },
}));
