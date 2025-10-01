/**
 * Create Delivery Fetcher
 * POST /api/deliveries
 */

import { fetchJson } from '../../../client/fetchJson';
import { apiConfig } from '../../../config';
import type { Delivery, CreateDeliveryInput } from '../types';

export async function createDelivery(data: CreateDeliveryInput): Promise<Delivery> {
  const url = `${apiConfig.baseUrl}/api/deliveries`;

  return fetchJson<Delivery>(url, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
