// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import node from '@astrojs/node';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  site: 'https://yoursite.com/',
  output: 'server', // Changed from 'static' to support API routes and admin pages
  adapter: node({
    mode: 'standalone',
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
  integrations: [react(), sitemap()],
  build: {
    assets: '_astro',
    assetsPrefix: '/',
    inlineStylesheets: 'auto',
  },
  vite: {
    // @ts-ignore - tailwindcss plugin type compatibility
    plugins: [tailwindcss()],
    build: {
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          // Generate stable chunk names for better caching
          chunkFileNames: '_astro/[name]-[hash].js',
          entryFileNames: '_astro/[name]-[hash].js',
          assetFileNames: '_astro/[name]-[hash][extname]'
        }
      }
    }
  },
});
