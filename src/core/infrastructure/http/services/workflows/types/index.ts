/**
 * Workflow Types
 * Type definitions for workflow-related operations
 */

export interface Workflow {
  id: string;
  workflow_id: string;
  delivery_id: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  started_at: string;
  completed_at?: string;
  error?: string;
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
