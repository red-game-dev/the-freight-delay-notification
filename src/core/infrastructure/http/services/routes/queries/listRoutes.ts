/**
 * List Routes Fetcher
 * GET /api/routes
 */

import { fetchJson } from '../../../client/fetchJson';
import { env } from '@/infrastructure/config/EnvValidator';
import type { TrafficCondition } from '@/core/types';

export interface Route {
  id: string;
  origin_address: string;
  origin_coords: { x: number; y: number };
  destination_address: string;
  destination_coords: { x: number; y: number };
  distance_meters: number;
  normal_duration_seconds: number;
  current_duration_seconds: number | null;
  traffic_condition: TrafficCondition | null;
  created_at: string;
  updated_at: string;
}

export async function listRoutes(): Promise<Route[]> {
  const url = `${env.NEXT_PUBLIC_API_URL}/api/routes`;
  return fetchJson<Route[]>(url);
}
