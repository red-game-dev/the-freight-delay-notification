/**
 * List Deliveries Fetcher
 * GET /api/deliveries
 */

import { fetchJson } from '../../../client/fetchJson';
import { apiConfig } from '../../../config';
import type { Delivery } from '../types';

export async function listDeliveries(params?: Record<string, string>): Promise<Delivery[]> {
  const query = params ? `?${new URLSearchParams(params)}` : '';
  const url = `${apiConfig.baseUrl}/api/deliveries${query}`;

  return fetchJson<Delivery[]>(url);
}
