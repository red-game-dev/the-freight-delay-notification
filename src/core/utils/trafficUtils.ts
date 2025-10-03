/**
 * Traffic Utilities
 * Reusable utilities for traffic condition handling and data transformation
 */

import type { TrafficSnapshot } from '@/core/infrastructure/http/services/traffic/queries/listTrafficSnapshots';

/**
 * Traffic condition configuration
 * Maps traffic conditions to display properties
 */
export const TRAFFIC_CONFIG = {
  light: {
    label: 'Light',
    variant: 'success' as const,
    color: 'text-green-600',
    hexColor: '#22c55e',
  },
  moderate: {
    label: 'Moderate',
    variant: 'warning' as const,
    color: 'text-yellow-600',
    hexColor: '#eab308',
  },
  heavy: {
    label: 'Heavy',
    variant: 'error' as const,
    color: 'text-orange-600',
    hexColor: '#f97316',
  },
  severe: {
    label: 'Severe',
    variant: 'error' as const,
    color: 'text-red-600',
    hexColor: '#ef4444',
  },
} as const;

/**
 * Severity color mapping for incident markers
 */
export const SEVERITY_COLORS = {
  minor: '#eab308',    // yellow
  moderate: '#f97316', // orange
  major: '#ef4444',    // red
  severe: '#dc2626',   // dark red
} as const;

export type TrafficCondition = keyof typeof TRAFFIC_CONFIG;
export type TrafficSeverity = keyof typeof SEVERITY_COLORS;

/**
 * Get traffic configuration for a condition
 */
export function getTrafficConfig(condition: string) {
  const key = condition.toLowerCase() as TrafficCondition;
  return TRAFFIC_CONFIG[key] || TRAFFIC_CONFIG.light;
}

/**
 * Get color for traffic condition (for map polylines)
 */
export function getTrafficColor(condition: string): string {
  const key = condition.toLowerCase() as TrafficCondition;
  return TRAFFIC_CONFIG[key]?.hexColor || TRAFFIC_CONFIG.light.hexColor;
}

/**
 * Get color for incident severity marker
 */
export function getSeverityColor(severity: string): string {
  const key = severity.toLowerCase() as TrafficSeverity;
  return SEVERITY_COLORS[key] || SEVERITY_COLORS.minor;
}

/**
 * Transform traffic snapshot with enriched data
 * Extracts incident details and normalizes the structure
 */
export interface EnrichedSnapshot {
  id: string;
  route_id: string;
  traffic_condition: string;
  delay_minutes: number;
  description: string | null;
  severity: string;
  affected_area: string | null;
  incident_type: string | null;
  snapshot_at: string;
  config: typeof TRAFFIC_CONFIG[TrafficCondition];
  formatted_incident_type: string | null;
}

export function enrichSnapshot(snapshot: TrafficSnapshot): EnrichedSnapshot {
  const config = getTrafficConfig(snapshot.traffic_condition);

  return {
    id: snapshot.id,
    route_id: snapshot.route_id,
    traffic_condition: snapshot.traffic_condition,
    delay_minutes: snapshot.delay_minutes,
    description: snapshot.description || null,
    severity: snapshot.severity || 'minor',
    affected_area: snapshot.affected_area || null,
    incident_type: snapshot.incident_type || null,
    snapshot_at: snapshot.snapshot_at,
    config,
    formatted_incident_type: snapshot.incident_type
      ? snapshot.incident_type.replace('_', ' ')
      : null,
  };
}

/**
 * Sort traffic conditions by severity (worst first)
 */
const SEVERITY_ORDER: Record<string, number> = {
  severe: 4,
  heavy: 3,
  moderate: 2,
  light: 1,
};

export function compareTrafficSeverity(a: string, b: string): number {
  const aSeverity = SEVERITY_ORDER[a.toLowerCase()] || 0;
  const bSeverity = SEVERITY_ORDER[b.toLowerCase()] || 0;
  return bSeverity - aSeverity; // Descending (severe first)
}

/**
 * Count snapshots by traffic condition
 */
export interface TrafficCounts {
  all: number;
  light: number;
  moderate: number;
  heavy: number;
  severe: number;
}

export function countByCondition(snapshots: TrafficSnapshot[]): TrafficCounts {
  return {
    all: snapshots.length,
    light: snapshots.filter(s => s.traffic_condition === 'light').length,
    moderate: snapshots.filter(s => s.traffic_condition === 'moderate').length,
    heavy: snapshots.filter(s => s.traffic_condition === 'heavy').length,
    severe: snapshots.filter(s => s.traffic_condition === 'severe').length,
  };
}
