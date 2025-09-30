/**
 * Mock Database Adapter
 * In-memory implementation for testing without real database
 */

import { success, failure } from '../../../core/base/utils/Result';
import type { Result } from '../../../core/base/utils/Result';
import { InfrastructureError } from '../../../core/base/errors/BaseError';
import type { DatabaseAdapter } from './DatabaseAdapter.interface';
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
 * Mock Database Adapter
 * Stores all data in-memory using Maps
 * Perfect for testing without external dependencies
 */
export class MockDatabaseAdapter implements DatabaseAdapter {
  public readonly name = 'Mock';

  // In-memory storage
  private customers = new Map<string, Customer>();
  private routes = new Map<string, Route>();
  private deliveries = new Map<string, Delivery>();
  private notifications = new Map<string, Notification>();
  private trafficSnapshots = new Map<string, TrafficSnapshot>();
  private workflowExecutions = new Map<string, WorkflowExecution>();

  constructor(seedWithMockData = true) {
    if (seedWithMockData) {
      this.seedMockData();
    }
  }

  isAvailable(): boolean {
    return true; // Always available
  }

  /**
   * Seed with realistic mock data
   */
  private seedMockData(): void {
    // Mock Customers
    const customer1: Customer = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      name: 'John Doe',
      notification_preferences: { primary: 'email', secondary: 'sms' },
      created_at: new Date('2024-01-01T00:00:00Z'),
      updated_at: new Date('2024-01-01T00:00:00Z'),
    };
    const customer2: Customer = {
      id: '550e8400-e29b-41d4-a716-446655440001',
      email: 'jane.smith@example.com',
      phone: '+1234567891',
      name: 'Jane Smith',
      notification_preferences: { primary: 'sms', secondary: 'email' },
      created_at: new Date('2024-01-01T00:00:00Z'),
      updated_at: new Date('2024-01-01T00:00:00Z'),
    };
    this.customers.set(customer1.id, customer1);
    this.customers.set(customer2.id, customer2);

    // Mock Routes
    const route1: Route = {
      id: '660e8400-e29b-41d4-a716-446655440000',
      origin_address: '123 Main St, New York, NY',
      origin_coords: { lat: 40.7128, lng: -74.006 },
      destination_address: '456 Oak Ave, Brooklyn, NY',
      destination_coords: { lat: 40.6782, lng: -73.9442 },
      distance_meters: 15000,
      normal_duration_seconds: 1800,
      current_duration_seconds: null,
      traffic_condition: null,
      created_at: new Date('2024-01-01T00:00:00Z'),
      updated_at: new Date('2024-01-01T00:00:00Z'),
    };
    const route2: Route = {
      id: '660e8400-e29b-41d4-a716-446655440001',
      origin_address: '789 Pine St, Los Angeles, CA',
      origin_coords: { lat: 34.0522, lng: -118.2437 },
      destination_address: '321 Elm St, Santa Monica, CA',
      destination_coords: { lat: 34.0195, lng: -118.4912 },
      distance_meters: 25000,
      normal_duration_seconds: 2400,
      current_duration_seconds: null,
      traffic_condition: null,
      created_at: new Date('2024-01-01T00:00:00Z'),
      updated_at: new Date('2024-01-01T00:00:00Z'),
    };
    this.routes.set(route1.id, route1);
    this.routes.set(route2.id, route2);

    // Mock Deliveries
    const delivery1: Delivery = {
      id: '770e8400-e29b-41d4-a716-446655440000',
      tracking_number: 'FD-2024-001',
      customer_id: customer1.id,
      route_id: route1.id,
      status: 'in_transit',
      scheduled_delivery: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      actual_delivery: null,
      current_location: null,
      delay_threshold_minutes: 30,
      metadata: {},
      created_at: new Date('2024-01-01T00:00:00Z'),
      updated_at: new Date('2024-01-01T00:00:00Z'),
    };
    const delivery2: Delivery = {
      id: '770e8400-e29b-41d4-a716-446655440001',
      tracking_number: 'FD-2024-002',
      customer_id: customer2.id,
      route_id: route2.id,
      status: 'pending',
      scheduled_delivery: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
      actual_delivery: null,
      current_location: null,
      delay_threshold_minutes: 45,
      metadata: {},
      created_at: new Date('2024-01-01T00:00:00Z'),
      updated_at: new Date('2024-01-01T00:00:00Z'),
    };
    this.deliveries.set(delivery1.id, delivery1);
    this.deliveries.set(delivery2.id, delivery2);
  }

  /**
   * Generate deterministic UUID for testing
   */
  private generateId(): string {
    return `mock-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  // ===== Customer Operations =====

  async getCustomerById(id: string): Promise<Result<Customer | null>> {
    try {
      const customer = this.customers.get(id);
      return success(customer || null);
    } catch (error: any) {
      return failure(new InfrastructureError(`Mock: Failed to get customer: ${error.message}`));
    }
  }

  async getCustomerByEmail(email: string): Promise<Result<Customer | null>> {
    try {
      const customer = Array.from(this.customers.values()).find((c) => c.email === email);
      return success(customer || null);
    } catch (error: any) {
      return failure(new InfrastructureError(`Mock: Failed to get customer by email: ${error.message}`));
    }
  }

  async createCustomer(input: CreateCustomerInput): Promise<Result<Customer>> {
    try {
      const customer: Customer = {
        id: this.generateId(),
        email: input.email,
        phone: input.phone || null,
        name: input.name,
        notification_preferences: input.notification_preferences || { primary: 'email' },
        created_at: new Date(),
        updated_at: new Date(),
      };
      this.customers.set(customer.id, customer);
      return success(customer);
    } catch (error: any) {
      return failure(new InfrastructureError(`Mock: Failed to create customer: ${error.message}`));
    }
  }

  async listCustomers(limit = 100, offset = 0): Promise<Result<Customer[]>> {
    try {
      const customers = Array.from(this.customers.values()).slice(offset, offset + limit);
      return success(customers);
    } catch (error: any) {
      return failure(new InfrastructureError(`Mock: Failed to list customers: ${error.message}`));
    }
  }

  // ===== Route Operations =====

  async getRouteById(id: string): Promise<Result<Route | null>> {
    try {
      const route = this.routes.get(id);
      return success(route || null);
    } catch (error: any) {
      return failure(new InfrastructureError(`Mock: Failed to get route: ${error.message}`));
    }
  }

  async createRoute(input: CreateRouteInput): Promise<Result<Route>> {
    try {
      const route: Route = {
        id: this.generateId(),
        origin_address: input.origin_address,
        origin_coords: input.origin_coords,
        destination_address: input.destination_address,
        destination_coords: input.destination_coords,
        distance_meters: input.distance_meters,
        normal_duration_seconds: input.normal_duration_seconds,
        current_duration_seconds: input.current_duration_seconds || null,
        traffic_condition: input.traffic_condition || null,
        created_at: new Date(),
        updated_at: new Date(),
      };
      this.routes.set(route.id, route);
      return success(route);
    } catch (error: any) {
      return failure(new InfrastructureError(`Mock: Failed to create route: ${error.message}`));
    }
  }

  async listRoutes(limit = 100, offset = 0): Promise<Result<Route[]>> {
    try {
      const routes = Array.from(this.routes.values()).slice(offset, offset + limit);
      return success(routes);
    } catch (error: any) {
      return failure(new InfrastructureError(`Mock: Failed to list routes: ${error.message}`));
    }
  }

  // ===== Delivery Operations =====

  async getDeliveryById(id: string): Promise<Result<Delivery | null>> {
    try {
      const delivery = this.deliveries.get(id);
      return success(delivery || null);
    } catch (error: any) {
      return failure(new InfrastructureError(`Mock: Failed to get delivery: ${error.message}`));
    }
  }

  async getDeliveryByTrackingNumber(trackingNumber: string): Promise<Result<Delivery | null>> {
    try {
      const delivery = Array.from(this.deliveries.values()).find((d) => d.tracking_number === trackingNumber);
      return success(delivery || null);
    } catch (error: any) {
      return failure(new InfrastructureError(`Mock: Failed to get delivery by tracking number: ${error.message}`));
    }
  }

  async createDelivery(input: CreateDeliveryInput): Promise<Result<Delivery>> {
    try {
      const delivery: Delivery = {
        id: this.generateId(),
        tracking_number: input.tracking_number,
        customer_id: input.customer_id,
        route_id: input.route_id,
        status: 'pending',
        scheduled_delivery: input.scheduled_delivery,
        actual_delivery: null,
        current_location: null,
        delay_threshold_minutes: input.delay_threshold_minutes || 30,
        metadata: input.metadata || {},
        created_at: new Date(),
        updated_at: new Date(),
      };
      this.deliveries.set(delivery.id, delivery);
      return success(delivery);
    } catch (error: any) {
      return failure(new InfrastructureError(`Mock: Failed to create delivery: ${error.message}`));
    }
  }

  async updateDelivery(id: string, input: UpdateDeliveryInput): Promise<Result<Delivery>> {
    try {
      const delivery = this.deliveries.get(id);
      if (!delivery) {
        return failure(new InfrastructureError(`Mock: Delivery not found: ${id}`));
      }

      const updated: Delivery = {
        ...delivery,
        status: input.status ?? delivery.status,
        actual_delivery: input.actual_delivery ?? delivery.actual_delivery,
        current_location: input.current_location ?? delivery.current_location,
        metadata: input.metadata ?? delivery.metadata,
        updated_at: new Date(),
      };

      this.deliveries.set(id, updated);
      return success(updated);
    } catch (error: any) {
      return failure(new InfrastructureError(`Mock: Failed to update delivery: ${error.message}`));
    }
  }

  async listDeliveries(limit = 100, offset = 0): Promise<Result<Delivery[]>> {
    try {
      const deliveries = Array.from(this.deliveries.values()).slice(offset, offset + limit);
      return success(deliveries);
    } catch (error: any) {
      return failure(new InfrastructureError(`Mock: Failed to list deliveries: ${error.message}`));
    }
  }

  async listDeliveriesByCustomer(customerId: string, limit = 100): Promise<Result<Delivery[]>> {
    try {
      const deliveries = Array.from(this.deliveries.values())
        .filter((d) => d.customer_id === customerId)
        .slice(0, limit);
      return success(deliveries);
    } catch (error: any) {
      return failure(new InfrastructureError(`Mock: Failed to list deliveries by customer: ${error.message}`));
    }
  }

  async listDeliveriesByStatus(status: string, limit = 100): Promise<Result<Delivery[]>> {
    try {
      const deliveries = Array.from(this.deliveries.values())
        .filter((d) => d.status === status)
        .slice(0, limit);
      return success(deliveries);
    } catch (error: any) {
      return failure(new InfrastructureError(`Mock: Failed to list deliveries by status: ${error.message}`));
    }
  }

  // ===== Notification Operations =====

  async getNotificationById(id: string): Promise<Result<Notification | null>> {
    try {
      const notification = this.notifications.get(id);
      return success(notification || null);
    } catch (error: any) {
      return failure(new InfrastructureError(`Mock: Failed to get notification: ${error.message}`));
    }
  }

  async createNotification(input: CreateNotificationInput): Promise<Result<Notification>> {
    try {
      const notification: Notification = {
        id: this.generateId(),
        delivery_id: input.delivery_id,
        customer_id: input.customer_id,
        channel: input.channel,
        status: 'pending',
        message: input.message,
        delay_minutes: input.delay_minutes || null,
        sent_at: null,
        external_id: null,
        error_message: null,
        created_at: new Date(),
      };
      this.notifications.set(notification.id, notification);
      return success(notification);
    } catch (error: any) {
      return failure(new InfrastructureError(`Mock: Failed to create notification: ${error.message}`));
    }
  }

  async updateNotification(id: string, input: UpdateNotificationInput): Promise<Result<Notification>> {
    try {
      const notification = this.notifications.get(id);
      if (!notification) {
        return failure(new InfrastructureError(`Mock: Notification not found: ${id}`));
      }

      const updated: Notification = {
        ...notification,
        status: input.status ?? notification.status,
        sent_at: input.sent_at ?? notification.sent_at,
        external_id: input.external_id ?? notification.external_id,
        error_message: input.error_message ?? notification.error_message,
      };

      this.notifications.set(id, updated);
      return success(updated);
    } catch (error: any) {
      return failure(new InfrastructureError(`Mock: Failed to update notification: ${error.message}`));
    }
  }

  async listNotificationsByDelivery(deliveryId: string): Promise<Result<Notification[]>> {
    try {
      const notifications = Array.from(this.notifications.values()).filter((n) => n.delivery_id === deliveryId);
      return success(notifications);
    } catch (error: any) {
      return failure(new InfrastructureError(`Mock: Failed to list notifications by delivery: ${error.message}`));
    }
  }

  async listNotificationsByCustomer(customerId: string, limit = 100): Promise<Result<Notification[]>> {
    try {
      const notifications = Array.from(this.notifications.values())
        .filter((n) => n.customer_id === customerId)
        .slice(0, limit);
      return success(notifications);
    } catch (error: any) {
      return failure(new InfrastructureError(`Mock: Failed to list notifications by customer: ${error.message}`));
    }
  }

  // ===== Traffic Snapshot Operations =====

  async createTrafficSnapshot(input: CreateTrafficSnapshotInput): Promise<Result<TrafficSnapshot>> {
    try {
      const snapshot: TrafficSnapshot = {
        id: this.generateId(),
        route_id: input.route_id,
        traffic_condition: input.traffic_condition,
        delay_minutes: input.delay_minutes,
        duration_seconds: input.duration_seconds,
        snapshot_at: new Date(),
      };
      this.trafficSnapshots.set(snapshot.id, snapshot);
      return success(snapshot);
    } catch (error: any) {
      return failure(new InfrastructureError(`Mock: Failed to create traffic snapshot: ${error.message}`));
    }
  }

  async listTrafficSnapshotsByRoute(routeId: string, limit = 100): Promise<Result<TrafficSnapshot[]>> {
    try {
      const snapshots = Array.from(this.trafficSnapshots.values())
        .filter((s) => s.route_id === routeId)
        .slice(0, limit);
      return success(snapshots);
    } catch (error: any) {
      return failure(new InfrastructureError(`Mock: Failed to list traffic snapshots: ${error.message}`));
    }
  }

  // ===== Workflow Execution Operations =====

  async getWorkflowExecutionById(id: string): Promise<Result<WorkflowExecution | null>> {
    try {
      const execution = this.workflowExecutions.get(id);
      return success(execution || null);
    } catch (error: any) {
      return failure(new InfrastructureError(`Mock: Failed to get workflow execution: ${error.message}`));
    }
  }

  async getWorkflowExecutionByWorkflowId(workflowId: string): Promise<Result<WorkflowExecution | null>> {
    try {
      const execution = Array.from(this.workflowExecutions.values()).find((e) => e.workflow_id === workflowId);
      return success(execution || null);
    } catch (error: any) {
      return failure(new InfrastructureError(`Mock: Failed to get workflow execution by workflow ID: ${error.message}`));
    }
  }

  async createWorkflowExecution(input: CreateWorkflowExecutionInput): Promise<Result<WorkflowExecution>> {
    try {
      const execution: WorkflowExecution = {
        id: this.generateId(),
        workflow_id: input.workflow_id,
        run_id: input.run_id,
        delivery_id: input.delivery_id || null,
        status: input.status,
        started_at: new Date(),
        completed_at: null,
        error_message: null,
      };
      this.workflowExecutions.set(execution.id, execution);
      return success(execution);
    } catch (error: any) {
      return failure(new InfrastructureError(`Mock: Failed to create workflow execution: ${error.message}`));
    }
  }

  async updateWorkflowExecution(id: string, input: UpdateWorkflowExecutionInput): Promise<Result<WorkflowExecution>> {
    try {
      const execution = this.workflowExecutions.get(id);
      if (!execution) {
        return failure(new InfrastructureError(`Mock: Workflow execution not found: ${id}`));
      }

      const updated: WorkflowExecution = {
        ...execution,
        status: input.status ?? execution.status,
        completed_at: input.completed_at ?? execution.completed_at,
        error_message: input.error_message ?? execution.error_message,
      };

      this.workflowExecutions.set(id, updated);
      return success(updated);
    } catch (error: any) {
      return failure(new InfrastructureError(`Mock: Failed to update workflow execution: ${error.message}`));
    }
  }

  async listWorkflowExecutionsByDelivery(deliveryId: string): Promise<Result<WorkflowExecution[]>> {
    try {
      const executions = Array.from(this.workflowExecutions.values()).filter((e) => e.delivery_id === deliveryId);
      return success(executions);
    } catch (error: any) {
      return failure(new InfrastructureError(`Mock: Failed to list workflow executions by delivery: ${error.message}`));
    }
  }

  /**
   * Testing utility: Clear all data
   */
  clearAll(): void {
    this.customers.clear();
    this.routes.clear();
    this.deliveries.clear();
    this.notifications.clear();
    this.trafficSnapshots.clear();
    this.workflowExecutions.clear();
  }

  /**
   * Testing utility: Get data counts
   */
  getCounts() {
    return {
      customers: this.customers.size,
      routes: this.routes.size,
      deliveries: this.deliveries.size,
      notifications: this.notifications.size,
      trafficSnapshots: this.trafficSnapshots.size,
      workflowExecutions: this.workflowExecutions.size,
    };
  }
}