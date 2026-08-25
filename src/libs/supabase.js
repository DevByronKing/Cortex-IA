import { createClient } from '@supabase/supabase-js';

// Lê as credenciais do Supabase a partir do .env / .env.local
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mock-cortex-supabase.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.mockKeyForCortexTesting';

export const isSupabaseConfigured = () => {
  return !!(
    import.meta.env.VITE_SUPABASE_URL && 
    import.meta.env.VITE_SUPABASE_ANON_KEY &&
    !import.meta.env.VITE_SUPABASE_URL.includes('mock-cortex')
  );
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    }
  }
});
