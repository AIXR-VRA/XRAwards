/**
 * User Profiles API Endpoint
 * GET /api/user-profiles - List all admin user profiles (for sender selection)
 */

import type { APIRoute } from 'astro';
import { requireApiAuth } from '../../utils/supabase';

// GET - List all user profiles (admins)
export const GET: APIRoute = async ({ cookies, request }) => {
  try {
    const authResult = await requireApiAuth(cookies, request);

    if (!authResult.authenticated) {
      return new Response(
        JSON.stringify({ error: authResult.error }),
        { status: authResult.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = authResult.supabase;
    if (!supabase) {
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch all user profiles
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, first_name, last_name, profile_photo_url, job_title')
      .order('first_name', { ascending: true });

    if (error) throw error;

    return new Response(
      JSON.stringify({ profiles: data || [] }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('GET user-profiles error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to fetch user profiles' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};


