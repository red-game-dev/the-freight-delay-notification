/**
 * Notification Detail API Routes
 * GET /api/notifications/[id] - Get notification by ID
 */

import { getDatabaseService } from '@/infrastructure/database/DatabaseService';
import { createParamApiHandler } from '@/core/infrastructure/http';

/**
 * GET /api/notifications/[id]
 * Get notification by ID
 */
export const GET = createParamApiHandler(async (request, { params }) => {
  const db = getDatabaseService();
  return await db.getNotificationById(params.id);
});
