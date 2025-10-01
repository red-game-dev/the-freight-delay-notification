/**
 * Notification Types
 * Type definitions for notification-related operations
 */

export interface Notification {
  id: string;
  delivery_id: string;
  channel: 'email' | 'sms';
  recipient: string;
  message: string;
  status: 'sent' | 'failed';
  sent_at: string;
  error?: string;
}

export interface NotificationStats {
  total: number;
  sent?: number;
  failed?: number;
  success_rate?: number;
}
