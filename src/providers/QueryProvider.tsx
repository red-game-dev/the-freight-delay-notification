/**
 * React Query Provider
 * Wraps the application with QueryClientProvider
 */

"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { FC, ReactNode } from "react";
import { queryClient } from "@/core/infrastructure/http/queryClient";
import { clientEnv } from "@/infrastructure/config/ClientEnv";

interface QueryProviderProps {
  children: ReactNode;
}

export const QueryProvider: FC<QueryProviderProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {clientEnv.isDevelopment && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
};
