'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/use-auth';

/*
 * Route guard for the (app) group. Gates protected pages on auth status:
 *   - loading        → show a non-blocking placeholder (no flash of /login)
 *   - unauthenticated → redirect to /login?reason=expired
 *   - authenticated  → render children
 *
 * Why `reason=expired` and not a clean /login? The login form picks up
 * that query and surfaces a "your session expired" toast (SPEC §6).
 * A direct unauth navigation (no prior session) is rare from a route
 * guard — by definition the user got here from a protected URL, so
 * "expired" is the truthful framing.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { status } = useAuth();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login?reason=expired');
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
