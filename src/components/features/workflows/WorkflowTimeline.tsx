/**
 * WorkflowTimeline Component
 * Shows the execution timeline of workflows
 * Supports multiple view modes: list, grid, and compact
 */

'use client';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { CompactTimeline } from '@/components/ui/Timeline';
import { SkeletonWorkflow } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ViewModeRenderer } from '@/components/ui/ViewModeRenderer';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { CheckCircle2, XCircle, Clock, AlertCircle, Workflow, PlayCircle } from 'lucide-react';
import { useWorkflows } from '@/core/infrastructure/http/services/workflows';
import { formatNextScheduledTime } from '@/core/utils/dateUtils';
import { isWorkflowType, WorkflowType } from '@/core/utils/workflowUtils';
import { useURLPagination } from '@/core/hooks/useURLSearchParams';
import { cn } from '@/core/base/utils/cn';
import Link from 'next/link';

const statusConfig = {
  running: { label: 'Running', variant: 'info' as const, icon: Clock },
  completed: { label: 'Completed', variant: 'success' as const, icon: CheckCircle2 },
  failed: { label: 'Failed', variant: 'error' as const, icon: XCircle },
  cancelled: { label: 'Cancelled', variant: 'warning' as const, icon: AlertCircle },
  timed_out: { label: 'Timed Out', variant: 'error' as const, icon: AlertCircle },
};

export function WorkflowTimeline() {
  const { page, setPage } = useURLPagination();
  const { data: response, isLoading } = useWorkflows({ page: page.toString(), limit: '10' });

  const workflows = response?.data || [];
  const pagination = response?.pagination;

  const getStepStatus = (step?: { completed: boolean }) => {
    if (!step) return 'pending';
    return step.completed ? 'completed' : 'in_progress';
  };

  return (
    <ViewModeRenderer
      pageKey="workflows"
      items={workflows}
      isLoading={isLoading}
      pagination={pagination ? {
        page: pagination.page,
        totalPages: pagination.totalPages,
        total: pagination.total,
        limit: 10,
      } : undefined}
      onPageChange={setPage}
      loadingComponent={<SkeletonWorkflow items={3} />}
      emptyComponent={
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="p-4 sm:p-6">
            <SectionHeader
              title="Workflow Executions"
              description="Recent Temporal workflow executions and their status"
              size="lg"
            />
          </div>
          <EmptyState
            icon={Workflow}
            title="No Workflow Executions"
            description="No workflows have been executed yet. Workflows are triggered automatically when deliveries are monitored for delays."
          />
        </div>
      }
      listHeader={
        <SectionHeader
          title="Workflow Executions"
          description="Recent Temporal workflow executions and their status"
          size="lg"
        />
      }
      renderList={(workflows) => (
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
      )}
      renderGrid={(workflows) => (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {workflows.map((execution) => {
          const config = statusConfig[execution.status];
          const Icon = config.icon;
          const isRecurring = execution.workflow_id ? isWorkflowType(execution.workflow_id, WorkflowType.RECURRING_CHECK) : false;
          const duration = execution.completed_at
            ? Math.round(
                (new Date(execution.completed_at).getTime() -
                  new Date(execution.started_at).getTime()) /
                  1000
              )
            : null;

          return (
            <Link key={execution.id} href={`/deliveries/${execution.delivery_id}`}>
              <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer h-full">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "p-2 rounded-full",
                      execution.status === 'completed' ? 'bg-green-100 dark:bg-green-900/20' :
                      execution.status === 'failed' ? 'bg-red-100 dark:bg-red-900/20' :
                      execution.status === 'running' ? 'bg-blue-100 dark:bg-blue-900/20' :
                      'bg-yellow-100 dark:bg-yellow-900/20'
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm truncate">{execution.tracking_number || execution.delivery_id.substring(0, 8)}</span>
                      {isRecurring && <span className="text-xs text-muted-foreground">Recurring</span>}
                    </div>
                  </div>
                  <Badge variant={config.variant} className="text-xs">{config.label}</Badge>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{new Date(execution.started_at).toLocaleString()}</span>
                  </div>
                  {duration !== null && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <PlayCircle className="h-3 w-3 flex-shrink-0" />
                      <span>Duration: {duration}s</span>
                    </div>
                  )}
                  {execution.settings?.checks_performed !== undefined && (
                    <div className="text-muted-foreground">
                      Progress: {execution.settings.checks_performed}/{execution.settings.max_checks === -1 ? '∞' : execution.settings.max_checks} checks
                    </div>
                  )}
                </div>
              </Card>
            </Link>
          );
        })}
        </div>
      )}
      renderCompact={(workflows) => (
        <div className="divide-y">
        {workflows.map((execution) => {
          const config = statusConfig[execution.status];
          const Icon = config.icon;
          const isRecurring = execution.workflow_id ? isWorkflowType(execution.workflow_id, WorkflowType.RECURRING_CHECK) : false;

          return (
            <Link
              key={execution.id}
              href={`/deliveries/${execution.delivery_id}`}
              className="block p-3 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={cn(
                    "p-1.5 rounded-full flex-shrink-0",
                    execution.status === 'completed' ? 'bg-green-100 dark:bg-green-900/20' :
                    execution.status === 'failed' ? 'bg-red-100 dark:bg-red-900/20' :
                    execution.status === 'running' ? 'bg-blue-100 dark:bg-blue-900/20' :
                    'bg-yellow-100 dark:bg-yellow-900/20'
                  )}>
                    <Icon className="h-3 w-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-sm truncate">{execution.tracking_number || execution.delivery_id.substring(0, 12)}</span>
                      <Badge variant={config.variant} className="text-xs flex-shrink-0">{config.label}</Badge>
                      {isRecurring && <Badge variant="default" className="text-xs flex-shrink-0">Recurring</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {execution.workflow_id}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {execution.settings?.checks_performed !== undefined && (
                    <div className="hidden sm:block text-xs text-muted-foreground">
                      {execution.settings.checks_performed}/{execution.settings.max_checks === -1 ? '∞' : execution.settings.max_checks}
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {new Date(execution.started_at).toLocaleString()}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
        </div>
      )}
    />
  );
}
