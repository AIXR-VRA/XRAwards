/**
 * Logout API Endpoint
 * POST /api/auth/logout
 * Handles server-side logout and clears session cookies
 */

import type { APIRoute } from 'astro';
import { createSecureSupabaseClient } from '../../../utils/supabase';

export const POST: APIRoute = async ({ cookies, request }) => {
  try {
    // Check environment variables first
    if (!import.meta.env.PUBLIC_SUPABASE_URL || !import.meta.env.PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables!');
      return new Response(
        JSON.stringify({ error: 'Server configuration error - Supabase credentials not found' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with proper SSR cookie handling
    const supabase = createSecureSupabaseClient(cookies, request);

    // Sign out
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Supabase logout error:', error);
      // Even if there's an error, we should still try to clear cookies
    }

    console.log('Logout successful');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Logout successful'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Logout API error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};