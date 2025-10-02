/**
 * Delivery Types
 * Type definitions for delivery-related operations
 */

export interface Delivery {
  id: string;
  tracking_number: string;
  origin: string;
  destination: string;
  scheduled_delivery: string;
  status: 'pending' | 'in_transit' | 'delayed' | 'delivered' | 'cancelled';
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  notes?: string;
  auto_check_traffic: boolean;
  enable_recurring_checks: boolean;
  check_interval_minutes: number;
  max_checks: number;
  checks_performed: number;
  delay_threshold_minutes: number;
  min_delay_change_threshold: number;
  min_hours_between_notifications: number;
  created_at: string;
  updated_at: string;
}

export interface CreateDeliveryInput {
  tracking_number: string;
  origin: string;
  destination: string;
  scheduled_delivery: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  notes?: string;
  auto_check_traffic?: boolean;
  enable_recurring_checks?: boolean;
  check_interval_minutes?: number;
  max_checks?: number;
  min_delay_change_threshold?: number;
  min_hours_between_notifications?: number;
}

export interface UpdateDeliveryInput extends Partial<CreateDeliveryInput> {
  status?: Delivery['status'];
}

export interface DeliveryStats {
  total: number;
  in_transit?: number;
  delayed?: number;
  delivered?: number;
}
