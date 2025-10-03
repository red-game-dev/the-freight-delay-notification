/**
 * Notification Detail API Routes
 * GET /api/notifications/[id] - Get notification by ID
 */

import { getDatabaseService } from '@/infrastructure/database/DatabaseService';
import { createParamApiHandler } from '@/core/infrastructure/http';
import { Result } from '@/core/base/utils/Result';
import { validateParams } from '@/core/utils/validation';
import { notificationIdParamSchema } from '@/core/schemas/notification';

/**
 * GET /api/notifications/[id]
 * Get notification by ID - returns sanitized notification data
 */
export const GET = createParamApiHandler(async (request, { params }) => {
  // Validate params
  const paramsResult = validateParams(notificationIdParamSchema, params);
  if (!paramsResult.success) {
    return paramsResult;
  }

  const { id } = paramsResult.value;
  const db = getDatabaseService();

  // Transform result to only expose safe fields
  return Result.map(
    await db.getNotificationById(id),
    (notification) => notification ? {
      id: notification.id,
      delivery_id: notification.delivery_id,
      customer_id: notification.customer_id,
      channel: notification.channel,
      recipient: notification.recipient,
      message: notification.message,
      status: notification.status,
      delay_minutes: notification.delay_minutes,
      sent_at: notification.sent_at,
      created_at: notification.created_at,
      external_id: notification.external_id,
      error_message: notification.error_message,
    } : null
  );
});
