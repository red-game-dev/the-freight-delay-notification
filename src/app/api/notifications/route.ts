/**
 * Notifications API Routes
 * GET /api/notifications - List all notifications
 */

import { createClient } from '@supabase/supabase-js';
import { env } from '@/infrastructure/config/EnvValidator';
import { getDatabaseService } from '@/infrastructure/database/DatabaseService';
import { createApiHandler, getQueryParam } from '@/core/infrastructure/http';
import { Result } from '@/core/base/utils/Result';

/**
 * GET /api/notifications
 * List notifications, optionally filtered by deliveryId or customerId
 */
export const GET = createApiHandler(async (request) => {
  const db = getDatabaseService();
  const deliveryId = getQueryParam(request, 'deliveryId');
  const customerId = getQueryParam(request, 'customerId');

  if (deliveryId) {
    return await db.listNotificationsByDelivery(deliveryId);
  }

  if (customerId) {
    return await db.listNotificationsByCustomer(customerId);
  }

  // If no filter, return all notifications using Supabase directly
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    return Result.fail(new Error(error.message));
  }

  return Result.ok(data || []);
});
