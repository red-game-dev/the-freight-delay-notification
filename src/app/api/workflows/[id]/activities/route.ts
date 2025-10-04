/**
 * Workflow Activities API Route
 * GET /api/workflows/[id]/activities - Get activities for a workflow
 */

import { createParamApiHandler } from '@/core/infrastructure/http';
import { Result } from '@/core/base/utils/Result';
import { getTemporalClient } from '@/infrastructure/temporal/TemporalClient';
import { logger, hasMessage, hasName } from '@/core/base/utils/Logger';
import { NotFoundError } from '@/core/base/errors/BaseError';
import { validateParams } from '@/core/utils/validation';
import { workflowIdParamSchema } from '@/core/schemas/workflow';
import { setAuditContext } from '@/app/api/middleware/auditContext';

/**
 * GET /api/workflows/[id]/activities
 * Get activities/events for a workflow from Temporal
 */
export const GET = createParamApiHandler(async (request, { params }) => {
  await setAuditContext(request);
  // Validate params
  const paramsResult = validateParams(workflowIdParamSchema, params);
  if (!paramsResult.success) {
    return paramsResult;
  }

  const { id: workflowId } = paramsResult.value;

  try {
    const client = await getTemporalClient();
    const handle = client.workflow.getHandle(workflowId);

    // Get workflow description to check if it exists
    const description = await handle.describe();

    // Note: Temporal's fetchHistory() returns IHistory which requires special handling
    // For now, return basic workflow info without detailed activity breakdown
    // Full activity history would require using Temporal's history API directly
    logger.info(`📊 Workflow ${workflowId} exists with status: ${description.status.name}`);

    return Result.ok({
      workflowId,
      status: description.status.name,
      startTime: description.startTime,
      closeTime: description.closeTime,
      // Activity details would require more complex history parsing
      activities: [],
      message: 'Detailed activity tracking not yet implemented - use Temporal UI for full history',
    });

  } catch (error: unknown) {
    if (hasMessage(error) && error.message.includes('not found') || hasName(error) && error.name === 'WorkflowNotFoundError') {
      return Result.fail(new NotFoundError(`Workflow ${workflowId} not found in Temporal`));
    }

    logger.error(`❌ Failed to fetch workflow info for ${workflowId}:`, error);
    return Result.fail(new NotFoundError(`Workflow ${workflowId} not found`));
  }
});
