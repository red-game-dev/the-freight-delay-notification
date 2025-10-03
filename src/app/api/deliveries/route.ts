/**
 * Deliveries API Routes
 * GET /api/deliveries - List all deliveries
 * POST /api/deliveries - Create a new delivery
 */

import { getDatabaseService } from '@/infrastructure/database/DatabaseService';
import { createApiHandler, getQueryParam } from '@/core/infrastructure/http';
import type { DeliveryStatus } from '@/infrastructure/database/types/database.types';
import { getTemporalClient } from '@/infrastructure/temporal/TemporalClient';
import { WorkflowIdReusePolicy } from '@temporalio/client';
import { getGeocodingService } from '@/infrastructure/adapters/geocoding/GeocodingService';
import { logger } from '@/core/base/utils/Logger';
import { Result } from '@/core/base/utils/Result';
import { createWorkflowId, WorkflowType } from '@/core/utils/workflowUtils';
import { ensureDateISO } from '@/core/utils/typeConversion';
import { createPaginatedResponse } from '@/core/utils/paginationUtils';
import { validateQuery, validateBody } from '@/core/utils/validation';
import { listDeliveriesQuerySchema, createDeliverySchema } from '@/core/schemas/delivery';
import { env } from '@/infrastructure/config/EnvValidator';

/**
 * GET /api/deliveries
 * List all deliveries with optional filtering - returns sanitized delivery data
 * Query params:
 * - status: Filter by delivery status
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 */
export const GET = createApiHandler(async (request) => {
  const db = getDatabaseService();

  // Validate query parameters
  const queryResult = validateQuery(listDeliveriesQuerySchema, request);
  if (!queryResult.success) {
    return queryResult;
  }

  const { page, limit, status } = queryResult.value;

  // Fetch more than needed to calculate total properly (for filtered results)
  const fetchLimit = 1000;
  const deliveriesResult = status
    ? await db.listDeliveriesByStatus(status, fetchLimit)
    : await db.listDeliveries(fetchLimit, 0);

  // Transform result and apply pagination
  return Result.map(deliveriesResult, (deliveries) => {
    const sanitizedDeliveries = deliveries.map((d) => ({
      id: d.id,
      tracking_number: d.tracking_number,
      customer_id: d.customer_id,
      route_id: d.route_id,
      status: d.status,
      scheduled_delivery: d.scheduled_delivery,
      delay_threshold_minutes: d.delay_threshold_minutes,
      auto_check_traffic: d.auto_check_traffic,
      enable_recurring_checks: d.enable_recurring_checks,
      checks_performed: d.checks_performed,
      created_at: d.created_at,
      updated_at: d.updated_at,
      customer_name: d.customer_name,
      customer_email: d.customer_email,
      customer_phone: d.customer_phone,
      origin: d.origin,
      destination: d.destination,
      notes: d.notes,
    }));

    return createPaginatedResponse(sanitizedDeliveries, page, limit);
  });
});

/**
 * POST /api/deliveries
 * Create a new delivery
 * NOTE: This handles the full creation flow (customer -> route -> delivery)
 */
export const POST = createApiHandler(async (request) => {
  // Validate request body
  const bodyResult = await validateBody(createDeliverySchema, request);
  if (!bodyResult.success) {
    return bodyResult;
  }

  const body = bodyResult.value;

  // Extract fields (already validated by Zod)
  const {
    tracking_number,
    origin,
    destination,
    scheduled_delivery,
    customer_name,
    customer_email,
    customer_phone,
    notes,
    auto_check_traffic,
    enable_recurring_checks,
    check_interval_minutes,
    max_checks,
    min_delay_change_threshold,
    min_hours_between_notifications,
    delay_threshold_minutes,
  } = body;

  const db = getDatabaseService();
  const geocodingService = getGeocodingService();

  // Step 1: Create or find customer
  let customer = await db.getCustomerByEmail(customer_email);
  if (!customer.success || !customer.value) {
    const createCustomerResult = await db.createCustomer({
      name: customer_name,
      email: customer_email,
      phone: customer_phone,
    });
    if (!createCustomerResult.success) {
      return createCustomerResult;
    }
    customer = createCustomerResult;
  }

  // Step 2: Geocode addresses to get coordinates
  logger.info(`🌍 Geocoding addresses: ${origin} → ${destination}`);

  const originGeocodingResult = await geocodingService.geocodeAddress(origin);
  if (!originGeocodingResult.success) {
    logger.error(`❌ Failed to geocode origin: ${origin}`, originGeocodingResult.error);
    return originGeocodingResult;
  }

  const destinationGeocodingResult = await geocodingService.geocodeAddress(destination);
  if (!destinationGeocodingResult.success) {
    logger.error(`❌ Failed to geocode destination: ${destination}`, destinationGeocodingResult.error);
    return destinationGeocodingResult;
  }

  logger.info(`✅ Geocoded origin: ${origin} → (${originGeocodingResult.value.lat}, ${originGeocodingResult.value.lng})`);
  logger.info(`✅ Geocoded destination: ${destination} → (${destinationGeocodingResult.value.lat}, ${destinationGeocodingResult.value.lng})`);

  // Step 3: Create route with geocoded coordinates
  const routeResult = await db.createRoute({
    origin_address: origin,
    origin_coords: originGeocodingResult.value,
    destination_address: destination,
    destination_coords: destinationGeocodingResult.value,
    distance_meters: 0, // Will be calculated by first traffic check
    normal_duration_seconds: 0, // Will be calculated by first traffic check
  });

  if (!routeResult.success) {
    return routeResult;
  }

  // Step 4: Create delivery
  const deliveryResult = await db.createDelivery({
    tracking_number,
    customer_id: customer.value!.id,
    route_id: routeResult.value.id,
    scheduled_delivery: new Date(scheduled_delivery),
    status: 'pending',
    delay_threshold_minutes: delay_threshold_minutes || 30,
    auto_check_traffic: auto_check_traffic || false,
    enable_recurring_checks: enable_recurring_checks || false,
    check_interval_minutes: check_interval_minutes || 30,
    max_checks: max_checks ?? -1,
    checks_performed: 0,
    min_delay_change_threshold: min_delay_change_threshold || 15,
    min_hours_between_notifications: min_hours_between_notifications || 1.0,
    metadata: {
      notes,
      customer_name,
      customer_email,
      customer_phone,
    },
  });

  if (!deliveryResult.success) {
    return deliveryResult;
  }

  // Step 4: If auto_check_traffic or enable_recurring_checks is enabled, trigger workflow
  logger.info(`🔍 Checking workflow triggers - auto_check: ${auto_check_traffic}, recurring: ${enable_recurring_checks}`);

  if (auto_check_traffic || enable_recurring_checks) {
    logger.info(`🚀 Auto-triggering workflow for delivery ${deliveryResult.value.id}`);
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
        scheduledTime: ensureDateISO(deliveryResult.value.scheduled_delivery)!,
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
          cutoffHours: env.WORKFLOW_CUTOFF_HOURS,
        };

        const workflowId = createWorkflowId(WorkflowType.RECURRING_CHECK, deliveryResult.value.id, false);

        const handle = await client.workflow.start('RecurringTrafficCheckWorkflow', {
          taskQueue: process.env.TEMPORAL_TASK_QUEUE || 'freight-delay-queue',
          workflowId,
          args: [workflowInput],
          workflowIdReusePolicy: WorkflowIdReusePolicy.ALLOW_DUPLICATE_FAILED_ONLY,
        });

        logger.info(`✅ Auto-triggered recurring workflow ${handle.workflowId} for delivery ${deliveryResult.value.id}`);
        logger.info(`   Check interval: ${body.check_interval_minutes || 30} minutes, Max checks: ${maxChecks === -1 ? 'unlimited' : maxChecks}`);
      } else {
        // Trigger one-time DelayNotificationWorkflow
        const workflowId = createWorkflowId(WorkflowType.DELAY_NOTIFICATION, deliveryResult.value.id, false);

        const handle = await client.workflow.start('DelayNotificationWorkflow', {
          taskQueue: process.env.TEMPORAL_TASK_QUEUE || 'freight-delay-queue',
          workflowId,
          args: [baseWorkflowInput],
          workflowIdReusePolicy: WorkflowIdReusePolicy.ALLOW_DUPLICATE_FAILED_ONLY,
        });

        logger.info(`✅ Auto-triggered one-time workflow ${handle.workflowId} for delivery ${deliveryResult.value.id}`);
      }
    } catch (error: unknown) {
      logger.error('Failed to auto-trigger workflow:', error);
      // Don't fail the delivery creation if workflow trigger fails
      // The user can still manually trigger it later
    }
  }

  return deliveryResult;
}, { successStatus: 201 });
