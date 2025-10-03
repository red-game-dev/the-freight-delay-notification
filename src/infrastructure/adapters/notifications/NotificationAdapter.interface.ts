/**
 * Notification Adapter Interface
 * Defines the contract for all notification providers
 */

import type { Result } from '../../../core/base/utils/Result';
import type { NotificationChannel } from '@/core/types';

export interface NotificationInput {
  to: string;
  subject?: string;
  message: string;
  deliveryId: string;
  priority?: 'low' | 'normal' | 'high';
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
  channel: NotificationChannel;
}

export interface NotificationAdapter {
  /**
   * Provider name for logging and tracking
   */
  readonly providerName: string;

  /**
   * Priority order for fallback (lower number = higher priority)
   */
  readonly priority: number;

  /**
   * Channel this adapter handles
   */
  readonly channel: NotificationChannel;

  /**
   * Check if this adapter is properly configured and ready to use
   */
  isAvailable(): boolean;

  /**
   * Send notification through this adapter
   */
  send(input: NotificationInput): Promise<Result<NotificationResult>>;
}