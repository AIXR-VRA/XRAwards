/**
 * Logout API Endpoint
 * POST /api/auth/logout
 * Handles server-side logout and clears session cookies
 */

import type { APIRoute } from 'astro';
import { createServerClient, parseCookieHeader } from '@supabase/ssr';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Check environment variables first
    if (!import.meta.env.SUPABASE_URL || !import.meta.env.SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables!');
      return new Response(
        JSON.stringify({ error: 'Server configuration error - Supabase credentials not found' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with proper SSR cookie handling
    const supabase = createServerClient(
      import.meta.env.SUPABASE_URL,
      import.meta.env.SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return parseCookieHeader(request.headers.get('Cookie') ?? '');
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookies.set(name, value, {
                path: '/',
                httpOnly: true,
                sameSite: 'lax',
                secure: false, // Set to false for development
                maxAge: options?.maxAge || 0, // 0 for immediate expiration
                ...options
              })
            );
          },
        },
      }
    );

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