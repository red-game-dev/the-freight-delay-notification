/**
 * Delete Threshold Fetcher
 * DELETE /api/thresholds/:id
 */

import { fetchJson } from '../../../client/fetchJson';
import { apiConfig } from '../../../config';

export async function deleteThreshold(id: string): Promise<void> {
  const url = `${apiConfig.baseUrl}/api/thresholds/${id}`;
  return fetchJson<void>(url, {
    method: 'DELETE',
  });
}
