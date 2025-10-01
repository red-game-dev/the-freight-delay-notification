/**
 * Update Delivery Fetcher
 * PATCH /api/deliveries/:id
 */

import { fetchJson } from '../../../client/fetchJson';
import { env } from '@/infrastructure/config/EnvValidator';
import type { Delivery, UpdateDeliveryInput } from '../types';

export async function updateDelivery(id: string, data: UpdateDeliveryInput): Promise<Delivery> {
  const url = `${env.NEXT_PUBLIC_API_URL}/api/deliveries/${id}`;

  return fetchJson<Delivery>(url, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}
