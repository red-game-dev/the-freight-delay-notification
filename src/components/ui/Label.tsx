/**
 * Label Component
 * Accessible form label with consistent styling
 */

import { LabelHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/core/base/utils/cn';

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  /** Show required asterisk */
  required?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Disabled state */
  disabled?: boolean;
}

const sizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ children, required, size = 'md', disabled, className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          'block font-medium',
          sizeClasses[size],
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && 'cursor-pointer',
          className
        )}
        {...props}
      >
        {children}
        {required && <span className="text-red-600 dark:text-red-400 ml-1">*</span>}
      </label>
    );
  }
);

Label.displayName = 'Label';
