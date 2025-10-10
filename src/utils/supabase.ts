/**
 * Supabase Client Setup for Astro
 * 
 * This follows the official Astro + Supabase integration guide:
 * https://docs.astro.build/en/guides/backend/supabase/
 *
 * Usage:
 * - Import and use `supabase` for standard database operations
 * - Respects Row Level Security (RLS) policies
 * - Works in both browser and server contexts
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY;

/**
 * Supabase client for database operations
 * Safe to use in browser and server contexts
 * Respects Row Level Security (RLS) policies
 */
export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

/**
 * Check if Supabase is properly configured
 * @returns boolean indicating if required environment variables are set
 */
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey);
}

/**
 * Format Supabase error messages for display
 * @param error - The error object from Supabase
 * @returns User-friendly error message
 */
export function handleSupabaseError(error: any): string {
  if (!error) return 'An unknown error occurred';
  if (error.message) return error.message;
  if (typeof error === 'string') return error;
  return 'An error occurred while processing your request';
}

/**
 * Type helper for Supabase database types
 * 
 * Generate types from your Supabase schema:
 * ```bash
 * supabase gen types typescript --project-id your-project-id > src/utils/database.types.ts
 * ```
 * 
 * Then import and use:
 * ```typescript
 * import type { Database } from './database.types';
 * export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
 * ```
 */
export type Database = any; // Replace with generated types

