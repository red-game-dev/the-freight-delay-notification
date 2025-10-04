/**
 * CountdownTimer Component
 * Live countdown timer with color variants based on time remaining
 */

'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/core/base/utils/cn';

interface CountdownTimerProps {
  /** Target timestamp to count down to */
  targetTime: number;
  /** Show icon */
  showIcon?: boolean;
  /** Prefix text (e.g., "Next check") */
  prefix?: string;
  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Custom className */
  className?: string;
  /** Callback when countdown reaches zero */
  onComplete?: () => void;
}

interface TimeRemaining {
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

/**
 * Get color variant based on time remaining
 */
function getColorVariant(totalSeconds: number): {
  text: string;
  background?: string;
} {
  // Critical: < 5 minutes
  if (totalSeconds < 300) {
    return {
      text: 'text-red-600 dark:text-red-400',
      background: 'bg-red-50 dark:bg-red-900/10',
    };
  }
  // Warning: < 15 minutes
  if (totalSeconds < 900) {
    return {
      text: 'text-orange-600 dark:text-orange-400',
      background: 'bg-orange-50 dark:bg-orange-900/10',
    };
  }
  // Caution: < 30 minutes
  if (totalSeconds < 1800) {
    return {
      text: 'text-yellow-600 dark:text-yellow-400',
      background: 'bg-yellow-50 dark:bg-yellow-900/10',
    };
  }
  // Normal: >= 30 minutes
  return {
    text: 'text-blue-600 dark:text-blue-400',
    background: 'bg-blue-50 dark:bg-blue-900/10',
  };
}

/**
 * Calculate time remaining
 */
function calculateTimeRemaining(targetTime: number): TimeRemaining {
  const now = Date.now();
  const diff = Math.max(0, targetTime - now);

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return {
    hours,
    minutes,
    seconds,
    total: Math.floor(diff / 1000),
  };
}

/**
 * Format time remaining as string
 */
function formatTimeRemaining(time: TimeRemaining): string {
  if (time.total <= 0) {
    return 'Running now...';
  }

  if (time.hours > 0) {
    return `in ${time.hours}h ${time.minutes}m ${time.seconds}s`;
  } else if (time.minutes > 0) {
    return `in ${time.minutes}m ${time.seconds}s`;
  }
  return `in ${time.seconds}s`;
}

const sizeClasses = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

const iconSizeClasses = {
  xs: 'h-3 w-3',
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

export function CountdownTimer({
  targetTime,
  showIcon = true,
  prefix = 'Next check',
  size = 'sm',
  className,
  onComplete,
}: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(
    calculateTimeRemaining(targetTime)
  );

  useEffect(() => {
    // Update immediately
    setTimeRemaining(calculateTimeRemaining(targetTime));

    // Then update every second
    const interval = setInterval(() => {
      const newTime = calculateTimeRemaining(targetTime);
      setTimeRemaining(newTime);

      // Call onComplete when countdown reaches zero
      if (newTime.total === 0 && onComplete) {
        onComplete();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetTime, onComplete]);

  const colorVariant = getColorVariant(timeRemaining.total);
  const formattedTime = formatTimeRemaining(timeRemaining);

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-md font-medium transition-colors',
        sizeClasses[size],
        colorVariant.text,
        colorVariant.background,
        className
      )}
    >
      {showIcon && <Clock className={cn(iconSizeClasses[size], 'flex-shrink-0')} />}
      <span className="whitespace-nowrap">
        {prefix && `${prefix} `}
        {formattedTime}
      </span>
    </div>
  );
}

/**
 * Inline variant without background
 */
export function CountdownTimerInline({
  targetTime,
  showIcon = true,
  prefix = 'Next check',
  size = 'sm',
  className,
}: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(
    calculateTimeRemaining(targetTime)
  );

  useEffect(() => {
    setTimeRemaining(calculateTimeRemaining(targetTime));

    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining(targetTime));
    }, 1000);

    return () => clearInterval(interval);
  }, [targetTime]);

  const colorVariant = getColorVariant(timeRemaining.total);
  const formattedTime = formatTimeRemaining(timeRemaining);

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 font-medium',
        sizeClasses[size],
        colorVariant.text,
        className
      )}
    >
      {showIcon && <Clock className={cn(iconSizeClasses[size], 'flex-shrink-0')} />}
      <span className="whitespace-nowrap">
        {prefix && `${prefix} `}
        {formattedTime}
      </span>
    </div>
  );
}
