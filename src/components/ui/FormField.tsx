/**
 * FormField Component
 * Wrapper for form fields with consistent spacing and layout
 */

'use client';

import { FC, ReactNode, forwardRef } from 'react';

export interface FormFieldProps {
  children: ReactNode;
  className?: string;
}

/**
 * FormField - Provides consistent spacing between form fields
 */
export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  ({ children, className = '' }, ref) => {
    return (
      <div ref={ref} className={`mb-4 ${className}`}>
        {children}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

export interface FormRowProps {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

/**
 * FormRow - Organizes form fields in a grid layout
 */
export const FormRow: FC<FormRowProps> = ({ children, columns = 2, className = '' }) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return <div className={`grid ${gridCols[columns]} gap-4 ${className}`}>{children}</div>;
};

FormRow.displayName = 'FormRow';

export interface FormSectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

/**
 * FormSection - Groups related form fields with optional title and description
 */
export const FormSection: FC<FormSectionProps> = ({
  title,
  description,
  children,
  className = '',
}) => {
  return (
    <div className={`mb-8 ${className}`}>
      {(title || description) && (
        <div className="mb-4">
          {title && <h3 className="text-lg font-semibold mb-1">{title}</h3>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
};

FormSection.displayName = 'FormSection';
