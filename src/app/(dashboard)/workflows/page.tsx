/**
 * Workflows Page
 * Monitor Temporal workflow executions and status
 */

"use client";

import { WorkflowStatus } from "@/components/features/workflows/WorkflowStatus";
import { WorkflowTimeline } from "@/components/features/workflows/WorkflowTimeline";
import { ViewModeSwitcher } from "@/components/ui/ViewModeSwitcher";

export default function WorkflowsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Workflows
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Monitor Temporal workflow executions and status
          </p>
        </div>
        <div className="flex-shrink-0">
          <ViewModeSwitcher pageKey="workflows" />
        </div>
      </div>

      <WorkflowStatus />
      <WorkflowTimeline />
    </div>
  );
}
