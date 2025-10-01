/**
 * Get Threshold Fetcher
 * GET /api/thresholds/:id
 */

import { fetchJson } from '../../../client/fetchJson';
import { apiConfig } from '../../../config';
import type { Threshold } from '../types';

export async function getThreshold(id: string): Promise<Threshold> {
  const url = `${apiConfig.baseUrl}/api/thresholds/${id}`;
  return fetchJson<Threshold>(url);
}
