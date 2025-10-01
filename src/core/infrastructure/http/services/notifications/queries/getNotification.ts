/**
 * Get Notification Fetcher
 * GET /api/notifications/:id
 */

import { fetchJson } from '../../../client/fetchJson';
import { apiConfig } from '../../../config';
import type { Notification } from '../types';

export async function getNotification(id: string): Promise<Notification> {
  const url = `${apiConfig.baseUrl}/api/notifications/${id}`;
  return fetchJson<Notification>(url);
}
