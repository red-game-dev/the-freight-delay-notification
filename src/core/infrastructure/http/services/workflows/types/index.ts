/**
 * Workflow Types
 * Type definitions for workflow-related operations
 */

export interface Workflow {
  id: string;
  workflow_id: string;
  delivery_id: string;
  run_id?: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled' | 'timed_out';
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
