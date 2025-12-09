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
  output: 'hybrid', // Hybrid mode: pre-rendered pages served as static files, admin/API routes use server rendering
  adapter: cloudflare(),
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