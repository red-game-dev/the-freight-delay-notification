/**
 * Routes API
 * GET /api/routes - List all delivery routes with current traffic status
 */

import { createClient } from '@supabase/supabase-js';
import { env } from '@/infrastructure/config/EnvValidator';
import { createApiHandler } from '@/core/infrastructure/http';
import { Result } from '@/core/base/utils/Result';

/**
 * GET /api/routes
 * Returns all routes with their latest traffic snapshot
 */
export const GET = createApiHandler(async () => {
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from('routes')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return Result.fail(new Error(error.message));
  }

  return Result.ok(data || []);
});
