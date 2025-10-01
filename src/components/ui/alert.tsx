/**
 * Alert component for notifications and messages
 */

'use client';

import * as React from 'react';
import { AlertCircle, CheckCircle, XCircle, AlertTriangle, Info, X, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/core/base/utils/cn';

export interface AlertAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'primary';
}

export interface AlertProps {
  children: React.ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'error' | 'default';
  title?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
  /** Additional details shown in collapsible section */
  details?: React.ReactNode;
  /** Action buttons shown at the bottom */
  actions?: AlertAction[];
  /** Default expanded state for details */
  defaultExpanded?: boolean;
}

const variantStyles = {
  default: {
    container: 'bg-gray-50 border-gray-200 text-gray-800 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100',
    border: 'border-gray-200 dark:border-gray-700',
    button: 'text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100',
  },
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-100',
    border: 'border-blue-200 dark:border-blue-700',
    button: 'text-blue-700 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-100',
  },
  success: {
    container: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-100',
    border: 'border-green-200 dark:border-green-700',
    button: 'text-green-700 hover:text-green-900 dark:text-green-300 dark:hover:text-green-100',
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-100',
    border: 'border-yellow-200 dark:border-yellow-700',
    button: 'text-yellow-700 hover:text-yellow-900 dark:text-yellow-300 dark:hover:text-yellow-100',
  },
  error: {
    container: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-100',
    border: 'border-red-200 dark:border-red-700',
    button: 'text-red-700 hover:text-red-900 dark:text-red-300 dark:hover:text-red-100',
  },
};

const icons = {
  default: AlertCircle,
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
};

export function Alert({
  children,
  variant = 'default',
  title,
  dismissible = false,
  onDismiss,
  className,
  details,
  actions,
  defaultExpanded = false,
}: AlertProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);
  const Icon = icons[variant];
  const styles = variantStyles[variant];

  return (
    <div
      className={cn('border rounded-lg', styles.container, className)}
      role="alert"
    >
      <div className="flex gap-3 p-4">
        <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          {title && (
            <h5 className="font-semibold mb-1">{title}</h5>
          )}
          <div className="text-sm">{children}</div>
        </div>
        {dismissible && onDismiss && (
          <button
            onClick={onDismiss}
            className={cn('flex-shrink-0 hover:opacity-70 transition-opacity', styles.button)}
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Collapsible Details */}
      {details && (
        <>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              'w-full flex items-center justify-between px-4 py-2 text-sm font-medium border-t transition-colors',
              styles.border,
              styles.button
            )}
          >
            <span>{isExpanded ? 'Hide Details' : 'View Details'}</span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {isExpanded && (
            <div className={cn('px-4 py-3 text-sm border-t', styles.border)}>
              {details}
            </div>
          )}
        </>
      )}

      {/* Actions */}
      {actions && actions.length > 0 && (
        <div className={cn('flex items-center gap-2 px-4 py-3 border-t', styles.border)}>
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded transition-colors',
                action.variant === 'primary'
                  ? 'bg-current/10 hover:bg-current/20'
                  : 'hover:bg-current/10'
              )}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
