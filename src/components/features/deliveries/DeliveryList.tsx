/**
 * DeliveryList Component
 * Displays a list of deliveries with their status
 */

'use client';

import * as React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Skeleton, SkeletonTable } from '@/components/ui/Skeleton';
import { MapPin, Clock } from 'lucide-react';
import { useDeliveries } from '@/core/infrastructure/http/services/deliveries';

const statusConfig = {
  pending: { label: 'Pending', variant: 'default' as const },
  in_transit: { label: 'In Transit', variant: 'info' as const },
  delayed: { label: 'Delayed', variant: 'warning' as const },
  delivered: { label: 'Delivered', variant: 'success' as const },
  cancelled: { label: 'Cancelled', variant: 'error' as const },
};

export function DeliveryList() {
  const { data: deliveries, isLoading, error } = useDeliveries();

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="p-4 sm:p-6 space-y-2">
          <Skeleton width="33%" height={32} />
          <Skeleton width="25%" height={16} />
        </div>
        <SkeletonTable rows={5} columns={5} />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="error">
        Failed to load deliveries. {error instanceof Error ? error.message : 'Please try again.'}
      </Alert>
    );
  }

  if (!deliveries || deliveries.length === 0) {
    return (
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="p-12 text-center">
          <p className="text-muted-foreground">No deliveries found. Create your first delivery to get started.</p>
        </div>
      </div>
    );
  }

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
          {deliveries.map((delivery: any) => {
            const config = statusConfig[delivery.status as keyof typeof statusConfig];
            return (
              <TableRow key={delivery.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell>
                  <Link href={`/deliveries/${delivery.id}`} className="block">
                    <div className="font-medium">{delivery.tracking_number}</div>
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
                      <div className="font-medium text-sm">{delivery.customer_name}</div>
                      <div className="text-xs text-muted-foreground">{delivery.customer_email}</div>
                    </div>
                  </Link>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <Link href={`/deliveries/${delivery.id}`} className="block">
                    <div className="flex items-center gap-1 text-sm">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      {new Date(delivery.scheduled_delivery).toLocaleDateString()}
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
