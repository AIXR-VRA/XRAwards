/**
 * Public Categories API Endpoint
 * GET /api/public/categories - List all visible categories
 * No authentication required
 */

import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const GET: APIRoute = async () => {
  try {
    // Use public client (no auth required)
    const supabase = createClient(
      import.meta.env.SUPABASE_URL,
      import.meta.env.SUPABASE_ANON_KEY
    );

    // Fetch only visible categories, ordered by sort_order
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_visible', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;

    return new Response(
      JSON.stringify({ categories: data }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('GET public categories error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to fetch categories' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

