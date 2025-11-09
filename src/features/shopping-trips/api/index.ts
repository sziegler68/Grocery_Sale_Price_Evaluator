// API functions for shopping trip budget tracking
import { getSupabaseClient } from '@shared/api/supabaseClient';
import type { ShoppingTrip, CartItem, CreateTripInput, AddCartItemInput } from '../types';

// Create a new shopping trip
export const createShoppingTrip = async (input: CreateTripInput): Promise<ShoppingTrip> => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('shopping_trips')
    .insert({
      list_id: input.list_id,
      budget: input.budget,
      store_name: input.store_name,
      sales_tax_rate: input.sales_tax_rate || 0
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating shopping trip:', error);
    throw error;
  }

  return data as ShoppingTrip;
};

// Get active trip for a list
export const getActiveTrip = async (listId: string): Promise<ShoppingTrip | null> => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('shopping_trips')
    .select('*')
    .eq('list_id', listId)
    .is('completed_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching active trip:', error);
    throw error;
  }

  return data as ShoppingTrip | null;
};

// Get trip by ID
export const getTripById = async (tripId: string): Promise<ShoppingTrip | null> => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('shopping_trips')
    .select('*')
    .eq('id', tripId)
    .single();

  if (error) {
    console.error('Error fetching trip:', error);
    return null;
  }

  return data as ShoppingTrip;
};

// Get all cart items for a trip
export const getCartItems = async (tripId: string): Promise<CartItem[]> => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('cart_items')
    .select('*')
    .eq('trip_id', tripId)
    .order('added_at', { ascending: true });

  if (error) {
    console.error('Error fetching cart items:', error);
    throw error;
  }

  return data as CartItem[];
};

// Add item to cart
export const addItemToCart = async (input: AddCartItemInput): Promise<CartItem> => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('cart_items')
    .insert({
      trip_id: input.trip_id,
      list_item_id: input.list_item_id,
      item_name: input.item_name,
      price_paid: input.price_paid,
      quantity: input.quantity || 1,
      unit_type: input.unit_type,
      category: input.category,
      target_price: input.target_price,
      crv_amount: input.crv_amount || 0
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding item to cart:', error);
    throw error;
  }

  return data as CartItem;
};

// Remove item from cart
export const removeCartItem = async (itemId: string): Promise<void> => {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', itemId);

  if (error) {
    console.error('Error removing cart item:', error);
    throw error;
  }
};

// Update cart item quantity/price
export const updateCartItem = async (itemId: string, updates: Partial<CartItem>): Promise<CartItem> => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('cart_items')
    .update(updates)
    .eq('id', itemId)
    .select()
    .single();

  if (error) {
    console.error('Error updating cart item:', error);
    throw error;
  }

  return data as CartItem;
};

// Update trip's sales tax rate (for existing trips created before tax rate fix)
export const updateTripTaxRate = async (tripId: string, salesTaxRate: number): Promise<ShoppingTrip> => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('shopping_trips')
    .update({ sales_tax_rate: salesTaxRate })
    .eq('id', tripId)
    .select()
    .single();

  if (error) {
    console.error('Error updating trip tax rate:', error);
    throw error;
  }

  return data as ShoppingTrip;
};

// Complete a shopping trip and check off all cart items
export const completeTrip = async (tripId: string): Promise<ShoppingTrip> => {
  const supabase = getSupabaseClient();
  
  // Get all cart items for this trip
  const { data: cartItems } = await supabase
    .from('cart_items')
    .select('list_item_id')
    .eq('trip_id', tripId);
  
  // Check off all items in the shopping list
  if (cartItems && cartItems.length > 0) {
    const itemIds = cartItems
      .map(ci => ci.list_item_id)
      .filter(id => id != null);
    
    if (itemIds.length > 0) {
      await supabase
        .from('shopping_list_items')
        .update({ 
          is_checked: true,
          checked_at: new Date().toISOString()
        })
        .in('id', itemIds);
    }
  }
  
  // Mark trip as completed
  const { data, error } = await supabase
    .from('shopping_trips')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', tripId)
    .select()
    .single();

  if (error) {
    console.error('Error completing trip:', error);
    throw error;
  }

  return data as ShoppingTrip;
};

// Delete a shopping trip (and all its cart items via CASCADE)
export const deleteTrip = async (tripId: string): Promise<void> => {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('shopping_trips')
    .delete()
    .eq('id', tripId);

  if (error) {
    console.error('Error deleting trip:', error);
    throw error;
  }
};

// Subscribe to cart updates for real-time sync
export const subscribeToCartUpdates = (
  tripId: string,
  callback: (payload: any) => void
) => {
  const supabase = getSupabaseClient();
  const channel = supabase
    .channel(`trip:${tripId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'cart_items',
        filter: `trip_id=eq.${tripId}`
      },
      callback
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'shopping_trips',
        filter: `id=eq.${tripId}`
      },
      callback
    )
    .subscribe();

  return channel;
};
