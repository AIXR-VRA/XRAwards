/// <reference types="astro/client" />

/**
 * Environment Variables Type Definitions
 * 
 * This provides TypeScript IntelliSense for environment variables.
 * Add any additional environment variables your project uses here.
 */
interface ImportMetaEnv {
  // Supabase (Server-side)
  readonly SUPABASE_URL: string;
  readonly SUPABASE_ANON_KEY: string;

  // Supabase (Client-side - PUBLIC variables)
  readonly PUBLIC_SUPABASE_URL?: string;
  readonly PUBLIC_SUPABASE_ANON_KEY?: string;

  // R2 Storage (Public URL for serving images)
  readonly PUBLIC_R2_PUBLIC_URL?: string;
  
  // R2 Upload Credentials (Server-side only)
  readonly R2_ACCOUNT_ID?: string;
  readonly R2_ACCESS_KEY_ID?: string;
  readonly R2_SECRET_ACCESS_KEY?: string;
  readonly R2_BUCKET_NAME?: string;

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

