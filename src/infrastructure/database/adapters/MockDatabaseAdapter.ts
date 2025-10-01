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
  Threshold,
  CreateThresholdInput,
  UpdateThresholdInput,
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
  private thresholds = new Map<string, Threshold>();

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
   * Uses TEST_EMAIL and TEST_PHONE from environment variables if available
   */
  private seedMockData(): void {
    // Mock Customers - use env vars if available
    const testEmail = process.env.TEST_EMAIL || 'john.doe@example.com';
    const testPhone = process.env.TEST_PHONE || '+1234567890';
    const testName = process.env.TEST_NAME || 'John Doe';

    const customer1: Customer = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: testEmail,
      phone: testPhone,
      name: testName,
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
    const customer3: Customer = {
      id: '550e8400-e29b-41d4-a716-446655440002',
      email: 'bob.johnson@example.com',
      phone: '+1234567892',
      name: 'Bob Johnson',
      notification_preferences: { primary: 'email' },
      created_at: new Date('2024-01-02T00:00:00Z'),
      updated_at: new Date('2024-01-02T00:00:00Z'),
    };
    const customer4: Customer = {
      id: '550e8400-e29b-41d4-a716-446655440003',
      email: 'alice.williams@example.com',
      phone: '+1234567893',
      name: 'Alice Williams',
      notification_preferences: { primary: 'email', secondary: 'sms' },
      created_at: new Date('2024-01-03T00:00:00Z'),
      updated_at: new Date('2024-01-03T00:00:00Z'),
    };
    const customer5: Customer = {
      id: '550e8400-e29b-41d4-a716-446655440004',
      email: 'charlie.brown@example.com',
      phone: '+1234567894',
      name: 'Charlie Brown',
      notification_preferences: { primary: 'sms' },
      created_at: new Date('2024-01-04T00:00:00Z'),
      updated_at: new Date('2024-01-04T00:00:00Z'),
    };
    this.customers.set(customer1.id, customer1);
    this.customers.set(customer2.id, customer2);
    this.customers.set(customer3.id, customer3);
    this.customers.set(customer4.id, customer4);
    this.customers.set(customer5.id, customer5);

    // Mock Routes
    const route1: Route = {
      id: '660e8400-e29b-41d4-a716-446655440000',
      origin_address: 'Downtown Los Angeles, CA',
      origin_coords: { lat: 34.0522, lng: -118.2437 },
      destination_address: 'LAX Airport, CA',
      destination_coords: { lat: 33.9416, lng: -118.4085 },
      distance_meters: 22000,
      normal_duration_seconds: 1800,
      current_duration_seconds: null,
      traffic_condition: null,
      created_at: new Date('2024-01-01T00:00:00Z'),
      updated_at: new Date('2024-01-01T00:00:00Z'),
    };
    const route2: Route = {
      id: '660e8400-e29b-41d4-a716-446655440001',
      origin_address: 'Times Square, Manhattan, NY',
      origin_coords: { lat: 40.7580, lng: -73.9855 },
      destination_address: 'JFK Airport, Queens, NY',
      destination_coords: { lat: 40.6413, lng: -73.7781 },
      distance_meters: 28000,
      normal_duration_seconds: 2700,
      current_duration_seconds: null,
      traffic_condition: null,
      created_at: new Date('2024-01-01T00:00:00Z'),
      updated_at: new Date('2024-01-01T00:00:00Z'),
    };
    const route3: Route = {
      id: '660e8400-e29b-41d4-a716-446655440002',
      origin_address: 'Downtown San Francisco, CA',
      origin_coords: { lat: 37.7749, lng: -122.4194 },
      destination_address: 'San Jose, CA',
      destination_coords: { lat: 37.3382, lng: -121.8863 },
      distance_meters: 75000,
      normal_duration_seconds: 4500,
      current_duration_seconds: null,
      traffic_condition: null,
      created_at: new Date('2024-01-02T00:00:00Z'),
      updated_at: new Date('2024-01-02T00:00:00Z'),
    };
    const route4: Route = {
      id: '660e8400-e29b-41d4-a716-446655440003',
      origin_address: 'Chicago Loop, IL',
      origin_coords: { lat: 41.8781, lng: -87.6298 },
      destination_address: "O'Hare Airport, IL",
      destination_coords: { lat: 41.9742, lng: -87.9073 },
      distance_meters: 27000,
      normal_duration_seconds: 2100,
      current_duration_seconds: null,
      traffic_condition: null,
      created_at: new Date('2024-01-03T00:00:00Z'),
      updated_at: new Date('2024-01-03T00:00:00Z'),
    };
    const route5: Route = {
      id: '660e8400-e29b-41d4-a716-446655440004',
      origin_address: 'Seattle Downtown, WA',
      origin_coords: { lat: 47.6062, lng: -122.3321 },
      destination_address: 'Portland, OR',
      destination_coords: { lat: 45.5152, lng: -122.6784 },
      distance_meters: 280000,
      normal_duration_seconds: 10800,
      current_duration_seconds: null,
      traffic_condition: null,
      created_at: new Date('2024-01-04T00:00:00Z'),
      updated_at: new Date('2024-01-04T00:00:00Z'),
    };
    this.routes.set(route1.id, route1);
    this.routes.set(route2.id, route2);
    this.routes.set(route3.id, route3);
    this.routes.set(route4.id, route4);
    this.routes.set(route5.id, route5);

    // Mock Deliveries - diverse statuses for testing
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
      status: 'delayed',
      scheduled_delivery: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour from now
      actual_delivery: null,
      current_location: null,
      delay_threshold_minutes: 30,
      metadata: {},
      created_at: new Date('2024-01-01T00:00:00Z'),
      updated_at: new Date('2024-01-01T00:00:00Z'),
    };
    const delivery3: Delivery = {
      id: '770e8400-e29b-41d4-a716-446655440002',
      tracking_number: 'FD-2024-003',
      customer_id: customer3.id,
      route_id: route3.id,
      status: 'delivered',
      scheduled_delivery: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      actual_delivery: new Date(Date.now() - 23 * 60 * 60 * 1000),
      current_location: null,
      delay_threshold_minutes: 45,
      metadata: {},
      created_at: new Date('2024-01-02T00:00:00Z'),
      updated_at: new Date('2024-01-02T00:00:00Z'),
    };
    const delivery4: Delivery = {
      id: '770e8400-e29b-41d4-a716-446655440003',
      tracking_number: 'FD-2024-004',
      customer_id: customer4.id,
      route_id: route4.id,
      status: 'pending',
      scheduled_delivery: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
      actual_delivery: null,
      current_location: null,
      delay_threshold_minutes: 30,
      metadata: {},
      created_at: new Date('2024-01-03T00:00:00Z'),
      updated_at: new Date('2024-01-03T00:00:00Z'),
    };
    const delivery5: Delivery = {
      id: '770e8400-e29b-41d4-a716-446655440004',
      tracking_number: 'FD-2024-005',
      customer_id: customer5.id,
      route_id: route5.id,
      status: 'in_transit',
      scheduled_delivery: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours from now
      actual_delivery: null,
      current_location: null,
      delay_threshold_minutes: 60,
      metadata: {},
      created_at: new Date('2024-01-04T00:00:00Z'),
      updated_at: new Date('2024-01-04T00:00:00Z'),
    };
    const delivery6: Delivery = {
      id: '770e8400-e29b-41d4-a716-446655440005',
      tracking_number: 'FD-2024-006',
      customer_id: customer1.id,
      route_id: route1.id,
      status: 'delivered',
      scheduled_delivery: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
      actual_delivery: new Date(Date.now() - 47 * 60 * 60 * 1000),
      current_location: null,
      delay_threshold_minutes: 30,
      metadata: {},
      created_at: new Date('2024-01-05T00:00:00Z'),
      updated_at: new Date('2024-01-05T00:00:00Z'),
    };
    const delivery7: Delivery = {
      id: '770e8400-e29b-41d4-a716-446655440006',
      tracking_number: 'FD-2024-007',
      customer_id: customer2.id,
      route_id: route2.id,
      status: 'in_transit',
      scheduled_delivery: new Date(Date.now() + 5 * 60 * 60 * 1000), // 5 hours from now
      actual_delivery: null,
      current_location: null,
      delay_threshold_minutes: 30,
      metadata: {},
      created_at: new Date('2024-01-06T00:00:00Z'),
      updated_at: new Date('2024-01-06T00:00:00Z'),
    };
    const delivery8: Delivery = {
      id: '770e8400-e29b-41d4-a716-446655440007',
      tracking_number: 'FD-2024-008',
      customer_id: customer3.id,
      route_id: route3.id,
      status: 'pending',
      scheduled_delivery: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours from now
      actual_delivery: null,
      current_location: null,
      delay_threshold_minutes: 45,
      metadata: {},
      created_at: new Date('2024-01-07T00:00:00Z'),
      updated_at: new Date('2024-01-07T00:00:00Z'),
    };
    const delivery9: Delivery = {
      id: '770e8400-e29b-41d4-a716-446655440008',
      tracking_number: 'FD-2024-009',
      customer_id: customer4.id,
      route_id: route4.id,
      status: 'delivered',
      scheduled_delivery: new Date(Date.now() - 72 * 60 * 60 * 1000), // 3 days ago
      actual_delivery: new Date(Date.now() - 71 * 60 * 60 * 1000),
      current_location: null,
      delay_threshold_minutes: 30,
      metadata: {},
      created_at: new Date('2024-01-08T00:00:00Z'),
      updated_at: new Date('2024-01-08T00:00:00Z'),
    };
    const delivery10: Delivery = {
      id: '770e8400-e29b-41d4-a716-446655440009',
      tracking_number: 'FD-2024-010',
      customer_id: customer5.id,
      route_id: route5.id,
      status: 'delayed',
      scheduled_delivery: new Date(Date.now() + 0.5 * 60 * 60 * 1000), // 30 minutes from now
      actual_delivery: null,
      current_location: null,
      delay_threshold_minutes: 30,
      metadata: {},
      created_at: new Date('2024-01-09T00:00:00Z'),
      updated_at: new Date('2024-01-09T00:00:00Z'),
    };

    this.deliveries.set(delivery1.id, delivery1);
    this.deliveries.set(delivery2.id, delivery2);
    this.deliveries.set(delivery3.id, delivery3);
    this.deliveries.set(delivery4.id, delivery4);
    this.deliveries.set(delivery5.id, delivery5);
    this.deliveries.set(delivery6.id, delivery6);
    this.deliveries.set(delivery7.id, delivery7);
    this.deliveries.set(delivery8.id, delivery8);
    this.deliveries.set(delivery9.id, delivery9);
    this.deliveries.set(delivery10.id, delivery10);

    // Mock Notifications
    const notification1: Notification = {
      id: '880e8400-e29b-41d4-a716-446655440000',
      delivery_id: delivery2.id,
      customer_id: customer2.id,
      channel: 'email',
      status: 'sent',
      message: 'Your delivery FD-2024-002 is delayed by 25 minutes due to heavy traffic.',
      delay_minutes: 25,
      sent_at: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      external_id: 'msg-123',
      error_message: null,
      created_at: new Date(Date.now() - 30 * 60 * 1000),
    };
    const notification2: Notification = {
      id: '880e8400-e29b-41d4-a716-446655440001',
      delivery_id: delivery10.id,
      customer_id: customer5.id,
      channel: 'sms',
      status: 'sent',
      message: 'Delivery FD-2024-010 delayed by 45 minutes. Updated ETA: 1 hour 15 minutes.',
      delay_minutes: 45,
      sent_at: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      external_id: 'sms-456',
      error_message: null,
      created_at: new Date(Date.now() - 15 * 60 * 1000),
    };
    const notification3: Notification = {
      id: '880e8400-e29b-41d4-a716-446655440002',
      delivery_id: delivery3.id,
      customer_id: customer3.id,
      channel: 'email',
      status: 'sent',
      message: 'Your package FD-2024-003 has been delivered successfully!',
      delay_minutes: null,
      sent_at: new Date(Date.now() - 23 * 60 * 60 * 1000),
      external_id: 'msg-789',
      error_message: null,
      created_at: new Date(Date.now() - 23 * 60 * 60 * 1000),
    };

    this.notifications.set(notification1.id, notification1);
    this.notifications.set(notification2.id, notification2);
    this.notifications.set(notification3.id, notification3);

    // Mock Workflow Executions
    const workflow1: WorkflowExecution = {
      id: '990e8400-e29b-41d4-a716-446655440000',
      workflow_id: 'delay-notification-FD-2024-002',
      run_id: 'run-001',
      delivery_id: delivery2.id,
      status: 'completed',
      started_at: new Date(Date.now() - 35 * 60 * 1000),
      completed_at: new Date(Date.now() - 30 * 60 * 1000),
      error_message: null,
    };
    const workflow2: WorkflowExecution = {
      id: '990e8400-e29b-41d4-a716-446655440001',
      workflow_id: 'delay-notification-FD-2024-010',
      run_id: 'run-002',
      delivery_id: delivery10.id,
      status: 'completed',
      started_at: new Date(Date.now() - 20 * 60 * 1000),
      completed_at: new Date(Date.now() - 15 * 60 * 1000),
      error_message: null,
    };

    this.workflowExecutions.set(workflow1.id, workflow1);
    this.workflowExecutions.set(workflow2.id, workflow2);

    // Mock Thresholds
    const threshold1: Threshold = {
      id: 'aa0e8400-e29b-41d4-a716-446655440000',
      name: 'Standard Threshold',
      delay_minutes: 30,
      notification_channels: ['email'],
      is_default: true,
      created_at: new Date('2024-01-01T00:00:00Z'),
      updated_at: new Date('2024-01-01T00:00:00Z'),
    };
    const threshold2: Threshold = {
      id: 'aa0e8400-e29b-41d4-a716-446655440001',
      name: 'Premium Threshold',
      delay_minutes: 15,
      notification_channels: ['email', 'sms'],
      is_default: false,
      created_at: new Date('2024-01-01T00:00:00Z'),
      updated_at: new Date('2024-01-01T00:00:00Z'),
    };
    const threshold3: Threshold = {
      id: 'aa0e8400-e29b-41d4-a716-446655440002',
      name: 'High Priority Threshold',
      delay_minutes: 10,
      notification_channels: ['email', 'sms'],
      is_default: false,
      created_at: new Date('2024-01-02T00:00:00Z'),
      updated_at: new Date('2024-01-02T00:00:00Z'),
    };

    this.thresholds.set(threshold1.id, threshold1);
    this.thresholds.set(threshold2.id, threshold2);
    this.thresholds.set(threshold3.id, threshold3);
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

  // ===== Threshold Operations =====

  async getThresholdById(id: string): Promise<Result<Threshold | null>> {
    try {
      const threshold = this.thresholds.get(id);
      return success(threshold || null);
    } catch (error: any) {
      return failure(new InfrastructureError(`Mock: Failed to get threshold: ${error.message}`));
    }
  }

  async getDefaultThreshold(): Promise<Result<Threshold | null>> {
    try {
      const threshold = Array.from(this.thresholds.values()).find((t) => t.is_default);
      return success(threshold || null);
    } catch (error: any) {
      return failure(new InfrastructureError(`Mock: Failed to get default threshold: ${error.message}`));
    }
  }

  async createThreshold(input: CreateThresholdInput): Promise<Result<Threshold>> {
    try {
      const threshold: Threshold = {
        id: this.generateId(),
        name: input.name,
        delay_minutes: input.delay_minutes,
        notification_channels: input.notification_channels,
        is_default: input.is_default || false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // If this is set as default, unset all others
      if (threshold.is_default) {
        Array.from(this.thresholds.values()).forEach((t) => {
          t.is_default = false;
        });
      }

      this.thresholds.set(threshold.id, threshold);
      return success(threshold);
    } catch (error: any) {
      return failure(new InfrastructureError(`Mock: Failed to create threshold: ${error.message}`));
    }
  }

  async updateThreshold(id: string, input: UpdateThresholdInput): Promise<Result<Threshold>> {
    try {
      const threshold = this.thresholds.get(id);
      if (!threshold) {
        return failure(new InfrastructureError(`Mock: Threshold not found: ${id}`));
      }

      const updated: Threshold = {
        ...threshold,
        name: input.name ?? threshold.name,
        delay_minutes: input.delay_minutes ?? threshold.delay_minutes,
        notification_channels: input.notification_channels ?? threshold.notification_channels,
        is_default: input.is_default ?? threshold.is_default,
        updated_at: new Date(),
      };

      // If this is set as default, unset all others
      if (updated.is_default && !threshold.is_default) {
        Array.from(this.thresholds.values()).forEach((t) => {
          if (t.id !== id) {
            t.is_default = false;
          }
        });
      }

      this.thresholds.set(id, updated);
      return success(updated);
    } catch (error: any) {
      return failure(new InfrastructureError(`Mock: Failed to update threshold: ${error.message}`));
    }
  }

  async deleteThreshold(id: string): Promise<Result<void>> {
    try {
      const threshold = this.thresholds.get(id);
      if (!threshold) {
        return failure(new InfrastructureError(`Mock: Threshold not found: ${id}`));
      }

      // Don't allow deleting the default threshold
      if (threshold.is_default) {
        return failure(new InfrastructureError('Mock: Cannot delete default threshold'));
      }

      this.thresholds.delete(id);
      return success(undefined);
    } catch (error: any) {
      return failure(new InfrastructureError(`Mock: Failed to delete threshold: ${error.message}`));
    }
  }

  async listThresholds(limit = 100, offset = 0): Promise<Result<Threshold[]>> {
    try {
      const thresholds = Array.from(this.thresholds.values()).slice(offset, offset + limit);
      return success(thresholds);
    } catch (error: any) {
      return failure(new InfrastructureError(`Mock: Failed to list thresholds: ${error.message}`));
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
    this.thresholds.clear();
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
      thresholds: this.thresholds.size,
    };
  }
}