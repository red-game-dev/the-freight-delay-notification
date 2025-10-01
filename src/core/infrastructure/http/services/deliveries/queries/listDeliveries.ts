/**
 * List Deliveries Fetcher
 * GET /api/deliveries
 */

import { fetchJson } from '../../../client/fetchJson';
import { env } from '@/infrastructure/config/EnvValidator';
import type { Delivery } from '../types';

export async function listDeliveries(params?: Record<string, string>): Promise<Delivery[]> {
  const query = params ? `?${new URLSearchParams(params)}` : '';
  const url = `${env.NEXT_PUBLIC_API_URL}/api/deliveries${query}`;

  return fetchJson<Delivery[]>(url);
}
