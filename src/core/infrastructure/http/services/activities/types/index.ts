/**
 * Activity Types
 * Type definitions for workflow activity operations
 */

import type { WorkflowActivityStatus } from "@/core/types";

export interface WorkflowActivity {
  id: string;
  workflow_id: string;
  activity_type:
    | "traffic_check"
    | "delay_evaluation"
    | "message_generation"
    | "notification_delivery";
  status: WorkflowActivityStatus;
  started_at?: string;
  completed_at?: string;
  result?: unknown;
  error?: string;
}
