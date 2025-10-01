/**
 * API Handler Options
 * Configuration options for API handlers
 */

export interface ApiHandlerOptions {
  /**
   * Custom error handler callback
   * Called before sending error response
   */
  onError?: (error: Error) => void;

  /**
   * Include timestamp in response meta
   * @default true
   */
  includeTimestamp?: boolean;

  /**
   * Custom success status code
   * @default 200
   */
  successStatus?: number;
}
