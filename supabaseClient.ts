import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable. Did you create an .env file?');
}

if (!supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable. Did you create an .env file?');
}

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

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export default supabase;
