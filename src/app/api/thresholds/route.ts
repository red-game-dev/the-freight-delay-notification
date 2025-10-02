/**
 * Thresholds API Routes
 * GET /api/thresholds - List all thresholds
 * POST /api/thresholds - Create a new threshold
 */

import { getDatabaseService } from '@/infrastructure/database/DatabaseService';
import { createApiHandler, parseJsonBody, validateRequiredFields } from '@/core/infrastructure/http';
import { Result } from '@/core/base/utils/Result';

/**
 * GET /api/thresholds
 * List all thresholds from database - returns sanitized threshold data
 */
export const GET = createApiHandler(async (request) => {
  const db = getDatabaseService();

  // Transform result to only expose safe fields
  return Result.map(
    await db.listThresholds(),
    (thresholds) =>
      thresholds.map((t) => ({
        id: t.id,
        name: t.name,
        delay_minutes: t.delay_minutes,
        notification_channels: t.notification_channels,
        is_default: t.is_default,
        created_at: t.created_at,
      }))
  );
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

  // Transform result to only expose safe fields
  return Result.map(
    await db.createThreshold({
      name: body.name,
      delay_minutes: body.delay_minutes,
      notification_channels: body.notification_channels,
      is_default: body.is_default || false,
    }),
    (threshold) => ({
      id: threshold.id,
      name: threshold.name,
      delay_minutes: threshold.delay_minutes,
      notification_channels: threshold.notification_channels,
      is_default: threshold.is_default,
      created_at: threshold.created_at,
    })
  );
}, { successStatus: 201 });
