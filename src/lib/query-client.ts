import { QueryClient } from '@tanstack/react-query';

/**
 * Single QueryClient instance for the app.
 *
 * Defaults:
 *   - 30s `staleTime` — the timesheet UI doesn't need sub-second freshness.
 *   - Refetch on window focus is OFF for v0 (too chatty against the
 *     backend's 60-req/min default throttle). Re-enable per-query if a
 *     screen genuinely needs it.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          // Don't retry 4xx — they're not transient. Retry 5xx up to 2 times.
          if (typeof error === 'object' && error && 'status' in error) {
            const status = (error as { status: number }).status;
            if (status >= 400 && status < 500) return false;
          }
          return failureCount < 2;
        },
      },
    },
  });
}
