/**
 * Notification Store
 * Centralized success/info message management using Zustand
 *
 * Architecture:
 * - API layer dispatches success notifications to this store
 * - UI components subscribe to display toast notifications
 * - Auto-dismiss after configurable timeout
 * - Supports manual dismiss and notification queue
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning';
  timestamp: number;
  duration?: number; // Auto-dismiss duration in ms (0 = no auto-dismiss)
  dismissed?: boolean;
  metadata?: Record<string, unknown>;
}

interface NotificationStore {
  // State
  notifications: Notification[];

  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  dismissNotification: (id: string) => void;
  clearNotifications: () => void;
  clearDismissed: () => void;

  // Convenience methods
  success: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;

  // Getters
  getActiveNotifications: () => Notification[];
}

const DEFAULT_DURATION = 5000; // 5 seconds

export const useNotificationStore = create<NotificationStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      notifications: [],

      // Add notification with auto-dismiss
      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          duration: notification.duration ?? DEFAULT_DURATION,
        };

        set((state) => {
          // Deduplicate: check if same message exists in last 3 seconds
          const isDuplicate = state.notifications.some(
            (n) =>
              n.message === newNotification.message &&
              !n.dismissed &&
              Date.now() - n.timestamp < 3000
          );

          if (isDuplicate) {
            return state;
          }

          return {
            notifications: [...state.notifications, newNotification],
          };
        });

        // Auto-dismiss after duration
        if (newNotification.duration && newNotification.duration > 0) {
          setTimeout(() => {
            get().dismissNotification(newNotification.id);
          }, newNotification.duration);
        }
      },

      // Dismiss notification
      dismissNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, dismissed: true } : n
          ),
        }));

        // Clean up after 1 second to allow exit animations
        setTimeout(() => {
          get().clearDismissed();
        }, 1000);
      },

      // Clear all notifications
      clearNotifications: () => {
        set({ notifications: [] });
      },

      // Remove dismissed notifications
      clearDismissed: () => {
        set((state) => ({
          notifications: state.notifications.filter((n) => !n.dismissed),
        }));
      },

      // Convenience method for success notifications
      success: (message, duration) => {
        get().addNotification({
          message,
          type: 'success',
          duration,
        });
      },

      // Convenience method for info notifications
      info: (message, duration) => {
        get().addNotification({
          message,
          type: 'info',
          duration,
        });
      },

      // Convenience method for warning notifications
      warning: (message, duration) => {
        get().addNotification({
          message,
          type: 'warning',
          duration,
        });
      },

      // Get only active (non-dismissed) notifications
      getActiveNotifications: () => {
        return get().notifications.filter((n) => !n.dismissed);
      },
    }),
    {
      name: 'notification-store',
    }
  )
);
