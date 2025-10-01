/**
 * Get Workflow Hook
 * React Query hook for fetching a single workflow
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../queryKeys';
import { getWorkflow } from './getWorkflow';

export function useWorkflow(id: string) {
  return useQuery({
    queryKey: queryKeys.workflows.detail(id),
    queryFn: () => getWorkflow(id),
    enabled: !!id,
  });
}
