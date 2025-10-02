/**
 * Environment Detection Utilities
 * Works in both client and server contexts
 */

/**
 * Get current NODE_ENV
 * Works in both client and server contexts
 */
export function getNodeEnv(): 'development' | 'production' | 'test' {
  // In Next.js, process.env.NODE_ENV is available in both client and server
  return (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development';
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return getNodeEnv() === 'development';
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return getNodeEnv() === 'production';
}

/**
 * Check if running in test mode
 */
export function isTest(): boolean {
  return getNodeEnv() === 'test';
}
