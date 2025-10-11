import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { S3Client } from "https://deno.land/x/s3_lite_client@0.7.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface UploadRequest {
  file: string; // base64 encoded file
  filename: string;
  mimeType: string;
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

interface UploadResponse {
  success: boolean;
  mediaId?: string;
  fileUrl?: string;
  error?: string;
}

serve(async (req) => {
  console.log('🚀 Edge function invoked:', req.method, req.url)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight request handled')
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('📋 Request headers:', {
      authorization: req.headers.get('Authorization') ? 'Present' : 'Missing',
      contentType: req.headers.get('Content-Type'),
      apikey: req.headers.get('apikey') ? 'Present' : 'Missing',
    })

    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('❌ Missing Authorization header')
    }

    // Initialize Supabase client
    console.log('🔧 Initializing Supabase client')
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader! },
        },
      }
    )
    
    // Verify JWT token and get user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      console.error('❌ Authentication failed:', authError?.message)
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    console.log('✅ User authenticated:', user.email)

    // Initialize R2 client
    console.log('☁️ Initializing R2 client')
    const r2AccountId = Deno.env.get('R2_ACCOUNT_ID')
    const r2AccessKeyId = Deno.env.get('R2_ACCESS_KEY_ID')
    const r2SecretAccessKey = Deno.env.get('R2_SECRET_ACCESS_KEY')
    const bucketName = Deno.env.get('R2_BUCKET_NAME')
    const publicUrl = Deno.env.get('PUBLIC_R2_PUBLIC_URL')

    console.log('🔑 R2 Configuration check:', {
      r2AccountId: r2AccountId ? 'Present' : 'Missing',
      r2AccessKeyId: r2AccessKeyId ? 'Present' : 'Missing',
      r2SecretAccessKey: r2SecretAccessKey ? 'Present' : 'Missing',
      bucketName: bucketName || 'Missing',
      publicUrl: publicUrl || 'Missing',
    })

    if (!r2AccountId || !r2AccessKeyId || !r2SecretAccessKey || !bucketName || !publicUrl) {
      console.error('❌ R2 configuration missing')
      throw new Error('R2 configuration missing')
    }

    const r2Client = new S3Client({
      endPoint: `${r2AccountId}.r2.cloudflarestorage.com`,
      port: 443,
      useSSL: true,
      region: 'auto',
      bucket: bucketName,
      accessKey: r2AccessKeyId,
      secretKey: r2SecretAccessKey,
      pathStyle: false,
    })

    // Parse request body
    console.log('📦 Parsing request body')
    const body: UploadRequest = await req.json()
    const { file, filename, mimeType, altText, title, description, isPublic = true, eventIds, categoryIds, finalistIds, sponsorIds, tagIds, judgeIds } = body

    console.log('📄 Upload request:', {
      filename,
      mimeType,
      hasFile: !!file,
      altText: altText || 'None',
      title: title || 'None',
      isPublic,
      eventIds: eventIds?.length || 0,
      categoryIds: categoryIds?.length || 0,
      finalistIds: finalistIds?.length || 0,
      sponsorIds: sponsorIds?.length || 0,
      tagIds: tagIds?.length || 0,
      judgeIds: judgeIds?.length || 0,
    })

    if (!file || !filename || !mimeType) {
      console.error('❌ Missing required fields')
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: file, filename, mimeType' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Decode base64 file
    console.log('🔓 Decoding base64 file')
    const fileBuffer = Uint8Array.from(atob(file), c => c.charCodeAt(0))
    console.log(`✅ File decoded, size: ${fileBuffer.length} bytes`)
    
    // Generate safe filename with timestamp
    const timestamp = Date.now()
    const date = new Date(timestamp)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    
    const extension = filename.substring(filename.lastIndexOf('.'))
    const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'))
    const safeName = nameWithoutExt
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .toLowerCase()
    const uniqueFilename = `${safeName}_${timestamp}${extension}`
    
    // Determine folder based on mime type with year/month organization
    let baseFolder = 'media'
    if (mimeType.startsWith('image/')) {
      baseFolder = 'images'
    } else if (mimeType.startsWith('video/')) {
      baseFolder = 'videos'
    } else if (mimeType.startsWith('audio/')) {
      baseFolder = 'audio'
    } else if (mimeType.includes('pdf')) {
      baseFolder = 'documents'
    }
    
    // Organize into year/month folders: images/2024/10/filename.jpg
    const filePath = `${baseFolder}/${year}/${month}/${uniqueFilename}`
    console.log(`📁 File will be uploaded to: ${filePath}`)

    // Upload to R2
    console.log('☁️ Uploading to R2...')
    console.log('📦 Upload details:', {
      bucket: bucketName,
      key: filePath,
      contentType: mimeType,
      bodySize: fileBuffer.length,
    })

    try {
      await r2Client.putObject(filePath, fileBuffer, {
        metadata: {
          'Content-Type': mimeType,
        },
      })
      console.log('✅ File uploaded to R2 successfully')
    } catch (r2Error) {
      console.error('❌ R2 upload failed:', r2Error)
      console.error('R2 error details:', {
        message: r2Error instanceof Error ? r2Error.message : 'Unknown error',
        name: r2Error instanceof Error ? r2Error.name : 'Unknown',
        stack: r2Error instanceof Error ? r2Error.stack : 'No stack',
      })
      throw new Error(`R2 upload failed: ${r2Error instanceof Error ? r2Error.message : 'Unknown error'}`)
    }

    // Build public URL
    const baseUrl = publicUrl.endsWith('/') ? publicUrl.slice(0, -1) : publicUrl
    const fileUrl = `${baseUrl}/${filePath}`
    console.log(`🔗 Public URL: ${fileUrl}`)

    // Get file size
    const fileSize = fileBuffer.length

    // Get file extension
    const fileExtension = extension.substring(1) // Remove the dot

    // Insert into media_library table
    console.log('💾 Inserting media record into database')
    const { data: mediaData, error: mediaError } = await supabaseClient
      .from('media_library')
      .insert({
        filename: uniqueFilename,
        original_filename: filename,
        file_path: filePath,
        file_url: fileUrl,
        file_size: fileSize,
        mime_type: mimeType,
        file_extension: fileExtension,
        alt_text: altText,
        title: title,
        description: description,
        is_public: isPublic,
      })
      .select()
      .single()

    if (mediaError) {
      console.error('❌ Database error:', mediaError)
      throw new Error(`Database error: ${mediaError.message}`)
    }

    const mediaId = mediaData.id
    console.log(`✅ Media record created with ID: ${mediaId}`)

    // Create relationships if provided
    console.log('🔗 Creating relationships...')
    const relationshipPromises = []

    if (eventIds && eventIds.length > 0) {
      console.log(`📅 Adding ${eventIds.length} event relationships`)
      const eventRelations = eventIds.map(eventId => ({
        media_id: mediaId,
        event_id: eventId
      }))
      relationshipPromises.push(
        supabaseClient.from('media_events').insert(eventRelations)
      )
    }

    if (categoryIds && categoryIds.length > 0) {
      const categoryRelations = categoryIds.map(categoryId => ({
        media_id: mediaId,
        category_id: categoryId
      }))
      relationshipPromises.push(
        supabaseClient.from('media_categories').insert(categoryRelations)
      )
    }

    if (finalistIds && finalistIds.length > 0) {
      const finalistRelations = finalistIds.map(finalistId => ({
        media_id: mediaId,
        finalist_id: finalistId
      }))
      relationshipPromises.push(
        supabaseClient.from('media_finalists').insert(finalistRelations)
      )
    }

    if (sponsorIds && sponsorIds.length > 0) {
      const sponsorRelations = sponsorIds.map(sponsorId => ({
        media_id: mediaId,
        sponsor_id: sponsorId
      }))
      relationshipPromises.push(
        supabaseClient.from('media_sponsors').insert(sponsorRelations)
      )
    }

    if (tagIds && tagIds.length > 0) {
      const tagRelations = tagIds.map(tagId => ({
        media_id: mediaId,
        tag_id: tagId
      }))
      relationshipPromises.push(
        supabaseClient.from('media_tags').insert(tagRelations)
      )
    }

    if (judgeIds && judgeIds.length > 0) {
      const judgeRelations = judgeIds.map(judgeId => ({
        media_id: mediaId,
        judge_id: judgeId
      }))
      relationshipPromises.push(
        supabaseClient.from('media_judges').insert(judgeRelations)
      )
    }

    // Execute all relationship inserts
    if (relationshipPromises.length > 0) {
      console.log(`⏳ Executing ${relationshipPromises.length} relationship inserts`)
      const relationshipResults = await Promise.all(relationshipPromises)
      const relationshipErrors = relationshipResults.filter(result => result.error)
      
      if (relationshipErrors.length > 0) {
        console.warn('⚠️ Some relationships failed to create:', relationshipErrors)
        // Don't fail the entire request for relationship errors
      } else {
        console.log('✅ All relationships created successfully')
      }
    }

    const response: UploadResponse = {
      success: true,
      mediaId: mediaId,
      fileUrl: fileUrl,
    }

    console.log('🎉 Upload completed successfully:', { mediaId, fileUrl })

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Upload error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    const response: UploadResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }

    return new Response(
      JSON.stringify(response),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
