/**
 * Delivery Detail API Routes
 * GET /api/deliveries/[id] - Get delivery by ID
 * PATCH /api/deliveries/[id] - Update delivery
 * DELETE /api/deliveries/[id] - Delete delivery
 */

import { getDatabaseService } from '@/infrastructure/database/DatabaseService';
import { createParamApiHandler, parseJsonBody } from '@/core/infrastructure/http';

/**
 * GET /api/deliveries/[id]
 * Get delivery by ID
 */
export const GET = createParamApiHandler(async (request, context) => {
  const params = await context.params;
  const db = getDatabaseService();
  return await db.getDeliveryById(params.id);
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
  }>(request);

  const db = getDatabaseService();

  // Build update object
  const updateData: any = {};
  if (body.tracking_number) updateData.tracking_number = body.tracking_number;
  if (body.origin) updateData.origin = body.origin;
  if (body.destination) updateData.destination = body.destination;
  if (body.scheduled_delivery) updateData.scheduled_delivery = new Date(body.scheduled_delivery);
  if (body.status) updateData.status = body.status;
  if (body.customer_name) updateData.customer_name = body.customer_name;
  if (body.customer_email) updateData.customer_email = body.customer_email;
  if (body.customer_phone !== undefined) updateData.customer_phone = body.customer_phone;
  if (body.notes !== undefined) updateData.notes = body.notes;
  if (body.auto_check_traffic !== undefined) updateData.auto_check_traffic = body.auto_check_traffic;
  if (body.enable_recurring_checks !== undefined) updateData.enable_recurring_checks = body.enable_recurring_checks;
  if (body.check_interval_minutes !== undefined) updateData.check_interval_minutes = body.check_interval_minutes;
  if (body.max_checks !== undefined) updateData.max_checks = body.max_checks;

  return await db.updateDelivery(params.id, updateData);
});

/**
 * DELETE /api/deliveries/[id]
 * Soft delete delivery by marking as cancelled
 */
export const DELETE = createParamApiHandler(async (request, context) => {
  const params = await context.params;
  const db = getDatabaseService();

  // Soft delete - mark as cancelled
  return await db.updateDelivery(params.id, { status: 'cancelled' });
}, { successStatus: 204 });
