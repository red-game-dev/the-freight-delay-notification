/**
 * Get Notification Stats Hook
 * React Query hook for fetching notification statistics
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../queryKeys';
import { getNotificationStats } from './getNotificationStats';

export function useNotificationStats() {
  return useQuery({
    queryKey: queryKeys.notifications.stats(),
    queryFn: getNotificationStats,
  });
}
