/// <reference types="astro/client" />

/**
 * Environment Variables Type Definitions
 * 
 * This provides TypeScript IntelliSense for environment variables.
 * Add any additional environment variables your project uses here.
 */
interface ImportMetaEnv {
  // Supabase
  readonly SUPABASE_URL: string;
  readonly SUPABASE_ANON_KEY: string;

  // R2 Storage
  readonly PUBLIC_R2_PUBLIC_URL?: string;

  // Site Configuration
  readonly PUBLIC_SITE_URL?: string;
  readonly PUBLIC_SITE_NAME?: string;

  // Analytics (Optional)
  readonly PUBLIC_GA_MEASUREMENT_ID?: string;
  readonly PUBLIC_PLAUSIBLE_DOMAIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

