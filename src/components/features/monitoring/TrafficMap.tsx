/**
 * TrafficMap Component
 * Interactive Google Maps visualization for traffic monitoring
 * Shows routes with traffic overlays and incident markers
 */

"use client";

import {
  DirectionsRenderer,
  GoogleMap,
  InfoWindow,
  Marker,
  Polyline,
  TrafficLayer,
} from "@react-google-maps/api";
import { Loader2 } from "lucide-react";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { TrafficControlPanel } from "@/components/ui/TrafficControlPanel";
import type {
  TrafficCondition,
  TrafficConditionFilter,
} from "@/core/types/traffic";
import {
  compareTrafficSeverity,
  getSeverityColor,
  getTrafficColor,
} from "@/core/utils/trafficUtils";
import { clientEnv } from "@/infrastructure/config/ClientEnv";
import { useGoogleMaps } from "@/providers/GoogleMapsProvider";

interface Route {
  id: string;
  origin_address: string;
  destination_address: string;
  origin_coords: { x: number; y: number };
  destination_coords: { x: number; y: number };
  current_duration_seconds: number | null;
  traffic_condition: TrafficCondition | null;
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
  /** External traffic filter from parent component */
  externalTrafficFilter?: TrafficConditionFilter;
  /** Callback when traffic filter changes */
  onTrafficFilterChange?: (filter: TrafficConditionFilter) => void;
}

const mapContainerStyle = {
  width: "100%",
  height: "500px",
};

const defaultCenter = {
  lat: 40.7128,
  lng: -74.006,
};

export function TrafficMap({
  routes,
  trafficSnapshots,
  selectedRouteId,
  externalTrafficFilter,
  onTrafficFilterChange,
}: TrafficMapProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult[]>(
    [],
  );
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const [showTrafficLayer, setShowTrafficLayer] = useState(false); // Default off
  const [selectedRoute, setSelectedRoute] = useState<string | null>(
    selectedRouteId || null,
  );
  // Use external filter if provided, otherwise use internal state
  const [internalTrafficFilter, setInternalTrafficFilter] =
    useState<TrafficConditionFilter>("all");
  const trafficFilter = externalTrafficFilter ?? internalTrafficFilter;

  // Handle filter changes - notify parent if callback provided
  const handleTrafficFilterChange = (filter: TrafficConditionFilter) => {
    if (onTrafficFilterChange) {
      onTrafficFilterChange(filter);
    } else {
      setInternalTrafficFilter(filter);
    }
  };

  const { isLoaded, loadError } = useGoogleMaps();

  // Calculate map center based on ALL routes
  const mapCenter = useMemo(() => {
    if (routes.length === 0) return defaultCenter;

    // Calculate center point of all routes
    let totalLat = 0;
    let totalLng = 0;
    let count = 0;

    routes.forEach((route) => {
      if (
        typeof route.origin_coords?.x === "number" &&
        typeof route.origin_coords?.y === "number"
      ) {
        totalLat += route.origin_coords.x;
        totalLng += route.origin_coords.y;
        count++;
      }
      if (
        typeof route.destination_coords?.x === "number" &&
        typeof route.destination_coords?.y === "number"
      ) {
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
  useEffect(() => {
    if (!map || routes.length === 0) return;

    const bounds = new google.maps.LatLngBounds();

    routes.forEach((route) => {
      if (
        typeof route.origin_coords?.x === "number" &&
        typeof route.origin_coords?.y === "number"
      ) {
        bounds.extend({
          lat: route.origin_coords.x,
          lng: route.origin_coords.y,
        });
      }
      if (
        typeof route.destination_coords?.x === "number" &&
        typeof route.destination_coords?.y === "number"
      ) {
        bounds.extend({
          lat: route.destination_coords.x,
          lng: route.destination_coords.y,
        });
      }
    });

    // Fit the map to show all routes
    map.fitBounds(bounds);
  }, [map, routes]);

  // Load detailed directions ONLY for selected route
  useEffect(() => {
    if (!map || !selectedRoute) {
      setDirections([]);
      return;
    }

    const directionsService = new google.maps.DirectionsService();
    const route = routes.find((r) => r.id === selectedRoute);

    if (!route) return;

    const loadDirections = async () => {
      try {
        const result = await new Promise<google.maps.DirectionsResult>(
          (resolve, reject) => {
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
              },
            );
          },
        );
        setDirections([result]);
      } catch (error) {
        console.error("Failed to load route directions:", error);
        setDirections([]);
      }
    };

    loadDirections();
  }, [map, selectedRoute, routes]);

  // Get incident markers for the map
  const incidentMarkers = useMemo(() => {
    return trafficSnapshots
      .filter((snapshot) => {
        // Validate incident_location exists and has valid coordinates
        if (!snapshot.incident_location) return false;

        const hasValidLat =
          typeof snapshot.incident_location.x === "number" &&
          Number.isFinite(snapshot.incident_location.x) &&
          snapshot.incident_location.x !== 0;

        const hasValidLng =
          typeof snapshot.incident_location.y === "number" &&
          Number.isFinite(snapshot.incident_location.y) &&
          snapshot.incident_location.y !== 0;

        return hasValidLat && hasValidLng;
      })
      .map((snapshot) => {
        // TypeScript doesn't know filter guarantees non-null, so we assert it
        const location = snapshot.incident_location as { x: number; y: number };
        return {
          id: snapshot.id,
          position: {
            lat: location.x,
            lng: location.y,
          },
          snapshot,
        };
      });
  }, [trafficSnapshots]);

  // Create polylines for ALL routes (simple origin → destination lines)
  const routePolylines = useMemo(() => {
    console.log("🗺️ [TrafficMap] Raw routes sample:", routes[0]);
    console.log(
      "🗺️ [TrafficMap] Raw traffic snapshots sample:",
      trafficSnapshots[0],
    );

    const allRoutes = routes
      .filter((route) => {
        // Validate coordinates exist and are valid numbers
        const hasValidOrigin =
          route.origin_coords &&
          typeof route.origin_coords.x === "number" &&
          typeof route.origin_coords.y === "number" &&
          Number.isFinite(route.origin_coords.x) &&
          Number.isFinite(route.origin_coords.y);

        const hasValidDestination =
          route.destination_coords &&
          typeof route.destination_coords.x === "number" &&
          typeof route.destination_coords.y === "number" &&
          Number.isFinite(route.destination_coords.x) &&
          Number.isFinite(route.destination_coords.y);

        if (!hasValidOrigin || !hasValidDestination) {
          console.log("🗺️ [TrafficMap] Invalid route:", {
            id: route.id,
            origin_coords: route.origin_coords,
            destination_coords: route.destination_coords,
          });
        }

        return hasValidOrigin && hasValidDestination;
      })
      .map((route) => {
        // Use route's current traffic condition (updated by cron job)
        // Fallback to latest snapshot if route doesn't have traffic_condition yet
        const latestSnapshot = trafficSnapshots
          .filter((s) => s.route_id === route.id)
          .sort((a, b) => b.id.localeCompare(a.id))[0];

        const trafficCondition =
          route.traffic_condition ||
          latestSnapshot?.traffic_condition ||
          "light";
        const color = getTrafficColor(trafficCondition);

        return {
          id: route.id,
          path: [
            { lat: route.origin_coords.x, lng: route.origin_coords.y },
            {
              lat: route.destination_coords.x,
              lng: route.destination_coords.y,
            },
          ],
          color,
          route,
          latestSnapshot,
          trafficCondition,
        };
      });

    // Debug logging
    console.log("🗺️ [TrafficMap] Filter:", trafficFilter);
    console.log("🗺️ [TrafficMap] Total routes:", allRoutes.length);
    console.log(
      "🗺️ [TrafficMap] Traffic conditions:",
      allRoutes.map((r) => r.trafficCondition),
    );

    // Filter by traffic condition
    const filtered =
      trafficFilter === "all"
        ? allRoutes
        : allRoutes.filter(
            (polyline) => polyline.trafficCondition === trafficFilter,
          );

    console.log("🗺️ [TrafficMap] After filter:", filtered.length, "routes");

    // Sort by severity using utility
    return filtered.sort((a, b) =>
      compareTrafficSeverity(a.trafficCondition, b.trafficCondition),
    );
  }, [routes, trafficSnapshots, trafficFilter]);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Debug: Count routes by traffic condition (MUST be before early returns!)
  const trafficCounts = useMemo(() => {
    const counts = { light: 0, moderate: 0, heavy: 0, severe: 0 };
    routePolylines.forEach((r) => {
      const condition = r.trafficCondition as keyof typeof counts;
      if (counts[condition] !== undefined) {
        counts[condition]++;
      }
    });
    return counts;
  }, [routePolylines]);

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
      {/* Debug Info - Bottom Right to not block controls */}
      {clientEnv.isDevelopment && (
        <div className="absolute bottom-4 right-4 z-10 bg-yellow-100 dark:bg-yellow-900 rounded-lg shadow-lg p-2 text-xs max-w-[200px] opacity-75 hover:opacity-100 transition-opacity">
          <p className="font-bold text-[10px]">🐛 Debug</p>
          <p className="text-[10px]">Routes: {routes.length}</p>
          <p className="text-[10px]">Snapshots: {trafficSnapshots.length}</p>
          <p className="text-[10px]">Valid: {routePolylines.length}</p>
          <p className="text-[10px]">Filter: {trafficFilter}</p>
          <p className="text-[10px]">
            🟢{trafficCounts.light} 🟡{trafficCounts.moderate} 🟠
            {trafficCounts.heavy} 🔴{trafficCounts.severe}
          </p>
        </div>
      )}

      {/* Traffic Layer Controls - Bottom Left to avoid blocking Google Maps controls */}
      <TrafficControlPanel
        showTrafficLayer={showTrafficLayer}
        onTrafficLayerChange={setShowTrafficLayer}
        trafficFilter={trafficFilter}
        onTrafficFilterChange={handleTrafficFilterChange}
        selectedRoute={selectedRoute}
        onRouteSelectionChange={setSelectedRoute}
        totalRoutes={routes.length}
        visibleRoutes={routePolylines.length}
      />

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
        {/* Google's real-time traffic layer overlay - only when enabled */}
        {showTrafficLayer && <TrafficLayer />}

        {/* Simple polylines for ALL routes (no API quota usage) - only when traffic layer enabled */}
        {showTrafficLayer &&
          !selectedRoute &&
          routePolylines.map(({ id, path, color }) => (
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
        {selectedRoute &&
          directions.map((direction) => (
            <DirectionsRenderer
              key={`direction-${selectedRoute}`}
              directions={direction}
              options={{
                suppressMarkers: false,
                polylineOptions: {
                  strokeColor: "#2563eb",
                  strokeWeight: 5,
                  strokeOpacity: 0.8,
                },
              }}
            />
          ))}

        {/* Traffic incident markers */}
        {incidentMarkers.map(({ id, position, snapshot }) => (
          <Fragment key={id}>
            <Marker
              position={position}
              onClick={() => setSelectedMarker(id)}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: getSeverityColor(snapshot.severity || "minor"),
                fillOpacity: 0.8,
                strokeColor: "#ffffff",
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
                    {snapshot.incident_type?.replace("_", " ").toUpperCase() ||
                      "Traffic Incident"}
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
                    <p
                      className="text-xs font-semibold mt-1"
                      style={{ color: getSeverityColor(snapshot.severity) }}
                    >
                      Severity: {snapshot.severity.toUpperCase()}
                    </p>
                  )}
                </div>
              </InfoWindow>
            )}
          </Fragment>
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
