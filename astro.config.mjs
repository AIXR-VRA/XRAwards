// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  site: 'https://xr-awards.daniel-12f.workers.dev/',
  output: 'server', // Changed from 'static' to support API routes and admin pages
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
  integrations: [react(), sitemap()],
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
