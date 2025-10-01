/**
 * API Endpoint to Query Workflow Status
 * GET /api/workflow/status?workflowId=xxx
 */

import { NextRequest } from 'next/server';
import { getTemporalClient } from '@/infrastructure/temporal/TemporalClient';
import { getDatabaseService } from '@/infrastructure/database/DatabaseService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get('workflowId');

    if (!workflowId) {
      return Response.json(
        { error: 'Missing required parameter: workflowId' },
        { status: 400 }
      );
    }

    // Get Temporal client
    const client = await getTemporalClient();

    // Get workflow handle
    const handle = client.workflow.getHandle(workflowId);

    let internalStatus = null;
    let description = null;

    // Try to query workflow - handle case where workflow doesn't exist
    try {
      // Get workflow execution info first (this will throw if workflow doesn't exist)
      description = await handle.describe();

      // Only query if workflow is still running
      if (description.status.name === 'RUNNING') {
        try {
          internalStatus = await handle.query('workflowStatus');
        } catch (queryError: any) {
          // Handle query failures (e.g., workflow task failed)
          const errorMsg = queryError.message || '';
          const causeMsg = queryError.cause?.message || '';

          if (errorMsg.includes('Workflow Task in failed state')) {
            console.log(`⚠️ Cannot query workflow ${workflowId} - task in failed state`);

            // Check if it's a non-determinism error
            if (causeMsg.includes('Nondeterminism') || causeMsg.includes('does not match')) {
              console.log(`⚠️ Non-determinism detected: ${causeMsg}`);
              error = 'Workflow code was updated after this workflow started. Please cancel this workflow and start a new one.';
            } else {
              error = 'Workflow task in failed state - check Temporal UI for details';
            }
            // Continue without internal status - we'll use the error message
          } else {
            throw queryError;
          }
        }
      }
    } catch (error: any) {
      // Workflow not found - check database for completed workflow
      if (error.message?.includes('not found') || error.name === 'WorkflowNotFoundError') {
        console.log(`⚠️ Workflow ${workflowId} not found in Temporal, checking database...`);

        const db = getDatabaseService();
        const workflowExecution = await db.getWorkflowExecutionByWorkflowId(workflowId);

        if (workflowExecution.success && workflowExecution.value) {
          // Return data from database
          return Response.json({
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
        return Response.json(
          {
            error: 'Workflow not found',
            details: 'Workflow does not exist in Temporal or database history',
            workflowId,
          },
          { status: 404 }
        );
      }

      // Other error - rethrow
      throw error;
    }

    // At this point, description should exist (we would have returned earlier if not found)
    if (!description) {
      throw new Error('Unexpected: description is null after successful query');
    }

    // Determine workflow status based on execution state
    let status: 'running' | 'completed' | 'failed' | 'cancelled' | 'timed_out' = 'running';
    let result = null;
    let error = null;

    if (description.status.name === 'COMPLETED') {
      try {
        result = await handle.result();
        status = result?.success === false ? 'failed' : 'completed';
      } catch (err: any) {
        status = 'failed';
        error = err.message;
      }
    } else if (description.status.name === 'FAILED') {
      status = 'failed';
      // Try to get the failure reason
      try {
        await handle.result();
      } catch (err: any) {
        error = err.message || err.cause?.message || 'Workflow failed';
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
    return Response.json({
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
    });

  } catch (error: any) {
    console.error('❌ Failed to query workflow:', error);
    return Response.json(
      {
        error: 'Failed to query workflow status',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
