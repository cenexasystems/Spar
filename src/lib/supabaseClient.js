import { createClient } from '@supabase/supabase-js';

// --- IMPORTANT: Replace these with your actual Supabase Credentials ---
const supabaseUrl = 'https://YOUR_SUPABASE_PROJECT_URL.supabase.co';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

// Check if credentials are placeholders
export const isSupabaseConfigured = 
  supabaseUrl !== 'https://YOUR_SUPABASE_PROJECT_URL.supabase.co' && 
  supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY' &&
  supabaseUrl.includes('supabase.co');

// Robust Proxy-based mock to prevent crashes on any chainable Supabase call
const createMockProxy = () => {
  const handler = {
    get: (target, prop) => {
      // Handle promise-like behavior for awaits
      if (prop === 'then') {
        return (resolve) => resolve({ data: [], error: null });
      }
      // Handle the .on() chain specifically for real-time
      if (prop === 'on') {
        return () => createMockProxy();
      }
      // Handle .subscribe()
      if (prop === 'subscribe') {
        return () => ({ unsubscribe: () => {} });
      }
      // Default: return a function that returns the proxy again (for chaining)
      return () => createMockProxy();
    }
  };
  return new Proxy({}, handler);
};

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : createMockProxy();

/**
 * DATABASE SCHEMA TIPS:
 * 
 * 1. 'parks' table: id, name, location, rating, price, desc, image
 * 2. 'bookings' table: id, cadet_name, cadet_email, park_name, tickets, total_amount, payment_method, date
 * 3. 'users' table: id, email, name, spar_coins, avatar, phone
 */
