/**
 * useCustomer Hook
 * React Query hook for fetching a single customer
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../../queryKeys";
import { getCustomer } from "./getCustomer";

export function useCustomer(id: string | null) {
  return useQuery({
    queryKey: queryKeys.customers.detail(id || ""),
    queryFn: () => getCustomer(id!),
    enabled: !!id,
  });
}
