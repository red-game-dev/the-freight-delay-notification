/**
 * ViewModeSwitcher Component
 * Toggle between list, grid, and compact view modes
 * Persists preference using uiStore
 */

"use client";

import { LayoutGrid, LayoutList, List } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
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
  const [_isHydrated, setIsHydrated] = useState(false);

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
    <fieldset
      className={cn(
        "inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-1",
        className,
      )}
      aria-label="View mode"
    >
      {modes.map(({ value, icon: Icon, label }) => (
        <Button
          key={value}
          onClick={() => handleSetViewMode(value)}
          variant={viewMode === value ? "default" : "ghost"}
          size="sm"
          leftIcon={<Icon className="h-4 w-4" />}
          className={cn("transition-colors", !showLabels && "px-2")}
          aria-label={`${label} view`}
          aria-pressed={viewMode === value}
        >
          {showLabels && label}
        </Button>
      ))}
    </fieldset>
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
