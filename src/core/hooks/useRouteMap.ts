/**
 * useRouteMap Hook
 * Creates a Map for fast route lookups by ID
 */

import { useMemo } from "react";

/**
 * Convert routes array to a Map for O(1) lookup performance
 * Memoized to avoid recreating the Map on every render
 */
export function useRouteMap<T extends { id: string }>(routes: T[] | undefined) {
  return useMemo(() => {
    if (!routes) return new Map<string, T>();
    return new Map(routes.map((route) => [route.id, route]));
  }, [routes]);
}

/**
 * Find a route by ID from the route map
 */
export function findRoute<T extends { id: string }>(
  routeMap: Map<string, T>,
  routeId: string,
): T | undefined {
  return routeMap.get(routeId);
}
