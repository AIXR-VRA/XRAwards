import type { APIRoute } from 'astro';
import { requireApiAuth } from '../../utils/supabase';

/**
 * API endpoint for managing event details
 * GET    - Retrieve all events
 * POST   - Create new event
 * PUT    - Update existing event
 * DELETE - Delete event
 */

export const GET: APIRoute = async ({ cookies }) => {
  // GET doesn't require authentication for public data
  const { createSecureSupabaseClient } = await import('../../utils/supabase');
  const supabase = createSecureSupabaseClient(cookies);

  try {
    const { data: events, error } = await supabase
      .from('event_details')
      .select('*')
      .order('event_year', { ascending: false });

    if (error) throw error;

    return new Response(JSON.stringify({ events }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to fetch events' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  // Secure authentication check
  const authResult = await requireApiAuth(cookies, request);
  
  if (!authResult.authenticated) {
    return new Response(JSON.stringify({ error: authResult.error }), {
      status: authResult.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  const supabase = authResult.supabase;
  if (!supabase) {
    return new Response(JSON.stringify({ error: 'Authentication failed' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();

    // Helper function to convert datetime-local strings to UTC
    const toUTC = (dateTimeStr: string | null): string | null => {
      if (!dateTimeStr) return null;
      // datetime-local inputs are in local timezone, convert to UTC
      const localDate = new Date(dateTimeStr);
      return localDate.toISOString();
    };

    const eventData = {
      event_name: body.event_name,
      event_year: body.event_year,
      slug: body.slug,
      location: body.location,
      venue_address: body.venue_address,
      organizer_name: body.organizer_name,
      description: body.description,
      nominations_open: toUTC(body.nominations_open),
      nominations_close: toUTC(body.nominations_close),
      finalists_announced: toUTC(body.finalists_announced),
      judging_period_start: toUTC(body.judging_period_start),
      judging_period_end: toUTC(body.judging_period_end),
      awards_ceremony: toUTC(body.awards_ceremony),
      nomination_portal_url: body.nomination_portal_url,
      tickets_portal_url: body.tickets_portal_url,
      is_active: body.is_active || false,
      
      // Hero & Video fields
      hero_image: body.hero_image,
      highlight_video: body.highlight_video,
      highlight_video_cover_image: body.highlight_video_cover_image,
      
      // Blurb fields
      finalists_winners_blurb: body.finalists_winners_blurb,
      highlight_blurb_1: body.highlight_blurb_1,
      highlight_blurb_2: body.highlight_blurb_2,
      entertainment_blurb: body.entertainment_blurb,
      
      // Menu blurb fields
      menu_blurb_starter: body.menu_blurb_starter,
      menu_blurb_main: body.menu_blurb_main,
      menu_blurb_dessert: body.menu_blurb_dessert,
      
      // Array fields
      highlight_images: body.highlight_images || [],
      entertainment_images: body.entertainment_images || [],
      menu_images: body.menu_images || [],
    };

    const { data, error } = await supabase
      .from('event_details')
      .insert(eventData)
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ event: data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to create event' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

export const PUT: APIRoute = async ({ request, cookies }) => {
  // Secure authentication check
  const authResult = await requireApiAuth(cookies, request);
  
  if (!authResult.authenticated) {
    return new Response(JSON.stringify({ error: authResult.error }), {
      status: authResult.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  const supabase = authResult.supabase;
  if (!supabase) {
    return new Response(JSON.stringify({ error: 'Authentication failed' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { id, ...eventData } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: 'Event ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Helper function to convert datetime-local strings to UTC
    const toUTC = (dateTimeStr: string | null): string | null => {
      if (!dateTimeStr) return null;
      // datetime-local inputs are in local timezone, convert to UTC
      const localDate = new Date(dateTimeStr);
      return localDate.toISOString();
    };

    const updateData = {
      event_name: eventData.event_name,
      event_year: eventData.event_year,
      slug: eventData.slug,
      location: eventData.location,
      venue_address: eventData.venue_address,
      organizer_name: eventData.organizer_name,
      description: eventData.description,
      nominations_open: toUTC(eventData.nominations_open),
      nominations_close: toUTC(eventData.nominations_close),
      finalists_announced: toUTC(eventData.finalists_announced),
      judging_period_start: toUTC(eventData.judging_period_start),
      judging_period_end: toUTC(eventData.judging_period_end),
      awards_ceremony: toUTC(eventData.awards_ceremony),
      nomination_portal_url: eventData.nomination_portal_url,
      tickets_portal_url: eventData.tickets_portal_url,
      is_active: eventData.is_active || false,
      
      // Hero & Video fields
      hero_image: eventData.hero_image,
      highlight_video: eventData.highlight_video,
      highlight_video_cover_image: eventData.highlight_video_cover_image,
      
      // Blurb fields
      finalists_winners_blurb: eventData.finalists_winners_blurb,
      highlight_blurb_1: eventData.highlight_blurb_1,
      highlight_blurb_2: eventData.highlight_blurb_2,
      entertainment_blurb: eventData.entertainment_blurb,
      
      // Menu blurb fields
      menu_blurb_starter: eventData.menu_blurb_starter,
      menu_blurb_main: eventData.menu_blurb_main,
      menu_blurb_dessert: eventData.menu_blurb_dessert,
      
      // Array fields
      highlight_images: eventData.highlight_images || [],
      entertainment_images: eventData.entertainment_images || [],
      menu_images: eventData.menu_images || [],
    };

    const { data, error } = await supabase
      .from('event_details')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ event: data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to update event' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
  // Secure authentication check
  const authResult = await requireApiAuth(cookies, request);
  
  if (!authResult.authenticated) {
    return new Response(JSON.stringify({ error: authResult.error }), {
      status: authResult.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  const supabase = authResult.supabase;
  if (!supabase) {
    return new Response(JSON.stringify({ error: 'Authentication failed' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { id } = await request.json();

    if (!id) {
      return new Response(JSON.stringify({ error: 'Event ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { error } = await supabase
      .from('event_details')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to delete event' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
