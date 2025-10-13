/**
 * Judges API Endpoint
 * GET /api/judges - List all judges
 * POST /api/judges - Create a judge
 * PUT /api/judges - Update a judge
 * DELETE /api/judges - Delete a judge
 */

import type { APIRoute } from 'astro';
import { requireApiAuth, createSecureSupabaseClient } from '../../utils/supabase';

// GET - List all judges
export const GET: APIRoute = async ({ cookies }) => {
  try {
    // GET doesn't require authentication for public data
    const supabase = createSecureSupabaseClient(cookies);

    // Fetch judges with their events and tags
    const { data, error } = await supabase
      .from('judges')
      .select(`
        *,
        judge_events (
          event_id,
          event_details (*)
        ),
        judge_tags (
          tag_id,
          tags (*)
        )
      `)
      .order('last_name', { ascending: true });

    if (error) throw error;

    // Transform the data to include events and tags arrays
    const judgesWithRelations = data?.map(judge => ({
      ...judge,
      events: judge.judge_events?.map((je: any) => je.event_details) || [],
      tags: judge.judge_tags?.map((jt: any) => jt.tags) || []
    }));

    return new Response(
      JSON.stringify({ judges: judgesWithRelations }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('GET judges error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to fetch judges' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// POST - Create a judge
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
    const { first_name, last_name, job_title, organization, linkedin_url, profile_image_url, description, sort_order, is_visible, event_ids, tag_ids, media_ids } = body;

    if (!first_name || !last_name) {
      return new Response(
        JSON.stringify({ error: 'First name and last name are required' }),
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
      .from('judges')
      .insert({ first_name, last_name, job_title, organization, linkedin_url, profile_image_url, description, sort_order, is_visible })
      .select()
      .single();

    if (error) throw error;

    // Add events (required)
    if (event_ids && event_ids.length > 0) {
      const eventInserts = event_ids.map((event_id: string) => ({
        judge_id: data.id,
        event_id,
      }));

      const { error: eventError } = await supabase
        .from('judge_events')
        .insert(eventInserts);

      if (eventError) console.error('Error adding events:', eventError);
    }

    // Add tags (optional)
    if (tag_ids && tag_ids.length > 0) {
      const tagInserts = tag_ids.map((tag_id: string) => ({
        judge_id: data.id,
        tag_id,
      }));

      const { error: tagError } = await supabase
        .from('judge_tags')
        .insert(tagInserts);

      if (tagError) console.error('Error adding tags:', tagError);
    }

    // Add media relationships if provided
    if (media_ids && media_ids.length > 0) {
      const mediaInserts = media_ids.map((media_id: string) => ({
        judge_id: data.id,
        media_id,
      }));

      const { error: mediaError } = await supabase
        .from('media_judges')
        .insert(mediaInserts);

      if (mediaError) console.error('Error adding media:', mediaError);
    }

    return new Response(
      JSON.stringify({ judge: data, message: 'Judge created successfully' }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('POST judges error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to create judge' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// PUT - Update a judge
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
    const { id, first_name, last_name, job_title, organization, linkedin_url, profile_image_url, description, sort_order, is_visible, event_ids, tag_ids, media_ids } = body;

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
      .from('judges')
      .update({ first_name, last_name, job_title, organization, linkedin_url, profile_image_url, description, sort_order, is_visible })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Update events if provided
    if (event_ids !== undefined) {
      // Delete existing event associations
      await supabase
        .from('judge_events')
        .delete()
        .eq('judge_id', id);

      // Add new events
      if (event_ids.length > 0) {
        const eventInserts = event_ids.map((event_id: string) => ({
          judge_id: id,
          event_id,
        }));

        const { error: eventError } = await supabase
          .from('judge_events')
          .insert(eventInserts);

        if (eventError) console.error('Error updating events:', eventError);
      }
    }

    // Update tags if provided
    if (tag_ids !== undefined) {
      // Delete existing tags
      await supabase
        .from('judge_tags')
        .delete()
        .eq('judge_id', id);

      // Add new tags
      if (tag_ids.length > 0) {
        const tagInserts = tag_ids.map((tag_id: string) => ({
          judge_id: id,
          tag_id,
        }));

        const { error: tagError } = await supabase
          .from('judge_tags')
          .insert(tagInserts);

        if (tagError) console.error('Error updating tags:', tagError);
      }
    }

    // Update media relationships if provided
    if (media_ids !== undefined) {
      // Delete existing media relationships
      await supabase
        .from('media_judges')
        .delete()
        .eq('judge_id', id);

      // Add new media relationships
      if (media_ids.length > 0) {
        const mediaInserts = media_ids.map((media_id: string) => ({
          judge_id: id,
          media_id,
        }));

        const { error: mediaError } = await supabase
          .from('media_judges')
          .insert(mediaInserts);

        if (mediaError) console.error('Error updating media:', mediaError);
      }
    }

    return new Response(
      JSON.stringify({ judge: data, message: 'Judge updated successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('PUT judges error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to update judge' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// DELETE - Delete a judge
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
      .from('judges')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return new Response(
      JSON.stringify({ message: 'Judge deleted successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('DELETE judges error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to delete judge' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

