import type { APIRoute } from 'astro';

// Allowed domains for image proxying (prevent SSRF attacks)
const ALLOWED_DOMAINS = [
  'pub-', // R2 public bucket URLs start with pub-
  '.r2.dev',
  '.cloudflarestorage.com',
];

function isAllowedUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return ALLOWED_DOMAINS.some(domain => url.hostname.includes(domain));
  } catch {
    return false;
  }
}

export const GET: APIRoute = async ({ url }) => {
  const imageUrl = url.searchParams.get('url');
  
  if (!imageUrl) {
    return new Response('Missing image URL', { status: 400 });
  }

  // Security: Only allow proxying from approved domains
  if (!isAllowedUrl(imageUrl)) {
    return new Response('URL not allowed', { status: 403 });
  }

  try {
    // Fetch the image from R2
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      return new Response('Image not found', { status: 404 });
    }

    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Return the image with CORS headers
    return new Response(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Max-Age': '3600',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('Error proxying image:', error);
    return new Response('Internal server error', { status: 500 });
  }
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Max-Age': '3600',
    },
  });
};
