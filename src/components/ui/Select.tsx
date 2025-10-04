/**
 * Select Component
 * Native select wrapper with design system integration
 * Supports optgroups and react-hook-form integration
 */

import { AlertCircle, CheckCircle2, ChevronDown } from "lucide-react";
import { forwardRef, type SelectHTMLAttributes, useId } from "react";
import { cn } from "@/core/base/utils/cn";

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export interface SelectOptionGroup {
  label: string;
  options: SelectOption[];
}

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  label?: string;
  helperText?: string;
  error?: string;
  options?: SelectOption[];
  optionGroups?: SelectOptionGroup[];
  fullWidth?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "px-2.5 py-1.5 text-sm",
  md: "px-3 py-2 text-base",
  lg: "px-4 py-3 text-lg",
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      helperText,
      error,
      options = [],
      optionGroups = [],
      fullWidth = false,
      size = "md",
      className,
      required,
      disabled,
      id,
      ...props
    },
    ref,
  ) => {
    const selectId = useId();
    const actualId = id || selectId;

    return (
      <div className={cn(fullWidth && "w-full")}>
        {label && (
          <label
            htmlFor={actualId}
            className="block text-sm font-medium mb-1.5"
          >
            {label}
            {required && (
              <span className="text-red-600 dark:text-red-400 ml-1">*</span>
            )}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={actualId}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={
              error
                ? `${actualId}-error`
                : helperText
                  ? `${actualId}-helper`
                  : undefined
            }
            className={cn(
              "w-full rounded-lg border bg-white dark:bg-gray-800",
              "text-gray-900 dark:text-gray-100",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-colors appearance-none",
              "pr-10", // Space for chevron icon
              sizeClasses[size],
              error
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 dark:border-gray-600",
              className,
            )}
            {...props}
          >
            {/* Render ungrouped options */}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}

            {/* Render grouped options */}
            {optionGroups.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.options.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                  >
                    {option.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>

          {/* Chevron icon */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <p
              id={`${actualId}-error`}
              className="text-sm text-red-600 dark:text-red-400"
            >
              {error}
            </p>
          </div>
        )}

        {helperText && !error && (
          <p
            id={`${actualId}-helper`}
            className="text-sm text-gray-600 dark:text-gray-400 mt-1.5"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Select.displayName = "Select";
