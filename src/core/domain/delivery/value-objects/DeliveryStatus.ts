/**
 * DeliveryStatus Value Object
 * Encapsulates delivery status with business rules
 */

import { DomainError } from "../../../base/errors/BaseError";

export enum DeliveryStatusEnum {
  PENDING = "pending",
  IN_TRANSIT = "in_transit",
  DELAYED = "delayed",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
  FAILED = "failed",
}

export class DeliveryStatus {
  private constructor(private readonly _value: DeliveryStatusEnum) {}

  /**
   * Create status from string with validation
   */
  static create(status: string): DeliveryStatus {
    if (
      !Object.values(DeliveryStatusEnum).includes(status as DeliveryStatusEnum)
    ) {
      throw new DomainError(`Invalid delivery status: ${status}`, { status });
    }
    return new DeliveryStatus(status as DeliveryStatusEnum);
  }

  /**
   * Factory methods for common statuses
   */
  static pending(): DeliveryStatus {
    return new DeliveryStatus(DeliveryStatusEnum.PENDING);
  }

  static inTransit(): DeliveryStatus {
    return new DeliveryStatus(DeliveryStatusEnum.IN_TRANSIT);
  }

  static delayed(): DeliveryStatus {
    return new DeliveryStatus(DeliveryStatusEnum.DELAYED);
  }

  static delivered(): DeliveryStatus {
    return new DeliveryStatus(DeliveryStatusEnum.DELIVERED);
  }

  static cancelled(): DeliveryStatus {
    return new DeliveryStatus(DeliveryStatusEnum.CANCELLED);
  }

  static failed(): DeliveryStatus {
    return new DeliveryStatus(DeliveryStatusEnum.FAILED);
  }

  get value(): string {
    return this._value;
  }

  /**
   * Business rule: Check if status is delayed
   */
  isDelayed(): boolean {
    return this._value === DeliveryStatusEnum.DELAYED;
  }

  /**
   * Business rule: Check if delivery can be marked as delayed
   * Only pending or in-transit deliveries can be marked as delayed
   */
  canBeDelayed(): boolean {
    return [DeliveryStatusEnum.PENDING, DeliveryStatusEnum.IN_TRANSIT].includes(
      this._value,
    );
  }

  /**
   * Business rule: Check if delivery is in an active state
   */
  isActive(): boolean {
    return [
      DeliveryStatusEnum.PENDING,
      DeliveryStatusEnum.IN_TRANSIT,
      DeliveryStatusEnum.DELAYED,
    ].includes(this._value);
  }

  /**
   * Business rule: Check if delivery is in a final state
   */
  isFinal(): boolean {
    return [
      DeliveryStatusEnum.DELIVERED,
      DeliveryStatusEnum.CANCELLED,
      DeliveryStatusEnum.FAILED,
    ].includes(this._value);
  }

  /**
   * Business rule: Check if status transition is valid
   */
  canTransitionTo(newStatus: DeliveryStatus): boolean {
    const transitions: Record<DeliveryStatusEnum, DeliveryStatusEnum[]> = {
      [DeliveryStatusEnum.PENDING]: [
        DeliveryStatusEnum.IN_TRANSIT,
        DeliveryStatusEnum.CANCELLED,
      ],
      [DeliveryStatusEnum.IN_TRANSIT]: [
        DeliveryStatusEnum.DELAYED,
        DeliveryStatusEnum.DELIVERED,
        DeliveryStatusEnum.FAILED,
      ],
      [DeliveryStatusEnum.DELAYED]: [
        DeliveryStatusEnum.DELIVERED,
        DeliveryStatusEnum.FAILED,
        DeliveryStatusEnum.CANCELLED,
      ],
      [DeliveryStatusEnum.DELIVERED]: [],
      [DeliveryStatusEnum.CANCELLED]: [],
      [DeliveryStatusEnum.FAILED]: [],
    };

    return transitions[this._value]?.includes(newStatus._value) || false;
  }

  /**
   * Check equality
   */
  equals(other: DeliveryStatus): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
