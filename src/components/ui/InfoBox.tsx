/**
 * InfoBox Component
 * Reusable callout box for displaying contextual information
 * Supports different variants with appropriate styling
 */

import * as React from 'react';
import { cn } from '@/core/base/utils/cn';
import { Info, AlertTriangle, CheckCircle, AlertCircle, Lightbulb } from 'lucide-react';

export type InfoBoxVariant = 'info' | 'success' | 'warning' | 'error' | 'tip';

export interface InfoBoxProps {
  variant?: InfoBoxVariant;
  title?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

const variantConfig: Record<
  InfoBoxVariant,
  {
    container: string;
    title: string;
    text: string;
    icon: React.ReactNode;
  }
> = {
  info: {
    container: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    title: 'text-blue-900 dark:text-blue-100',
    text: 'text-blue-800 dark:text-blue-200',
    icon: <Info className="h-4 w-4" />,
  },
  success: {
    container: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    title: 'text-green-900 dark:text-green-100',
    text: 'text-green-800 dark:text-green-200',
    icon: <CheckCircle className="h-4 w-4" />,
  },
  warning: {
    container: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
    title: 'text-orange-900 dark:text-orange-100',
    text: 'text-orange-800 dark:text-orange-200',
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  error: {
    container: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    title: 'text-red-900 dark:text-red-100',
    text: 'text-red-800 dark:text-red-200',
    icon: <AlertCircle className="h-4 w-4" />,
  },
  tip: {
    container: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
    title: 'text-purple-900 dark:text-purple-100',
    text: 'text-purple-800 dark:text-purple-200',
    icon: <Lightbulb className="h-4 w-4" />,
  },
};

export const InfoBox: React.FC<InfoBoxProps> = ({
  variant = 'info',
  title,
  children,
  icon,
  className,
}) => {
  const config = variantConfig[variant];
  const displayIcon = icon || config.icon;

  return (
    <div className={cn('p-4 border rounded-lg', config.container, className)}>
      {(title || displayIcon) && (
        <div className="flex items-center gap-2 mb-2">
          {displayIcon && <div className={config.title}>{displayIcon}</div>}
          {title && <h4 className={cn('text-sm font-medium', config.title)}>{title}</h4>}
        </div>
      )}
      <div className={cn('text-xs', !title && !displayIcon && 'mt-0', config.text)}>
        {children}
      </div>
    </div>
  );
};

InfoBox.displayName = 'InfoBox';
