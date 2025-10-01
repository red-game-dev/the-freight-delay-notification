/**
 * DeliveryList Component
 * Displays a list of deliveries with their status
 */

'use client';

import * as React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { MapPin, Clock } from 'lucide-react';

interface Delivery {
  id: string;
  trackingNumber: string;
  origin: string;
  destination: string;
  status: 'pending' | 'in_transit' | 'delayed' | 'delivered' | 'cancelled';
  scheduledDelivery: string;
  customer: {
    name: string;
    email: string;
  };
}

const statusConfig = {
  pending: { label: 'Pending', variant: 'default' as const },
  in_transit: { label: 'In Transit', variant: 'info' as const },
  delayed: { label: 'Delayed', variant: 'warning' as const },
  delivered: { label: 'Delivered', variant: 'success' as const },
  cancelled: { label: 'Cancelled', variant: 'error' as const },
};

export function DeliveryList() {
  // TODO: Replace with actual data from API
  const deliveries: Delivery[] = [
    {
      id: '1',
      trackingNumber: 'FD-2024-001',
      origin: 'New York, NY',
      destination: 'Los Angeles, CA',
      status: 'in_transit',
      scheduledDelivery: '2024-01-15T10:00:00Z',
      customer: { name: 'John Doe', email: 'john@example.com' },
    },
    {
      id: '2',
      trackingNumber: 'FD-2024-002',
      origin: 'Chicago, IL',
      destination: 'Miami, FL',
      status: 'delayed',
      scheduledDelivery: '2024-01-14T14:00:00Z',
      customer: { name: 'Jane Smith', email: 'jane@example.com' },
    },
    {
      id: '3',
      trackingNumber: 'FD-2024-003',
      origin: 'Seattle, WA',
      destination: 'Portland, OR',
      status: 'delivered',
      scheduledDelivery: '2024-01-13T09:00:00Z',
      customer: { name: 'Bob Johnson', email: 'bob@example.com' },
    },
  ];

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold">Recent Deliveries</h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Track and manage your freight deliveries
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tracking #</TableHead>
            <TableHead>Route</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Scheduled</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deliveries.map((delivery) => {
            const config = statusConfig[delivery.status];
            return (
              <TableRow key={delivery.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell>
                  <Link href={`/deliveries/${delivery.id}`} className="block">
                    <div className="font-medium">{delivery.trackingNumber}</div>
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/deliveries/${delivery.id}`} className="block">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span>{delivery.origin}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <span>→</span>
                        <span>{delivery.destination}</span>
                      </div>
                    </div>
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/deliveries/${delivery.id}`} className="block">
                    <div className="flex flex-col">
                      <div className="font-medium text-sm">{delivery.customer.name}</div>
                      <div className="text-xs text-muted-foreground">{delivery.customer.email}</div>
                    </div>
                  </Link>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <Link href={`/deliveries/${delivery.id}`} className="block">
                    <div className="flex items-center gap-1 text-sm">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      {new Date(delivery.scheduledDelivery).toLocaleDateString()}
                    </div>
                  </Link>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <Link href={`/deliveries/${delivery.id}`} className="block">
                    <Badge variant={config.variant}>{config.label}</Badge>
                  </Link>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
