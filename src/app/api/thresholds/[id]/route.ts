/**
 * Threshold Detail API Routes
 * GET /api/thresholds/[id] - Get threshold by ID
 * PATCH /api/thresholds/[id] - Update threshold
 * DELETE /api/thresholds/[id] - Delete threshold
 */

import { getDatabaseService } from '@/infrastructure/database/DatabaseService';
import { createParamApiHandler, parseJsonBody } from '@/core/infrastructure/http';
import { HttpError } from '@/core/base/errors/HttpError';

/**
 * GET /api/thresholds/[id]
 * Get threshold by ID
 */
export const GET = createParamApiHandler(async (request, { params }) => {
  const db = getDatabaseService();
  return await db.getThresholdById(params.id);
});

/**
 * PATCH /api/thresholds/[id]
 * Update threshold
 */
export const PATCH = createParamApiHandler(async (request, { params }) => {
  const body = await parseJsonBody<{
    name?: string;
    delay_minutes?: number;
    notification_channels?: Array<'email' | 'sms'>;
    is_default?: boolean;
  }>(request);

  const db = getDatabaseService();

  // TODO: If setting as default, should unset all other defaults first
  // This business logic should be implemented in DatabaseService.updateThreshold
  // For now, the database layer will handle this via triggers or application logic

  return await db.updateThreshold(params.id, body);
});

/**
 * DELETE /api/thresholds/[id]
 * Delete threshold (cannot delete default threshold)
 */
export const DELETE = createParamApiHandler(async (request, { params }) => {
  const db = getDatabaseService();

  // First check if this is the default threshold
  const thresholdResult = await db.getThresholdById(params.id);

  if (!thresholdResult.success) {
    return thresholdResult;
  }

  if (thresholdResult.value && thresholdResult.value.is_default) {
    throw new HttpError('Cannot delete default threshold', 400);
  }

  return await db.deleteThreshold(params.id);
}, { successStatus: 204 });
