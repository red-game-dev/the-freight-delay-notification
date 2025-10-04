/**
 * Temporal Activity Configuration
 * Centralized timeout and retry policies for workflow activities
 */

import type { ActivityOptions } from '@temporalio/workflow';

/**
 * Fast activities configuration
 * For external APIs: traffic, AI, notifications
 * - Quick responses expected (< 2 min)
 * - Moderate retries
 */
export const FAST_ACTIVITY_CONFIG: ActivityOptions = {
  startToCloseTimeout: '2 minutes',
  retry: {
    initialInterval: '5s',
    backoffCoefficient: 2,
    maximumAttempts: 3,
    maximumInterval: '1 minute',
  },
};

/**
 * Database activities configuration
 * For database operations that may timeout (Supabase, etc.)
 * - Longer timeout to handle slow connections (5 min)
 * - More retries for transient failures
 */
export const DATABASE_ACTIVITY_CONFIG: ActivityOptions = {
  startToCloseTimeout: '5 minutes',
  retry: {
    initialInterval: '10s',
    backoffCoefficient: 2,
    maximumAttempts: 5,
    maximumInterval: '2 minutes',
  },
};

/**
 * Short activities configuration
 * For very quick operations (< 30s)
 * - Minimal timeout
 * - Few retries
 */
export const SHORT_ACTIVITY_CONFIG: ActivityOptions = {
  startToCloseTimeout: '30 seconds',
  retry: {
    initialInterval: '3s',
    backoffCoefficient: 2,
    maximumAttempts: 2,
    maximumInterval: '30s',
  },
};
