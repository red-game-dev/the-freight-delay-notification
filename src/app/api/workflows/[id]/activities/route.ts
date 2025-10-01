/**
 * Workflow Activities API Route
 * GET /api/workflows/[id]/activities - Get activities for a workflow
 */

import { createParamApiHandler } from '@/core/infrastructure/http';
import { Result } from '@/core/base/utils/Result';

/**
 * GET /api/workflows/[id]/activities
 * Get activities for a workflow (mock for now)
 */
export const GET = createParamApiHandler(async (request, { params }) => {
  // TODO: Implement actual activities retrieval when we have the method in DatabaseService
  const activities: any[] = [];

  return Result.ok(activities);
});
