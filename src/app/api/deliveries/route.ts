/**
 * Deliveries API Routes
 * GET /api/deliveries - List all deliveries
 * POST /api/deliveries - Create a new delivery
 */

import { getDatabaseService } from '@/infrastructure/database/DatabaseService';
import { createApiHandler, parseJsonBody, validateRequiredFields, getQueryParam } from '@/core/infrastructure/http';
import { BadRequestError } from '@/core/base/errors/HttpError';
import { DeliveryStatus } from '@/infrastructure/database/types/database.types';
import { getTemporalClient } from '@/infrastructure/temporal/TemporalClient';
import { WorkflowIdReusePolicy } from '@temporalio/client';
import type { DelayNotificationWorkflowInput } from '@/workflows/types';

/**
 * GET /api/deliveries
 * List all deliveries with optional filtering
 */
export const GET = createApiHandler(async (request) => {
  const db = getDatabaseService();

  const limit = parseInt(getQueryParam(request, 'limit') || '100');
  const offset = parseInt(getQueryParam(request, 'offset') || '0');
  const status = getQueryParam(request, 'status');

  if (status) {
    return await db.listDeliveriesByStatus(status, limit);
  }

  return await db.listDeliveries(limit, offset);
});

/**
 * POST /api/deliveries
 * Create a new delivery
 * NOTE: This handles the full creation flow (customer -> route -> delivery)
 */
export const POST = createApiHandler(async (request) => {
  const body = await parseJsonBody<{
    tracking_number: string;
    origin: string;
    destination: string;
    scheduled_delivery: string;
    status?: string;
    customer_name: string;
    customer_email: string;
    customer_phone?: string;
    notes?: string;
    auto_check_traffic?: boolean;
    enable_recurring_checks?: boolean;
    check_interval_minutes?: number;
    max_checks?: number;
    min_delay_change_threshold?: number;
    min_hours_between_notifications?: number;
  }>(request);

  // Validate required fields
  validateRequiredFields(body, [
    'tracking_number',
    'origin',
    'destination',
    'scheduled_delivery',
    'customer_name',
    'customer_email',
  ]);

  const db = getDatabaseService();

  // Step 1: Create or find customer
  let customer = await db.getCustomerByEmail(body.customer_email);
  if (!customer.success || !customer.value) {
    const createCustomerResult = await db.createCustomer({
      name: body.customer_name,
      email: body.customer_email,
      phone: body.customer_phone,
    });
    if (!createCustomerResult.success) {
      return createCustomerResult;
    }
    customer = createCustomerResult;
  }

  // Step 2: Create route
  const routeResult = await db.createRoute({
    origin_address: body.origin,
    origin_coords: { lat: 0, lng: 0 }, // TODO: Geocode address
    destination_address: body.destination,
    destination_coords: { lat: 0, lng: 0 }, // TODO: Geocode address
    distance_meters: 0, // Will be calculated later
    normal_duration_seconds: 0, // Will be calculated later
  });

  if (!routeResult.success) {
    return routeResult;
  }

  // Step 3: Create delivery
  const deliveryResult = await db.createDelivery({
    tracking_number: body.tracking_number,
    customer_id: customer.value!.id,
    route_id: routeResult.value.id,
    scheduled_delivery: new Date(body.scheduled_delivery),
    status: (body.status as DeliveryStatus) || 'pending',
    delay_threshold_minutes: 30, // Default threshold
    auto_check_traffic: body.auto_check_traffic || false,
    enable_recurring_checks: body.enable_recurring_checks || false,
    check_interval_minutes: body.check_interval_minutes || 30,
    max_checks: body.max_checks ?? -1, // -1 means unlimited
    checks_performed: 0,
    min_delay_change_threshold: body.min_delay_change_threshold || 15,
    min_hours_between_notifications: body.min_hours_between_notifications || 1.0,
    metadata: {
      notes: body.notes,
      customer_name: body.customer_name,
      customer_email: body.customer_email,
      customer_phone: body.customer_phone,
    },
  });

  if (!deliveryResult.success) {
    return deliveryResult;
  }

  // Step 4: If auto_check_traffic or enable_recurring_checks is enabled, trigger workflow
  console.log(`🔍 Checking workflow triggers - auto_check: ${body.auto_check_traffic}, recurring: ${body.enable_recurring_checks}`);

  if (body.auto_check_traffic || body.enable_recurring_checks) {
    console.log(`🚀 Auto-triggering workflow for delivery ${deliveryResult.value.id}`);
    try {
      // Construct base workflow input from the data we just created
      const baseWorkflowInput = {
        deliveryId: deliveryResult.value.id,
        routeId: routeResult.value.id,
        customerId: customer.value!.id,
        customerEmail: customer.value!.email,
        customerPhone: customer.value!.phone || undefined,
        origin: {
          address: routeResult.value.origin_address,
          coordinates: {
            lat: routeResult.value.origin_coords.lat,
            lng: routeResult.value.origin_coords.lng,
          },
        },
        destination: {
          address: routeResult.value.destination_address,
          coordinates: {
            lat: routeResult.value.destination_coords.lat,
            lng: routeResult.value.destination_coords.lng,
          },
        },
        scheduledTime: typeof deliveryResult.value.scheduled_delivery === 'string'
          ? deliveryResult.value.scheduled_delivery
          : deliveryResult.value.scheduled_delivery.toISOString(),
        thresholdMinutes: deliveryResult.value.delay_threshold_minutes || 30,
      };

      const client = await getTemporalClient();

      // Decide which workflow to trigger
      if (body.enable_recurring_checks) {
        // Trigger RecurringTrafficCheckWorkflow
        const maxChecks = body.max_checks ?? -1; // -1 means unlimited
        const workflowInput = {
          ...baseWorkflowInput,
          checkIntervalMinutes: body.check_interval_minutes || 30,
          maxChecks,
        };

        const workflowId = `recurring-check-${deliveryResult.value.id}`;

        const handle = await client.workflow.start('RecurringTrafficCheckWorkflow', {
          taskQueue: process.env.TEMPORAL_TASK_QUEUE || 'freight-delay-queue',
          workflowId,
          args: [workflowInput],
          workflowIdReusePolicy: WorkflowIdReusePolicy.WORKFLOW_ID_REUSE_POLICY_ALLOW_DUPLICATE_FAILED_ONLY,
        });

        console.log(`✅ Auto-triggered recurring workflow ${handle.workflowId} for delivery ${deliveryResult.value.id}`);
        console.log(`   Check interval: ${body.check_interval_minutes || 30} minutes, Max checks: ${maxChecks === -1 ? 'unlimited' : maxChecks}`);
      } else {
        // Trigger one-time DelayNotificationWorkflow
        const workflowId = `delay-notification-${deliveryResult.value.id}`;

        const handle = await client.workflow.start('DelayNotificationWorkflow', {
          taskQueue: process.env.TEMPORAL_TASK_QUEUE || 'freight-delay-queue',
          workflowId,
          args: [baseWorkflowInput],
          workflowIdReusePolicy: WorkflowIdReusePolicy.ALLOW_DUPLICATE_FAILED_ONLY,
        });

        console.log(`✅ Auto-triggered one-time workflow ${handle.workflowId} for delivery ${deliveryResult.value.id}`);
      }
    } catch (error: any) {
      console.error('Failed to auto-trigger workflow:', error);
      // Don't fail the delivery creation if workflow trigger fails
      // The user can still manually trigger it later
    }
  }

  return deliveryResult;
}, { successStatus: 201 });
