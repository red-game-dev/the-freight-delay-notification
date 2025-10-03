/**
 * Button component with multiple variants and sizes
 * Simplified version using Tailwind classes
 */

'use client';

import { ButtonHTMLAttributes, FC, ReactNode, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/core/base/utils/cn';

export type ButtonVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'error'
  | 'warning'
  | 'ghost'
  | 'outline'
  | 'link';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  iconOnly?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  default: 'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700',
  primary: 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600',
  secondary: 'bg-purple-600 text-white hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600',
  success: 'bg-green-600 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600',
  error: 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600',
  warning: 'bg-yellow-600 text-white hover:bg-yellow-700 dark:bg-yellow-700 dark:hover:bg-yellow-600',
  ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800',
  outline: 'border-2 border-gray-300 bg-transparent hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800',
  link: 'bg-transparent text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline-offset-4 hover:underline',
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: 'px-2 py-1 text-xs gap-1',
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-base gap-2',
  lg: 'px-5 py-2.5 text-lg gap-2.5',
  xl: 'px-6 py-3 text-xl gap-3',
};

const iconOnlySizes: Record<ButtonSize, string> = {
  xs: 'h-6 w-6',
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-14 w-14',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'default',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      iconOnly = false,
      className = '',
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-lg',
          'transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variantStyles[variant],
          iconOnly ? iconOnlySizes[size] : sizeStyles[size],
          fullWidth && 'w-full',
          className
        )}
        disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" size={16} />
            {!iconOnly && <span className="ml-2">Loading...</span>}
          </>
        ) : (
          <>
            {leftIcon && <span className="inline-flex">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="inline-flex">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export interface ButtonGroupProps {
  spacing?: 'xs' | 'sm' | 'md' | 'lg';
  direction?: 'horizontal' | 'vertical';
  className?: string;
  children?: ReactNode;
}

export const ButtonGroup: FC<ButtonGroupProps> = ({
  spacing = 'sm',
  direction = 'horizontal',
  className = '',
  children,
}) => {
  const spacingMap = {
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-3',
    lg: 'gap-4',
  };

  return (
    <div
      className={`inline-flex ${
        direction === 'vertical' ? 'flex-col' : 'flex-row'
      } ${spacingMap[spacing]} ${className}`}
    >
      {children}
    </div>
  );
};

ButtonGroup.displayName = 'ButtonGroup';
