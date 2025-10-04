/**
 * List Workflows Hook
 * React Query hook for fetching workflows list
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../queryKeys';
import { listWorkflows } from './listWorkflows';
import type { WorkflowFilters } from '../types';

export function useWorkflows(filters?: WorkflowFilters) {
  return useQuery({
    queryKey: queryKeys.workflows.list(filters),
    queryFn: () => listWorkflows(filters),
  });
}
