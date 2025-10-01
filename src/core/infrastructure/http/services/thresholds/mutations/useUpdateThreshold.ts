/**
 * Update Threshold Hook
 * React Query mutation hook for updating a threshold
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../queryKeys';
import { useNotificationStore, useErrorStore, createErrorFromException } from '@/stores';
import { updateThreshold } from './updateThreshold';

export function useUpdateThreshold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateThreshold(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.thresholds.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.thresholds.all });
      useNotificationStore.getState().success('Threshold updated successfully');
    },
    onError: (err: Error) => {
      useErrorStore.getState().addError(
        createErrorFromException(err, 'useUpdateThreshold')
      );
    },
  });
}
