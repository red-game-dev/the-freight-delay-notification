/**
 * Workflow Detail API Routes
 * GET /api/workflows/[id] - Get workflow by ID
 */

import { getDatabaseService } from '@/infrastructure/database/DatabaseService';
import { createParamApiHandler } from '@/core/infrastructure/http';
import { Result } from '@/core/base/utils/Result';

/**
 * GET /api/workflows/[id]
 * Get workflow execution by ID - returns sanitized workflow data
 */
export const GET = createParamApiHandler(async (request, context) => {
  const params = await context.params;
  const db = getDatabaseService();

  // Transform result to only expose safe fields
  return Result.map(
    await db.getWorkflowExecutionById(params.id),
    (workflow) => workflow ? {
      id: workflow.id,
      workflow_id: workflow.workflow_id,
      delivery_id: workflow.delivery_id,
      status: workflow.status,
      started_at: workflow.started_at,
      completed_at: workflow.completed_at,
      error_message: workflow.error_message,
    } : null
  );
});
