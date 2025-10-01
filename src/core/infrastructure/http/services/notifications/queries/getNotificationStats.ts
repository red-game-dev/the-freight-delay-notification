/**
 * Get Notification Stats Fetcher
 * GET /api/notifications/stats
 */

import { fetchJson } from '../../../client/fetchJson';
import { env } from '@/infrastructure/config/EnvValidator';
import type { NotificationStats } from '../types';

export async function getNotificationStats(): Promise<NotificationStats> {
  const url = `${env.NEXT_PUBLIC_API_URL}/api/notifications/stats`;
  return fetchJson<NotificationStats>(url);
}
