/**
 * Get Workflow Stats Hook
 * React Query hook for fetching workflow statistics
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../queryKeys';
import { getWorkflowStats } from './getWorkflowStats';

export function useWorkflowStats() {
  return useQuery({
    queryKey: queryKeys.workflows.stats(),
    queryFn: getWorkflowStats,
  });
}
