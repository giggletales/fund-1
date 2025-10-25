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
const oldSupabaseUrl = import.meta.env.VITE_OLD_SUPABASE_URL;
const oldSupabaseKey = import.meta.env.VITE_OLD_SUPABASE_ANON_KEY;

export const oldSupabase = oldSupabaseUrl && oldSupabaseKey
  ? createClient(oldSupabaseUrl, oldSupabaseKey, {
      auth: {
        persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
    storageKey: 'supabase-old-db'
  }
})
: null;

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
