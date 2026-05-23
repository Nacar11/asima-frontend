'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/use-auth';

/*
 * Layout for unauthenticated surfaces (/login today, /forgot in v1).
 * No AppShell — just a centered card on a plain white canvas, matching
 * SPEC §5b (black chrome, white canvas) without the navbar.
 *
 * If a user lands here while already authenticated (e.g. backed into
 * /login from /dashboard), bounce them to /dashboard so they don't
 * accidentally re-enter credentials.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { status } = useAuth();

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard');
    }
  }, [status, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-950">asima</h1>
          <p className="mt-1 text-sm text-neutral-500">Employee time management</p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-8 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
