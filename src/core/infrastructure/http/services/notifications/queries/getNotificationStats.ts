/**
 * Get Notification Stats Fetcher
 * GET /api/notifications/stats
 */

import { fetchJson } from '../../../client/fetchJson';
import { apiConfig } from '../../../config';
import type { NotificationStats } from '../types';

export async function getNotificationStats(): Promise<NotificationStats> {
  const url = `${apiConfig.baseUrl}/api/notifications/stats`;
  return fetchJson<NotificationStats>(url);
}
