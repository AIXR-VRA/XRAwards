// @ts-nocheck - Deno edge function
/**
 * Resend Webhook Handler
 * Handles delivery status updates from Resend
 * 
 * Events handled (all 10 Resend webhook events):
 * - email.sent - Email has been sent by Resend
 * - email.delivered - Email was delivered to recipient's mail server
 * - email.bounced - Email bounced (permanent failure)
 * - email.complained - Recipient marked as spam
 * - email.opened - Email was opened (tracking)
 * - email.clicked - Link in email was clicked (tracking)
 * - email.failed - Email failed to send (quota, API errors, etc.)
 * - email.delivery_delayed - Temporary delivery issue
 * - email.scheduled - Email was scheduled (we handle scheduling ourselves)
 * - email.received - Inbound email received (not used for sending)
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHmac } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Resend webhook signing secret (optional but recommended)
const WEBHOOK_SECRET = Deno.env.get('RESEND_WEBHOOK_SECRET')

interface ResendWebhookPayload {
  type: string
  created_at: string
  data: {
    email_id: string
    from: string
    to: string[]
    subject: string
    created_at: string
    tags?: Record<string, string>
    // For email.bounced
    bounce?: {
      message: string
      type: string
      subType: string
    }
    // For email.failed
    failed?: {
      reason: string
    }
    // For email.clicked
    click?: {
      ipAddress: string
      link: string
      timestamp: string
      userAgent: string
    }
  }
}

serve(async (req: Request) => {
  console.log('🔔 Resend webhook received:', req.method)
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    // Get raw body for signature verification
    const rawBody = await req.text()
    
    // Verify webhook signature if secret is configured
    if (WEBHOOK_SECRET) {
      const svixId = req.headers.get('svix-id')
      const svixTimestamp = req.headers.get('svix-timestamp')
      const svixSignature = req.headers.get('svix-signature')

      if (!svixId || !svixTimestamp || !svixSignature) {
        console.error('❌ Missing Svix headers')
        return new Response(
          JSON.stringify({ error: 'Missing webhook signature headers' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Verify signature (Resend uses Svix for webhooks)
      const isValid = await verifyWebhookSignature(
        rawBody,
        svixId,
        svixTimestamp,
        svixSignature,
        WEBHOOK_SECRET
      )

      if (!isValid) {
        console.error('❌ Invalid webhook signature')
        return new Response(
          JSON.stringify({ error: 'Invalid webhook signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      console.log('✅ Webhook signature verified')
    }

    // Parse the webhook payload
    const payload: ResendWebhookPayload = JSON.parse(rawBody)
    console.log(`📨 Event type: ${payload.type}`)
    console.log(`📧 Email ID: ${payload.data.email_id}`)

    // Initialize Supabase client with service role for webhook processing
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Find the recipient record by Resend email ID
    const { data: recipient, error: findError } = await supabase
      .from('communication_recipients')
      .select('id, communication_id, status, opened_at, clicked_at')
      .eq('resend_email_id', payload.data.email_id)
      .single()

    if (findError || !recipient) {
      // Email not found in our system - could be from another source
      console.log(`ℹ️ Email ID ${payload.data.email_id} not found in communication_recipients`)
      return new Response(
        JSON.stringify({ received: true, processed: false, reason: 'Email not tracked' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📝 Found recipient record: ${recipient.id}`)

    // Process based on event type
    const updateData: Record<string, any> = {}

    switch (payload.type) {
      case 'email.sent':
        // Email was sent by Resend (already set when we send)
        // Only update if not already in a later state
        if (recipient.status === 'pending') {
          updateData.status = 'sent'
          updateData.sent_at = payload.created_at
        }
        break

      case 'email.delivered':
        // Email was delivered to recipient's mail server
        updateData.status = 'delivered'
        updateData.delivered_at = payload.created_at
        break

      case 'email.bounced':
        // Email bounced - permanent failure
        updateData.status = 'bounced'
        updateData.error_message = payload.data.bounce?.message || 'Email bounced'
        
        // Increment failed_count on the communication
        await updateCommunicationFailedCount(supabase, recipient.communication_id)
        
        // Optionally mark contact as inactive for permanent bounces
        if (payload.data.bounce?.type === 'Permanent') {
          await markContactBounced(supabase, recipient.id)
        }
        break

      case 'email.complained':
        // Recipient marked as spam
        updateData.status = 'bounced'
        updateData.error_message = 'Marked as spam'
        
        // Increment failed_count and potentially deactivate contact
        await updateCommunicationFailedCount(supabase, recipient.communication_id)
        await markContactBounced(supabase, recipient.id)
        break

      case 'email.opened':
        // Email was opened (tracking)
        // Set opened_at to first open time, increment open_count for subsequent opens
        if (!recipient.opened_at) {
          updateData.opened_at = payload.created_at
        }
        // Increment open count
        await incrementOpenCount(supabase, recipient.id)
        break

      case 'email.clicked':
        // Link was clicked (tracking)
        // Set clicked_at to first click time
        if (!recipient.clicked_at) {
          updateData.clicked_at = payload.created_at
        }
        // Store detailed click data
        await addClickData(supabase, recipient.id, {
          url: payload.data.click?.link || 'unknown',
          timestamp: payload.data.click?.timestamp || payload.created_at,
          ip: payload.data.click?.ipAddress || '',
          userAgent: payload.data.click?.userAgent || ''
        })
        break

      case 'email.failed':
        // Email failed to send (quota limits, API errors, etc.)
        updateData.status = 'failed'
        updateData.error_message = payload.data.failed?.reason || 'Email failed to send'
        
        // Increment failed_count on the communication
        await updateCommunicationFailedCount(supabase, recipient.communication_id)
        break

      case 'email.delivery_delayed':
        // Temporary delivery issue - just log, don't change status
        console.log(`⚠️ Delivery delayed for ${payload.data.email_id}`)
        break

      case 'email.scheduled':
        // Email was scheduled in Resend - we handle scheduling ourselves, just log
        console.log(`📅 Email scheduled in Resend: ${payload.data.email_id}`)
        break

      case 'email.received':
        // Resend received an inbound email - not relevant for our sending use case
        console.log(`📥 Inbound email received (not tracked): ${payload.data.email_id}`)
        break

      default:
        console.log(`ℹ️ Unhandled event type: ${payload.type}`)
    }

    // Apply updates if any
    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from('communication_recipients')
        .update(updateData)
        .eq('id', recipient.id)

      if (updateError) {
        console.error('❌ Error updating recipient:', updateError.message)
        throw new Error('Failed to update recipient status')
      }
      console.log(`✅ Updated recipient with:`, updateData)
    }

    return new Response(
      JSON.stringify({ received: true, processed: true, event: payload.type }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Webhook error:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

/**
 * Verify Svix webhook signature
 */
async function verifyWebhookSignature(
  payload: string,
  svixId: string,
  svixTimestamp: string,
  svixSignature: string,
  secret: string
): Promise<boolean> {
  try {
    // Decode the secret (base64)
    const secretBytes = Uint8Array.from(atob(secret.replace('whsec_', '')), c => c.charCodeAt(0))
    
    // Create the signed content
    const signedContent = `${svixId}.${svixTimestamp}.${payload}`
    
    // Create HMAC SHA256
    const key = await crypto.subtle.importKey(
      'raw',
      secretBytes,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    
    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(signedContent)
    )
    
    // Convert to base64
    const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    
    // Svix signature format: v1,<signature>
    const signatures = svixSignature.split(' ')
    for (const sig of signatures) {
      const [version, actualSig] = sig.split(',')
      if (version === 'v1' && actualSig === expectedSignature) {
        return true
      }
    }
    
    return false
  } catch (error) {
    console.error('Signature verification error:', error)
    return false
  }
}

/**
 * Increment failed count on communication record
 */
async function updateCommunicationFailedCount(supabase: any, communicationId: string) {
  const { data: comm } = await supabase
    .from('communications')
    .select('failed_count, sent_count')
    .eq('id', communicationId)
    .single()

  if (comm) {
    const newFailedCount = (comm.failed_count || 0) + 1
    const newSentCount = Math.max(0, (comm.sent_count || 0) - 1)
    
    await supabase
      .from('communications')
      .update({ 
        failed_count: newFailedCount,
        sent_count: newSentCount,
        status: newSentCount === 0 ? 'failed' : 'partially_failed'
      })
      .eq('id', communicationId)
  }
}

/**
 * Mark contact as inactive due to bounce/complaint
 */
async function markContactBounced(supabase: any, recipientId: string) {
  // Get the contact ID from the recipient
  const { data: recipient } = await supabase
    .from('communication_recipients')
    .select('contact_id')
    .eq('id', recipientId)
    .single()

  if (recipient?.contact_id) {
    // Mark contact as inactive
    await supabase
      .from('contacts')
      .update({ 
        is_active: false,
        metadata: supabase.sql`metadata || '{"bounce_reason": "hard_bounce"}'::jsonb`
      })
      .eq('id', recipient.contact_id)
    
    console.log(`⚠️ Marked contact ${recipient.contact_id} as inactive due to bounce`)
  }
}

/**
 * Increment open count for a recipient
 */
async function incrementOpenCount(supabase: any, recipientId: string) {
  const { data: recipient } = await supabase
    .from('communication_recipients')
    .select('open_count')
    .eq('id', recipientId)
    .single()

  const currentCount = recipient?.open_count || 0
  
  await supabase
    .from('communication_recipients')
    .update({ open_count: currentCount + 1 })
    .eq('id', recipientId)
  
  console.log(`👁️ Open count incremented to ${currentCount + 1} for recipient ${recipientId}`)
}

/**
 * Add click data to recipient record
 */
async function addClickData(
  supabase: any, 
  recipientId: string, 
  clickInfo: { url: string; timestamp: string; ip: string; userAgent: string }
) {
  // Get current click_data
  const { data: recipient } = await supabase
    .from('communication_recipients')
    .select('click_data')
    .eq('id', recipientId)
    .single()

  const currentData = recipient?.click_data || { clicks: [], click_count: 0 }
  
  // Add new click to array
  currentData.clicks.push({
    url: clickInfo.url,
    timestamp: clickInfo.timestamp,
    ip: clickInfo.ip,
    userAgent: clickInfo.userAgent
  })
  currentData.click_count = (currentData.click_count || 0) + 1

  // Update the record
  await supabase
    .from('communication_recipients')
    .update({ click_data: currentData })
    .eq('id', recipientId)
  
  console.log(`🔗 Click recorded for ${recipientId}: ${clickInfo.url} (total: ${currentData.click_count})`)
}

