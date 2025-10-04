/**
 * Monitoring Page
 * Real-time traffic monitoring and delay detection
 */

'use client';

import { useMemo } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { StatCard, StatGrid } from '@/components/ui/StatCard';
import { List, ListItem } from '@/components/ui/List';
import { Badge } from '@/components/ui/Badge';
import { ViewModeSwitcher } from '@/components/ui/ViewModeSwitcher';
import { ViewModeRenderer } from '@/components/ui/ViewModeRenderer';
import { SkeletonStats, SkeletonList } from '@/components/ui/Skeleton';
import { getDeliveryStatusVariant } from '@/core/utils/statusUtils';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { MapPin, Activity, AlertTriangle, Clock, Map as MapIcon, Navigation, Package } from 'lucide-react';
import { useRoutes } from '@/core/infrastructure/http/services/routes';
import type { Route } from '@/core/infrastructure/http/services/routes/queries/listRoutes';
import { useTrafficSnapshots } from '@/core/infrastructure/http/services/traffic';
import type { TrafficSnapshot, AffectedDelivery } from '@/core/infrastructure/http/services/traffic/queries/listTrafficSnapshots';
import { Button } from '@/components/ui/Button';
import { TrafficMap } from '@/components/features/monitoring/TrafficMap';
import { enrichSnapshot, countByCondition, TRAFFIC_CONFIG } from '@/core/utils/trafficUtils';
import { buildGoogleMapsDirectionsUrl } from '@/core/utils/mapsUtils';
import { useRouteMap } from '@/core/hooks/useRouteMap';
import { useURLPaginationWithFilter } from '@/core/hooks/useURLSearchParams';
import { useExpandedItems } from '@/stores';
import { cn } from '@/core/base/utils/cn';
import type { TrafficConditionFilter } from '@/core/types';

export default function MonitoringPage() {
  // URL-based state for pagination and filtering
  const { page, setPage, filter, setFilter } = useURLPaginationWithFilter<TrafficConditionFilter>('filter', 'all');

  // UI store for expanded items
  const expandedDeliveries = useExpandedItems('monitoring');

  const { data: routes, isLoading: routesLoading } = useRoutes();
  const routeMap = useRouteMap(routes);
  const { data: trafficResponse, isLoading: trafficLoading } = useTrafficSnapshots({
    page: page.toString(),
    limit: '10',
    includeStats: 'true'
  });

  const trafficSnapshots: TrafficSnapshot[] = trafficResponse?.data || [];
  const trafficPagination = trafficResponse?.pagination;
  const trafficStats = trafficResponse?.stats;

  // Calculate stats from API response
  const stats = {
    totalRoutes: routes?.length || 0,
    activeMonitoring: trafficStats?.total || 0,
    delayedRoutes: trafficStats?.delayed || 0,
    avgDelay: trafficStats?.avg_delay || 0,
  };

  // Filter traffic snapshots by selected condition
  const filteredSnapshots = useMemo(() => {
    if (!trafficSnapshots) return [];
    if (filter === 'all') return trafficSnapshots;
    return trafficSnapshots.filter(s => s.traffic_condition === filter);
  }, [trafficSnapshots, filter]);

  // Count by traffic condition using utility
  const conditionCounts = useMemo(() => {
    return countByCondition(trafficSnapshots);
  }, [trafficSnapshots]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <PageHeader
          title="Route Monitoring"
          description="Real-time traffic monitoring and delay detection"
        />
        <div className="flex-shrink-0">
          <ViewModeSwitcher pageKey="monitoring" />
        </div>
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

      {/* Filter Buttons - shown outside ViewModeRenderer for all view modes */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Button
          variant={filter === 'all' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All ({conditionCounts.all})
        </Button>
        <Button
          variant={filter === 'severe' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('severe')}
          className={filter === 'severe' ? '' : 'hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950'}
        >
          Severe ({conditionCounts.severe})
        </Button>
        <Button
          variant={filter === 'heavy' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('heavy')}
          className={filter === 'heavy' ? '' : 'hover:bg-orange-50 hover:text-orange-700 dark:hover:bg-orange-950'}
        >
          Heavy ({conditionCounts.heavy})
        </Button>
        <Button
          variant={filter === 'moderate' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('moderate')}
          className={filter === 'moderate' ? '' : 'hover:bg-yellow-50 hover:text-yellow-700 dark:hover:bg-yellow-950'}
        >
          Moderate ({conditionCounts.moderate})
        </Button>
        <Button
          variant={filter === 'light' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('light')}
          className={filter === 'light' ? '' : 'hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-950'}
        >
          Light ({conditionCounts.light})
        </Button>
      </div>

      {/* Recent Traffic Snapshots */}
      <ViewModeRenderer
        pageKey="monitoring"
        items={filteredSnapshots}
        isLoading={trafficLoading}
        pagination={trafficPagination ? {
          page: trafficPagination.page,
          totalPages: trafficPagination.totalPages,
          total: trafficPagination.total,
          limit: 10,
        } : undefined}
        onPageChange={setPage}
        loadingComponent={<SkeletonList items={5} />}
        emptyComponent={
          <EmptyState
            icon={MapIcon}
            title="No Traffic Data"
            description={filter === 'all'
              ? "No traffic snapshots available yet. Traffic monitoring begins when deliveries are created and routes are tracked."
              : `No ${filter} traffic conditions found. Try selecting a different filter.`}
          />
        }
        listHeader={
          <SectionHeader
            title="Recent Traffic Updates"
            description="Live traffic conditions on monitored routes"
            size="lg"
          />
        }
        renderList={(snapshots) => (
          <div className="max-h-[800px] overflow-y-auto">
            <List>
              {snapshots.map((snapshot: TrafficSnapshot) => {
              const route: Route | undefined = routeMap.get(snapshot.route_id);
              const enriched = enrichSnapshot(snapshot);
              const googleMapsUrl = buildGoogleMapsDirectionsUrl(
                route?.origin_address ?? '',
                route?.destination_address ?? ''
              );

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
                          {route?.origin_address ?? 'Unknown Route'}
                        </span>
                        <Badge variant={enriched.config.variant}>
                          {enriched.config.label}
                        </Badge>
                        {enriched.severity !== 'minor' && (
                          <Badge variant="error" className="text-xs">
                            {enriched.severity.toUpperCase()}
                          </Badge>
                        )}
                      </div>

                      {/* Destination */}
                      <p className="text-sm text-muted-foreground mb-2">
                        To: {route?.destination_address ?? 'Unknown Destination'}
                      </p>

                      {/* Incident description */}
                      {enriched.description && (
                        <p className="text-sm mb-2 text-gray-700 dark:text-gray-300">
                          {enriched.description}
                        </p>
                      )}

                      {/* Affected area */}
                      {enriched.affected_area && (
                        <p className="text-xs text-muted-foreground mb-2">
                          Affected area: {enriched.affected_area}
                        </p>
                      )}

                      {/* Metrics row */}
                      <div className="flex items-center gap-4 mt-2 flex-wrap text-xs">
                        <span className={`font-medium ${enriched.config.color}`}>
                          +{enriched.delay_minutes} min delay
                        </span>
                        {enriched.formatted_incident_type && (
                          <span className="text-muted-foreground capitalize">
                            {enriched.formatted_incident_type}
                          </span>
                        )}
                        <span className="text-muted-foreground">
                          {new Date(enriched.snapshot_at).toLocaleString()}
                        </span>
                      </div>

                      {/* Linked Deliveries */}
                      {snapshot.affected_deliveries && snapshot.affected_deliveries.length > 0 && (
                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center gap-2 mb-2">
                            <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                              Affected Deliveries ({snapshot.affected_deliveries.length})
                            </span>
                          </div>
                          <div className="space-y-1">
                            {snapshot.affected_deliveries
                              .slice(0, expandedDeliveries.isExpanded(snapshot.id) ? undefined : 3)
                              .map((delivery: AffectedDelivery) => (
                                <div key={delivery.id} className="flex items-center justify-between text-xs">
                                  <span className="text-blue-800 dark:text-blue-200 font-mono">
                                    {delivery.tracking_number}
                                  </span>
                                  <Badge variant={getDeliveryStatusVariant(delivery.status)} className="text-xs">
                                    {delivery.status}
                                  </Badge>
                                </div>
                              ))}
                            {snapshot.affected_deliveries.length > 3 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => expandedDeliveries.toggle(snapshot.id)}
                                className="text-xs text-blue-700 dark:text-blue-300 hover:underline mt-1 h-auto py-0 px-1"
                              >
                                {expandedDeliveries.isExpanded(snapshot.id)
                                  ? 'Show less'
                                  : `+${snapshot.affected_deliveries.length - 3} more deliveries`}
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
        )}
        renderGrid={(snapshots) => (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {snapshots.map((snapshot) => {
              const route = routeMap.get(snapshot.route_id);
              const enriched = enrichSnapshot(snapshot);

              return (
                <Card key={snapshot.id} className="p-4 hover:shadow-lg transition-shadow h-full">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <span className="font-semibold text-sm truncate">
                        {route?.origin_address || 'Unknown'}
                      </span>
                    </div>
                    <Badge variant={enriched.config.variant} className="flex-shrink-0 text-xs">
                      {enriched.config.label}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    <p className="text-muted-foreground text-xs truncate">
                      To: {route?.destination_address || 'Unknown'}
                    </p>

                    {enriched.description && (
                      <p className="text-xs line-clamp-2">{enriched.description}</p>
                    )}

                    <div className="flex items-center gap-2 text-xs pt-2">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className={enriched.config.color}>+{enriched.delay_minutes} min delay</span>
                    </div>

                    {snapshot.affected_deliveries && snapshot.affected_deliveries.length > 0 && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Package className="h-3 w-3" />
                        <span>{snapshot.affected_deliveries.length} affected deliveries</span>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
        renderCompact={(snapshots) => (
          <div className="divide-y">
            {snapshots.map((snapshot) => {
              const route = routeMap.get(snapshot.route_id);
              const enriched = enrichSnapshot(snapshot);

              return (
                <div key={snapshot.id} className="p-3 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-medium text-sm truncate">
                            {route?.origin_address || 'Unknown'}
                          </span>
                          <Badge variant={enriched.config.variant} className="text-xs flex-shrink-0">
                            {enriched.config.label}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          → {route?.destination_address || 'Unknown'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {snapshot.affected_deliveries && snapshot.affected_deliveries.length > 0 && (
                        <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                          <Package className="h-3 w-3" />
                          <span>{snapshot.affected_deliveries.length}</span>
                        </div>
                      )}
                      <span className={cn("text-xs font-medium", enriched.config.color)}>
                        +{enriched.delay_minutes}m
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      />
    </div>
  );
}
