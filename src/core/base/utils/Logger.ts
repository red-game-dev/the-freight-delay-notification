/**
 * Simple Logger Utility
 * Provides consistent logging across the application
 */

import { isDevelopment } from './environment';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private isDev = isDevelopment();

  debug(message: string, ...args: unknown[]): void {
    if (this.isDev) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    console.info(`[INFO] ${message}`, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    console.warn(`[WARN] ${message}`, ...args);
  }

  error(message: string, error?: unknown, ...args: unknown[]): void {
    console.error(`[ERROR] ${message}`, error, ...args);
  }

  log(level: LogLevel, message: string, ...args: unknown[]): void {
    switch (level) {
      case 'debug':
        this.debug(message, ...args);
        break;
      case 'info':
        this.info(message, ...args);
        break;
      case 'warn':
        this.warn(message, ...args);
        break;
      case 'error':
        this.error(message, ...args);
        break;
    }
  }
}

export const logger = new Logger();

/**
 * Extract error message from unknown error
 * Helper for working with error: unknown in catch blocks
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return String(error);
}

/**
 * Type guard to check if unknown value is an Error
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Type guard to check if unknown value has message property
 */
export function hasMessage(error: unknown): error is { message: string } {
  return (
    error !== null &&
    error !== undefined &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  );
}

/**
 * Type guard to check if unknown value has code property
 */
export function hasCode(error: unknown): error is { code: string | number } {
  return (
    error !== null &&
    error !== undefined &&
    typeof error === 'object' &&
    'code' in error
  );
}

/**
 * Type guard to check if unknown value has name property
 */
export function hasName(error: unknown): error is { name: string } {
  return (
    error !== null &&
    error !== undefined &&
    typeof error === 'object' &&
    'name' in error &&
    typeof (error as { name: unknown }).name === 'string'
  );
}

/**
 * Type guard to check if unknown value has cause property
 */
export function hasCause(error: unknown): error is { cause: unknown } {
  return (
    error !== null &&
    error !== undefined &&
    typeof error === 'object' &&
    'cause' in error
  );
}