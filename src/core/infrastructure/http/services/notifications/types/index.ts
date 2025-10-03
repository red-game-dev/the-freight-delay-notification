/**
 * Notification Types
 * Type definitions for notification-related operations
 */

import type { NotificationChannel, NotificationStatus } from '@/core/types';

export interface Notification {
  id: string;
  delivery_id: string;
  customer_id: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  recipient: string;
  message: string;
  delay_minutes?: number;
  sent_at?: string;
  external_id?: string;
  error_message?: string;
  created_at: string;
  retry_count?: number;
  attempted_at?: string;
  tracking_number?: string;
}

export interface NotificationStats {
  total: number;
  sent?: number;
  failed?: number;
  success_rate?: number;
}
