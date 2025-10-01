'use client';

import { NextThemeProvider } from '@/providers/NextThemeProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { ToastContainer } from '@/components/ui/ToastContainer';

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