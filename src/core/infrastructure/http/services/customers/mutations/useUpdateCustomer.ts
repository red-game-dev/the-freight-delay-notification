/**
 * useUpdateCustomer Hook
 * React Query mutation hook for updating customers
 */

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createErrorFromException,
  useErrorStore,
  useNotificationStore,
} from "@/stores";
import { queryKeys } from "../../../queryKeys";
import type { UpdateCustomerInput } from "../types";
import { updateCustomer } from "./updateCustomer";

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCustomerInput }) =>
      updateCustomer(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.customers.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
      useNotificationStore.getState().success("Customer updated successfully");
    },
    onError: (err: Error) => {
      useErrorStore
        .getState()
        .addError(createErrorFromException(err, "useUpdateCustomer"));
    },
  });
}
