/**
 * Workflow Statistics API Route
 * GET /api/workflows/stats - Get workflow execution statistics
 */

import { getDatabaseService } from '@/infrastructure/database/DatabaseService';
import { createApiHandler, getQueryParam } from '@/core/infrastructure/http';
import { Result } from '@/core/base/utils/Result';
import { logger } from '@/core/base/utils/Logger';

/**
 * GET /api/workflows/stats
 * Get workflow execution statistics from database
 */
export const GET = createApiHandler(async (request) => {
  const db = getDatabaseService();
  const deliveryId = getQueryParam(request, 'deliveryId');

  logger.info('📊 [Workflows Stats API] Fetching workflow statistics via DatabaseService');

  // Get workflow executions and transform to stats using Result.map
  const workflowsResult = deliveryId
    ? await db.listWorkflowExecutionsByDelivery(deliveryId)
    : await db.listWorkflowExecutions(100);

  return Result.map(workflowsResult, (workflows) => ({
    total: workflows.length,
    running: workflows.filter(w => w.status === 'running').length,
    completed: workflows.filter(w => w.status === 'completed').length,
    failed: workflows.filter(w => w.status === 'failed').length,
  }));
});
