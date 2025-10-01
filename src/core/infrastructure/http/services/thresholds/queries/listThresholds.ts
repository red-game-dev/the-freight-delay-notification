/**
 * List Thresholds Fetcher
 * GET /api/thresholds
 */

import { fetchJson } from '../../../client/fetchJson';
import { apiConfig } from '../../../config';
import type { Threshold } from '../types';

export async function listThresholds(): Promise<Threshold[]> {
  const url = `${apiConfig.baseUrl}/api/thresholds`;
  return fetchJson<Threshold[]>(url);
}
