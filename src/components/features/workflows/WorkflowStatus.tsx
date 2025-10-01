/**
 * WorkflowStatus Component
 * Shows aggregated statistics about workflow executions
 */

'use client';

import * as React from 'react';
import { PlayCircle, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { StatCard, StatGrid } from '@/components/ui/StatCard';

export function WorkflowStatus() {
  // TODO: Replace with actual data from API
  const stats = {
    total: 89,
    running: 5,
    completed: 78,
    failed: 6,
  };

  return (
    <StatGrid columns={4}>
      <StatCard
        title="Total Workflows"
        value={stats.total}
        icon={<PlayCircle className="h-6 w-6" />}
      />
      <StatCard
        title="Running"
        value={stats.running}
        icon={<Clock className="h-6 w-6" />}
        iconColor="text-blue-600"
      />
      <StatCard
        title="Completed"
        value={stats.completed}
        icon={<CheckCircle2 className="h-6 w-6" />}
        iconColor="text-green-600"
      />
      <StatCard
        title="Failed"
        value={stats.failed}
        icon={<XCircle className="h-6 w-6" />}
        iconColor="text-red-600"
      />
    </StatGrid>
  );
}
