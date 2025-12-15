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
    const search = searchParams.get('search');

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

    // Apply search filter (search in email, first_name, last_name, organization)
    if (search) {
      query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,organization.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;

    let contacts = data || [];

    // Filter by judge_id using junction table
    if (judgeId) {
      contacts = contacts.filter((c: any) => 
        c.contact_judges?.some((cj: any) => cj.judge_id === judgeId)
      );
    }
    
    // Filter by finalist_id using junction table
    if (finalistId) {
      contacts = contacts.filter((c: any) => 
        c.contact_finalists?.some((cf: any) => cf.finalist_id === finalistId)
      );
    }
    
    // Filter by sponsor_id using junction table
    if (sponsorId) {
      contacts = contacts.filter((c: any) => 
        c.contact_sponsors?.some((cs: any) => cs.sponsor_id === sponsorId)
      );
    }

    // Transform to include flattened relationships
    const transformedContacts = contacts.map((c: any) => ({
      ...c,
      finalists: c.contact_finalists?.map((cf: any) => cf.finalists).filter(Boolean) || [],
      judges: c.contact_judges?.map((cj: any) => cj.judges).filter(Boolean) || [],
      sponsors: c.contact_sponsors?.map((cs: any) => cs.sponsors).filter(Boolean) || [],
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

    // Note: With junction tables, contacts can be linked to multiple entities
    // Relationships are optional - contacts can exist without any associations

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
    const { 
      id, 
      email, 
      first_name, 
      last_name, 
      organization, 
      job_title, 
      phone_number, 
      is_active,
      // Association management
      add_finalist_ids,
      remove_finalist_ids,
      add_judge_ids,
      remove_judge_ids,
      add_sponsor_ids,
      remove_sponsor_ids
    } = body;

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Contact ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build update data for contact fields
    const updateData: any = {};
    
    if (email !== undefined) updateData.email = email;
    if (first_name !== undefined) updateData.first_name = first_name || null;
    if (last_name !== undefined) updateData.last_name = last_name || null;
    if (organization !== undefined) updateData.organization = organization || null;
    if (job_title !== undefined) updateData.job_title = job_title || null;
    if (phone_number !== undefined) updateData.phone_number = phone_number || null;
    if (is_active !== undefined) updateData.is_active = is_active;

    // Update contact if there are fields to update
    let data;
    if (Object.keys(updateData).length > 0) {
      const result = await supabase
        .from('contacts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (result.error) throw result.error;
      data = result.data;
    } else {
      // Just fetch the contact if no fields to update
      const result = await supabase
        .from('contacts')
        .select()
        .eq('id', id)
        .single();
      
      if (result.error) throw result.error;
      data = result.data;
    }

    if (!data) {
      return new Response(
        JSON.stringify({ error: 'Contact not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Handle association removals
    if (remove_finalist_ids && remove_finalist_ids.length > 0) {
      const { error: removeFinalistError } = await supabase
        .from('contact_finalists')
        .delete()
        .eq('contact_id', id)
        .in('finalist_id', remove_finalist_ids);
      if (removeFinalistError) console.error('Error removing finalist associations:', removeFinalistError);
    }

    if (remove_judge_ids && remove_judge_ids.length > 0) {
      const { error: removeJudgeError } = await supabase
        .from('contact_judges')
        .delete()
        .eq('contact_id', id)
        .in('judge_id', remove_judge_ids);
      if (removeJudgeError) console.error('Error removing judge associations:', removeJudgeError);
    }

    if (remove_sponsor_ids && remove_sponsor_ids.length > 0) {
      const { error: removeSponsorError } = await supabase
        .from('contact_sponsors')
        .delete()
        .eq('contact_id', id)
        .in('sponsor_id', remove_sponsor_ids);
      if (removeSponsorError) console.error('Error removing sponsor associations:', removeSponsorError);
    }

    // Handle association additions
    if (add_finalist_ids && add_finalist_ids.length > 0) {
      const finalistInserts = add_finalist_ids.map((fId: string) => ({
        contact_id: id,
        finalist_id: fId,
      }));
      const { error: addFinalistError } = await supabase
        .from('contact_finalists')
        .upsert(finalistInserts, { onConflict: 'contact_id,finalist_id' });
      if (addFinalistError) console.error('Error adding finalist associations:', addFinalistError);
    }

    if (add_judge_ids && add_judge_ids.length > 0) {
      const judgeInserts = add_judge_ids.map((jId: string) => ({
        contact_id: id,
        judge_id: jId,
      }));
      const { error: addJudgeError } = await supabase
        .from('contact_judges')
        .upsert(judgeInserts, { onConflict: 'contact_id,judge_id' });
      if (addJudgeError) console.error('Error adding judge associations:', addJudgeError);
    }

    if (add_sponsor_ids && add_sponsor_ids.length > 0) {
      const sponsorInserts = add_sponsor_ids.map((sId: string) => ({
        contact_id: id,
        sponsor_id: sId,
      }));
      const { error: addSponsorError } = await supabase
        .from('contact_sponsors')
        .upsert(sponsorInserts, { onConflict: 'contact_id,sponsor_id' });
      if (addSponsorError) console.error('Error adding sponsor associations:', addSponsorError);
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
