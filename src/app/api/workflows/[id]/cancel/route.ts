/**
 * Cancel Workflow API
 * POST /api/workflows/:id/cancel - Cancel a running workflow
 */

import { createParamApiHandler } from '@/core/infrastructure/http';
import { getTemporalClient } from '@/infrastructure/temporal/TemporalClient';
import { success } from '@/core/base/utils/Result';

export const POST = createParamApiHandler(async (request, context) => {
  const params = await context.params;
  const workflowId = params.id;

  try {
    const client = await getTemporalClient();

    // Get workflow handle
    const handle = client.workflow.getHandle(workflowId);

    // Cancel the workflow
    await handle.cancel();

    console.log(`✅ Workflow ${workflowId} canceled by user request`);

    return success({
      message: 'Workflow canceled successfully',
      workflowId,
    });
  } catch (error: any) {
    console.error(`❌ Failed to cancel workflow ${workflowId}:`, error);

    // If workflow doesn't exist or already completed, return success
    if (error.message?.includes('not found') || error.message?.includes('already completed')) {
      return success({
        message: 'Workflow already completed or does not exist',
        workflowId,
      });
    }

    throw error;
  }
});
