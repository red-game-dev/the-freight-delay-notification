/**
 * Notifications API Routes
 * GET /api/notifications - List all notifications
 */

import { getDatabaseService } from '@/infrastructure/database/DatabaseService';
import { createApiHandler } from '@/core/infrastructure/http';
import { logger } from '@/core/base/utils/Logger';
import { Result } from '@/core/base/utils/Result';
import { createPaginatedResponse } from '@/core/utils/paginationUtils';
import { validateQuery } from '@/core/utils/validation';
import { listNotificationsQuerySchema } from '@/core/schemas/notification';
import { setAuditContext } from '@/app/api/middleware/auditContext';

/**
 * GET /api/notifications
 * List notifications, optionally filtered by deliveryId or customerId - returns sanitized data
 * Query params:
 * - deliveryId: Filter by delivery ID
 * - customerId: Filter by customer ID
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - includeStats: Include statistics in response (default: false)
 */
export const GET = createApiHandler(async (request) => {
  await setAuditContext(request);
  const db = getDatabaseService();

  // Validate query parameters
  const queryResult = validateQuery(listNotificationsQuerySchema, request);
  if (!queryResult.success) {
    return queryResult;
  }

  const { page, limit, delivery_id: deliveryId, customer_id: customerId, includeStats } = queryResult.value;

  let notificationsResult;

  if (deliveryId) {
    logger.info(`📧 [Notifications API] Fetching notifications for delivery: ${deliveryId}`);
    notificationsResult = await db.listNotificationsByDelivery(deliveryId);
  } else if (customerId) {
    logger.info(`📧 [Notifications API] Fetching notifications for customer: ${customerId}`);
    notificationsResult = await db.listNotificationsByCustomer(customerId);
  } else {
    logger.info('📧 [Notifications API] Fetching all notifications via DatabaseService');
    notificationsResult = await db.listNotifications(1000);
  }

  // Transform result and apply pagination
  return Result.map(notificationsResult, (notifications) => {
    const sanitizedNotifications = notifications.map((n) => ({
      id: n.id,
      delivery_id: n.delivery_id,
      customer_id: n.customer_id,
      channel: n.channel,
      recipient: n.recipient,
      message: n.message,
      status: n.status,
      delay_minutes: n.delay_minutes,
      sent_at: n.sent_at,
      created_at: n.created_at,
      external_id: n.external_id,
      error_message: n.error_message,
    }));

    const paginatedResponse = createPaginatedResponse(sanitizedNotifications, page, limit);

    // Calculate and include stats if requested
    if (includeStats) {
      const total = notifications.length;
      const sent = notifications.filter(n => n.status === 'sent').length;
      const failed = notifications.filter(n => n.status === 'failed').length;
      const successRate = total > 0 ? (sent / total) * 100 : 0;

      return {
        ...paginatedResponse,
        stats: {
          total,
          sent,
          failed,
          success_rate: successRate,
        },
      };
    }

    return paginatedResponse;
  });
});
