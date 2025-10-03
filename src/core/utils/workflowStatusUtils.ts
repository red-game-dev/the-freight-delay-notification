/**
 * Workflow Status Utilities
 * Centralized configuration for workflow status display
 */

import type { LucideIcon } from 'lucide-react';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import type { BadgeVariant } from './statusUtils';

/**
 * Workflow status configuration
 */
export const WORKFLOW_STATUS_CONFIG = {
  running: {
    label: 'Running',
    variant: 'info' as BadgeVariant,
    icon: Clock,
    color: 'text-blue-600',
  },
  completed: {
    label: 'Completed',
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
  cancelled: {
    label: 'Cancelled',
    variant: 'default' as BadgeVariant,
    icon: XCircle,
    color: 'text-gray-600',
  },
  timed_out: {
    label: 'Timed Out',
    variant: 'warning' as BadgeVariant,
    icon: AlertCircle,
    color: 'text-yellow-600',
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
