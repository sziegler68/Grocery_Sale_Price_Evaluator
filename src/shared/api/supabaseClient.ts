import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './supabaseConfig';

let supabase: SupabaseClient | null = null;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('[Supabase] Missing Supabase credentials. Falling back to demo data.');
} else {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

export const isSupabaseConfigured = Boolean(supabase);

export const getSupabaseClient = (): SupabaseClient => {
  if (!supabase) {
    throw new Error('Supabase is not configured. Check your environment variables.');
  }
  return supabase;
};

export type GroceryItemRow = {
  id: string;
  created_at: string;
  item_name: string;
  category: 'Meat' | 'Beef' | 'Pork' | 'Chicken' | 'Seafood' | 'Dairy' | 'Produce' | 'Snacks' | 'Drinks' | 'Household' | 'Other';
  
  // Phase 3: Quality fields
  meat_quality: 'Choice' | 'Prime' | 'Wagyu' | 'Grassfed' | 'Organic' | 'Regular' | 'Free Range' | 'Fresh' | 'Farm Raised' | 'Frozen' | null; // Legacy
  organic?: boolean;
  grass_fed?: boolean;
  freshness?: 'Fresh' | 'Previously Frozen' | 'Frozen' | null;
  meat_grade?: 'Choice' | 'Prime' | 'Wagyu' | null;
  seafood_source?: 'Wild' | 'Farm Raised' | null;
  
  store_name: string;
  price: number;
  quantity: number;
  unit_type: string;
  unit_price: number;
  date_purchased: string;
  notes: string | null;
  target_price: number | null;
  user_id: string | null;
  
  // Phase 4: Moderation fields
  flagged_for_review?: boolean;
  verified?: boolean;
  flagged_reason?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
};

export type GroceryItemsInsert = Omit<GroceryItemRow, 'id' | 'created_at' | 'unit_price'> & {
  id?: string;
  created_at?: string;
  unit_price: number;
};

export type GroceryItemsUpdate = Partial<GroceryItemsInsert> & { id: string };
export default supabase;
