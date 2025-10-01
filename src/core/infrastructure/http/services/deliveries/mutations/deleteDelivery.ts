/**
 * Delete Delivery Fetcher
 * DELETE /api/deliveries/:id
 */

import { fetchJson } from '../../../client/fetchJson';
import { env } from '@/infrastructure/config/EnvValidator';

export async function deleteDelivery(id: string): Promise<void> {
  const url = `${env.NEXT_PUBLIC_API_URL}/api/deliveries/${id}`;

  return fetchJson<void>(url, {
    method: 'DELETE',
  });
}
