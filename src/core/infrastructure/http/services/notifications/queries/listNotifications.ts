/**
 * List Notifications Fetcher
 * GET /api/notifications
 */

import { fetchJson } from '../../../client/fetchJson';
import { env } from '@/infrastructure/config/EnvValidator';
import type { Notification } from '../types';

export async function listNotifications(params?: Record<string, string>): Promise<Notification[]> {
  const query = params ? `?${new URLSearchParams(params)}` : '';
  const url = `${env.NEXT_PUBLIC_API_URL}/api/notifications${query}`;
  return fetchJson<Notification[]>(url);
}
