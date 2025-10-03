/**
 * Route Entity
 * Represents a delivery route with traffic data and delay calculation
 * Implements PDF Step 1 - Calculate delay in minutes
 */

import { Entity } from '../../shared/Entity';
import { Coordinates } from '../value-objects/Coordinates';
import type { TrafficCondition } from '@/core/types';

interface RouteProps {
  originAddress: string;
  originCoords: Coordinates;
  destinationAddress: string;
  destinationCoords: Coordinates;
  distanceMeters: number;
  normalDurationSeconds: number;
  currentDurationSeconds?: number;
  trafficCondition?: TrafficCondition;
  createdAt: Date;
  updatedAt: Date;
}

export class Route extends Entity<RouteProps> {
  /**
   * Create a new Route entity
   */
  static create(
    props: Omit<RouteProps, 'createdAt' | 'updatedAt'>,
    id: string
  ): Route {
    const now = new Date();
    return new Route(
      {
        ...props,
        createdAt: now,
        updatedAt: now,
      },
      id
    );
  }

  /**
   * Reconstruct from database
   */
  static fromDatabase(props: RouteProps, id: string): Route {
    return new Route(props, id);
  }

  // Getters
  get originAddress(): string {
    return this.props.originAddress;
  }

  get originCoords(): Coordinates {
    return this.props.originCoords;
  }

  get destinationAddress(): string {
    return this.props.destinationAddress;
  }

  get destinationCoords(): Coordinates {
    return this.props.destinationCoords;
  }

  get distanceMeters(): number {
    return this.props.distanceMeters;
  }

  get normalDurationSeconds(): number {
    return this.props.normalDurationSeconds;
  }

  get currentDurationSeconds(): number | undefined {
    return this.props.currentDurationSeconds;
  }

  get trafficCondition(): TrafficCondition | undefined {
    return this.props.trafficCondition;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * PDF Requirement - Step 1: Calculate delay in minutes
   * Business rule: Delay = (Current Duration - Normal Duration) / 60
   *
   * @returns Delay in minutes (always non-negative)
   */
  public calculateDelayMinutes(): number {
    if (!this.props.currentDurationSeconds) {
      return 0;
    }

    const delaySeconds = this.props.currentDurationSeconds - this.props.normalDurationSeconds;
    return Math.max(0, Math.round(delaySeconds / 60));
  }

  /**
   * Calculate delay percentage
   * Useful for determining traffic severity
   */
  public calculateDelayPercentage(): number {
    if (!this.props.currentDurationSeconds) {
      return 0;
    }

    const delay = this.props.currentDurationSeconds - this.props.normalDurationSeconds;
    return Math.max(0, (delay / this.props.normalDurationSeconds) * 100);
  }

  /**
   * Check if route has traffic data
   */
  public hasTrafficData(): boolean {
    return this.props.currentDurationSeconds !== undefined;
  }

  /**
   * Update traffic data from external API
   */
  public updateTrafficData(
    currentDurationSeconds: number,
    trafficCondition: TrafficCondition
  ): void {
    this.props.currentDurationSeconds = currentDurationSeconds;
    this.props.trafficCondition = trafficCondition;
    this.props.updatedAt = new Date();
  }

  /**
   * Clear traffic data (useful for resetting)
   */
  public clearTrafficData(): void {
    this.props.currentDurationSeconds = undefined;
    this.props.trafficCondition = undefined;
    this.props.updatedAt = new Date();
  }

  /**
   * Get route summary for logging/display
   */
  public getSummary(): string {
    return `${this.props.originAddress} → ${this.props.destinationAddress}`;
  }

  /**
   * Get detailed route information
   */
  public getDetails(): {
    route: string;
    distance: string;
    normalDuration: string;
    currentDuration?: string;
    delay?: string;
    trafficCondition?: TrafficCondition;
  } {
    const distanceKm = (this.props.distanceMeters / 1000).toFixed(1);
    const normalMin = Math.round(this.props.normalDurationSeconds / 60);

    const result: ReturnType<Route['getDetails']> = {
      route: this.getSummary(),
      distance: `${distanceKm} km`,
      normalDuration: `${normalMin} min`,
    };

    if (this.props.currentDurationSeconds) {
      const currentMin = Math.round(this.props.currentDurationSeconds / 60);
      result.currentDuration = `${currentMin} min`;
      result.delay = `${this.calculateDelayMinutes()} min`;
      result.trafficCondition = this.props.trafficCondition;
    }

    return result;
  }

  /**
   * Convert to plain object for persistence
   */
  public toPersistence(): RouteProps & { id: string } {
    return {
      id: this.id,
      originAddress: this.props.originAddress,
      originCoords: this.props.originCoords,
      destinationAddress: this.props.destinationAddress,
      destinationCoords: this.props.destinationCoords,
      distanceMeters: this.props.distanceMeters,
      normalDurationSeconds: this.props.normalDurationSeconds,
      currentDurationSeconds: this.props.currentDurationSeconds,
      trafficCondition: this.props.trafficCondition,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}