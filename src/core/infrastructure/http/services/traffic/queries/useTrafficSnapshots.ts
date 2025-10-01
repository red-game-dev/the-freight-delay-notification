/**
 * List Traffic Snapshots Hook
 * React Query hook for fetching traffic snapshots
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../queryKeys';
import { listTrafficSnapshots } from './listTrafficSnapshots';

export function useTrafficSnapshots() {
  return useQuery({
    queryKey: queryKeys.traffic.list(),
    queryFn: listTrafficSnapshots,
  });
}
