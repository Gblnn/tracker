import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://layonfapjyiupkjdswbj.supabase.co/";
const supabaseAnonKey = "sb_publishable_60EgFkAFmczfEjOySTOBQQ_QYKGosa_";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
