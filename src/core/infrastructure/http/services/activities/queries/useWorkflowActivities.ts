/**
 * Get Workflow Activities Hook
 * React Query hook for fetching workflow activities
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../../queryKeys";
import { getWorkflowActivities } from "./getWorkflowActivities";

export function useWorkflowActivities(workflowId: string) {
  return useQuery({
    queryKey: queryKeys.activities.byWorkflow(workflowId),
    queryFn: () => getWorkflowActivities(workflowId),
    enabled: !!workflowId,
  });
}
