// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';

import partytown from '@astrojs/partytown';

// https://astro.build/config
export default defineConfig({
  site: 'https://xrawards.aixr.org',
  output: 'server', // Server mode: pages with prerender: true are static, others are server-rendered
  adapter: cloudflare({
    routes: {
      extend: {
        // Exclude prerendered pages from worker - serve them as static files
        // This ensures Cloudflare Pages serves static HTML files directly
        // Only admin and API routes will go through the worker
        exclude: [
          { pattern: '/*' }, // Exclude all routes by default (serve as static)
        ],
        include: [
          { pattern: '/admin/*' }, // Admin pages need server rendering
          { pattern: '/api/*' }, // API routes need server rendering
        ],
      },
    },
  }),
  image: {
    // Disable remote image optimization entirely to avoid build failures
    // with broken Supabase storage URLs during build
    service: {
      entrypoint: 'astro/assets/services/noop',
    },
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
  integrations: [react(), sitemap(), partytown()],
  build: {
    assets: '_astro',
    assetsPrefix: '/',
    inlineStylesheets: 'auto',
  },
  vite: {
    // @ts-ignore - tailwindcss plugin type compatibility
    plugins: [tailwindcss()],
  },
});