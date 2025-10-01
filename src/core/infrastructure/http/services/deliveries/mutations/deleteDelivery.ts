/**
 * Delete Delivery Fetcher
 * DELETE /api/deliveries/:id
 */

import { fetchJson } from '../../../client/fetchJson';
import { apiConfig } from '../../../config';

export async function deleteDelivery(id: string): Promise<void> {
  const url = `${apiConfig.baseUrl}/api/deliveries/${id}`;

  return fetchJson<void>(url, {
    method: 'DELETE',
  });
}
