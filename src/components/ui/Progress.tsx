/**
 * Progress component for loading states
 * Simplified version using Tailwind classes
 */

"use client";

import type { FC } from "react";

export interface ProgressProps {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "success" | "warning" | "error";
  showLabel?: boolean;
  className?: string;
}

const sizeStyles = {
  sm: "h-1",
  md: "h-2",
  lg: "h-3",
};

const variantStyles = {
  default: "bg-blue-600",
  success: "bg-green-600",
  warning: "bg-yellow-600",
  error: "bg-red-600",
};

export const Progress: FC<ProgressProps> = ({
  value,
  max = 100,
  size = "md",
  variant = "default",
  showLabel = false,
  className = "",
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between mb-1 text-sm">
          <span className="font-medium">Progress</span>
          <span className="text-muted-foreground">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      <div
        className={`w-full bg-muted rounded-full overflow-hidden ${sizeStyles[size]}`}
      >
        <div
          className={`h-full transition-all duration-300 ${variantStyles[variant]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

Progress.displayName = "Progress";

export interface CircularProgressProps {
  value?: number;
  size?: number;
  strokeWidth?: number;
  variant?: "default" | "success" | "warning" | "error";
  showLabel?: boolean;
}

export const CircularProgress: FC<CircularProgressProps> = ({
  value,
  size = 48,
  strokeWidth = 4,
  variant = "default",
  showLabel = false,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset =
    value !== undefined ? circumference - (value / 100) * circumference : 0;

  const colorMap = {
    default: "text-blue-600",
    success: "text-green-600",
    warning: "text-yellow-600",
    error: "text-red-600",
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={value !== undefined ? offset : circumference * 0.75}
          strokeLinecap="round"
          className={`${colorMap[variant]} transition-all duration-300 ${
            value === undefined ? "animate-spin" : ""
          }`}
        />
      </svg>
      {showLabel && value !== undefined && (
        <span className="absolute text-xs font-medium">
          {Math.round(value)}%
        </span>
      )}
    </div>
  );
};

CircularProgress.displayName = "CircularProgress";
