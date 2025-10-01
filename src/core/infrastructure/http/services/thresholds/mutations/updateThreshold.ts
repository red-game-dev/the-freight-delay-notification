/**
 * Update Threshold Fetcher
 * PATCH /api/thresholds/:id
 */

import { fetchJson } from '../../../client/fetchJson';
import { apiConfig } from '../../../config';
import type { Threshold, UpdateThresholdInput } from '../types';

export async function updateThreshold(id: string, data: UpdateThresholdInput): Promise<Threshold> {
  const url = `${apiConfig.baseUrl}/api/thresholds/${id}`;
  return fetchJson<Threshold>(url, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}
