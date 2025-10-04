/**
 * Error Store
 * Centralized error state management using Zustand
 *
 * Architecture:
 * - API layer dispatches errors to this store
 * - UI components subscribe to display error toasts/banners
 * - Maintains error history for debugging
 * - Supports error deduplication and batching
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Type for errors that may have additional properties
interface UnknownError extends Error {
  code?: string;
  statusCode?: number;
  data?: Record<string, unknown>;
}

export interface AppError {
  id: string;
  message: string;
  code?: string;
  timestamp: number;
  source?: string; // Which API call/component triggered it
  severity: 'error' | 'warning' | 'critical';
  metadata?: Record<string, unknown>;
  dismissed?: boolean;
}

interface ErrorStore {
  // State
  errors: AppError[];
  lastError: AppError | null;

  // Actions
  addError: (error: Omit<AppError, 'id' | 'timestamp'>) => void;
  dismissError: (id: string) => void;
  clearErrors: () => void;
  clearDismissed: () => void;

  // Getters
  getActiveErrors: () => AppError[];
  hasErrors: () => boolean;
}

export const useErrorStore = create<ErrorStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      errors: [],
      lastError: null,

      // Add error with deduplication
      addError: (error) => {
        const newError: AppError = {
          ...error,
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
        };

        set((state) => {
          // Deduplicate: check if same message exists in last 5 seconds
          const isDuplicate = state.errors.some(
            (e) =>
              e.message === newError.message &&
              !e.dismissed &&
              Date.now() - e.timestamp < 5000
          );

          if (isDuplicate) {
            return state; // Don't add duplicate
          }

          return {
            errors: [...state.errors, newError],
            lastError: newError,
          };
        });
      },

      // Dismiss error (soft delete - keeps in history)
      dismissError: (id) => {
        set((state) => ({
          errors: state.errors.map((e) =>
            e.id === id ? { ...e, dismissed: true } : e
          ),
        }));
      },

      // Clear all errors
      clearErrors: () => {
        set({ errors: [], lastError: null });
      },

      // Remove dismissed errors from history
      clearDismissed: () => {
        set((state) => ({
          errors: state.errors.filter((e) => !e.dismissed),
        }));
      },

      // Get only active (non-dismissed) errors
      // Cached to prevent infinite loops in selectors
      getActiveErrors: () => {
        const state = get();
        return state.errors.filter((e) => !e.dismissed);
      },

      // Check if there are any active errors
      hasErrors: () => {
        return get().getActiveErrors().length > 0;
      },
    }),
    {
      name: 'freight-delay-error-store',
    }
  )
);

/**
 * Helper function to create error from HttpError or generic Error
 */
export function createErrorFromException(
  error: Error,
  source?: string,
  severity: AppError['severity'] = 'error'
): Omit<AppError, 'id' | 'timestamp'> {
  const unknownError = error as UnknownError;

  return {
    message: error.message || 'An unexpected error occurred',
    code: unknownError.code || unknownError.statusCode?.toString(),
    source,
    severity,
    metadata: {
      name: error.name,
      stack: error.stack,
      ...unknownError.data,
    },
  };
}
