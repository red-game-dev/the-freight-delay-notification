/**
 * Client-side Environment Variables
 * Safe accessor for NEXT_PUBLIC_* variables in client components
 *
 * Note: In Next.js, NEXT_PUBLIC_* variables are embedded at build time,
 * so they must be accessed via process.env directly in client components
 */

import { logger } from "@/core/base/utils/Logger";

interface ClientEnv {
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?: string;
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
  NEXT_PUBLIC_API_URL?: string;
  NEXT_PUBLIC_APP_URL?: string;
  NODE_ENV: 'development' | 'production' | 'test';
  isDevelopment: boolean;
  isProduction: boolean;
}

/**
 * Get client-side environment variables
 * These are safe to use in 'use client' components
 */
export const clientEnv: ClientEnv = {
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};

/**
 * Validate that required client env vars are present
 */
export function validateClientEnv(required: (keyof ClientEnv)[]): void {
  const missing = required.filter(key => !clientEnv[key]);

  if (missing.length > 0) {
    logger.warn(
      `⚠️ Missing client environment variables: ${missing.join(', ')}\n` +
      'These should be defined in .env.local with NEXT_PUBLIC_ prefix'
    );
  }
}
