/**
 * useDelivery Hook
 * React Query hook for fetching a single delivery
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../../queryKeys";
import { getDelivery } from "./getDelivery";

export function useDelivery(id: string) {
  return useQuery({
    queryKey: queryKeys.deliveries.detail(id),
    queryFn: () => getDelivery(id),
    enabled: !!id,
  });
}
