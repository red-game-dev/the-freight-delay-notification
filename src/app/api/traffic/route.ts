/**
 * Traffic Snapshots API
 * GET /api/traffic - List recent traffic snapshots
 */

import { getDatabaseService } from '@/infrastructure/database/DatabaseService';
import { createApiHandler } from '@/core/infrastructure/http';
import { logger } from '@/core/base/utils/Logger';
import { Result } from '@/core/base/utils/Result';
import { createPaginatedResponse } from '@/core/utils/paginationUtils';
import { validateQuery } from '@/core/utils/validation';
import { listTrafficSnapshotsQuerySchema } from '@/core/schemas/traffic';

/**
 * GET /api/traffic
 * Returns recent traffic snapshots with route information and affected deliveries
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - deliveryStatus: Comma-separated delivery statuses to include (default: in_transit,delayed)
 */
export const GET = createApiHandler(async (request) => {
  const db = getDatabaseService();

  // Validate query parameters
  const queryResult = validateQuery(listTrafficSnapshotsQuerySchema, request);
  if (!queryResult.success) {
    return queryResult;
  }

  const { page, limit, deliveryStatus } = queryResult.value;
  const deliveryStatuses = (deliveryStatus || 'in_transit,delayed').split(',').map(s => s.trim()).filter(Boolean);

  logger.info('🚦 [Traffic API] Fetching traffic snapshots via DatabaseService');

  // Fetch traffic snapshots
  const snapshotsResult = await db.listTrafficSnapshots(1000);
  if (!snapshotsResult.success) {
    return snapshotsResult;
  }

  // Fetch deliveries by each status
  const deliveryResults = await Promise.all(
    deliveryStatuses.map(status => db.listDeliveriesByStatus(status))
  );

  // Check if any delivery fetch failed
  const failedResult = deliveryResults.find(r => !r.success);
  if (failedResult) {
    logger.error('🚦 [Traffic API] Failed to fetch deliveries');
    return Result.map(snapshotsResult, (snapshots) => {
      const sanitizedSnapshots = snapshots.map(snapshot => ({
        id: snapshot.id,
        route_id: snapshot.route_id,
        traffic_condition: snapshot.traffic_condition,
        delay_minutes: snapshot.delay_minutes,
        duration_seconds: snapshot.duration_seconds,
        snapshot_at: snapshot.snapshot_at,
        affected_deliveries: [],
      }));
      return createPaginatedResponse(sanitizedSnapshots, page, limit);
    });
  }

  // Combine all deliveries (filter out failures)
  const activeDeliveries = deliveryResults.flatMap(r => r.success ? r.value : []);
  logger.info(`🚦 [Traffic API] Retrieved ${snapshotsResult.value.length} snapshots and ${activeDeliveries.length} deliveries with statuses: ${deliveryStatuses.join(', ')}`);

  // Build map of deliveries by route_id
  const deliveriesByRoute = new Map<string, typeof activeDeliveries>();
  for (const delivery of activeDeliveries) {
    const existing = deliveriesByRoute.get(delivery.route_id) || [];
    existing.push(delivery);
    deliveriesByRoute.set(delivery.route_id, existing);
  }

  // Add affected deliveries to each snapshot
  const sanitizedSnapshots = snapshotsResult.value.map(snapshot => ({
    id: snapshot.id,
    route_id: snapshot.route_id,
    traffic_condition: snapshot.traffic_condition,
    delay_minutes: snapshot.delay_minutes,
    duration_seconds: snapshot.duration_seconds,
    snapshot_at: snapshot.snapshot_at,
    affected_deliveries: (deliveriesByRoute.get(snapshot.route_id) || []).map(delivery => ({
      id: delivery.id,
      tracking_number: delivery.tracking_number,
      status: delivery.status,
      customer_id: delivery.customer_id,
    })),
  }));

  return Result.ok(createPaginatedResponse(sanitizedSnapshots, page, limit));
});
