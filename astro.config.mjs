// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://yoursite.com/',
  output: 'static',
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
  integrations: [sitemap()],
  build: {
    assets: '_astro',
    assetsPrefix: '/',
    inlineStylesheets: 'auto',
  },
  vite: {
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
