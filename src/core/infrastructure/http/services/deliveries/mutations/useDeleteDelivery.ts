/**
 * useDeleteDelivery Hook
 * React Query mutation hook for deleting deliveries
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../queryKeys';
import { deleteDelivery } from './deleteDelivery';
import { useNotificationStore, useErrorStore, createErrorFromException } from '@/stores';

export function useDeleteDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteDelivery(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.deliveries.all });
      useNotificationStore.getState().success('Delivery deleted successfully');
    },
    onError: (err: Error) => {
      useErrorStore.getState().addError(
        createErrorFromException(err, 'useDeleteDelivery')
      );
    },
  });
}
