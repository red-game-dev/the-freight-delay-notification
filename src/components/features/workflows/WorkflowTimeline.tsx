/**
 * WorkflowTimeline Component
 * Shows the execution timeline of workflows
 */

'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/Badge';
import { CompactTimeline } from '@/components/ui/Timeline';
import { CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';

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
};

export function WorkflowTimeline() {
  // TODO: Replace with actual data from API
  const executions: WorkflowExecution[] = [
    {
      id: '1',
      workflowId: 'delay-notification-FD-2024-001-1705330800000',
      deliveryId: 'FD-2024-001',
      status: 'completed',
      startedAt: '2024-01-15T10:30:00Z',
      completedAt: '2024-01-15T10:32:15Z',
      steps: {
        trafficCheck: { completed: true },
        delayEvaluation: { completed: true },
        messageGeneration: { completed: true },
        notificationDelivery: { completed: true },
      },
    },
    {
      id: '2',
      workflowId: 'delay-notification-FD-2024-002-1705244400000',
      deliveryId: 'FD-2024-002',
      status: 'running',
      startedAt: '2024-01-14T15:00:00Z',
      steps: {
        trafficCheck: { completed: true },
        delayEvaluation: { completed: true },
        messageGeneration: { completed: true },
      },
    },
    {
      id: '3',
      workflowId: 'delay-notification-FD-2024-003-1705141500000',
      deliveryId: 'FD-2024-003',
      status: 'failed',
      startedAt: '2024-01-13T09:15:00Z',
      completedAt: '2024-01-13T09:16:30Z',
      steps: {
        trafficCheck: { completed: true },
        delayEvaluation: { completed: true },
      },
    },
  ];

  const getStepStatus = (step?: { completed: boolean }) => {
    if (!step) return 'pending';
    return step.completed ? 'completed' : 'in_progress';
  };

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold">Workflow Executions</h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Recent Temporal workflow executions and their status
        </p>
      </div>

      <div className="divide-y">
        {executions.map((execution) => {
          const config = statusConfig[execution.status];
          const Icon = config.icon;
          const duration = execution.completedAt
            ? Math.round(
                (new Date(execution.completedAt).getTime() -
                  new Date(execution.startedAt).getTime()) /
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
                    <span className="font-medium">{execution.deliveryId}</span>
                    <Badge variant={config.variant}>{config.label}</Badge>
                  </div>

                  <p className="text-xs text-muted-foreground font-mono mb-3">
                    {execution.workflowId}
                  </p>

                  {/* Workflow Steps Progress */}
                  <CompactTimeline
                    className="mb-3"
                    steps={[
                      {
                        id: 'trafficCheck',
                        label: 'Traffic Check',
                        status: getStepStatus(execution.steps.trafficCheck),
                      },
                      {
                        id: 'delayEvaluation',
                        label: 'Delay Evaluation',
                        status: getStepStatus(execution.steps.delayEvaluation),
                      },
                      {
                        id: 'messageGeneration',
                        label: 'Message Generation',
                        status: getStepStatus(execution.steps.messageGeneration),
                      },
                      {
                        id: 'notificationDelivery',
                        label: 'Notification Delivery',
                        status: getStepStatus(execution.steps.notificationDelivery),
                      },
                    ]}
                  />

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Started: {new Date(execution.startedAt).toLocaleString()}</span>
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
