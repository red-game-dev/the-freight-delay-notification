/**
 * Thresholds API Routes
 * GET /api/thresholds - List all thresholds
 * POST /api/thresholds - Create a new threshold
 */

import {
  getCustomerEmailFromRequest,
  setAuditContext,
} from "@/app/api/middleware/auditContext";
import { Result } from "@/core/base/utils/Result";
import { createApiHandler } from "@/core/infrastructure/http";
import { createThresholdSchema } from "@/core/schemas/threshold";
import { validateBody } from "@/core/utils/validation";
import { getDatabaseService } from "@/infrastructure/database/DatabaseService";

/**
 * GET /api/thresholds
 * List all thresholds from database - returns sanitized threshold data
 */
export const GET = createApiHandler(async (request) => {
  await setAuditContext(request);
  const db = getDatabaseService();

  // Transform result to only expose safe fields
  return Result.map(await db.listThresholds(), (thresholds) =>
    thresholds.map((t) => ({
      id: t.id,
      name: t.name,
      delay_minutes: t.delay_minutes,
      notification_channels: t.notification_channels,
      is_default: t.is_default,
      is_system: t.is_system,
      created_at: t.created_at,
    })),
  );
});

/**
 * POST /api/thresholds
 * Create a new threshold in database
 */
export const POST = createApiHandler(
  async (request) => {
    await setAuditContext(request, await getCustomerEmailFromRequest(request));
    const bodyResult = await validateBody(createThresholdSchema, request);
    if (!bodyResult.success) {
      return bodyResult;
    }

    const body = bodyResult.value;
    const db = getDatabaseService();

    // Transform result to only expose safe fields
    return Result.map(
      await db.createThreshold({
        name: body.name,
        delay_minutes: body.delay_minutes,
        notification_channels: body.notification_channels,
        is_default: body.is_default,
      }),
      (threshold) => ({
        id: threshold.id,
        name: threshold.name,
        delay_minutes: threshold.delay_minutes,
        notification_channels: threshold.notification_channels,
        is_default: threshold.is_default,
        created_at: threshold.created_at,
      }),
    );
  },
  { successStatus: 201 },
);
