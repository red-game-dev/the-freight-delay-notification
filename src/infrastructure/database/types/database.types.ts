/**
 * Database Types
 * TypeScript types matching the PostgreSQL database schema
 */

// Enums
export type DeliveryStatus = 'pending' | 'in_transit' | 'delayed' | 'delivered' | 'cancelled' | 'failed';
export type TrafficCondition = 'light' | 'moderate' | 'heavy' | 'severe';
export type NotificationChannel = 'email' | 'sms';
export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'skipped';

// Coordinate type (PostgreSQL POINT)
export interface Coordinates {
  lat: number;
  lng: number;
}

// Notification Preferences
export interface NotificationPreferences {
  primary: NotificationChannel;
  secondary?: NotificationChannel;
}

// Customer
export interface Customer {
  id: string;
  email: string;
  phone: string | null;
  name: string;
  notification_preferences: NotificationPreferences;
  created_at: Date;
  updated_at: Date;
}

export interface CreateCustomerInput {
  email: string;
  phone?: string;
  name: string;
  notification_preferences?: NotificationPreferences;
}

// Route
export interface Route {
  id: string;
  origin_address: string;
  origin_coords: Coordinates;
  destination_address: string;
  destination_coords: Coordinates;
  distance_meters: number;
  normal_duration_seconds: number;
  current_duration_seconds: number | null;
  traffic_condition: TrafficCondition | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateRouteInput {
  origin_address: string;
  origin_coords: Coordinates;
  destination_address: string;
  destination_coords: Coordinates;
  distance_meters: number;
  normal_duration_seconds: number;
  current_duration_seconds?: number;
  traffic_condition?: TrafficCondition;
}

// Delivery
export interface Delivery {
  id: string;
  tracking_number: string;
  customer_id: string;
  route_id: string;
  status: DeliveryStatus;
  scheduled_delivery: Date;
  actual_delivery: Date | null;
  current_location: Coordinates | null;
  delay_threshold_minutes: number;
  auto_check_traffic: boolean;
  enable_recurring_checks: boolean;
  check_interval_minutes: number;
  max_checks: number;
  checks_performed: number;
  min_delay_change_threshold: number;
  min_hours_between_notifications: number;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface CreateDeliveryInput {
  tracking_number: string;
  customer_id: string;
  route_id: string;
  status?: DeliveryStatus;
  scheduled_delivery: Date;
  delay_threshold_minutes?: number;
  auto_check_traffic?: boolean;
  enable_recurring_checks?: boolean;
  check_interval_minutes?: number;
  max_checks?: number;
  checks_performed?: number;
  min_delay_change_threshold?: number;
  min_hours_between_notifications?: number;
  metadata?: Record<string, any>;
}

export interface UpdateDeliveryInput {
  tracking_number?: string;
  status?: DeliveryStatus;
  actual_delivery?: Date;
  current_location?: Coordinates;
  scheduled_delivery?: Date;
  delay_threshold_minutes?: number;
  auto_check_traffic?: boolean;
  enable_recurring_checks?: boolean;
  check_interval_minutes?: number;
  max_checks?: number;
  checks_performed?: number;
  min_delay_change_threshold?: number;
  min_hours_between_notifications?: number;
  metadata?: Record<string, any>;
  // Frontend convenience fields (will be converted to metadata)
  notes?: string;
  origin?: string;
  destination?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
}

// Notification
export interface Notification {
  id: string;
  delivery_id: string;
  customer_id: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  message: string;
  delay_minutes: number | null;
  sent_at: Date | null;
  external_id: string | null;
  error_message: string | null;
  created_at: Date;
}

export interface CreateNotificationInput {
  delivery_id: string;
  customer_id: string;
  channel: NotificationChannel;
  message: string;
  delay_minutes?: number;
}

export interface UpdateNotificationInput {
  status?: NotificationStatus;
  sent_at?: Date;
  external_id?: string;
  error_message?: string;
}

// Traffic Snapshot
export interface TrafficSnapshot {
  id: string;
  route_id: string;
  traffic_condition: TrafficCondition;
  delay_minutes: number;
  duration_seconds: number;
  snapshot_at: Date;
}

export interface CreateTrafficSnapshotInput {
  route_id: string;
  traffic_condition: TrafficCondition;
  delay_minutes: number;
  duration_seconds: number;
}

// Workflow Execution
export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  run_id: string;
  delivery_id: string | null;
  status: string;
  started_at: Date;
  completed_at: Date | null;
  error_message: string | null;
}

export interface CreateWorkflowExecutionInput {
  workflow_id: string;
  run_id: string;
  delivery_id?: string;
  status: string;
}

export interface UpdateWorkflowExecutionInput {
  status?: string;
  completed_at?: Date;
  error_message?: string;
}

// Threshold
export interface Threshold {
  id: string;
  name: string;
  delay_minutes: number;
  notification_channels: NotificationChannel[];
  is_default: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateThresholdInput {
  name: string;
  delay_minutes: number;
  notification_channels: NotificationChannel[];
  is_default?: boolean;
}

export interface UpdateThresholdInput {
  name?: string;
  delay_minutes?: number;
  notification_channels?: NotificationChannel[];
  is_default?: boolean;
}