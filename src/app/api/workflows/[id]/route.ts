/**
 * Workflow Detail API Routes
 * GET /api/workflows/[id] - Get workflow by ID
 */

import { getDatabaseService } from '@/infrastructure/database/DatabaseService';
import { createParamApiHandler } from '@/core/infrastructure/http';

/**
 * GET /api/workflows/[id]
 * Get workflow execution by ID
 */
export const GET = createParamApiHandler(async (request, context) => {
  const params = await context.params;
  const db = getDatabaseService();
  return await db.getWorkflowExecutionById(params.id);
});
