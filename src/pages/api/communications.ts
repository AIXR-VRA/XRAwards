/**
 * Communications API Endpoint
 * GET /api/communications - List communications with pagination
 * POST /api/communications - Create a communication record (for tracking)
 */

import type { APIRoute } from 'astro';
import { requireApiAuth } from '../../utils/supabase';

// GET - List communications with pagination
export const GET: APIRoute = async ({ url, cookies, request }) => {
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

    // Parse query parameters
    const searchParams = url.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || '';

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build the query
    let query = supabase
      .from('communications')
      .select(`
        *,
        user_profiles!sent_by (
          first_name,
          last_name,
          profile_photo_url
        )
      `, { count: 'exact' });

    // Apply status filter if provided
    if (status) {
      query = query.eq('status', status);
    }

    // Apply ordering and pagination
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return new Response(
      JSON.stringify({
        communications: data || [],
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
    console.error('GET communications error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to fetch communications' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// POST - Create a communication record
export const POST: APIRoute = async ({ request, cookies }) => {
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

    const body = await request.json();
    const {
      sent_by,
      subject,
      message_content,
      html_content,
      text_content,
      recipient_count,
      template_name,
      tags,
      scheduled_at,
      contact_ids
    } = body;

    // Validate required fields
    if (!sent_by || !subject || !message_content || !html_content || !template_name) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: sent_by, subject, message_content, html_content, template_name' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!contact_ids || contact_ids.length === 0) {
      return new Response(
        JSON.stringify({ error: 'At least one recipient is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create communication record
    const { data: communication, error: commError } = await supabase
      .from('communications')
      .insert({
        sent_by,
        subject,
        message_content,
        html_content,
        text_content: text_content || null,
        recipient_count: contact_ids.length,
        template_name,
        tags: tags || [],
        scheduled_at: scheduled_at || null,
        status: scheduled_at ? 'scheduled' : 'pending'
      })
      .select()
      .single();

    if (commError) throw commError;

    // Create recipient records
    const recipientInserts = contact_ids.map((contact_id: string) => ({
      communication_id: communication.id,
      contact_id,
      status: 'pending'
    }));

    const { error: recipientError } = await supabase
      .from('communication_recipients')
      .insert(recipientInserts);

    if (recipientError) {
      console.error('Error creating recipients:', recipientError);
      // Rollback communication
      await supabase.from('communications').delete().eq('id', communication.id);
      throw recipientError;
    }

    return new Response(
      JSON.stringify({
        communication,
        message: scheduled_at ? 'Communication scheduled successfully' : 'Communication created and ready to send'
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('POST communications error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to create communication' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};


