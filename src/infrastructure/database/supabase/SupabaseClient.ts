/**
 * Supabase Database Client
 * Provides access to Supabase PostgreSQL database with proper typing and error handling
 */

import { createClient } from '@supabase/supabase-js';
import { env } from '../../config/EnvValidator';

/**
 * Regular Supabase client with anon key (for client-side usage)
 * Subject to Row Level Security policies
 */
export const supabase = createClient(
  env.SUPABASE_URL || '',
  env.SUPABASE_ANON_KEY || ''
);

/**
 * Admin Supabase client with service role key (for server-side usage)
 * Bypasses Row Level Security policies - use with caution
 */
export const supabaseAdmin = createClient(
  env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * Check if Supabase is properly configured
 */
export function isSupabaseConfigured(): boolean {
  return !!(env.SUPABASE_URL && env.SUPABASE_ANON_KEY);
}

/**
 * Check if admin client is properly configured
 */
export function isSupabaseAdminConfigured(): boolean {
  return !!(env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}