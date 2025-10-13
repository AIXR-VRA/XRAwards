/**
 * Sponsors API Endpoint
 * GET /api/sponsors - List all sponsors
 * POST /api/sponsors - Create a sponsor
 * PUT /api/sponsors - Update a sponsor
 * DELETE /api/sponsors - Delete a sponsor
 */

import type { APIRoute } from 'astro';
import { requireApiAuth, createSecureSupabaseClient } from '../../utils/supabase';

// GET - List all sponsors
export const GET: APIRoute = async ({ cookies }) => {
  try {
    // GET doesn't require authentication for public data
    const supabase = createSecureSupabaseClient(cookies);

    // Fetch sponsors with their events and categories
    const { data, error } = await supabase
      .from('sponsors')
      .select(`
        *,
        sponsor_events (
          event_id,
          event_details (*)
        ),
        sponsor_categories (
          category_id,
          categories (*)
        )
      `)
      .order('sort_order', { ascending: true });

    if (error) throw error;

    // Transform the data to include events and categories arrays
    const sponsorsWithRelations = data?.map(sponsor => ({
      ...sponsor,
      events: sponsor.sponsor_events?.map((se: any) => se.event_details) || [],
      categories: sponsor.sponsor_categories?.map((sc: any) => sc.categories) || []
    }));

    return new Response(
      JSON.stringify({ sponsors: sponsorsWithRelations }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('GET sponsors error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to fetch sponsors' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// POST - Create a sponsor
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
    const { name, tagline, description, website_url, logo_url, sort_order, is_visible, event_ids, category_ids, media_ids } = body;

    if (!name) {
      return new Response(
        JSON.stringify({ error: 'Name is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!event_ids || event_ids.length === 0) {
      return new Response(
        JSON.stringify({ error: 'At least one event is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data, error } = await supabase
      .from('sponsors')
      .insert({ name, tagline, description, website_url, logo_url, sort_order, is_visible })
      .select()
      .single();

    if (error) throw error;

    // Add events (required)
    if (event_ids && event_ids.length > 0) {
      const eventInserts = event_ids.map((event_id: string) => ({
        sponsor_id: data.id,
        event_id,
      }));

      const { error: eventError } = await supabase
        .from('sponsor_events')
        .insert(eventInserts);

      if (eventError) console.error('Error adding events:', eventError);
    }

    // Add categories (optional)
    if (category_ids && category_ids.length > 0) {
      const categoryInserts = category_ids.map((category_id: string) => ({
        sponsor_id: data.id,
        category_id,
      }));

      const { error: categoryError } = await supabase
        .from('sponsor_categories')
        .insert(categoryInserts);

      if (categoryError) console.error('Error adding categories:', categoryError);
    }

    // Add media relationships if provided
    if (media_ids && media_ids.length > 0) {
      const mediaInserts = media_ids.map((media_id: string) => ({
        sponsor_id: data.id,
        media_id,
      }));

      const { error: mediaError } = await supabase
        .from('media_sponsors')
        .insert(mediaInserts);

      if (mediaError) console.error('Error adding media:', mediaError);
    }

    return new Response(
      JSON.stringify({ sponsor: data, message: 'Sponsor created successfully' }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('POST sponsors error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to create sponsor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// PUT - Update a sponsor
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
    const { id, name, tagline, description, website_url, logo_url, sort_order, is_visible, event_ids, category_ids, media_ids } = body;

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (event_ids !== undefined && event_ids.length === 0) {
      return new Response(
        JSON.stringify({ error: 'At least one event is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data, error } = await supabase
      .from('sponsors')
      .update({ name, tagline, description, website_url, logo_url, sort_order, is_visible })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Update events if provided
    if (event_ids !== undefined) {
      // Delete existing event associations
      await supabase
        .from('sponsor_events')
        .delete()
        .eq('sponsor_id', id);

      // Add new events
      if (event_ids.length > 0) {
        const eventInserts = event_ids.map((event_id: string) => ({
          sponsor_id: id,
          event_id,
        }));

        const { error: eventError } = await supabase
          .from('sponsor_events')
          .insert(eventInserts);

        if (eventError) console.error('Error updating events:', eventError);
      }
    }

    // Update categories if provided
    if (category_ids !== undefined) {
      // Delete existing categories
      await supabase
        .from('sponsor_categories')
        .delete()
        .eq('sponsor_id', id);

      // Add new categories
      if (category_ids.length > 0) {
        const categoryInserts = category_ids.map((category_id: string) => ({
          sponsor_id: id,
          category_id,
        }));

        const { error: categoryError } = await supabase
          .from('sponsor_categories')
          .insert(categoryInserts);

        if (categoryError) console.error('Error updating categories:', categoryError);
      }
    }

    // Update media relationships if provided
    if (media_ids !== undefined) {
      // Delete existing media relationships
      await supabase
        .from('media_sponsors')
        .delete()
        .eq('sponsor_id', id);

      // Add new media relationships
      if (media_ids.length > 0) {
        const mediaInserts = media_ids.map((media_id: string) => ({
          sponsor_id: id,
          media_id,
        }));

        const { error: mediaError } = await supabase
          .from('media_sponsors')
          .insert(mediaInserts);

        if (mediaError) console.error('Error updating media:', mediaError);
      }
    }

    return new Response(
      JSON.stringify({ sponsor: data, message: 'Sponsor updated successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('PUT sponsors error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to update sponsor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// DELETE - Delete a sponsor
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
      .from('sponsors')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return new Response(
      JSON.stringify({ message: 'Sponsor deleted successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('DELETE sponsors error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to delete sponsor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

