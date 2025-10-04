/**
 * useWorkflowPolling Hook
 * Manages workflow status polling logic - only polls when workflow is running or just started
 */

"use client";

import { useEffect, useState } from "react";
import { useWorkflowStatus } from "./useWorkflowStatus";

interface UseWorkflowPollingOptions {
  workflowId: string | null;
  pollInterval?: number;
}

const TERMINAL_STATUSES = ["completed", "failed", "cancelled", "timed_out"];

export function useWorkflowPolling({
  workflowId,
  pollInterval = 3000,
}: UseWorkflowPollingOptions) {
  const [workflowJustStarted, setWorkflowJustStarted] = useState(false);
  const [shouldPoll, setShouldPoll] = useState(false);

  // Query workflow status with conditional polling
  const { data: workflowStatus, ...rest } = useWorkflowStatus(
    workflowId || "",
    {
      refetchInterval: shouldPoll ? pollInterval : undefined,
    },
  );

  // Update polling state based on workflow status and workflowJustStarted
  useEffect(() => {
    if (!workflowId) {
      setShouldPoll(false);
      return;
    }

    // Poll if workflow just started OR if workflow is running
    if (workflowJustStarted || workflowStatus?.status === "running") {
      setShouldPoll(true);
    } else {
      setShouldPoll(false);
    }
  }, [workflowId, workflowJustStarted, workflowStatus?.status]);

  // Determine if polling should be enabled for child components
  const shouldEnablePolling =
    workflowJustStarted ||
    (workflowStatus
      ? !TERMINAL_STATUSES.includes(workflowStatus.status)
      : false);

  // Reset workflowJustStarted flag when workflow status becomes running
  useEffect(() => {
    if (workflowJustStarted && workflowStatus?.status === "running") {
      setWorkflowJustStarted(false);
    }
  }, [workflowJustStarted, workflowStatus]);

  // Derived states
  const isWorkflowRunning = workflowStatus?.status === "running";
  const isTerminal = workflowStatus
    ? TERMINAL_STATUSES.includes(workflowStatus.status)
    : false;

  return {
    workflowStatus,
    isWorkflowRunning,
    isTerminal,
    shouldEnablePolling,
    notifyWorkflowStarted: () => setWorkflowJustStarted(true),
    resetWorkflowStarted: () => setWorkflowJustStarted(false),
    ...rest,
  };
}
