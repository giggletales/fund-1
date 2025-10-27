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

// OLD DATABASE (Legacy - for migration)
const oldSupabaseUrl = 'https://mvgcwqmsawopumuksqmz.supabase.co';
const oldSupabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12Z2N3cW1zYXdvcHVtdWtzcW16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg4OTk0NjAsImV4cCI6MjA0NDQ3NTQ2MH0.qnT8kGxI0fkPBPdqIRkNXlkqTQfcVKwLLtHhPRa0Uqc';

export const oldSupabase = createClient(oldSupabaseUrl, oldSupabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    storageKey: 'supabase-old-db'
  }
});

console.log('✅ Dual database configuration loaded (NEW + OLD)');
