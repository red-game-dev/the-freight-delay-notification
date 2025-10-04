/**
 * Traffic Adapter Interface
 * Defines the contract for all traffic data providers
 */

import type { Result } from "../../../core/base/utils/Result";
import type {
  RouteInput,
  TrafficData,
} from "../../../types/shared/traffic.types";

export interface TrafficAdapter {
  /**
   * Provider name for logging and tracking
   */
  readonly providerName: string;

  /**
   * Priority order for fallback (lower number = higher priority)
   */
  readonly priority: number;

  /**
   * Check if this adapter is properly configured and ready to use
   */
  isAvailable(): boolean;

  /**
   * Fetch traffic data for a given route
   */
  getTrafficData(route: RouteInput): Promise<Result<TrafficData>>;
}
