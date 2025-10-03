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
  success_rate?: number;
}
