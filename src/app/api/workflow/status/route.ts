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
        internalStatus = await handle.query('workflowStatus');
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
            error: workflowExecution.value.error || null,
            steps: workflowExecution.value.steps || null,
            result: workflowExecution.value.result || null,
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
      error = description.status.name;
    } else if (description.status.name === 'CANCELLED') {
      status = 'cancelled';
    } else if (description.status.name === 'TIMED_OUT') {
      status = 'timed_out';
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
