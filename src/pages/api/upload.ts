/**
 * File Upload API Endpoint
 * POST /api/upload
 * 
 * Protected endpoint for uploading files to R2
 * Requires Supabase authentication
 */

import type { APIRoute } from 'astro';
import { createSecureSupabaseClient } from '../../utils/supabase';
import { uploadToR2, generateSafeFilename } from '../../utils/r2-upload';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Initialize Supabase client
    const supabase = createSecureSupabaseClient(cookies, request);

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized. Please log in.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string | null;

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate file
    const maxSizeMB = 10;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    
    if (file.size > maxSizeMB * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: `File size must be less than ${maxSizeMB}MB` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!allowedTypes.includes(file.type)) {
      return new Response(
        JSON.stringify({ error: `File type must be an image (jpg, png, webp, gif, svg)` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Convert file to Uint8Array (Cloudflare Workers compatible)
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Generate safe filename
    const path = generateSafeFilename(file.name, folder || undefined);

    // Upload to R2
    const result = await uploadToR2(uint8Array, path, file.type);

    if (!result.success) {
      return new Response(
        JSON.stringify({ error: result.error || 'Upload failed' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        url: result.url,
        path: result.path,
        message: 'File uploaded successfully',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Upload API error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

