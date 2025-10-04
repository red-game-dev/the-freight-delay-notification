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
  const baseDate = typeof date === "string" ? new Date(date) : date;
  return new Date(
    baseDate.getTime() - hours * TIME_CONSTANTS.MILLISECONDS_PER_HOUR,
  );
}

// ===== Scheduling Utilities =====

/**
 * Calculate the next scheduled run timestamp
 * @param startTime - Start timestamp (or last check time if provided)
 * @param intervalMinutes - Interval between runs in minutes
 * @param completedRuns - Number of runs already completed (unused if lastCheckTime provided)
 * @param lastCheckTime - Optional: timestamp of last check (more accurate for running workflows)
 * @returns Unix timestamp (milliseconds) of the next scheduled run
 */
export function calculateNextRunTime(
  startTime: string,
  intervalMinutes: number,
  completedRuns: number,
  lastCheckTime?: string,
): number {
  const intervalMs = intervalMinutes * TIME_CONSTANTS.MILLISECONDS_PER_MINUTE;

  // If we have the last check time, use it for accuracy (especially for restarted workflows)
  if (lastCheckTime) {
    const lastCheckMs = new Date(lastCheckTime).getTime();
    return lastCheckMs + intervalMs;
  }

  // Fallback: calculate based on start time + completed runs
  // This is less accurate for workflows that were stopped/restarted
  const startTimeMs = new Date(startTime).getTime();
  return startTimeMs + (completedRuns + 1) * intervalMs;
}

/**
 * Calculate and format the next scheduled run time
 * @param startTime - Start timestamp
 * @param intervalMinutes - Interval between runs in minutes
 * @param completedRuns - Number of runs already completed
 * @returns Formatted string like "in 2h 15m" or null if next run is past
 * @deprecated Use calculateNextRunTime with CountdownTimer component instead
 */
export function formatNextScheduledTime(
  startTime: string,
  intervalMinutes: number,
  completedRuns: number,
): string | null {
  const nextRunTime = calculateNextRunTime(
    startTime,
    intervalMinutes,
    completedRuns,
  );
  const now = Date.now();
  const timeUntilNext = nextRunTime - now;

  if (timeUntilNext < 0) {
    return "Running now...";
  }

  const hours = Math.floor(
    timeUntilNext / TIME_CONSTANTS.MILLISECONDS_PER_HOUR,
  );
  const minutes = Math.floor(
    (timeUntilNext % TIME_CONSTANTS.MILLISECONDS_PER_HOUR) /
      TIME_CONSTANTS.MILLISECONDS_PER_MINUTE,
  );
  const seconds = Math.floor(
    (timeUntilNext % TIME_CONSTANTS.MILLISECONDS_PER_MINUTE) /
      TIME_CONSTANTS.MILLISECONDS_PER_SECOND,
  );

  if (hours > 0) {
    return `in ${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `in ${minutes}m ${seconds}s`;
  }
  return `in ${seconds}s`;
}
