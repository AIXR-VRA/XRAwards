/**
 * Logout API Endpoint
 * POST /api/auth/logout
 * Handles server-side logout and clears cookies
 */

import type { APIRoute } from 'astro';
import { createServerClient } from '@supabase/ssr';

export const POST: APIRoute = async ({ cookies }) => {
  try {
    const supabase = createServerClient(
      import.meta.env.SUPABASE_URL,
      import.meta.env.SUPABASE_ANON_KEY,
      {
        cookies: {
          get(key: string) {
            return cookies.get(key)?.value;
          },
          set(key: string, value: string, options: any) {
            cookies.set(key, value, {
              ...options,
              path: '/',
              httpOnly: true,
              sameSite: 'lax',
              secure: import.meta.env.PROD,
            });
          },
          remove(key: string, options: any) {
            cookies.delete(key, {
              ...options,
              path: '/',
            });
          },
        },
      }
    );

    await supabase.auth.signOut();

    return new Response(
      JSON.stringify({ success: true, message: 'Logged out successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Logout API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

