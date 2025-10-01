/**
 * List Workflows Hook
 * React Query hook for fetching workflows list
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../queryKeys';
import { listWorkflows } from './listWorkflows';

export function useWorkflows(filters?: Record<string, string>) {
  return useQuery({
    queryKey: queryKeys.workflows.list(filters),
    queryFn: () => listWorkflows(filters),
  });
}
