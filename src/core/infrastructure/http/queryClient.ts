/**
 * React Query Client Configuration
 * Centralized configuration for data fetching and caching
 *
 * These defaults apply to all queries unless overridden per-query.
 * For real-time data (workflows, deliveries), individual hooks may use
 * shorter staleTime and smart refetchInterval logic.
 *
 * @see https://tanstack.com/query/latest/docs/framework/react/reference/QueryClient
 */

import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Caching and staleness
      staleTime: 1000 * 60 * 5, // 5 minutes (individual queries may override)
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)

      // Retry behavior
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Automatic refetching
      refetchOnMount: true, // Refetch when component mounts (if data is stale)
      refetchOnWindowFocus: false, // Disabled globally (individual hooks override for real-time data)
      refetchOnReconnect: true, // Refetch when internet reconnects

      // Network mode
      networkMode: "online", // Only run queries when online
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
      networkMode: "online",
    },
  },
});
