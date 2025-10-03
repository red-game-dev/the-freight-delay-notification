/**
 * DeliveryNotificationsList Component
 * Shows all notifications sent for a delivery
 */

'use client';

import * as React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Loader2 } from 'lucide-react';
import { useNotifications } from '@/core/infrastructure/http/services/notifications';
import type { Notification } from '@/core/infrastructure/http/services/notifications';
import { getNotificationChannelConfig, getNotificationStatusConfig } from '@/core/utils/notificationStatusUtils';

interface DeliveryNotificationsListProps {
  deliveryId: string;
}

export function DeliveryNotificationsList({ deliveryId }: DeliveryNotificationsListProps) {
  const { data, isLoading, error } = useNotifications({ delivery_id: deliveryId, limit: '10' });

  if (isLoading) {
    return (
      <Card>
        <div className="p-6">
          <SectionHeader title="Notifications" className="mb-4" />
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="p-6">
          <SectionHeader title="Notifications" className="mb-4" />
          <Alert variant="error">
            Failed to load notifications. {error instanceof Error ? error.message : 'Please try again.'}
          </Alert>
        </div>
      </Card>
    );
  }

  const notifications = data?.data || [];

  return (
    <Card>
      <div className="p-6">
        <SectionHeader
          title="Notifications"
          description={`${notifications.length} notification${notifications.length !== 1 ? 's' : ''} sent`}
          className="mb-4"
        />

        {notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No notifications sent yet.</p>
            <p className="text-sm mt-1">Notifications will appear here when delays are detected.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const channelInfo = getNotificationChannelConfig(notification.channel);
              const statusInfo = getNotificationStatusConfig(notification.status);
              const ChannelIcon = channelInfo.icon;
              const StatusIcon = statusInfo.icon;

              return (
                <div
                  key={notification.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <ChannelIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{channelInfo.label}</span>
                      <span className="text-sm text-muted-foreground">to {notification.recipient}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {notification.delay_minutes !== undefined && notification.delay_minutes !== null && (
                        <Badge variant="warning">{notification.delay_minutes} min delay</Badge>
                      )}
                      <Badge variant={statusInfo.variant}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusInfo.label}
                      </Badge>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 mb-2">
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {notification.message}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {notification.sent_at
                        ? `Sent ${new Date(notification.sent_at).toLocaleString()}`
                        : `Created ${new Date(notification.created_at).toLocaleString()}`}
                    </span>
                    {notification.external_id && (
                      <span className="font-mono">ID: {notification.external_id}</span>
                    )}
                  </div>

                  {notification.error_message && (
                    <div className="mt-2">
                      <Alert variant="error" className="text-xs">
                        {notification.error_message}
                      </Alert>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
