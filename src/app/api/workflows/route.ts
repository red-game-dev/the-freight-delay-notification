/**
 * Workflows API Routes
 * GET /api/workflows - List all workflow executions
 */

import { createClient } from '@supabase/supabase-js';
import { env } from '@/infrastructure/config/EnvValidator';
import { getDatabaseService } from '@/infrastructure/database/DatabaseService';
import { createApiHandler, getQueryParam } from '@/core/infrastructure/http';
import { Result } from '@/core/base/utils/Result';

/**
 * GET /api/workflows
 * List workflow executions, optionally filtered by deliveryId
 */
export const GET = createApiHandler(async (request) => {
  const db = getDatabaseService();
  const deliveryId = getQueryParam(request, 'deliveryId');

  if (deliveryId) {
    return await db.listWorkflowExecutionsByDelivery(deliveryId);
  }

  // If no filter, return all workflow executions using Supabase directly
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from('workflow_executions')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(100);

  if (error) {
    return Result.fail(new Error(error.message));
  }

  return Result.ok(data || []);
});
