import { formatISO } from 'date-fns';
import supabase, {
  getSupabaseClient,
  isSupabaseConfigured,
  type GroceryItemRow,
  type GroceryItemsInsert,
  type GroceryItemsUpdate,
} from '@shared/api/supabaseClient';
import type { GroceryItem, DataSource, GroceryDataResult, GroceryItemDetailResult } from '../types';

// Re-export types for backward compatibility
export type { GroceryItem, DataSource, GroceryDataResult, GroceryItemDetailResult };

const MOCK_ITEMS: GroceryItem[] = [
  {
    id: '1',
    itemName: 'Chicken Breast',
    category: 'Chicken',
    meatQuality: 'Organic',
    storeName: 'Walmart',
    price: 12.99,
    unitType: 'pound',
    quantity: 2.5,
    unitPrice: 5.20,
    datePurchased: new Date('2025-01-15'),
    targetPrice: 5.50,
  },
  {
    id: '2',
    itemName: 'Organic Milk',
    category: 'Dairy',
    storeName: 'Whole Foods',
    price: 4.99,
    unitType: 'gallon',
    quantity: 1,
    unitPrice: 4.99,
    datePurchased: new Date('2025-01-14'),
    targetPrice: 5.5,
  },
  {
    id: '3',
    itemName: 'Bananas',
    category: 'Produce',
    storeName: 'Kroger',
    price: 2.49,
    unitType: 'pound',
    quantity: 3,
    unitPrice: 0.83,
    datePurchased: new Date('2025-01-13'),
    targetPrice: 1.00,
  },
];

const MOCK_PRICE_HISTORY: Record<string, GroceryItem[]> = {
  'Chicken Breast': [
    MOCK_ITEMS[0],
    {
      ...MOCK_ITEMS[0],
      id: '1-2',
      storeName: 'Kroger',
      price: 14.99,
      quantity: 2.5,
      unitPrice: 6.00,
      datePurchased: new Date('2025-01-10'),
    },
    {
      ...MOCK_ITEMS[0],
      id: '1-3',
      storeName: 'Walmart',
      price: 11.99,
      quantity: 2.5,
      unitPrice: 4.80,
      datePurchased: new Date('2025-01-05'),
    },
  ],
};

const mapRowToItem = (row: GroceryItemRow): GroceryItem => ({
  id: row.id,
  itemName: row.item_name,
  category: row.category,
  meatQuality: row.meat_quality ?? undefined,
  storeName: row.store_name,
  price: Number(row.price),
  quantity: Number(row.quantity),
  unitType: row.unit_type,
  unitPrice: Number(row.unit_price),
  datePurchased: new Date(row.date_purchased),
  notes: row.notes ?? undefined,
  targetPrice: row.target_price ?? undefined,
  userId: row.user_id ?? undefined,
  
  // Phase 4: Moderation fields (with safe defaults)
  flagged_for_review: row.flagged_for_review ?? false,
  verified: row.verified ?? false,
  flagged_reason: row.flagged_reason ?? undefined,
  reviewed_by: row.reviewed_by ?? undefined,
  reviewed_at: row.reviewed_at ?? undefined,
});

const buildErrorResult = (errorMessage: string): GroceryDataResult => ({
  items: MOCK_ITEMS,
  source: 'mock',
  error: errorMessage,
});

export const fetchAllItems = async (): Promise<GroceryDataResult> => {
  if (!isSupabaseConfigured || !supabase) {
    return { items: MOCK_ITEMS, source: 'mock' };
  }

  const { data, error } = await supabase
    .from('grocery_items')
    .select('*')
    .order('date_purchased', { ascending: false });

  if (error || !data) {
    console.error('[Supabase] Failed to fetch grocery_items:', error?.message);
    return buildErrorResult(error?.message ?? 'Unable to load items from Supabase.');
  }

  return {
    items: data.map(mapRowToItem),
    source: 'supabase',
  };
};

export const fetchRecentItems = async (limit = 6): Promise<GroceryDataResult> => {
  if (!isSupabaseConfigured || !supabase) {
    return { items: MOCK_ITEMS.slice(0, limit), source: 'mock' };
  }

  const { data, error } = await supabase
    .from('grocery_items')
    .select('*')
    .order('date_purchased', { ascending: false })
    .limit(limit);

  if (error || !data) {
    console.error('[Supabase] Failed to fetch recent grocery_items:', error?.message);
    return buildErrorResult(error?.message ?? 'Unable to load recent items from Supabase.');
  }

  return {
    items: data.map(mapRowToItem),
    source: 'supabase',
  };
};

export const fetchItemWithHistory = async (id: string): Promise<GroceryItemDetailResult> => {
  if (!isSupabaseConfigured || !supabase) {
    const fallbackItem = MOCK_ITEMS.find((item) => item.id === id) ?? null;
    return {
      item: fallbackItem,
      priceHistory: fallbackItem ? MOCK_PRICE_HISTORY[fallbackItem.itemName] ?? [fallbackItem] : [],
      source: 'mock',
      error: fallbackItem ? undefined : 'Item not found in demo data.',
    };
  }

  const client = getSupabaseClient();

  const { data: itemRow, error: itemError } = await client
    .from('grocery_items')
    .select('*')
    .eq('id', id)
    .single();

  if (itemError || !itemRow) {
    return {
      item: null,
      priceHistory: [],
      source: 'supabase',
      error: itemError?.message ?? 'Item not found.',
    };
  }

  const { data: historyRows, error: historyError } = await client
    .from('grocery_items')
    .select('*')
    .eq('item_name', itemRow.item_name)
    .order('date_purchased', { ascending: false });

  if (historyError || !historyRows) {
    return {
      item: mapRowToItem(itemRow),
      priceHistory: [mapRowToItem(itemRow)],
      source: 'supabase',
      error: historyError?.message,
    };
  }

  return {
    item: mapRowToItem(itemRow),
    priceHistory: historyRows.map(mapRowToItem),
    source: 'supabase',
  };
};

export type CreateGroceryItemInput = {
  itemName: string;
  category: GroceryItemRow['category'];
  meatQuality?: GroceryItemRow['meat_quality'];
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

const mapCreateInputToInsert = (input: CreateGroceryItemInput): GroceryItemsInsert => ({
  item_name: input.itemName,
  category: input.category,
  meat_quality: input.meatQuality ?? null,
  store_name: input.storeName,
  price: input.price,
  quantity: input.quantity,
  unit_type: input.unitType,
  unit_price: input.unitPrice,
  date_purchased: formatISO(input.datePurchased, { representation: 'date' }),
  notes: input.notes ?? null,
  target_price: input.targetPrice ?? null,
  user_id: input.userId ?? null,
});

export const createGroceryItem = async (input: CreateGroceryItemInput): Promise<GroceryItem> => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured. Add your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to use live data.');
  }

  const client = getSupabaseClient();

  const { data, error } = await client
    .from('grocery_items')
    .insert(mapCreateInputToInsert(input))
    .select()
    .single();

  if (error || !data) {
    console.error('[Supabase] Failed to create grocery item:', error?.message);
    throw new Error(error?.message ?? 'Failed to create grocery item.');
  }

  return mapRowToItem(data);
};

export const deleteGroceryItem = async (itemId: string): Promise<void> => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured.');
  }

  const client = getSupabaseClient();
  const { error } = await client
    .from('grocery_items')
    .delete()
    .eq('id', itemId);

  if (error) {
    console.error('[Supabase] Failed to delete grocery item:', error.message);
    throw new Error(error.message || 'Failed to delete item');
  }
};

export const updateGroceryItem = async (update: GroceryItemsUpdate): Promise<GroceryItem> => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured.');
  }

  const client = getSupabaseClient();

  const { data, error } = await client
    .from('grocery_items')
    .update({
      ...('item_name' in update && { item_name: update.item_name }),
      ...('category' in update && { category: update.category }),
      ...('meat_quality' in update && { meat_quality: update.meat_quality ?? null }),
      ...('store_name' in update && { store_name: update.store_name }),
      ...('price' in update && { price: update.price }),
      ...('quantity' in update && { quantity: update.quantity }),
      ...('unit_type' in update && { unit_type: update.unit_type }),
      ...('unit_price' in update && { unit_price: update.unit_price }),
      ...('date_purchased' in update && { date_purchased: update.date_purchased }),
      ...('notes' in update && { notes: update.notes ?? null }),
      ...('target_price' in update && { target_price: update.target_price ?? null }),
    })
    .eq('id', update.id)
    .select()
    .single();

  if (error || !data) {
    console.error('[Supabase] Failed to update grocery item:', error?.message);
    if (error?.code === 'PGRST116') {
      throw new Error('No rows updated. You may need to enable UPDATE policy in Supabase. Run: supabase/enable_item_updates.sql');
    }
    throw new Error(error?.message ?? 'Failed to update grocery item.');
  }

  return mapRowToItem(data);
};

export const updateTargetPrice = async (id: string, targetPrice?: number): Promise<GroceryItem> => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured.');
  }

  const client = getSupabaseClient();

  const { data, error } = await client
    .from('grocery_items')
    .update({ target_price: typeof targetPrice === 'number' ? targetPrice : null })
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to update target price.');
  }

  return mapRowToItem(data);
};

export const getBestPriceByItemName = (items: GroceryItem[], itemName: string): number => {
  const itemPrices = items
    .filter((item) => item.itemName === itemName)
    .map((item) => item.unitPrice);
  return itemPrices.length > 0 ? Math.min(...itemPrices) : Number.NaN;
};

export const summarizeSource = (source: DataSource): string =>
  source === 'supabase' ? 'Live Supabase data' : 'Demo data';

export const isUsingMockData = (source: DataSource): boolean => source === 'mock';
