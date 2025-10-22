import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseKey
  });
}

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
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
