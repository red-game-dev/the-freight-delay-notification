/**
 * useCreateCustomer Hook
 * React Query mutation hook for creating customers
 */

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createErrorFromException,
  useErrorStore,
  useNotificationStore,
} from "@/stores";
import { queryKeys } from "../../../queryKeys";
import type { CreateCustomerInput } from "../types";
import { createCustomer } from "./createCustomer";

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCustomerInput) => createCustomer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
      useNotificationStore.getState().success("Customer created successfully");
    },
    onError: (err: Error) => {
      useErrorStore
        .getState()
        .addError(createErrorFromException(err, "useCreateCustomer"));
    },
  });
}
