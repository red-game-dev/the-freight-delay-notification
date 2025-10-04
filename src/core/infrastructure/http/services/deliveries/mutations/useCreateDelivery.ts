/**
 * useCreateDelivery Hook
 * React Query mutation hook for creating deliveries
 */

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createErrorFromException,
  useErrorStore,
  useNotificationStore,
} from "@/stores";
import { queryKeys } from "../../../queryKeys";
import type { CreateDeliveryInput } from "../types";
import { createDelivery } from "./createDelivery";

export function useCreateDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDeliveryInput) => createDelivery(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.deliveries.all });
      useNotificationStore.getState().success("Delivery created successfully");
    },
    onError: (err: Error) => {
      useErrorStore
        .getState()
        .addError(createErrorFromException(err, "useCreateDelivery"));
    },
  });
}
