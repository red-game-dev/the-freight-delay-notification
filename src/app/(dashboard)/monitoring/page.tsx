/**
 * Monitoring Page
 * Real-time traffic monitoring and delay detection
 */

'use client';

import * as React from 'react';
import { Alert } from '@/components/ui/Alert';
import { StatCard, StatGrid } from '@/components/ui/StatCard';
import { List, ListItem } from '@/components/ui/List';
import { Badge } from '@/components/ui/Badge';
import { SkeletonStats, SkeletonList } from '@/components/ui/Skeleton';
import { getDeliveryStatusVariant, getTrafficConditionVariant } from '@/core/utils/statusUtils';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { MapPin, Activity, AlertTriangle, Clock, Map as MapIcon, ExternalLink, Navigation, Filter, Package } from 'lucide-react';
import { useRoutes } from '@/core/infrastructure/http/services/routes';
import { useTrafficSnapshots } from '@/core/infrastructure/http/services/traffic';
import { useDeliveries } from '@/core/infrastructure/http/services/deliveries';
import type { Delivery } from '@/core/infrastructure/http/services/deliveries';
import { Button } from '@/components/ui/Button';
import { TrafficMap } from '@/components/features/monitoring/TrafficMap';

const trafficConfig = {
  light: { label: 'Light', variant: 'success' as const, color: 'text-green-600' },
  moderate: { label: 'Moderate', variant: 'warning' as const, color: 'text-yellow-600' },
  heavy: { label: 'Heavy', variant: 'error' as const, color: 'text-orange-600' },
  severe: { label: 'Severe', variant: 'error' as const, color: 'text-red-600' },
};

type TrafficCondition = 'all' | 'light' | 'moderate' | 'heavy' | 'severe';

export default function MonitoringPage() {
  const { data: routes, isLoading: routesLoading } = useRoutes();
  const { data: trafficSnapshots, isLoading: trafficLoading } = useTrafficSnapshots();
  const { data: deliveries, isLoading: deliveriesLoading } = useDeliveries();
  const [selectedFilter, setSelectedFilter] = React.useState<TrafficCondition>('all');
  const [expandedDeliveries, setExpandedDeliveries] = React.useState<Set<string>>(new Set());

  // Calculate stats
  const stats = {
    totalRoutes: routes?.length || 0,
    activeMonitoring: trafficSnapshots?.length || 0,
    delayedRoutes: trafficSnapshots?.filter(t => t.delay_minutes > 15).length || 0,
    avgDelay: trafficSnapshots?.length
      ? Math.round(trafficSnapshots.reduce((acc, t) => acc + t.delay_minutes, 0) / trafficSnapshots.length)
      : 0,
  };

  // Filter traffic snapshots by selected condition
  const filteredSnapshots = React.useMemo(() => {
    if (!trafficSnapshots) return [];
    if (selectedFilter === 'all') return trafficSnapshots;
    return trafficSnapshots.filter(s => s.traffic_condition === selectedFilter);
  }, [trafficSnapshots, selectedFilter]);

  // Count by traffic condition
  const conditionCounts = React.useMemo(() => {
    if (!trafficSnapshots) return { all: 0, light: 0, moderate: 0, heavy: 0, severe: 0 };
    return {
      all: trafficSnapshots.length,
      light: trafficSnapshots.filter(s => s.traffic_condition === 'light').length,
      moderate: trafficSnapshots.filter(s => s.traffic_condition === 'moderate').length,
      heavy: trafficSnapshots.filter(s => s.traffic_condition === 'heavy').length,
      severe: trafficSnapshots.filter(s => s.traffic_condition === 'severe').length,
    };
  }, [trafficSnapshots]);

  // Map deliveries by route_id for quick lookup
  const deliveriesByRoute = React.useMemo(() => {
    if (!deliveries) return new Map();
    const map = new Map<string, typeof deliveries>();
    deliveries.forEach((delivery) => {
      const existing = map.get(delivery.route_id) || [];
      existing.push(delivery);
      map.set(delivery.route_id, existing);
    });
    return map;
  }, [deliveries]);

  // Toggle expanded state for deliveries
  const toggleDeliveries = (snapshotId: string) => {
    setExpandedDeliveries(prev => {
      const next = new Set(prev);
      if (next.has(snapshotId)) {
        next.delete(snapshotId);
      } else {
        next.add(snapshotId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Route Monitoring"
        description="Real-time traffic monitoring and delay detection"
      />

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

      {/* Traffic Map - Interactive visualization */}
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6">
          <SectionHeader
            title="Traffic Map"
            description="Real-time traffic visualization with route overlays and incident markers"
            size="lg"
          />
        </div>
        <div className="p-4 sm:p-6 pt-0">
          {trafficLoading || routesLoading ? (
            <div className="flex items-center justify-center h-[500px] bg-gray-100 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-muted-foreground">Loading map data...</p>
            </div>
          ) : routes && routes.length > 0 ? (
            <TrafficMap
              routes={routes}
              trafficSnapshots={trafficSnapshots || []}
              selectedRouteId={routes[0]?.id}
            />
          ) : (
            <Alert variant="info">
              No routes available to display. Create deliveries to see traffic visualization.
            </Alert>
          )}
        </div>
      </div>

      {/* Recent Traffic Snapshots */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="p-4 sm:p-6">
          <div className="mb-4">
            <SectionHeader
              title="Recent Traffic Updates"
              description="Live traffic conditions on monitored routes"
              size="lg"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedFilter === 'all' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedFilter('all')}
            >
              All ({conditionCounts.all})
            </Button>
            <Button
              variant={selectedFilter === 'severe' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedFilter('severe')}
              className={selectedFilter === 'severe' ? '' : 'hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950'}
            >
              Severe ({conditionCounts.severe})
            </Button>
            <Button
              variant={selectedFilter === 'heavy' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedFilter('heavy')}
              className={selectedFilter === 'heavy' ? '' : 'hover:bg-orange-50 hover:text-orange-700 dark:hover:bg-orange-950'}
            >
              Heavy ({conditionCounts.heavy})
            </Button>
            <Button
              variant={selectedFilter === 'moderate' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedFilter('moderate')}
              className={selectedFilter === 'moderate' ? '' : 'hover:bg-yellow-50 hover:text-yellow-700 dark:hover:bg-yellow-950'}
            >
              Moderate ({conditionCounts.moderate})
            </Button>
            <Button
              variant={selectedFilter === 'light' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedFilter('light')}
              className={selectedFilter === 'light' ? '' : 'hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-950'}
            >
              Light ({conditionCounts.light})
            </Button>
          </div>
        </div>

        {trafficLoading ? (
          <SkeletonList items={5} />
        ) : filteredSnapshots && filteredSnapshots.length > 0 ? (
          <div className="max-h-[800px] overflow-y-auto">
            <List>
              {filteredSnapshots.slice(0, 20).map((snapshot) => {
              const route = routes?.find(r => r.id === snapshot.route_id);
              const config = trafficConfig[snapshot.traffic_condition];

              // Get additional incident details
              const description = (snapshot as any).description;
              const severity = (snapshot as any).severity || 'minor';
              const affectedArea = (snapshot as any).affected_area;
              const incidentType = (snapshot as any).incident_type;
              const incidentLocation = (snapshot as any).incident_location;

              // Create Google Maps URL
              const originAddr = route?.origin_address || '';
              const destAddr = route?.destination_address || '';
              const googleMapsUrl = originAddr && destAddr
                ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originAddr)}&destination=${encodeURIComponent(destAddr)}&travelmode=driving`
                : null;

              const severityColors = {
                minor: 'text-yellow-600 dark:text-yellow-400',
                moderate: 'text-orange-600 dark:text-orange-400',
                major: 'text-red-600 dark:text-red-400',
                severe: 'text-red-700 dark:text-red-500',
              };

              return (
                <ListItem key={snapshot.id}>
                  <div className="flex items-start gap-4 w-full">
                    <div className="flex-shrink-0">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {/* Header with route and traffic condition */}
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-medium truncate">
                          {route?.origin_address || 'Unknown Route'}
                        </span>
                        <Badge variant={config.variant}>
                          {config.label}
                        </Badge>
                        {severity && severity !== 'minor' && (
                          <Badge variant="error" className="text-xs">
                            {severity.toUpperCase()}
                          </Badge>
                        )}
                      </div>

                      {/* Destination */}
                      <p className="text-sm text-muted-foreground mb-2">
                        To: {route?.destination_address || 'Unknown Destination'}
                      </p>

                      {/* Incident description */}
                      {description && (
                        <p className="text-sm mb-2 text-gray-700 dark:text-gray-300">
                          {description}
                        </p>
                      )}

                      {/* Affected area */}
                      {affectedArea && (
                        <p className="text-xs text-muted-foreground mb-2">
                          Affected area: {affectedArea}
                        </p>
                      )}

                      {/* Metrics row */}
                      <div className="flex items-center gap-4 mt-2 flex-wrap text-xs">
                        <span className={`font-medium ${config.color}`}>
                          +{snapshot.delay_minutes} min delay
                        </span>
                        {incidentType && (
                          <span className="text-muted-foreground capitalize">
                            {incidentType.replace('_', ' ')}
                          </span>
                        )}
                        <span className="text-muted-foreground">
                          {new Date(snapshot.snapshot_at).toLocaleString()}
                        </span>
                      </div>

                      {/* Linked Deliveries */}
                      {route && deliveriesByRoute.has(route.id) && (
                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center gap-2 mb-2">
                            <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                              Affected Deliveries ({deliveriesByRoute.get(route.id)!.length})
                            </span>
                          </div>
                          <div className="space-y-1">
                            {deliveriesByRoute.get(route.id)!
                              .slice(0, expandedDeliveries.has(snapshot.id) ? undefined : 3)
                              .map((delivery: Delivery) => (
                                <div key={delivery.id} className="flex items-center justify-between text-xs">
                                  <span className="text-blue-800 dark:text-blue-200 font-mono">
                                    {delivery.tracking_number}
                                  </span>
                                  <Badge variant={getDeliveryStatusVariant(delivery.status)} className="text-xs">
                                    {delivery.status}
                                  </Badge>
                                </div>
                              ))}
                            {deliveriesByRoute.get(route.id)!.length > 3 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleDeliveries(snapshot.id)}
                                className="text-xs text-blue-700 dark:text-blue-300 hover:underline mt-1 h-auto py-0 px-1"
                              >
                                {expandedDeliveries.has(snapshot.id)
                                  ? 'Show less'
                                  : `+${deliveriesByRoute.get(route.id)!.length - 3} more deliveries`}
                              </Button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      {googleMapsUrl && (
                        <div className="mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(googleMapsUrl, '_blank')}
                            leftIcon={<Navigation className="h-4 w-4" />}
                          >
                            Open in Google Maps
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </ListItem>
              );
            })}
          </List>
          </div>
        ) : (
          <EmptyState
            icon={MapIcon}
            title="No Traffic Data"
            description={selectedFilter === 'all'
              ? "No traffic snapshots available yet. Traffic monitoring begins when deliveries are created and routes are tracked."
              : `No ${selectedFilter} traffic conditions found. Try selecting a different filter.`}
          />
        )}
      </div>
    </div>
  );
}
