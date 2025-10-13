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
import { createServerClient, parseCookieHeader } from '@supabase/ssr';

// Get Supabase credentials from environment variables
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

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

/**
 * Get the active event from the database
 * @returns Promise with the active event data or null
 */
export async function getActiveEvent() {
  const { data: activeEvent } = await supabase
    .from('event_details')
    .select('*')
    .eq('is_active', true)
    .single();

  return activeEvent;
}

/**
 * Get the active event year
 * @returns Promise with the active event year or 2024 as fallback
 */
export async function getActiveEventYear(): Promise<number> {
  const activeEvent = await getActiveEvent();
  return activeEvent?.event_year || 2024;
}

/**
 * Get all event years for navigation
 * @returns Promise with array of event years sorted by year (descending)
 */
export async function getEventYears(): Promise<number[]> {
  const { data: events } = await supabase
    .from('event_details')
    .select('event_year')
    .order('event_year', { ascending: false });

  return events?.map(e => e.event_year) || [];
}

/**
 * Get the most recent three event years for navigation
 * @returns Promise with array of the three most recent event years
 */
export async function getRecentEventYears(): Promise<number[]> {
  const years = await getEventYears();
  return years.slice(0, 3);
}

/**
 * Check if an event year is after ceremony date
 * @param year - The event year to check
 * @returns Promise with boolean indicating if year is after ceremony
 */
export async function isAfterCeremonyDate(year: number): Promise<boolean> {
  const { data: event } = await supabase
    .from('event_details')
    .select('ceremony_date')
    .eq('event_year', year)
    .single();

  if (!event?.ceremony_date) return false;
  
  const ceremonyDate = new Date(event.ceremony_date);
  const now = new Date();
  
  return now > ceremonyDate;
}

/**
 * SECURE AUTHENTICATION UTILITIES
 * 
 * These functions use supabase.auth.getUser() which verifies the session
 * with the Supabase Auth server, making them secure for admin operations.
 */

/**
 * Securely get the authenticated user
 * @returns Promise with user data or null if not authenticated
 */
export async function getAuthenticatedUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error('Auth error:', error);
    return null;
  }
  
  return user;
}

/**
 * Securely check if user is authenticated
 * @returns Promise with boolean indicating authentication status
 */
export async function isUserAuthenticated(): Promise<boolean> {
  const user = await getAuthenticatedUser();
  return !!user;
}

/**
 * Securely get user session for admin operations
 * @returns Promise with session data or null if not authenticated
 */
export async function getSecureSession() {
  const user = await getAuthenticatedUser();
  if (!user) return null;
  
  // Return a session-like object with the verified user
  return {
    user,
    access_token: null, // Not needed for server-side operations
    refresh_token: null, // Not needed for server-side operations
  };
}

/**
 * Create a secure Supabase client for server-side operations
 * This should be used in API routes and server-side admin pages
 */
export function createSecureSupabaseClient(cookies: any, request?: Request) {
  return createServerClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          if (request) {
            const cookies = parseCookieHeader(request.headers.get('Cookie') ?? '');
            // Filter out cookies without values and ensure value is string
            return cookies.filter(cookie => cookie.value).map(cookie => ({
              name: cookie.name,
              value: cookie.value!
            }));
          }
          // For Astro pages without request object, return empty array
          // The session will be handled through other means
          return [];
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookies.set(name, value, {
              path: '/',
              httpOnly: true,
              sameSite: 'lax',
              secure: false, // Set to false for development
              maxAge: options?.maxAge || 60 * 60 * 24 * 7, // 7 days
              ...options
            })
          );
        },
      },
    }
  );
}

/**
 * Secure authentication check for admin pages
 * @param cookies - Astro cookies object
 * @param request - Request object for cookie parsing
 * @returns Promise with session data or redirect response
 */
export async function requireAdminAuth(cookies: any, request?: Request) {
  const supabase = createSecureSupabaseClient(cookies, request);
  
  // Use getSession() for server-side authentication
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session?.user) {
    return {
      authenticated: false,
      redirect: '/admin/login',
      session: null,
      supabase: null
    };
  }
  
  return {
    authenticated: true,
    redirect: null,
    session,
    supabase
  };
}

/**
 * Secure authentication check for API routes
 * @param cookies - Astro cookies object
 * @param request - Request object for cookie parsing
 * @returns Promise with authentication result
 */
export async function requireApiAuth(cookies: any, request?: Request) {
  const supabase = createSecureSupabaseClient(cookies, request);
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return {
      authenticated: false,
      error: 'Unauthorized',
      status: 401,
      supabase: null
    };
  }
  
  return {
    authenticated: true,
    error: null,
    status: 200,
    supabase
  };
}

