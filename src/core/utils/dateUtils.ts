/**
 * Date and Time Utilities
 * Shared utility functions for date/time calculations and formatting
 */

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
  const intervalMs = intervalMinutes * 60 * 1000;
  const startTimeMs = new Date(startTime).getTime();
  const now = Date.now();

  // Next run is: start time + (completed runs + 1) * interval
  const nextRunTime = startTimeMs + ((completedRuns + 1) * intervalMs);
  const timeUntilNext = nextRunTime - now;

  if (timeUntilNext < 0) {
    return 'Running now...';
  }

  const hours = Math.floor(timeUntilNext / (60 * 60 * 1000));
  const minutes = Math.floor((timeUntilNext % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((timeUntilNext % (60 * 1000)) / 1000);

  if (hours > 0) {
    return `in ${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `in ${minutes}m ${seconds}s`;
  }
  return `in ${seconds}s`;
}
