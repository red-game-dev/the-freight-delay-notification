/**
 * List Thresholds Fetcher
 * GET /api/thresholds
 */

import { fetchJson } from '../../../client/fetchJson';
import { env } from '@/infrastructure/config/EnvValidator';
import type { Threshold } from '../types';

export async function listThresholds(): Promise<Threshold[]> {
  const url = `${env.NEXT_PUBLIC_API_URL}/api/thresholds`;
  return fetchJson<Threshold[]>(url);
}
