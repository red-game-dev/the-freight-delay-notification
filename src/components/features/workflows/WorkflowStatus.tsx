/**
 * WorkflowStatus Component
 * Shows aggregated statistics about workflow executions
 */

'use client';

import * as React from 'react';
import { PlayCircle, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { StatCard, StatGrid } from '@/components/ui/StatCard';
import { SkeletonStats } from '@/components/ui/Skeleton';
import { useWorkflowStats } from '@/core/infrastructure/http/services/workflows';

export function WorkflowStatus() {
  const { data: stats, isLoading } = useWorkflowStats();

  if (isLoading) {
    return <SkeletonStats count={4} />;
  }

  return (
    <StatGrid columns={4}>
      <StatCard
        title="Total Workflows"
        value={stats?.total ?? 0}
        icon={<PlayCircle className="h-6 w-6" />}
      />
      <StatCard
        title="Running"
        value={stats?.running ?? 0}
        icon={<Clock className="h-6 w-6" />}
        iconColor="text-blue-600"
      />
      <StatCard
        title="Completed"
        value={stats?.completed ?? 0}
        icon={<CheckCircle2 className="h-6 w-6" />}
        iconColor="text-green-600"
      />
      <StatCard
        title="Failed"
        value={stats?.failed ?? 0}
        icon={<XCircle className="h-6 w-6" />}
        iconColor="text-red-600"
      />
    </StatGrid>
  );
}
