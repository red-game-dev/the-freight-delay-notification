/**
 * List Traffic Snapshots Hook
 * React Query hook for fetching traffic snapshots
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../queryKeys';
import { listTrafficSnapshots } from './listTrafficSnapshots';

export function useTrafficSnapshots(filters?: Record<string, string>) {
  return useQuery({
    queryKey: queryKeys.traffic.list(filters),
    queryFn: () => listTrafficSnapshots(filters),
    refetchInterval: 30000, // Refetch every 30 seconds for live traffic updates
    refetchOnWindowFocus: true,
  });
}
