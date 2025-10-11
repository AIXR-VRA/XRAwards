/**
 * Media Library Utilities
 * 
 * This module provides utilities for working with the media library system,
 * including uploads to R2 via Supabase Edge Functions and media management.
 */

import { supabase } from './supabase';

// Types for the media library system
export interface MediaItem {
  id: string;
  filename: string;
  original_filename: string;
  file_url: string;
  alt_text?: string;
  title?: string;
  description?: string;
  mime_type: string;
  file_size: number;
  upload_date: string;
  events: any[];
  categories: any[];
  finalists: any[];
  sponsors: any[];
  tags: any[];
  judges: any[];
}

export interface UploadMediaRequest {
  file: File;
  altText?: string;
  title?: string;
  description?: string;
  isPublic?: boolean;
  // Optional relationships
  eventIds?: string[];
  categoryIds?: string[];
  finalistIds?: string[];
  sponsorIds?: string[];
  tagIds?: string[];
  judgeIds?: string[];
}

export interface UploadMediaResponse {
  success: boolean;
  mediaId?: string;
  fileUrl?: string;
  error?: string;
}

export interface GetMediaRequest {
  mediaId?: string;
  eventIds?: string[];
  categoryIds?: string[];
  finalistIds?: string[];
  sponsorIds?: string[];
  tagIds?: string[];
  judgeIds?: string[];
  mimeTypes?: string[];
  searchTerm?: string;
  limit?: number;
  offset?: number;
}

export interface GetMediaResponse {
  success: boolean;
  media?: MediaItem[];
  totalCount?: number;
  error?: string;
}

/**
 * Upload a file to the media library via Supabase Edge Function
 * @param request - Upload request with file and metadata
 * @returns Promise with upload result
 */
export async function uploadMedia(request: UploadMediaRequest): Promise<UploadMediaResponse> {
  try {
    // Convert file to base64
    const fileBuffer = await request.file.arrayBuffer();
    const base64File = btoa(String.fromCharCode(...new Uint8Array(fileBuffer)));

    // Prepare request body
    const requestBody = {
      file: base64File,
      filename: request.file.name,
      mimeType: request.file.type,
      altText: request.altText,
      title: request.title,
      description: request.description,
      isPublic: request.isPublic ?? true,
      eventIds: request.eventIds,
      categoryIds: request.categoryIds,
      finalistIds: request.finalistIds,
      sponsorIds: request.sponsorIds,
      tagIds: request.tagIds,
      judgeIds: request.judgeIds,
    };

    // Get the current session to pass JWT token to edge function
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return {
        success: false,
        error: 'User not authenticated',
      };
    }

    // Call the upload-media edge function with proper headers
    const { data, error } = await supabase.functions.invoke('upload-media', {
      body: requestBody,
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return data as UploadMediaResponse;
  } catch (error) {
    console.error('Upload media error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error',
    };
  }
}

/**
 * Get media from the media library
 * @param request - Get media request parameters
 * @returns Promise with media data
 */
export async function getMedia(request: GetMediaRequest = {}): Promise<GetMediaResponse> {
  try {
    const { 
      mediaId, 
      eventIds, 
      categoryIds, 
      finalistIds, 
      sponsorIds, 
      tagIds, 
      judgeIds,
      mimeTypes, 
      searchTerm, 
      limit = 50, 
      offset = 0 
    } = request;

    // If specific media ID is requested, get that media with relationships
    if (mediaId) {
      const { data: mediaData, error: mediaError } = await supabase
        .rpc('get_media_with_relationships', { media_uuid: mediaId });

      if (mediaError) {
        return {
          success: false,
          error: mediaError.message,
        };
      }

      if (!mediaData || mediaData.length === 0) {
        return {
          success: false,
          error: 'Media not found',
        };
      }

      return {
        success: true,
        media: [mediaData[0]],
        totalCount: 1,
      };
    }

    // Search media by relationships using the database function
    const { data: searchData, error: searchError } = await supabase
      .rpc('search_media_by_relationships', {
        event_ids: eventIds,
        category_ids: categoryIds,
        finalist_ids: finalistIds,
        sponsor_ids: sponsorIds,
        tag_ids: tagIds,
        judge_ids: judgeIds,
        mime_types: mimeTypes,
        search_term: searchTerm
      });

    if (searchError) {
      return {
        success: false,
        error: searchError.message,
      };
    }

    // Apply pagination
    const totalCount = searchData?.length || 0;
    const paginatedData = searchData?.slice(offset, offset + limit) || [];

    // Get relationships for each media item
    const mediaWithRelationships = await Promise.all(
      paginatedData.map(async (media: any) => {
        const [eventsResult, categoriesResult, finalistsResult, sponsorsResult, tagsResult, judgesResult] = await Promise.all([
          supabase
            .from('media_events')
            .select(`
              event_details!inner(id, event_year, event_name)
            `)
            .eq('media_id', media.media_id),
          
          supabase
            .from('media_categories')
            .select(`
              categories!inner(id, name, slug)
            `)
            .eq('media_id', media.media_id),
          
          supabase
            .from('media_finalists')
            .select(`
              finalists!inner(id, title, organization)
            `)
            .eq('media_id', media.media_id),
          
          supabase
            .from('media_sponsors')
            .select(`
              sponsors!inner(id, name, website_url)
            `)
            .eq('media_id', media.media_id),
          
          supabase
            .from('media_tags')
            .select(`
              tags!inner(id, name, slug)
            `)
            .eq('media_id', media.media_id),
          
          supabase
            .from('media_judges')
            .select(`
              judges!inner(id, name, title)
            `)
            .eq('media_id', media.media_id)
        ]);

        return {
          id: media.media_id,
          filename: media.filename,
          original_filename: media.original_filename,
          file_url: media.file_url,
          alt_text: media.alt_text,
          title: media.title,
          description: media.description,
          mime_type: media.mime_type,
          file_size: media.file_size,
          upload_date: media.upload_date,
          events: eventsResult.data?.map((item: any) => item.event_details) || [],
          categories: categoriesResult.data?.map((item: any) => item.categories) || [],
          finalists: finalistsResult.data?.map((item: any) => item.finalists) || [],
          sponsors: sponsorsResult.data?.map((item: any) => item.sponsors) || [],
          tags: tagsResult.data?.map((item: any) => item.tags) || [],
          judges: judgesResult.data?.map((item: any) => item.judges) || [],
        };
      })
    );

    return {
      success: true,
      media: mediaWithRelationships,
      totalCount,
    };
  } catch (error) {
    console.error('Get media error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get media by ID with all relationships
 * @param mediaId - The media ID to retrieve
 * @returns Promise with media data
 */
export async function getMediaById(mediaId: string): Promise<GetMediaResponse> {
  return getMedia({ mediaId });
}

/**
 * Search media by various criteria
 * @param criteria - Search criteria
 * @returns Promise with search results
 */
export async function searchMedia(criteria: {
  eventIds?: string[];
  categoryIds?: string[];
  finalistIds?: string[];
  sponsorIds?: string[];
  tagIds?: string[];
  judgeIds?: string[];
  mimeTypes?: string[];
  searchTerm?: string;
  limit?: number;
  offset?: number;
}): Promise<GetMediaResponse> {
  return getMedia(criteria);
}

/**
 * Get media by category
 * @param categoryId - Category ID to filter by
 * @param limit - Maximum number of results
 * @param offset - Offset for pagination
 * @returns Promise with media data
 */
export async function getMediaByCategory(
  categoryId: string,
  limit: number = 50,
  offset: number = 0
): Promise<GetMediaResponse> {
  return getMedia({
    categoryIds: [categoryId],
    limit,
    offset,
  });
}

/**
 * Get media by finalist
 * @param finalistId - Finalist ID to filter by
 * @param limit - Maximum number of results
 * @param offset - Offset for pagination
 * @returns Promise with media data
 */
export async function getMediaByFinalist(
  finalistId: string,
  limit: number = 50,
  offset: number = 0
): Promise<GetMediaResponse> {
  return getMedia({
    finalistIds: [finalistId],
    limit,
    offset,
  });
}

/**
 * Get media by event
 * @param eventId - Event ID to filter by
 * @param limit - Maximum number of results
 * @param offset - Offset for pagination
 * @returns Promise with media data
 */
export async function getMediaByEvent(
  eventId: string,
  limit: number = 50,
  offset: number = 0
): Promise<GetMediaResponse> {
  return getMedia({
    eventIds: [eventId],
    limit,
    offset,
  });
}

/**
 * Get media by tag
 * @param tagId - Tag ID to filter by
 * @param limit - Maximum number of results
 * @param offset - Offset for pagination
 * @returns Promise with media data
 */
export async function getMediaByTag(
  tagId: string,
  limit: number = 50,
  offset: number = 0
): Promise<GetMediaResponse> {
  return getMedia({
    tagIds: [tagId],
    limit,
    offset,
  });
}

/**
 * Get media by judge
 * @param judgeId - Judge ID to filter by
 * @param limit - Maximum number of results
 * @param offset - Offset for pagination
 * @returns Promise with media data
 */
export async function getMediaByJudge(
  judgeId: string,
  limit: number = 50,
  offset: number = 0
): Promise<GetMediaResponse> {
  return getMedia({
    judgeIds: [judgeId],
    limit,
    offset,
  });
}

/**
 * Get images only (filters by image mime types)
 * @param limit - Maximum number of results
 * @param offset - Offset for pagination
 * @returns Promise with image media data
 */
export async function getImages(
  limit: number = 50,
  offset: number = 0
): Promise<GetMediaResponse> {
  return getMedia({
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
    limit,
    offset,
  });
}

/**
 * Get videos only (filters by video mime types)
 * @param limit - Maximum number of results
 * @param offset - Offset for pagination
 * @returns Promise with video media data
 */
export async function getVideos(
  limit: number = 50,
  offset: number = 0
): Promise<GetMediaResponse> {
  return getMedia({
    mimeTypes: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'],
    limit,
    offset,
  });
}

/**
 * Update media metadata
 * @param mediaId - Media ID to update
 * @param updates - Fields to update
 * @returns Promise with update result
 */
export async function updateMedia(
  mediaId: string,
  updates: {
    altText?: string;
    title?: string;
    description?: string;
    isPublic?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    // Map camelCase to snake_case for database columns
    const dbUpdates: any = {};
    if (updates.altText !== undefined) dbUpdates.alt_text = updates.altText;
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.isPublic !== undefined) dbUpdates.is_public = updates.isPublic;

    const { error } = await supabase
      .from('media_library')
      .update(dbUpdates)
      .eq('id', mediaId);

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Update media error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Add relationships to media - uses upsert to avoid duplicates
 * @param mediaId - Media ID
 * @param relationships - Relationships to add
 * @returns Promise with result
 */
export async function addMediaRelationships(
  mediaId: string,
  relationships: {
    eventIds?: string[];
    categoryIds?: string[];
    finalistIds?: string[];
    sponsorIds?: string[];
    tagIds?: string[];
    judgeIds?: string[];
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const operations = [];

    if (relationships.eventIds?.length) {
      operations.push(
        supabase.from('media_events').upsert(
          relationships.eventIds.map(eventId => ({
            media_id: mediaId,
            event_id: eventId
          })),
          { onConflict: 'media_id,event_id', ignoreDuplicates: true }
        )
      );
    }

    if (relationships.categoryIds?.length) {
      operations.push(
        supabase.from('media_categories').upsert(
          relationships.categoryIds.map(categoryId => ({
            media_id: mediaId,
            category_id: categoryId
          })),
          { onConflict: 'media_id,category_id', ignoreDuplicates: true }
        )
      );
    }

    if (relationships.finalistIds?.length) {
      operations.push(
        supabase.from('media_finalists').upsert(
          relationships.finalistIds.map(finalistId => ({
            media_id: mediaId,
            finalist_id: finalistId
          })),
          { onConflict: 'media_id,finalist_id', ignoreDuplicates: true }
        )
      );
    }

    if (relationships.sponsorIds?.length) {
      operations.push(
        supabase.from('media_sponsors').upsert(
          relationships.sponsorIds.map(sponsorId => ({
            media_id: mediaId,
            sponsor_id: sponsorId
          })),
          { onConflict: 'media_id,sponsor_id', ignoreDuplicates: true }
        )
      );
    }

    if (relationships.tagIds?.length) {
      operations.push(
        supabase.from('media_tags').upsert(
          relationships.tagIds.map(tagId => ({
            media_id: mediaId,
            tag_id: tagId
          })),
          { onConflict: 'media_id,tag_id', ignoreDuplicates: true }
        )
      );
    }

    if (relationships.judgeIds?.length) {
      operations.push(
        supabase.from('media_judges').upsert(
          relationships.judgeIds.map(judgeId => ({
            media_id: mediaId,
            judge_id: judgeId
          })),
          { onConflict: 'media_id,judge_id', ignoreDuplicates: true }
        )
      );
    }

    if (operations.length > 0) {
      const results = await Promise.all(operations);
      const errors = results.filter(result => result.error);
      
      if (errors.length > 0) {
        console.error('Relationship errors:', errors);
        return {
          success: false,
          error: `Failed to add relationships: ${errors.map(e => e.error?.message).join(', ')}`,
        };
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Add media relationships error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Remove relationships from media
 * @param mediaId - Media ID
 * @param relationships - Relationships to remove
 * @returns Promise with result
 */
export async function removeMediaRelationships(
  mediaId: string,
  relationships: {
    eventIds?: string[];
    categoryIds?: string[];
    finalistIds?: string[];
    sponsorIds?: string[];
    tagIds?: string[];
    judgeIds?: string[];
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const relationshipPromises = [];

    if (relationships.eventIds?.length) {
      relationshipPromises.push(
        supabase.from('media_events')
          .delete()
          .eq('media_id', mediaId)
          .in('event_id', relationships.eventIds)
      );
    }

    if (relationships.categoryIds?.length) {
      relationshipPromises.push(
        supabase.from('media_categories')
          .delete()
          .eq('media_id', mediaId)
          .in('category_id', relationships.categoryIds)
      );
    }

    if (relationships.finalistIds?.length) {
      relationshipPromises.push(
        supabase.from('media_finalists')
          .delete()
          .eq('media_id', mediaId)
          .in('finalist_id', relationships.finalistIds)
      );
    }

    if (relationships.sponsorIds?.length) {
      relationshipPromises.push(
        supabase.from('media_sponsors')
          .delete()
          .eq('media_id', mediaId)
          .in('sponsor_id', relationships.sponsorIds)
      );
    }

    if (relationships.tagIds?.length) {
      relationshipPromises.push(
        supabase.from('media_tags')
          .delete()
          .eq('media_id', mediaId)
          .in('tag_id', relationships.tagIds)
      );
    }

    if (relationships.judgeIds?.length) {
      relationshipPromises.push(
        supabase.from('media_judges')
          .delete()
          .eq('media_id', mediaId)
          .in('judge_id', relationships.judgeIds)
      );
    }

    if (relationshipPromises.length > 0) {
      const results = await Promise.all(relationshipPromises);
      const errors = results.filter(result => result.error);
      
      if (errors.length > 0) {
        return {
          success: false,
          error: `Failed to remove some relationships: ${errors.map(e => e.error?.message).join(', ')}`,
        };
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Remove media relationships error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Delete media from library and R2
 * Note: This is just a placeholder - the actual deletion is handled by /api/media endpoint
 * @param mediaId - Media ID to delete
 * @returns Promise with result
 */
export async function deleteMedia(mediaId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // The frontend (media-library.astro) calls /api/media DELETE endpoint directly
    // This function is kept for consistency but shouldn't be used
    console.warn('deleteMedia utility called - frontend should use /api/media endpoint directly');
    
    return {
      success: false,
      error: 'This function should not be called directly - use /api/media endpoint',
    };
  } catch (error) {
    console.error('Delete media error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Format file size for display
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get file extension from filename
 * @param filename - The filename
 * @returns File extension (without dot)
 */
export function getFileExtension(filename: string): string {
  return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
}

/**
 * Check if file is an image
 * @param mimeType - MIME type of the file
 * @returns True if file is an image
 */
export function isImage(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

/**
 * Check if file is a video
 * @param mimeType - MIME type of the file
 * @returns True if file is a video
 */
export function isVideo(mimeType: string): boolean {
  return mimeType.startsWith('video/');
}

/**
 * Check if file is an audio file
 * @param mimeType - MIME type of the file
 * @returns True if file is audio
 */
export function isAudio(mimeType: string): boolean {
  return mimeType.startsWith('audio/');
}
