/**
 * Get Threshold Hook
 * React Query hook for fetching a single threshold
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../queryKeys';
import { getThreshold } from './getThreshold';

export function useThreshold(id: string) {
  return useQuery({
    queryKey: queryKeys.thresholds.detail(id),
    queryFn: () => getThreshold(id),
    enabled: !!id,
  });
}
