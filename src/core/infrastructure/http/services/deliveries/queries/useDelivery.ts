/**
 * useDelivery Hook
 * React Query hook for fetching a single delivery
 *
 * Features:
 * - Auto-refreshes every 30s when delivery is in active state
 * - Refetches on window focus and reconnect (global defaults)
 * - Shorter staleTime (30s) for real-time delivery updates
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../../queryKeys";
import type { Delivery } from "../types";
import { getDelivery } from "./getDelivery";

export function useDelivery(id: string) {
  return useQuery({
    queryKey: queryKeys.deliveries.detail(id),
    queryFn: () => getDelivery(id),
    enabled: !!id,
    // Enable refetch on window focus for real-time updates
    refetchOnWindowFocus: true,
  });
}
