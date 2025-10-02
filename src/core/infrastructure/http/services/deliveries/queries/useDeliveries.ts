/**
 * useDeliveries Hook
 * React Query hook for listing deliveries
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../queryKeys';
import { listDeliveries } from './listDeliveries';
import type { Delivery } from '../types';

export function useDeliveries(filters?: Record<string, string>) {
  return useQuery({
    queryKey: queryKeys.deliveries.list(filters),
    queryFn: () => listDeliveries(filters),
    // Auto-refresh every 30 seconds if there are active deliveries (not delivered/cancelled)
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data || data.length === 0) return false;

      // Check if any delivery is active (not in terminal state)
      const hasActiveDeliveries = data.some(
        (delivery: Delivery) => !['delivered', 'cancelled'].includes(delivery.status)
      );

      return hasActiveDeliveries ? 30000 : false; // 30 seconds if active, no refresh if all terminal
    },
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });
}
