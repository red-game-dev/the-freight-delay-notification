/**
 * useUpdateDelivery Hook
 * React Query mutation hook for updating deliveries
 */

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createErrorFromException,
  useErrorStore,
  useNotificationStore,
} from "@/stores";
import { queryKeys } from "../../../queryKeys";
import type { UpdateDeliveryInput } from "../types";
import { updateDelivery } from "./updateDelivery";

export function useUpdateDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDeliveryInput }) =>
      updateDelivery(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.deliveries.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.deliveries.all });
      useNotificationStore.getState().success("Delivery updated successfully");
    },
    onError: (err: Error) => {
      useErrorStore
        .getState()
        .addError(createErrorFromException(err, "useUpdateDelivery"));
    },
  });
}
