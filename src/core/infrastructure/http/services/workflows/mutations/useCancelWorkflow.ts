/**
 * Cancel Workflow Hook
 * React Query mutation hook for cancelling a workflow
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../queryKeys';
import { useNotificationStore, useErrorStore, createErrorFromException } from '@/stores';
import { cancelWorkflow } from './cancelWorkflow';

export function useCancelWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelWorkflow,
    onSuccess: (_, workflowId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workflows.detail(workflowId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.workflows.all });
      useNotificationStore.getState().success('Workflow cancelled successfully');
    },
    onError: (err: Error) => {
      useErrorStore.getState().addError(
        createErrorFromException(err, 'useCancelWorkflow')
      );
    },
  });
}
