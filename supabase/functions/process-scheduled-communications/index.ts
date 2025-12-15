// @ts-nocheck - Deno edge function
/**
 * Process Scheduled Communications Edge Function
 * 
 * Called by pg_cron every minute to check for scheduled communications
 * that are ready to be sent (scheduled_at <= NOW() and status = 'scheduled')
 * 
 * For each ready communication, it calls the send-communication function
 * to actually send the emails.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req: Request) => {
  console.log('🕐 process-scheduled-communications invoked:', req.method)
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role for cron access
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    
    if (!serviceRoleKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured')
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Find scheduled communications that are ready to send
    const now = new Date().toISOString()
    console.log(`📅 Checking for scheduled communications ready at: ${now}`)

    const { data: scheduledComms, error: queryError } = await supabase
      .from('communications')
      .select('id, subject, scheduled_at, sent_by')
      .eq('status', 'scheduled')
      .lte('scheduled_at', now)
      .order('scheduled_at', { ascending: true })

    if (queryError) {
      console.error('❌ Error querying scheduled communications:', queryError.message)
      throw new Error('Failed to query scheduled communications')
    }

    if (!scheduledComms || scheduledComms.length === 0) {
      console.log('✅ No scheduled communications ready to send')
      return new Response(
        JSON.stringify({ success: true, message: 'No scheduled communications to process', processed: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📬 Found ${scheduledComms.length} scheduled communication(s) ready to send`)

    // Process each scheduled communication
    const results: Array<{ id: string; success: boolean; error?: string }> = []

    for (const comm of scheduledComms) {
      console.log(`🚀 Triggering send for communication: ${comm.id} (${comm.subject})`)
      
      try {
        // Update status to 'pending' before triggering send
        // This prevents duplicate processing if cron runs again before send completes
        await supabase
          .from('communications')
          .update({ status: 'pending' })
          .eq('id', comm.id)

        // Call the send-communication function
        const sendResponse = await fetch(
          `${supabaseUrl}/functions/v1/send-communication`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${serviceRoleKey}`
            },
            body: JSON.stringify({ communication_id: comm.id })
          }
        )

        const sendResult = await sendResponse.json()

        if (!sendResponse.ok || !sendResult.success) {
          console.error(`❌ Failed to trigger send for ${comm.id}:`, sendResult.error)
          results.push({ id: comm.id, success: false, error: sendResult.error || 'Unknown error' })
          
          // Revert status to scheduled so it can be retried
          await supabase
            .from('communications')
            .update({ status: 'scheduled' })
            .eq('id', comm.id)
        } else {
          console.log(`✅ Successfully triggered send for ${comm.id}`)
          results.push({ id: comm.id, success: true })
        }

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        console.error(`❌ Error processing communication ${comm.id}:`, errorMessage)
        results.push({ id: comm.id, success: false, error: errorMessage })
        
        // Revert status to scheduled so it can be retried
        await supabase
          .from('communications')
          .update({ status: 'scheduled' })
          .eq('id', comm.id)
      }
    }

    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length

    console.log(`✅ Processed ${results.length} communications. Success: ${successCount}, Failed: ${failCount}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${results.length} scheduled communication(s)`,
        processed: results.length,
        success_count: successCount,
        failed_count: failCount,
        results
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


