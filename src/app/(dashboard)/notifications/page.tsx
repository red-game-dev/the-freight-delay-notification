/**
 * Notifications Page
 * Track sent notifications and delivery confirmations
 */

'use client';

import { Badge } from '@/components/ui/Badge';
import { StatCard, StatGrid } from '@/components/ui/StatCard';
import { getNotificationStatusVariant } from '@/core/utils/statusUtils';
import { List, ListItem } from '@/components/ui/List';
import { SkeletonStats, SkeletonList } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Alert } from '@/components/ui/Alert';
import { PageHeader } from '@/components/ui/PageHeader';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Mail, MessageSquare, CheckCircle2, XCircle, Bell, Clock, RefreshCw, ExternalLink } from 'lucide-react';
import { useNotifications, useNotificationStats } from '@/core/infrastructure/http/services/notifications';
import Link from 'next/link';

export default function NotificationsPage() {
  const { data: notifications, isLoading: notificationsLoading } = useNotifications();
  const { data: stats, isLoading: statsLoading } = useNotificationStats();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Track sent notifications and delivery confirmations"
      />

      {/* Stats */}
      {statsLoading ? (
        <SkeletonStats count={3} />
      ) : (
        <StatGrid columns={3}>
          <StatCard
            title="Total Sent"
            value={stats?.total ?? 0}
            icon={<Mail className="h-6 w-6" />}
          />
          <StatCard
            title="Success Rate"
            value={`${stats?.success_rate?.toFixed(1) ?? 0}%`}
            icon={<CheckCircle2 className="h-6 w-6" />}
            iconColor="text-green-600"
          />
          <StatCard
            title="Failed"
            value={stats?.failed ?? 0}
            icon={<XCircle className="h-6 w-6" />}
            iconColor="text-red-600"
          />
        </StatGrid>
      )}

      {/* Notifications List */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="p-4 sm:p-6">
          <SectionHeader title="Recent Notifications" size="lg" />
        </div>

        {notificationsLoading ? (
          <SkeletonList items={5} />
        ) : !notifications || notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No Notifications"
            description="No notifications have been sent yet. Notifications are sent automatically when deliveries experience delays."
          />
        ) : (
          <List>
            {notifications.map((notification) => {
              const hasError = notification.status === 'failed' && notification.error_message;
              const retryCount = (notification as any).retry_count || 0;
              const attemptedAt = (notification as any).attempted_at;
              const trackingNumber = (notification as any).tracking_number;

              return (
                <ListItem key={notification.id}>
                  <div className="flex items-start gap-4 w-full">
                    <div className="flex-shrink-0">
                      {notification.channel === 'email' ? (
                        <Mail className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <MessageSquare className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      {/* Header with delivery link and status */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {trackingNumber ? (
                          <Link
                            href={`/deliveries/${notification.delivery_id}`}
                            className="font-medium hover:underline flex items-center gap-1"
                          >
                            {trackingNumber}
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        ) : (
                          <span className="font-medium text-muted-foreground">
                            {notification.delivery_id.substring(0, 8)}...
                          </span>
                        )}
                        <Badge
                          variant={getNotificationStatusVariant(notification.status)}
                        >
                          {notification.status}
                        </Badge>
                        <span className="text-xs uppercase text-muted-foreground">
                          {notification.channel}
                        </span>
                        {retryCount > 0 && (
                          <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
                            <RefreshCw className="h-3 w-3" />
                            <span>{retryCount} {retryCount === 1 ? 'retry' : 'retries'}</span>
                          </div>
                        )}
                      </div>

                      {/* Recipient */}
                      <p className="text-sm text-muted-foreground mb-2">
                        To: {notification.recipient}
                      </p>

                      {/* Message preview */}
                      <p className="text-sm mb-3 line-clamp-2">{notification.message}</p>

                      {/* Timestamps */}
                      <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground mb-2">
                        {attemptedAt && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>Attempted: {new Date(attemptedAt).toLocaleString()}</span>
                          </div>
                        )}
                        {notification.sent_at && (
                          <div className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Sent: {new Date(notification.sent_at).toLocaleString()}</span>
                          </div>
                        )}
                        {!attemptedAt && !notification.sent_at && notification.created_at && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>Created: {new Date(notification.created_at).toLocaleString()}</span>
                          </div>
                        )}
                      </div>

                      {/* Go to Delivery link */}
                      <div className="mt-2">
                        <Link
                          href={`/deliveries/${notification.delivery_id}`}
                          className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                        >
                          Go to delivery →
                        </Link>
                      </div>

                      {/* Error details */}
                      {hasError && (
                        <Alert
                          variant="error"
                          title="Notification Failed"
                          className="mt-3"
                          details={
                            <div className="space-y-2">
                              {notification.error_message && (
                                <div>
                                  <p className="font-medium text-sm mb-1">Error Message:</p>
                                  <p className="text-sm opacity-90">{notification.error_message}</p>
                                </div>
                              )}
                              {notification.error_message && (
                                <div>
                                  <p className="font-medium text-sm mb-1">Technical Details:</p>
                                  <pre className="text-xs opacity-90 overflow-auto p-2 bg-black/10 dark:bg-white/10 rounded">
                                    {notification.error_message}
                                  </pre>
                                </div>
                              )}
                            </div>
                          }
                        >
                          The notification could not be delivered. {retryCount > 0 ? `Attempted ${retryCount + 1} time(s).` : ''} Check the details below for more information.
                        </Alert>
                      )}
                    </div>
                  </div>
                </ListItem>
              );
            })}
          </List>
        )}
      </div>
    </div>
  );
}
