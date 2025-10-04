/**
 * useUpdateCustomer Hook
 * React Query mutation hook for updating customers
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../queryKeys';
import { updateCustomer } from './updateCustomer';
import { useNotificationStore, useErrorStore, createErrorFromException } from '@/stores';
import type { UpdateCustomerInput } from '../types';

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCustomerInput }) =>
      updateCustomer(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
      useNotificationStore.getState().success('Customer updated successfully');
    },
    onError: (err: Error) => {
      useErrorStore.getState().addError(
        createErrorFromException(err, 'useUpdateCustomer')
      );
    },
  });
}
