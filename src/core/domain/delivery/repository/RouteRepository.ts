/**
 * Route Repository Interface
 * Defines the contract for route data access
 * Following Repository pattern from DDD
 */

import type { Result } from '../../../base/utils/Result';
import type { Route, TrafficCondition } from '../entities/Route';

export interface RouteRepository {
  /**
   * Save a route (create or update)
   */
  save(route: Route): Promise<Result<Route>>;

  /**
   * Find route by ID
   */
  findById(id: string): Promise<Result<Route | null>>;

  /**
   * Find all routes
   */
  findAll(): Promise<Result<Route[]>>;

  /**
   * Update traffic data for a route
   */
  updateTrafficData(
    routeId: string,
    currentDurationSeconds: number,
    trafficCondition: TrafficCondition
  ): Promise<Result<void>>;

  /**
   * Find routes with active traffic data
   */
  findWithTrafficData(): Promise<Result<Route[]>>;

  /**
   * Delete route
   */
  delete(id: string): Promise<Result<void>>;
}