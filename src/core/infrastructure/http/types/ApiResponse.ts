/**
 * API Response Types
 * Standard response format for all API endpoints
 */

/**
 * Standard API Response format
 * Ensures consistent response structure across all endpoints
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
  };
}
