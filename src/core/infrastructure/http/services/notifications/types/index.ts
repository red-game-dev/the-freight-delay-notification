/**
 * Notification Types
 * Type definitions for notification-related operations
 */

export interface Notification {
  id: string;
  delivery_id: string;
  customer_id: string;
  channel: 'email' | 'sms';
  status: 'pending' | 'sent' | 'failed' | 'skipped';
  recipient: string;
  message: string;
  delay_minutes?: number;
  sent_at?: string;
  external_id?: string;
  error_message?: string;
  created_at: string;
}

export interface NotificationStats {
  total: number;
  sent?: number;
  failed?: number;
  success_rate?: number;
}
