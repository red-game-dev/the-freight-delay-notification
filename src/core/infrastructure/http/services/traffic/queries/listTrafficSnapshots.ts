/**
 * List Traffic Snapshots Fetcher
 * GET /api/traffic
 */

import { fetchJson } from '../../../client/fetchJson';
import { env } from '@/infrastructure/config/EnvValidator';

export interface TrafficSnapshot {
  id: string;
  route_id: string;
  traffic_condition: 'light' | 'moderate' | 'heavy' | 'severe';
  delay_minutes: number;
  duration_seconds: number;
  snapshot_at: string;
  created_at: string;
}

export async function listTrafficSnapshots(): Promise<TrafficSnapshot[]> {
  const url = `${env.NEXT_PUBLIC_API_URL}/api/traffic`;
  return fetchJson<TrafficSnapshot[]>(url);
}
