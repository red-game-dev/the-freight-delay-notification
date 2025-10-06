/**
 * Database Service
 * Manages multiple database adapters with write-to-all and read-with-fallback patterns
 * Supports multi-region, redundancy, and gradual migration scenarios
 */

import { InfrastructureError } from "../../core/base/errors/BaseError";
import { isProduction } from "../../core/base/utils/environment";
import { getErrorMessage, logger } from "../../core/base/utils/Logger";
import { failure, type Result } from "../../core/base/utils/Result";
import type { DatabaseAdapter } from "./adapters/DatabaseAdapter.interface";
import { MockDatabaseAdapter } from "./adapters/MockDatabaseAdapter";
import { SupabaseDatabaseAdapter } from "./adapters/SupabaseDatabaseAdapter";

/**
 * Database Service
 * - Writes to ALL available adapters (for redundancy/multi-region)
 * - Reads from primary adapter with automatic fallback
 * - Always has Mock as final fallback
 */
export class DatabaseService {
  private adapters: DatabaseAdapter[] = [];
  private primaryAdapter: DatabaseAdapter;

  constructor(forceAdapters?: DatabaseAdapter[]) {
    if (forceAdapters) {
      this.adapters = forceAdapters;
      this.primaryAdapter = forceAdapters[0];
      logger.info(
        `DatabaseService initialized with ${forceAdapters.length} forced adapters`,
      );
    } else {
      this.adapters = this.initializeAdapters();
      this.primaryAdapter = this.adapters[0];
      logger.info(
        `DatabaseService initialized with ${this.adapters.length} adapters: ${this.adapters.map((a) => a.name).join(", ")}`,
      );
      logger.info(`Primary adapter: ${this.primaryAdapter.name}`);
    }
  }

  /**
   * Initialize all available database adapters
   * Priority order: Supabase → Mock (always succeeds)
   */
  private initializeAdapters(): DatabaseAdapter[] {
    const adapters: DatabaseAdapter[] = [];

    // Try Supabase
    const supabaseAdapter = new SupabaseDatabaseAdapter();
    if (supabaseAdapter.isAvailable()) {
      adapters.push(supabaseAdapter);
      logger.info("✅ Supabase Database Adapter available");
    } else {
      logger.warn("⚠️  Supabase Database Adapter not configured");
    }

    // Add more adapters here as needed
    // const postgresAdapter = new PostgresDatabaseAdapter();
    // if (postgresAdapter.isAvailable()) {
    //   adapters.push(postgresAdapter);
    // }

    // Add Mock adapter ONLY as fallback when no adapters available OR in development
    if (adapters.length === 0) {
      logger.warn("No database adapters configured, using Mock adapter");
      adapters.push(new MockDatabaseAdapter(true)); // Seed with mock data
    } else if (!isProduction()) {
      // In non-production (development/test), add Mock for testing alongside real adapters
      logger.info("✅ Mock Database Adapter added (non-production mode)");
      adapters.push(new MockDatabaseAdapter(true));
    }
    // In production: Only use Supabase (or other configured adapters), no Mock

    return adapters;
  }

  /**
   * Get all available adapters
   */
  getAdapters(): DatabaseAdapter[] {
    return this.adapters;
  }

  /**
   * Get the primary adapter
   */
  getAdapter(): DatabaseAdapter {
    return this.primaryAdapter;
  }

  /**
   * Check if any adapter is available
   */
  isAvailable(): boolean {
    return this.adapters.length > 0;
  }

  /**
   * Get primary adapter name
   */
  getAdapterName(): string {
    return this.primaryAdapter.name;
  }

  /**
   * Get current adapter name (alias for getAdapterName)
   */
  get currentAdapter(): string {
    return this.primaryAdapter.name;
  }

  /**
   * Write operation: Write to ALL adapters
   * Returns primary result, logs secondary failures
   */
  private async writeToAll<T>(
    operation: string,
    fn: (adapter: DatabaseAdapter) => Promise<Result<T>>,
  ): Promise<Result<T>> {
    const results = await Promise.allSettled(
      this.adapters.map(async (adapter) => ({
        adapter: adapter.name,
        result: await fn(adapter),
      })),
    );

    // Get primary result (first adapter)
    const primaryResult = results[0];
    if (primaryResult.status === "rejected") {
      logger.error(
        `${operation} failed on primary adapter:`,
        primaryResult.reason,
      );
      return failure(
        new InfrastructureError(`${operation} failed on primary adapter`),
      );
    }

    const primaryData = primaryResult.value.result;

    // Log secondary adapter results (non-critical failures)
    for (let i = 1; i < results.length; i++) {
      const result = results[i];
      if (result.status === "fulfilled") {
        if (result.value.result.success) {
          logger.info(`${operation} succeeded on ${result.value.adapter}`);
        } else {
          // Secondary adapter failures are non-critical (e.g., Mock doesn't have production data)
          logger.warn(
            `${operation} failed on secondary adapter ${result.value.adapter}:`,
            result.value.result.error.message,
          );
        }
      } else {
        logger.warn(
          `${operation} failed on secondary adapter ${i}:`,
          result.reason,
        );
      }
    }

    return primaryData;
  }

  /**
   * Read operation: Try adapters in order until success
   */
  private async readWithFallback<T>(
    operation: string,
    fn: (adapter: DatabaseAdapter) => Promise<Result<T>>,
  ): Promise<Result<T>> {
    for (const adapter of this.adapters) {
      try {
        const result = await fn(adapter);
        if (result.success) {
          if (adapter !== this.primaryAdapter) {
            logger.warn(
              `${operation} succeeded on fallback adapter: ${adapter.name}`,
            );
          }
          return result;
        }
        logger.warn(
          `${operation} failed on ${adapter.name}, trying next adapter`,
        );
      } catch (error: unknown) {
        logger.error(
          `${operation} error on ${adapter.name}:`,
          getErrorMessage(error),
        );
      }
    }

    return failure(
      new InfrastructureError(`${operation} failed on all adapters`),
    );
  }

  // ===== Customer Operations =====

  async getCustomerById(id: string) {
    return this.readWithFallback("getCustomerById", (adapter) =>
      adapter.getCustomerById(id),
    );
  }

  async getCustomerByEmail(email: string) {
    return this.readWithFallback("getCustomerByEmail", (adapter) =>
      adapter.getCustomerByEmail(email),
    );
  }

  async createCustomer(
    input: Parameters<DatabaseAdapter["createCustomer"]>[0],
  ) {
    return this.writeToAll("createCustomer", (adapter) =>
      adapter.createCustomer(input),
    );
  }

  async updateCustomer(
    id: string,
    input: Parameters<DatabaseAdapter["updateCustomer"]>[1],
  ) {
    return this.writeToAll("updateCustomer", (adapter) =>
      adapter.updateCustomer(id, input),
    );
  }

  async deleteCustomer(id: string) {
    return this.writeToAll("deleteCustomer", (adapter) =>
      adapter.deleteCustomer(id),
    );
  }

  async listCustomers(limit?: number, offset?: number) {
    return this.readWithFallback("listCustomers", (adapter) =>
      adapter.listCustomers(limit, offset),
    );
  }

  // ===== Route Operations =====

  async getRouteById(id: string) {
    return this.readWithFallback("getRouteById", (adapter) =>
      adapter.getRouteById(id),
    );
  }

  async createRoute(input: Parameters<DatabaseAdapter["createRoute"]>[0]) {
    return this.writeToAll("createRoute", (adapter) =>
      adapter.createRoute(input),
    );
  }

  async updateRoute(
    id: string,
    input: Parameters<DatabaseAdapter["updateRoute"]>[1],
  ) {
    return this.writeToAll("updateRoute", (adapter) =>
      adapter.updateRoute(id, input),
    );
  }

  async deleteRoute(id: string) {
    return this.writeToAll("deleteRoute", (adapter) =>
      adapter.deleteRoute(id),
    );
  }

  async listRoutes(limit?: number, offset?: number) {
    return this.readWithFallback("listRoutes", (adapter) =>
      adapter.listRoutes(limit, offset),
    );
  }

  // ===== Delivery Operations =====

  async getDeliveryById(id: string) {
    return this.readWithFallback("getDeliveryById", (adapter) =>
      adapter.getDeliveryById(id),
    );
  }

  async getDeliveryByTrackingNumber(trackingNumber: string) {
    return this.readWithFallback("getDeliveryByTrackingNumber", (adapter) =>
      adapter.getDeliveryByTrackingNumber(trackingNumber),
    );
  }

  async createDelivery(
    input: Parameters<DatabaseAdapter["createDelivery"]>[0],
  ) {
    return this.writeToAll("createDelivery", (adapter) =>
      adapter.createDelivery(input),
    );
  }

  async updateDelivery(
    id: string,
    input: Parameters<DatabaseAdapter["updateDelivery"]>[1],
  ) {
    return this.writeToAll("updateDelivery", (adapter) =>
      adapter.updateDelivery(id, input),
    );
  }

  async deleteDelivery(id: string) {
    return this.writeToAll("deleteDelivery", (adapter) =>
      adapter.deleteDelivery(id),
    );
  }

  async listDeliveries(limit?: number, offset?: number) {
    return this.readWithFallback("listDeliveries", (adapter) =>
      adapter.listDeliveries(limit, offset),
    );
  }

  async listDeliveriesByCustomer(customerId: string, limit?: number) {
    return this.readWithFallback("listDeliveriesByCustomer", (adapter) =>
      adapter.listDeliveriesByCustomer(customerId, limit),
    );
  }

  async listDeliveriesByStatus(status: string, limit?: number) {
    return this.readWithFallback("listDeliveriesByStatus", (adapter) =>
      adapter.listDeliveriesByStatus(status, limit),
    );
  }

  // ===== Notification Operations =====

  async getNotificationById(id: string) {
    return this.readWithFallback("getNotificationById", (adapter) =>
      adapter.getNotificationById(id),
    );
  }

  async createNotification(
    input: Parameters<DatabaseAdapter["createNotification"]>[0],
  ) {
    return this.writeToAll("createNotification", (adapter) =>
      adapter.createNotification(input),
    );
  }

  async updateNotification(
    id: string,
    input: Parameters<DatabaseAdapter["updateNotification"]>[1],
  ) {
    return this.writeToAll("updateNotification", (adapter) =>
      adapter.updateNotification(id, input),
    );
  }

  async listNotifications(limit?: number, offset?: number) {
    return this.readWithFallback("listNotifications", (adapter) =>
      adapter.listNotifications(limit, offset),
    );
  }

  async listNotificationsByDelivery(deliveryId: string) {
    return this.readWithFallback("listNotificationsByDelivery", (adapter) =>
      adapter.listNotificationsByDelivery(deliveryId),
    );
  }

  async listNotificationsByCustomer(customerId: string, limit?: number) {
    return this.readWithFallback("listNotificationsByCustomer", (adapter) =>
      adapter.listNotificationsByCustomer(customerId, limit),
    );
  }

  // ===== Traffic Snapshot Operations =====

  async createTrafficSnapshot(
    input: Parameters<DatabaseAdapter["createTrafficSnapshot"]>[0],
  ) {
    return this.writeToAll("createTrafficSnapshot", (adapter) =>
      adapter.createTrafficSnapshot(input),
    );
  }

  async upsertTrafficSnapshot(
    input: Parameters<DatabaseAdapter["upsertTrafficSnapshot"]>[0],
  ) {
    return this.writeToAll("upsertTrafficSnapshot", (adapter) =>
      adapter.upsertTrafficSnapshot(input),
    );
  }

  async listTrafficSnapshots(limit?: number, offset?: number) {
    return this.readWithFallback("listTrafficSnapshots", (adapter) =>
      adapter.listTrafficSnapshots(limit, offset),
    );
  }

  async listTrafficSnapshotsByRoute(routeId: string, limit?: number) {
    return this.readWithFallback("listTrafficSnapshotsByRoute", (adapter) =>
      adapter.listTrafficSnapshotsByRoute(routeId, limit),
    );
  }

  // ===== Workflow Execution Operations =====

  async getWorkflowExecutionById(id: string) {
    return this.readWithFallback("getWorkflowExecutionById", (adapter) =>
      adapter.getWorkflowExecutionById(id),
    );
  }

  async getWorkflowExecutionByWorkflowId(workflowId: string) {
    return this.readWithFallback(
      "getWorkflowExecutionByWorkflowId",
      (adapter) => adapter.getWorkflowExecutionByWorkflowId(workflowId),
    );
  }

  async getWorkflowExecutionByWorkflowIdAndRunId(
    workflowId: string,
    runId: string,
  ) {
    return this.readWithFallback(
      "getWorkflowExecutionByWorkflowIdAndRunId",
      (adapter) =>
        adapter.getWorkflowExecutionByWorkflowIdAndRunId(workflowId, runId),
    );
  }

  async createWorkflowExecution(
    input: Parameters<DatabaseAdapter["createWorkflowExecution"]>[0],
  ) {
    return this.writeToAll("createWorkflowExecution", (adapter) =>
      adapter.createWorkflowExecution(input),
    );
  }

  async updateWorkflowExecution(
    id: string,
    input: Parameters<DatabaseAdapter["updateWorkflowExecution"]>[1],
  ) {
    return this.writeToAll("updateWorkflowExecution", (adapter) =>
      adapter.updateWorkflowExecution(id, input),
    );
  }

  async listWorkflowExecutions(limit?: number, offset?: number) {
    return this.readWithFallback("listWorkflowExecutions", (adapter) =>
      adapter.listWorkflowExecutions(limit, offset),
    );
  }

  async listWorkflowExecutionsByDelivery(deliveryId: string) {
    return this.readWithFallback(
      "listWorkflowExecutionsByDelivery",
      (adapter) => adapter.listWorkflowExecutionsByDelivery(deliveryId),
    );
  }

  // ===== Threshold Operations =====

  async getThresholdById(id: string) {
    return this.readWithFallback("getThresholdById", (adapter) =>
      adapter.getThresholdById(id),
    );
  }

  async getDefaultThreshold() {
    return this.readWithFallback("getDefaultThreshold", (adapter) =>
      adapter.getDefaultThreshold(),
    );
  }

  async createThreshold(
    input: Parameters<DatabaseAdapter["createThreshold"]>[0],
  ) {
    return this.writeToAll("createThreshold", (adapter) =>
      adapter.createThreshold(input),
    );
  }

  async updateThreshold(
    id: string,
    input: Parameters<DatabaseAdapter["updateThreshold"]>[1],
  ) {
    return this.writeToAll("updateThreshold", (adapter) =>
      adapter.updateThreshold(id, input),
    );
  }

  async deleteThreshold(id: string) {
    return this.writeToAll("deleteThreshold", (adapter) =>
      adapter.deleteThreshold(id),
    );
  }

  async listThresholds(limit?: number, offset?: number) {
    return this.readWithFallback("listThresholds", (adapter) =>
      adapter.listThresholds(limit, offset),
    );
  }

  // ===== Transaction Safety Functions =====

  async incrementChecksPerformed(deliveryId: string) {
    return this.writeToAll("incrementChecksPerformed", (adapter) =>
      adapter.incrementChecksPerformed(deliveryId),
    );
  }

  // ===== Audit Context Functions =====

  async setAuditContext(userId: string, requestId: string) {
    // Only set on primary adapter (not all adapters)
    return this.primaryAdapter.setAuditContext(userId, requestId);
  }
}

// Singleton instance
let databaseServiceInstance: DatabaseService | null = null;

/**
 * Get singleton database service instance
 */
export function getDatabaseService(
  forceAdapters?: DatabaseAdapter[],
): DatabaseService {
  if (!databaseServiceInstance || forceAdapters) {
    databaseServiceInstance = new DatabaseService(forceAdapters);
  }
  return databaseServiceInstance;
}

/**
 * Reset database service (useful for testing)
 */
export function resetDatabaseService(): void {
  databaseServiceInstance = null;
}
