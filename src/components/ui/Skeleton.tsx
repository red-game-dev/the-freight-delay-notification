/**
 * Skeleton Loading Components
 * Provides skeleton loaders for various UI elements
 */

'use client';

import { CSSProperties } from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animate?: boolean;
}

export function Skeleton({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animate = true,
}: SkeletonProps) {
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
  };

  const style: CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`
        skeleton-loader
        ${animate ? 'skeleton-shimmer' : ''}
        ${variantClasses[variant]}
        ${className}
      `}
      style={style}
    />
  );
}

// Skeleton Card - for list items, delivery cards, etc.
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`border rounded-lg p-6 space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <Skeleton width="40%" height={24} />
        <Skeleton width={80} height={24} variant="rectangular" />
      </div>
      <div className="space-y-2">
        <Skeleton width="100%" height={16} />
        <Skeleton width="80%" height={16} />
      </div>
      <div className="flex gap-4 pt-2">
        <Skeleton width={100} height={32} variant="rectangular" />
        <Skeleton width={100} height={32} variant="rectangular" />
      </div>
    </div>
  );
}

// Skeleton Table - for data tables
export function SkeletonTable({
  rows = 5,
  columns = 4,
  className = '',
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-muted p-4 border-b">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={`header-${i}`} width={`${100 / columns}%`} height={20} />
          ))}
        </div>
      </div>
      {/* Rows */}
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={`row-${rowIdx}`} className="p-4">
            <div className="flex gap-4">
              {Array.from({ length: columns }).map((_, colIdx) => (
                <Skeleton
                  key={`cell-${rowIdx}-${colIdx}`}
                  width={`${100 / columns}%`}
                  height={16}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Skeleton Form - for forms
export function SkeletonForm({
  fields = 4,
  className = '',
}: {
  fields?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-6 ${className}`}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={`field-${i}`} className="space-y-2">
          <Skeleton width="30%" height={16} />
          <Skeleton width="100%" height={40} variant="rectangular" />
        </div>
      ))}
      <div className="flex gap-4 pt-4">
        <Skeleton width={120} height={40} variant="rectangular" />
        <Skeleton width={100} height={40} variant="rectangular" />
      </div>
    </div>
  );
}

// Skeleton Stats - for stat cards
export function SkeletonStats({
  count = 4,
  columns,
  className = '',
}: {
  count?: number;
  columns?: 2 | 3 | 4 | 5 | 6;
  className?: string;
}) {
  // Match StatGrid's responsive column layout
  const cols = columns || (count <= 6 ? (count as 2 | 3 | 4 | 5 | 6) : 4);
  const colsMap = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
    5: 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
    6: 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
  };

  return (
    <div className={`grid grid-cols-1 gap-4 ${colsMap[cols]} ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={`stat-${i}`} className="border rounded-lg p-6 space-y-3">
          <Skeleton width="60%" height={16} />
          <Skeleton width="40%" height={32} />
          <Skeleton width="80%" height={12} />
        </div>
      ))}
    </div>
  );
}

// Skeleton Text - for paragraphs
export function SkeletonText({
  lines = 3,
  className = '',
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={`line-${i}`}
          width={i === lines - 1 ? '60%' : '100%'}
          height={16}
        />
      ))}
    </div>
  );
}

// Skeleton List - for list items
export function SkeletonList({
  items = 5,
  className = '',
}: {
  items?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={`item-${i}`} className="flex items-center gap-4 p-4 border rounded-lg">
          <Skeleton variant="circular" width={48} height={48} />
          <div className="flex-1 space-y-2">
            <Skeleton width="40%" height={16} />
            <Skeleton width="70%" height={14} />
          </div>
          <Skeleton width={80} height={32} variant="rectangular" />
        </div>
      ))}
    </div>
  );
}

// Skeleton Page - full page skeleton
export function SkeletonPage({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header */}
      <div className="space-y-4">
        <Skeleton width="30%" height={32} />
        <Skeleton width="50%" height={20} />
      </div>
      {/* Stats */}
      <SkeletonStats />
      {/* Content */}
      <div className="space-y-6">
        <Skeleton width="20%" height={24} />
        <SkeletonTable />
      </div>
    </div>
  );
}

// Skeleton Detail - for detail pages with two-column layout
export function SkeletonDetail({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton width={80} height={32} />
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Skeleton width={200} height={32} />
              <Skeleton width={80} height={24} />
            </div>
            <Skeleton width={150} height={16} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton width={60} height={32} />
          <Skeleton width={80} height={32} />
          <Skeleton width={160} height={32} />
        </div>
      </div>

      {/* Two-column grid - Delivery & Customer Info */}
      <div className="grid gap-6 md:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
      </div>

      {/* Map Section */}
      <div className="border rounded-lg p-6">
        <div className="space-y-4">
          <Skeleton width="30%" height={24} />
          <Skeleton width="100%" height={400} variant="rectangular" />
        </div>
      </div>

      {/* Workflow Status Polling */}
      <SkeletonCard />

      {/* Workflows and Notifications Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Workflows List */}
        <div className="border rounded-lg p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton width="40%" height={24} />
              <Skeleton width="30%" height={16} />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={`workflow-${i}`} className="border rounded-lg p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Skeleton width="60%" height={16} />
                      <Skeleton width={80} height={24} />
                    </div>
                    <Skeleton width="80%" height={14} />
                    <Skeleton width="50%" height={12} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="border rounded-lg p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton width="40%" height={24} />
              <Skeleton width="30%" height={16} />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={`notification-${i}`} className="border rounded-lg p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Skeleton width="50%" height={16} />
                      <Skeleton width={80} height={24} />
                    </div>
                    <Skeleton width="100%" height={60} variant="rectangular" />
                    <Skeleton width="70%" height={12} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Skeleton Workflow - for workflow execution list
export function SkeletonWorkflow({ items = 3, className = '' }: { items?: number; className?: string }) {
  return (
    <div className={`border rounded-lg ${className}`}>
      <div className="p-4 sm:p-6">
        <Skeleton width="40%" height={24} className="mb-2" />
        <Skeleton width="60%" height={16} />
      </div>
      <div className="divide-y">
        {Array.from({ length: items }).map((_, i) => (
          <div key={`workflow-${i}`} className="p-4 sm:p-6">
            <div className="flex items-start gap-4">
              <Skeleton variant="circular" width={40} height={40} />
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <Skeleton width={120} height={20} />
                  <Skeleton width={80} height={20} />
                </div>
                <Skeleton width="80%" height={14} />
                <div className="flex gap-2">
                  <Skeleton width={100} height={24} />
                  <Skeleton width={100} height={24} />
                  <Skeleton width={100} height={24} />
                  <Skeleton width={100} height={24} />
                </div>
                <Skeleton width="60%" height={12} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
