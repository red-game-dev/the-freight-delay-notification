'use client';

import { NextThemeProvider } from '@/providers/NextThemeProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { ToastProvider } from '@/components/ui/Toast';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryProvider>
      <ToastProvider>
        <NextThemeProvider
          attribute="data-theme"
          defaultTheme="light"
          enableSystem={true}
          disableTransitionOnChange={false}
        >
          {children}
        </NextThemeProvider>
      </ToastProvider>
    </QueryProvider>
  );
}