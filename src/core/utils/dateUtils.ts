/**
 * Date and Time Utilities
 * Shared utility functions for date/time calculations and formatting
 */

// ===== Time Constants =====
export const TIME_CONSTANTS = {
  MILLISECONDS_PER_SECOND: 1000,
  MILLISECONDS_PER_MINUTE: 60 * 1000,
  MILLISECONDS_PER_HOUR: 60 * 60 * 1000,
  MILLISECONDS_PER_DAY: 24 * 60 * 60 * 1000,
  SECONDS_PER_MINUTE: 60,
  SECONDS_PER_HOUR: 60 * 60,
  MINUTES_PER_HOUR: 60,
  HOURS_PER_DAY: 24,
} as const;

// ===== Current Time Utilities =====

/**
 * Get current timestamp as ISO string
 */
export function getCurrentISOTimestamp(): string {
  return new Date().toISOString();
}

// ===== Date Arithmetic =====

/**
 * Subtract hours from a date
 */
export function subtractHours(date: Date | string, hours: number): Date {
  const baseDate = typeof date === 'string' ? new Date(date) : date;
  return new Date(baseDate.getTime() - hours * TIME_CONSTANTS.MILLISECONDS_PER_HOUR);
}

// ===== Scheduling Utilities =====

/**
 * Calculate and format the next scheduled run time
 * @param startTime - Start timestamp
 * @param intervalMinutes - Interval between runs in minutes
 * @param completedRuns - Number of runs already completed
 * @returns Formatted string like "in 2h 15m" or null if next run is past
 */
export function formatNextScheduledTime(
  startTime: string,
  intervalMinutes: number,
  completedRuns: number
): string | null {
  const intervalMs = intervalMinutes * TIME_CONSTANTS.MILLISECONDS_PER_MINUTE;
  const startTimeMs = new Date(startTime).getTime();
  const now = Date.now();

  // Next run is: start time + (completed runs + 1) * interval
  const nextRunTime = startTimeMs + ((completedRuns + 1) * intervalMs);
  const timeUntilNext = nextRunTime - now;

  if (timeUntilNext < 0) {
    return 'Running now...';
  }

  const hours = Math.floor(timeUntilNext / TIME_CONSTANTS.MILLISECONDS_PER_HOUR);
  const minutes = Math.floor((timeUntilNext % TIME_CONSTANTS.MILLISECONDS_PER_HOUR) / TIME_CONSTANTS.MILLISECONDS_PER_MINUTE);
  const seconds = Math.floor((timeUntilNext % TIME_CONSTANTS.MILLISECONDS_PER_MINUTE) / TIME_CONSTANTS.MILLISECONDS_PER_SECOND);

  if (hours > 0) {
    return `in ${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `in ${minutes}m ${seconds}s`;
  }
  return `in ${seconds}s`;
}
