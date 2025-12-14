/**
 * Contacts API Endpoint
 * GET /api/contacts - List contacts (filtered by judge_id, finalist_id, etc.)
 * POST /api/contacts - Create a contact
 * PUT /api/contacts - Update a contact
 * DELETE /api/contacts - Delete a contact
 */

import type { APIRoute } from 'astro';
import { requireApiAuth, createSecureSupabaseClient } from '../../utils/supabase';

// GET - List contacts with optional filters
export const GET: APIRoute = async ({ url, cookies, request }) => {
  try {
    // GET requires authentication for contacts
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
    const judgeId = searchParams.get('judge_id');
    const finalistId = searchParams.get('finalist_id');
    const sponsorId = searchParams.get('sponsor_id');
    const contactType = searchParams.get('contact_type');

    // Build the query
    let query = supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (judgeId) {
      query = query.eq('judge_id', judgeId);
    }
    
    if (finalistId) {
      query = query.eq('finalist_id', finalistId);
    }
    
    if (sponsorId) {
      query = query.eq('sponsor_id', sponsorId);
    }
    
    if (contactType) {
      query = query.eq('contact_type', contactType);
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
    const { 
      email, 
      first_name, 
      last_name, 
      organization, 
      contact_type, 
      judge_id, 
      finalist_id, 
      sponsor_id, 
      attendee_id,
      is_active 
    } = body;

    // Validate required fields
    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!contact_type) {
      return new Response(
        JSON.stringify({ error: 'Contact type is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate contact_type-specific requirements
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

    // Build insert data
    const insertData: any = {
      email,
      contact_type,
      first_name: first_name || null,
      last_name: last_name || null,
      organization: organization || null,
      is_active: is_active !== undefined ? is_active : true,
    };

    // Set the appropriate ID based on contact_type
    if (contact_type === 'judge') {
      insertData.judge_id = judge_id;
      insertData.finalist_id = null;
      insertData.sponsor_id = null;
      insertData.attendee_id = null;
    } else if (contact_type === 'finalist') {
      insertData.finalist_id = finalist_id;
      insertData.judge_id = null;
      insertData.sponsor_id = null;
      insertData.attendee_id = null;
    } else if (contact_type === 'sponsor') {
      insertData.sponsor_id = sponsor_id;
      insertData.judge_id = null;
      insertData.finalist_id = null;
      insertData.attendee_id = null;
    } else if (contact_type === 'attendee') {
      insertData.attendee_id = attendee_id;
      insertData.judge_id = null;
      insertData.finalist_id = null;
      insertData.sponsor_id = null;
    }

    const { data, error } = await supabase
      .from('contacts')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ contact: data }),
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
    const { id, email, first_name, last_name, organization, is_active } = body;

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Contact ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build update data
    const updateData: any = {};
    
    if (email !== undefined) updateData.email = email;
    if (first_name !== undefined) updateData.first_name = first_name || null;
    if (last_name !== undefined) updateData.last_name = last_name || null;
    if (organization !== undefined) updateData.organization = organization || null;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data, error } = await supabase
      .from('contacts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return new Response(
        JSON.stringify({ error: 'Contact not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ contact: data }),
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
        JSON.stringify({ error: 'Contact ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true }),
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
