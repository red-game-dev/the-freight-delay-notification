/**
 * Delivery Detail API Routes
 * GET /api/deliveries/[id] - Get delivery by ID
 * PATCH /api/deliveries/[id] - Update delivery
 * DELETE /api/deliveries/[id] - Delete delivery
 */

import { getDatabaseService } from '@/infrastructure/database/DatabaseService';
import { createParamApiHandler, parseJsonBody } from '@/core/infrastructure/http';
import { Result } from '@/core/base/utils/Result';
import type { UpdateDeliveryInput, DeliveryStatus } from '@/infrastructure/database/types/database.types';

/**
 * GET /api/deliveries/[id]
 * Get delivery by ID - returns sanitized delivery data
 */
export const GET = createParamApiHandler(async (request, context) => {
  const params = await context.params;
  const db = getDatabaseService();

  // Transform result to only expose safe fields
  return Result.map(
    await db.getDeliveryById(params.id),
    (delivery) => delivery ? {
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
      min_hours_between_notifications: delivery.min_hours_between_notifications,
      metadata: delivery.metadata,
      created_at: delivery.created_at,
      updated_at: delivery.updated_at,
      customer_name: delivery.customer_name,
      customer_email: delivery.customer_email,
      customer_phone: delivery.customer_phone,
      origin: delivery.origin,
      destination: delivery.destination,
      notes: delivery.notes,
    } : null
  );
});

/**
 * PATCH /api/deliveries/[id]
 * Update delivery
 */
export const PATCH = createParamApiHandler(async (request, context) => {
  const params = await context.params;
  const body = await parseJsonBody<{
    tracking_number?: string;
    origin?: string;
    destination?: string;
    scheduled_delivery?: string;
    status?: string;
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;
    notes?: string;
    auto_check_traffic?: boolean;
    enable_recurring_checks?: boolean;
    check_interval_minutes?: number;
    max_checks?: number;
    min_delay_change_threshold?: number;
    min_hours_between_notifications?: number;
  }>(request);

  const db = getDatabaseService();

  // Build update object
  const updateData: Partial<UpdateDeliveryInput> = {};
  if (body.tracking_number) updateData.tracking_number = body.tracking_number;
  if (body.origin) updateData.origin = body.origin;
  if (body.destination) updateData.destination = body.destination;
  if (body.scheduled_delivery) updateData.scheduled_delivery = new Date(body.scheduled_delivery);
  if (body.status) updateData.status = body.status as DeliveryStatus;
  if (body.customer_name) updateData.customer_name = body.customer_name;
  if (body.customer_email) updateData.customer_email = body.customer_email;
  if (body.customer_phone !== undefined) updateData.customer_phone = body.customer_phone;
  if (body.notes !== undefined) updateData.notes = body.notes;
  if (body.auto_check_traffic !== undefined) updateData.auto_check_traffic = body.auto_check_traffic;
  if (body.enable_recurring_checks !== undefined) updateData.enable_recurring_checks = body.enable_recurring_checks;
  if (body.check_interval_minutes !== undefined) updateData.check_interval_minutes = body.check_interval_minutes;
  if (body.max_checks !== undefined) updateData.max_checks = body.max_checks;
  if (body.min_delay_change_threshold !== undefined) updateData.min_delay_change_threshold = body.min_delay_change_threshold;
  if (body.min_hours_between_notifications !== undefined) updateData.min_hours_between_notifications = body.min_hours_between_notifications;

  // Transform result to only expose safe fields
  return Result.map(
    await db.updateDelivery(params.id, updateData),
    (delivery) => ({
      id: delivery.id,
      tracking_number: delivery.tracking_number,
      status: delivery.status,
      updated_at: delivery.updated_at,
    })
  );
});

/**
 * DELETE /api/deliveries/[id]
 * Soft delete delivery by marking as cancelled
 */
export const DELETE = createParamApiHandler(async (request, context) => {
  const params = await context.params;
  const db = getDatabaseService();

  // Soft delete - mark as cancelled
  const result = await db.updateDelivery(params.id, { status: 'cancelled' });

  // Return only success/failure, no data (204 No Content)
  return Result.map(result, () => null);
}, { successStatus: 204 });
