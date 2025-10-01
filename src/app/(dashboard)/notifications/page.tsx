/**
 * Notifications Page
 * Track sent notifications and delivery confirmations
 */

'use client';

import { Badge } from '@/components/ui/Badge';
import { StatCard, StatGrid } from '@/components/ui/StatCard';
import { List, ListItem } from '@/components/ui/List';
import { SkeletonStats, SkeletonList } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Mail, MessageSquare, CheckCircle2, XCircle, Bell } from 'lucide-react';
import { useNotifications, useNotificationStats } from '@/core/infrastructure/http/services/notifications';

export default function NotificationsPage() {
  const { data: notifications, isLoading: notificationsLoading } = useNotifications();
  const { data: stats, isLoading: statsLoading } = useNotificationStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Notifications</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Track sent notifications and delivery confirmations
        </p>
      </div>

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
          <h2 className="text-xl sm:text-2xl font-bold">Recent Notifications</h2>
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
            {notifications.map((notification) => (
            <ListItem key={notification.id}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {notification.channel === 'email' ? (
                    <Mail className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <MessageSquare className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{notification.delivery_id}</span>
                    <Badge
                      variant={notification.status === 'sent' ? 'success' : 'error'}
                    >
                      {notification.status}
                    </Badge>
                    <span className="text-xs uppercase text-muted-foreground">
                      {notification.channel}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    To: {notification.recipient}
                  </p>
                  <p className="text-sm">{notification.message}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {notification.sent_at ? new Date(notification.sent_at).toLocaleString() : 'Not sent yet'}
                  </p>
                </div>
              </div>
            </ListItem>
          ))}
          </List>
        )}
      </div>
    </div>
  );
}
