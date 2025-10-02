/**
 * Status Utilities
 * Functions for mapping statuses to UI variants
 */

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
 */
export function getTrafficConditionVariant(condition: string): BadgeVariant {
  const conditionMap: Record<string, BadgeVariant> = {
    light: 'success',
    moderate: 'info',
    heavy: 'warning',
    severe: 'error',
  };

  return conditionMap[condition.toLowerCase()] || 'default';
}
