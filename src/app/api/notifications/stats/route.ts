/**
 * Notification Statistics API Route
 * GET /api/notifications/stats - Get notification statistics
 */

import { createClient } from '@supabase/supabase-js';
import { env } from '@/infrastructure/config/EnvValidator';
import { createApiHandler } from '@/core/infrastructure/http';
import { Result } from '@/core/base/utils/Result';

/**
 * GET /api/notifications/stats
 * Get notification statistics from database
 */
export const GET = createApiHandler(async (request) => {
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Get all notifications
  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('status');

  if (error) {
    return Result.fail(new Error(error.message));
  }

  const total = notifications?.length || 0;
  const sent = notifications?.filter(n => n.status === 'sent').length || 0;
  const failed = notifications?.filter(n => n.status === 'failed').length || 0;
  const successRate = total > 0 ? (sent / total) * 100 : 0;

  const stats = {
    total,
    sent,
    failed,
    success_rate: successRate,
  };

  return Result.ok(stats);
});
