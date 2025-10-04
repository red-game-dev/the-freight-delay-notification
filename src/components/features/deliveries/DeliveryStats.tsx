/**
 * DeliveryStats Component
 * Shows aggregated statistics about deliveries
 */

"use client";

import { CheckCircle2, Clock, Package, TruckIcon } from "lucide-react";
import * as React from "react";
import { SkeletonStats } from "@/components/ui/Skeleton";
import { StatCard, StatGrid } from "@/components/ui/StatCard";
import { useDeliveryStats } from "@/core/infrastructure/http/services/deliveries";

export function DeliveryStats() {
  const { data: stats, isLoading } = useDeliveryStats();

  if (isLoading) {
    return <SkeletonStats count={4} />;
  }

  return (
    <StatGrid columns={4}>
      <StatCard
        title="Total Deliveries"
        value={stats?.total || 0}
        icon={<Package className="h-6 w-6" />}
      />
      <StatCard
        title="In Transit"
        value={stats?.in_transit || 0}
        icon={<TruckIcon className="h-6 w-6" />}
      />
      <StatCard
        title="Delayed"
        value={stats?.delayed || 0}
        icon={<Clock className="h-6 w-6" />}
        iconColor="text-orange-600"
      />
      <StatCard
        title="Delivered"
        value={stats?.delivered || 0}
        icon={<CheckCircle2 className="h-6 w-6" />}
        iconColor="text-green-600"
      />
    </StatGrid>
  );
}
