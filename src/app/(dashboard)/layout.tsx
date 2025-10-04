/**
 * Dashboard Layout
 * Provides consistent header, sidebar, and footer for all dashboard pages
 */

import { Suspense, type ReactNode } from 'react';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { Footer } from '@/components/shared/Footer';
import { SkeletonWorkflow } from '@/components/ui/Skeleton';

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 max-w-full overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            <Suspense fallback={<SkeletonWorkflow items={5} />}>
              {children}
            </Suspense>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
