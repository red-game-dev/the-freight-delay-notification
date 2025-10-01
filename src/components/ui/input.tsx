/**
 * Input component for forms
 * Enhanced with validation states and accessibility
 */

'use client';

import * as React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export type InputSize = 'sm' | 'md' | 'lg';
export type InputState = 'default' | 'success' | 'error' | 'warning';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  size?: InputSize;
  state?: InputState;
  showStateIcon?: boolean;
}

const sizeClasses: Record<InputSize, string> = {
  sm: 'px-2.5 py-1.5 text-sm',
  md: 'px-3 py-2 text-base',
  lg: 'px-4 py-3 text-lg',
};

const getStateIcon = (state: InputState): React.ReactNode => {
  switch (state) {
    case 'success':
      return <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />;
    case 'error':
      return <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
    case 'warning':
      return <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />;
    default:
      return null;
  }
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      size = 'md',
      state = 'default',
      showStateIcon = true,
      className = '',
      required,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = React.useId();
    const actualId = id || inputId;
    const actualState = error ? 'error' : state;
    const stateIcon = showStateIcon && !rightIcon && actualState !== 'default' ? getStateIcon(actualState) : null;

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label htmlFor={actualId} className="block text-sm font-medium mb-1.5">
            {label}
            {required && <span className="text-red-600 dark:text-red-400 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={actualId}
            required={required}
            className={`
              w-full rounded-lg border
              bg-background text-foreground
              focus:outline-none focus:ring-2 focus:ring-primary
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors
              ${sizeClasses[size]}
              ${error ? 'border-red-500 focus:ring-red-500' : 'border-input'}
              ${leftIcon ? 'pl-10' : ''}
              ${rightIcon || stateIcon ? 'pr-10' : ''}
              ${className}
            `}
            aria-invalid={actualState === 'error'}
            aria-describedby={error ? `${actualId}-error` : helperText ? `${actualId}-helper` : undefined}
            {...props}
          />
          {(rightIcon || stateIcon) && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              {rightIcon || stateIcon}
            </div>
          )}
        </div>
        {error && (
          <p id={`${actualId}-error`} className="text-sm text-red-600 dark:text-red-400 mt-1.5">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p
            id={`${actualId}-helper`}
            className={`text-sm mt-1.5 ${
              actualState === 'success'
                ? 'text-green-600 dark:text-green-400'
                : actualState === 'warning'
                ? 'text-orange-600 dark:text-orange-400'
                : 'text-muted-foreground'
            }`}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  size?: InputSize;
  state?: InputState;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
      size = 'md',
      state = 'default',
      className = '',
      required,
      id,
      ...props
    },
    ref
  ) => {
    const textareaId = React.useId();
    const actualId = id || textareaId;
    const actualState = error ? 'error' : state;

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label htmlFor={actualId} className="block text-sm font-medium mb-1.5">
            {label}
            {required && <span className="text-red-600 dark:text-red-400 ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={actualId}
          required={required}
          className={`
            w-full rounded-lg border
            bg-background text-foreground
            focus:outline-none focus:ring-2 focus:ring-primary
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors resize-y min-h-20
            ${sizeClasses[size]}
            ${error ? 'border-red-500 focus:ring-red-500' : 'border-input'}
            ${className}
          `}
          aria-invalid={actualState === 'error'}
          aria-describedby={error ? `${actualId}-error` : helperText ? `${actualId}-helper` : undefined}
          {...props}
        />
        {error && (
          <p id={`${actualId}-error`} className="text-sm text-red-600 dark:text-red-400 mt-1.5">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p
            id={`${actualId}-helper`}
            className={`text-sm mt-1.5 ${
              actualState === 'success'
                ? 'text-green-600 dark:text-green-400'
                : actualState === 'warning'
                ? 'text-orange-600 dark:text-orange-400'
                : 'text-muted-foreground'
            }`}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
