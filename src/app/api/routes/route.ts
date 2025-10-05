/**
 * Routes API
 * GET /api/routes - List all delivery routes with current traffic status
 */

import { setAuditContext } from "@/app/api/middleware/auditContext";
import { logger } from "@/core/base/utils/Logger";
import { Result } from "@/core/base/utils/Result";
import { createApiHandler } from "@/core/infrastructure/http";
import { getDatabaseService } from "@/infrastructure/database/DatabaseService";

/**
 * GET /api/routes
 * Returns all routes with their latest traffic snapshot
 */
export const GET = createApiHandler(async (request) => {
  await setAuditContext(request);
  const db = getDatabaseService();

  logger.info("🗺️ [Routes API] Fetching routes via DatabaseService");

  // Fetch same limit as cron job to ensure all routes with traffic snapshots are available
  return Result.map(await db.listRoutes(1000, 0), (routes) => {
    logger.info(`🗺️ [Routes API] Retrieved ${routes.length} routes`);
    return routes.map((route) => ({
      id: route.id,
      origin_address: route.origin_address,
      origin_coords: route.origin_coords,
      destination_address: route.destination_address,
      destination_coords: route.destination_coords,
      distance_meters: route.distance_meters,
      normal_duration_seconds: route.normal_duration_seconds,
      current_duration_seconds: route.current_duration_seconds,
      traffic_condition: route.traffic_condition,
      created_at: route.created_at,
      updated_at: route.updated_at,
    }));
  });
});
