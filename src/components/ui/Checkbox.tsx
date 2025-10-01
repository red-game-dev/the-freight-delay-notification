/**
 * Checkbox Component
 * Reusable checkbox with label and helper text
 */

import * as React from 'react';
import { cn } from '@/core/base/utils/cn';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, helperText, error, className, ...props }, ref) => {
    return (
      <div className="flex items-start gap-2">
        <input
          ref={ref}
          type="checkbox"
          className={cn(
            'mt-1 h-4 w-4 rounded border-border bg-background',
            'text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-error',
            className
          )}
          {...props}
        />
        {(label || helperText) && (
          <div className="flex-1">
            {label && (
              <label className="text-sm font-medium leading-none cursor-pointer">
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
  }
);

Checkbox.displayName = 'Checkbox';
