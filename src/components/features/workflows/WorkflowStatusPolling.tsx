/**
 * WorkflowStatusPolling Component
 * Real-time polling for workflow status updates
 */

'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { CompactTimeline } from '@/components/ui/Timeline';
import { CheckCircle2, Clock, XCircle, Loader2 } from 'lucide-react';
import { useWorkflowStatus } from '@/core/infrastructure/http/services/workflows';
import { useWorkflowActivities } from '@/core/infrastructure/http/services/activities';

interface WorkflowStatusPollingProps {
  workflowId: string;
  /** Enable polling (default: true) */
  enabled?: boolean;
  /** Poll interval in ms (default: 2000ms / 2 seconds) */
  pollInterval?: number;
  /** Show activities timeline */
  showActivities?: boolean;
}

const statusConfig = {
  running: {
    label: 'Running',
    variant: 'info' as const,
    icon: Loader2,
    description: 'Workflow is currently executing',
  },
  completed: {
    label: 'Completed',
    variant: 'success' as const,
    icon: CheckCircle2,
    description: 'Workflow completed successfully',
  },
  failed: {
    label: 'Failed',
    variant: 'error' as const,
    icon: XCircle,
    description: 'Workflow execution failed',
  },
  cancelled: {
    label: 'Cancelled',
    variant: 'warning' as const,
    icon: XCircle,
    description: 'Workflow was cancelled',
  },
  timed_out: {
    label: 'Timed Out',
    variant: 'error' as const,
    icon: Clock,
    description: 'Workflow exceeded time limit',
  },
};

export const WorkflowStatusPolling: React.FC<WorkflowStatusPollingProps> = ({
  workflowId,
  enabled = true,
  pollInterval = 2000,
  showActivities = true,
}) => {
  // Determine if workflow is in a terminal state (completed, failed, cancelled, timed_out)
  // We'll update this after fetching workflow data
  const [isTerminal, setIsTerminal] = React.useState(false);

  // Poll workflow status - stop polling when workflow reaches terminal state
  const {
    data: workflow,
    isLoading,
    error,
  } = useWorkflowStatus(workflowId, {
    refetchInterval: enabled && !isTerminal ? pollInterval : undefined,
  });

  // Update terminal state when workflow data changes
  React.useEffect(() => {
    if (workflow) {
      const terminalStates = ['completed', 'failed', 'cancelled', 'timed_out'];
      setIsTerminal(terminalStates.includes(workflow.status));
    }
  }, [workflow]);

  // Fetch activities
  const { data: activities } = useWorkflowActivities(workflowId);

  if (!enabled || !workflowId) {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <h3 className="text-lg font-semibold">Loading workflow status...</h3>
          </div>
        </div>
      </Card>
    );
  }

  // Handle case where workflow doesn't exist yet (404 or no data)
  if (error || !workflow) {
    // Check if it's a 404 error (workflow doesn't exist yet)
    const errorMessage = error instanceof Error ? error.message : '';
    const isNotFound = errorMessage.includes('404') || errorMessage.includes('not found') || !workflow;

    if (isNotFound) {
      return (
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Workflow History</h2>
            <Alert variant="info">
              No workflow has been started for this delivery yet. Click "Check Traffic & Notify" to start monitoring for delays.
            </Alert>
          </div>
        </Card>
      );
    }

    // For other errors, show error message
    return (
      <Alert variant="error">
        Failed to load workflow status. {errorMessage || 'Please try again.'}
      </Alert>
    );
  }

  const config = statusConfig[workflow.status];
  const Icon = config.icon;

  return (
    <Card>
      <div className="p-6">
        {/* Workflow Status Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Icon
                className={`h-5 w-5 ${workflow.status === 'running' ? 'animate-spin' : ''}`}
              />
              <h3 className="text-lg font-semibold">Workflow Status</h3>
              <Badge variant={config.variant}>{config.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{config.description}</p>
          </div>
        </div>

        {/* Workflow Details */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-muted-foreground">Workflow ID</p>
            <p className="text-sm font-mono">{workflow.workflow_id}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Started At</p>
            <p className="text-sm">{new Date(workflow.started_at).toLocaleString()}</p>
          </div>
          {workflow.completed_at && (
            <div>
              <p className="text-sm text-muted-foreground">Completed At</p>
              <p className="text-sm">{new Date(workflow.completed_at).toLocaleString()}</p>
            </div>
          )}
          {workflow.completed_at && (
            <div>
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="text-sm">
                {Math.round(
                  (new Date(workflow.completed_at).getTime() -
                    new Date(workflow.started_at).getTime()) /
                    1000
                )}{' '}
                seconds
              </p>
            </div>
          )}
        </div>

        {/* Error/Info Message */}
        {workflow.error && (
          <Alert
            variant={workflow.status === 'cancelled' ? 'warning' : 'error'}
            title={workflow.status === 'cancelled' ? 'Workflow Stopped' : 'Workflow Error'}
            className="mb-6"
            details={
              workflow.status === 'cancelled' ? (
                <div>
                  <p className="font-medium mb-1">Reason:</p>
                  <p className="text-sm opacity-90">{workflow.error}</p>
                </div>
              ) : workflow.error.includes('Workflow code was updated') ? (
                <div>
                  <p className="font-medium mb-2">Error Details:</p>
                  <p className="text-sm opacity-90 mb-3">{workflow.error}</p>
                  <p className="font-medium mb-2">Action Required:</p>
                  <ol className="space-y-1 list-decimal list-inside ml-1 text-sm">
                    <li>Click <strong>"Stop Recurring Checks"</strong> and enable <strong>"Force Cancel"</strong></li>
                    <li>Then restart by clicking <strong>"Check Traffic & Notify"</strong></li>
                  </ol>
                </div>
              ) : (
                <div>
                  <p className="font-medium mb-1">Error Details:</p>
                  <p className="text-sm opacity-90">{workflow.error}</p>
                </div>
              )
            }
            defaultExpanded={workflow.error.includes('Workflow code was updated')}
          >
            {workflow.status === 'cancelled' ? (
              <>To resume monitoring, click the <strong>"Check Traffic & Notify"</strong> button above to start a new workflow.</>
            ) : (
              <>The workflow encountered an error and could not complete. Check the details below for more information.</>
            )}
          </Alert>
        )}

        {/* Real-time indicator */}
        {workflow.status === 'running' && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            <span>Live updates enabled</span>
          </div>
        )}

        {/* Activities Timeline */}
        {showActivities && activities && activities.length > 0 && (
          <div className="border-t pt-6">
            <h4 className="text-md font-semibold mb-4">Activity Timeline</h4>
            <CompactTimeline
              steps={activities.map((activity) => ({
                id: activity.id || activity.activity_type,
                label: getActivityTitle(activity.activity_type),
                status: activity.status === 'completed' ? 'completed' :
                        activity.status === 'running' ? 'in_progress' : 'pending',
              }))}
            />
          </div>
        )}
      </div>
    </Card>
  );
};

function getActivityTitle(activityType: string): string {
  const titles: Record<string, string> = {
    traffic_check: 'Traffic Check',
    delay_evaluation: 'Delay Evaluation',
    message_generation: 'Message Generation',
    notification_delivery: 'Notification Delivery',
  };
  return titles[activityType] || activityType;
}
