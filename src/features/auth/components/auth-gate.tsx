'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../use-auth';

/*
 * Route guard for the (app) group. Gates protected pages on auth status:
 *   - loading        → show a non-blocking placeholder (no flash of /login)
 *   - unauthenticated → redirect to /login
 *   - authenticated  → render children
 *
 * The session-expired toast is fired by AuthProvider, which is the only
 * code that can actually witness an expiry (a failed refresh on bootstrap
 * or during a live request). This gate just routes.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { status } = useAuth();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  if (status === 'authenticated') {
    return <>{children}</>;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[60vh] items-center justify-center text-sm text-neutral-500"
    >
      Loading…
    </div>
  );
}
