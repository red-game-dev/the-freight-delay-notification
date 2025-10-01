/**
 * Get Delivery Fetcher
 * GET /api/deliveries/:id
 */

import { fetchJson } from '../../../client/fetchJson';
import { apiConfig } from '../../../config';
import type { Delivery } from '../types';

export async function getDelivery(id: string): Promise<Delivery> {
  const url = `${apiConfig.baseUrl}/api/deliveries/${id}`;
  return fetchJson<Delivery>(url);
}
