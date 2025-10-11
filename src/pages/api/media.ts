import type { APIRoute } from 'astro';
import { supabase } from '../../utils/supabase';
import { createServerClient } from '@supabase/ssr';
import { uploadMedia, getMedia, updateMedia, deleteMedia, addMediaRelationships, removeMediaRelationships } from '../../utils/media-library';

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
export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { id, title, altText, description, isPublic, eventIds, categoryIds, finalistIds, sponsorIds, judgeIds, tagIds } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: 'Media ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update media metadata
    const updateResult = await updateMedia(id, {
      title,
      altText,
      description,
      isPublic
    });

    if (!updateResult.success) {
      return new Response(JSON.stringify({ error: updateResult.error }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update relationships
    // First, get current relationships to determine what to add/remove
    const { data: currentMedia } = await supabase
      .from('media_library')
      .select(`
        id,
        events:media_events(event_details(id)),
        categories:media_categories(categories(id)),
        finalists:media_finalists(finalists(id)),
        sponsors:media_sponsors(sponsors(id)),
        judges:media_judges(judges(id)),
        tags:media_tags(tags(id))
      `)
      .eq('id', id)
      .single();

    if (currentMedia) {
      // Determine what to add and remove
      const currentEventIds = currentMedia.events?.map((e: any) => e.event_details.id) || [];
      const currentCategoryIds = currentMedia.categories?.map((c: any) => c.categories.id) || [];
      const currentFinalistIds = currentMedia.finalists?.map((f: any) => f.finalists.id) || [];
      const currentSponsorIds = currentMedia.sponsors?.map((s: any) => s.sponsors.id) || [];
      const currentJudgeIds = currentMedia.judges?.map((j: any) => j.judges.id) || [];
      const currentTagIds = currentMedia.tags?.map((t: any) => t.tags.id) || [];

      const newEventIds = eventIds || [];
      const newCategoryIds = categoryIds || [];
      const newFinalistIds = finalistIds || [];
      const newSponsorIds = sponsorIds || [];
      const newJudgeIds = judgeIds || [];
      const newTagIds = tagIds || [];

      // Remove old relationships
      const removePromises = [];
      if (currentEventIds.length > 0) {
        removePromises.push(removeMediaRelationships(id, { eventIds: currentEventIds }));
      }
      if (currentCategoryIds.length > 0) {
        removePromises.push(removeMediaRelationships(id, { categoryIds: currentCategoryIds }));
      }
      if (currentFinalistIds.length > 0) {
        removePromises.push(removeMediaRelationships(id, { finalistIds: currentFinalistIds }));
      }
      if (currentSponsorIds.length > 0) {
        removePromises.push(removeMediaRelationships(id, { sponsorIds: currentSponsorIds }));
      }
      if (currentJudgeIds.length > 0) {
        removePromises.push(removeMediaRelationships(id, { judgeIds: currentJudgeIds }));
      }
      if (currentTagIds.length > 0) {
        removePromises.push(removeMediaRelationships(id, { tagIds: currentTagIds }));
      }

      if (removePromises.length > 0) {
        await Promise.all(removePromises);
      }

      // Add new relationships
      if (newEventIds.length > 0 || newCategoryIds.length > 0 || newFinalistIds.length > 0 || 
          newSponsorIds.length > 0 || newJudgeIds.length > 0 || newTagIds.length > 0) {
        const addResult = await addMediaRelationships(id, {
          eventIds: newEventIds,
          categoryIds: newCategoryIds,
          finalistIds: newFinalistIds,
          sponsorIds: newSponsorIds,
          judgeIds: newJudgeIds,
          tagIds: newTagIds
        });

        if (!addResult.success) {
          return new Response(JSON.stringify({ error: addResult.error }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }
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
export const DELETE: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: 'Media ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await deleteMedia(id);

    if (!result.success) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error deleting media:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
