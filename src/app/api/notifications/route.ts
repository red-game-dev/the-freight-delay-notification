/**
 * Notifications API Routes
 * GET /api/notifications - List all notifications
 */

import { getDatabaseService } from '@/infrastructure/database/DatabaseService';
import { createApiHandler, getQueryParam } from '@/core/infrastructure/http';
import { logger } from '@/core/base/utils/Logger';
import { Result } from '@/core/base/utils/Result';

/**
 * GET /api/notifications
 * List notifications, optionally filtered by deliveryId or customerId - returns sanitized data
 */
export const GET = createApiHandler(async (request) => {
  const db = getDatabaseService();
  const deliveryId = getQueryParam(request, 'deliveryId');
  const customerId = getQueryParam(request, 'customerId');

  let notificationsResult;

  if (deliveryId) {
    logger.info(`📧 [Notifications API] Fetching notifications for delivery: ${deliveryId}`);
    notificationsResult = await db.listNotificationsByDelivery(deliveryId);
  } else if (customerId) {
    logger.info(`📧 [Notifications API] Fetching notifications for customer: ${customerId}`);
    notificationsResult = await db.listNotificationsByCustomer(customerId);
  } else {
    logger.info('📧 [Notifications API] Fetching all notifications via DatabaseService');
    notificationsResult = await db.listNotifications(100);
  }

  // Transform result to only expose safe fields
  return Result.map(notificationsResult, (notifications) =>
    notifications.map((n) => ({
      id: n.id,
      delivery_id: n.delivery_id,
      customer_id: n.customer_id,
      channel: n.channel,
      message: n.message,
      status: n.status,
      delay_minutes: n.delay_minutes,
      sent_at: n.sent_at,
      created_at: n.created_at,
    }))
  );
});
