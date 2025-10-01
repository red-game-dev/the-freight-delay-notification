/**
 * Delivery Statistics API Route
 * GET /api/deliveries/stats - Get delivery statistics
 */

import { getDatabaseService } from '@/infrastructure/database/DatabaseService';
import { createApiHandler } from '@/core/infrastructure/http';
import { Result } from '@/core/base/utils/Result';

/**
 * GET /api/deliveries/stats
 * Calculate delivery statistics from all deliveries
 */
export const GET = createApiHandler(async (request) => {
  const db = getDatabaseService();

  // Get all deliveries
  const result = await db.listDeliveries(1000, 0);

  if (!result.success) {
    return result;
  }

  const deliveries = result.value;

  // Calculate stats
  const stats = {
    total: deliveries.length,
    in_transit: deliveries.filter((d: any) => d.status === 'in_transit').length,
    delayed: deliveries.filter((d: any) => d.status === 'delayed').length,
    delivered: deliveries.filter((d: any) => d.status === 'delivered').length,
    pending: deliveries.filter((d: any) => d.status === 'pending').length,
    cancelled: deliveries.filter((d: any) => d.status === 'cancelled').length,
  };

  return Result.ok(stats);
});
