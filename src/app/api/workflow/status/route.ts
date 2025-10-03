/**
 * API Endpoint to Query Workflow Status
 * GET /api/workflow/status?workflowId=xxx
 */

import { createApiHandler, getQueryParam } from '@/core/infrastructure/http';
import { getTemporalClient } from '@/infrastructure/temporal/TemporalClient';
import { getDatabaseService } from '@/infrastructure/database/DatabaseService';
import { logger, getErrorMessage, hasMessage, hasName, hasCause } from '@/core/base/utils/Logger';
import { Result } from '@/core/base/utils/Result';
import { ValidationError, NotFoundError, InfrastructureError } from '@/core/base/errors/BaseError';
import type { WorkflowStatus } from '@/core/types';

export const GET = createApiHandler(async (request) => {
  const workflowId = getQueryParam(request, 'workflowId');

  if (!workflowId) {
    return Result.fail(new ValidationError('Missing required parameter: workflowId'));
  }

    // Get Temporal client
    const client = await getTemporalClient();

    // Get workflow handle
    const handle = client.workflow.getHandle(workflowId);

    let internalStatus = null;
    let description = null;
    let error: string | null = null;

    // Try to query workflow - handle case where workflow doesn't exist
    try {
      // Get workflow execution info first (this will throw if workflow doesn't exist)
      description = await handle.describe();

      // Only query if workflow is still running
      if (description.status.name === 'RUNNING') {
        try {
          internalStatus = await handle.query('workflowStatus');
        } catch (queryError: unknown) {
          // Handle query failures (e.g., workflow task failed)
          const errorMsg = getErrorMessage(queryError);
          const causeMsg = hasCause(queryError) && hasMessage(queryError.cause) ? (queryError.cause as { message: string }).message : '';

          if (errorMsg.includes('Workflow Task in failed state')) {
            logger.warn(`⚠️ Cannot query workflow ${workflowId} - task in failed state`);

            // Check if it's a non-determinism error
            if (causeMsg.includes('Nondeterminism') || causeMsg.includes('does not match')) {
              logger.warn(`⚠️ Non-determinism detected: ${causeMsg}`);
              error = 'Workflow code was updated after this workflow started. Please cancel this workflow and start a new one.';
            } else {
              error = 'Workflow task in failed state - check Temporal UI for details';
            }
            // Continue without internal status - we'll use the error message
          } else {
            return Result.fail(new InfrastructureError(`Failed to query workflow: ${getErrorMessage(queryError)}`, { cause: queryError }));
          }
        }
      }
    } catch (error: unknown) {
      // Workflow not found - check database for completed workflow
      if (hasMessage(error) && error.message.includes('not found') || hasName(error) && error.name === 'WorkflowNotFoundError') {
        logger.info(`⚠️ Workflow ${workflowId} not found in Temporal, checking database...`);

        const db = getDatabaseService();
        const workflowExecution = await db.getWorkflowExecutionByWorkflowId(workflowId);

        if (workflowExecution.success && workflowExecution.value) {
          // Return data from database
          return Result.ok({
            success: true,
            id: workflowId,
            workflow_id: workflowId,
            delivery_id: workflowExecution.value.delivery_id,
            status: workflowExecution.value.status === 'completed' ? 'completed' : 'failed',
            started_at: workflowExecution.value.started_at,
            completed_at: workflowExecution.value.completed_at,
            error: workflowExecution.value.error_message || null,
            steps: null, // Not stored in database
            result: null, // Not stored in database
            source: 'database', // Indicate this came from DB, not Temporal
          });
        }

        // Workflow not in Temporal or database - return not found
        return Result.fail(new NotFoundError(`Workflow does not exist in Temporal or database history: ${workflowId}`));
      }

      // Other error - convert to infrastructure error
      return Result.fail(new InfrastructureError(`Failed to query workflow: ${getErrorMessage(error)}`, { cause: error }));
    }

    // At this point, description should exist (we would have returned earlier if not found)
    if (!description) {
      return Result.fail(new InfrastructureError('Unexpected: description is null after successful query'));
    }

    // Determine workflow status based on execution state
    let status: WorkflowStatus = 'running';
    let result = null;

    if (description.status.name === 'COMPLETED') {
      try {
        result = await handle.result();
        status = result?.success === false ? 'failed' : 'completed';
      } catch (err: unknown) {
        status = 'failed';
        error = getErrorMessage(err);
      }
    } else if (description.status.name === 'FAILED') {
      status = 'failed';
      // Try to get the failure reason
      try {
        await handle.result();
      } catch (err: unknown) {
        if (hasMessage(err)) {
          error = err.message;
        } else if (hasCause(err) && hasMessage(err.cause)) {
          error = (err.cause as { message: string }).message;
        } else {
          error = 'Workflow failed';
        }
      }
    } else if (description.status.name === 'CANCELLED') {
      status = 'cancelled';
      error = 'Workflow was cancelled';
    } else if (description.status.name === 'TERMINATED') {
      status = 'cancelled'; // Treat terminated as cancelled for UI purposes
      error = 'Workflow was terminated';
    } else if (description.status.name === 'TIMED_OUT') {
      status = 'timed_out';
    } else if (description.status.name === 'RUNNING' && !internalStatus) {
      // Workflow is running but we couldn't query it (likely due to failed task)
      status = 'failed';
      error = 'Workflow task in failed state - check Temporal UI for details';
    }

    // Return normalized response that matches frontend expectations
    return Result.ok({
      success: true,
      id: workflowId,
      workflow_id: workflowId,
      delivery_id: result?.deliveryId || null,
      status,
      started_at: description.startTime,
      completed_at: description.closeTime || null,
      error,
      steps: result?.steps || null,
      internalStatus, // Keep internal status for debugging
      result, // Keep full result for reference
      source: 'temporal', // Indicate this came from Temporal
    });
});
