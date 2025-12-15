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

    // Build the query with junction table relationships
    let query = supabase
      .from('contacts')
      .select(`
        *,
        contact_finalists (
          finalist_id,
          finalists (id, title, organization)
        ),
        contact_judges (
          judge_id,
          judges (id, first_name, last_name, organization)
        ),
        contact_sponsors (
          sponsor_id,
          sponsors (id, name)
        )
      `)
      .order('created_at', { ascending: false });

    // Apply contact_type filter
    if (contactType) {
      query = query.eq('contact_type', contactType);
    }

    const { data, error } = await query;

    if (error) throw error;

    let contacts = data || [];

    // Filter by judge_id using junction table
    if (judgeId) {
      contacts = contacts.filter((c: any) => 
        c.contact_judges?.some((cj: any) => cj.judge_id === judgeId) ||
        c.judge_id === judgeId // Legacy support
      );
    }
    
    // Filter by finalist_id using junction table
    if (finalistId) {
      contacts = contacts.filter((c: any) => 
        c.contact_finalists?.some((cf: any) => cf.finalist_id === finalistId) ||
        c.finalist_id === finalistId // Legacy support
      );
    }
    
    // Filter by sponsor_id using junction table
    if (sponsorId) {
      contacts = contacts.filter((c: any) => 
        c.contact_sponsors?.some((cs: any) => cs.sponsor_id === sponsorId) ||
        c.sponsor_id === sponsorId // Legacy support
      );
    }

    // Transform to include flattened relationships
    const transformedContacts = contacts.map((c: any) => ({
      ...c,
      finalists: c.contact_finalists?.map((cf: any) => cf.finalists) || [],
      judges: c.contact_judges?.map((cj: any) => cj.judges) || [],
      sponsors: c.contact_sponsors?.map((cs: any) => cs.sponsors) || [],
    }));

    return new Response(
      JSON.stringify({ contacts: transformedContacts }),
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
      job_title,
      phone_number,
      contact_type, 
      judge_id,
      judge_ids, // Support multiple judges
      finalist_id, 
      finalist_ids, // Support multiple finalists
      sponsor_id, 
      sponsor_ids, // Support multiple sponsors
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

    // Validate contact_type-specific requirements (at least one relationship required except for general)
    const hasJudge = judge_id || (judge_ids && judge_ids.length > 0);
    const hasFinalist = finalist_id || (finalist_ids && finalist_ids.length > 0);
    const hasSponsor = sponsor_id || (sponsor_ids && sponsor_ids.length > 0);

    if (contact_type === 'judge' && !hasJudge) {
      return new Response(
        JSON.stringify({ error: 'At least one judge is required for judge contacts' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (contact_type === 'finalist' && !hasFinalist) {
      return new Response(
        JSON.stringify({ error: 'At least one finalist is required for finalist contacts' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (contact_type === 'sponsor' && !hasSponsor) {
      return new Response(
        JSON.stringify({ error: 'At least one sponsor is required for sponsor contacts' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build insert data (no longer setting direct FK columns)
    const insertData: any = {
      email,
      contact_type,
      first_name: first_name || null,
      last_name: last_name || null,
      organization: organization || null,
      job_title: job_title || null,
      phone_number: phone_number || null,
      is_active: is_active !== undefined ? is_active : true,
    };

    const { data, error } = await supabase
      .from('contacts')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    // Create junction table entries
    const contactId = data.id;

    // Add judge relationships
    const judgeIdsToAdd = judge_ids || (judge_id ? [judge_id] : []);
    if (judgeIdsToAdd.length > 0) {
      const judgeInserts = judgeIdsToAdd.map((jId: string) => ({
        contact_id: contactId,
        judge_id: jId,
      }));
      const { error: judgeError } = await supabase
        .from('contact_judges')
        .insert(judgeInserts);
      if (judgeError) console.error('Error adding judge relationships:', judgeError);
    }

    // Add finalist relationships
    const finalistIdsToAdd = finalist_ids || (finalist_id ? [finalist_id] : []);
    if (finalistIdsToAdd.length > 0) {
      const finalistInserts = finalistIdsToAdd.map((fId: string) => ({
        contact_id: contactId,
        finalist_id: fId,
      }));
      const { error: finalistError } = await supabase
        .from('contact_finalists')
        .insert(finalistInserts);
      if (finalistError) console.error('Error adding finalist relationships:', finalistError);
    }

    // Add sponsor relationships
    const sponsorIdsToAdd = sponsor_ids || (sponsor_id ? [sponsor_id] : []);
    if (sponsorIdsToAdd.length > 0) {
      const sponsorInserts = sponsorIdsToAdd.map((sId: string) => ({
        contact_id: contactId,
        sponsor_id: sId,
      }));
      const { error: sponsorError } = await supabase
        .from('contact_sponsors')
        .insert(sponsorInserts);
      if (sponsorError) console.error('Error adding sponsor relationships:', sponsorError);
    }

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
    const { id, email, first_name, last_name, organization, job_title, phone_number, is_active } = body;

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
    if (job_title !== undefined) updateData.job_title = job_title || null;
    if (phone_number !== undefined) updateData.phone_number = phone_number || null;
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
