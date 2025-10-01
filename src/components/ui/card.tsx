/**
 * Card component for consistent card layouts
 * Simplified version using Tailwind classes
 */

'use client';

import * as React from 'react';
import { cn } from '@/core/base/utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  variant?: 'default' | 'elevated' | 'outlined';
}

const variantStyles = {
  default: 'bg-card border',
  elevated: 'bg-card shadow-lg',
  outlined: 'bg-card border-2',
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ interactive = false, variant = 'default', className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg overflow-hidden',
          variantStyles[variant],
          interactive && 'hover:shadow-md transition-shadow cursor-pointer',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export interface CardHeaderProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  actions,
  className,
  children,
}) => {
  if (children) {
    return <div className={cn('p-6', className)}>{children}</div>;
  }

  return (
    <div className={cn('flex items-start justify-between p-6', className)}>
      <div className="flex-1">
        {title && <h3 className="text-lg font-semibold">{title}</h3>}
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
};

CardHeader.displayName = 'CardHeader';

export interface CardBodyProps {
  className?: string;
  children?: React.ReactNode;
}

export const CardBody: React.FC<CardBodyProps> = ({ className, children }) => {
  return <div className={cn('p-6 pt-0', className)}>{children}</div>;
};

CardBody.displayName = 'CardBody';

export interface CardFooterProps {
  className?: string;
  children?: React.ReactNode;
}

export const CardFooter: React.FC<CardFooterProps> = ({ className, children }) => {
  return <div className={cn('px-6 py-4 border-t bg-muted/50', className)}>{children}</div>;
};

CardFooter.displayName = 'CardFooter';
