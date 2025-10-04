/**
 * Workflow Types
 * Type definitions for workflow-related operations
 */

import type { WorkflowStatus } from '@/core/types';

export interface Workflow {
  id: string;
  workflow_id: string;
  delivery_id: string;
  run_id?: string;
  status: WorkflowStatus;
  started_at: string;
  completed_at?: string;
  updated_at?: string; // Last check time - used for accurate next run calculation
  error?: string;
  steps?: {
    trafficCheck?: { completed: boolean };
    delayEvaluation?: { completed: boolean };
    messageGeneration?: { completed: boolean };
    notificationDelivery?: { completed: boolean };
  };
  created_at?: string;
  tracking_number?: string;
  settings?: {
    type: 'recurring' | 'one-time';
    check_interval_minutes?: number;
    max_checks?: number;
    checks_performed?: number;
    delay_threshold_minutes?: number;
    min_delay_change_threshold?: number;
    min_hours_between_notifications?: number;
    scheduled_delivery?: string;
    last_check_time?: string; // From delivery.updated_at - for accurate next run calculation
  };
}

export interface StartWorkflowResponse {
  workflowId: string;
}

export interface WorkflowStats {
  total: number;
  running?: number;
  completed?: number;
  failed?: number;
  cancelled?: number;
  timed_out?: number;
  success_rate?: number;
}

export interface WorkflowFilters extends Record<string, unknown> {
  page?: number;
  limit?: number;
  delivery_id?: string;
  status?: WorkflowStatus;
  statusNot?: WorkflowStatus;
}
