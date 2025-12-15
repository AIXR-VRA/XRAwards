// @ts-nocheck - Deno edge function
/**
 * Send Communication Edge Function
 * Sends emails to contacts using Resend API with batch support
 * 
 * Called with a communication_id to send pending emails
 * Uses EdgeRuntime.waitUntil() for background processing
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const RESEND_API_KEY = Deno.env.get('resend')
const RESEND_BATCH_LIMIT = 100 // Resend batch API limit
const RATE_LIMIT_DELAY_MS = 500 // 500ms between batches (safe for 2 req/sec limit)
const FROM_DOMAIN = 'awards@aixr.org'
const REPLY_TO = 'awards@aixr.org'

interface SendRequest {
  communication_id: string
}

interface Contact {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  organization: string | null
  unsubscribe_token: string | null
}

interface ResendEmail {
  from: string
  to: string[]
  reply_to: string
  subject: string
  html: string
  text?: string
  tags?: Array<{ name: string; value: string }>
  headers?: Record<string, string>
}

interface ResendBatchResponse {
  data: Array<{ id: string }> | null
  error?: { message: string }
}

serve(async (req: Request) => {
  console.log('🚀 send-communication invoked:', req.method)
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validate Resend API key
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured')
    }

    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client with user auth
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Verify user authentication
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      console.error('❌ Authentication failed:', authError?.message)
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    console.log('✅ User authenticated:', user.email)

    // Parse request body
    const body: SendRequest = await req.json()
    const { communication_id } = body

    if (!communication_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing communication_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    console.log('📧 Processing communication:', communication_id)

    // Fetch communication record with sender profile
    const { data: communication, error: commError } = await supabaseClient
      .from('communications')
      .select(`
        *,
        user_profiles!sent_by (
          first_name,
          last_name
        )
      `)
      .eq('id', communication_id)
      .single()

    if (commError || !communication) {
      console.error('❌ Communication not found:', commError?.message)
      return new Response(
        JSON.stringify({ success: false, error: 'Communication not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build sender "From" name (e.g., "Daniel from XR Awards")
    const senderProfile = communication.user_profiles
    const senderFirstName = senderProfile?.first_name || 'XR Awards'
    const fromName = senderProfile?.first_name 
      ? `${senderFirstName} from XR Awards`
      : 'XR Awards'
    const fromEmail = `${fromName} <${FROM_DOMAIN}>`
    console.log('📨 Sending as:', fromEmail)

    // Check if already sending or completed
    if (communication.status === 'sending') {
      return new Response(
        JSON.stringify({ success: false, error: 'Communication is already being sent' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (communication.status === 'completed') {
      return new Response(
        JSON.stringify({ success: false, error: 'Communication has already been sent' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update status to 'sending'
    await supabaseClient
      .from('communications')
      .update({ status: 'sending' })
      .eq('id', communication_id)

    // Fetch pending recipients with contact info
    const { data: recipients, error: recipientsError } = await supabaseClient
      .from('communication_recipients')
      .select(`
        id,
        contact_id,
        contacts (
          id,
          email,
          first_name,
          last_name,
          organization,
          unsubscribe_token
        )
      `)
      .eq('communication_id', communication_id)
      .eq('status', 'pending')

    if (recipientsError) {
      console.error('❌ Error fetching recipients:', recipientsError.message)
      throw new Error('Failed to fetch recipients')
    }

    if (!recipients || recipients.length === 0) {
      console.log('ℹ️ No pending recipients found')
      await supabaseClient
        .from('communications')
        .update({ status: 'completed', sent_at: new Date().toISOString() })
        .eq('id', communication_id)

      return new Response(
        JSON.stringify({ success: true, message: 'No pending recipients to send to' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📬 Found ${recipients.length} pending recipients`)

    // Return immediately, process in background
    const promise = sendEmailsInBackground(
      supabaseClient,
      communication,
      recipients,
      fromEmail
    )

    // Use EdgeRuntime.waitUntil for background processing
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      EdgeRuntime.waitUntil(promise)
    } else {
      // Fallback for local testing - await directly
      await promise
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Emails are being sent in the background',
        communication_id: communication_id,
        recipient_count: recipients.length
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

/**
 * Background task to send emails in batches
 */
async function sendEmailsInBackground(
  supabase: any,
  communication: any,
  recipients: any[],
  fromEmail: string
) {
  console.log('🔄 Starting background email sending...')
  
  let sentCount = 0
  let failedCount = 0

  try {
    // Chunk recipients into batches of 100 (Resend limit)
    const batches = chunkArray(recipients, RESEND_BATCH_LIMIT)
    console.log(`📦 Split into ${batches.length} batches`)

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i]
      console.log(`📤 Processing batch ${i + 1}/${batches.length} (${batch.length} emails)`)

      try {
        const { sent, failed } = await sendBatch(
          supabase,
          communication,
          batch,
          fromEmail
        )
        sentCount += sent
        failedCount += failed

        // Update counts in database
        await supabase
          .from('communications')
          .update({ 
            sent_count: sentCount,
            failed_count: failedCount
          })
          .eq('id', communication.id)

        // Rate limit delay between batches (except for last batch)
        if (i < batches.length - 1) {
          console.log(`⏳ Waiting ${RATE_LIMIT_DELAY_MS}ms before next batch...`)
          await sleep(RATE_LIMIT_DELAY_MS)
        }
      } catch (batchError) {
        console.error(`❌ Batch ${i + 1} failed:`, batchError)
        // Mark all recipients in this batch as failed
        failedCount += batch.length
        for (const recipient of batch) {
          await supabase
            .from('communication_recipients')
            .update({
              status: 'failed',
              error_message: batchError instanceof Error ? batchError.message : 'Batch send failed'
            })
            .eq('id', recipient.id)
        }
      }
    }

    // Determine final status
    const finalStatus = failedCount === 0 
      ? 'completed' 
      : sentCount === 0 
        ? 'failed' 
        : 'partially_failed'

    // Update communication status
    await supabase
      .from('communications')
      .update({
        status: finalStatus,
        sent_count: sentCount,
        failed_count: failedCount,
        sent_at: new Date().toISOString()
      })
      .eq('id', communication.id)

    console.log(`✅ Email sending complete. Sent: ${sentCount}, Failed: ${failedCount}, Status: ${finalStatus}`)

  } catch (error) {
    console.error('❌ Background task error:', error)
    
    // Update communication status to failed
    await supabase
      .from('communications')
      .update({
        status: 'failed',
        sent_count: sentCount,
        failed_count: failedCount
      })
      .eq('id', communication.id)
  }
}

/**
 * Send a batch of emails via Resend
 */
async function sendBatch(
  supabase: any,
  communication: any,
  recipients: any[],
  fromEmail: string
): Promise<{ sent: number; failed: number }> {
  // Prepare emails for batch send
  const emails: ResendEmail[] = recipients.map(recipient => {
    const contact = recipient.contacts as Contact
    const recipientName = contact.first_name || 'there'
    
    // Replace recipient-specific placeholders in HTML
    let html = communication.html_content
      .replace(/\{\{recipient_name_or_default\}\}/g, recipientName)
      .replace(/\{\{recipient_email\}\}/g, contact.email)
      .replace(/\{\{organization_name\}\}/g, contact.organization || '')
    
    // Add unsubscribe link if token exists
    if (contact.unsubscribe_token) {
      const unsubscribeUrl = `https://xrawards.aixr.org/unsubscribe?token=${contact.unsubscribe_token}`
      html = html.replace(/\{\{\s*unsubscribe\s*\}\}/gi, unsubscribeUrl)
    }

    return {
      from: fromEmail,
      to: [contact.email],
      reply_to: REPLY_TO,
      subject: communication.subject,
      html: html,
      text: communication.text_content || undefined,
      tags: [
        { name: 'communication_id', value: communication.id },
        { name: 'contact_id', value: contact.id }
      ]
    }
  })

  // Send batch via Resend API
  console.log(`📧 Sending batch of ${emails.length} emails via Resend...`)
  
  const response = await fetch('https://api.resend.com/emails/batch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`
    },
    body: JSON.stringify(emails)
  })

  const result: ResendBatchResponse = await response.json()

  if (!response.ok || result.error) {
    console.error('❌ Resend batch error:', result.error?.message || response.statusText)
    throw new Error(result.error?.message || 'Resend API error')
  }

  // Process results
  let sent = 0
  let failed = 0
  const emailIds = result.data || []

  for (let i = 0; i < recipients.length; i++) {
    const recipient = recipients[i]
    const emailId = emailIds[i]?.id

    if (emailId) {
      // Successfully queued
      await supabase
        .from('communication_recipients')
        .update({
          status: 'sent',
          resend_email_id: emailId,
          sent_at: new Date().toISOString()
        })
        .eq('id', recipient.id)
      sent++
    } else {
      // Failed
      await supabase
        .from('communication_recipients')
        .update({
          status: 'failed',
          error_message: 'No email ID returned from Resend'
        })
        .eq('id', recipient.id)
      failed++
    }
  }

  console.log(`✅ Batch complete. Sent: ${sent}, Failed: ${failed}`)
  return { sent, failed }
}

/**
 * Split array into chunks of specified size
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

