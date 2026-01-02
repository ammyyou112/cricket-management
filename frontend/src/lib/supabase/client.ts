/**
 * Cricket 360 - Supabase Client
 * Main Supabase client initialization and configuration
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { API_CONFIG } from '../../config/constants';

// Check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
  return !!(API_CONFIG.SUPABASE_URL && API_CONFIG.SUPABASE_ANON_KEY);
};

// Create Supabase client
let supabaseClient: SupabaseClient | null = null;

if (isSupabaseConfigured()) {
  supabaseClient = createClient(
    API_CONFIG.SUPABASE_URL!,
    API_CONFIG.SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    }
  );
} else {
  console.warn(
    '⚠️ Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file'
  );
}

export const supabase = supabaseClient;

// Helper to check if client is available
export const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseClient) {
    throw new Error(
      'Supabase client is not initialized. Please configure your environment variables.'
    );
  }
  return supabaseClient;
};

