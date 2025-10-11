/**
 * Finalists API Endpoint
 * GET /api/finalists - List all finalists
 * POST /api/finalists - Create a finalist
 * PUT /api/finalists - Update a finalist
 * DELETE /api/finalists - Delete a finalist
 */

import type { APIRoute } from 'astro';
import { createServerClient } from '@supabase/ssr';

// Helper to initialize Supabase client
function getSupabaseClient(cookies: any) {
  return createServerClient(
    import.meta.env.SUPABASE_URL,
    import.meta.env.SUPABASE_ANON_KEY,
    {
      cookies: {
        get(key: string) {
          return cookies.get(key)?.value;
        },
        set(key: string, value: string, options: any) {
          cookies.set(key, value, options);
        },
        remove(key: string, options: any) {
          cookies.delete(key, options);
        },
      },
    }
  );
}

// Helper to check authentication
async function checkAuth(cookies: any) {
  const supabase = getSupabaseClient(cookies);
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session) {
    return { authenticated: false, supabase, session: null };
  }
  
  return { authenticated: true, supabase, session };
}

// GET - List all finalists
export const GET: APIRoute = async ({ cookies }) => {
  try {
    const { authenticated, supabase } = await checkAuth(cookies);
    
    if (!authenticated) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch finalists with their categories, event details, and tags
    const { data, error } = await supabase
      .from('finalists')
      .select(`
        *,
        categories(*),
        event_details(*),
        finalist_tags (
          tag_id,
          tags (*)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform the data to include tags array
    const finalistsWithTags = data?.map(finalist => ({
      ...finalist,
      tags: finalist.finalist_tags?.map((ft: any) => ft.tags) || []
    }));

    return new Response(
      JSON.stringify({ finalists: finalistsWithTags }),
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
    const { authenticated, supabase } = await checkAuth(cookies);
    
    if (!authenticated) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
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
    const { authenticated, supabase } = await checkAuth(cookies);
    
    if (!authenticated) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
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
    const { authenticated, supabase } = await checkAuth(cookies);
    
    if (!authenticated) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
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

