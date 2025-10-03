/**
 * PageHeader Component
 * Consistent page title and description layout
 */

import { FC, ReactNode } from 'react';
import { cn } from '@/core/base/utils/cn';

export interface PageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

export const PageHeader: FC<PageHeaderProps> = ({
  title,
  description,
  children,
  className,
}) => {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm sm:text-base text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
};

PageHeader.displayName = 'PageHeader';
