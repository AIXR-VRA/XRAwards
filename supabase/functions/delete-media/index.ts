import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { S3Client } from "https://deno.land/x/s3_lite_client@0.7.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface DeleteRequest {
  mediaId: string;
}

interface DeleteResponse {
  success: boolean;
  error?: string;
}

serve(async (req) => {
  console.log('🚀 Delete edge function invoked:', req.method, req.url)
  
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

    // Parse request body
    console.log('📦 Parsing request body')
    const body: DeleteRequest = await req.json()
    const { mediaId } = body

    if (!mediaId) {
      console.error('❌ Missing mediaId')
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required field: mediaId' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('🔍 Fetching media record:', mediaId)

    // Get media record to find the file path
    const { data: mediaData, error: mediaError } = await supabaseClient
      .from('media_library')
      .select('file_path, filename')
      .eq('id', mediaId)
      .single()

    if (mediaError || !mediaData) {
      console.error('❌ Media not found:', mediaError?.message)
      return new Response(
        JSON.stringify({ success: false, error: 'Media not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('📄 Media record found:', {
      filename: mediaData.filename,
      filePath: mediaData.file_path,
    })

    // Initialize R2 client
    console.log('☁️ Initializing R2 client')
    const r2AccountId = Deno.env.get('R2_ACCOUNT_ID')
    const r2AccessKeyId = Deno.env.get('R2_ACCESS_KEY_ID')
    const r2SecretAccessKey = Deno.env.get('R2_SECRET_ACCESS_KEY')
    const bucketName = Deno.env.get('R2_BUCKET_NAME')

    console.log('🔑 R2 Configuration check:', {
      r2AccountId: r2AccountId ? 'Present' : 'Missing',
      r2AccessKeyId: r2AccessKeyId ? 'Present' : 'Missing',
      r2SecretAccessKey: r2SecretAccessKey ? 'Present' : 'Missing',
      bucketName: bucketName || 'Missing',
    })

    if (!r2AccountId || !r2AccessKeyId || !r2SecretAccessKey || !bucketName) {
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

    // Delete from R2
    console.log('🗑️ Deleting from R2:', mediaData.file_path)
    try {
      await r2Client.deleteObject(mediaData.file_path)
      console.log('✅ File deleted from R2 successfully')
    } catch (r2Error) {
      console.error('⚠️ R2 deletion failed (continuing anyway):', r2Error)
      // Continue even if R2 delete fails - we'll still delete the DB record
    }

    // Delete from database
    console.log('💾 Deleting from database')
    const { error: deleteError } = await supabaseClient
      .from('media_library')
      .delete()
      .eq('id', mediaId)

    if (deleteError) {
      console.error('❌ Database deletion failed:', deleteError)
      throw new Error(`Database error: ${deleteError.message}`)
    }

    console.log('✅ Media deleted from database successfully')

    const response: DeleteResponse = {
      success: true,
    }

    console.log('🎉 Delete completed successfully')

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Delete error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    const response: DeleteResponse = {
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

