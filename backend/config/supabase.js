import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
// Use service role key for backend (bypasses RLS)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing SUPABASE_URL environment variable');
}

if (!supabaseServiceKey && !supabaseAnonKey) {
  throw new Error('Missing Supabase keys (need SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY)');
}

// Prefer service role key for backend operations (bypasses RLS)
const supabaseKey = supabaseServiceKey || supabaseAnonKey;

if (supabaseServiceKey) {
  console.log('✅ Using Supabase SERVICE ROLE key (bypasses RLS)');
} else {
  console.warn('⚠️  Using Supabase ANON key (RLS applies) - set SUPABASE_SERVICE_ROLE_KEY for full access');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
