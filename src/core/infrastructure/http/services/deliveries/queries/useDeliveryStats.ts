/**
 * useDeliveryStats Hook
 * React Query hook for fetching delivery statistics
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../queryKeys';
import { getDeliveryStats } from './getDeliveryStats';

export function useDeliveryStats() {
  return useQuery({
    queryKey: queryKeys.deliveries.stats(),
    queryFn: () => getDeliveryStats(),
  });
}
