import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] Environment variables missing. The app will fall back to demo data until you configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  );
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
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
  category: 'Meat' | 'Dairy' | 'Produce' | 'Snacks' | 'Drinks' | 'Household' | 'Other';
  meat_quality: 'Choice' | 'Prime' | 'Wagyu' | null;
  store_name: string;
  price: number;
  quantity: number;
  unit_type: string;
  unit_price: number;
  date_purchased: string;
  notes: string | null;
  target_price: number | null;
  user_id: string | null;
};

export type GroceryItemsInsert = Omit<GroceryItemRow, 'id' | 'created_at' | 'unit_price'> & {
  id?: string;
  created_at?: string;
  unit_price: number;
};

export type GroceryItemsUpdate = Partial<GroceryItemsInsert> & { id: string };
export default supabase;
