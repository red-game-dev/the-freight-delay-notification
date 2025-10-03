/**
 * Workflows Page
 * Monitor Temporal workflow executions and status
 */

'use client';

import { ViewModeSwitcher } from '@/components/ui/ViewModeSwitcher';
import { WorkflowTimeline } from '@/components/features/workflows/WorkflowTimeline';
import { WorkflowStatus } from '@/components/features/workflows/WorkflowStatus';

export default function WorkflowsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Workflows</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Monitor Temporal workflow executions and status
          </p>
        </div>
        <ViewModeSwitcher pageKey="workflows" />
      </div>

      <WorkflowStatus />
      <WorkflowTimeline />
    </div>
  );
}
