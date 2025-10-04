/**
 * ViewModeSwitcher Component
 * Toggle between list, grid, and compact view modes
 * Persists preference using uiStore
 */

"use client";

import { LayoutGrid, LayoutList, List } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/core/base/utils/cn";
import { useViewMode } from "@/stores";

export interface ViewModeSwitcherProps {
  pageKey: string;
  className?: string;
  showLabels?: boolean;
}

export type ViewMode = "list" | "grid" | "compact";

const modes: Array<{
  value: ViewMode;
  icon: typeof LayoutList;
  label: string;
}> = [
  { value: "list", icon: LayoutList, label: "List" },
  { value: "grid", icon: LayoutGrid, label: "Grid" },
  { value: "compact", icon: List, label: "Compact" },
];

export function ViewModeSwitcher({
  pageKey,
  className,
  showLabels = false,
}: ViewModeSwitcherProps) {
  const { viewMode: storeViewMode, setViewMode: storeSetViewMode } =
    useViewMode(pageKey);

  // Use local state to prevent hydration mismatch
  // Initialize with default 'list' on both server and client
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [isHydrated, setIsHydrated] = useState(false);

  // Sync with store after hydration
  useEffect(() => {
    setIsHydrated(true);
    setViewMode(storeViewMode as ViewMode);
  }, [storeViewMode]);

  const handleSetViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    storeSetViewMode(mode);
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-1",
        className,
      )}
      role="group"
      aria-label="View mode"
    >
      {modes.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => handleSetViewMode(value)}
          className={cn(
            "inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
            viewMode === value
              ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700/50",
          )}
          aria-label={`${label} view`}
          aria-pressed={viewMode === value}
        >
          <Icon className="h-4 w-4" />
          {showLabels && <span>{label}</span>}
        </button>
      ))}
    </div>
  );
}

/**
 * Hook to get current view mode for a page
 * Use this in components that need to render differently based on view mode
 *
 * Note: Returns 'list' as default during SSR, then syncs with store after hydration
 */
export function usePageViewMode(pageKey: string): ViewMode {
  const { viewMode: storeViewMode } = useViewMode(pageKey);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  useEffect(() => {
    setViewMode(storeViewMode as ViewMode);
  }, [storeViewMode]);

  return viewMode;
}
