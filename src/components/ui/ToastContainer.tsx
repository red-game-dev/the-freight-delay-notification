/**
 * Toast Container Component
 * Subscribes to Zustand stores and renders toast notifications
 *
 * Architecture:
 * - Subscribes to errorStore for error toasts
 * - Subscribes to notificationStore for success/info toasts
 * - Automatically handles dismissal and animations
 * - Should be placed in root layout for global availability
 */

"use client";

import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
} from "lucide-react";
import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import type { AppError, Notification } from "@/stores";
import { useErrorStore, useNotificationStore } from "@/stores";
import { Button } from "./Button";

/**
 * Helper to extract string message from unknown message value
 * Handles edge cases where objects might be passed at runtime
 */
function extractMessage(rawMessage: unknown): string {
  if (typeof rawMessage === "string") {
    return rawMessage;
  }

  if (typeof rawMessage === "object" && rawMessage !== null) {
    // Check for common error object shapes
    if ("message" in rawMessage && typeof rawMessage.message === "string") {
      return rawMessage.message;
    }
    if ("error" in rawMessage && typeof rawMessage.error === "string") {
      return rawMessage.error;
    }
    // Fallback to JSON stringification
    return JSON.stringify(rawMessage);
  }

  return String(rawMessage);
}

type ToastItem =
  | { type: "error"; data: AppError }
  | { type: "notification"; data: Notification };

const variantConfig = {
  success: {
    icon: CheckCircle2,
    className:
      "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200",
  },
  error: {
    icon: AlertCircle,
    className:
      "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200",
  },
  warning: {
    icon: AlertTriangle,
    className:
      "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-200",
  },
  info: {
    icon: Info,
    className:
      "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200",
  },
  critical: {
    icon: AlertCircle,
    className:
      "bg-red-100 dark:bg-red-900/40 border-red-300 dark:border-red-700 text-red-900 dark:text-red-100",
  },
};

export function ToastContainer() {
  // Subscribe to stores with shallow comparison to prevent infinite loops
  const errors = useErrorStore(
    useShallow((state) => state.errors.filter((e) => !e.dismissed)),
  );

  const notifications = useNotificationStore(
    useShallow((state) => state.notifications.filter((n) => !n.dismissed)),
  );

  // Combine and sort by timestamp (newest first)
  const toasts: ToastItem[] = useMemo(() => {
    const errorToasts: ToastItem[] = errors.map((error) => ({
      type: "error" as const,
      data: error,
    }));
    const notificationToasts: ToastItem[] = notifications.map(
      (notification) => ({
        type: "notification" as const,
        data: notification,
      }),
    );

    return [...errorToasts, ...notificationToasts].sort(
      (a, b) => b.data.timestamp - a.data.timestamp,
    );
  }, [errors, notifications]);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-0 right-0 z-50 p-4 space-y-2 max-w-md w-full pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.data.id} toast={toast} />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: ToastItem;
}

function ToastItem({ toast }: ToastItemProps) {
  const dismissError = useErrorStore((state) => state.dismissError);
  const dismissNotification = useNotificationStore(
    (state) => state.dismissNotification,
  );

  const handleDismiss = () => {
    if (toast.type === "error") {
      dismissError(toast.data.id);
    } else {
      dismissNotification(toast.data.id);
    }
  };

  // Determine variant and message based on toast type
  const variant =
    toast.type === "error"
      ? (toast.data as AppError).severity
      : (toast.data as Notification).type;

  // Ensure message is always a string, handle edge cases where objects might be passed
  const message = extractMessage(toast.data.message);

  const config = variantConfig[variant];
  const Icon = config.icon;

  // Handle dismissed state for exit animation
  const isDismissed = toast.data.dismissed;

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-lg border shadow-lg pointer-events-auto
        transition-all duration-300
        ${
          isDismissed
            ? "animate-out slide-out-to-right-full opacity-0"
            : "animate-in slide-in-from-right-full"
        }
        ${config.className}
      `}
      role="alert"
    >
      <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium break-words">{message}</p>
        {toast.type === "error" && toast.data.source && (
          <p className="text-xs opacity-70 mt-1">Source: {toast.data.source}</p>
        )}
      </div>
      <Button
        onClick={handleDismiss}
        variant="ghost"
        size="sm"
        iconOnly
        aria-label="Close notification"
        className="flex-shrink-0"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
