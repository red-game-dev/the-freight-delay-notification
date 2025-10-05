/**
 * Shared Workflow Types
 * Common type definitions for workflow-related operations
 */

/**
 * Workflow execution status
 */
export type WorkflowStatus =
  | "running"
  | "completed"
  | "failed"
  | "cancelled"
  | "timed_out";

/**
 * Workflow activity status
 */
export type WorkflowActivityStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed";

/**
 * Workflow step names in the delay notification workflow
 */
export type WorkflowStep =
  | "traffic_check"
  | "delay_evaluation"
  | "message_generation"
  | "notification_delivery"
  | "completed"
  | "failed"
  | "cancelled";
