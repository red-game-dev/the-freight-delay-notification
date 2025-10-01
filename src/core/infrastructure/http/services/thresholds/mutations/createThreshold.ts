/**
 * Create Threshold Fetcher
 * POST /api/thresholds
 */

import { fetchJson } from '../../../client/fetchJson';
import { apiConfig } from '../../../config';
import type { Threshold, CreateThresholdInput } from '../types';

export async function createThreshold(data: CreateThresholdInput): Promise<Threshold> {
  const url = `${apiConfig.baseUrl}/api/thresholds`;
  return fetchJson<Threshold>(url, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
