/**
 * Database Adapter Interface
 * Defines the contract for database operations - allows swapping databases easily
 */

import type { Result } from '../../../core/base/utils/Result';
import type {
  Customer,
  CreateCustomerInput,
  Route,
  CreateRouteInput,
  Delivery,
  CreateDeliveryInput,
  UpdateDeliveryInput,
  Notification,
  CreateNotificationInput,
  UpdateNotificationInput,
  TrafficSnapshot,
  CreateTrafficSnapshotInput,
  WorkflowExecution,
  CreateWorkflowExecutionInput,
  UpdateWorkflowExecutionInput,
} from '../types/database.types';

/**
 * Database Adapter Interface
 * All database adapters must implement this interface
 */
export interface DatabaseAdapter {
  /**
   * Adapter name for logging
   */
  readonly name: string;

  /**
   * Check if adapter is available/configured
   */
  isAvailable(): boolean;

  // ===== Customer Operations =====
  getCustomerById(id: string): Promise<Result<Customer | null>>;
  getCustomerByEmail(email: string): Promise<Result<Customer | null>>;
  createCustomer(input: CreateCustomerInput): Promise<Result<Customer>>;
  listCustomers(limit?: number, offset?: number): Promise<Result<Customer[]>>;

  // ===== Route Operations =====
  getRouteById(id: string): Promise<Result<Route | null>>;
  createRoute(input: CreateRouteInput): Promise<Result<Route>>;
  listRoutes(limit?: number, offset?: number): Promise<Result<Route[]>>;

  // ===== Delivery Operations =====
  getDeliveryById(id: string): Promise<Result<Delivery | null>>;
  getDeliveryByTrackingNumber(trackingNumber: string): Promise<Result<Delivery | null>>;
  createDelivery(input: CreateDeliveryInput): Promise<Result<Delivery>>;
  updateDelivery(id: string, input: UpdateDeliveryInput): Promise<Result<Delivery>>;
  listDeliveries(limit?: number, offset?: number): Promise<Result<Delivery[]>>;
  listDeliveriesByCustomer(customerId: string, limit?: number): Promise<Result<Delivery[]>>;
  listDeliveriesByStatus(status: string, limit?: number): Promise<Result<Delivery[]>>;

  // ===== Notification Operations =====
  getNotificationById(id: string): Promise<Result<Notification | null>>;
  createNotification(input: CreateNotificationInput): Promise<Result<Notification>>;
  updateNotification(id: string, input: UpdateNotificationInput): Promise<Result<Notification>>;
  listNotificationsByDelivery(deliveryId: string): Promise<Result<Notification[]>>;
  listNotificationsByCustomer(customerId: string, limit?: number): Promise<Result<Notification[]>>;

  // ===== Traffic Snapshot Operations =====
  createTrafficSnapshot(input: CreateTrafficSnapshotInput): Promise<Result<TrafficSnapshot>>;
  listTrafficSnapshotsByRoute(routeId: string, limit?: number): Promise<Result<TrafficSnapshot[]>>;

  // ===== Workflow Execution Operations =====
  getWorkflowExecutionById(id: string): Promise<Result<WorkflowExecution | null>>;
  getWorkflowExecutionByWorkflowId(workflowId: string): Promise<Result<WorkflowExecution | null>>;
  createWorkflowExecution(input: CreateWorkflowExecutionInput): Promise<Result<WorkflowExecution>>;
  updateWorkflowExecution(id: string, input: UpdateWorkflowExecutionInput): Promise<Result<WorkflowExecution>>;
  listWorkflowExecutionsByDelivery(deliveryId: string): Promise<Result<WorkflowExecution[]>>;
}