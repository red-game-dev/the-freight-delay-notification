/**
 * ViewModeRenderer Component
 * Handles view mode switching logic with render props pattern
 * Eliminates repetitive view-switching code across list components
 */

"use client";

import type { ReactNode } from "react";
import { cn } from "@/core/base/utils/cn";
import { Pagination } from "./Pagination";
import { usePageViewMode } from "./ViewModeSwitcher";

export interface PaginationInfo {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
}

export interface ViewModeRendererProps<T> {
  /** Unique page key for view mode persistence */
  pageKey: string;

  /** Array of items to render (or object for multi-section rendering) */
  items: T;

  /** Loading state */
  isLoading?: boolean;

  /** Pagination info */
  pagination?: PaginationInfo;

  /** Page change handler */
  onPageChange?: (page: number) => void;

  /** Render function for list view (detailed table/list) */
  renderList: (items: T) => ReactNode;

  /** Render function for grid view (cards) */
  renderGrid: (items: T) => ReactNode;

  /** Render function for compact view (dense list) */
  renderCompact: (items: T) => ReactNode;

  /** Loading skeleton component */
  loadingComponent?: ReactNode;

  /** Empty state component */
  emptyComponent?: ReactNode;

  /** Optional header for list view only */
  listHeader?: ReactNode;

  /** Optional class name for container */
  className?: string;

  /** Show pagination info */
  showPaginationInfo?: boolean;
}

export function ViewModeRenderer<T>({
  pageKey,
  items,
  isLoading = false,
  pagination,
  onPageChange,
  renderList,
  renderGrid,
  renderCompact,
  loadingComponent,
  emptyComponent,
  listHeader,
  className,
  showPaginationInfo = true,
}: ViewModeRendererProps<T>) {
  const viewMode = usePageViewMode(pageKey);

  // Show loading state
  if (isLoading && loadingComponent) {
    return <>{loadingComponent}</>;
  }

  // Show empty state (only for arrays)
  if (!items || (Array.isArray(items) && items.length === 0)) {
    return emptyComponent ? emptyComponent : null;
  }

  // Render content based on view mode
  const renderContent = () => {
    switch (viewMode) {
      case "grid":
        return renderGrid(items);
      case "compact":
        return renderCompact(items);
      default:
        return renderList(items);
    }
  };

  return (
    <div
      className={cn(
        viewMode === "grid"
          ? "space-y-4"
          : "rounded-lg border bg-card shadow-sm",
        className,
      )}
    >
      {/* List header (only shown in list view) */}
      {viewMode === "list" && listHeader && (
        <div className="p-4 sm:p-6">{listHeader}</div>
      )}

      {/* Content */}
      {renderContent()}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && onPageChange && (
        <div
          className={cn(viewMode === "grid" ? "mt-6" : "p-4 sm:p-6 border-t")}
        >
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
            onPageChange={onPageChange}
            showItemsInfo={showPaginationInfo}
          />
        </div>
      )}
    </div>
  );
}
