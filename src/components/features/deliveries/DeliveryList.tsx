/**
 * DeliveryList Component
 * Displays a list of deliveries with their status
 * Supports multiple view modes: list (table), grid, and compact
 */

"use client";

import { Clock, MapPin, Package, User } from "lucide-react";
import Link from "next/link";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Skeleton, SkeletonTable } from "@/components/ui/Skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { ViewModeRenderer } from "@/components/ui/ViewModeRenderer";
import { useURLPagination } from "@/core/hooks/useURLSearchParams";
import { useDeliveries } from "@/core/infrastructure/http/services/deliveries";
import type { Delivery } from "@/core/infrastructure/http/services/deliveries/types";

const statusConfig = {
  pending: { label: "Pending", variant: "default" as const },
  in_transit: { label: "In Transit", variant: "info" as const },
  delayed: { label: "Delayed", variant: "warning" as const },
  delivered: { label: "Delivered", variant: "success" as const },
  cancelled: { label: "Cancelled", variant: "error" as const },
};

export function DeliveryList() {
  const { page, setPage } = useURLPagination();
  const {
    data: response,
    isLoading,
    error,
  } = useDeliveries({ page: page.toString(), limit: "10" });

  const deliveries = response?.data || [];
  const pagination = response?.pagination;

  if (error) {
    return (
      <Alert variant="error">
        Failed to load deliveries.{" "}
        {error instanceof Error ? error.message : "Please try again."}
      </Alert>
    );
  }

  return (
    <ViewModeRenderer
      pageKey="deliveries"
      items={deliveries}
      isLoading={isLoading}
      pagination={
        pagination
          ? {
              page: pagination.page,
              totalPages: pagination.totalPages,
              total: pagination.total,
              limit: 10,
            }
          : undefined
      }
      onPageChange={setPage}
      loadingComponent={
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="p-4 sm:p-6 space-y-2">
            <Skeleton width="33%" height={32} />
            <Skeleton width="25%" height={16} />
          </div>
          <SkeletonTable rows={5} columns={5} />
        </div>
      }
      emptyComponent={
        <EmptyState
          icon={Package}
          title="No Deliveries"
          description="No deliveries found. Create your first delivery to get started."
        />
      }
      listHeader={
        <SectionHeader
          title="Recent Deliveries"
          description="Track and manage your freight deliveries"
          size="lg"
        />
      }
      renderList={(deliveries) => (
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
            {deliveries.map((delivery: Delivery) => {
              const config =
                statusConfig[delivery.status as keyof typeof statusConfig];
              return (
                <TableRow
                  key={delivery.id}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  <TableCell>
                    <Link href={`/deliveries/${delivery.id}`} className="block">
                      <div className="font-medium">
                        {delivery.tracking_number}
                      </div>
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
                        <div className="font-medium text-sm">
                          {delivery.customer_name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {delivery.customer_email}
                        </div>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Link href={`/deliveries/${delivery.id}`} className="block">
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {new Date(
                          delivery.scheduled_delivery,
                        ).toLocaleDateString()}
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
      )}
      renderGrid={(deliveries) => (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {deliveries.map((delivery: Delivery) => {
            const config =
              statusConfig[delivery.status as keyof typeof statusConfig];
            return (
              <Link key={delivery.id} href={`/deliveries/${delivery.id}`}>
                <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-muted-foreground" />
                      <span className="font-semibold">
                        {delivery.tracking_number}
                      </span>
                    </div>
                    <Badge variant={config.variant}>{config.label}</Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="truncate">{delivery.origin}</div>
                        <div className="text-muted-foreground truncate">
                          → {delivery.destination}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="truncate">{delivery.customer_name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {delivery.customer_email}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4 flex-shrink-0" />
                      <span>
                        {new Date(
                          delivery.scheduled_delivery,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
      renderCompact={(deliveries) => (
        <div className="divide-y">
          {deliveries.map((delivery: Delivery) => {
            const config =
              statusConfig[delivery.status as keyof typeof statusConfig];
            return (
              <Link
                key={delivery.id}
                href={`/deliveries/${delivery.id}`}
                className="block p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-medium text-sm">
                          {delivery.tracking_number}
                        </span>
                        <Badge variant={config.variant} className="text-xs">
                          {config.label}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {delivery.origin} → {delivery.destination}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="hidden sm:block text-xs text-muted-foreground">
                      {delivery.customer_name}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(
                        delivery.scheduled_delivery,
                      ).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    />
  );
}
