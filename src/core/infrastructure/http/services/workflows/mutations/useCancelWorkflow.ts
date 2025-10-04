/**
 * Cancel Workflow Hook
 * React Query mutation hook for cancelling a workflow
 */

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createErrorFromException,
  useErrorStore,
  useNotificationStore,
} from "@/stores";
import { queryKeys } from "../../../queryKeys";
import { cancelWorkflow } from "./cancelWorkflow";

export function useCancelWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelWorkflow,
    onSuccess: (_, input) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.workflows.detail(input.workflowId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.workflows.all });
      const message = input.force
        ? "Workflow terminated successfully"
        : "Workflow cancelled successfully";
      useNotificationStore.getState().success(message);
    },
    onError: (err: Error) => {
      useErrorStore
        .getState()
        .addError(createErrorFromException(err, "useCancelWorkflow"));
    },
  });
}
