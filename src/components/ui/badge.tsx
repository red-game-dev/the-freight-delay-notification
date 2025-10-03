/**
 * Badge component for status indicators and labels
 */

'use client';

import { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/core/base/utils/cn';

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'error'
  | 'warning'
  | 'info';

export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
  children: ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100',
  primary: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  secondary: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
  success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
  info: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-100',
};

export function Badge({
  variant = 'default',
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
