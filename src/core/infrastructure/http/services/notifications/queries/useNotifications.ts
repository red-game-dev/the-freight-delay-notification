/**
 * List Notifications Hook
 * React Query hook for fetching notifications list
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../../queryKeys";
import { listNotifications } from "./listNotifications";

export function useNotifications(filters?: Record<string, string>) {
  return useQuery({
    queryKey: queryKeys.notifications.list(filters),
    queryFn: () => listNotifications(filters),
  });
}
