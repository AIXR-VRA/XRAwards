/**
 * Contacts API Endpoint
 * GET /api/contacts - List all contacts (with optional filters)
 * POST /api/contacts - Create a contact
 * PUT /api/contacts - Update a contact
 * DELETE /api/contacts - Delete a contact
 */

import type { APIRoute } from 'astro';
import { requireApiAuth, createSecureSupabaseClient } from '../../utils/supabase';

// GET - List all contacts with optional filters
export const GET: APIRoute = async ({ url, cookies, request }) => {
  try {
    // Require authentication for contacts
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
    const contactType = searchParams.get('contact_type') || '';
    const judgeId = searchParams.get('judge_id') || '';
    const finalistId = searchParams.get('finalist_id') || '';
    const search = searchParams.get('search') || '';

    // Build the query
    let query = supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (contactType) {
      query = query.eq('contact_type', contactType);
    }

    if (judgeId) {
      query = query.eq('judge_id', judgeId);
    }

    if (finalistId) {
      query = query.eq('finalist_id', finalistId);
    }

    // Apply search filter
    if (search) {
      query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,organization.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;

    return new Response(
      JSON.stringify({ contacts: data || [] }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('GET contacts error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to fetch contacts' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// POST - Create a contact
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
      contact_type, 
      email, 
      first_name, 
      last_name, 
      organization, 
      judge_id, 
      finalist_id, 
      sponsor_id, 
      attendee_id,
      metadata,
      is_active 
    } = body;

    if (!contact_type || !email) {
      return new Response(
        JSON.stringify({ error: 'Contact type and email are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate contact type constraints
    if (contact_type === 'judge' && !judge_id) {
      return new Response(
        JSON.stringify({ error: 'judge_id is required for judge contacts' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (contact_type === 'finalist' && !finalist_id) {
      return new Response(
        JSON.stringify({ error: 'finalist_id is required for finalist contacts' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (contact_type === 'sponsor' && !sponsor_id) {
      return new Response(
        JSON.stringify({ error: 'sponsor_id is required for sponsor contacts' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (contact_type === 'attendee' && !attendee_id) {
      return new Response(
        JSON.stringify({ error: 'attendee_id is required for attendee contacts' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate unsubscribe token if not provided
    const unsubscribeToken = body.unsubscribe_token || crypto.randomUUID();

    const { data, error } = await supabase
      .from('contacts')
      .insert({
        contact_type,
        email,
        first_name,
        last_name,
        organization,
        judge_id: contact_type === 'judge' ? judge_id : null,
        finalist_id: contact_type === 'finalist' ? finalist_id : null,
        sponsor_id: contact_type === 'sponsor' ? sponsor_id : null,
        attendee_id: contact_type === 'attendee' ? attendee_id : null,
        metadata: metadata || {},
        is_active: is_active !== undefined ? is_active : true,
        unsubscribe_token: unsubscribeToken
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ contact: data, message: 'Contact created successfully' }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('POST contacts error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to create contact' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// PUT - Update a contact
export const PUT: APIRoute = async ({ request, cookies }) => {
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
      id,
      email, 
      first_name, 
      last_name, 
      organization, 
      metadata,
      is_active,
      email_verified
    } = body;

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const updateData: any = {};
    if (email !== undefined) updateData.email = email;
    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (organization !== undefined) updateData.organization = organization;
    if (metadata !== undefined) updateData.metadata = metadata;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (email_verified !== undefined) updateData.email_verified = email_verified;

    const { data, error } = await supabase
      .from('contacts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ contact: data, message: 'Contact updated successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('PUT contacts error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to update contact' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// DELETE - Delete a contact
export const DELETE: APIRoute = async ({ request, cookies }) => {
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
    const { id } = body;

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return new Response(
      JSON.stringify({ message: 'Contact deleted successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('DELETE contacts error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to delete contact' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

