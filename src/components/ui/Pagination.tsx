/**
 * Pagination Component
 * Navigate through pages of data with accessible controls
 */

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
} from "lucide-react";
import { type FC, useMemo } from "react";
import { cn } from "@/core/base/utils/cn";
import { Button } from "./Button";

export interface PaginationProps {
  /** Current page number (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Total number of items (optional) */
  totalItems?: number;
  /** Number of items per page (default: 20) */
  itemsPerPage?: number;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Number of page buttons to show (default: 5) */
  maxButtons?: number;
  /** Show first/last buttons (default: true) */
  showFirstLast?: boolean;
  /** Show items info (default: false) */
  showItemsInfo?: boolean;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Disabled state */
  disabled?: boolean;
  /** Custom className */
  className?: string;
}

export const Pagination: FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage = 10,
  onPageChange,
  maxButtons = 5,
  showFirstLast = true,
  showItemsInfo = false,
  size = "md",
  disabled = false,
  className,
}) => {
  // Calculate page numbers to display
  const pageNumbers = useMemo(() => {
    const pages: (number | "ellipsis")[] = [];

    if (totalPages <= maxButtons) {
      // Show all pages if total is less than max
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Calculate range around current page
      const halfMax = Math.floor(maxButtons / 2);
      let start = Math.max(1, currentPage - halfMax);
      let end = Math.min(totalPages, currentPage + halfMax);

      // Adjust if at the beginning or end
      if (currentPage <= halfMax) {
        end = maxButtons;
      }
      if (currentPage > totalPages - halfMax) {
        start = totalPages - maxButtons + 1;
      }

      // Add first page and ellipsis if needed
      if (start > 1) {
        pages.push(1);
        if (start > 2) pages.push("ellipsis");
      }

      // Add page numbers
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // Add ellipsis and last page if needed
      if (end < totalPages) {
        if (end < totalPages - 1) pages.push("ellipsis");
        pages.push(totalPages);
      }
    }

    return pages;
  }, [currentPage, totalPages, maxButtons]);

  // Calculate item range
  const itemRange = useMemo(() => {
    if (!totalItems) return null;
    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, totalItems);
    return { start, end };
  }, [currentPage, itemsPerPage, totalItems]);

  // Handle page click
  const handlePageClick = (page: number) => {
    if (page !== currentPage && page >= 1 && page <= totalPages && !disabled) {
      onPageChange(page);
    }
  };

  // Don't render if only one page
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      className={cn("flex items-center justify-between gap-4", className)}
      aria-label="Pagination Navigation"
    >
      {/* Items info */}
      {showItemsInfo && itemRange && (
        <div className="text-sm text-muted-foreground">
          Showing {itemRange.start}-{itemRange.end} of {totalItems}
        </div>
      )}

      {/* Pagination controls */}
      <div className="flex items-center gap-1">
        {/* First page button */}
        {showFirstLast && (
          <Button
            variant="ghost"
            size={size}
            onClick={() => handlePageClick(1)}
            disabled={currentPage === 1 || disabled}
            aria-label="Go to first page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
        )}

        {/* Previous page button */}
        <Button
          variant="ghost"
          size={size}
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={currentPage === 1 || disabled}
          aria-label="Go to previous page"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline ml-1">Previous</span>
        </Button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, index) => {
            if (page === "ellipsis") {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-3 py-2 text-muted-foreground"
                  aria-hidden="true"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </span>
              );
            }

            return (
              <Button
                key={page}
                variant={page === currentPage ? "primary" : "ghost"}
                size={size}
                onClick={() => handlePageClick(page)}
                disabled={disabled}
                aria-label={`Go to page ${page}`}
                aria-current={page === currentPage ? "page" : undefined}
                className={cn("min-w-[40px]")}
              >
                {page}
              </Button>
            );
          })}
        </div>

        {/* Next page button */}
        <Button
          variant="ghost"
          size={size}
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={currentPage === totalPages || disabled}
          aria-label="Go to next page"
        >
          <span className="hidden sm:inline mr-1">Next</span>
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Last page button */}
        {showFirstLast && (
          <Button
            variant="ghost"
            size={size}
            onClick={() => handlePageClick(totalPages)}
            disabled={currentPage === totalPages || disabled}
            aria-label="Go to last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Page info (right side on larger screens) */}
      {!showItemsInfo && (
        <div className="text-sm text-muted-foreground hidden sm:block">
          Page {currentPage} of {totalPages}
        </div>
      )}
    </nav>
  );
};

Pagination.displayName = "Pagination";
