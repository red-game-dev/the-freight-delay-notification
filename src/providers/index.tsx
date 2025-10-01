'use client';

import dynamic from 'next/dynamic';
import { NextThemeProvider } from '@/providers/NextThemeProvider';
import { QueryProvider } from '@/providers/QueryProvider';

// Import ToastContainer dynamically with no SSR to avoid Zustand SSR issues
const ToastContainer = dynamic(
  () => import('@/components/ui/ToastContainer').then((mod) => ({ default: mod.ToastContainer })),
  { ssr: false }
);

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryProvider>
      <NextThemeProvider
        attribute="data-theme"
        defaultTheme="light"
        enableSystem={true}
        disableTransitionOnChange={false}
      >
        {children}
        <ToastContainer />
      </NextThemeProvider>
    </QueryProvider>
  );
}