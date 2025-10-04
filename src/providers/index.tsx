"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { GoogleMapsProvider } from "@/providers/GoogleMapsProvider";
import { NextThemeProvider } from "@/providers/NextThemeProvider";
import { QueryProvider } from "@/providers/QueryProvider";

// Import ToastContainer dynamically with no SSR to avoid Zustand SSR issues
const ToastContainer = dynamic(
  () =>
    import("@/components/ui/ToastContainer").then((mod) => ({
      default: mod.ToastContainer,
    })),
  { ssr: false },
);

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryProvider>
      <GoogleMapsProvider>
        <NextThemeProvider
          attribute="data-theme"
          defaultTheme="light"
          enableSystem={true}
          disableTransitionOnChange={false}
        >
          {children}
          <ToastContainer />
        </NextThemeProvider>
      </GoogleMapsProvider>
    </QueryProvider>
  );
}
