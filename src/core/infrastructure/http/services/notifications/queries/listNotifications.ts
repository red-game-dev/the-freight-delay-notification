/**
 * List Notifications Fetcher
 * GET /api/notifications
 */

import { fetchJson } from '../../../client/fetchJson';
import { apiConfig } from '../../../config';
import type { Notification } from '../types';

export async function listNotifications(params?: Record<string, string>): Promise<Notification[]> {
  const query = params ? `?${new URLSearchParams(params)}` : '';
  const url = `${apiConfig.baseUrl}/api/notifications${query}`;
  return fetchJson<Notification[]>(url);
}
