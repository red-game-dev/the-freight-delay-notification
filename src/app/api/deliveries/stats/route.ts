/**
 * Delivery Statistics API Route
 * GET /api/deliveries/stats - Get delivery statistics
 */

import { getDatabaseService } from '@/infrastructure/database/DatabaseService';
import { createApiHandler } from '@/core/infrastructure/http';
import { Result } from '@/core/base/utils/Result';
import type { Delivery } from '@/infrastructure/database/types/database.types';
import { setAuditContext } from '@/app/api/middleware/auditContext';

/**
 * GET /api/deliveries/stats
 * Calculate delivery statistics from all deliveries
 */
export const GET = createApiHandler(async (request) => {
  await setAuditContext(request);
  const db = getDatabaseService();

  // Get all deliveries and transform to stats using Result.map
  return Result.map(
    await db.listDeliveries(1000, 0),
    (deliveries) => ({
      total: deliveries.length,
      in_transit: deliveries.filter((d: Delivery) => d.status === 'in_transit').length,
      delayed: deliveries.filter((d: Delivery) => d.status === 'delayed').length,
      delivered: deliveries.filter((d: Delivery) => d.status === 'delivered').length,
      pending: deliveries.filter((d: Delivery) => d.status === 'pending').length,
      cancelled: deliveries.filter((d: Delivery) => d.status === 'cancelled').length,
    })
  );
});
