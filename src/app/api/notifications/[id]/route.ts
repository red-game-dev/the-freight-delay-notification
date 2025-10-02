/**
 * Notification Detail API Routes
 * GET /api/notifications/[id] - Get notification by ID
 */

import { getDatabaseService } from '@/infrastructure/database/DatabaseService';
import { createParamApiHandler } from '@/core/infrastructure/http';
import { Result } from '@/core/base/utils/Result';

/**
 * GET /api/notifications/[id]
 * Get notification by ID - returns sanitized notification data
 */
export const GET = createParamApiHandler(async (request, { params }) => {
  const db = getDatabaseService();

  // Transform result to only expose safe fields
  return Result.map(
    await db.getNotificationById(params.id),
    (notification) => notification ? {
      id: notification.id,
      delivery_id: notification.delivery_id,
      customer_id: notification.customer_id,
      channel: notification.channel,
      message: notification.message,
      status: notification.status,
      delay_minutes: notification.delay_minutes,
      sent_at: notification.sent_at,
      created_at: notification.created_at,
    } : null
  );
});
