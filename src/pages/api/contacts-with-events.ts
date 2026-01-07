/**
 * Contacts with Events API Endpoint
 * GET /api/contacts-with-events - List contacts with event filtering for recipient selection
 * 
 * This endpoint supports filtering contacts by:
 * - event_ids: Comma-separated event IDs to include
 * - exclude_event_ids: Comma-separated event IDs to exclude
 * - contact_types: Comma-separated types (judge, finalist, sponsor) to include
 * - exclude_contact_types: Comma-separated types to exclude
 * - winner_types: Comma-separated winner types (category_winner, accolade_winner) to include
 * - exclude_winner_types: Comma-separated winner types to exclude
 * - is_active: Filter by active status
 * 
 * Legacy parameters (backward compatibility):
 * - event_id: Single event ID (use event_ids instead)
 * - contact_type: Single type (use contact_types instead)
 * - is_winner: Boolean winner filter (use winner_types instead)
 * 
 * Note: Contact types are derived from junction tables - a contact can have multiple types
 */

import type { APIRoute } from 'astro';
import { requireApiAuth } from '../../utils/supabase';

// Helper to derive contact types from junction table relationships
function deriveContactTypes(contact: any): string[] {
  const types: string[] = [];
  if (contact.contact_judges?.length > 0) types.push('judge');
  if (contact.contact_finalists?.length > 0) types.push('finalist');
  if (contact.contact_sponsors?.length > 0) types.push('sponsor');
  return types;
}

// Helper to check if a finalist is an accolade winner
function isAccoladeWinner(contact: any): boolean {
  return contact.contact_finalists?.some((cf: any) =>
    cf.finalists?.finalist_accolades?.length > 0
  ) ?? false;
}

// Helper to check if a finalist is a category winner
function isCategoryWinner(contact: any): boolean {
  return contact.contact_finalists?.some((cf: any) =>
    cf.finalists?.is_winner === true
  ) ?? false;
}

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

    // New multi-value parameters
    const eventIdsParam = searchParams.get('event_ids');
    const excludeEventIdsParam = searchParams.get('exclude_event_ids');
    const contactTypesParam = searchParams.get('contact_types');
    const excludeContactTypesParam = searchParams.get('exclude_contact_types');
    const winnerTypesParam = searchParams.get('winner_types');
    const excludeWinnerTypesParam = searchParams.get('exclude_winner_types');

    // Legacy single-value parameters (backward compatibility)
    const eventId = searchParams.get('event_id');
    const contactType = searchParams.get('contact_type');
    const isWinner = searchParams.get('is_winner');
    const isActive = searchParams.get('is_active');

    // Parse comma-separated values
    const eventIds = eventIdsParam ? eventIdsParam.split(',').filter(Boolean) : (eventId ? [eventId] : []);
    const excludeEventIds = excludeEventIdsParam ? excludeEventIdsParam.split(',').filter(Boolean) : [];
    const contactTypes = contactTypesParam ? contactTypesParam.split(',').filter(Boolean) : (contactType ? [contactType] : []);
    const excludeContactTypes = excludeContactTypesParam ? excludeContactTypesParam.split(',').filter(Boolean) : [];
    const winnerTypes = winnerTypesParam ? winnerTypesParam.split(',').filter(Boolean) : [];
    const excludeWinnerTypes = excludeWinnerTypesParam ? excludeWinnerTypesParam.split(',').filter(Boolean) : [];

    // Convert legacy is_winner to winner_types if provided and no winner_types specified
    if (isWinner !== null && winnerTypes.length === 0) {
      if (isWinner === 'true') {
        winnerTypes.push('category_winner');
      }
    }

    // Build response - get all contacts with full relationship data
    let allContacts: any[] = [];

    // Fetch all contacts with their relationships (including accolades for winner type filtering)
    const { data: contactsData, error: contactsError } = await supabase
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
            profile_image_url,
            judge_events (
              event_id,
              event_details (
                id,
                event_name,
                event_year
              )
            )
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
            event_id,
            category_id,
            categories (
              id,
              name
            ),
            event_details (
              id,
              event_name,
              event_year,
              location,
              awards_ceremony
            ),
            finalist_accolades (
              accolade_id,
              accolades (
                id,
                name,
                code
              )
            )
          )
        ),
        contact_sponsors (
          sponsor_id,
          sponsors (
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
      .order('created_at', { ascending: false });

    if (contactsError) throw contactsError;

    // 1. Transform raw data into structured contact objects
    const expandedContacts = (contactsData || []).map((c: any) => {
      let relatedName = null;
      let relatedOrg = null;
      let relatedImage = null;
      let eventInfo = null;

      // Accumulate status flags across ALL entries for this specific contact record
      let isWinnerAnywhere = false;
      let hasAccoladesAnywhere = false;

      let contactEventIds: string[] = [];

      const types = deriveContactTypes(c);
      const primaryType = types[0] || 'general';

      // Collect event IDs from all relationships
      if (c.contact_judges?.length > 0) {
        c.contact_judges.forEach((cj: any) => {
          cj.judges?.judge_events?.forEach((je: any) => {
            if (je.event_id) contactEventIds.push(je.event_id);
          });
        });
        const judge = c.contact_judges[0]?.judges;
        if (judge) {
          relatedName = `${judge.first_name} ${judge.last_name}`;
          relatedOrg = judge.organization;
          relatedImage = judge.profile_image_url;
        }
      }

      if (c.contact_finalists?.length > 0) {
        c.contact_finalists.forEach((cf: any) => {
          const f = cf.finalists;
          if (f) {
            if (f.event_id) contactEventIds.push(f.event_id);
            if (f.is_winner) isWinnerAnywhere = true;
            if (f.finalist_accolades?.length > 0) hasAccoladesAnywhere = true;
          }
        });

        const finalist = c.contact_finalists[0]?.finalists;
        if (finalist) {
          if (!relatedName) relatedName = finalist.title;
          if (!relatedOrg) relatedOrg = finalist.organization;
          if (!relatedImage) relatedImage = finalist.image_url;
          eventInfo = finalist.event_details;
        }
      }

      if (c.contact_sponsors?.length > 0) {
        c.contact_sponsors.forEach((cs: any) => {
          cs.sponsors?.sponsor_events?.forEach((se: any) => {
            if (se.event_id) contactEventIds.push(se.event_id);
          });
        });
        const sponsor = c.contact_sponsors[0]?.sponsors;
        if (sponsor) {
          if (!relatedName) relatedName = sponsor.name;
          if (!relatedImage) relatedImage = sponsor.logo_url;
        }
      }

      // Collect all finalist entries with full details
      const finalistEntries = c.contact_finalists?.map((cf: any) => {
        const f = cf.finalists;
        if (!f) return null;
        return {
          id: f.id,
          title: f.title,
          category_id: f.category_id,
          category_name: f.categories?.name || null,
          is_winner: f.is_winner,
          event_id: f.event_id,
          event_name: f.event_details?.event_name || null,
          event_year: f.event_details?.event_year || null,
          event_location: f.event_details?.location || null,
          awards_ceremony: f.event_details?.awards_ceremony || null,
          accolades: f.finalist_accolades?.map((fa: any) => ({
            id: fa.accolades?.id,
            name: fa.accolades?.name,
            code: fa.accolades?.code
          })) || []
        };
      }).filter(Boolean) || [];

      return {
        ...c,
        contact_types: types,
        contact_type: primaryType,
        related_name: relatedName,
        related_org: relatedOrg,
        related_image: relatedImage,
        event_info: eventInfo,
        is_winner: isWinnerAnywhere,
        has_accolades: hasAccoladesAnywhere,
        contact_event_ids: [...new Set(contactEventIds)],
        finalist_entries: finalistEntries,
        // Backward compatibility
        finalists: c.contact_finalists?.map((cf: any) => cf.finalists).filter(Boolean) || [],
        judges: c.contact_judges?.map((cj: any) => cj.judges).filter(Boolean) || [],
        sponsors: c.contact_sponsors?.map((cs: any) => cs.sponsors).filter(Boolean) || []
      };
    });

    // 2. Merge duplicate contacts by Email (Case Insensitive)
    const mergedContactsMap = new Map<string, any>();
    const contactsWithoutEmail: any[] = [];

    expandedContacts.forEach((c: any) => {
      if (!c.email) {
        contactsWithoutEmail.push(c);
        return;
      }

      const emailKey = c.email.trim().toLowerCase();

      if (mergedContactsMap.has(emailKey)) {
        const existing = mergedContactsMap.get(emailKey);

        // Merge flags
        existing.is_active = existing.is_active || c.is_active;
        existing.is_winner = existing.is_winner || c.is_winner;
        existing.has_accolades = existing.has_accolades || c.has_accolades;

        // Merge Arrays (Deduplicate Strings)
        existing.contact_event_ids = [...new Set([...existing.contact_event_ids, ...c.contact_event_ids])];
        existing.contact_types = [...new Set([...existing.contact_types, ...c.contact_types])];

        // Merge Arrays of Objects (Deduplicate by ID)
        const mergeObjectArrays = (arr1: any[], arr2: any[]) => {
          const map = new Map();
          arr1.forEach(i => map.set(i.id, i));
          arr2.forEach(i => map.set(i.id, i));
          return Array.from(map.values());
        };

        existing.finalist_entries = mergeObjectArrays(existing.finalist_entries, c.finalist_entries);
        existing.finalists = mergeObjectArrays(existing.finalists, c.finalists);
        existing.judges = mergeObjectArrays(existing.judges, c.judges);
        existing.sponsors = mergeObjectArrays(existing.sponsors, c.sponsors);
      } else {
        mergedContactsMap.set(emailKey, c);
      }
    });

    // Recombine merged list
    allContacts = [...mergedContactsMap.values(), ...contactsWithoutEmail];

    // 3. Apply Filters to the Merged List

    // Apply event include filter
    if (eventIds.length > 0) {
      allContacts = allContacts.filter(c =>
        c.contact_event_ids.some((eid: string) => eventIds.includes(eid))
      );
    }

    // Apply event exclude filter
    if (excludeEventIds.length > 0) {
      allContacts = allContacts.filter(c =>
        !c.contact_event_ids.some((eid: string) => excludeEventIds.includes(eid))
      );
    }

    // Apply contact type include filter
    if (contactTypes.length > 0) {
      allContacts = allContacts.filter(c =>
        c.contact_types.some((bg: string) => contactTypes.includes(bg))
      );
    }

    // Apply contact type exclude filter
    if (excludeContactTypes.length > 0) {
      allContacts = allContacts.filter(c =>
        !c.contact_types.some((bg: string) => excludeContactTypes.includes(bg))
      );
    }

    // Apply winner type filters
    if (winnerTypes.length > 0 || excludeWinnerTypes.length > 0) {
      allContacts = allContacts.filter(c => {
        // Handle Inclusions (OR logic)
        let matchesInclude = true;
        if (winnerTypes.length > 0) {
          matchesInclude = false;
          if (winnerTypes.includes('category_winner') && c.is_winner === true) matchesInclude = true;
          if (winnerTypes.includes('accolade_winner') && c.has_accolades === true) matchesInclude = true;
        }

        // Handle Exclusions (must NOT match any excluded criteria)
        const excludeCategoryWinner = excludeWinnerTypes.includes('category_winner') && c.is_winner === true;
        const excludeAccoladeWinner = excludeWinnerTypes.includes('accolade_winner') && c.has_accolades === true;

        return matchesInclude && !excludeCategoryWinner && !excludeAccoladeWinner;
      });
    }

    // Apply active filter
    if (isActive !== null) {
      const isActiveBool = isActive === 'true';
      allContacts = allContacts.filter(c => c.is_active === isActiveBool);
    }

    // Cleanup sort
    allContacts.sort((a, b) => {
      const nameA = a.last_name || a.email || '';
      const nameB = b.last_name || b.email || '';
      return nameA.localeCompare(nameB);
    });

    const uniqueContacts = allContacts;

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
