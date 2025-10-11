import type { APIRoute } from 'astro';
import { supabase } from '../../utils/supabase';
import { createServerClient } from '@supabase/ssr';
import { getMedia } from '../../utils/media-library';

// GET /api/media - Get all media with optional filtering
export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const eventIds = url.searchParams.get('eventIds')?.split(',') || undefined;
    const categoryIds = url.searchParams.get('categoryIds')?.split(',') || undefined;
    const finalistIds = url.searchParams.get('finalistIds')?.split(',') || undefined;
    const sponsorIds = url.searchParams.get('sponsorIds')?.split(',') || undefined;
    const judgeIds = url.searchParams.get('judgeIds')?.split(',') || undefined;
    const tagIds = url.searchParams.get('tagIds')?.split(',') || undefined;
    const mimeTypes = url.searchParams.get('mimeTypes')?.split(',') || undefined;
    const searchTerm = url.searchParams.get('searchTerm') || undefined;
    const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : 50;
    const offset = url.searchParams.get('offset') ? parseInt(url.searchParams.get('offset')!) : 0;

    const result = await getMedia({
      eventIds,
      categoryIds,
      finalistIds,
      sponsorIds,
      judgeIds,
      tagIds,
      mimeTypes,
      searchTerm,
      limit,
      offset
    });

    if (!result.success) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      media: result.media,
      totalCount: result.totalCount
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching media:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// POST /api/media - Upload new media
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    console.log('📥 POST /api/media - Upload request received');
    
    const body = await request.json();
    const { file, filename, mimeType, altText, title, description, isPublic, eventIds, categoryIds, finalistIds, sponsorIds, judgeIds, tagIds } = body;

    console.log('📋 Upload request data:', {
      filename,
      mimeType,
      hasFile: !!file,
      fileSize: file?.length || 0,
    });

    if (!file || !filename || !mimeType) {
      console.error('❌ Missing required fields');
      return new Response(JSON.stringify({ error: 'Missing required fields: file, filename, mimeType' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create server-side Supabase client to get session
    console.log('🔧 Creating server-side Supabase client');
    const supabaseServer = createServerClient(
      import.meta.env.SUPABASE_URL,
      import.meta.env.SUPABASE_ANON_KEY,
      {
        cookies: {
          get(key: string) {
            return cookies.get(key)?.value;
          },
          set(key: string, value: string, options: any) {
            cookies.set(key, value, options);
          },
          remove(key: string, options: any) {
            cookies.delete(key, options);
          },
        },
      }
    );

    // Get session
    const { data: { session }, error: sessionError } = await supabaseServer.auth.getSession();
    
    console.log('🔑 Session check:', {
      hasSession: !!session,
      hasAccessToken: !!session?.access_token,
      sessionError: sessionError?.message,
    });

    if (!session || !session.access_token) {
      console.error('❌ No valid session found');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('🔄 Calling edge function with session token...');
    
    // Call the edge function with the session access token
    const { data, error } = await supabaseServer.functions.invoke('upload-media', {
      body: {
        file,
        filename,
        mimeType,
        altText,
        title,
        description,
        isPublic,
        eventIds,
        categoryIds,
        finalistIds,
        sponsorIds,
        judgeIds,
        tagIds,
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    console.log('📤 Edge function response:', {
      success: !!data,
      hasError: !!error,
      errorMessage: error?.message,
      data: data,
    });

    if (error) {
      console.error('❌ Edge function error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = data as any;

    if (!result.success) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      mediaId: result.mediaId,
      fileUrl: result.fileUrl
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error uploading media:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// PUT /api/media - Update existing media
export const PUT: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { id, title, altText, description, isPublic, eventIds, categoryIds, finalistIds, sponsorIds, judgeIds, tagIds } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: 'Media ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create server-side Supabase client with authentication
    const supabaseServer = createServerClient(
      import.meta.env.SUPABASE_URL,
      import.meta.env.SUPABASE_ANON_KEY,
      {
        cookies: {
          get(key: string) {
            return cookies.get(key)?.value;
          },
          set(key: string, value: string, options: any) {
            cookies.set(key, value, options);
          },
          remove(key: string, options: any) {
            cookies.delete(key, options);
          },
        },
      }
    );

    // Update media metadata using authenticated client
    const dbUpdates: any = {};
    if (title !== undefined) dbUpdates.title = title;
    if (altText !== undefined) dbUpdates.alt_text = altText;
    if (description !== undefined) dbUpdates.description = description;
    if (isPublic !== undefined) dbUpdates.is_public = isPublic;

    const { error: updateError } = await supabaseServer
      .from('media_library')
      .update(dbUpdates)
      .eq('id', id);

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update relationships efficiently - only change what's different
    const newEventIds = eventIds || [];
    const newCategoryIds = categoryIds || [];
    const newFinalistIds = finalistIds || [];
    const newSponsorIds = sponsorIds || [];
    const newJudgeIds = judgeIds || [];
    const newTagIds = tagIds || [];

    // Get current relationships using authenticated client
    const [eventsData, categoriesData, finalistsData, sponsorsData, judgesData, tagsData] = await Promise.all([
      supabaseServer.from('media_events').select('event_id').eq('media_id', id),
      supabaseServer.from('media_categories').select('category_id').eq('media_id', id),
      supabaseServer.from('media_finalists').select('finalist_id').eq('media_id', id),
      supabaseServer.from('media_sponsors').select('sponsor_id').eq('media_id', id),
      supabaseServer.from('media_judges').select('judge_id').eq('media_id', id),
      supabaseServer.from('media_tags').select('tag_id').eq('media_id', id)
    ]);

    const currentEventIds = eventsData.data?.map(e => e.event_id) || [];
    const currentCategoryIds = categoriesData.data?.map(c => c.category_id) || [];
    const currentFinalistIds = finalistsData.data?.map(f => f.finalist_id) || [];
    const currentSponsorIds = sponsorsData.data?.map(s => s.sponsor_id) || [];
    const currentJudgeIds = judgesData.data?.map(j => j.judge_id) || [];
    const currentTagIds = tagsData.data?.map(t => t.tag_id) || [];

    // Calculate differences
    const eventsToAdd = newEventIds.filter(id => !currentEventIds.includes(id));
    const eventsToRemove = currentEventIds.filter(id => !newEventIds.includes(id));
    const categoriesToAdd = newCategoryIds.filter(id => !currentCategoryIds.includes(id));
    const categoriesToRemove = currentCategoryIds.filter(id => !newCategoryIds.includes(id));
    const finalistsToAdd = newFinalistIds.filter(id => !currentFinalistIds.includes(id));
    const finalistsToRemove = currentFinalistIds.filter(id => !newFinalistIds.includes(id));
    const sponsorsToAdd = newSponsorIds.filter(id => !currentSponsorIds.includes(id));
    const sponsorsToRemove = currentSponsorIds.filter(id => !newSponsorIds.includes(id));
    const judgesToAdd = newJudgeIds.filter(id => !currentJudgeIds.includes(id));
    const judgesToRemove = currentJudgeIds.filter(id => !newJudgeIds.includes(id));
    const tagsToAdd = newTagIds.filter(id => !currentTagIds.includes(id));
    const tagsToRemove = currentTagIds.filter(id => !newTagIds.includes(id));

    // Remove relationships using authenticated client
    const removeOps = [];
    if (eventsToRemove.length) removeOps.push(supabaseServer.from('media_events').delete().eq('media_id', id).in('event_id', eventsToRemove));
    if (categoriesToRemove.length) removeOps.push(supabaseServer.from('media_categories').delete().eq('media_id', id).in('category_id', categoriesToRemove));
    if (finalistsToRemove.length) removeOps.push(supabaseServer.from('media_finalists').delete().eq('media_id', id).in('finalist_id', finalistsToRemove));
    if (sponsorsToRemove.length) removeOps.push(supabaseServer.from('media_sponsors').delete().eq('media_id', id).in('sponsor_id', sponsorsToRemove));
    if (judgesToRemove.length) removeOps.push(supabaseServer.from('media_judges').delete().eq('media_id', id).in('judge_id', judgesToRemove));
    if (tagsToRemove.length) removeOps.push(supabaseServer.from('media_tags').delete().eq('media_id', id).in('tag_id', tagsToRemove));
    if (removeOps.length) await Promise.all(removeOps);

    // Add new relationships using authenticated client
    const addOps = [];
    if (eventsToAdd.length) addOps.push(supabaseServer.from('media_events').insert(eventsToAdd.map(event_id => ({ media_id: id, event_id }))));
    if (categoriesToAdd.length) addOps.push(supabaseServer.from('media_categories').insert(categoriesToAdd.map(category_id => ({ media_id: id, category_id }))));
    if (finalistsToAdd.length) addOps.push(supabaseServer.from('media_finalists').insert(finalistsToAdd.map(finalist_id => ({ media_id: id, finalist_id }))));
    if (sponsorsToAdd.length) addOps.push(supabaseServer.from('media_sponsors').insert(sponsorsToAdd.map(sponsor_id => ({ media_id: id, sponsor_id }))));
    if (judgesToAdd.length) addOps.push(supabaseServer.from('media_judges').insert(judgesToAdd.map(judge_id => ({ media_id: id, judge_id }))));
    if (tagsToAdd.length) addOps.push(supabaseServer.from('media_tags').insert(tagsToAdd.map(tag_id => ({ media_id: id, tag_id }))));
    if (addOps.length) {
      const results = await Promise.all(addOps);
      const errors = results.filter(r => r.error);
      if (errors.length) {
        return new Response(JSON.stringify({ error: `Failed to update relationships: ${errors.map(e => e.error?.message).join(', ')}` }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error updating media:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// DELETE /api/media - Delete media
export const DELETE: APIRoute = async ({ request, cookies }) => {
  try {
    console.log('🗑️ DELETE /api/media - Delete request received');
    
    const body = await request.json();
    const { id } = body;

    console.log('📋 Delete request data:', { id });

    if (!id) {
      console.error('❌ Missing media ID');
      return new Response(JSON.stringify({ error: 'Media ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create server-side Supabase client to get session
    console.log('🔧 Creating server-side Supabase client');
    const supabaseServer = createServerClient(
      import.meta.env.SUPABASE_URL,
      import.meta.env.SUPABASE_ANON_KEY,
      {
        cookies: {
          get(key: string) {
            return cookies.get(key)?.value;
          },
          set(key: string, value: string, options: any) {
            cookies.set(key, value, options);
          },
          remove(key: string, options: any) {
            cookies.delete(key, options);
          },
        },
      }
    );

    // Get session
    const { data: { session }, error: sessionError } = await supabaseServer.auth.getSession();
    
    console.log('🔑 Session check:', {
      hasSession: !!session,
      hasAccessToken: !!session?.access_token,
      sessionError: sessionError?.message,
    });

    if (!session || !session.access_token) {
      console.error('❌ No valid session found');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('🔄 Calling delete-media edge function...');
    
    // Call the edge function with the session access token
    const { data, error } = await supabaseServer.functions.invoke('delete-media', {
      body: {
        mediaId: id,
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    console.log('📤 Edge function response:', {
      success: !!data,
      hasError: !!error,
      errorMessage: error?.message,
      data: data,
    });

    if (error) {
      console.error('❌ Edge function error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = data as any;

    if (!result.success) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ Media deleted successfully');

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('❌ Error deleting media:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
