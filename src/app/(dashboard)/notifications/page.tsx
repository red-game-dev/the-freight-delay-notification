/**
 * Notifications Page
 * Track sent notifications and delivery confirmations
 */

'use client';

import { Badge } from '@/components/ui/Badge';
import { StatCard, StatGrid } from '@/components/ui/StatCard';
import { List, ListItem } from '@/components/ui/List';
import { Mail, MessageSquare, CheckCircle2, XCircle } from 'lucide-react';

interface Notification {
  id: string;
  deliveryId: string;
  channel: 'email' | 'sms';
  recipient: string;
  status: 'sent' | 'failed';
  sentAt: string;
  message: string;
}

export default function NotificationsPage() {
  // TODO: Replace with actual data from API
  const notifications: Notification[] = [
    {
      id: '1',
      deliveryId: 'FD-2024-001',
      channel: 'email',
      recipient: 'john@example.com',
      status: 'sent',
      sentAt: '2024-01-15T10:30:00Z',
      message: 'Your delivery is delayed by 25 minutes due to heavy traffic.',
    },
    {
      id: '2',
      deliveryId: 'FD-2024-002',
      channel: 'sms',
      recipient: '+1234567890',
      status: 'sent',
      sentAt: '2024-01-14T15:00:00Z',
      message: 'Delivery update: Package delayed due to weather conditions.',
    },
    {
      id: '3',
      deliveryId: 'FD-2024-003',
      channel: 'email',
      recipient: 'bob@example.com',
      status: 'failed',
      sentAt: '2024-01-13T09:15:00Z',
      message: 'Your package has been delivered successfully.',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Notifications</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Track sent notifications and delivery confirmations
        </p>
      </div>

      {/* Stats */}
      <StatGrid columns={3}>
        <StatCard
          title="Total Sent"
          value={127}
          icon={<Mail className="h-6 w-6" />}
        />
        <StatCard
          title="Success Rate"
          value="98.4%"
          icon={<CheckCircle2 className="h-6 w-6" />}
          iconColor="text-green-600"
        />
        <StatCard
          title="Failed"
          value={2}
          icon={<XCircle className="h-6 w-6" />}
          iconColor="text-red-600"
        />
      </StatGrid>

      {/* Notifications List */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold">Recent Notifications</h2>
        </div>

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
                    <span className="font-medium">{notification.deliveryId}</span>
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
                    {new Date(notification.sentAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </ListItem>
          ))}
        </List>
      </div>
    </div>
  );
}
