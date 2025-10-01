/**
 * Get Workflow Status Hook
 * React Query hook for fetching workflow status with polling support
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../queryKeys';
import { getWorkflowStatus } from './getWorkflowStatus';

export function useWorkflowStatus(workflowId: string, options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: queryKeys.workflows.detail(workflowId),
    queryFn: () => getWorkflowStatus(workflowId),
    enabled: !!workflowId,
    refetchInterval: options?.refetchInterval,
  });
}
