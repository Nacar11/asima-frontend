'use client';

import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'sonner';
import { createQueryClient } from '@/lib/query-client';
import { AuthProvider } from '@/features/auth/auth-provider';

/**
 * Top-level client providers. Mounted once from the root layout.
 *
 * Order matters: QueryClientProvider wraps AuthProvider so the auth
 * effects can use queries if/when they need to (currently they call
 * the api module directly, but this keeps the door open).
 */
export function Providers({ children }: { children: React.ReactNode }) {
  // Keep one client per app instance — useState ensures it's not
  // recreated on re-render. (Component-fresh per server-rendered request
  // when running with SSR, which is fine.)
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        <Toaster position="top-right" richColors />
        {process.env.NODE_ENV !== 'production' && (
          <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
        )}
      </AuthProvider>
    </QueryClientProvider>
  );
}
