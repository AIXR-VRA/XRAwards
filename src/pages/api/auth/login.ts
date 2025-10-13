/**
 * Login API Endpoint
 * POST /api/auth/login
 * Handles server-side login and sets proper cookies
 */

import type { APIRoute } from 'astro';
import { createServerClient, parseCookieHeader } from '@supabase/ssr';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Check environment variables first
    if (!import.meta.env.SUPABASE_URL || !import.meta.env.SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables!');
      console.error('SUPABASE_URL:', import.meta.env.SUPABASE_URL ? 'set' : 'missing');
      console.error('SUPABASE_ANON_KEY:', import.meta.env.SUPABASE_ANON_KEY ? 'set' : 'missing');
      return new Response(
        JSON.stringify({ error: 'Server configuration error - Supabase credentials not found' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body with better error handling
    let body;
    try {
      const text = await request.text();
      console.log('Request body text:', text);
      body = text ? JSON.parse(text) : {};
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid request body', details: 'Could not parse JSON' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { email, password } = body;

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
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
                maxAge: options?.maxAge || 60 * 60 * 24 * 7, // 7 days
                ...options
              })
            );
          },
        },
      }
    );

    // Sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Supabase auth error:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!data.session) {
      console.error('No session created after successful login');
      return new Response(
        JSON.stringify({ error: 'No session created' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('Login successful, session created for:', data.user.email);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Login successful',
        user: {
          email: data.user.email,
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Login API error:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

