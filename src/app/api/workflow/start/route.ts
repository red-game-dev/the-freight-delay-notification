/**
 * API Endpoint to Start Delay Notification Workflow
 * POST /api/workflow/start
 */

import { NextRequest } from 'next/server';
import { getTemporalClient } from '@/infrastructure/temporal/TemporalClient';
import type { DelayNotificationWorkflowInput } from '@/workflows/types';

export async function POST(request: NextRequest) {
  try {
    const body: DelayNotificationWorkflowInput = await request.json();

    // Validate required fields
    if (!body.deliveryId || !body.routeId || !body.customerId) {
      return Response.json(
        { error: 'Missing required fields: deliveryId, routeId, customerId' },
        { status: 400 }
      );
    }

    if (!body.origin?.address || !body.destination?.address) {
      return Response.json(
        { error: 'Missing required fields: origin.address, destination.address' },
        { status: 400 }
      );
    }

    if (!body.scheduledTime) {
      return Response.json(
        { error: 'Missing required field: scheduledTime' },
        { status: 400 }
      );
    }

    // Get Temporal client
    const client = await getTemporalClient();

    // Start workflow with unique ID based on deliveryId
    const workflowId = `delay-notification-${body.deliveryId}-${Date.now()}`;

    console.log(`🚀 Starting workflow: ${workflowId}`);

    const handle = await client.workflow.start('DelayNotificationWorkflow', {
      taskQueue: process.env.TEMPORAL_TASK_QUEUE || 'freight-delay-queue',
      workflowId,
      args: [body],
    });

    console.log(`✅ Workflow started: ${handle.workflowId}`);

    return Response.json({
      success: true,
      workflowId: handle.workflowId,
      runId: handle.firstExecutionRunId,
      message: 'Workflow started successfully',
    });

  } catch (error: any) {
    console.error('❌ Failed to start workflow:', error);
    return Response.json(
      {
        error: 'Failed to start workflow',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
