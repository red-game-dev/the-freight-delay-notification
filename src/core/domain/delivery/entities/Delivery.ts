/**
 * Delivery Entity
 * Core domain entity for freight deliveries
 * Contains PDF workflow logic for delay threshold checking
 */

import { DomainError } from "../../../base/errors/BaseError";
import { Entity } from "../../shared/Entity";
import type { Coordinates } from "../value-objects/Coordinates";
import { DeliveryStatus } from "../value-objects/DeliveryStatus";

interface DeliveryProps {
  trackingNumber: string;
  customerId: string;
  routeId: string;
  status: DeliveryStatus;
  scheduledDelivery: Date;
  actualDelivery?: Date;
  currentLocation?: Coordinates;
  delayThresholdMinutes: number;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class Delivery extends Entity<DeliveryProps> {
  /**
   * Create a new Delivery entity
   */
  static create(
    props: Omit<DeliveryProps, "createdAt" | "updatedAt" | "metadata"> & {
      metadata?: Record<string, any>;
    },
    id: string,
  ): Delivery {
    const now = new Date();
    return new Delivery(
      {
        ...props,
        metadata: props.metadata || {},
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
  }

  /**
   * Reconstruct from database
   */
  static fromDatabase(props: DeliveryProps, id: string): Delivery {
    return new Delivery(props, id);
  }

  // Getters
  get trackingNumber(): string {
    return this.props.trackingNumber;
  }

  get customerId(): string {
    return this.props.customerId;
  }

  get routeId(): string {
    return this.props.routeId;
  }

  get status(): DeliveryStatus {
    return this.props.status;
  }

  get scheduledDelivery(): Date {
    return this.props.scheduledDelivery;
  }

  get actualDelivery(): Date | undefined {
    return this.props.actualDelivery;
  }

  get currentLocation(): Coordinates | undefined {
    return this.props.currentLocation;
  }

  get delayThresholdMinutes(): number {
    return this.props.delayThresholdMinutes;
  }

  get metadata(): Record<string, any> {
    return this.props.metadata;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * PDF Requirement - Step 2: Check if delay exceeds threshold
   * Business rule: Determines if a delay warrants customer notification
   *
   * @param delayMinutes - Calculated delay from traffic data
   * @returns true if delay exceeds configured threshold
   */
  public shouldNotifyForDelay(delayMinutes: number): boolean {
    return delayMinutes > this.props.delayThresholdMinutes;
  }

  /**
   * Mark delivery as delayed
   * Business rule: Only pending or in-transit deliveries can be delayed
   */
  public markAsDelayed(): void {
    if (!this.props.status.canBeDelayed()) {
      throw new DomainError(
        `Cannot mark delivery as delayed. Current status: ${this.props.status.value}`,
        {
          deliveryId: this.id,
          currentStatus: this.props.status.value,
          trackingNumber: this.props.trackingNumber,
        },
      );
    }

    this.props.status = DeliveryStatus.delayed();
    this.props.updatedAt = new Date();
  }

  /**
   * Update current location
   */
  public updateLocation(location: Coordinates): void {
    this.props.currentLocation = location;
    this.props.updatedAt = new Date();
  }

  /**
   * Mark as delivered
   */
  public markAsDelivered(actualDelivery?: Date): void {
    if (!this.props.status.canTransitionTo(DeliveryStatus.delivered())) {
      throw new DomainError(
        `Cannot mark delivery as delivered. Current status: ${this.props.status.value}`,
        { deliveryId: this.id, currentStatus: this.props.status.value },
      );
    }

    this.props.status = DeliveryStatus.delivered();
    this.props.actualDelivery = actualDelivery || new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * Mark as cancelled
   */
  public markAsCancelled(reason?: string): void {
    if (!this.props.status.canTransitionTo(DeliveryStatus.cancelled())) {
      throw new DomainError(
        `Cannot cancel delivery. Current status: ${this.props.status.value}`,
        { deliveryId: this.id, currentStatus: this.props.status.value },
      );
    }

    this.props.status = DeliveryStatus.cancelled();
    this.props.updatedAt = new Date();

    if (reason) {
      this.props.metadata = {
        ...this.props.metadata,
        cancellationReason: reason,
      };
    }
  }

  /**
   * Check if delivery is overdue
   */
  public isOverdue(currentTime: Date = new Date()): boolean {
    return (
      currentTime > this.props.scheduledDelivery && !this.props.actualDelivery
    );
  }

  /**
   * Get time until scheduled delivery (in minutes)
   */
  public getMinutesUntilScheduled(currentTime: Date = new Date()): number {
    const diff = this.props.scheduledDelivery.getTime() - currentTime.getTime();
    return Math.round(diff / 60000); // Convert ms to minutes
  }

  /**
   * Update metadata
   */
  public updateMetadata(metadata: Record<string, any>): void {
    this.props.metadata = {
      ...this.props.metadata,
      ...metadata,
    };
    this.props.updatedAt = new Date();
  }

  /**
   * Convert to plain object for persistence
   */
  public toPersistence(): DeliveryProps & { id: string } {
    return {
      id: this.id,
      trackingNumber: this.props.trackingNumber,
      customerId: this.props.customerId,
      routeId: this.props.routeId,
      status: this.props.status,
      scheduledDelivery: this.props.scheduledDelivery,
      actualDelivery: this.props.actualDelivery,
      currentLocation: this.props.currentLocation,
      delayThresholdMinutes: this.props.delayThresholdMinutes,
      metadata: this.props.metadata,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
