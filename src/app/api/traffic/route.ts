/**
 * Traffic Snapshots API
 * GET /api/traffic - List recent traffic snapshots
 */

import { createClient } from '@supabase/supabase-js';
import { env } from '@/infrastructure/config/EnvValidator';
import { createApiHandler } from '@/core/infrastructure/http';
import { Result } from '@/core/base/utils/Result';

/**
 * GET /api/traffic
 * Returns recent traffic snapshots with route information
 */
export const GET = createApiHandler(async () => {
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from('traffic_snapshots')
    .select('*')
    .order('snapshot_at', { ascending: false })
    .limit(100);

  if (error) {
    return Result.fail(new Error(error.message));
  }

  return Result.ok(data || []);
});
