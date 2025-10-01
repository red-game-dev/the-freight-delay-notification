/**
 * Start Workflow Hook
 * React Query mutation hook for starting a workflow
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../queryKeys';
import { useNotificationStore, useErrorStore, createErrorFromException } from '@/stores';
import { startWorkflow } from './startWorkflow';

export function useStartWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: startWorkflow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workflows.all });
      useNotificationStore.getState().success('Workflow started successfully');
    },
    onError: (err: Error) => {
      useErrorStore.getState().addError(
        createErrorFromException(err, 'useStartWorkflow')
      );
    },
  });
}
