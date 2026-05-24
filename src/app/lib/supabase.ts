import { createClient } from '@supabase/supabase-js';

// Grab the keys we just put in your .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create a single, reusable connection to your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);