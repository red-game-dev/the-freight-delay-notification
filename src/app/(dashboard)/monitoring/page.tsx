/**
 * Monitoring Page
 * Real-time traffic monitoring and delay detection
 */

'use client';

import { Alert } from '@/components/ui/Alert';

export default function MonitoringPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Route Monitoring</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Real-time traffic monitoring and delay detection
        </p>
      </div>

      <Alert variant="info">
        Traffic map and monitoring features coming soon. This will display real-time traffic data and route delays.
      </Alert>

      {/* TODO: Add TrafficMap and DelayIndicator components */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="rounded-lg border bg-card p-6 h-96 flex items-center justify-center">
            <p className="text-muted-foreground">Traffic Map Placeholder</p>
          </div>
        </div>
        <div>
          <div className="rounded-lg border bg-card p-6 h-96 flex items-center justify-center">
            <p className="text-muted-foreground">Delay Indicator Placeholder</p>
          </div>
        </div>
      </div>
    </div>
  );
}
