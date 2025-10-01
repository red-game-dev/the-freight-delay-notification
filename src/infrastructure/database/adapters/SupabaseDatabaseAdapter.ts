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
    } catch (error: any) {
      console.error('Failed to initialize Supabase client:', error.message);
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

  // ===== Helper: Convert POINT to Coordinates =====
  private pointToCoordinates(point: string): Coordinates {
    // PostgreSQL POINT format: "(lng,lat)" or "lng,lat"
    const cleaned = point.replace(/[()]/g, '');
    const [lng, lat] = cleaned.split(',').map(Number);
    return { lat, lng };
  }

  // ===== Helper: Convert Coordinates to POINT =====
  private coordinatesToPoint(coords: Coordinates): string {
    return `(${coords.lng},${coords.lat})`;
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
        return failure(new InfrastructureError(`Failed to get customer: ${error.message}`, { error }));
      }

      return success(data as Customer);
    } catch (error: any) {
      return failure(new InfrastructureError(`Failed to get customer: ${error.message}`, { error }));
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
        return failure(new InfrastructureError(`Failed to get customer: ${error.message}`, { error }));
      }

      return success(data as Customer);
    } catch (error: any) {
      return failure(new InfrastructureError(`Failed to get customer: ${error.message}`, { error }));
    }
  }

  async createCustomer(input: CreateCustomerInput): Promise<Result<Customer>> {
    try {
      const { data, error } = await this.ensureClient()
        .from('customers')
        .insert(input)
        .select()
        .single();

      if (error) {
        return failure(new InfrastructureError(`Failed to create customer: ${error.message}`, { error }));
      }

      return success(data as Customer);
    } catch (error: any) {
      return failure(new InfrastructureError(`Failed to create customer: ${error.message}`, { error }));
    }
  }

  async listCustomers(limit = 10, offset = 0): Promise<Result<Customer[]>> {
    try {
      const { data, error } = await this.ensureClient()
        .from('customers')
        .select('*')
        .range(offset, offset + limit - 1);

      if (error) {
        return failure(new InfrastructureError(`Failed to list customers: ${error.message}`, { error }));
      }

      return success((data as Customer[]) || []);
    } catch (error: any) {
      return failure(new InfrastructureError(`Failed to list customers: ${error.message}`, { error }));
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
        return failure(new InfrastructureError(`Failed to get route: ${error.message}`, { error }));
      }

      // Convert POINT to Coordinates
      const route: Route = {
        ...data,
        origin_coords: this.pointToCoordinates(data.origin_coords),
        destination_coords: this.pointToCoordinates(data.destination_coords),
      };

      return success(route);
    } catch (error: any) {
      return failure(new InfrastructureError(`Failed to get route: ${error.message}`, { error }));
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
        return failure(new InfrastructureError(`Failed to create route: ${error.message}`, { error }));
      }

      const route: Route = {
        ...data,
        origin_coords: this.pointToCoordinates(data.origin_coords),
        destination_coords: this.pointToCoordinates(data.destination_coords),
      };

      return success(route);
    } catch (error: any) {
      return failure(new InfrastructureError(`Failed to create route: ${error.message}`, { error }));
    }
  }

  async listRoutes(limit = 10, offset = 0): Promise<Result<Route[]>> {
    try {
      const { data, error } = await this.ensureClient()
        .from('routes')
        .select('*')
        .range(offset, offset + limit - 1);

      if (error) {
        return failure(new InfrastructureError(`Failed to list routes: ${error.message}`, { error }));
      }

      const routes = (data || []).map(route => ({
        ...route,
        origin_coords: this.pointToCoordinates(route.origin_coords),
        destination_coords: this.pointToCoordinates(route.destination_coords),
      }));

      return success(routes as Route[]);
    } catch (error: any) {
      return failure(new InfrastructureError(`Failed to list routes: ${error.message}`, { error }));
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
        return failure(new InfrastructureError(`Failed to get delivery: ${error.message}`, { error }));
      }

      const delivery: Delivery = {
        ...data,
        current_location: data.current_location ? this.pointToCoordinates(data.current_location) : null,
        customer_name: (data as any).customers?.name || '',
        customer_email: (data as any).customers?.email || '',
        customer_phone: (data as any).customers?.phone || '',
        origin: (data as any).routes?.origin_address || '',
        destination: (data as any).routes?.destination_address || '',
        notes: data.metadata?.notes || '',
      } as any;

      return success(delivery);
    } catch (error: any) {
      return failure(new InfrastructureError(`Failed to get delivery: ${error.message}`, { error }));
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
        return failure(new InfrastructureError(`Failed to get delivery: ${error.message}`, { error }));
      }

      const delivery: Delivery = {
        ...data,
        current_location: data.current_location ? this.pointToCoordinates(data.current_location) : null,
        customer_name: (data as any).customers?.name || '',
        customer_email: (data as any).customers?.email || '',
        customer_phone: (data as any).customers?.phone || '',
        origin: (data as any).routes?.origin_address || '',
        destination: (data as any).routes?.destination_address || '',
        notes: data.metadata?.notes || '',
      } as any;

      return success(delivery);
    } catch (error: any) {
      return failure(new InfrastructureError(`Failed to get delivery: ${error.message}`, { error }));
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
        return failure(new InfrastructureError(`Failed to create delivery: ${error.message}`, { error }));
      }

      const delivery: Delivery = {
        ...data,
        current_location: data.current_location ? this.pointToCoordinates(data.current_location) : null,
      };

      return success(delivery);
    } catch (error: any) {
      return failure(new InfrastructureError(`Failed to create delivery: ${error.message}`, { error }));
    }
  }

  async updateDelivery(id: string, input: UpdateDeliveryInput): Promise<Result<Delivery>> {
    try {
      const dbInput: any = { ...input };

      // Handle notes - save to metadata
      if ('notes' in input) {
        // Get existing delivery to merge metadata
        const existing = await this.getDeliveryById(id);
        if (!existing.success || !existing.value) {
          return failure(new InfrastructureError('Delivery not found'));
        }

        dbInput.metadata = {
          ...(existing.value.metadata || {}),
          notes: input.notes,
        };
        delete dbInput.notes;
      }

      if (input.current_location) {
        dbInput.current_location = this.coordinatesToPoint(input.current_location);
      }

      const { error } = await this.ensureClient()
        .from('deliveries')
        .update(dbInput)
        .eq('id', id);

      if (error) {
        return failure(new InfrastructureError(`Failed to update delivery: ${error.message}`, { error }));
      }

      // Re-fetch with joins to return complete data
      return await this.getDeliveryById(id) as any;
    } catch (error: any) {
      return failure(new InfrastructureError(`Failed to update delivery: ${error.message}`, { error }));
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
        return failure(new InfrastructureError(`Failed to list deliveries: ${error.message}`, { error }));
      }

      const deliveries = (data || []).map((delivery: any) => ({
        ...delivery,
        current_location: delivery.current_location ? this.pointToCoordinates(delivery.current_location) : null,
        customer_name: delivery.customers?.name || '',
        customer_email: delivery.customers?.email || '',
        customer_phone: delivery.customers?.phone || '',
        origin: delivery.routes?.origin_address || '',
        destination: delivery.routes?.destination_address || '',
        notes: delivery.metadata?.notes || '',
      }));

      return success(deliveries as Delivery[]);
    } catch (error: any) {
      return failure(new InfrastructureError(`Failed to list deliveries: ${error.message}`, { error }));
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
        return failure(new InfrastructureError(`Failed to list deliveries: ${error.message}`, { error }));
      }

      const deliveries = (data || []).map((delivery: any) => ({
        ...delivery,
        current_location: delivery.current_location ? this.pointToCoordinates(delivery.current_location) : null,
        customer_name: delivery.customers?.name || '',
        customer_email: delivery.customers?.email || '',
        customer_phone: delivery.customers?.phone || '',
        origin: delivery.routes?.origin_address || '',
        destination: delivery.routes?.destination_address || '',
        notes: delivery.metadata?.notes || '',
      }));

      return success(deliveries as Delivery[]);
    } catch (error: any) {
      return failure(new InfrastructureError(`Failed to list deliveries: ${error.message}`, { error }));
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
        return failure(new InfrastructureError(`Failed to list deliveries: ${error.message}`, { error }));
      }

      const deliveries = (data || []).map((delivery: any) => ({
        ...delivery,
        current_location: delivery.current_location ? this.pointToCoordinates(delivery.current_location) : null,
        customer_name: delivery.customers?.name || '',
        customer_email: delivery.customers?.email || '',
        customer_phone: delivery.customers?.phone || '',
        origin: delivery.routes?.origin_address || '',
        destination: delivery.routes?.destination_address || '',
        notes: delivery.metadata?.notes || '',
      }));

      return success(deliveries as Delivery[]);
    } catch (error: any) {
      return failure(new InfrastructureError(`Failed to list deliveries: ${error.message}`, { error }));
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
        return failure(new InfrastructureError(`Failed to get notification: ${error.message}`, { error }));
      }

      return success(data as Notification);
    } catch (error: any) {
      return failure(new InfrastructureError(`Failed to get notification: ${error.message}`, { error }));
    }
  }

  async createNotification(input: CreateNotificationInput): Promise<Result<Notification>> {
    try {
      const { data, error } = await this.ensureClient()
        .from('notifications')
        .insert(input)
        .select()
        .single();

      if (error) {
        return failure(new InfrastructureError(`Failed to create notification: ${error.message}`, { error }));
      }

      return success(data as Notification);
    } catch (error: any) {
      return failure(new InfrastructureError(`Failed to create notification: ${error.message}`, { error }));
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
        return failure(new InfrastructureError(`Failed to update notification: ${error.message}`, { error }));
      }

      return success(data as Notification);
    } catch (error: any) {
      return failure(new InfrastructureError(`Failed to update notification: ${error.message}`, { error }));
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
        return failure(new InfrastructureError(`Failed to list notifications: ${error.message}`, { error }));
      }

      return success((data as Notification[]) || []);
    } catch (error: any) {
      return failure(new InfrastructureError(`Failed to list notifications: ${error.message}`, { error }));
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
        return failure(new InfrastructureError(`Failed to list notifications: ${error.message}`, { error }));
      }

      return success((data as Notification[]) || []);
    } catch (error: any) {
      return failure(new InfrastructureError(`Failed to list notifications: ${error.message}`, { error }));
    }
  }

  // ===== Traffic Snapshot Operations =====
  async createTrafficSnapshot(input: CreateTrafficSnapshotInput): Promise<Result<TrafficSnapshot>> {
    try {
      const { data, error } = await this.ensureClient()
        .from('traffic_snapshots')
        .insert(input)
        .select()
        .single();

      if (error) {
        return failure(new InfrastructureError(`Failed to create traffic snapshot: ${error.message}`, { error }));
      }

      return success(data as TrafficSnapshot);
    } catch (error: any) {
      return failure(new InfrastructureError(`Failed to create traffic snapshot: ${error.message}`, { error }));
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
        return failure(new InfrastructureError(`Failed to list traffic snapshots: ${error.message}`, { error }));
      }

      return success((data as TrafficSnapshot[]) || []);
    } catch (error: any) {
      return failure(new InfrastructureError(`Failed to list traffic snapshots: ${error.message}`, { error }));
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
        return failure(new InfrastructureError(`Failed to get workflow execution: ${error.message}`, { error }));
      }

      return success(data as WorkflowExecution);
    } catch (error: any) {
      return failure(new InfrastructureError(`Failed to get workflow execution: ${error.message}`, { error }));
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
        return failure(new InfrastructureError(`Failed to get workflow execution: ${error.message}`, { error }));
      }

      return success(data as WorkflowExecution);
    } catch (error: any) {
      return failure(new InfrastructureError(`Failed to get workflow execution: ${error.message}`, { error }));
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
        return failure(new InfrastructureError(`Failed to create workflow execution: ${error.message}`, { error }));
      }

      return success(data as WorkflowExecution);
    } catch (error: any) {
      return failure(new InfrastructureError(`Failed to create workflow execution: ${error.message}`, { error }));
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
        return failure(new InfrastructureError(`Failed to update workflow execution: ${error.message}`, { error }));
      }

      return success(data as WorkflowExecution);
    } catch (error: any) {
      return failure(new InfrastructureError(`Failed to update workflow execution: ${error.message}`, { error }));
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
        return failure(new InfrastructureError(`Failed to list workflow executions: ${error.message}`, { error }));
      }

      return success((data as WorkflowExecution[]) || []);
    } catch (error: any) {
      return failure(new InfrastructureError(`Failed to list workflow executions: ${error.message}`, { error }));
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
        return failure(new InfrastructureError(`Failed to get threshold: ${error.message}`, { error }));
      }

      return success(data as Threshold | null);
    } catch (error: any) {
      return failure(new InfrastructureError(`Failed to get threshold: ${error.message}`, { error }));
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
        return failure(new InfrastructureError(`Failed to get default threshold: ${error.message}`, { error }));
      }

      return success(data as Threshold | null);
    } catch (error: any) {
      return failure(new InfrastructureError(`Failed to get default threshold: ${error.message}`, { error }));
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
        return failure(new InfrastructureError(`Failed to create threshold: ${error.message}`, { error }));
      }

      return success(data as Threshold);
    } catch (error: any) {
      return failure(new InfrastructureError(`Failed to create threshold: ${error.message}`, { error }));
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
        return failure(new InfrastructureError(`Failed to update threshold: ${error.message}`, { error }));
      }

      return success(data as Threshold);
    } catch (error: any) {
      return failure(new InfrastructureError(`Failed to update threshold: ${error.message}`, { error }));
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
        return failure(new InfrastructureError(`Failed to delete threshold: ${error.message}`, { error }));
      }

      return success(undefined);
    } catch (error: any) {
      return failure(new InfrastructureError(`Failed to delete threshold: ${error.message}`, { error }));
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
        return failure(new InfrastructureError(`Failed to list thresholds: ${error.message}`, { error }));
      }

      return success((data as Threshold[]) || []);
    } catch (error: any) {
      return failure(new InfrastructureError(`Failed to list thresholds: ${error.message}`, { error }));
    }
  }
}