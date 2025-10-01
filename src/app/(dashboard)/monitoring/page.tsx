/**
 * Monitoring Page
 * Real-time traffic monitoring and delay detection
 */

'use client';

import { Alert } from '@/components/ui/Alert';
import { StatCard, StatGrid } from '@/components/ui/StatCard';
import { List, ListItem } from '@/components/ui/List';
import { Badge } from '@/components/ui/Badge';
import { SkeletonStats, SkeletonList } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { MapPin, Activity, AlertTriangle, Clock, Map } from 'lucide-react';
import { useRoutes } from '@/core/infrastructure/http/services/routes';
import { useTrafficSnapshots } from '@/core/infrastructure/http/services/traffic';

const trafficConfig = {
  light: { label: 'Light', variant: 'success' as const, color: 'text-green-600' },
  moderate: { label: 'Moderate', variant: 'warning' as const, color: 'text-yellow-600' },
  heavy: { label: 'Heavy', variant: 'error' as const, color: 'text-orange-600' },
  severe: { label: 'Severe', variant: 'error' as const, color: 'text-red-600' },
};

export default function MonitoringPage() {
  const { data: routes, isLoading: routesLoading } = useRoutes();
  const { data: trafficSnapshots, isLoading: trafficLoading } = useTrafficSnapshots();

  // Calculate stats
  const stats = {
    totalRoutes: routes?.length || 0,
    activeMonitoring: trafficSnapshots?.length || 0,
    delayedRoutes: trafficSnapshots?.filter(t => t.delay_minutes > 15).length || 0,
    avgDelay: trafficSnapshots?.length
      ? Math.round(trafficSnapshots.reduce((acc, t) => acc + t.delay_minutes, 0) / trafficSnapshots.length)
      : 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Route Monitoring</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Real-time traffic monitoring and delay detection
        </p>
      </div>

      {/* Stats */}
      {trafficLoading ? (
        <SkeletonStats count={4} />
      ) : (
        <StatGrid columns={4}>
          <StatCard
            title="Total Routes"
            value={stats.totalRoutes}
            icon={<MapPin className="h-6 w-6" />}
          />
          <StatCard
            title="Active Monitoring"
            value={stats.activeMonitoring}
            icon={<Activity className="h-6 w-6" />}
            iconColor="text-blue-600"
          />
          <StatCard
            title="Delayed Routes"
            value={stats.delayedRoutes}
            icon={<AlertTriangle className="h-6 w-6" />}
            iconColor="text-orange-600"
          />
          <StatCard
            title="Avg Delay"
            value={`${stats.avgDelay}m`}
            icon={<Clock className="h-6 w-6" />}
            iconColor="text-red-600"
          />
        </StatGrid>
      )}

      {/* Traffic Map Placeholder */}
      <Alert variant="info">
        Interactive traffic map visualization coming soon. This will display real-time route overlays on Google Maps.
      </Alert>

      {/* Recent Traffic Snapshots */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold">Recent Traffic Updates</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Live traffic conditions on monitored routes
          </p>
        </div>

        {trafficLoading ? (
          <SkeletonList items={5} />
        ) : trafficSnapshots && trafficSnapshots.length > 0 ? (
          <List>
            {trafficSnapshots.slice(0, 10).map((snapshot) => {
              const route = routes?.find(r => r.id === snapshot.route_id);
              const config = trafficConfig[snapshot.traffic_condition];

              return (
                <ListItem key={snapshot.id}>
                  <div className="flex items-start gap-4 w-full">
                    <div className="flex-shrink-0">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium truncate">
                          {route?.origin_address || 'Unknown Route'}
                        </span>
                        <Badge variant={config.variant}>
                          {config.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        To: {route?.destination_address || 'Unknown Destination'}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className={`font-medium ${config.color}`}>
                          +{snapshot.delay_minutes} min delay
                        </span>
                        <span>
                          {new Date(snapshot.snapshot_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </ListItem>
              );
            })}
          </List>
        ) : (
          <EmptyState
            icon={Map}
            title="No Traffic Data"
            description="No traffic snapshots available yet. Traffic monitoring begins when deliveries are created and routes are tracked."
          />
        )}
      </div>
    </div>
  );
}
