/**
 * Delete Threshold Fetcher
 * DELETE /api/thresholds/:id
 */

import { fetchJson } from '../../../client/fetchJson';
import { env } from '@/infrastructure/config/EnvValidator';

export async function deleteThreshold(id: string): Promise<void> {
  const url = `${env.NEXT_PUBLIC_API_URL}/api/thresholds/${id}`;
  return fetchJson<void>(url, {
    method: 'DELETE',
  });
}
