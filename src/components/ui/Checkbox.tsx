/**
 * Checkbox Component
 * Reusable checkbox with label and helper text
 */

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/core/base/utils/cn";
import { generateShortId } from "@/core/utils/idUtils";

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, helperText, error, className, id, ...props }, ref) => {
    // Generate a unique ID if not provided
    const checkboxId = id || `checkbox-${generateShortId()}`;

    return (
      <div className="flex items-start gap-2">
        <input
          ref={ref}
          id={checkboxId}
          type="checkbox"
          className={cn(
            "mt-1 h-4 w-4 rounded border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800",
            "text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-blue-400",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-600 dark:border-red-400",
            className,
          )}
          {...props}
        />
        {(label || helperText) && (
          <div className="flex-1">
            {label && (
              <label
                htmlFor={checkboxId}
                className="text-sm font-medium leading-none cursor-pointer"
              >
                {label}
              </label>
            )}
            {helperText && !error && (
              <p className="text-xs text-muted-foreground mt-1">{helperText}</p>
            )}
            {error && <p className="text-xs text-error mt-1">{error}</p>}
          </div>
        )}
      </div>
    );
  },
);

Checkbox.displayName = "Checkbox";
