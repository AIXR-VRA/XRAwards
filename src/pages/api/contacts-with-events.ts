/**
 * Contacts with Events API Endpoint
 * GET /api/contacts-with-events - List contacts with event filtering for recipient selection
 * 
 * This endpoint supports filtering contacts by:
 * - event_id: Filter by specific event year
 * - contact_type: Filter by judge, finalist, sponsor, attendee
 * - is_winner: For finalists, filter by winner status
 * - is_active: Filter by active status
 * 
 * Returns contacts joined with their related judge/finalist/sponsor data and event info
 */

import type { APIRoute } from 'astro';
import { requireApiAuth } from '../../utils/supabase';

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
    const eventId = searchParams.get('event_id');
    const contactType = searchParams.get('contact_type');
    const isWinner = searchParams.get('is_winner');
    const isActive = searchParams.get('is_active');

    // Build response based on filters
    let allContacts: any[] = [];

    // If filtering by event, we need to get contacts through their relationships
    if (eventId) {
      // Get judge contacts for this event
      if (!contactType || contactType === 'judge') {
        const { data: judgeContacts, error: judgeError } = await supabase
          .from('contacts')
          .select(`
            *,
            judges!inner (
              id,
              first_name,
              last_name,
              organization,
              profile_image_url,
              judge_events!inner (
                event_id,
                event_details (
                  id,
                  event_name,
                  event_year
                )
              )
            )
          `)
          .eq('contact_type', 'judge')
          .not('judge_id', 'is', null);

        if (judgeError) {
          console.error('Error fetching judge contacts:', judgeError);
        } else if (judgeContacts) {
          // Filter by event_id
          const filtered = judgeContacts.filter((c: any) => 
            c.judges?.judge_events?.some((je: any) => je.event_id === eventId)
          );
          // Transform to include event info
          allContacts.push(...filtered.map((c: any) => ({
            ...c,
            event_info: c.judges?.judge_events?.find((je: any) => je.event_id === eventId)?.event_details,
            related_name: c.judges ? `${c.judges.first_name} ${c.judges.last_name}` : null,
            related_org: c.judges?.organization,
            related_image: c.judges?.profile_image_url
          })));
        }
      }

      // Get finalist contacts for this event
      if (!contactType || contactType === 'finalist') {
        let finalistQuery = supabase
          .from('contacts')
          .select(`
            *,
            finalists!inner (
              id,
              title,
              organization,
              image_url,
              is_winner,
              event_id,
              event_details (
                id,
                event_name,
                event_year
              )
            )
          `)
          .eq('contact_type', 'finalist')
          .not('finalist_id', 'is', null)
          .eq('finalists.event_id', eventId);

        // Apply winner filter if specified
        if (isWinner === 'true') {
          finalistQuery = finalistQuery.eq('finalists.is_winner', true);
        } else if (isWinner === 'false') {
          finalistQuery = finalistQuery.eq('finalists.is_winner', false);
        }

        const { data: finalistContacts, error: finalistError } = await finalistQuery;

        if (finalistError) {
          console.error('Error fetching finalist contacts:', finalistError);
        } else if (finalistContacts) {
          allContacts.push(...finalistContacts.map((c: any) => ({
            ...c,
            event_info: c.finalists?.event_details,
            related_name: c.finalists?.title,
            related_org: c.finalists?.organization,
            related_image: c.finalists?.image_url,
            is_winner: c.finalists?.is_winner
          })));
        }
      }

      // Get sponsor contacts for this event (sponsors may have event relationships)
      if (!contactType || contactType === 'sponsor') {
        const { data: sponsorContacts, error: sponsorError } = await supabase
          .from('contacts')
          .select(`
            *,
            sponsors!inner (
              id,
              name,
              logo_url,
              sponsor_events (
                event_id,
                event_details (
                  id,
                  event_name,
                  event_year
                )
              )
            )
          `)
          .eq('contact_type', 'sponsor')
          .not('sponsor_id', 'is', null);

        if (sponsorError) {
          console.error('Error fetching sponsor contacts:', sponsorError);
        } else if (sponsorContacts) {
          // Filter by event_id if sponsors have event relationships
          const filtered = sponsorContacts.filter((c: any) => 
            c.sponsors?.sponsor_events?.some((se: any) => se.event_id === eventId)
          );
          allContacts.push(...filtered.map((c: any) => ({
            ...c,
            event_info: c.sponsors?.sponsor_events?.find((se: any) => se.event_id === eventId)?.event_details,
            related_name: c.sponsors?.name,
            related_image: c.sponsors?.logo_url
          })));
        }
      }
    } else {
      // No event filter - get all contacts with their relationships
      let query = supabase
        .from('contacts')
        .select(`
          *,
          judges (
            id,
            first_name,
            last_name,
            organization,
            profile_image_url
          ),
          finalists (
            id,
            title,
            organization,
            image_url,
            is_winner,
            event_details (
              id,
              event_name,
              event_year
            )
          ),
          sponsors (
            id,
            name,
            logo_url
          )
        `)
        .order('created_at', { ascending: false });

      // Apply contact type filter
      if (contactType) {
        query = query.eq('contact_type', contactType);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform data
      allContacts = (data || []).map((c: any) => {
        let relatedName = null;
        let relatedOrg = null;
        let relatedImage = null;
        let eventInfo = null;
        let winner = null;

        if (c.contact_type === 'judge' && c.judges) {
          relatedName = `${c.judges.first_name} ${c.judges.last_name}`;
          relatedOrg = c.judges.organization;
          relatedImage = c.judges.profile_image_url;
        } else if (c.contact_type === 'finalist' && c.finalists) {
          relatedName = c.finalists.title;
          relatedOrg = c.finalists.organization;
          relatedImage = c.finalists.image_url;
          eventInfo = c.finalists.event_details;
          winner = c.finalists.is_winner;
        } else if (c.contact_type === 'sponsor' && c.sponsors) {
          relatedName = c.sponsors.name;
          relatedImage = c.sponsors.logo_url;
        }

        return {
          ...c,
          related_name: relatedName,
          related_org: relatedOrg,
          related_image: relatedImage,
          event_info: eventInfo,
          is_winner: winner
        };
      });

      // Apply winner filter if specified (for finalists without event filter)
      if (isWinner === 'true') {
        allContacts = allContacts.filter(c => c.contact_type !== 'finalist' || c.is_winner === true);
      } else if (isWinner === 'false') {
        allContacts = allContacts.filter(c => c.contact_type !== 'finalist' || c.is_winner === false);
      }
    }

    // Apply active filter
    if (isActive === 'true') {
      allContacts = allContacts.filter(c => c.is_active === true);
    } else if (isActive === 'false') {
      allContacts = allContacts.filter(c => c.is_active === false);
    }

    // Remove duplicate contacts (same id)
    const uniqueContacts = allContacts.reduce((acc: any[], c: any) => {
      if (!acc.find(existing => existing.id === c.id)) {
        acc.push(c);
      }
      return acc;
    }, []);

    return new Response(
      JSON.stringify({
        contacts: uniqueContacts,
        total: uniqueContacts.length
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('GET contacts-with-events error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to fetch contacts' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

