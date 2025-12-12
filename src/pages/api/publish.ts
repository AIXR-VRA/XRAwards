/**
 * Publish API Endpoint
 * POST /api/publish
 * Triggers a GitHub Actions workflow to rebuild and deploy the site
 */

import type { APIRoute } from 'astro';
import { requireApiAuth } from '../../utils/supabase';

const GITHUB_REPO = 'AIXR-VRA/XRAwards';
const WORKFLOW_FILE = 'manual-deploy.yml';

export const POST: APIRoute = async ({ request, cookies }) => {
  // Require authentication
  const authResult = await requireApiAuth(cookies, request);
  
  if (!authResult.authenticated) {
    return new Response(
      JSON.stringify({ error: authResult.error }),
      { status: authResult.status, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Get GitHub PAT from environment
  // Try multiple ways to access the environment variable for Cloudflare Pages compatibility
  const githubToken = 
    import.meta.env.GH_PAT || 
    (typeof process !== 'undefined' ? process.env.GH_PAT : undefined);
  
  if (!githubToken) {
    console.error('GH_PAT environment variable is missing or empty');
    console.error('Available env vars:', Object.keys(import.meta.env).filter(k => k.includes('GH') || k.includes('GITHUB')));
    return new Response(
      JSON.stringify({ 
        error: 'GitHub token not configured',
        details: 'GH_PAT environment variable is missing or empty. Please ensure it is set in Cloudflare Pages environment variables for the production environment.'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  if (githubToken.trim() === '') {
    console.error('GH_PAT environment variable is empty string');
    return new Response(
      JSON.stringify({ 
        error: 'GitHub token not configured',
        details: 'GH_PAT environment variable exists but is empty. Please update the secret in Cloudflare Pages settings.'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Trigger the GitHub Actions workflow
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
            reason: 'Manual publish from admin dashboard'
          }
        })
      }
    );

    if (response.status === 204) {
      // 204 No Content means success for workflow dispatch
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Deployment triggered successfully. The site will be updated in a few minutes.' 
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Handle errors
    const errorData = await response.json().catch(() => ({}));
    console.error('GitHub API error:', response.status, errorData);
    
    return new Response(
      JSON.stringify({ 
        error: errorData.message || 'Failed to trigger deployment',
        details: `GitHub API returned status ${response.status}`
      }),
      { status: response.status, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Publish API error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to trigger deployment',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// GET endpoint to check the status of recent workflow runs
export const GET: APIRoute = async ({ cookies, request }) => {
  // Require authentication
  const authResult = await requireApiAuth(cookies, request);
  
  if (!authResult.authenticated) {
    return new Response(
      JSON.stringify({ error: authResult.error }),
      { status: authResult.status, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Get GitHub PAT from environment
  // Try multiple ways to access the environment variable for Cloudflare Pages compatibility
  const githubToken = 
    import.meta.env.GH_PAT || 
    (typeof process !== 'undefined' ? process.env.GH_PAT : undefined);
  
  if (!githubToken) {
    console.error('GH_PAT environment variable is missing or empty');
    return new Response(
      JSON.stringify({ 
        error: 'GitHub token not configured',
        details: 'GH_PAT environment variable is missing or empty. Please ensure it is set in Cloudflare Pages environment variables for the production environment.'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  if (githubToken.trim() === '') {
    console.error('GH_PAT environment variable is empty string');
    return new Response(
      JSON.stringify({ 
        error: 'GitHub token not configured',
        details: 'GH_PAT environment variable exists but is empty. Please update the secret in Cloudflare Pages settings.'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Get recent workflow runs
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/${WORKFLOW_FILE}/runs?per_page=5`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `Bearer ${githubToken}`,
          'X-GitHub-Api-Version': '2022-11-28'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API returned ${response.status}`);
    }

    const data = await response.json();
    
    const runs = data.workflow_runs?.map((run: any) => ({
      id: run.id,
      status: run.status,
      conclusion: run.conclusion,
      created_at: run.created_at,
      updated_at: run.updated_at,
      html_url: run.html_url
    })) || [];

    return new Response(
      JSON.stringify({ runs }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Get workflow status error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get deployment status' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

