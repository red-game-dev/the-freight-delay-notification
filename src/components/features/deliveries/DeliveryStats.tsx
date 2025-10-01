/**
 * DeliveryStats Component
 * Shows aggregated statistics about deliveries
 */

'use client';

import * as React from 'react';
import { Package, TruckIcon, Clock, CheckCircle2 } from 'lucide-react';
import { StatCard, StatGrid } from '@/components/ui/StatCard';

export function DeliveryStats() {
  // TODO: Replace with actual data from API
  const stats = {
    total: 156,
    inTransit: 42,
    delayed: 8,
    delivered: 106,
  };

  return (
    <StatGrid columns={4}>
      <StatCard
        title="Total Deliveries"
        value={stats.total}
        icon={<Package className="h-6 w-6" />}
        trend={{ value: 12, isPositive: true }}
      />
      <StatCard
        title="In Transit"
        value={stats.inTransit}
        icon={<TruckIcon className="h-6 w-6" />}
      />
      <StatCard
        title="Delayed"
        value={stats.delayed}
        icon={<Clock className="h-6 w-6" />}
        iconColor="text-orange-600"
        trend={{ value: 3, isPositive: false }}
      />
      <StatCard
        title="Delivered"
        value={stats.delivered}
        icon={<CheckCircle2 className="h-6 w-6" />}
        iconColor="text-green-600"
        trend={{ value: 8, isPositive: true }}
      />
    </StatGrid>
  );
}
