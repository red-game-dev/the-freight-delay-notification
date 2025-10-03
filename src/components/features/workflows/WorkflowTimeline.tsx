/**
 * WorkflowTimeline Component
 * Shows the execution timeline of workflows
 */

'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { CompactTimeline } from '@/components/ui/Timeline';
import { SkeletonWorkflow } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { CheckCircle2, XCircle, Clock, AlertCircle, Workflow } from 'lucide-react';
import { useWorkflows } from '@/core/infrastructure/http/services/workflows';
import { formatNextScheduledTime } from '@/core/utils/dateUtils';
import { isWorkflowType, WorkflowType } from '@/core/utils/workflowUtils';
import Link from 'next/link';

const statusConfig = {
  running: { label: 'Running', variant: 'info' as const, icon: Clock },
  completed: { label: 'Completed', variant: 'success' as const, icon: CheckCircle2 },
  failed: { label: 'Failed', variant: 'error' as const, icon: XCircle },
  cancelled: { label: 'Cancelled', variant: 'warning' as const, icon: AlertCircle },
  timed_out: { label: 'Timed Out', variant: 'error' as const, icon: AlertCircle },
};

export function WorkflowTimeline() {
  const [currentPage, setCurrentPage] = useState(1);
  const { data: response, isLoading } = useWorkflows({ page: currentPage.toString(), limit: '10' });

  const workflows = response?.data || [];
  const pagination = response?.pagination;

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

          const completedAt = execution.completed_at;
          const startedAt = execution.started_at;
          const deliveryId = execution.delivery_id;
          const workflowId = execution.workflow_id;
          const steps = execution.steps;

          const duration = completedAt
            ? Math.round(
                (new Date(completedAt).getTime() -
                  new Date(startedAt).getTime()) /
                  1000
              )
            : null;

          const isRecurring = workflowId ? isWorkflowType(workflowId, WorkflowType.RECURRING_CHECK) : false;
          const trackingNumber = execution.tracking_number;
          const settings = execution.settings;

          // Calculate next run time for recurring workflows
          const nextRun = isRecurring && execution.status === 'running' && settings?.check_interval_minutes
            ? formatNextScheduledTime(startedAt, settings.check_interval_minutes, settings.checks_performed || 0)
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
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Link
                      href={`/deliveries/${deliveryId}`}
                      className="font-medium hover:underline"
                    >
                      {trackingNumber || deliveryId}
                    </Link>
                    <Badge variant={config.variant}>{config.label}</Badge>
                    {isRecurring && (
                      <Badge variant="default">Recurring</Badge>
                    )}
                    {nextRun && (
                      <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-medium">
                        <Clock className="h-3 w-3" />
                        <span>Next check {nextRun}</span>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground font-mono mb-3 break-all">
                    {workflowId}
                  </p>

                  {/* Workflow Info Grid */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3 text-xs">
                    <div>
                      <span className="text-muted-foreground">Started:</span>
                      <span className="ml-2 font-medium">
                        {new Date(startedAt).toLocaleString()}
                      </span>
                    </div>
                    {completedAt && (
                      <div>
                        <span className="text-muted-foreground">Completed:</span>
                        <span className="ml-2 font-medium">
                          {new Date(completedAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="ml-2 font-medium">
                        {duration !== null ? `${duration}s` : 'In progress'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Type:</span>
                      <span className="ml-2 font-medium">
                        {isRecurring ? 'Recurring Check' : 'One-time Check'}
                      </span>
                    </div>

                    {/* Additional settings if available */}
                    {settings && isRecurring && (
                      <>
                        <div>
                          <span className="text-muted-foreground">Check Interval:</span>
                          <span className="ml-2 font-medium">
                            Every {settings.check_interval_minutes} min
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Progress:</span>
                          <span className="ml-2 font-medium">
                            {settings.checks_performed || 0}/{settings.max_checks === -1 ? '∞' : settings.max_checks} checks
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Delay Threshold:</span>
                          <span className="ml-2 font-medium">
                            {settings.delay_threshold_minutes} min
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Notification Cooldown:</span>
                          <span className="ml-2 font-medium">
                            {settings.min_hours_between_notifications}h / {settings.min_delay_change_threshold}min change
                          </span>
                        </div>
                      </>
                    )}
                  </div>

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

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3">
                    <Link
                      href={`/deliveries/${deliveryId}`}
                      className="text-xs text-primary hover:underline"
                    >
                      View Delivery →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="p-4 sm:p-6 border-t">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            itemsPerPage={10}
            onPageChange={setCurrentPage}
            showItemsInfo
          />
        </div>
      )}
    </div>
  );
}
