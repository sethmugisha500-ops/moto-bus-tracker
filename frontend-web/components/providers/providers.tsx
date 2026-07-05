 'use client';

import React from 'react';
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// React Query Devtools is optional; import at runtime to avoid build-time errors when
// the package isn't installed (fixes "Cannot find module '@tanstack/react-query-devtools'").


export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Load devtools only in browser and when available */}
      {typeof window !== 'undefined' ? (
        (() => {
          try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
            const { ReactQueryDevtools } = require('@tanstack/react-query-devtools');
            return React.createElement(ReactQueryDevtools, { initialIsOpen: false });
          } catch (e) {
            return null;
          }
        })()
      ) : null}
    </QueryClientProvider>
  );
}