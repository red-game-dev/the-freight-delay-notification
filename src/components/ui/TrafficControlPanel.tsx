/**
 * Traffic Control Panel Component
 * Controls for toggling traffic layer and filtering traffic conditions
 */

"use client";

import type { TrafficConditionFilter } from "@/core/types/traffic";
import { Button } from "./Button";
import { Select } from "./Select";

export interface TrafficControlPanelProps {
  /** Whether traffic layer is shown */
  showTrafficLayer: boolean;
  /** Callback when traffic layer toggle changes */
  onTrafficLayerChange: (show: boolean) => void;
  /** Current traffic filter */
  trafficFilter: TrafficConditionFilter;
  /** Callback when traffic filter changes */
  onTrafficFilterChange: (filter: TrafficConditionFilter) => void;
  /** Selected route ID */
  selectedRoute: string | null;
  /** Callback when route selection changes */
  onRouteSelectionChange: (routeId: string | null) => void;
  /** Total number of routes */
  totalRoutes: number;
  /** Number of visible routes (after filtering) */
  visibleRoutes: number;
}

export function TrafficControlPanel({
  showTrafficLayer,
  onTrafficLayerChange,
  trafficFilter,
  onTrafficFilterChange,
  selectedRoute,
  onRouteSelectionChange,
  totalRoutes,
  visibleRoutes,
}: TrafficControlPanelProps) {
  return (
    <div className="absolute bottom-4 left-4 z-20 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-3 space-y-3 max-w-[280px] sm:max-w-xs">
      {/* Traffic Layer Toggle - Always Visible */}
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showTrafficLayer}
            onChange={(e) => onTrafficLayerChange(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800 text-blue-600 focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm font-medium">Show Traffic Layer</span>
        </label>
      </div>

      {/* Only show detailed controls when traffic layer is enabled */}
      {showTrafficLayer && (
        <>
          {/* Route Selection */}
          {selectedRoute && (
            <div className="flex justify-end pt-2 border-t border-gray-200 dark:border-gray-700">
              <Button
                size="sm"
                onClick={() => onRouteSelectionChange(null)}
                className="text-xs"
              >
                Show All Routes
              </Button>
            </div>
          )}

          {/* Route Count & Filter */}
          <div className="text-xs space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <p className="font-semibold">
                {selectedRoute
                  ? "Route Details"
                  : `${visibleRoutes} of ${totalRoutes} Routes`}
              </p>
            </div>

            {!selectedRoute && (
              <Select
                label="Filter by Traffic:"
                value={trafficFilter}
                onChange={(e) =>
                  onTrafficFilterChange(e.target.value as TrafficConditionFilter)
                }
                size="sm"
                fullWidth
                options={[
                  { value: "all", label: `All Traffic (${totalRoutes})` },
                  { value: "severe", label: "🔴 Severe Only" },
                  { value: "heavy", label: "🟠 Heavy Only" },
                  { value: "moderate", label: "🟡 Moderate Only" },
                  { value: "light", label: "🟢 Light Only" },
                ]}
              />
            )}

            {!selectedRoute && visibleRoutes > 0 && (
              <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                Sorted by severity (worst first)
              </p>
            )}
          </div>

          {/* Traffic Legend */}
          <div className="text-xs pt-2 border-t border-gray-200 dark:border-gray-700">
            <p className="font-semibold mb-2">Traffic Conditions:</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={trafficFilter === "light" ? "primary" : "outline"}
                size="sm"
                onClick={() => onTrafficFilterChange("light")}
                className="justify-start text-xs h-auto py-1.5"
              >
                <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
                Light
              </Button>
              <Button
                variant={trafficFilter === "moderate" ? "primary" : "outline"}
                size="sm"
                onClick={() => onTrafficFilterChange("moderate")}
                className="justify-start text-xs h-auto py-1.5"
              >
                <div className="w-3 h-3 bg-yellow-500 rounded mr-2"></div>
                Moderate
              </Button>
              <Button
                variant={trafficFilter === "heavy" ? "primary" : "outline"}
                size="sm"
                onClick={() => onTrafficFilterChange("heavy")}
                className="justify-start text-xs h-auto py-1.5"
              >
                <div className="w-3 h-3 bg-orange-500 rounded mr-2"></div>
                Heavy
              </Button>
              <Button
                variant={trafficFilter === "severe" ? "primary" : "outline"}
                size="sm"
                onClick={() => onTrafficFilterChange("severe")}
                className="justify-start text-xs h-auto py-1.5"
              >
                <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
                Severe
              </Button>
            </div>
            <Button
              variant={trafficFilter === "all" ? "primary" : "outline"}
              size="sm"
              onClick={() => onTrafficFilterChange("all")}
              className="mt-2 w-full text-xs"
            >
              Show All Traffic
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
