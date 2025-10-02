/**
 * API Endpoint to Start Delay Notification Workflow
 * POST /api/workflow/start
 */

import { NextRequest } from 'next/server';
import { getTemporalClient } from '@/infrastructure/temporal/TemporalClient';
import { WorkflowIdReusePolicy } from '@temporalio/client';
import { getDatabaseService } from '@/infrastructure/database/DatabaseService';
import { createApiHandler } from '@/core/infrastructure/http';
import { Result } from '@/core/base/utils/Result';
import { logger, getErrorMessage, hasMessage } from '@/core/base/utils/Logger';
import { ValidationError, NotFoundError, InfrastructureError } from '@/core/base/errors/BaseError';
import type { DelayNotificationWorkflowInput } from '@/workflows/types';

export const POST = createApiHandler(async (request: NextRequest) => {
  const body = await request.json();

  // Validate deliveryId
  if (!body.deliveryId) {
    return Result.fail(new ValidationError('Missing required field: deliveryId'));
  }

  const db = getDatabaseService();

  // Fetch delivery data from database via DatabaseService
  logger.info(`🚀 [Workflow Start] Fetching delivery: ${body.deliveryId}`);

  const deliveryResult = await db.getDeliveryById(body.deliveryId);

  if (!deliveryResult.success) {
    return deliveryResult;
  }

  if (!deliveryResult.value) {
    logger.error(`❌ Delivery not found: ${body.deliveryId}`);
    return Result.fail(new NotFoundError(`No delivery found with ID: ${body.deliveryId}`));
  }

  const delivery = deliveryResult.value;

  // Fetch route via DatabaseService
  logger.info(`🗺️ [Workflow Start] Fetching route: ${delivery.route_id}`);

  const routeResult = await db.getRouteById(delivery.route_id);

  if (!routeResult.success) {
    return routeResult;
  }

  if (!routeResult.value) {
    logger.error(`❌ Route not found: ${delivery.route_id}`);
    return Result.fail(new NotFoundError(`No route found with ID: ${delivery.route_id}`));
  }

  const route = routeResult.value;

  // Fetch customer via DatabaseService
  logger.info(`👤 [Workflow Start] Fetching customer: ${delivery.customer_id}`);

  const customerResult = await db.getCustomerById(delivery.customer_id);

  if (!customerResult.success) {
    return customerResult;
  }

  if (!customerResult.value) {
    logger.error(`❌ Customer not found: ${delivery.customer_id}`);
    return Result.fail(new NotFoundError(`No customer found with ID: ${delivery.customer_id}`));
  }

  const customer = customerResult.value;

  // Construct workflow input from Result data
  const workflowInput: DelayNotificationWorkflowInput = {
    deliveryId: delivery.id,
    routeId: delivery.route_id,
    customerId: delivery.customer_id,
    customerEmail: customer.email,
    customerPhone: customer.phone || undefined,
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
    scheduledTime: typeof delivery.scheduled_delivery === 'string'
      ? delivery.scheduled_delivery
      : delivery.scheduled_delivery.toISOString(),
    thresholdMinutes: delivery.delay_threshold_minutes || 30,
  };

  // Get Temporal client
  const client = await getTemporalClient();

  // Start workflow with consistent ID based on deliveryId (no timestamp)
  // This allows the UI to find the workflow by constructing the same ID
  const workflowId = `delay-notification-${workflowInput.deliveryId}`;

  logger.info(`🚀 Starting workflow: ${workflowId}`);
  logger.info(`   Delivery: ${workflowInput.deliveryId}`);
  logger.info(`   Route: ${workflowInput.origin.address} → ${workflowInput.destination.address}`);
  logger.info(`   Customer: ${workflowInput.customerEmail}`);

  // Try to start the workflow - if it already exists, return the existing one
  let handle;
  try {
    handle = await client.workflow.start('DelayNotificationWorkflow', {
      taskQueue: process.env.TEMPORAL_TASK_QUEUE || 'freight-delay-queue',
      workflowId,
      args: [workflowInput],
      workflowIdReusePolicy: WorkflowIdReusePolicy.WORKFLOW_ID_REUSE_POLICY_ALLOW_DUPLICATE_FAILED_ONLY,
    });
  } catch (error: unknown) {
    // If workflow already exists, get its handle
    if (hasMessage(error) && error.message.includes('WorkflowExecutionAlreadyStarted')) {
      logger.info(`ℹ️  Workflow ${workflowId} already exists, returning existing handle`);
      handle = client.workflow.getHandle(workflowId);
    } else {
      return Result.fail(new InfrastructureError(`Failed to start workflow: ${getErrorMessage(error)}`, { cause: error }));
    }
  }

  logger.info(`✅ Workflow started: ${handle.workflowId}`);

  // Get workflow description to access runId
  const description = await handle.describe();

  return Result.ok({
    success: true,
    workflowId: handle.workflowId,
    runId: description.runId,
    message: 'Workflow started successfully',
  });
});
