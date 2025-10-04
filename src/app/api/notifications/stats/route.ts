/**
 * Notification Statistics API Route
 * GET /api/notifications/stats - Get notification statistics
 */

import { setAuditContext } from "@/app/api/middleware/auditContext";
import { logger } from "@/core/base/utils/Logger";
import { Result } from "@/core/base/utils/Result";
import { createApiHandler } from "@/core/infrastructure/http";
import { getDatabaseService } from "@/infrastructure/database/DatabaseService";

/**
 * GET /api/notifications/stats
 * Get notification statistics from database
 */
export const GET = createApiHandler(async (request) => {
  await setAuditContext(request);
  const db = getDatabaseService();

  logger.info(
    "📊 [Notifications Stats API] Fetching notification statistics via DatabaseService",
  );

  // Get all notifications and transform to stats using Result.map
  return Result.map(await db.listNotifications(1000), (notifications) => {
    const total = notifications.length;
    const sent = notifications.filter((n) => n.status === "sent").length;
    const failed = notifications.filter((n) => n.status === "failed").length;
    const successRate = total > 0 ? (sent / total) * 100 : 0;

    return {
      total,
      sent,
      failed,
      success_rate: successRate,
    };
  });
});
