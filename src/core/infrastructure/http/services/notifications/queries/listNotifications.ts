/**
 * List Notifications Fetcher
 * GET /api/notifications
 */

import { fetchJson } from '../../../client/fetchJson';
import { env } from '@/infrastructure/config/EnvValidator';
import type { Notification, NotificationStats } from '../types';
import type { PaginatedResponse } from '@/core/utils/paginationUtils';

export interface NotificationsResponse extends PaginatedResponse<Notification> {
  stats?: NotificationStats;
}

export async function listNotifications(params?: Record<string, string>): Promise<NotificationsResponse> {
  const query = params ? `?${new URLSearchParams(params)}` : '';
  const url = `${env.NEXT_PUBLIC_API_URL}/api/notifications${query}`;
  return fetchJson<NotificationsResponse>(url);
}
