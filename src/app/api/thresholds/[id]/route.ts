/**
 * Threshold Detail API Routes
 * GET /api/thresholds/[id] - Get threshold by ID
 * PATCH /api/thresholds/[id] - Update threshold
 * DELETE /api/thresholds/[id] - Delete threshold
 */

import { getDatabaseService } from '@/infrastructure/database/DatabaseService';
import { createParamApiHandler } from '@/core/infrastructure/http';
import { HttpError } from '@/core/base/errors/HttpError';
import { Result } from '@/core/base/utils/Result';
import { validateBody } from '@/core/utils/validation';
import { updateThresholdSchema } from '@/core/schemas/threshold';

/**
 * GET /api/thresholds/[id]
 * Get threshold by ID - returns sanitized threshold data
 */
export const GET = createParamApiHandler(async (request, { params }) => {
  const db = getDatabaseService();

  // Transform result to only expose safe fields
  return Result.map(
    await db.getThresholdById(params.id),
    (threshold) => threshold ? {
      id: threshold.id,
      name: threshold.name,
      delay_minutes: threshold.delay_minutes,
      notification_channels: threshold.notification_channels,
      is_default: threshold.is_default,
      is_system: (threshold as any).is_system || false,
      created_at: threshold.created_at,
    } : null
  );
});

/**
 * PATCH /api/thresholds/[id]
 * Update threshold (cannot update system thresholds)
 */
export const PATCH = createParamApiHandler(async (request, { params }) => {
  const bodyResult = await validateBody(updateThresholdSchema, request);
  if (!bodyResult.success) {
    return bodyResult;
  }

  const body = bodyResult.value;
  const db = getDatabaseService();

  // Check if threshold exists and is not a system threshold
  const thresholdResult = await db.getThresholdById(params.id);
  if (!thresholdResult.success) {
    return thresholdResult;
  }

  if (thresholdResult.value && (thresholdResult.value as any).is_system) {
    return Result.fail(new HttpError('Cannot edit system threshold', 400));
  }

  // If setting this threshold as default, unset all other defaults first
  if (body.is_default === true) {
    const allThresholdsResult = await db.listThresholds();

    if (allThresholdsResult.success) {
      // Unset all other defaults (including system ones)
      for (const threshold of allThresholdsResult.value) {
        if (threshold.id !== params.id && threshold.is_default) {
          await db.updateThreshold(threshold.id, { is_default: false });
        }
      }
    }
  }

  // Transform result to only expose safe fields
  return Result.map(
    await db.updateThreshold(params.id, body),
    (threshold) => ({
      id: threshold.id,
      name: threshold.name,
      delay_minutes: threshold.delay_minutes,
      is_default: threshold.is_default,
    })
  );
});

/**
 * DELETE /api/thresholds/[id]
 * Delete threshold (cannot delete system or default threshold)
 */
export const DELETE = createParamApiHandler(async (request, { params }) => {
  const db = getDatabaseService();

  // Check if threshold exists and is not system or default, then delete
  const thresholdResult = await db.getThresholdById(params.id);

  if (!thresholdResult.success) {
    return thresholdResult;
  }

  if (!thresholdResult.value) {
    return Result.fail(new HttpError('Threshold not found', 404));
  }

  if ((thresholdResult.value as any).is_system) {
    return Result.fail(new HttpError('Cannot delete system threshold', 400));
  }

  if (thresholdResult.value.is_default) {
    return Result.fail(new HttpError('Cannot delete default threshold', 400));
  }

  return await db.deleteThreshold(params.id);
}, { successStatus: 204 });
