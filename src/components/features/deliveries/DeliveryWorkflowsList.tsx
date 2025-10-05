/**
 * DeliveryWorkflowsList Component
 * Shows all workflows associated with a delivery
 */

"use client";

import { Loader2 } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { CountdownTimerInline } from "@/components/ui/CountdownTimer";
import { Pagination } from "@/components/ui/Pagination";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useURLPagination } from "@/core/hooks/useURLSearchParams";
import type { Workflow } from "@/core/infrastructure/http/services/workflows";
import { useWorkflows } from "@/core/infrastructure/http/services/workflows";
import { calculateNextRunTime } from "@/core/utils/dateUtils";
import { getWorkflowStatusConfig } from "@/core/utils/workflowUtils";

interface DeliveryWorkflowsListProps {
  deliveryId: string;
}

export function DeliveryWorkflowsList({
  deliveryId,
}: DeliveryWorkflowsListProps) {
  const { page: runningPage, setPage: setRunningPage } = useURLPagination(
    "runningWorkflows",
    1,
  );
  const { page: otherPage, setPage: setOtherPage } = useURLPagination(
    "workflows",
    1,
  );

  const {
    data: runningResponse,
    isLoading: runningLoading,
    error: runningError,
    refetch: refetchRunning,
  } = useWorkflows({
    delivery_id: deliveryId,
    status: "running",
    page: runningPage,
    limit: 10,
  });

  const {
    data: otherResponse,
    isLoading: otherLoading,
    error: otherError,
    refetch: refetchOther,
  } = useWorkflows({
    delivery_id: deliveryId,
    statusNot: "running",
    page: otherPage,
    limit: 10,
  });

  // Callback to refresh both workflows lists
  const handleCountdownComplete = () => {
    refetchRunning();
    refetchOther();
  };

  const runningWorkflows = runningResponse?.data || [];
  const otherWorkflows = otherResponse?.data || [];
  const isLoading = runningLoading || otherLoading;
  const error = runningError || otherError;
  const hasNoWorkflows =
    !isLoading && runningWorkflows.length === 0 && otherWorkflows.length === 0;

  if (isLoading) {
    return (
      <Card>
        <div className="p-6">
          <SectionHeader title="Workflows" className="mb-4" />
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="p-6">
          <SectionHeader title="Workflows" className="mb-4" />
          <Alert variant="error">
            Failed to load workflows.{" "}
            {error instanceof Error ? error.message : "Please try again."}
          </Alert>
        </div>
      </Card>
    );
  }

  const renderWorkflow = (workflow: Workflow) => {
    const statusInfo = getWorkflowStatusConfig(workflow.status);
    const StatusIcon = statusInfo.icon;
    const isRecurringRunning =
      workflow.settings?.type === "recurring" && workflow.status === "running";

    // Calculate next run time for running recurring workflows
    const nextRunTime =
      isRecurringRunning && workflow.settings?.check_interval_minutes
        ? calculateNextRunTime(
            workflow.started_at,
            workflow.settings.check_interval_minutes,
            workflow.settings.checks_performed || 0,
            workflow.settings.last_check_time,
          )
        : null;

    return (
      <div
        key={workflow.id}
        className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors overflow-hidden"
      >
        <div className="flex items-start gap-4 flex-col sm:flex-row sm:justify-between">
          <div className="flex-1 min-w-0 w-full overflow-hidden">
            <div className="flex items-center gap-2 mb-1 overflow-hidden">
              <StatusIcon className="h-4 w-4 flex-shrink-0" />
              <p className="font-mono text-sm truncate min-w-0 flex-1">
                {workflow.workflow_id}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
              <span>
                Started {new Date(workflow.started_at).toLocaleString()}
              </span>
              {workflow.completed_at && (
                <>
                  <span>•</span>
                  <span>
                    Ended {new Date(workflow.completed_at).toLocaleString()}
                  </span>
                </>
              )}
            </div>
            {workflow.settings && (
              <div className="mt-2 text-xs">
                {workflow.settings.type === "recurring" && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-muted-foreground">
                      Recurring: {workflow.settings.checks_performed || 0}/
                      {workflow.settings.max_checks === -1
                        ? "∞"
                        : workflow.settings.max_checks}{" "}
                      checks
                      {workflow.settings.check_interval_minutes &&
                        ` • Every ${workflow.settings.check_interval_minutes}min`}
                    </span>
                    {nextRunTime && (
                      <>
                        <span className="text-muted-foreground">•</span>
                        <CountdownTimerInline
                          targetTime={nextRunTime}
                          prefix="Next check"
                          size="xs"
                          showIcon={true}
                          onComplete={handleCountdownComplete}
                        />
                      </>
                    )}
                  </div>
                )}
                {workflow.settings.type === "one-time" && (
                  <span className="text-muted-foreground">One-time check</span>
                )}
              </div>
            )}
            {workflow.error && (
              <div className="mt-2">
                <Alert variant="error" className="text-xs">
                  {workflow.error}
                </Alert>
              </div>
            )}
          </div>
          <Badge
            variant={statusInfo.variant}
            className="flex-shrink-0 sm:self-start"
          >
            {statusInfo.label}
          </Badge>
        </div>
      </div>
    );
  };

  if (hasNoWorkflows) {
    return (
      <Card>
        <div className="p-6">
          <SectionHeader title="Workflows" className="mb-4" />
          <div className="text-center py-8 text-muted-foreground">
            <p>No workflows found for this delivery.</p>
            <p className="text-sm mt-1">
              Click "Check Traffic & Notify" to start a workflow.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Workflows Section */}
      {runningWorkflows.length > 0 && (
        <Card>
          <div className="p-6">
            <SectionHeader
              title="Active Workflows"
              description={`Currently running${runningResponse?.pagination ? ` (${runningResponse.pagination.total})` : ""}`}
              className="mb-4"
            />
            <div className="space-y-3">
              {runningWorkflows.map(renderWorkflow)}
            </div>
            {/* Pagination for running workflows */}
            {runningResponse?.pagination &&
              runningResponse.pagination.totalPages > 1 && (
                <div className="mt-4">
                  <Pagination
                    currentPage={runningResponse.pagination.page}
                    totalPages={runningResponse.pagination.totalPages}
                    totalItems={runningResponse.pagination.total}
                    itemsPerPage={runningResponse.pagination.limit}
                    onPageChange={setRunningPage}
                    showItemsInfo={true}
                  />
                </div>
              )}
          </div>
        </Card>
      )}

      {/* Completed & Historical Workflows Section */}
      {otherWorkflows.length > 0 && (
        <Card>
          <div className="p-6">
            <SectionHeader
              title="Completed & Historical Workflows"
              description={`All non-running${otherResponse?.pagination ? ` (${otherResponse.pagination.total})` : ""}`}
              className="mb-4"
            />
            <div className="space-y-3">
              {otherWorkflows.map(renderWorkflow)}
            </div>
            {/* Pagination for other workflows */}
            {otherResponse?.pagination &&
              otherResponse.pagination.totalPages > 1 && (
                <div className="mt-4">
                  <Pagination
                    currentPage={otherResponse.pagination.page}
                    totalPages={otherResponse.pagination.totalPages}
                    totalItems={otherResponse.pagination.total}
                    itemsPerPage={otherResponse.pagination.limit}
                    onPageChange={setOtherPage}
                    showItemsInfo={true}
                  />
                </div>
              )}
          </div>
        </Card>
      )}
    </div>
  );
}
