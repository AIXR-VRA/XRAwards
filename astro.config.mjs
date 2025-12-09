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
  trailingSlash: 'always', // Ensure URLs always have trailing slashes for Cloudflare Pages compatibility
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