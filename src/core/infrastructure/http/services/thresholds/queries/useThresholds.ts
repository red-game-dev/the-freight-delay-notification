/**
 * List Thresholds Hook
 * React Query hook for fetching thresholds list
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../queryKeys';
import { listThresholds } from './listThresholds';

export function useThresholds() {
  return useQuery({
    queryKey: queryKeys.thresholds.list(),
    queryFn: listThresholds,
  });
}
