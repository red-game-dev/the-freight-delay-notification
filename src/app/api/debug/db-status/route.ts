/**
 * Debug Endpoint - Database Status
 * GET /api/debug/db-status
 * Shows current database state for debugging
 */

import { createApiHandler } from '@/core/infrastructure/http';
import { getDatabaseService } from '@/infrastructure/database';
import { Result } from '@/core/base/utils/Result';
import type { TrafficSnapshot } from '@/infrastructure/database/types/database.types';

export const dynamic = 'force-dynamic';

export const GET = createApiHandler(async () => {
  const db = getDatabaseService();

  // Get counts
  const routesResult = await db.listRoutes(1000, 0);
  const routes = routesResult.success ? routesResult.value : [];

  const deliveriesResult = await db.listDeliveries(1000, 0);
  const deliveries = deliveriesResult.success ? deliveriesResult.value : [];

  // Get recent traffic snapshots
  const recentSnapshots: TrafficSnapshot[] = [];
  if (routes.length > 0) {
    for (const route of routes.slice(0, 5)) {
      const snapshotsResult = await db.listTrafficSnapshotsByRoute(route.id, 5);
      if (snapshotsResult.success) {
        recentSnapshots.push(...snapshotsResult.value);
      }
    }
  }

  return Result.ok({
    success: true,
    timestamp: new Date().toISOString(),
    database: {
      adapter: db.currentAdapter,
      routes: {
        count: routes.length,
        sample: routes.slice(0, 3).map(r => ({
          id: r.id,
          origin: r.origin_address,
          destination: r.destination_address,
          origin_coords: r.origin_coords,
          destination_coords: r.destination_coords,
        })),
      },
      deliveries: {
        count: deliveries.length,
        byStatus: {
          in_transit: deliveries.filter(d => d.status === 'in_transit').length,
          delayed: deliveries.filter(d => d.status === 'delayed').length,
          pending: deliveries.filter(d => d.status === 'pending').length,
        },
      },
      trafficSnapshots: {
        count: recentSnapshots.length,
        recent: recentSnapshots.slice(0, 5).map(s => ({
          id: s.id,
          route_id: s.route_id,
          traffic_condition: s.traffic_condition,
          delay_minutes: s.delay_minutes,
          snapshot_at: s.snapshot_at,
        })),
      },
    },
  });
});
