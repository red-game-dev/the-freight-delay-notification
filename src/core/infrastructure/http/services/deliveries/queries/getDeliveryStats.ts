/**
 * Get Delivery Stats Fetcher
 * GET /api/deliveries/stats
 */

import { fetchJson } from '../../../client/fetchJson';
import { apiConfig } from '../../../config';
import type { DeliveryStats } from '../types';

export async function getDeliveryStats(): Promise<DeliveryStats> {
  const url = `${apiConfig.baseUrl}/api/deliveries/stats`;
  return fetchJson<DeliveryStats>(url);
}
