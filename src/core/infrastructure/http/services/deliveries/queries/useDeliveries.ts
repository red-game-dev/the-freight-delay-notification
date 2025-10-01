/**
 * useDeliveries Hook
 * React Query hook for listing deliveries
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../queryKeys';
import { listDeliveries } from './listDeliveries';

export function useDeliveries(filters?: Record<string, string>) {
  return useQuery({
    queryKey: queryKeys.deliveries.list(filters),
    queryFn: () => listDeliveries(filters),
  });
}
