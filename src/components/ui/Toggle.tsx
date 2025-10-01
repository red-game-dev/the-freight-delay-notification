/**
 * Toggle/Switch component for boolean states
 * Perfect for theme toggles, settings, feature flags
 */

'use client';

import * as React from 'react';

export interface ToggleProps {
  /** Whether the toggle is checked */
  checked: boolean;
  /** Callback when toggle state changes */
  onChange: (checked: boolean) => void;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Disabled state */
  disabled?: boolean;
  /** Label for the toggle */
  label?: string;
  /** Icon to show when checked */
  checkedIcon?: React.ReactNode;
  /** Icon to show when unchecked */
  uncheckedIcon?: React.ReactNode;
  /** Accessible label */
  ariaLabel?: string;
  /** Custom className */
  className?: string;
}

const sizeConfig = {
  sm: {
    track: 'w-9 h-5',
    thumb: 'w-4 h-4',
    translate: 'translate-x-4',
    icon: 'w-3 h-3',
  },
  md: {
    track: 'w-11 h-6',
    thumb: 'w-5 h-5',
    translate: 'translate-x-5',
    icon: 'w-3.5 h-3.5',
  },
  lg: {
    track: 'w-14 h-7',
    thumb: 'w-6 h-6',
    translate: 'translate-x-7',
    icon: 'w-4 h-4',
  },
};

export function Toggle({
  checked,
  onChange,
  size = 'md',
  disabled = false,
  label,
  checkedIcon,
  uncheckedIcon,
  ariaLabel,
  className = '',
}: ToggleProps) {
  const config = sizeConfig[size];

  const handleClick = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel || label}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`
          relative inline-flex items-center flex-shrink-0 rounded-full
          transition-colors duration-200 ease-in-out
          focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
          ${config.track}
          ${
            checked
              ? 'bg-primary-600 dark:bg-primary-500'
              : 'bg-gray-300 dark:bg-gray-700'
          }
          ${
            disabled
              ? 'opacity-50 cursor-not-allowed'
              : 'cursor-pointer hover:bg-primary-700 dark:hover:bg-primary-600'
          }
        `}
      >
        <span
          className={`
            inline-flex items-center justify-center rounded-full
            bg-white shadow-lg transform transition-transform duration-200 ease-in-out
            ${config.thumb}
            ${checked ? config.translate : 'translate-x-0.5'}
          `}
        >
          {checked && checkedIcon && (
            <span className={`text-primary-600 ${config.icon}`}>
              {checkedIcon}
            </span>
          )}
          {!checked && uncheckedIcon && (
            <span className={`text-gray-600 ${config.icon}`}>
              {uncheckedIcon}
            </span>
          )}
        </span>
      </button>
      {label && (
        <span
          className={`
            text-sm font-medium
            ${disabled ? 'text-gray-400 dark:text-gray-600' : 'text-gray-900 dark:text-gray-100'}
          `}
        >
          {label}
        </span>
      )}
    </div>
  );
}
