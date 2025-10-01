/**
 * WorkflowTimeline Component
 * Shows the execution timeline of workflows
 */

'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/Badge';
import { CompactTimeline } from '@/components/ui/Timeline';
import { SkeletonWorkflow } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { CheckCircle2, XCircle, Clock, AlertCircle, Workflow } from 'lucide-react';
import { useWorkflows } from '@/core/infrastructure/http/services/workflows';

interface WorkflowExecution {
  id: string;
  workflowId: string;
  deliveryId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: string;
  completedAt?: string;
  steps: {
    trafficCheck?: { completed: boolean };
    delayEvaluation?: { completed: boolean };
    messageGeneration?: { completed: boolean };
    notificationDelivery?: { completed: boolean };
  };
}

const statusConfig = {
  running: { label: 'Running', variant: 'info' as const, icon: Clock },
  completed: { label: 'Completed', variant: 'success' as const, icon: CheckCircle2 },
  failed: { label: 'Failed', variant: 'error' as const, icon: XCircle },
  cancelled: { label: 'Cancelled', variant: 'warning' as const, icon: AlertCircle },
  timed_out: { label: 'Timed Out', variant: 'error' as const, icon: AlertCircle },
};

export function WorkflowTimeline() {
  const { data: workflows, isLoading } = useWorkflows();

  const getStepStatus = (step?: { completed: boolean }) => {
    if (!step) return 'pending';
    return step.completed ? 'completed' : 'in_progress';
  };

  if (isLoading) {
    return <SkeletonWorkflow items={3} />;
  }

  if (!workflows || workflows.length === 0) {
    return (
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold">Workflow Executions</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Recent Temporal workflow executions and their status
          </p>
        </div>
        <EmptyState
          icon={Workflow}
          title="No Workflow Executions"
          description="No workflows have been executed yet. Workflows are triggered automatically when deliveries are monitored for delays."
        />
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold">Workflow Executions</h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Recent Temporal workflow executions and their status
        </p>
      </div>

      <div className="divide-y">
        {workflows.map((execution) => {
          const config = statusConfig[execution.status];
          const Icon = config.icon;

          // Handle both API type (completed_at, started_at) and fallback type (completedAt, startedAt)
          const completedAt = 'completed_at' in execution ? execution.completed_at : (execution as any).completedAt;
          const startedAt = 'started_at' in execution ? execution.started_at : (execution as any).startedAt;
          const deliveryId = 'delivery_id' in execution ? execution.delivery_id : (execution as any).deliveryId;
          const workflowId = 'workflow_id' in execution ? execution.workflow_id : (execution as any).workflowId;
          const steps = (execution as any).steps;

          const duration = completedAt
            ? Math.round(
                (new Date(completedAt).getTime() -
                  new Date(startedAt).getTime()) /
                  1000
              )
            : null;

          return (
            <div key={execution.id} className="p-4 sm:p-6 hover:bg-muted/50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className={`p-2 rounded-full ${
                    execution.status === 'completed' ? 'bg-green-100 dark:bg-green-900/20' :
                    execution.status === 'failed' ? 'bg-red-100 dark:bg-red-900/20' :
                    execution.status === 'running' ? 'bg-blue-100 dark:bg-blue-900/20' :
                    'bg-yellow-100 dark:bg-yellow-900/20'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium">{deliveryId}</span>
                    <Badge variant={config.variant}>{config.label}</Badge>
                  </div>

                  <p className="text-xs text-muted-foreground font-mono mb-3">
                    {workflowId}
                  </p>

                  {/* Workflow Steps Progress - only show if steps data is available */}
                  {steps && (
                    <CompactTimeline
                      className="mb-3"
                      steps={[
                        {
                          id: 'trafficCheck',
                          label: 'Traffic Check',
                          status: getStepStatus(steps.trafficCheck),
                        },
                        {
                          id: 'delayEvaluation',
                          label: 'Delay Evaluation',
                          status: getStepStatus(steps.delayEvaluation),
                        },
                        {
                          id: 'messageGeneration',
                          label: 'Message Generation',
                          status: getStepStatus(steps.messageGeneration),
                        },
                        {
                          id: 'notificationDelivery',
                          label: 'Notification Delivery',
                          status: getStepStatus(steps.notificationDelivery),
                        },
                      ]}
                    />
                  )}

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Started: {new Date(startedAt).toLocaleString()}</span>
                    {duration && <span>Duration: {duration}s</span>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
