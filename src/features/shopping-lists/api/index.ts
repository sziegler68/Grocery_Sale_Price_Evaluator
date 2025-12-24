/**
 * API functions for Shopping Lists feature
 * All interactions with Supabase for shopping lists
 */

import { getSupabaseClient, isSupabaseConfigured } from '@shared/api/supabaseClient';
import type {
  ShoppingList,
  ShoppingListItem,
  CreateShoppingListInput,
  AddItemToListInput,
  UpdateItemInput
} from '../types';

/**
 * Generate a unique share code using the database function
 */
export const generateShareCode = async (): Promise<string> => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured');
  }

  const client = getSupabaseClient();
  const { data, error } = await client.rpc('generate_share_code');

  if (error || !data) {
    throw new Error('Failed to generate share code');
  }

  return data;
};

/**
 * Create a new shopping list
 */
export const createShoppingList = async (
  input: CreateShoppingListInput
): Promise<ShoppingList> => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured');
  }

  const client = getSupabaseClient();

  // Generate share code
  const shareCode = await generateShareCode();

  const { data, error } = await client
    .from('shopping_lists')
    .insert({
      name: input.name,
      share_code: shareCode,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to create shopping list');
  }

  return data;
};

/**
 * Get a shopping list by share code
 */
export const getShoppingListByCode = async (
  shareCode: string
): Promise<ShoppingList | null> => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured');
  }

  const client = getSupabaseClient();
  const { data, error } = await client
    .from('shopping_lists')
    .select('*')
    .eq('share_code', shareCode)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    throw new Error(error.message);
  }

  return data;
};

/**
 * Get multiple shopping lists by share codes
 */
export const getShoppingListsByCodes = async (
  shareCodes: string[]
): Promise<ShoppingList[]> => {
  if (!isSupabaseConfigured || shareCodes.length === 0) {
    return [];
  }

  const client = getSupabaseClient();
  const { data, error } = await client
    .from('shopping_lists')
    .select('*')
    .in('share_code', shareCodes)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

/**
 * Delete a shopping list (and all its items via CASCADE)
 */
export const deleteShoppingList = async (listId: string): Promise<void> => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured');
  }

  const client = getSupabaseClient();
  const { error } = await client
    .from('shopping_lists')
    .delete()
    .eq('id', listId);

  if (error) {
    throw new Error(error.message);
  }
};

/**
 * Get all items for a shopping list
 */
export const getItemsForList = async (
  listId: string
): Promise<ShoppingListItem[]> => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured');
  }

  const client = getSupabaseClient();
  const { data, error } = await client
    .from('shopping_list_items')
    .select('*')
    .eq('list_id', listId)
    .order('is_checked', { ascending: true })
    .order('category', { ascending: true })
    .order('added_at', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

/**
 * Add an item to a shopping list
 */
export const addItemToList = async (
  input: AddItemToListInput
): Promise<ShoppingListItem> => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured');
  }

  console.log('[API] addItemToList called with:', input);

  const client = getSupabaseClient();
  const { data, error } = await client
    .from('shopping_list_items')
    .insert({
      list_id: input.list_id,
      item_name: input.item_name,
      category: input.category,
      quantity: input.quantity || 1,
      unit_type: input.unit_type || null,
      target_price: input.target_price || null,
      // Phase 3: Quality fields
      organic: input.organic ?? false,
      grass_fed: input.grass_fed ?? false,
      freshness: input.freshness ?? null,
      meat_grade: input.meat_grade ?? null,
      seafood_source: input.seafood_source ?? null,
      notes: input.notes || null,
      added_by: input.added_by || null,
      is_checked: false,
    })
    .select()
    .single();

  if (error || !data) {
    console.error('[API] addItemToList ERROR:', error);
    throw new Error(error?.message || 'Failed to add item');
  }

  console.log('[API] addItemToList SUCCESS - item saved:', data);
  return data;
};

/**
 * Update a shopping list item
 */
export const updateItem = async (
  itemId: string,
  updates: UpdateItemInput
): Promise<ShoppingListItem> => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured');
  }

  const client = getSupabaseClient();

  // If checking/unchecking, update checked_at timestamp
  const updateData: any = { ...updates };
  if (updates.is_checked !== undefined) {
    updateData.checked_at = updates.is_checked ? new Date().toISOString() : null;
  }

  const { data, error } = await client
    .from('shopping_list_items')
    .update(updateData)
    .eq('id', itemId)
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to update item');
  }

  return data;
};

/**
 * Check an item (mark as purchased)
 */
export const checkItem = async (itemId: string): Promise<ShoppingListItem> => {
  return updateItem(itemId, { is_checked: true });
};

/**
 * Uncheck an item
 */
export const uncheckItem = async (itemId: string): Promise<ShoppingListItem> => {
  return updateItem(itemId, { is_checked: false });
};

/**
 * Delete a single item
 */
export const deleteItem = async (itemId: string): Promise<void> => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured');
  }

  const client = getSupabaseClient();
  const { error } = await client
    .from('shopping_list_items')
    .delete()
    .eq('id', itemId);

  if (error) {
    throw new Error(error.message);
  }
};

/**
 * Clear all items from a shopping list (delete all items)
 */
export const clearAllItems = async (listId: string): Promise<void> => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured');
  }

  const client = getSupabaseClient();
  const { error } = await client
    .from('shopping_list_items')
    .delete()
    .eq('list_id', listId);

  if (error) {
    throw new Error(error.message);
  }
};

/**
 * Subscribe to real-time changes for a shopping list's items
 */
export const subscribeToListItems = (
  listId: string,
  onUpdate: (item: ShoppingListItem) => void,
  onDelete?: (itemId: string) => void
) => {
  if (!isSupabaseConfigured) {
    return () => { }; // Return no-op unsubscribe
  }

  const client = getSupabaseClient();

  const channel = client
    .channel(`shopping-list-${listId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'shopping_list_items',
        filter: `list_id=eq.${listId}`,
      },
      (payload) => {
        // Handle INSERT and UPDATE events
        if (payload.new && (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE')) {
          onUpdate(payload.new as ShoppingListItem);
        }
        // Handle DELETE events
        if (payload.eventType === 'DELETE' && payload.old && onDelete) {
          onDelete((payload.old as any).id);
        }
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    channel.unsubscribe();
  };
};
