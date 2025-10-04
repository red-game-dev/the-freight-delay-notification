/**
 * Create Threshold Hook
 * React Query mutation hook for creating a threshold
 */

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createErrorFromException,
  useErrorStore,
  useNotificationStore,
} from "@/stores";
import { queryKeys } from "../../../queryKeys";
import { createThreshold } from "./createThreshold";

export function useCreateThreshold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createThreshold,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.thresholds.all });
      useNotificationStore.getState().success("Threshold created successfully");
    },
    onError: (err: Error) => {
      useErrorStore
        .getState()
        .addError(createErrorFromException(err, "useCreateThreshold"));
    },
  });
}
