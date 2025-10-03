/**
 * Dashboard Layout
 * Provides consistent navigation and sidebar for all dashboard pages
 */

import type { ReactNode } from 'react';
import { Navigation } from '@/components/shared/Navigation';
import { Sidebar } from '@/components/shared/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 max-w-full overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
