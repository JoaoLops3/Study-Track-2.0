import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = 'https://wzetgdretgibjdqkdzlw.supabase.co';
const supabaseAnonKey = 'sbp_851438d4911f06a443d4a2d52e3dfbb3c18ddbf7';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);