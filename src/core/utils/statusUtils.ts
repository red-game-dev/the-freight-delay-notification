/**
 * Status Utilities
 * Functions for mapping statuses to UI variants
 */

import { getTrafficConfig } from './trafficUtils';

export type BadgeVariant = 'default' | 'success' | 'error' | 'warning' | 'info';

/**
 * Get badge variant for delivery status
 */
export function getDeliveryStatusVariant(status: string): BadgeVariant {
  const statusMap: Record<string, BadgeVariant> = {
    delivered: 'success',
    delayed: 'error',
    in_transit: 'warning',
    pending: 'default',
    cancelled: 'error',
    failed: 'error',
  };

  return statusMap[status.toLowerCase()] || 'default';
}

/**
 * Get badge variant for notification status
 * @deprecated Use getNotificationStatusConfig from notificationStatusUtils instead
 */
export function getNotificationStatusVariant(status: string): BadgeVariant {
  const statusMap: Record<string, BadgeVariant> = {
    sent: 'success',
    delivered: 'success',
    failed: 'error',
    pending: 'warning',
    queued: 'info',
  };

  return statusMap[status.toLowerCase()] || 'default';
}

/**
 * Get badge variant for traffic condition
 * Uses the centralized traffic configuration from trafficUtils
 */
export function getTrafficConditionVariant(condition: string): BadgeVariant {
  const config = getTrafficConfig(condition);
  return config.variant;
}
