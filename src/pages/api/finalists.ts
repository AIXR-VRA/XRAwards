/**
 * Finalists API Endpoint
 * GET /api/finalists - List all finalists
 * POST /api/finalists - Create a finalist
 * PUT /api/finalists - Update a finalist
 * DELETE /api/finalists - Delete a finalist
 */

import type { APIRoute } from 'astro';
import { requireApiAuth, createSecureSupabaseClient } from '../../utils/supabase';

// GET - List finalists with pagination and search
export const GET: APIRoute = async ({ url, cookies }) => {
  try {
    // GET doesn't require authentication for public data
    const supabase = createSecureSupabaseClient(cookies);

    // Parse query parameters
    const searchParams = url.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const event = searchParams.get('event') || '';
    const winner = searchParams.get('winner') || '';

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build the query
    let query = supabase
      .from('finalists')
      .select(`
        *,
        categories(*),
        event_details(*),
        finalist_tags (
          tag_id,
          tags (*)
        )
      `, { count: 'exact' });

    // Apply filters
    if (category) {
      query = query.eq('category_id', category);
    }
    
    if (event) {
      query = query.eq('event_id', event);
    }
    
    if (winner === 'winners') {
      query = query.eq('is_winner', true);
    } else if (winner === 'finalists') {
      query = query.eq('is_winner', false);
    }

    // Apply search filter
    if (search) {
      query = query.or(`title.ilike.%${search}%,organization.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply ordering and pagination
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    // Transform the data to include tags array
    const finalistsWithTags = data?.map(finalist => ({
      ...finalist,
      tags: finalist.finalist_tags?.map((ft: any) => ft.tags) || []
    }));

    return new Response(
      JSON.stringify({ 
        finalists: finalistsWithTags,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('GET finalists error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to fetch finalists' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// POST - Create a finalist
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Secure authentication check
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

    const body = await request.json();
    const { title, organization, description, category_id, event_id, image_url, website_url, is_winner, placement, tag_ids, media_ids } = body;

    if (!title || !category_id || !event_id) {
      return new Response(
        JSON.stringify({ error: 'Title, category, and event are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data, error } = await supabase
      .from('finalists')
      .insert({ title, organization, description, category_id, event_id, image_url, website_url, is_winner, placement })
      .select('*, categories(*), event_details(*)')
      .single();

    if (error) throw error;

    // Add tags if provided
    if (tag_ids && tag_ids.length > 0) {
      const tagInserts = tag_ids.map((tag_id: string) => ({
        finalist_id: data.id,
        tag_id,
      }));

      const { error: tagError } = await supabase
        .from('finalist_tags')
        .insert(tagInserts);

      if (tagError) console.error('Error adding tags:', tagError);
    }

    // Add media relationships if provided
    if (media_ids && media_ids.length > 0) {
      const mediaInserts = media_ids.map((media_id: string) => ({
        finalist_id: data.id,
        media_id,
      }));

      const { error: mediaError } = await supabase
        .from('media_finalists')
        .insert(mediaInserts);

      if (mediaError) console.error('Error adding media:', mediaError);
    }

    return new Response(
      JSON.stringify({ finalist: data, message: 'Finalist created successfully' }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('POST finalists error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to create finalist' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// PUT - Update a finalist
export const PUT: APIRoute = async ({ request, cookies }) => {
  try {
    // Secure authentication check
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

    const body = await request.json();
    const { id, title, organization, description, category_id, event_id, image_url, website_url, is_winner, placement, tag_ids, media_ids } = body;

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data, error } = await supabase
      .from('finalists')
      .update({ title, organization, description, category_id, event_id, image_url, website_url, is_winner, placement })
      .eq('id', id)
      .select('*, categories(*), event_details(*)')
      .single();

    if (error) throw error;

    // Update tags if provided
    if (tag_ids !== undefined) {
      // Delete existing tags
      await supabase
        .from('finalist_tags')
        .delete()
        .eq('finalist_id', id);

      // Add new tags
      if (tag_ids.length > 0) {
        const tagInserts = tag_ids.map((tag_id: string) => ({
          finalist_id: id,
          tag_id,
        }));

        const { error: tagError } = await supabase
          .from('finalist_tags')
          .insert(tagInserts);

        if (tagError) console.error('Error updating tags:', tagError);
      }
    }

    // Update media relationships if provided
    if (media_ids !== undefined) {
      // Delete existing media relationships
      await supabase
        .from('media_finalists')
        .delete()
        .eq('finalist_id', id);

      // Add new media relationships
      if (media_ids.length > 0) {
        const mediaInserts = media_ids.map((media_id: string) => ({
          finalist_id: id,
          media_id,
        }));

        const { error: mediaError } = await supabase
          .from('media_finalists')
          .insert(mediaInserts);

        if (mediaError) console.error('Error updating media:', mediaError);
      }
    }

    return new Response(
      JSON.stringify({ finalist: data, message: 'Finalist updated successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('PUT finalists error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to update finalist' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// DELETE - Delete a finalist
export const DELETE: APIRoute = async ({ request, cookies }) => {
  try {
    // Secure authentication check
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

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { error } = await supabase
      .from('finalists')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return new Response(
      JSON.stringify({ message: 'Finalist deleted successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('DELETE finalists error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to delete finalist' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

