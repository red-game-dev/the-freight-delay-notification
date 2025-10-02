/**
 * Supabase Database Client
 * Legacy client exports - kept for backward compatibility
 *
 * Note: The adapter pattern is now handled in SupabaseDatabaseAdapter
 * For new code, use DatabaseService:
 * ```typescript
 * import { getDatabaseService } from '@/infrastructure/database';
 * const db = getDatabaseService();
 * ```
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '../../config/EnvValidator';

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
  return !!(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
}

// Lazy-initialize clients only when needed
let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

/**
 * Regular Supabase client with anon key (for client-side usage)
 * Subject to Row Level Security policies
 */
export const supabase = (() => {
  if (!_supabase && isSupabaseConfigured()) {
    _supabase = createClient(env.SUPABASE_URL!, env.SUPABASE_ANON_KEY!);
  }
  return _supabase!;
})();

/**
 * Admin Supabase client with service role key (for server-side usage)
 * Bypasses Row Level Security policies - use with caution
 */
export const supabaseAdmin = (() => {
  if (!_supabaseAdmin && isSupabaseAdminConfigured()) {
    _supabaseAdmin = createClient(env.SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!);
  }
  return _supabaseAdmin!;
})();