/**
 * DateTimePicker Component
 * Enhanced datetime input with validation
 */

'use client';

import * as React from 'react';
import { Calendar, Clock } from 'lucide-react';
import { Input, type InputProps } from './Input';

export interface DateTimePickerProps extends Omit<InputProps, 'type' | 'leftIcon'> {
  /** Show calendar icon */
  showIcon?: boolean;
  /** Datetime format (datetime-local, date, time) */
  dateType?: 'datetime-local' | 'date' | 'time';
}

/**
 * DateTimePicker - Input for selecting dates and times
 * Uses native HTML5 datetime inputs with custom styling
 */
export const DateTimePicker = React.forwardRef<HTMLInputElement, DateTimePickerProps>(
  ({ showIcon = true, dateType = 'datetime-local', ...props }, ref) => {
    const icon = dateType === 'time' ? <Clock className="h-4 w-4" /> : <Calendar className="h-4 w-4" />;

    return <Input ref={ref} type={dateType} leftIcon={showIcon ? icon : undefined} {...props} />;
  }
);

DateTimePicker.displayName = 'DateTimePicker';

export interface DateRangePickerProps {
  startDate?: string;
  endDate?: string;
  onStartChange?: (value: string) => void;
  onEndChange?: (value: string) => void;
  startLabel?: string;
  endLabel?: string;
  startError?: string;
  endError?: string;
  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * DateRangePicker - Input for selecting a date range
 */
export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  startLabel = 'Start Date',
  endLabel = 'End Date',
  startError,
  endError,
  required,
  disabled,
  fullWidth,
  size = 'md',
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <DateTimePicker
        label={startLabel}
        value={startDate}
        onChange={(e) => onStartChange?.(e.target.value)}
        error={startError}
        required={required}
        disabled={disabled}
        fullWidth={fullWidth}
        size={size}
        dateType="date"
        max={endDate}
      />
      <DateTimePicker
        label={endLabel}
        value={endDate}
        onChange={(e) => onEndChange?.(e.target.value)}
        error={endError}
        required={required}
        disabled={disabled}
        fullWidth={fullWidth}
        size={size}
        dateType="date"
        min={startDate}
      />
    </div>
  );
};

DateRangePicker.displayName = 'DateRangePicker';
