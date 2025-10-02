/**
 * Notification Statistics API Route
 * GET /api/notifications/stats - Get notification statistics
 */

import { getDatabaseService } from '@/infrastructure/database/DatabaseService';
import { createApiHandler } from '@/core/infrastructure/http';
import { Result } from '@/core/base/utils/Result';
import { logger } from '@/core/base/utils/Logger';

/**
 * GET /api/notifications/stats
 * Get notification statistics from database
 */
export const GET = createApiHandler(async () => {
  const db = getDatabaseService();

  logger.info('📊 [Notifications Stats API] Fetching notification statistics via DatabaseService');

  // Get all notifications and transform to stats using Result.map
  return Result.map(
    await db.listNotifications(1000),
    (notifications) => {
      const total = notifications.length;
      const sent = notifications.filter(n => n.status === 'sent').length;
      const failed = notifications.filter(n => n.status === 'failed').length;
      const successRate = total > 0 ? (sent / total) * 100 : 0;

      return {
        total,
        sent,
        failed,
        success_rate: successRate,
      };
    }
  );
});
