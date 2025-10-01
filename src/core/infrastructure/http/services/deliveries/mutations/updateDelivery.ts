/**
 * Update Delivery Fetcher
 * PATCH /api/deliveries/:id
 */

import { fetchJson } from '../../../client/fetchJson';
import { apiConfig } from '../../../config';
import type { Delivery, UpdateDeliveryInput } from '../types';

export async function updateDelivery(id: string, data: UpdateDeliveryInput): Promise<Delivery> {
  const url = `${apiConfig.baseUrl}/api/deliveries/${id}`;

  return fetchJson<Delivery>(url, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}
