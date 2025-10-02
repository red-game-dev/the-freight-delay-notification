/**
 * List Routes Hook
 * React Query hook for fetching routes list
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../queryKeys';
import { listRoutes } from './listRoutes';

export function useRoutes() {
  return useQuery({
    queryKey: queryKeys.routes.list(),
    queryFn: listRoutes,
    refetchInterval: 60000, // Refetch every 60 seconds for route updates
    refetchOnWindowFocus: true,
  });
}
