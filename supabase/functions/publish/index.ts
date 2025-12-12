// @ts-nocheck - Deno edge function
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

const GITHUB_REPO = 'AIXR-VRA/XRAwards';
const WORKFLOW_FILE = 'manual-deploy.yml';

serve(async (req: Request) => {
  console.log('🚀 Publish edge function invoked:', req.method, req.url)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight request handled')
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('❌ Missing Authorization header')
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Supabase client
    console.log('🔧 Initializing Supabase client')
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )
    
    // Verify JWT token and get user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      console.error('❌ Authentication failed:', authError?.message)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    console.log('✅ User authenticated:', user.email)

    // Get GitHub PAT from environment
    const githubToken = Deno.env.get('GH_PAT')
    
    if (!githubToken || githubToken.trim() === '') {
      console.error('❌ GH_PAT environment variable is missing or empty')
      return new Response(
        JSON.stringify({ 
          error: 'GitHub token not configured',
          details: 'GH_PAT secret is not set in Supabase Edge Function secrets. Please configure it in Supabase Dashboard > Edge Functions > Secrets.'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Handle GET request - return recent workflow runs
    if (req.method === 'GET') {
      console.log('📋 GET request - fetching recent workflow runs')
      
      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/${WORKFLOW_FILE}/runs?per_page=5`,
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': `Bearer ${githubToken}`,
            'X-GitHub-Api-Version': '2022-11-28'
          }
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ GitHub API error:', response.status, errorData)
        throw new Error(`GitHub API returned ${response.status}: ${errorData.message || 'Unknown error'}`)
      }

      const data = await response.json()
      
      const runs = data.workflow_runs?.map((run: any) => ({
        id: run.id,
        status: run.status,
        conclusion: run.conclusion,
        created_at: run.created_at,
        updated_at: run.updated_at,
        html_url: run.html_url
      })) || []

      return new Response(
        JSON.stringify({ runs }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Handle POST request - trigger workflow
    if (req.method === 'POST') {
      console.log('🚀 POST request - triggering GitHub Actions workflow')
      
      const body = await req.json().catch(() => ({}))
      const reason = body.reason || 'Manual publish from admin dashboard'

      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/${WORKFLOW_FILE}/dispatches`,
        {
          method: 'POST',
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': `Bearer ${githubToken}`,
            'Content-Type': 'application/json',
            'X-GitHub-Api-Version': '2022-11-28'
          },
          body: JSON.stringify({
            ref: 'main',
            inputs: {
              reason: reason
            }
          })
        }
      )

      if (response.status === 204) {
        // 204 No Content means success for workflow dispatch
        console.log('✅ Workflow triggered successfully')
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Deployment triggered successfully. The site will be updated in a few minutes.' 
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Handle errors
      const errorData = await response.json().catch(() => ({}))
      console.error('❌ GitHub API error:', response.status, errorData)
      
      return new Response(
        JSON.stringify({ 
          error: errorData.message || 'Failed to trigger deployment',
          details: `GitHub API returned status ${response.status}`
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Method not allowed
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Publish edge function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

