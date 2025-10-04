/**
 * Database Infrastructure - Main Export
 */

// Adapters
export type { DatabaseAdapter } from "./adapters/DatabaseAdapter.interface";
export { MockDatabaseAdapter } from "./adapters/MockDatabaseAdapter";
export { SupabaseDatabaseAdapter } from "./adapters/SupabaseDatabaseAdapter";
// Service
export {
  DatabaseService,
  getDatabaseService,
  resetDatabaseService,
} from "./DatabaseService";
// Types
export type {
  Coordinates,
  CreateCustomerInput,
  CreateDeliveryInput,
  CreateNotificationInput,
  CreateRouteInput,
  CreateTrafficSnapshotInput,
  CreateWorkflowExecutionInput,
  Customer,
  Delivery,
  DeliveryStatus,
  Notification,
  NotificationChannel,
  NotificationPreferences,
  NotificationStatus,
  Route,
  TrafficCondition,
  TrafficSnapshot,
  UpdateDeliveryInput,
  UpdateNotificationInput,
  UpdateWorkflowExecutionInput,
  WorkflowExecution,
} from "./types/database.types";
