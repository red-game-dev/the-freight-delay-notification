/**
 * List Traffic Snapshots Fetcher
 * GET /api/traffic
 */

import type {
  TrafficCondition,
  TrafficIncidentType,
  TrafficSeverity,
} from "@/core/types/traffic";
import type { PaginatedResponse } from "@/core/utils/paginationUtils";
import { env } from "@/infrastructure/config/EnvValidator";
import { fetchJson } from "../../../client/fetchJson";

export interface AffectedDelivery {
  id: string;
  tracking_number: string;
  status: string;
  customer_id: string;
}

export interface TrafficSnapshot {
  id: string;
  route_id: string;
  traffic_condition: TrafficCondition;
  delay_minutes: number;
  duration_seconds: number;
  snapshot_at: string;
  created_at?: string;
  affected_deliveries: AffectedDelivery[];
  description?: string;
  severity?: TrafficSeverity;
  affected_area?: string;
  incident_type?: TrafficIncidentType;
}

export interface TrafficStats {
  total: number;
  delayed: number;
  avg_delay: number;
  condition_counts?: {
    all: number;
    light: number;
    moderate: number;
    heavy: number;
    severe: number;
  };
}

export interface TrafficSnapshotResponse
  extends PaginatedResponse<TrafficSnapshot> {
  stats?: TrafficStats;
}

export async function listTrafficSnapshots(
  params?: Record<string, string>,
): Promise<TrafficSnapshotResponse> {
  const query = params ? `?${new URLSearchParams(params)}` : "";
  const url = `${env.NEXT_PUBLIC_API_URL}/api/traffic${query}`;
  return fetchJson<TrafficSnapshotResponse>(url);
}
