/**
 * Database Service
 * Manages database adapter selection and provides unified interface
 */

import { logger } from '../../core/base/utils/Logger';
import type { DatabaseAdapter } from './adapters/DatabaseAdapter.interface';
import { SupabaseDatabaseAdapter } from './adapters/SupabaseDatabaseAdapter';
import { MockDatabaseAdapter } from './adapters/MockDatabaseAdapter';
import { supabaseAdmin, isSupabaseConfigured } from './supabase/SupabaseClient';

/**
 * Database Service
 * Automatically selects the appropriate database adapter based on configuration
 * Falls back to Mock adapter for development/testing
 */
export class DatabaseService {
  private adapter: DatabaseAdapter;

  constructor(forceAdapter?: DatabaseAdapter) {
    if (forceAdapter) {
      this.adapter = forceAdapter;
      logger.info(`DatabaseService initialized with forced adapter: ${this.adapter.name}`);
    } else {
      this.adapter = this.selectAdapter();
      logger.info(`DatabaseService initialized with adapter: ${this.adapter.name}`);
    }
  }

  /**
   * Select appropriate adapter based on configuration
   */
  private selectAdapter(): DatabaseAdapter {
    // Try Supabase if configured
    if (isSupabaseConfigured()) {
      const supabaseAdapter = new SupabaseDatabaseAdapter(supabaseAdmin);
      if (supabaseAdapter.isAvailable()) {
        logger.info('Using Supabase Database Adapter');
        return supabaseAdapter;
      }
    }

    // Fallback to mock
    logger.warn('Supabase not configured or unavailable, falling back to Mock Database Adapter');
    return new MockDatabaseAdapter(true); // Seed with mock data
  }

  /**
   * Get the current adapter
   */
  getAdapter(): DatabaseAdapter {
    return this.adapter;
  }

  /**
   * Check if adapter is available
   */
  isAvailable(): boolean {
    return this.adapter.isAvailable();
  }

  /**
   * Get adapter name
   */
  getAdapterName(): string {
    return this.adapter.name;
  }

  // ===== Customer Operations =====

  async getCustomerById(id: string) {
    return this.adapter.getCustomerById(id);
  }

  async getCustomerByEmail(email: string) {
    return this.adapter.getCustomerByEmail(email);
  }

  async createCustomer(input: Parameters<DatabaseAdapter['createCustomer']>[0]) {
    return this.adapter.createCustomer(input);
  }

  async listCustomers(limit?: number, offset?: number) {
    return this.adapter.listCustomers(limit, offset);
  }

  // ===== Route Operations =====

  async getRouteById(id: string) {
    return this.adapter.getRouteById(id);
  }

  async createRoute(input: Parameters<DatabaseAdapter['createRoute']>[0]) {
    return this.adapter.createRoute(input);
  }

  async listRoutes(limit?: number, offset?: number) {
    return this.adapter.listRoutes(limit, offset);
  }

  // ===== Delivery Operations =====

  async getDeliveryById(id: string) {
    return this.adapter.getDeliveryById(id);
  }

  async getDeliveryByTrackingNumber(trackingNumber: string) {
    return this.adapter.getDeliveryByTrackingNumber(trackingNumber);
  }

  async createDelivery(input: Parameters<DatabaseAdapter['createDelivery']>[0]) {
    return this.adapter.createDelivery(input);
  }

  async updateDelivery(id: string, input: Parameters<DatabaseAdapter['updateDelivery']>[1]) {
    return this.adapter.updateDelivery(id, input);
  }

  async listDeliveries(limit?: number, offset?: number) {
    return this.adapter.listDeliveries(limit, offset);
  }

  async listDeliveriesByCustomer(customerId: string, limit?: number) {
    return this.adapter.listDeliveriesByCustomer(customerId, limit);
  }

  async listDeliveriesByStatus(status: string, limit?: number) {
    return this.adapter.listDeliveriesByStatus(status, limit);
  }

  // ===== Notification Operations =====

  async getNotificationById(id: string) {
    return this.adapter.getNotificationById(id);
  }

  async createNotification(input: Parameters<DatabaseAdapter['createNotification']>[0]) {
    return this.adapter.createNotification(input);
  }

  async updateNotification(id: string, input: Parameters<DatabaseAdapter['updateNotification']>[1]) {
    return this.adapter.updateNotification(id, input);
  }

  async listNotificationsByDelivery(deliveryId: string) {
    return this.adapter.listNotificationsByDelivery(deliveryId);
  }

  async listNotificationsByCustomer(customerId: string, limit?: number) {
    return this.adapter.listNotificationsByCustomer(customerId, limit);
  }

  // ===== Traffic Snapshot Operations =====

  async createTrafficSnapshot(input: Parameters<DatabaseAdapter['createTrafficSnapshot']>[0]) {
    return this.adapter.createTrafficSnapshot(input);
  }

  async listTrafficSnapshotsByRoute(routeId: string, limit?: number) {
    return this.adapter.listTrafficSnapshotsByRoute(routeId, limit);
  }

  // ===== Workflow Execution Operations =====

  async getWorkflowExecutionById(id: string) {
    return this.adapter.getWorkflowExecutionById(id);
  }

  async getWorkflowExecutionByWorkflowId(workflowId: string) {
    return this.adapter.getWorkflowExecutionByWorkflowId(workflowId);
  }

  async createWorkflowExecution(input: Parameters<DatabaseAdapter['createWorkflowExecution']>[0]) {
    return this.adapter.createWorkflowExecution(input);
  }

  async updateWorkflowExecution(id: string, input: Parameters<DatabaseAdapter['updateWorkflowExecution']>[1]) {
    return this.adapter.updateWorkflowExecution(id, input);
  }

  async listWorkflowExecutionsByDelivery(deliveryId: string) {
    return this.adapter.listWorkflowExecutionsByDelivery(deliveryId);
  }
}

// Singleton instance
let databaseServiceInstance: DatabaseService | null = null;

/**
 * Get singleton database service instance
 */
export function getDatabaseService(forceAdapter?: DatabaseAdapter): DatabaseService {
  if (!databaseServiceInstance || forceAdapter) {
    databaseServiceInstance = new DatabaseService(forceAdapter);
  }
  return databaseServiceInstance;
}

/**
 * Reset database service (useful for testing)
 */
export function resetDatabaseService(): void {
  databaseServiceInstance = null;
}