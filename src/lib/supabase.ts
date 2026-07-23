import { createClient } from '@supabase/supabase-js';

// We fall back to empty strings so the app doesn't crash on build if env vars are missing,
// but they must be provided in .env to connect to Supabase.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
