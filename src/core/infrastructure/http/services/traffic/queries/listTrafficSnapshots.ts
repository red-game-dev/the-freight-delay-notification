/**
 * List Traffic Snapshots Fetcher
 * GET /api/traffic
 */

import { fetchJson } from '../../../client/fetchJson';
import { env } from '@/infrastructure/config/EnvValidator';
import type { PaginatedResponse } from '@/core/utils/paginationUtils';

export interface AffectedDelivery {
  id: string;
  tracking_number: string;
  status: string;
  customer_id: string;
}

export interface TrafficSnapshot {
  id: string;
  route_id: string;
  traffic_condition: 'light' | 'moderate' | 'heavy' | 'severe';
  delay_minutes: number;
  duration_seconds: number;
  snapshot_at: string;
  created_at?: string;
  affected_deliveries: AffectedDelivery[];
}

export async function listTrafficSnapshots(params?: Record<string, string>): Promise<PaginatedResponse<TrafficSnapshot>> {
  const query = params ? `?${new URLSearchParams(params)}` : '';
  const url = `${env.NEXT_PUBLIC_API_URL}/api/traffic${query}`;
  return fetchJson<PaginatedResponse<TrafficSnapshot>>(url);
}
