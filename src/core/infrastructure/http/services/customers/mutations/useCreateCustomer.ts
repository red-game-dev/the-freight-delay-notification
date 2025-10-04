/**
 * useCreateCustomer Hook
 * React Query mutation hook for creating customers
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../queryKeys';
import { createCustomer } from './createCustomer';
import { useNotificationStore, useErrorStore, createErrorFromException } from '@/stores';
import type { CreateCustomerInput } from '../types';

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCustomerInput) => createCustomer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
      useNotificationStore.getState().success('Customer created successfully');
    },
    onError: (err: Error) => {
      useErrorStore.getState().addError(
        createErrorFromException(err, 'useCreateCustomer')
      );
    },
  });
}
