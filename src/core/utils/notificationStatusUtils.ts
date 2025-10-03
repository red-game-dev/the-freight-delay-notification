/**
 * Notification Status Utilities
 * Centralized configuration for notification status and channels
 */

import type { LucideIcon } from 'lucide-react';
import { Mail, MessageSquare, Clock, CheckCircle, XCircle } from 'lucide-react';
import type { BadgeVariant } from './statusUtils';

/**
 * Notification channel configuration
 */
export const NOTIFICATION_CHANNEL_CONFIG = {
  email: {
    label: 'Email',
    icon: Mail,
  },
  sms: {
    label: 'SMS',
    icon: MessageSquare,
  },
} as const;

/**
 * Notification status configuration
 */
export const NOTIFICATION_STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    variant: 'default' as BadgeVariant,
    icon: Clock,
    color: 'text-gray-600',
  },
  sent: {
    label: 'Sent',
    variant: 'success' as BadgeVariant,
    icon: CheckCircle,
    color: 'text-green-600',
  },
  failed: {
    label: 'Failed',
    variant: 'error' as BadgeVariant,
    icon: XCircle,
    color: 'text-red-600',
  },
  skipped: {
    label: 'Skipped',
    variant: 'default' as BadgeVariant,
    icon: XCircle,
    color: 'text-gray-600',
  },
} as const;

export type NotificationChannel = keyof typeof NOTIFICATION_CHANNEL_CONFIG;
export type NotificationStatus = keyof typeof NOTIFICATION_STATUS_CONFIG;

export interface NotificationChannelInfo {
  label: string;
  icon: LucideIcon;
}

export interface NotificationStatusInfo {
  label: string;
  variant: BadgeVariant;
  icon: LucideIcon;
  color: string;
}

/**
 * Get notification channel configuration
 */
export function getNotificationChannelConfig(channel: string): NotificationChannelInfo {
  const key = channel.toLowerCase() as NotificationChannel;
  return NOTIFICATION_CHANNEL_CONFIG[key] || NOTIFICATION_CHANNEL_CONFIG.email;
}

/**
 * Get notification status configuration
 */
export function getNotificationStatusConfig(status: string): NotificationStatusInfo {
  const key = status.toLowerCase() as NotificationStatus;
  return NOTIFICATION_STATUS_CONFIG[key] || NOTIFICATION_STATUS_CONFIG.pending;
}
