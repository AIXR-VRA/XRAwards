/**
 * Communication Detail API Endpoint
 * GET /api/communications/[id] - Get single communication with recipients and stats
 * PUT /api/communications/[id] - Update a scheduled communication
 * DELETE /api/communications/[id] - Cancel/delete a communication
 */

import type { APIRoute } from 'astro';
import { requireApiAuth } from '../../../utils/supabase';

// Helper to aggregate clicked URLs across all recipients
function getClickedUrlsSummary(recipients: any[]): { url: string; clicks: number }[] {
  const urlCounts: Record<string, number> = {};
  
  recipients.forEach(r => {
    const clickData = r.click_data as { clicks?: { url: string }[] } | null;
    if (clickData?.clicks) {
      clickData.clicks.forEach(click => {
        if (click.url) {
          urlCounts[click.url] = (urlCounts[click.url] || 0) + 1;
        }
      });
    }
  });
  
  return Object.entries(urlCounts)
    .map(([url, clicks]) => ({ url, clicks }))
    .sort((a, b) => b.clicks - a.clicks);
}

// GET - Get single communication with recipients and stats
export const GET: APIRoute = async ({ params, cookies, request }) => {
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

    const { id } = params;

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Communication ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get communication with sender info
    const { data: communication, error: commError } = await supabase
      .from('communications')
      .select(`
        *,
        user_profiles!sent_by (
          id,
          first_name,
          last_name,
          profile_photo_url,
          job_title
        )
      `)
      .eq('id', id)
      .single();

    if (commError) {
      if (commError.code === 'PGRST116') {
        return new Response(
          JSON.stringify({ error: 'Communication not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
      throw commError;
    }

    // Get recipients with contact info
    const { data: recipients, error: recipientsError } = await supabase
      .from('communication_recipients')
      .select(`
        id,
        status,
        resend_email_id,
        error_message,
        sent_at,
        delivered_at,
        opened_at,
        clicked_at,
        open_count,
        click_data,
        created_at,
        contacts!contact_id (
          id,
          email,
          first_name,
          last_name,
          organization,
          contact_type,
          is_active
        )
      `)
      .eq('communication_id', id)
      .order('created_at', { ascending: true });

    if (recipientsError) throw recipientsError;

    // Calculate detailed stats
    const stats = {
      total: recipients?.length || 0,
      pending: 0,
      sent: 0,
      delivered: 0,
      bounced: 0,
      failed: 0,
      opened: 0,        // unique recipients who opened
      clicked: 0,       // unique recipients who clicked
      totalOpens: 0,    // total open events
      totalClicks: 0    // total click events
    };

    recipients?.forEach(r => {
      switch (r.status) {
        case 'pending': stats.pending++; break;
        case 'sent': stats.sent++; break;
        case 'delivered': stats.delivered++; break;
        case 'bounced': stats.bounced++; break;
        case 'failed': stats.failed++; break;
      }
      if (r.opened_at) {
        stats.opened++;
        stats.totalOpens += r.open_count || 1;
      }
      if (r.clicked_at) {
        stats.clicked++;
        const clickData = r.click_data as { click_count?: number } | null;
        stats.totalClicks += clickData?.click_count || 1;
      }
    });

    // Calculate rates based on delivered/sent emails
    const deliveredOrSent = stats.delivered + stats.sent;
    const openRate = deliveredOrSent > 0 ? Math.round((stats.opened / deliveredOrSent) * 100) : 0;
    const clickRate = stats.opened > 0 ? Math.round((stats.clicked / stats.opened) * 100) : 0;

    return new Response(
      JSON.stringify({
        communication,
        recipients: recipients || [],
        stats: {
          ...stats,
          openRate,
          clickRate,
          // Include click URLs summary
          clickedUrls: getClickedUrlsSummary(recipients || [])
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('GET communication error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to fetch communication' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// PUT - Update a scheduled communication
export const PUT: APIRoute = async ({ params, request, cookies }) => {
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

    const { id } = params;

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Communication ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get existing communication to check status
    const { data: existing, error: existingError } = await supabase
      .from('communications')
      .select('status')
      .eq('id', id)
      .single();

    if (existingError) {
      if (existingError.code === 'PGRST116') {
        return new Response(
          JSON.stringify({ error: 'Communication not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
      throw existingError;
    }

    // Only allow editing scheduled or pending communications
    if (!['scheduled', 'pending'].includes(existing.status)) {
      return new Response(
        JSON.stringify({ error: 'Only scheduled or pending communications can be edited' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const {
      subject,
      message_content,
      html_content,
      scheduled_at,
      status
    } = body;

    // Build update object
    const updates: Record<string, any> = {};
    if (subject !== undefined) updates.subject = subject;
    if (message_content !== undefined) updates.message_content = message_content;
    if (html_content !== undefined) updates.html_content = html_content;
    if (scheduled_at !== undefined) updates.scheduled_at = scheduled_at;
    if (status !== undefined) {
      // Only allow certain status transitions
      if (['pending', 'scheduled', 'draft'].includes(status)) {
        updates.status = status;
      }
    }

    if (Object.keys(updates).length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid fields to update' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update communication
    const { data: communication, error: updateError } = await supabase
      .from('communications')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({
        communication,
        message: 'Communication updated successfully'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('PUT communication error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to update communication' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// DELETE - Cancel/delete a communication
export const DELETE: APIRoute = async ({ params, cookies, request }) => {
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

    const { id } = params;

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Communication ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get existing communication to check status
    const { data: existing, error: existingError } = await supabase
      .from('communications')
      .select('status')
      .eq('id', id)
      .single();

    if (existingError) {
      if (existingError.code === 'PGRST116') {
        return new Response(
          JSON.stringify({ error: 'Communication not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
      throw existingError;
    }

    // Only allow deleting scheduled or pending communications
    if (!['scheduled', 'pending'].includes(existing.status)) {
      return new Response(
        JSON.stringify({ error: 'Only scheduled or pending communications can be cancelled' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Delete communication (recipients will cascade delete)
    const { error: deleteError } = await supabase
      .from('communications')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    return new Response(
      JSON.stringify({ message: 'Communication cancelled and deleted successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('DELETE communication error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to delete communication' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

