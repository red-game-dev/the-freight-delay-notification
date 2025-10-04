/**
 * Query Keys
 * Centralized query keys for React Query cache management
 *
 * @see https://tanstack.com/query/latest/docs/framework/react/guides/query-keys
 */

export const queryKeys = {
  deliveries: {
    all: ['deliveries'] as const,
    list: (filters?: Record<string, unknown>) => ['deliveries', 'list', filters] as const,
    detail: (id: string) => ['deliveries', 'detail', id] as const,
    stats: () => ['deliveries', 'stats'] as const,
  },
  workflows: {
    all: ['workflows'] as const,
    list: (filters?: Record<string, unknown>) => ['workflows', 'list', filters] as const,
    detail: (id: string) => ['workflows', 'detail', id] as const,
    stats: () => ['workflows', 'stats'] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    list: (filters?: Record<string, unknown>) => ['notifications', 'list', filters] as const,
    detail: (id: string) => ['notifications', 'detail', id] as const,
    stats: () => ['notifications', 'stats'] as const,
  },
  thresholds: {
    all: ['thresholds'] as const,
    list: () => ['thresholds', 'list'] as const,
    detail: (id: string) => ['thresholds', 'detail', id] as const,
  },
  customers: {
    all: ['customers'] as const,
    list: () => ['customers', 'list'] as const,
    detail: (id: string) => ['customers', 'detail', id] as const,
    byEmail: (email: string) => ['customers', 'email', email] as const,
  },
  activities: {
    all: ['activities'] as const,
    byWorkflow: (workflowId: string) => ['activities', 'workflow', workflowId] as const,
  },
  routes: {
    all: ['routes'] as const,
    list: () => ['routes', 'list'] as const,
  },
  traffic: {
    all: ['traffic'] as const,
    list: (filters?: Record<string, unknown>) => ['traffic', 'list', filters] as const,
  },
} as const;
