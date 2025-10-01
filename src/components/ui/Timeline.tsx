/**
 * Timeline component for displaying chronological events
 * Perfect for workflow steps, activity feeds, etc.
 */

'use client';

import * as React from 'react';
import { CheckCircle2, Circle, Clock } from 'lucide-react';

export interface TimelineItem {
  id: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  timestamp?: string;
  status?: 'completed' | 'in_progress' | 'pending' | 'failed';
  icon?: React.ReactNode;
  metadata?: React.ReactNode;
}

export interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

const statusConfig = {
  completed: {
    icon: CheckCircle2,
    iconColor: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/20',
    lineColor: 'bg-green-300 dark:bg-green-700',
  },
  in_progress: {
    icon: Clock,
    iconColor: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    lineColor: 'bg-blue-300 dark:bg-blue-700',
  },
  pending: {
    icon: Circle,
    iconColor: 'text-gray-400 dark:text-gray-600',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    lineColor: 'bg-gray-300 dark:bg-gray-700',
  },
  failed: {
    icon: Circle,
    iconColor: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/20',
    lineColor: 'bg-red-300 dark:bg-red-700',
  },
};

export function Timeline({ items, className = '' }: TimelineProps) {
  return (
    <div className={`space-y-0 ${className}`}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const status = item.status || 'pending';
        const config = statusConfig[status];
        const Icon = item.icon ? null : config.icon;

        return (
          <div key={item.id} className="relative flex gap-4 pb-8 last:pb-0">
            {/* Timeline line */}
            {!isLast && (
              <div
                className={`absolute left-5 top-10 bottom-0 w-0.5 ${config.lineColor}`}
              />
            )}

            {/* Icon */}
            <div className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${config.bgColor}`}>
              {item.icon ? (
                item.icon
              ) : Icon ? (
                <Icon className={`h-5 w-5 ${config.iconColor}`} />
              ) : null}
            </div>

            {/* Content */}
            <div className="flex-1 pt-1">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="font-semibold">{item.title}</div>
                {item.timestamp && (
                  <time className="text-xs text-muted-foreground whitespace-nowrap">
                    {item.timestamp}
                  </time>
                )}
              </div>

              {item.description && (
                <div className="text-sm text-muted-foreground mb-2">
                  {item.description}
                </div>
              )}

              {item.metadata && (
                <div className="mt-2">
                  {item.metadata}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export interface CompactTimelineProps {
  steps: Array<{
    id: string;
    label?: string;
    status: 'completed' | 'in_progress' | 'pending';
  }>;
  className?: string;
}

export function CompactTimeline({ steps, className = '' }: CompactTimelineProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {steps.map((step, idx) => (
        <React.Fragment key={step.id}>
          <div
            className={`h-2 w-2 rounded-full ${
              step.status === 'completed'
                ? 'bg-green-500'
                : step.status === 'in_progress'
                ? 'bg-blue-500 animate-pulse'
                : 'bg-gray-300 dark:bg-gray-700'
            }`}
            title={step.label}
          />
          {idx < steps.length - 1 && (
            <div
              className={`h-0.5 w-4 ${
                steps[idx + 1]?.status === 'completed'
                  ? 'bg-green-500'
                  : 'bg-gray-300 dark:bg-gray-700'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
