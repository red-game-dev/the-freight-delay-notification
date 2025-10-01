/**
 * Thresholds API Routes
 * GET /api/thresholds - List all thresholds
 * POST /api/thresholds - Create a new threshold
 */

import { getDatabaseService } from '@/infrastructure/database/DatabaseService';
import { createApiHandler, parseJsonBody, validateRequiredFields } from '@/core/infrastructure/http';

/**
 * GET /api/thresholds
 * List all thresholds from database
 */
export const GET = createApiHandler(async (request) => {
  const db = getDatabaseService();
  return await db.listThresholds();
});

/**
 * POST /api/thresholds
 * Create a new threshold in database
 */
export const POST = createApiHandler(async (request) => {
  const body = await parseJsonBody<{
    name: string;
    delay_minutes: number;
    notification_channels: Array<'email' | 'sms'>;
    is_default?: boolean;
  }>(request);

  // Validate required fields
  validateRequiredFields(body, ['name', 'delay_minutes', 'notification_channels']);

  const db = getDatabaseService();

  return await db.createThreshold({
    name: body.name,
    delay_minutes: body.delay_minutes,
    notification_channels: body.notification_channels,
    is_default: body.is_default || false,
  });
}, { successStatus: 201 });
