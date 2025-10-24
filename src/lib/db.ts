import { createClient } from '@supabase/supabase-js';

// Configuration
const config = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || 'https://mvgcwqmsawopumuksqmz.supabase.co',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12Z2N3cW1zYXdvcHVtdWtzcW16Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyODg5OTQ2MCwiZXhwIjoyMDQ0NDc1NDYwfQ.4z95PVq2JQ6QZ0vLQw3JkQdQJ8Q1X9Z8QkQ5Q9X9X9X9',
  supabaseServiceKey: import.meta.env.VITE_SUPABASE_SERVICE_KEY || 'your-service-key-here'
};

// Validate configuration
if (!config.supabaseUrl || !config.supabaseAnonKey) {
  console.error('Missing Supabase configuration:', {
    supabaseUrl: !!config.supabaseUrl,
    supabaseAnonKey: !!config.supabaseAnonKey
  });
}

// Create Supabase client with admin privileges
export const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Create read-only client for public data
export const publicSupabase = createClient(config.supabaseUrl, config.supabaseAnonKey);

// For backward compatibility
export const oldSupabase = supabase;

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
