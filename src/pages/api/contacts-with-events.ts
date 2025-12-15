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

    // If filtering by event, we need to get contacts through their relationships (using junction tables)
    if (eventId) {
      // Get judge contacts for this event via contact_judges junction table
      if (!contactType || contactType === 'judge') {
        const { data: judgeContacts, error: judgeError } = await supabase
          .from('contacts')
          .select(`
            *,
            contact_judges!inner (
              judge_id,
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
            )
          `)
          .eq('contact_type', 'judge');

        if (judgeError) {
          console.error('Error fetching judge contacts:', judgeError);
        } else if (judgeContacts) {
          // Filter by event_id through the nested relationships
          const contactsWithEvents = judgeContacts.filter((c: any) =>
            c.contact_judges?.some((cj: any) =>
              cj.judges?.judge_events?.some((je: any) => je.event_id === eventId)
            )
          );
          // Transform to include event info
          allContacts.push(...contactsWithEvents.map((c: any) => {
            const judge = c.contact_judges?.[0]?.judges;
            const eventInfo = judge?.judge_events?.find((je: any) => je.event_id === eventId)?.event_details;
            return {
              ...c,
              event_info: eventInfo,
              related_name: judge ? `${judge.first_name} ${judge.last_name}` : null,
              related_org: judge?.organization,
              related_image: judge?.profile_image_url
            };
          }));
        }
      }

      // Get finalist contacts for this event via contact_finalists junction table
      if (!contactType || contactType === 'finalist') {
        const { data: finalistContacts, error: finalistError } = await supabase
          .from('contacts')
          .select(`
            *,
            contact_finalists!inner (
              finalist_id,
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
            )
          `)
          .eq('contact_type', 'finalist');

        if (finalistError) {
          console.error('Error fetching finalist contacts:', finalistError);
        } else if (finalistContacts) {
          // Filter by event_id and optionally by winner status
          const filtered = finalistContacts.filter((c: any) =>
            c.contact_finalists?.some((cf: any) => {
              const matchesEvent = cf.finalists?.event_id === eventId;
              const matchesWinner = isWinner === 'true' ? cf.finalists?.is_winner === true :
                                   isWinner === 'false' ? cf.finalists?.is_winner === false : true;
              return matchesEvent && matchesWinner;
            })
          );
          allContacts.push(...filtered.map((c: any) => {
            const finalist = c.contact_finalists?.find((cf: any) => cf.finalists?.event_id === eventId)?.finalists;
            return {
              ...c,
              event_info: finalist?.event_details,
              related_name: finalist?.title,
              related_org: finalist?.organization,
              related_image: finalist?.image_url,
              is_winner: finalist?.is_winner
            };
          }));
        }
      }

      // Get sponsor contacts for this event via contact_sponsors junction table
      if (!contactType || contactType === 'sponsor') {
        const { data: sponsorContacts, error: sponsorError } = await supabase
          .from('contacts')
          .select(`
            *,
            contact_sponsors!inner (
              sponsor_id,
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
            )
          `)
          .eq('contact_type', 'sponsor');

        if (sponsorError) {
          console.error('Error fetching sponsor contacts:', sponsorError);
        } else if (sponsorContacts) {
          // Filter by event_id if sponsors have event relationships
          const filtered = sponsorContacts.filter((c: any) =>
            c.contact_sponsors?.some((cs: any) =>
              cs.sponsors?.sponsor_events?.some((se: any) => se.event_id === eventId)
            )
          );
          allContacts.push(...filtered.map((c: any) => {
            const sponsor = c.contact_sponsors?.[0]?.sponsors;
            const eventInfo = sponsor?.sponsor_events?.find((se: any) => se.event_id === eventId)?.event_details;
            return {
              ...c,
              event_info: eventInfo,
              related_name: sponsor?.name,
              related_image: sponsor?.logo_url
            };
          }));
        }
      }
    } else {
      // No event filter - get all contacts with their relationships via junction tables
      let query = supabase
        .from('contacts')
        .select(`
          *,
          contact_judges (
            judge_id,
            judges (
              id,
              first_name,
              last_name,
              organization,
              profile_image_url
            )
          ),
          contact_finalists (
            finalist_id,
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
            )
          ),
          contact_sponsors (
            sponsor_id,
            sponsors (
              id,
              name,
              logo_url
            )
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

        if (c.contact_type === 'judge' && c.contact_judges?.length > 0) {
          const judge = c.contact_judges[0]?.judges;
          if (judge) {
            relatedName = `${judge.first_name} ${judge.last_name}`;
            relatedOrg = judge.organization;
            relatedImage = judge.profile_image_url;
          }
        } else if (c.contact_type === 'finalist' && c.contact_finalists?.length > 0) {
          const finalist = c.contact_finalists[0]?.finalists;
          if (finalist) {
            relatedName = finalist.title;
            relatedOrg = finalist.organization;
            relatedImage = finalist.image_url;
            eventInfo = finalist.event_details;
            winner = finalist.is_winner;
          }
        } else if (c.contact_type === 'sponsor' && c.contact_sponsors?.length > 0) {
          const sponsor = c.contact_sponsors[0]?.sponsors;
          if (sponsor) {
            relatedName = sponsor.name;
            relatedImage = sponsor.logo_url;
          }
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

