/**
 * API Endpoint to Start Delay Notification Workflow
 * POST /api/workflow/start
 */

import { NextRequest } from 'next/server';
import { getTemporalClient } from '@/infrastructure/temporal/TemporalClient';
import { WorkflowIdReusePolicy } from '@temporalio/client';
import { createClient } from '@supabase/supabase-js';
import { env } from '@/infrastructure/config/EnvValidator';
import type { DelayNotificationWorkflowInput } from '@/workflows/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate deliveryId
    if (!body.deliveryId) {
      return Response.json(
        { error: 'Missing required field: deliveryId' },
        { status: 400 }
      );
    }

    // Fetch delivery data from database using service role to bypass RLS
    const supabase = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL!,
      env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch delivery - use maybeSingle() to handle 0 or 1 results gracefully
    const { data: delivery, error: deliveryError } = await supabase
      .from('deliveries')
      .select('*')
      .eq('id', body.deliveryId)
      .maybeSingle();

    if (deliveryError) {
      console.error('❌ Error fetching delivery:', deliveryError);
      return Response.json(
        { error: 'Database error while fetching delivery', details: deliveryError.message },
        { status: 500 }
      );
    }

    if (!delivery) {
      console.error('❌ Delivery not found:', body.deliveryId);
      // Check if any deliveries exist to help debug
      const { count } = await supabase
        .from('deliveries')
        .select('*', { count: 'exact', head: true });
      console.log(`   Total deliveries in database: ${count}`);

      return Response.json(
        { error: 'Delivery not found', details: `No delivery found with ID: ${body.deliveryId}` },
        { status: 404 }
      );
    }

    // Fetch route
    const { data: route, error: routeError } = await supabase
      .from('routes')
      .select('*')
      .eq('id', delivery.route_id)
      .maybeSingle();

    if (routeError) {
      console.error('❌ Error fetching route:', routeError);
      return Response.json(
        { error: 'Database error while fetching route', details: routeError.message },
        { status: 500 }
      );
    }

    if (!route) {
      console.error('❌ Route not found:', delivery.route_id);
      return Response.json(
        { error: 'Route not found', details: `No route found with ID: ${delivery.route_id}` },
        { status: 404 }
      );
    }

    // Fetch customer
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', delivery.customer_id)
      .maybeSingle();

    if (customerError) {
      console.error('❌ Error fetching customer:', customerError);
      return Response.json(
        { error: 'Database error while fetching customer', details: customerError.message },
        { status: 500 }
      );
    }

    if (!customer) {
      console.error('❌ Customer not found:', delivery.customer_id);
      return Response.json(
        { error: 'Customer not found', details: `No customer found with ID: ${delivery.customer_id}` },
        { status: 404 }
      );
    }

    // Construct workflow input from database data
    const workflowInput: DelayNotificationWorkflowInput = {
      deliveryId: delivery.id,
      routeId: delivery.route_id,
      customerId: delivery.customer_id,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      origin: {
        address: route.origin_address,
        coordinates: route.origin_coords ? {
          lat: route.origin_coords.y,
          lng: route.origin_coords.x,
        } : undefined,
      },
      destination: {
        address: route.destination_address,
        coordinates: route.destination_coords ? {
          lat: route.destination_coords.y,
          lng: route.destination_coords.x,
        } : undefined,
      },
      scheduledTime: delivery.scheduled_delivery,
      thresholdMinutes: delivery.delay_threshold_minutes || 30,
    };

    // Get Temporal client
    const client = await getTemporalClient();

    // Start workflow with consistent ID based on deliveryId (no timestamp)
    // This allows the UI to find the workflow by constructing the same ID
    const workflowId = `delay-notification-${workflowInput.deliveryId}`;

    console.log(`🚀 Starting workflow: ${workflowId}`);
    console.log(`   Delivery: ${workflowInput.deliveryId}`);
    console.log(`   Route: ${workflowInput.origin.address} → ${workflowInput.destination.address}`);
    console.log(`   Customer: ${workflowInput.customerEmail}`);

    // Try to start the workflow - if it already exists, return the existing one
    let handle;
    try {
      handle = await client.workflow.start('DelayNotificationWorkflow', {
        taskQueue: process.env.TEMPORAL_TASK_QUEUE || 'freight-delay-queue',
        workflowId,
        args: [workflowInput],
        workflowIdReusePolicy: WorkflowIdReusePolicy.WORKFLOW_ID_REUSE_POLICY_ALLOW_DUPLICATE_FAILED_ONLY,
      });
    } catch (error: any) {
      // If workflow already exists, get its handle
      if (error.message && error.message.includes('WorkflowExecutionAlreadyStarted')) {
        console.log(`ℹ️  Workflow ${workflowId} already exists, returning existing handle`);
        handle = client.workflow.getHandle(workflowId);
      } else {
        throw error;
      }
    }

    console.log(`✅ Workflow started: ${handle.workflowId}`);

    // Get workflow description to access runId
    const description = await handle.describe();

    return Response.json({
      success: true,
      workflowId: handle.workflowId,
      runId: description.runId,
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
