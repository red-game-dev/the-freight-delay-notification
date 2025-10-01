/**
 * Workflow Statistics API Route
 * GET /api/workflows/stats - Get workflow execution statistics
 */

import { createClient } from '@supabase/supabase-js';
import { env } from '@/infrastructure/config/EnvValidator';
import { createApiHandler } from '@/core/infrastructure/http';
import { Result } from '@/core/base/utils/Result';

/**
 * GET /api/workflows/stats
 * Get workflow execution statistics from database
 */
export const GET = createApiHandler(async (request) => {
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Get all workflow executions
  const { data: workflows, error } = await supabase
    .from('workflow_executions')
    .select('status');

  if (error) {
    return Result.fail(new Error(error.message));
  }

  // Calculate stats
  const stats = {
    total: workflows?.length || 0,
    running: workflows?.filter(w => w.status === 'running').length || 0,
    completed: workflows?.filter(w => w.status === 'completed').length || 0,
    failed: workflows?.filter(w => w.status === 'failed').length || 0,
  };

  return Result.ok(stats);
});
