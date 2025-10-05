/**
 * Workflow Utilities
 * Centralized configuration for workflow operations
 */

import type { LucideIcon } from "lucide-react";
import { AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";
import type { BadgeVariant } from "./statusUtils";

/**
 * Workflow types supported by the system
 */
export enum WorkflowType {
  DELAY_NOTIFICATION = "delay-notification",
  RECURRING_CHECK = "recurring-check",
  ONE_TIME_CHECK = "one-time-check",
  MANUAL_CHECK = "manual-check",
}

/**
 * Workflow ID prefixes for each workflow type
 */
const WORKFLOW_PREFIXES: Record<WorkflowType, string> = {
  [WorkflowType.DELAY_NOTIFICATION]: "delay-notification",
  [WorkflowType.RECURRING_CHECK]: "recurring-check",
  [WorkflowType.ONE_TIME_CHECK]: "one-time-check",
  [WorkflowType.MANUAL_CHECK]: "manual-check",
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
 * Workflow status configuration
 */
export const WORKFLOW_STATUS_CONFIG = {
  running: {
    label: "Running",
    variant: "info" as BadgeVariant,
    icon: Clock,
    color: "text-blue-600",
  },
  completed: {
    label: "Completed",
    variant: "success" as BadgeVariant,
    icon: CheckCircle,
    color: "text-green-600",
  },
  failed: {
    label: "Failed",
    variant: "error" as BadgeVariant,
    icon: XCircle,
    color: "text-red-600",
  },
  cancelled: {
    label: "Cancelled",
    variant: "default" as BadgeVariant,
    icon: XCircle,
    color: "text-gray-600",
  },
  timed_out: {
    label: "Timed Out",
    variant: "warning" as BadgeVariant,
    icon: AlertCircle,
    color: "text-yellow-600",
  },
} as const;

export type WorkflowStatus = keyof typeof WORKFLOW_STATUS_CONFIG;

export interface WorkflowStatusInfo {
  label: string;
  variant: BadgeVariant;
  icon: LucideIcon;
  color: string;
}

/**
 * Get workflow status configuration
 */
export function getWorkflowStatusConfig(status: string): WorkflowStatusInfo {
  const key = status.toLowerCase() as WorkflowStatus;
  return WORKFLOW_STATUS_CONFIG[key] || WORKFLOW_STATUS_CONFIG.failed;
}

/**
 * Generate a workflow ID based on type
 * @param type - The workflow type
 * @param deliveryId - The delivery ID
 * @param includeTimestamp - Whether to include timestamp for uniqueness (default: true)
 * @param checkNumber - Optional check number for recurring workflows (adds specificity)
 */
export function createWorkflowId(
  type: WorkflowType,
  deliveryId: string,
  includeTimestamp: boolean = true,
  checkNumber?: number,
): string {
  const prefix = WORKFLOW_PREFIXES[type];
  let id = `${prefix}-${deliveryId}`;

  // Add check number if provided (useful for recurring workflows)
  if (checkNumber !== undefined) {
    id += `-check${checkNumber}`;
  }

  // Add timestamp for uniqueness
  if (includeTimestamp) {
    id += `-${Date.now()}`;
  }

  return id;
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
      const parts = workflowId.substring(prefix.length + 1).split("-");

      if (parts.length === 0) return null;

      // Last part might be timestamp if it's a number
      const lastPart = parts[parts.length - 1];
      const timestamp = /^\d+$/.test(lastPart)
        ? parseInt(lastPart, 10)
        : undefined;

      // Delivery ID is everything except the timestamp (if present)
      const deliveryId =
        timestamp !== undefined
          ? parts.slice(0, -1).join("-")
          : parts.join("-");

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
export function isWorkflowType(
  workflowId: string,
  type: WorkflowType,
): boolean {
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
      return "Delay Notification";
    case WorkflowType.RECURRING_CHECK:
      return "Recurring Check";
    case WorkflowType.ONE_TIME_CHECK:
      return "One-Time Check";
    case WorkflowType.MANUAL_CHECK:
      return "Manual Check";
    default:
      return "Unknown";
  }
}

/**
 * Extract check number from a recurring workflow ID
 * @param workflowId - The workflow ID (e.g., "recurring-check-3-abc123")
 * @returns Check number or null if not a recurring workflow with check number
 * @example
 * extractCheckNumber("recurring-check-3-abc123") // 3
 * extractCheckNumber("recurring-check-abc123-check3") // 3
 */
export function extractCheckNumber(workflowId: string): number | null {
  // Match pattern: recurring-check-{number}-{deliveryId}
  const match1 = workflowId.match(/recurring-check-(\d+)-/);
  if (match1) {
    return parseInt(match1[1], 10);
  }

  // Match pattern: recurring-check-{deliveryId}-check{number}
  const match2 = workflowId.match(/-check(\d+)/);
  if (match2) {
    return parseInt(match2[1], 10);
  }

  return null;
}

/**
 * Create the next workflow ID by incrementing the check number
 * @param currentWorkflowId - The current workflow ID
 * @returns Next workflow ID or null if not applicable
 * @example
 * createNextWorkflowId("recurring-check-3-abc123") // "recurring-check-4-abc123"
 */
export function createNextWorkflowId(currentWorkflowId: string): string | null {
  if (!currentWorkflowId.includes("recurring-check")) {
    return null;
  }

  const checkNum = extractCheckNumber(currentWorkflowId);
  if (checkNum === null) {
    return null;
  }

  const nextCheckNum = checkNum + 1;

  // Replace check number in workflow ID
  // Pattern: recurring-check-{number}-{deliveryId}
  const match1 = currentWorkflowId.match(/recurring-check-(\d+)-/);
  if (match1) {
    return currentWorkflowId.replace(
      `recurring-check-${checkNum}-`,
      `recurring-check-${nextCheckNum}-`,
    );
  }

  // Pattern: recurring-check-{deliveryId}-check{number}
  const match2 = currentWorkflowId.match(/-check(\d+)/);
  if (match2) {
    return currentWorkflowId.replace(
      `-check${checkNum}`,
      `-check${nextCheckNum}`,
    );
  }

  return null;
}

/**
 * Create the next run ID by incrementing the check number
 * @param currentRunId - The current run ID (e.g., "run-abc-check-3")
 * @returns Next run ID or null if not applicable
 * @example
 * createNextRunId("run-abc-check-3") // "run-abc-check-4"
 */
export function createNextRunId(currentRunId: string): string | null {
  // Match pattern: {anything}-check-{number}
  const match = currentRunId.match(/-check-(\d+)$/);
  if (!match) {
    return null;
  }

  const checkNum = parseInt(match[1], 10);
  const nextCheckNum = checkNum + 1;

  return currentRunId.replace(`-check-${checkNum}`, `-check-${nextCheckNum}`);
}
