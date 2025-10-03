/**
 * DeliveryWorkflowsList Component
 * Shows all workflows associated with a delivery
 */

'use client';

import * as React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Loader2, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useWorkflows } from '@/core/infrastructure/http/services/workflows';
import type { Workflow } from '@/core/infrastructure/http/services/workflows';

interface DeliveryWorkflowsListProps {
  deliveryId: string;
}

const statusConfig = {
  running: { label: 'Running', variant: 'info' as const, icon: Clock },
  completed: { label: 'Completed', variant: 'success' as const, icon: CheckCircle },
  failed: { label: 'Failed', variant: 'error' as const, icon: XCircle },
  cancelled: { label: 'Cancelled', variant: 'default' as const, icon: XCircle },
  timed_out: { label: 'Timed Out', variant: 'warning' as const, icon: AlertCircle },
};

export function DeliveryWorkflowsList({ deliveryId }: DeliveryWorkflowsListProps) {
  const { data, isLoading, error } = useWorkflows({ delivery_id: deliveryId });

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
            Failed to load workflows. {error instanceof Error ? error.message : 'Please try again.'}
          </Alert>
        </div>
      </Card>
    );
  }

  const workflows = data?.data || [];

  return (
    <Card>
      <div className="p-6">
        <SectionHeader
          title="Workflows"
          subtitle={`${workflows.length} workflow${workflows.length !== 1 ? 's' : ''} found`}
          className="mb-4"
        />

        {workflows.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No workflows found for this delivery.</p>
            <p className="text-sm mt-1">Click "Check Traffic & Notify" to start a workflow.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {workflows.map((workflow) => {
              const statusInfo = statusConfig[workflow.status];
              const StatusIcon = statusInfo.icon;

              return (
                <div
                  key={workflow.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <StatusIcon className="h-4 w-4 flex-shrink-0" />
                        <p className="font-mono text-sm truncate">{workflow.workflow_id}</p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Started {new Date(workflow.started_at).toLocaleString()}</span>
                        {workflow.completed_at && (
                          <>
                            <span>•</span>
                            <span>Ended {new Date(workflow.completed_at).toLocaleString()}</span>
                          </>
                        )}
                      </div>
                      {workflow.settings && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          {workflow.settings.type === 'recurring' && (
                            <span>
                              Recurring: {workflow.settings.checks_performed || 0}/{workflow.settings.max_checks || '∞'} checks
                              {workflow.settings.check_interval_minutes && ` • Every ${workflow.settings.check_interval_minutes}min`}
                            </span>
                          )}
                          {workflow.settings.type === 'one-time' && <span>One-time check</span>}
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
                    <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
