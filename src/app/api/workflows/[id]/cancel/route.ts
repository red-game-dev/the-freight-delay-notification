/**
 * Cancel Workflow API
 * POST /api/workflows/:id/cancel - Cancel a running workflow
 * Body: { force?: boolean } - If true, terminates instead of graceful cancel
 */

import { createParamApiHandler, parseJsonBody } from '@/core/infrastructure/http';
import { getTemporalClient } from '@/infrastructure/temporal/TemporalClient';
import { success } from '@/core/base/utils/Result';

export const POST = createParamApiHandler(async (request, context) => {
  const params = await context.params;
  const workflowId = params.id;

  // Parse optional body for force parameter
  let force = false;
  try {
    const body = await parseJsonBody<{ force?: boolean }>(request);
    force = body.force ?? false;
  } catch {
    // Body is optional, default to graceful cancel
  }

  try {
    const client = await getTemporalClient();

    // Get workflow handle
    const handle = client.workflow.getHandle(workflowId);

    if (force) {
      // Force terminate the workflow immediately
      await handle.terminate('Force terminated by user');
      console.log(`✅ Workflow ${workflowId} force terminated by user request`);
    } else {
      // Graceful cancel via signal
      await handle.cancel();
      console.log(`✅ Workflow ${workflowId} canceled by user request`);
    }

    return success({
      message: force ? 'Workflow terminated successfully' : 'Workflow canceled successfully',
      workflowId,
      forced: force,
    });
  } catch (error: any) {
    console.error(`❌ Failed to ${force ? 'terminate' : 'cancel'} workflow ${workflowId}:`, error);

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
