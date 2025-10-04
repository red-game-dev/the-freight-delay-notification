/**
 * StatCard component for displaying statistics
 * Reusable across dashboard pages
 */

"use client";

import type { ReactNode } from "react";

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  iconColor?: string;
  description?: string;
}

export function StatCard({
  title,
  value,
  icon,
  trend,
  iconColor = "text-primary",
  description,
}: StatCardProps) {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="mt-2 text-2xl sm:text-3xl font-bold">{value}</h3>
          {trend && (
            <p
              className={`mt-1 text-sm font-medium ${
                trend.isPositive
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
            </p>
          )}
          {description && (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <div
          className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-primary/10 ${iconColor}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

export interface StatGridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4 | 5 | 6;
}

export function StatGrid({ children, columns = 4 }: StatGridProps) {
  const colsMap = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
    5: "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
    6: "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
  };

  return (
    <div className={`grid grid-cols-1 gap-4 ${colsMap[columns]}`}>
      {children}
    </div>
  );
}
