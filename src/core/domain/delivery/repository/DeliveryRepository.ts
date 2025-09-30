/**
 * Delivery Repository Interface
 * Defines the contract for delivery data access
 * Following Repository pattern from DDD
 */

import type { Result } from '../../../base/utils/Result';
import type { Delivery } from '../entities/Delivery';

export interface DeliveryRepository {
  /**
   * Save a delivery (create or update)
   */
  save(delivery: Delivery): Promise<Result<Delivery>>;

  /**
   * Find delivery by ID
   */
  findById(id: string): Promise<Result<Delivery | null>>;

  /**
   * Find delivery by tracking number
   */
  findByTrackingNumber(trackingNumber: string): Promise<Result<Delivery | null>>;

  /**
   * Find all active deliveries (pending, in_transit, delayed)
   */
  findActiveDeliveries(): Promise<Result<Delivery[]>>;

  /**
   * Find deliveries by customer ID
   */
  findByCustomerId(customerId: string): Promise<Result<Delivery[]>>;

  /**
   * Find deliveries by status
   */
  findByStatus(status: string): Promise<Result<Delivery[]>>;

  /**
   * Find overdue deliveries
   */
  findOverdue(): Promise<Result<Delivery[]>>;

  /**
   * Delete delivery
   */
  delete(id: string): Promise<Result<void>>;
}