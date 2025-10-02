/**
 * Workflow Utilities
 * Functions for workflow ID generation and workflow-related operations
 */

/**
 * Generate a workflow ID for delay notification
 * @param deliveryId - The delivery ID
 * @param includeTimestamp - Whether to include timestamp for uniqueness
 */
export function generateWorkflowId(deliveryId: string, includeTimestamp: boolean = true): string {
  if (includeTimestamp) {
    return `delay-notification-${deliveryId}-${Date.now()}`;
  }
  return `delay-notification-${deliveryId}`;
}

/**
 * Generate a workflow ID for recurring traffic checks
 * @param deliveryId - The delivery ID
 */
export function generateRecurringWorkflowId(deliveryId: string): string {
  return `recurring-check-${deliveryId}`;
}
