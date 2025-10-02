/**
 * TrafficMap Component
 * Interactive Google Maps visualization for traffic monitoring
 * Shows routes with traffic overlays and incident markers
 */

'use client';

import * as React from 'react';
import { GoogleMap, useLoadScript, DirectionsRenderer, Marker, InfoWindow, TrafficLayer, Polyline } from '@react-google-maps/api';
import { Alert } from '@/components/ui/Alert';
import { Loader2 } from 'lucide-react';
import { clientEnv } from '@/infrastructure/config/ClientEnv';

interface Route {
  id: string;
  origin_address: string;
  destination_address: string;
  origin_coords: { x: number; y: number };
  destination_coords: { x: number; y: number };
  current_duration_seconds: number | null;
  traffic_condition: 'light' | 'moderate' | 'heavy' | 'severe' | null;
}

interface TrafficSnapshot {
  id: string;
  route_id: string;
  traffic_condition: string;
  delay_minutes: number;
  description?: string;
  severity?: string;
  affected_area?: string;
  incident_type?: string;
  incident_location?: { x: number; y: number };
}

interface TrafficMapProps {
  routes: Route[];
  trafficSnapshots: TrafficSnapshot[];
  selectedRouteId?: string;
}

const mapContainerStyle = {
  width: '100%',
  height: '500px',
};

const defaultCenter = {
  lat: 40.7128,
  lng: -74.0060,
};

export function TrafficMap({ routes, trafficSnapshots, selectedRouteId }: TrafficMapProps) {
  const [map, setMap] = React.useState<google.maps.Map | null>(null);
  const [directions, setDirections] = React.useState<google.maps.DirectionsResult[]>([]);
  const [selectedMarker, setSelectedMarker] = React.useState<string | null>(null);
  const [showTrafficLayer, setShowTrafficLayer] = React.useState(true);
  const [selectedRoute, setSelectedRoute] = React.useState<string | null>(selectedRouteId || null);
  const [trafficFilter, setTrafficFilter] = React.useState<'all' | 'severe' | 'heavy' | 'moderate' | 'light'>('all');

  // Get Google Maps API key from client env
  const apiKey = clientEnv.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Load Google Maps API
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey || '',
  });

  // Calculate map center based on ALL routes
  const mapCenter = React.useMemo(() => {
    if (routes.length === 0) return defaultCenter;

    // Calculate center point of all routes
    let totalLat = 0;
    let totalLng = 0;
    let count = 0;

    routes.forEach(route => {
      if (typeof route.origin_coords?.x === 'number' && typeof route.origin_coords?.y === 'number') {
        totalLat += route.origin_coords.x;
        totalLng += route.origin_coords.y;
        count++;
      }
      if (typeof route.destination_coords?.x === 'number' && typeof route.destination_coords?.y === 'number') {
        totalLat += route.destination_coords.x;
        totalLng += route.destination_coords.y;
        count++;
      }
    });

    if (count === 0) return defaultCenter;

    return {
      lat: totalLat / count,
      lng: totalLng / count,
    };
  }, [routes]);

  // Fit map bounds to show all routes
  React.useEffect(() => {
    if (!map || routes.length === 0) return;

    const bounds = new google.maps.LatLngBounds();

    routes.forEach(route => {
      if (typeof route.origin_coords?.x === 'number' && typeof route.origin_coords?.y === 'number') {
        bounds.extend({ lat: route.origin_coords.x, lng: route.origin_coords.y });
      }
      if (typeof route.destination_coords?.x === 'number' && typeof route.destination_coords?.y === 'number') {
        bounds.extend({ lat: route.destination_coords.x, lng: route.destination_coords.y });
      }
    });

    // Fit the map to show all routes
    map.fitBounds(bounds);
  }, [map, routes]);

  // Load detailed directions ONLY for selected route
  React.useEffect(() => {
    if (!map || !selectedRoute) {
      setDirections([]);
      return;
    }

    const directionsService = new google.maps.DirectionsService();
    const route = routes.find(r => r.id === selectedRoute);

    if (!route) return;

    const loadDirections = async () => {
      try {
        const result = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
          directionsService.route(
            {
              origin: route.origin_address,
              destination: route.destination_address,
              travelMode: google.maps.TravelMode.DRIVING,
              drivingOptions: {
                departureTime: new Date(),
                trafficModel: google.maps.TrafficModel.BEST_GUESS,
              },
            },
            (result, status) => {
              if (status === google.maps.DirectionsStatus.OK && result) {
                resolve(result);
              } else {
                reject(new Error(`Directions failed: ${status}`));
              }
            }
          );
        });
        setDirections([result]);
      } catch (error) {
        console.error('Failed to load route directions:', error);
        setDirections([]);
      }
    };

    loadDirections();
  }, [map, selectedRoute, routes]);

  // Get incident markers for the map
  const incidentMarkers = React.useMemo(() => {
    return trafficSnapshots
      .filter(snapshot => {
        // Validate incident_location exists and has valid coordinates
        if (!snapshot.incident_location) return false;

        const hasValidLat =
          typeof snapshot.incident_location.x === 'number' &&
          isFinite(snapshot.incident_location.x) &&
          snapshot.incident_location.x !== 0;

        const hasValidLng =
          typeof snapshot.incident_location.y === 'number' &&
          isFinite(snapshot.incident_location.y) &&
          snapshot.incident_location.y !== 0;

        return hasValidLat && hasValidLng;
      })
      .map(snapshot => ({
        id: snapshot.id,
        position: {
          lat: snapshot.incident_location!.x,
          lng: snapshot.incident_location!.y,
        },
        snapshot,
      }));
  }, [trafficSnapshots]);

  // Create polylines for ALL routes (simple origin → destination lines)
  const routePolylines = React.useMemo(() => {
    console.log('🗺️ [TrafficMap] Raw routes sample:', routes[0]);
    console.log('🗺️ [TrafficMap] Raw traffic snapshots sample:', trafficSnapshots[0]);

    const allRoutes = routes
      .filter(route => {
        // Validate coordinates exist and are valid numbers
        const hasValidOrigin =
          route.origin_coords &&
          typeof route.origin_coords.x === 'number' &&
          typeof route.origin_coords.y === 'number' &&
          isFinite(route.origin_coords.x) &&
          isFinite(route.origin_coords.y);

        const hasValidDestination =
          route.destination_coords &&
          typeof route.destination_coords.x === 'number' &&
          typeof route.destination_coords.y === 'number' &&
          isFinite(route.destination_coords.x) &&
          isFinite(route.destination_coords.y);

        if (!hasValidOrigin || !hasValidDestination) {
          console.log('🗺️ [TrafficMap] Invalid route:', {
            id: route.id,
            origin_coords: route.origin_coords,
            destination_coords: route.destination_coords,
          });
        }

        return hasValidOrigin && hasValidDestination;
      })
      .map(route => {
        // Use route's current traffic condition (updated by cron job)
        // Fallback to latest snapshot if route doesn't have traffic_condition yet
        const latestSnapshot = trafficSnapshots
          .filter(s => s.route_id === route.id)
          .sort((a, b) => b.id.localeCompare(a.id))[0];

        const trafficCondition = route.traffic_condition || latestSnapshot?.traffic_condition || 'light';
        const color = getRouteColor(trafficCondition);

        return {
          id: route.id,
          path: [
            { lat: route.origin_coords.x, lng: route.origin_coords.y },
            { lat: route.destination_coords.x, lng: route.destination_coords.y },
          ],
          color,
          route,
          latestSnapshot,
          trafficCondition,
        };
      });

    // Debug logging
    console.log('🗺️ [TrafficMap] Filter:', trafficFilter);
    console.log('🗺️ [TrafficMap] Total routes:', allRoutes.length);
    console.log('🗺️ [TrafficMap] Traffic conditions:', allRoutes.map(r => r.trafficCondition));

    // Filter by traffic condition
    const filtered = trafficFilter === 'all'
      ? allRoutes
      : allRoutes.filter(polyline => polyline.trafficCondition === trafficFilter);

    console.log('🗺️ [TrafficMap] After filter:', filtered.length, 'routes');

    // Sort by severity: severe > heavy > moderate > light
    return filtered.sort((a, b) => {
      const severityOrder = { severe: 4, heavy: 3, moderate: 2, light: 1 };
      const aSeverity = severityOrder[a.trafficCondition as keyof typeof severityOrder] || 0;
      const bSeverity = severityOrder[b.trafficCondition as keyof typeof severityOrder] || 0;
      return bSeverity - aSeverity; // Descending order (severe first)
    });
  }, [routes, trafficSnapshots, trafficFilter]);

  const onLoad = React.useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = React.useCallback(() => {
    setMap(null);
  }, []);

  // Debug: Count routes by traffic condition (MUST be before early returns!)
  const trafficCounts = React.useMemo(() => {
    const counts = { light: 0, moderate: 0, heavy: 0, severe: 0 };
    routePolylines.forEach(r => {
      const condition = r.trafficCondition as keyof typeof counts;
      if (counts[condition] !== undefined) {
        counts[condition]++;
      }
    });
    return counts;
  }, [routePolylines]);

  if (!apiKey) {
    return (
      <Alert variant="warning" title="Google Maps API Key Missing">
        Please add <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to your environment variables to enable the interactive map.
      </Alert>
    );
  }

  if (loadError) {
    return (
      <Alert variant="error" title="Map Loading Error">
        Failed to load Google Maps. Please check your API key and try again.
      </Alert>
    );
  }

  if (!isLoaded) {
    return <LoadingElement />;
  }

  return (
    <div className="relative">
      {/* Debug Info */}
      {clientEnv.isDevelopment && (
        <div className="absolute top-4 right-4 z-10 bg-yellow-100 dark:bg-yellow-900 rounded-lg shadow-lg p-2 text-xs max-w-xs">
          <p className="font-bold">🐛 Debug Info:</p>
          <p>Total Routes: {routes.length}</p>
          <p>Traffic Snapshots: {trafficSnapshots.length}</p>
          <p>Valid Routes: {routePolylines.length}</p>
          <p>Filter: {trafficFilter}</p>
          <p>🟢 Light: {trafficCounts.light}</p>
          <p>🟡 Moderate: {trafficCounts.moderate}</p>
          <p>🟠 Heavy: {trafficCounts.heavy}</p>
          <p>🔴 Severe: {trafficCounts.severe}</p>
        </div>
      )}

      {/* Traffic Layer Controls */}
      <div className="absolute top-4 left-4 z-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 space-y-3 max-w-xs">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="traffic-toggle"
              checked={showTrafficLayer}
              onChange={(e) => setShowTrafficLayer(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="traffic-toggle" className="text-sm font-medium cursor-pointer">
              Live Traffic Layer
            </label>
          </div>
          {selectedRoute && (
            <button
              onClick={() => setSelectedRoute(null)}
              className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Show All
            </button>
          )}
        </div>

        {/* Route Count & Filter */}
        <div className="text-xs pt-2 border-t space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-semibold">
              {selectedRoute ? 'Route Details' : `${routePolylines.length} of ${routes.length} Routes`}
            </p>
          </div>

          {!selectedRoute && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Filter by Traffic:</label>
              <select
                value={trafficFilter}
                onChange={(e) => setTrafficFilter(e.target.value as any)}
                className="w-full text-xs px-2 py-1 border rounded bg-white dark:bg-gray-700"
              >
                <option value="all">All Traffic ({routes.length})</option>
                <option value="severe">🔴 Severe Only</option>
                <option value="heavy">🟠 Heavy Only</option>
                <option value="moderate">🟡 Moderate Only</option>
                <option value="light">🟢 Light Only</option>
              </select>
            </div>
          )}

          {!selectedRoute && routePolylines.length > 0 && (
            <p className="text-xs text-gray-600 italic">
              Sorted by severity (worst first)
            </p>
          )}
        </div>

        {/* Traffic Legend */}
        <div className="text-xs pt-2 border-t">
          <p className="font-semibold mb-2">Traffic Conditions:</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setTrafficFilter('light')}
              className={`flex items-center gap-2 p-1 rounded transition ${trafficFilter === 'light' ? 'bg-green-50 dark:bg-green-900' : ''}`}
            >
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Light</span>
            </button>
            <button
              onClick={() => setTrafficFilter('moderate')}
              className={`flex items-center gap-2 p-1 rounded transition ${trafficFilter === 'moderate' ? 'bg-yellow-50 dark:bg-yellow-900' : ''}`}
            >
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span>Moderate</span>
            </button>
            <button
              onClick={() => setTrafficFilter('heavy')}
              className={`flex items-center gap-2 p-1 rounded transition ${trafficFilter === 'heavy' ? 'bg-orange-50 dark:bg-orange-900' : ''}`}
            >
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span>Heavy</span>
            </button>
            <button
              onClick={() => setTrafficFilter('severe')}
              className={`flex items-center gap-2 p-1 rounded transition ${trafficFilter === 'severe' ? 'bg-red-50 dark:bg-red-900' : ''}`}
            >
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>Severe</span>
            </button>
          </div>
          <button
            onClick={() => setTrafficFilter('all')}
            className={`mt-2 w-full text-xs py-1 px-2 rounded border transition ${trafficFilter === 'all' ? 'bg-blue-50 dark:bg-blue-900 border-blue-500' : 'border-gray-300'}`}
          >
            Show All Traffic
          </button>
        </div>
      </div>

      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={mapCenter}
        zoom={2}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          streetViewControl: false,
          mapTypeControl: true,
          fullscreenControl: true,
          zoomControl: true,
        }}
      >
          {/* Google's real-time traffic layer overlay */}
          {showTrafficLayer && <TrafficLayer />}

          {/* Simple polylines for ALL routes (no API quota usage) */}
          {!selectedRoute && routePolylines.map(({ id, path, color }) => (
            <Polyline
              key={id}
              path={path}
              options={{
                strokeColor: color,
                strokeWeight: 3,
                strokeOpacity: 0.6,
                geodesic: true,
              }}
              onClick={() => setSelectedRoute(id)}
            />
          ))}

          {/* Detailed directions for selected route only (uses Directions API) */}
          {selectedRoute && directions.map((direction, index) => (
            <DirectionsRenderer
              key={index}
              directions={direction}
              options={{
                suppressMarkers: false,
                polylineOptions: {
                  strokeColor: '#2563eb',
                  strokeWeight: 5,
                  strokeOpacity: 0.8,
                },
              }}
            />
          ))}

        {/* Traffic incident markers */}
        {incidentMarkers.map(({ id, position, snapshot }) => (
          <React.Fragment key={id}>
            <Marker
              position={position}
              onClick={() => setSelectedMarker(id)}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: getMarkerColor(snapshot.severity || 'minor'),
                fillOpacity: 0.8,
                strokeColor: '#ffffff',
                strokeWeight: 2,
              }}
            />
            {selectedMarker === id && (
              <InfoWindow
                position={position}
                onCloseClick={() => setSelectedMarker(null)}
              >
                <div className="p-2 max-w-xs">
                  <h3 className="font-semibold mb-1">
                    {snapshot.incident_type?.replace('_', ' ').toUpperCase() || 'Traffic Incident'}
                  </h3>
                  {snapshot.description && (
                    <p className="text-sm mb-2">{snapshot.description}</p>
                  )}
                  {snapshot.affected_area && (
                    <p className="text-xs text-gray-600 mb-1">
                      Area: {snapshot.affected_area}
                    </p>
                  )}
                  <p className="text-xs text-gray-600">
                    Delay: +{snapshot.delay_minutes} min
                  </p>
                  {snapshot.severity && (
                    <p className="text-xs font-semibold mt-1" style={{ color: getMarkerColor(snapshot.severity) }}>
                      Severity: {snapshot.severity.toUpperCase()}
                    </p>
                  )}
                </div>
              </InfoWindow>
            )}
          </React.Fragment>
        ))}
      </GoogleMap>
    </div>
  );
}

function LoadingElement() {
  return (
    <div className="flex items-center justify-center h-[500px] bg-gray-100 dark:bg-gray-800 rounded-lg">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading map...</p>
      </div>
    </div>
  );
}

function getMarkerColor(severity: string): string {
  const colors: Record<string, string> = {
    minor: '#eab308',    // yellow
    moderate: '#f97316', // orange
    major: '#ef4444',    // red
    severe: '#dc2626',   // dark red
  };
  return colors[severity] || colors.minor;
}

function getRouteColor(trafficCondition: string): string {
  const colors: Record<string, string> = {
    light: '#22c55e',    // green - normal traffic
    moderate: '#eab308', // yellow - moderate traffic
    heavy: '#f97316',    // orange - heavy traffic
    severe: '#ef4444',   // red - severe traffic
  };
  return colors[trafficCondition.toLowerCase()] || colors.light;
}
