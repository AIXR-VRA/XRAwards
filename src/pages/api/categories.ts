/**
 * Categories API Endpoint
 * GET /api/categories - List all categories
 * POST /api/categories - Create a category
 * PUT /api/categories - Update a category
 * DELETE /api/categories - Delete a category
 */

import type { APIRoute } from 'astro';
import { requireApiAuth, createSecureSupabaseClient } from '../../utils/supabase';

// GET - List all categories
export const GET: APIRoute = async ({ cookies }) => {
  try {
    // GET doesn't require authentication for public data
    const supabase = createSecureSupabaseClient(cookies);

    // Fetch categories with their tags, events, and accolade types
    const { data, error } = await supabase
      .from('categories')
      .select(`
        *,
        category_tags (
          tag_id,
          tags (*)
        ),
        category_events (
          event_id,
          event_details (*)
        ),
        category_accolades (
          accolade_id,
          accolades (*)
        )
      `)
      .order('name', { ascending: true });

    if (error) throw error;

    // Transform the data to include tags, events, and accolades arrays
    const categoriesWithTags = data?.map(cat => ({
      ...cat,
      tags: cat.category_tags?.map((ct: any) => ct.tags) || [],
      events: cat.category_events?.map((ce: any) => ce.event_details) || [],
      accolades: cat.category_accolades?.map((ca: any) => ca.accolades) || []
    }));

    return new Response(
      JSON.stringify({ categories: categoriesWithTags }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('GET categories error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to fetch categories' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// POST - Create a category
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
    const { name, slug, description, is_visible, sort_order, additional_info, tag_ids, event_ids, accolade_ids } = body;

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
      .from('categories')
      .insert({ name, slug, description, is_visible, sort_order, additional_info })
      .select()
      .single();

    if (error) throw error;

    // Add events
    if (event_ids && event_ids.length > 0) {
      const eventInserts = event_ids.map((event_id: string) => ({
        category_id: data.id,
        event_id,
      }));

      const { error: eventError } = await supabase
        .from('category_events')
        .insert(eventInserts);

      if (eventError) console.error('Error adding events:', eventError);
    }

    // Add tags if provided
    if (tag_ids && tag_ids.length > 0) {
      const tagInserts = tag_ids.map((tag_id: string) => ({
        category_id: data.id,
        tag_id,
      }));

      const { error: tagError } = await supabase
        .from('category_tags')
        .insert(tagInserts);

      if (tagError) console.error('Error adding tags:', tagError);
    }

    // Add accolade types if provided
    if (accolade_ids && accolade_ids.length > 0) {
      const accoladeInserts = accolade_ids.map((accolade_id: string) => ({
        category_id: data.id,
        accolade_id,
      }));

      const { error: accoladeError } = await supabase
        .from('category_accolades')
        .insert(accoladeInserts);

      if (accoladeError) console.error('Error adding accolades:', accoladeError);
    }

    return new Response(
      JSON.stringify({ category: data, message: 'Category created successfully' }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('POST categories error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to create category' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// PUT - Update a category
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
    const { id, name, slug, description, is_visible, sort_order, additional_info, tag_ids, event_ids, accolade_ids } = body;

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
      .from('categories')
      .update({ name, slug, description, is_visible, sort_order, additional_info })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Update events if provided
    if (event_ids !== undefined) {
      // Delete existing event associations
      await supabase
        .from('category_events')
        .delete()
        .eq('category_id', id);

      // Add new events
      if (event_ids.length > 0) {
        const eventInserts = event_ids.map((event_id: string) => ({
          category_id: id,
          event_id,
        }));

        const { error: eventError } = await supabase
          .from('category_events')
          .insert(eventInserts);

        if (eventError) console.error('Error updating events:', eventError);
      }
    }

    // Update tags if provided
    if (tag_ids !== undefined) {
      // Delete existing tags
      await supabase
        .from('category_tags')
        .delete()
        .eq('category_id', id);

      // Add new tags
      if (tag_ids.length > 0) {
        const tagInserts = tag_ids.map((tag_id: string) => ({
          category_id: id,
          tag_id,
        }));

        const { error: tagError } = await supabase
          .from('category_tags')
          .insert(tagInserts);

        if (tagError) console.error('Error updating tags:', tagError);
      }
    }

    // Update accolade types if provided
    if (accolade_ids !== undefined) {
      // Delete existing accolade associations
      await supabase
        .from('category_accolades')
        .delete()
        .eq('category_id', id);

      // Add new accolades
      if (accolade_ids.length > 0) {
        const accoladeInserts = accolade_ids.map((accolade_id: string) => ({
          category_id: id,
          accolade_id,
        }));

        const { error: accoladeError } = await supabase
          .from('category_accolades')
          .insert(accoladeInserts);

        if (accoladeError) console.error('Error updating accolades:', accoladeError);
      }
    }

    return new Response(
      JSON.stringify({ category: data, message: 'Category updated successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('PUT categories error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to update category' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// DELETE - Delete a category
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
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return new Response(
      JSON.stringify({ message: 'Category deleted successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('DELETE categories error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to delete category' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

