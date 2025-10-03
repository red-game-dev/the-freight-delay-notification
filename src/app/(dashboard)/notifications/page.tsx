/**
 * Notifications Page
 * Track sent notifications and delivery confirmations
 */

'use client';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { StatCard, StatGrid } from '@/components/ui/StatCard';
import { ViewModeSwitcher } from '@/components/ui/ViewModeSwitcher';
import { ViewModeRenderer } from '@/components/ui/ViewModeRenderer';
import { getNotificationStatusVariant } from '@/core/utils/statusUtils';
import { List, ListItem } from '@/components/ui/List';
import { SkeletonStats, SkeletonList } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Alert } from '@/components/ui/Alert';
import { PageHeader } from '@/components/ui/PageHeader';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Mail, MessageSquare, CheckCircle2, XCircle, Bell, Clock, RefreshCw, ExternalLink } from 'lucide-react';
import { useNotifications } from '@/core/infrastructure/http/services/notifications';
import { useURLPagination } from '@/core/hooks/useURLSearchParams';
import Link from 'next/link';

export default function NotificationsPage() {
  // URL-based state for pagination
  const { page, setPage } = useURLPagination();

  const { data: response, isLoading: notificationsLoading } = useNotifications({
    page: page.toString(),
    limit: '10',
    includeStats: 'true'
  });

  const notifications = response?.data || [];
  const pagination = response?.pagination;
  const stats = response?.stats;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <PageHeader
          title="Notifications"
          description="Track sent notifications and delivery confirmations"
        />
        <div className="flex-shrink-0">
          <ViewModeSwitcher pageKey="notifications" />
        </div>
      </div>

      {/* Stats */}
      {notificationsLoading ? (
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
      <ViewModeRenderer
        pageKey="notifications"
        items={notifications}
        isLoading={notificationsLoading}
        pagination={pagination ? {
          page: pagination.page,
          totalPages: pagination.totalPages,
          total: pagination.total,
          limit: 10,
        } : undefined}
        onPageChange={setPage}
        loadingComponent={<SkeletonList items={5} />}
        emptyComponent={
          <EmptyState
            icon={Bell}
            title="No Notifications"
            description="No notifications have been sent yet. Notifications are sent automatically when deliveries experience delays."
          />
        }
        listHeader={
          <SectionHeader title="Recent Notifications" size="lg" />
        }
        renderList={(notifications) => (
          <List>
            {notifications.map((notification) => {
              const hasError = notification.status === 'failed' && notification.error_message;
              const retryCount = notification.retry_count || 0;
              const attemptedAt = notification.attempted_at;
              const trackingNumber = notification.tracking_number;

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
        renderGrid={(notifications) => (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {notifications.map((notification) => {
              const Icon = notification.channel === 'email' ? Mail : MessageSquare;

              return (
                <Link key={notification.id} href={`/deliveries/${notification.delivery_id}`}>
                  <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <span className="font-semibold text-sm truncate">
                          {notification.tracking_number || notification.delivery_id.substring(0, 8)}
                        </span>
                      </div>
                      <Badge variant={getNotificationStatusVariant(notification.status)} className="text-xs">
                        {notification.status}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">To: {notification.recipient}</p>
                      <p className="text-sm line-clamp-2">{notification.message}</p>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                        <Clock className="h-3 w-3" />
                        <span>
                          {notification.sent_at
                            ? new Date(notification.sent_at).toLocaleString()
                            : new Date(notification.created_at).toLocaleString()
                          }
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
        renderCompact={(notifications) => (
          <div className="divide-y">
            {notifications.map((notification) => {
              const Icon = notification.channel === 'email' ? Mail : MessageSquare;

              return (
                <Link
                  key={notification.id}
                  href={`/deliveries/${notification.delivery_id}`}
                  className="block p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-medium text-sm truncate">
                            {notification.tracking_number || notification.delivery_id.substring(0, 12)}
                          </span>
                          <Badge variant={getNotificationStatusVariant(notification.status)} className="text-xs flex-shrink-0">
                            {notification.status}
                          </Badge>
                          <span className="text-xs uppercase text-muted-foreground flex-shrink-0">
                            {notification.channel}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          To: {notification.recipient}
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {notification.sent_at
                          ? new Date(notification.sent_at).toLocaleDateString()
                          : new Date(notification.created_at).toLocaleDateString()
                        }
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      />
    </div>
  );
}
