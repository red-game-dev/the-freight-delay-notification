/**
 * API Endpoint to Query Workflow Status
 * GET /api/workflow/status?workflowId=xxx
 */

import { NextRequest } from 'next/server';
import { getTemporalClient } from '@/infrastructure/temporal/TemporalClient';

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

    // Query workflow status
    const status = await handle.query('workflowStatus');

    // Get workflow result (if completed)
    let result = null;
    try {
      result = await handle.result();
    } catch (error: any) {
      // Workflow still running or failed
      if (error.message?.includes('running')) {
        // Still running, that's fine
      } else {
        console.log('Workflow not yet completed or failed:', error.message);
      }
    }

    return Response.json({
      success: true,
      workflowId,
      status,
      result,
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
