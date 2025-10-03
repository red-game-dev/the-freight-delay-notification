/**
 * Workflow Utilities
 * Functions for workflow ID generation and workflow-related operations
 */

/**
 * Workflow types supported by the system
 */
export enum WorkflowType {
  DELAY_NOTIFICATION = 'delay-notification',
  RECURRING_CHECK = 'recurring-check',
  ONE_TIME_CHECK = 'one-time-check',
  MANUAL_CHECK = 'manual-check',
}

/**
 * Workflow ID prefixes for each workflow type
 */
const WORKFLOW_PREFIXES: Record<WorkflowType, string> = {
  [WorkflowType.DELAY_NOTIFICATION]: 'delay-notification',
  [WorkflowType.RECURRING_CHECK]: 'recurring-check',
  [WorkflowType.ONE_TIME_CHECK]: 'one-time-check',
  [WorkflowType.MANUAL_CHECK]: 'manual-check',
};

/**
 * Parsed workflow ID structure
 */
export interface ParsedWorkflowId {
  type: WorkflowType;
  deliveryId: string;
  timestamp?: number;
  raw: string;
}

/**
 * Generate a workflow ID based on type
 * @param type - The workflow type
 * @param deliveryId - The delivery ID
 * @param includeTimestamp - Whether to include timestamp for uniqueness (default: true)
 */
export function createWorkflowId(
  type: WorkflowType,
  deliveryId: string,
  includeTimestamp: boolean = true
): string {
  const prefix = WORKFLOW_PREFIXES[type];

  if (includeTimestamp) {
    return `${prefix}-${deliveryId}-${Date.now()}`;
  }

  return `${prefix}-${deliveryId}`;
}

/**
 * Parse a workflow ID to extract its components
 * @param workflowId - The workflow ID to parse
 * @returns Parsed workflow ID or null if invalid
 */
export function parseWorkflowId(workflowId: string): ParsedWorkflowId | null {
  if (!workflowId) return null;

  // Try to match pattern: {prefix}-{deliveryId}-{timestamp?}
  for (const [type, prefix] of Object.entries(WORKFLOW_PREFIXES)) {
    if (workflowId.startsWith(`${prefix}-`)) {
      const parts = workflowId.substring(prefix.length + 1).split('-');

      if (parts.length === 0) return null;

      // Last part might be timestamp if it's a number
      const lastPart = parts[parts.length - 1];
      const timestamp = /^\d+$/.test(lastPart) ? parseInt(lastPart, 10) : undefined;

      // Delivery ID is everything except the timestamp (if present)
      const deliveryId = timestamp !== undefined
        ? parts.slice(0, -1).join('-')
        : parts.join('-');

      if (!deliveryId) return null;

      return {
        type: type as WorkflowType,
        deliveryId,
        timestamp,
        raw: workflowId,
      };
    }
  }

  return null;
}

/**
 * Extract delivery ID from workflow ID
 * @param workflowId - The workflow ID
 * @returns Delivery ID or null if invalid
 */
export function extractDeliveryId(workflowId: string): string | null {
  const parsed = parseWorkflowId(workflowId);
  return parsed?.deliveryId ?? null;
}

/**
 * Extract workflow type from workflow ID
 * @param workflowId - The workflow ID
 * @returns Workflow type or null if invalid
 */
export function extractWorkflowType(workflowId: string): WorkflowType | null {
  const parsed = parseWorkflowId(workflowId);
  return parsed?.type ?? null;
}

/**
 * Check if a workflow ID is valid
 * @param workflowId - The workflow ID to validate
 * @returns True if valid, false otherwise
 */
export function isValidWorkflowId(workflowId: string): boolean {
  return parseWorkflowId(workflowId) !== null;
}

/**
 * Check if a workflow ID belongs to a specific type
 * @param workflowId - The workflow ID to check
 * @param type - The workflow type to compare against
 * @returns True if the workflow ID matches the type
 */
export function isWorkflowType(workflowId: string, type: WorkflowType): boolean {
  const parsed = parseWorkflowId(workflowId);
  return parsed?.type === type;
}

/**
 * Get human-readable workflow type name
 * @param type - The workflow type
 * @returns Human-readable name
 */
export function getWorkflowTypeName(type: WorkflowType): string {
  switch (type) {
    case WorkflowType.DELAY_NOTIFICATION:
      return 'Delay Notification';
    case WorkflowType.RECURRING_CHECK:
      return 'Recurring Check';
    case WorkflowType.ONE_TIME_CHECK:
      return 'One-Time Check';
    case WorkflowType.MANUAL_CHECK:
      return 'Manual Check';
    default:
      return 'Unknown';
  }
}
