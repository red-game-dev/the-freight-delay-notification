/**
 * Delivery Detail API Routes
 * GET /api/deliveries/[id] - Get delivery by ID
 * PATCH /api/deliveries/[id] - Update delivery
 * DELETE /api/deliveries/[id] - Delete delivery
 */

import {
  getCustomerEmailFromRequest,
  setAuditContext,
} from "@/app/api/middleware/auditContext";
import { Result } from "@/core/base/utils/Result";
import { createParamApiHandler } from "@/core/infrastructure/http";
import { updateDeliverySchema } from "@/core/schemas/delivery";
import { validateBody } from "@/core/utils/validation";
import { getDatabaseService } from "@/infrastructure/database/DatabaseService";
import type {
  DeliveryStatus,
  UpdateDeliveryInput,
} from "@/infrastructure/database/types/database.types";

/**
 * GET /api/deliveries/[id]
 * Get delivery by ID - returns sanitized delivery data
 */
export const GET = createParamApiHandler(async (request, context) => {
  await setAuditContext(request);
  const params = await context.params;
  const db = getDatabaseService();

  // Transform result to only expose safe fields
  return Result.map(await db.getDeliveryById(params.id), (delivery) =>
    delivery
      ? {
          id: delivery.id,
          tracking_number: delivery.tracking_number,
          customer_id: delivery.customer_id,
          route_id: delivery.route_id,
          status: delivery.status,
          scheduled_delivery: delivery.scheduled_delivery,
          delay_threshold_minutes: delivery.delay_threshold_minutes,
          auto_check_traffic: delivery.auto_check_traffic,
          enable_recurring_checks: delivery.enable_recurring_checks,
          check_interval_minutes: delivery.check_interval_minutes,
          max_checks: delivery.max_checks,
          checks_performed: delivery.checks_performed,
          min_delay_change_threshold: delivery.min_delay_change_threshold,
          min_hours_between_notifications:
            delivery.min_hours_between_notifications,
          metadata: delivery.metadata,
          created_at: delivery.created_at,
          updated_at: delivery.updated_at,
          customer_name: delivery.customer_name,
          customer_email: delivery.customer_email,
          customer_phone: delivery.customer_phone,
          origin: delivery.origin,
          destination: delivery.destination,
          notes: delivery.notes,
        }
      : null,
  );
});

/**
 * PATCH /api/deliveries/[id]
 * Update delivery
 */
export const PATCH = createParamApiHandler(async (request, context) => {
  await setAuditContext(request, await getCustomerEmailFromRequest(request));
  const params = await context.params;

  // Validate request body
  const bodyResult = await validateBody(updateDeliverySchema, request);
  if (!bodyResult.success) {
    return bodyResult;
  }

  const body = bodyResult.value;
  const db = getDatabaseService();

  // Convert scheduled_delivery to Date if present
  const updateData: Partial<UpdateDeliveryInput> = {
    ...body,
    scheduled_delivery: body.scheduled_delivery
      ? new Date(body.scheduled_delivery)
      : undefined,
  };

  // Transform result to only expose safe fields
  return Result.map(
    await db.updateDelivery(params.id, updateData),
    (delivery) => ({
      id: delivery.id,
      tracking_number: delivery.tracking_number,
      status: delivery.status,
      updated_at: delivery.updated_at,
    }),
  );
});

/**
 * DELETE /api/deliveries/[id]
 * Soft delete delivery by marking as cancelled
 */
export const DELETE = createParamApiHandler(
  async (request, context) => {
    await setAuditContext(request);
    const params = await context.params;
    const db = getDatabaseService();

    // Soft delete - mark as cancelled
    const result = await db.updateDelivery(params.id, { status: "cancelled" });

    // Return only success/failure, no data (204 No Content)
    return Result.map(result, () => null);
  },
  { successStatus: 204 },
);
