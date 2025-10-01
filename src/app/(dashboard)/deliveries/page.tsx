/**
 * Deliveries Page
 * Overview of all freight deliveries
 */

'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DeliveryList } from '@/components/features/deliveries/DeliveryList';
import { DeliveryStats } from '@/components/features/deliveries/DeliveryStats';

export default function DeliveriesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Deliveries</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Monitor and manage all freight deliveries
          </p>
        </div>
        <Link href="/deliveries/new">
          <Button leftIcon={<Plus className="h-4 w-4" />}>New Delivery</Button>
        </Link>
      </div>

      <DeliveryStats />
      <DeliveryList />
    </div>
  );
}
