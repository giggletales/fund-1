import { createClient } from '@supabase/supabase-js';

// NEW DATABASE (Primary)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey
  });
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : null;

// OLD DATABASE (Legacy - for migration)
const oldSupabaseUrl = 'https://mvgcwqmsawopumuksqmz.supabase.co';
const oldSupabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12Z2N3cW1zYXdvcHVtdWtzcW16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg4OTk0NjAsImV4cCI6MjA0NDQ3NTQ2MH0.qnT8kGxI0fkPBPdqIRkNXlkqTQfcVKwLLtHhPRa0Uqc';

export const oldSupabase = createClient(oldSupabaseUrl, oldSupabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
    storageKey: 'supabase-old-db'
  }
});

export const db = {
  query: async (text: string, params?: any[]) => {
    if (!supabase) {
      console.warn('Supabase not initialized - using fallback');
      return { rows: [] };
    }

    try {
      const { data, error } = await supabase.rpc('execute_sql', {
        query: text,
        params: params || []
      });

      if (error) throw error;
      return { rows: data || [] };
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }
};
