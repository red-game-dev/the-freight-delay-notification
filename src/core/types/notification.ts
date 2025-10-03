/**
 * Shared Notification Types
 * Common type definitions for notification-related operations
 */

/**
 * Notification delivery channels
 */
export type NotificationChannel = 'email' | 'sms';

/**
 * Notification delivery status
 */
export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'skipped';
