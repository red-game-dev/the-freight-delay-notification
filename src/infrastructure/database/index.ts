/**
 * Database Infrastructure - Main Export
 */

// Service
export { DatabaseService, getDatabaseService, resetDatabaseService } from './DatabaseService';

// Adapters
export { DatabaseAdapter } from './adapters/DatabaseAdapter.interface';
export { SupabaseDatabaseAdapter } from './adapters/SupabaseDatabaseAdapter';
export { MockDatabaseAdapter } from './adapters/MockDatabaseAdapter';

// Types
export type {
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
  Coordinates,
  NotificationPreferences,
} from './types/database.types';

export type {
  DeliveryStatus,
  TrafficCondition,
  NotificationChannel,
  NotificationStatus,
} from './types/database.types';

// Clients (for advanced usage)
export { supabase, supabaseAdmin, isSupabaseConfigured } from './supabase/SupabaseClient';