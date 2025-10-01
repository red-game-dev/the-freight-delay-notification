/**
 * WorkflowDetails Component
 * Reusable component to display workflow configuration and runtime info
 */

'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/Badge';
import { Clock } from 'lucide-react';
import { formatNextScheduledTime } from '@/core/utils/dateUtils';
import Link from 'next/link';

interface WorkflowDetailsProps {
  workflowId: string;
  deliveryId: string;
  trackingNumber?: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  settings?: {
    type: 'recurring' | 'one-time';
    check_interval_minutes?: number;
    max_checks?: number;
    checks_performed?: number;
    delay_threshold_minutes?: number;
    min_delay_change_threshold?: number;
    min_hours_between_notifications?: number;
    scheduled_delivery?: string;
  };
  showLink?: boolean;
  compact?: boolean;
}

export function WorkflowDetails({
  workflowId,
  deliveryId,
  trackingNumber,
  status,
  startedAt,
  completedAt,
  settings,
  showLink = true,
  compact = false,
}: WorkflowDetailsProps) {
  const isRecurring = workflowId?.startsWith('recurring-check-');
  const isRunning = status === 'running';

  // Calculate duration
  const duration = completedAt
    ? Math.round((new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 1000)
    : null;

  // Calculate next run time for recurring workflows
  const nextRun = isRecurring && isRunning && settings?.check_interval_minutes
    ? formatNextScheduledTime(startedAt, settings.check_interval_minutes, settings.checks_performed || 0)
    : null;

  if (compact) {
    return (
      <div className="space-y-2">
        {/* Type and Status */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="default" className="text-xs">
            {isRecurring ? 'Recurring' : 'One-time'}
          </Badge>
          {nextRun && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Next check {nextRun}</span>
            </div>
          )}
        </div>

        {/* Key metrics */}
        {settings && isRecurring && (
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
            <div>
              <span className="text-muted-foreground">Interval:</span>
              <span className="ml-1 font-medium">{settings.check_interval_minutes}min</span>
            </div>
            <div>
              <span className="text-muted-foreground">Progress:</span>
              <span className="ml-1 font-medium">
                {settings.checks_performed || 0}/{settings.max_checks === -1 ? '∞' : settings.max_checks}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header with link */}
      {showLink && trackingNumber && (
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/deliveries/${deliveryId}`}
            className="font-medium hover:underline text-sm"
          >
            {trackingNumber}
          </Link>
        </div>
      )}

      {/* Workflow ID */}
      <p className="text-xs text-muted-foreground font-mono break-all">
        {workflowId}
      </p>

      {/* Workflow Info Grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <div>
          <span className="text-muted-foreground">Started:</span>
          <span className="ml-2 font-medium">
            {new Date(startedAt).toLocaleString()}
          </span>
        </div>
        {completedAt && (
          <div>
            <span className="text-muted-foreground">Completed:</span>
            <span className="ml-2 font-medium">
              {new Date(completedAt).toLocaleString()}
            </span>
          </div>
        )}
        <div>
          <span className="text-muted-foreground">Duration:</span>
          <span className="ml-2 font-medium">
            {duration !== null ? `${duration}s` : 'In progress'}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Type:</span>
          <span className="ml-2 font-medium">
            {isRecurring ? 'Recurring Check' : 'One-time Check'}
          </span>
        </div>

        {/* Next run time for recurring workflows */}
        {nextRun && (
          <div className="col-span-2">
            <span className="text-muted-foreground">Next Check:</span>
            <span className="ml-2 font-medium text-blue-600 dark:text-blue-400">
              {nextRun}
            </span>
          </div>
        )}

        {/* Additional settings for recurring workflows */}
        {settings && isRecurring && (
          <>
            <div>
              <span className="text-muted-foreground">Check Interval:</span>
              <span className="ml-2 font-medium">
                Every {settings.check_interval_minutes} min
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Progress:</span>
              <span className="ml-2 font-medium">
                {settings.checks_performed || 0}/{settings.max_checks === -1 ? '∞' : settings.max_checks} checks
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Delay Threshold:</span>
              <span className="ml-2 font-medium">
                {settings.delay_threshold_minutes} min
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Notification Cooldown:</span>
              <span className="ml-2 font-medium">
                {settings.min_hours_between_notifications}h / {settings.min_delay_change_threshold}min change
              </span>
            </div>
          </>
        )}
      </div>

      {/* Action link */}
      {showLink && (
        <div className="pt-2">
          <Link
            href={`/deliveries/${deliveryId}`}
            className="text-xs text-primary hover:underline"
          >
            View Delivery →
          </Link>
        </div>
      )}
    </div>
  );
}
