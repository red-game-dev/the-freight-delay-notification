/**
 * Delete Threshold Hook
 * React Query mutation hook for deleting a threshold
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../queryKeys';
import { useNotificationStore, useErrorStore, createErrorFromException } from '@/stores';
import { deleteThreshold } from './deleteThreshold';

export function useDeleteThreshold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteThreshold,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.thresholds.all });
      useNotificationStore.getState().success('Threshold deleted successfully');
    },
    onError: (err: Error) => {
      useErrorStore.getState().addError(
        createErrorFromException(err, 'useDeleteThreshold')
      );
    },
  });
}
