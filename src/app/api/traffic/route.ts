/**
 * Traffic Snapshots API
 * GET /api/traffic - List recent traffic snapshots
 */

import { getDatabaseService } from '@/infrastructure/database/DatabaseService';
import { createApiHandler } from '@/core/infrastructure/http';
import { logger } from '@/core/base/utils/Logger';
import { Result } from '@/core/base/utils/Result';

/**
 * GET /api/traffic
 * Returns recent traffic snapshots with route information
 */
export const GET = createApiHandler(async () => {
  const db = getDatabaseService();

  logger.info('🚦 [Traffic API] Fetching traffic snapshots via DatabaseService');

  return Result.map(
    await db.listTrafficSnapshots(100),
    (snapshots) => {
      logger.info(`🚦 [Traffic API] Retrieved ${snapshots.length} traffic snapshots`);
      return snapshots.map(snapshot => ({
        id: snapshot.id,
        route_id: snapshot.route_id,
        traffic_condition: snapshot.traffic_condition,
        delay_minutes: snapshot.delay_minutes,
        duration_seconds: snapshot.duration_seconds,
        snapshot_at: snapshot.snapshot_at,
      }));
    }
  );
});
