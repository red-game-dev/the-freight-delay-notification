/**
 * Dropdown/Select component for forms
 * Enhanced with validation states and accessibility
 */

'use client';

import * as React from 'react';
import { ChevronDown, Check, AlertCircle, CheckCircle2 } from 'lucide-react';

export type SelectSize = 'sm' | 'md' | 'lg';
export type SelectState = 'default' | 'success' | 'error' | 'warning';

export interface DropdownOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface DropdownProps {
  options: DropdownOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  size?: SelectSize;
  state?: SelectState;
  required?: boolean;
  id?: string;
}

const sizeClasses: Record<SelectSize, string> = {
  sm: 'px-2.5 py-1.5 text-sm',
  md: 'px-3 py-2 text-base',
  lg: 'px-4 py-3 text-lg',
};

const getStateIcon = (state: SelectState): React.ReactNode => {
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

export const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  className = '',
  label,
  error,
  helperText,
  fullWidth = false,
  size = 'md',
  state = 'default',
  required,
  id,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const selectId = React.useId();
  const actualId = id || selectId;
  const actualState = error ? 'error' : state;
  const stateIcon = actualState !== 'default' ? getStateIcon(actualState) : null;

  const selectedOption = options.find((opt) => opt.value === value);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        setIsOpen(!isOpen);
        break;
      case 'Escape':
        setIsOpen(false);
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) setIsOpen(true);
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (!isOpen) setIsOpen(true);
        break;
    }
  };

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label htmlFor={actualId} className="block text-sm font-medium mb-1.5">
          {label}
          {required && <span className="text-red-600 dark:text-red-400 ml-1">*</span>}
        </label>
      )}
      <div ref={dropdownRef} className={`relative ${className}`}>
        <button
          type="button"
          id={actualId}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-invalid={actualState === 'error'}
          aria-describedby={error ? `${actualId}-error` : helperText ? `${actualId}-helper` : undefined}
          className={`
            w-full flex items-center justify-between rounded-lg border
            bg-background text-foreground
            focus:outline-none focus:ring-2 focus:ring-primary
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
            ${sizeClasses[size]}
            ${error ? 'border-red-500 focus:ring-red-500' : 'border-input'}
            ${isOpen ? 'ring-2 ring-primary' : ''}
          `}
        >
          <span className={selectedOption ? '' : 'text-muted-foreground'}>
            {selectedOption?.label || placeholder}
          </span>
          <div className="flex items-center gap-2">
            {stateIcon}
            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {isOpen && (
          <div
            role="listbox"
            className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-60 overflow-auto"
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={value === option.value}
                onClick={() => {
                  if (!option.disabled) {
                    onChange?.(option.value);
                    setIsOpen(false);
                  }
                }}
                disabled={option.disabled}
                className={`
                  w-full flex items-center justify-between px-3 py-2 text-left
                  hover:bg-muted transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${value === option.value ? 'bg-muted' : ''}
                `}
              >
                <span>{option.label}</span>
                {value === option.value && <Check className="h-4 w-4" />}
              </button>
            ))}
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
};

Dropdown.displayName = 'Dropdown';

// Export as Select alias for better semantics
export const Select = Dropdown;
