/**
 * Get Notification Hook
 * React Query hook for fetching a single notification
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../../queryKeys";
import { getNotification } from "./getNotification";

export function useNotification(id: string) {
  return useQuery({
    queryKey: queryKeys.notifications.detail(id),
    queryFn: () => getNotification(id),
    enabled: !!id,
  });
}
