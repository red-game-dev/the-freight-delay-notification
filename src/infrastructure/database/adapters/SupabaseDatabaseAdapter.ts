/**
 * Supabase Database Adapter
 * Implementation of DatabaseAdapter using Supabase
 * Initializes client internally following adapter pattern
 */

import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { Result, success, failure } from '../../../core/base/utils/Result';
import { InfrastructureError } from '../../../core/base/errors/BaseError';
import { DatabaseAdapter } from './DatabaseAdapter.interface';
import { env } from '../../config/EnvValidator';
import {
  Customer,
  CreateCustomerInput,
  Route,
  CreateRouteInput,
  UpdateRouteInput,
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
  Coordinates,
} from '../types/database.types';
import { logger, getErrorMessage, hasMessage, hasCode, hasName, hasCause } from '@/core/base/utils/Logger';
import { pointToCoordinates } from '@/core/utils/coordinateUtils';

// Types for Supabase joined queries
interface DeliveryWithJoins {
  [key: string]: unknown;
  current_location?: string | { x: number; y: number } | null;
  metadata?: Record<string, unknown>;
  customers?: {
    name: string;
    email: string;
    phone: string | null;
  };
  routes?: {
    origin_address: string;
    destination_address: string;
    distance_meters: number;
    normal_duration_seconds: number;
  };
}

export class SupabaseDatabaseAdapter implements DatabaseAdapter {
  public readonly name = 'Supabase';
  private client: SupabaseClient | null = null;

  constructor() {
    this.initializeClient();
  }

  /**
   * Initialize Supabase client with admin privileges
   * Uses service role key to bypass RLS (for server-side operations)
   */
  private initializeClient(): void {
    if (!this.isConfigured()) {
      return;
    }

    try {
      this.client = createClient(
        env.SUPABASE_URL!,
        env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );
    } catch (error: unknown) {
      logger.error('Failed to initialize Supabase client:', getErrorMessage(error));
      this.client = null;
    }
  }

  /**
   * Check if Supabase is properly configured
   */
  private isConfigured(): boolean {
    return !!(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
  }

  isAvailable(): boolean {
    return !!this.client;
  }

  /**
   * Ensure client is initialized before use
   */
  private ensureClient(): SupabaseClient {
    if (!this.client) {
      throw new InfrastructureError('Supabase client not initialized');
    }
    return this.client;
  }


  // ===== Helper: Convert Coordinates to POINT =====
  private coordinatesToPoint(coords: Coordinates): string {
    // Support both {x,y} and {lat,lng} formats
    const lat = coords.lat ?? coords.x;
    const lng = coords.lng ?? coords.y;
    return `(${lng},${lat})`;
  }

  // ===== Customer Operations =====
  async getCustomerById(id: string): Promise<Result<Customer | null>> {
    try {
      const { data, error } = await this.ensureClient()
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          return success(null);
        }
        return failure(new InfrastructureError(`Failed to get customer: ${getErrorMessage(error)}`, { error }));
      }

      return success(data as Customer);
    } catch (error: unknown) {
      return failure(new InfrastructureError(`Failed to get customer: ${getErrorMessage(error)}`, { error }));
    }
  }

  async getCustomerByEmail(email: string): Promise<Result<Customer | null>> {
    try {
      const { data, error } = await this.ensureClient()
        .from('customers')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return success(null);
        }
        return failure(new InfrastructureError(`Failed to get customer: ${getErrorMessage(error)}`, { error }));
      }

      return success(data as Customer);
    } catch (error: unknown) {
      return failure(new InfrastructureError(`Failed to get customer: ${getErrorMessage(error)}`, { error }));
    }
  }

  async createCustomer(input: CreateCustomerInput): Promise<Result<Customer>> {
    try {
      const { data, error} = await this.ensureClient()
        .from('customers')
        .insert(input)
        .select()
        .single();

      if (error) {
        return failure(new InfrastructureError(`Failed to create customer: ${getErrorMessage(error)}`, { error }));
      }

      return success(data as Customer);
    } catch (error: unknown) {
      return failure(new InfrastructureError(`Failed to create customer: ${getErrorMessage(error)}`, { error }));
    }
  }

  async updateCustomer(id: string, input: Partial<CreateCustomerInput>): Promise<Result<Customer>> {
    try {
      const { data, error } = await this.ensureClient()
        .from('customers')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return failure(new InfrastructureError(`Failed to update customer: ${getErrorMessage(error)}`, { error }));
      }

      return success(data as Customer);
    } catch (error: unknown) {
      return failure(new InfrastructureError(`Failed to update customer: ${getErrorMessage(error)}`, { error }));
    }
  }

  async listCustomers(limit = 10, offset = 0): Promise<Result<Customer[]>> {
    try {
      const { data, error } = await this.ensureClient()
        .from('customers')
        .select('*')
        .range(offset, offset + limit - 1);

      if (error) {
        return failure(new InfrastructureError(`Failed to list customers: ${getErrorMessage(error)}`, { error }));
      }

      return success((data as Customer[]) || []);
    } catch (error: unknown) {
      return failure(new InfrastructureError(`Failed to list customers: ${getErrorMessage(error)}`, { error }));
    }
  }

  // ===== Route Operations =====
  async getRouteById(id: string): Promise<Result<Route | null>> {
    try {
      const { data, error } = await this.ensureClient()
        .from('routes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return success(null);
        }
        return failure(new InfrastructureError(`Failed to get route: ${getErrorMessage(error)}`, { error }));
      }

      // Convert POINT to Coordinates
      const route: Route = {
        ...data,
        origin_coords: pointToCoordinates(data.origin_coords) || { x: 0, y: 0, lat: 0, lng: 0 },
        destination_coords: pointToCoordinates(data.destination_coords) || { x: 0, y: 0, lat: 0, lng: 0 },
      };

      return success(route);
    } catch (error: unknown) {
      return failure(new InfrastructureError(`Failed to get route: ${getErrorMessage(error)}`, { error }));
    }
  }

  async createRoute(input: CreateRouteInput): Promise<Result<Route>> {
    try {
      const dbInput = {
        ...input,
        origin_coords: this.coordinatesToPoint(input.origin_coords),
        destination_coords: this.coordinatesToPoint(input.destination_coords),
      };

      const { data, error } = await this.ensureClient()
        .from('routes')
        .insert(dbInput)
        .select()
        .single();

      if (error) {
        return failure(new InfrastructureError(`Failed to create route: ${getErrorMessage(error)}`, { error }));
      }

      const route: Route = {
        ...data,
        origin_coords: pointToCoordinates(data.origin_coords) || { x: 0, y: 0, lat: 0, lng: 0 },
        destination_coords: pointToCoordinates(data.destination_coords) || { x: 0, y: 0, lat: 0, lng: 0 },
      };

      return success(route);
    } catch (error: unknown) {
      return failure(new InfrastructureError(`Failed to create route: ${getErrorMessage(error)}`, { error }));
    }
  }

  async updateRoute(id: string, input: UpdateRouteInput): Promise<Result<Route>> {
    try {
      // Convert coordinates to POINT format for database
      const dbInput: Omit<UpdateRouteInput, 'origin_coords' | 'destination_coords'> & {
        origin_coords?: string;
        destination_coords?: string;
      } = {
        ...input,
        origin_coords: input.origin_coords ? this.coordinatesToPoint(input.origin_coords) : undefined,
        destination_coords: input.destination_coords ? this.coordinatesToPoint(input.destination_coords) : undefined,
      };

      const { data, error } = await this.ensureClient()
        .from('routes')
        .update(dbInput)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return failure(new InfrastructureError(`Failed to update route: ${getErrorMessage(error)}`, { error }));
      }

      const route: Route = {
        ...data,
        origin_coords: pointToCoordinates(data.origin_coords) || { x: 0, y: 0, lat: 0, lng: 0 },
        destination_coords: pointToCoordinates(data.destination_coords) || { x: 0, y: 0, lat: 0, lng: 0 },
      };

      return success(route);
    } catch (error: unknown) {
      return failure(new InfrastructureError(`Failed to update route: ${getErrorMessage(error)}`, { error }));
    }
  }

  async listRoutes(limit = 10, offset = 0): Promise<Result<Route[]>> {
    try {
      const { data, error } = await this.ensureClient()
        .from('routes')
        .select('*')
        .range(offset, offset + limit - 1);

      if (error) {
        return failure(new InfrastructureError(`Failed to list routes: ${getErrorMessage(error)}`, { error }));
      }

      const routes = (data || []).map(route => ({
        ...route,
        origin_coords: pointToCoordinates(route.origin_coords) || { x: 0, y: 0, lat: 0, lng: 0 },
        destination_coords: pointToCoordinates(route.destination_coords) || { x: 0, y: 0, lat: 0, lng: 0 },
      }));

      return success(routes as Route[]);
    } catch (error: unknown) {
      return failure(new InfrastructureError(`Failed to list routes: ${getErrorMessage(error)}`, { error }));
    }
  }

  // ===== Delivery Operations =====
  async getDeliveryById(id: string): Promise<Result<Delivery | null>> {
    try {
      const { data, error } = await this.ensureClient()
        .from('deliveries')
        .select(`
          *,
          customers!inner(name, email, phone),
          routes!inner(origin_address, destination_address, distance_meters, normal_duration_seconds)
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return success(null);
        }
        return failure(new InfrastructureError(`Failed to get delivery: ${getErrorMessage(error)}`, { error }));
      }

      const joinedData = data as DeliveryWithJoins;

      const delivery: Delivery = {
        ...data,
        current_location: data.current_location ? pointToCoordinates(data.current_location) : null,
        customer_name: joinedData.customers?.name || '',
        customer_email: joinedData.customers?.email || '',
        customer_phone: joinedData.customers?.phone || '',
        origin: joinedData.routes?.origin_address || '',
        destination: joinedData.routes?.destination_address || '',
        notes: data.metadata?.notes || '',
      } as Delivery;

      return success(delivery);
    } catch (error: unknown) {
      return failure(new InfrastructureError(`Failed to get delivery: ${getErrorMessage(error)}`, { error }));
    }
  }

  async getDeliveryByTrackingNumber(trackingNumber: string): Promise<Result<Delivery | null>> {
    try {
      const { data, error } = await this.ensureClient()
        .from('deliveries')
        .select(`
          *,
          customers!inner(name, email, phone),
          routes!inner(origin_address, destination_address, distance_meters, normal_duration_seconds)
        `)
        .eq('tracking_number', trackingNumber)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return success(null);
        }
        return failure(new InfrastructureError(`Failed to get delivery: ${getErrorMessage(error)}`, { error }));
      }

      const joinedData = data as DeliveryWithJoins;

      const delivery: Delivery = {
        ...data,
        current_location: data.current_location ? pointToCoordinates(data.current_location) : null,
        customer_name: joinedData.customers?.name || '',
        customer_email: joinedData.customers?.email || '',
        customer_phone: joinedData.customers?.phone || '',
        origin: joinedData.routes?.origin_address || '',
        destination: joinedData.routes?.destination_address || '',
        notes: data.metadata?.notes || '',
      } as Delivery;

      return success(delivery);
    } catch (error: unknown) {
      return failure(new InfrastructureError(`Failed to get delivery: ${getErrorMessage(error)}`, { error }));
    }
  }

  async createDelivery(input: CreateDeliveryInput): Promise<Result<Delivery>> {
    try {
      const { data, error } = await this.ensureClient()
        .from('deliveries')
        .insert(input)
        .select()
        .single();

      if (error) {
        return failure(new InfrastructureError(`Failed to create delivery: ${getErrorMessage(error)}`, { error }));
      }

      const delivery: Delivery = {
        ...data,
        current_location: data.current_location ? pointToCoordinates(data.current_location) : null,
      };

      return success(delivery);
    } catch (error: unknown) {
      return failure(new InfrastructureError(`Failed to create delivery: ${getErrorMessage(error)}`, { error }));
    }
  }

  async updateDelivery(id: string, input: UpdateDeliveryInput): Promise<Result<Delivery>> {
    try {
      // Get existing delivery to access metadata
      const existing = await this.getDeliveryById(id);
      if (!existing.success || !existing.value) {
        return failure(new InfrastructureError('Delivery not found'));
      }

      // Build database input by removing virtual fields
      const {
        customer_name,
        customer_email,
        customer_phone,
        origin,
        destination,
        notes,
        current_location,
        ...dbFields
      } = input;

      // Handle notes - save to metadata
      const metadataUpdates: Record<string, string> = {};
      if (notes !== undefined) {
        metadataUpdates.notes = notes;
      }

      // Build final database input with proper types
      const dbInput: Omit<UpdateDeliveryInput, 'current_location' | 'customer_name' | 'customer_email' | 'customer_phone' | 'origin' | 'destination' | 'notes'> & {
        current_location?: string;
        metadata?: Record<string, unknown>;
      } = {
        ...dbFields,
        current_location: current_location ? this.coordinatesToPoint(current_location) : undefined,
        metadata: Object.keys(metadataUpdates).length > 0 ? {
          ...(existing.value.metadata || {}),
          ...metadataUpdates,
        } : undefined,
      };

      const { error } = await this.ensureClient()
        .from('deliveries')
        .update(dbInput)
        .eq('id', id);

      if (error) {
        return failure(new InfrastructureError(`Failed to update delivery: ${getErrorMessage(error)}`, { error }));
      }

      // Re-fetch with joins to return complete data
      const updatedDelivery = await this.getDeliveryById(id);
      if (!updatedDelivery.success || !updatedDelivery.value) {
        return failure(new InfrastructureError('Failed to fetch updated delivery'));
      }
      return success(updatedDelivery.value);
    } catch (error: unknown) {
      return failure(new InfrastructureError(`Failed to update delivery: ${getErrorMessage(error)}`, { error }));
    }
  }

  async listDeliveries(limit = 10, offset = 0): Promise<Result<Delivery[]>> {
    try {
      const { data, error } = await this.ensureClient()
        .from('deliveries')
        .select(`
          *,
          customers!inner(name, email, phone),
          routes!inner(origin_address, destination_address, distance_meters, normal_duration_seconds)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        return failure(new InfrastructureError(`Failed to list deliveries: ${getErrorMessage(error)}`, { error }));
      }

      const deliveries = (data || []).map((delivery: DeliveryWithJoins) => ({
        ...delivery,
        current_location: delivery.current_location ? pointToCoordinates(delivery.current_location) : null,
        customer_name: delivery.customers?.name || '',
        customer_email: delivery.customers?.email || '',
        customer_phone: delivery.customers?.phone || '',
        origin: delivery.routes?.origin_address || '',
        destination: delivery.routes?.destination_address || '',
        notes: delivery.metadata?.notes || '',
      }));

      return success(deliveries as unknown as Delivery[]);
    } catch (error: unknown) {
      return failure(new InfrastructureError(`Failed to list deliveries: ${getErrorMessage(error)}`, { error }));
    }
  }

  async listDeliveriesByCustomer(customerId: string, limit = 10): Promise<Result<Delivery[]>> {
    try {
      const { data, error } = await this.ensureClient()
        .from('deliveries')
        .select(`
          *,
          customers!inner(name, email, phone),
          routes!inner(origin_address, destination_address, distance_meters, normal_duration_seconds)
        `)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        return failure(new InfrastructureError(`Failed to list deliveries: ${getErrorMessage(error)}`, { error }));
      }

      const deliveries = (data || []).map((delivery: DeliveryWithJoins) => ({
        ...delivery,
        current_location: delivery.current_location ? pointToCoordinates(delivery.current_location) : null,
        customer_name: delivery.customers?.name || '',
        customer_email: delivery.customers?.email || '',
        customer_phone: delivery.customers?.phone || '',
        origin: delivery.routes?.origin_address || '',
        destination: delivery.routes?.destination_address || '',
        notes: delivery.metadata?.notes || '',
      }));

      return success(deliveries as unknown as Delivery[]);
    } catch (error: unknown) {
      return failure(new InfrastructureError(`Failed to list deliveries: ${getErrorMessage(error)}`, { error }));
    }
  }

  async listDeliveriesByStatus(status: string, limit = 10): Promise<Result<Delivery[]>> {
    try {
      const { data, error } = await this.ensureClient()
        .from('deliveries')
        .select(`
          *,
          customers!inner(name, email, phone),
          routes!inner(origin_address, destination_address, distance_meters, normal_duration_seconds)
        `)
        .eq('status', status)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        return failure(new InfrastructureError(`Failed to list deliveries: ${getErrorMessage(error)}`, { error }));
      }

      const deliveries = (data || []).map((delivery: DeliveryWithJoins) => ({
        ...delivery,
        current_location: delivery.current_location ? pointToCoordinates(delivery.current_location) : null,
        customer_name: delivery.customers?.name || '',
        customer_email: delivery.customers?.email || '',
        customer_phone: delivery.customers?.phone || '',
        origin: delivery.routes?.origin_address || '',
        destination: delivery.routes?.destination_address || '',
        notes: delivery.metadata?.notes || '',
      }));

      return success(deliveries as unknown as Delivery[]);
    } catch (error: unknown) {
      return failure(new InfrastructureError(`Failed to list deliveries: ${getErrorMessage(error)}`, { error }));
    }
  }

  // ===== Notification Operations =====
  async getNotificationById(id: string): Promise<Result<Notification | null>> {
    try {
      const { data, error } = await this.ensureClient()
        .from('notifications')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return success(null);
        }
        return failure(new InfrastructureError(`Failed to get notification: ${getErrorMessage(error)}`, { error }));
      }

      return success(data as Notification);
    } catch (error: unknown) {
      return failure(new InfrastructureError(`Failed to get notification: ${getErrorMessage(error)}`, { error }));
    }
  }

  async createNotification(input: CreateNotificationInput): Promise<Result<Notification>> {
    try {
      // Map message_id to external_id for database column
      const dbInput = {
        delivery_id: input.delivery_id,
        customer_id: input.customer_id,
        channel: input.channel,
        recipient: input.recipient,
        message: input.message,
        delay_minutes: input.delay_minutes,
        status: input.status || 'pending', // Explicitly set status, default to 'pending' if not provided
        external_id: input.message_id, // Map message_id → external_id
        error_message: input.error_message,
        sent_at: input.status === 'sent' ? new Date().toISOString() : null, // Set sent_at timestamp when successfully sent
      };

      const { data, error } = await this.ensureClient()
        .from('notifications')
        .insert(dbInput)
        .select()
        .single();

      if (error) {
        return failure(new InfrastructureError(`Failed to create notification: ${getErrorMessage(error)}`, { error }));
      }

      return success(data as Notification);
    } catch (error: unknown) {
      return failure(new InfrastructureError(`Failed to create notification: ${getErrorMessage(error)}`, { error }));
    }
  }

  async updateNotification(id: string, input: UpdateNotificationInput): Promise<Result<Notification>> {
    try {
      const { data, error } = await this.ensureClient()
        .from('notifications')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return failure(new InfrastructureError(`Failed to update notification: ${getErrorMessage(error)}`, { error }));
      }

      return success(data as Notification);
    } catch (error: unknown) {
      return failure(new InfrastructureError(`Failed to update notification: ${getErrorMessage(error)}`, { error }));
    }
  }

  async listNotificationsByDelivery(deliveryId: string): Promise<Result<Notification[]>> {
    try {
      const { data, error } = await this.ensureClient()
        .from('notifications')
        .select('*')
        .eq('delivery_id', deliveryId)
        .order('created_at', { ascending: false });

      if (error) {
        return failure(new InfrastructureError(`Failed to list notifications: ${getErrorMessage(error)}`, { error }));
      }

      return success((data as Notification[]) || []);
    } catch (error: unknown) {
      return failure(new InfrastructureError(`Failed to list notifications: ${getErrorMessage(error)}`, { error }));
    }
  }

  async listNotificationsByCustomer(customerId: string, limit = 10): Promise<Result<Notification[]>> {
    try {
      const { data, error } = await this.ensureClient()
        .from('notifications')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        return failure(new InfrastructureError(`Failed to list notifications: ${getErrorMessage(error)}`, { error }));
      }

      return success((data as Notification[]) || []);
    } catch (error: unknown) {
      return failure(new InfrastructureError(`Failed to list notifications: ${getErrorMessage(error)}`, { error }));
    }
  }

  async listNotifications(limit = 100, offset = 0): Promise<Result<Notification[]>> {
    try {
      const { data, error } = await this.ensureClient()
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        return failure(new InfrastructureError(`Failed to list notifications: ${getErrorMessage(error)}`, { error }));
      }

      return success((data as Notification[]) || []);
    } catch (error: unknown) {
      return failure(new InfrastructureError(`Failed to list notifications: ${getErrorMessage(error)}`, { error }));
    }
  }

  // ===== Traffic Snapshot Operations =====
  async createTrafficSnapshot(input: CreateTrafficSnapshotInput): Promise<Result<TrafficSnapshot>> {
    try {
      // Convert incident_location coordinates to POINT format if provided
      const dbInput: Omit<CreateTrafficSnapshotInput, 'incident_location'> & { incident_location?: string } = {
        ...input,
        incident_location: input.incident_location ? this.coordinatesToPoint(input.incident_location) : undefined,
      };

      const { data, error } = await this.ensureClient()
        .from('traffic_snapshots')
        .insert(dbInput)
        .select()
        .single();

      if (error) {
        return failure(new InfrastructureError(`Failed to create traffic snapshot: ${getErrorMessage(error)}`, { error }));
      }

      return success(data as TrafficSnapshot);
    } catch (error: unknown) {
      return failure(new InfrastructureError(`Failed to create traffic snapshot: ${getErrorMessage(error)}`, { error }));
    }
  }

  async listTrafficSnapshots(limit = 100, offset = 0): Promise<Result<TrafficSnapshot[]>> {
    try {
      const { data, error } = await this.ensureClient()
        .from('traffic_snapshots')
        .select('*')
        .order('snapshot_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        return failure(new InfrastructureError(`Failed to list traffic snapshots: ${getErrorMessage(error)}`, { error }));
      }

      return success((data as TrafficSnapshot[]) || []);
    } catch (error: unknown) {
      return failure(new InfrastructureError(`Failed to list traffic snapshots: ${getErrorMessage(error)}`, { error }));
    }
  }

  async listTrafficSnapshotsByRoute(routeId: string, limit = 10): Promise<Result<TrafficSnapshot[]>> {
    try {
      const { data, error } = await this.ensureClient()
        .from('traffic_snapshots')
        .select('*')
        .eq('route_id', routeId)
        .order('snapshot_at', { ascending: false })
        .limit(limit);

      if (error) {
        return failure(new InfrastructureError(`Failed to list traffic snapshots: ${getErrorMessage(error)}`, { error }));
      }

      return success((data as TrafficSnapshot[]) || []);
    } catch (error: unknown) {
      return failure(new InfrastructureError(`Failed to list traffic snapshots: ${getErrorMessage(error)}`, { error }));
    }
  }

  // ===== Workflow Execution Operations =====
  async getWorkflowExecutionById(id: string): Promise<Result<WorkflowExecution | null>> {
    try {
      const { data, error } = await this.ensureClient()
        .from('workflow_executions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return success(null);
        }
        return failure(new InfrastructureError(`Failed to get workflow execution: ${getErrorMessage(error)}`, { error }));
      }

      return success(data as WorkflowExecution);
    } catch (error: unknown) {
      return failure(new InfrastructureError(`Failed to get workflow execution: ${getErrorMessage(error)}`, { error }));
    }
  }

  async getWorkflowExecutionByWorkflowId(workflowId: string): Promise<Result<WorkflowExecution | null>> {
    try {
      const { data, error } = await this.ensureClient()
        .from('workflow_executions')
        .select('*')
        .eq('workflow_id', workflowId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return success(null);
        }
        return failure(new InfrastructureError(`Failed to get workflow execution: ${getErrorMessage(error)}`, { error }));
      }

      return success(data as WorkflowExecution);
    } catch (error: unknown) {
      return failure(new InfrastructureError(`Failed to get workflow execution: ${getErrorMessage(error)}`, { error }));
    }
  }

  async getWorkflowExecutionByWorkflowIdAndRunId(workflowId: string, runId: string): Promise<Result<WorkflowExecution | null>> {
    try {
      const { data, error } = await this.ensureClient()
        .from('workflow_executions')
        .select('*')
        .eq('workflow_id', workflowId)
        .eq('run_id', runId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return success(null);
        }
        return failure(new InfrastructureError(`Failed to get workflow execution: ${getErrorMessage(error)}`, { error }));
      }

      return success(data as WorkflowExecution);
    } catch (error: unknown) {
      return failure(new InfrastructureError(`Failed to get workflow execution: ${getErrorMessage(error)}`, { error }));
    }
  }

  async createWorkflowExecution(input: CreateWorkflowExecutionInput): Promise<Result<WorkflowExecution>> {
    try {
      const { data, error } = await this.ensureClient()
        .from('workflow_executions')
        .insert(input)
        .select()
        .single();

      if (error) {
        return failure(new InfrastructureError(`Failed to create workflow execution: ${getErrorMessage(error)}`, { error }));
      }

      return success(data as WorkflowExecution);
    } catch (error: unknown) {
      return failure(new InfrastructureError(`Failed to create workflow execution: ${getErrorMessage(error)}`, { error }));
    }
  }

  async updateWorkflowExecution(id: string, input: UpdateWorkflowExecutionInput): Promise<Result<WorkflowExecution>> {
    try {
      const { data, error } = await this.ensureClient()
        .from('workflow_executions')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return failure(new InfrastructureError(`Failed to update workflow execution: ${getErrorMessage(error)}`, { error }));
      }

      return success(data as WorkflowExecution);
    } catch (error: unknown) {
      return failure(new InfrastructureError(`Failed to update workflow execution: ${getErrorMessage(error)}`, { error }));
    }
  }

  async listWorkflowExecutions(limit = 50, offset = 0): Promise<Result<WorkflowExecution[]>> {
    try {
      const { data, error } = await this.ensureClient()
        .from('workflow_executions')
        .select('*')
        .order('started_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        return failure(new InfrastructureError(`Failed to list workflow executions: ${getErrorMessage(error)}`, { error }));
      }

      return success((data as WorkflowExecution[]) || []);
    } catch (error: unknown) {
      return failure(new InfrastructureError(`Failed to list workflow executions: ${getErrorMessage(error)}`, { error }));
    }
  }

  async listWorkflowExecutionsByDelivery(deliveryId: string): Promise<Result<WorkflowExecution[]>> {
    try {
      const { data, error } = await this.ensureClient()
        .from('workflow_executions')
        .select('*')
        .eq('delivery_id', deliveryId)
        .order('started_at', { ascending: false });

      if (error) {
        return failure(new InfrastructureError(`Failed to list workflow executions: ${getErrorMessage(error)}`, { error }));
      }

      return success((data as WorkflowExecution[]) || []);
    } catch (error: unknown) {
      return failure(new InfrastructureError(`Failed to list workflow executions: ${getErrorMessage(error)}`, { error }));
    }
  }

  // ===== Threshold Operations =====

  async getThresholdById(id: string): Promise<Result<Threshold | null>> {
    try {
      const { data, error } = await this.ensureClient()
        .from('thresholds')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        return failure(new InfrastructureError(`Failed to get threshold: ${getErrorMessage(error)}`, { error }));
      }

      return success(data as Threshold | null);
    } catch (error: unknown) {
      return failure(new InfrastructureError(`Failed to get threshold: ${getErrorMessage(error)}`, { error }));
    }
  }

  async getDefaultThreshold(): Promise<Result<Threshold | null>> {
    try {
      const { data, error } = await this.ensureClient()
        .from('thresholds')
        .select('*')
        .eq('is_default', true)
        .maybeSingle();

      if (error) {
        return failure(new InfrastructureError(`Failed to get default threshold: ${getErrorMessage(error)}`, { error }));
      }

      return success(data as Threshold | null);
    } catch (error: unknown) {
      return failure(new InfrastructureError(`Failed to get default threshold: ${getErrorMessage(error)}`, { error }));
    }
  }

  async createThreshold(input: CreateThresholdInput): Promise<Result<Threshold>> {
    try {
      const { data, error } = await this.ensureClient()
        .from('thresholds')
        .insert(input)
        .select()
        .single();

      if (error) {
        return failure(new InfrastructureError(`Failed to create threshold: ${getErrorMessage(error)}`, { error }));
      }

      return success(data as Threshold);
    } catch (error: unknown) {
      return failure(new InfrastructureError(`Failed to create threshold: ${getErrorMessage(error)}`, { error }));
    }
  }

  async updateThreshold(id: string, input: UpdateThresholdInput): Promise<Result<Threshold>> {
    try {
      const { data, error } = await this.ensureClient()
        .from('thresholds')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return failure(new InfrastructureError(`Failed to update threshold: ${getErrorMessage(error)}`, { error }));
      }

      return success(data as Threshold);
    } catch (error: unknown) {
      return failure(new InfrastructureError(`Failed to update threshold: ${getErrorMessage(error)}`, { error }));
    }
  }

  async deleteThreshold(id: string): Promise<Result<void>> {
    try {
      // First check if it's the default threshold
      const thresholdResult = await this.getThresholdById(id);
      if (!thresholdResult.success || !thresholdResult.value) {
        return failure(new InfrastructureError('Threshold not found'));
      }

      if (thresholdResult.value.is_default) {
        return failure(new InfrastructureError('Cannot delete default threshold'));
      }

      const { error } = await this.ensureClient()
        .from('thresholds')
        .delete()
        .eq('id', id);

      if (error) {
        return failure(new InfrastructureError(`Failed to delete threshold: ${getErrorMessage(error)}`, { error }));
      }

      return success(undefined);
    } catch (error: unknown) {
      return failure(new InfrastructureError(`Failed to delete threshold: ${getErrorMessage(error)}`, { error }));
    }
  }

  async listThresholds(limit = 100, offset = 0): Promise<Result<Threshold[]>> {
    try {
      const { data, error } = await this.ensureClient()
        .from('thresholds')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        return failure(new InfrastructureError(`Failed to list thresholds: ${getErrorMessage(error)}`, { error }));
      }

      return success((data as Threshold[]) || []);
    } catch (error: unknown) {
      return failure(new InfrastructureError(`Failed to list thresholds: ${getErrorMessage(error)}`, { error }));
    }
  }
}