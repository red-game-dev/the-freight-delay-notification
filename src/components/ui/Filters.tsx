/**
 * Filters Component
 * Reusable filter controls for lists and tables
 */

import { Filter, X } from "lucide-react";
import type { FC } from "react";
import { cn } from "@/core/base/utils/cn";
import { Button } from "./Button";
import { Input } from "./Input";
import { Select, type SelectOptionGroup } from "./Select";

export interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

export interface FilterDefinition {
  id: string;
  label: string;
  type: "select" | "search" | "button-group";
  options?: FilterOption[];
  optionGroups?: SelectOptionGroup[];
  placeholder?: string;
  value?: string | string[];
  multiple?: boolean;
}

export interface FiltersProps {
  filters: FilterDefinition[];
  onFilterChange: (filterId: string, value: string | string[]) => void;
  onClearAll?: () => void;
  showClearAll?: boolean;
  className?: string;
  /** Compact layout for mobile */
  compact?: boolean;
}

export const Filters: FC<FiltersProps> = ({
  filters,
  onFilterChange,
  onClearAll,
  showClearAll = true,
  className,
  compact = false,
}) => {
  const hasActiveFilters = filters.some((f) => {
    if (Array.isArray(f.value)) {
      return f.value.length > 0;
    }
    return f.value && f.value !== "all";
  });

  return (
    <div className={cn("space-y-4", className)}>
      {/* Filter Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">Filters</span>
        </div>
        {showClearAll && hasActiveFilters && onClearAll && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            leftIcon={<X className="h-4 w-4" />}
            className="text-xs"
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Filter Controls */}
      <div
        className={cn(
          "grid gap-4",
          compact ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        )}
      >
        {filters.map((filter) => (
          <div key={filter.id}>
            {filter.type === "search" && (
              <Input
                label={filter.label}
                placeholder={filter.placeholder || "Search..."}
                value={(filter.value as string) || ""}
                onChange={(e) => onFilterChange(filter.id, e.target.value)}
                fullWidth
                size="sm"
              />
            )}

            {filter.type === "select" && (
              <Select
                label={filter.label}
                value={(filter.value as string) || "all"}
                onChange={(e) => onFilterChange(filter.id, e.target.value)}
                options={filter.options?.map((opt) => ({
                  label:
                    opt.count !== undefined
                      ? `${opt.label} (${opt.count})`
                      : opt.label,
                  value: opt.value,
                }))}
                optionGroups={filter.optionGroups}
                fullWidth
                size="sm"
              />
            )}

            {filter.type === "button-group" && (
              <div className="space-y-1.5">
                <div className="block text-sm font-medium">{filter.label}</div>
                <div className="flex flex-wrap gap-2">
                  {filter.options?.map((option) => (
                    <Button
                      key={option.value}
                      variant={
                        filter.value === option.value ? "primary" : "outline"
                      }
                      size="sm"
                      onClick={() => onFilterChange(filter.id, option.value)}
                      className="text-xs"
                    >
                      {option.label}
                      {option.count !== undefined && ` (${option.count})`}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

Filters.displayName = "Filters";
