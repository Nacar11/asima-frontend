'use client';

import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

/**
 * 403-style screen rendered inline by <RequirePermission> when the
 * current user lacks the required permission. Explicit (not a 404)
 * because hiding the existence of an admin page from a signed-in user
 * who guessed its URL is theater — the backend still rejects them
 * with 403, so we may as well be honest about why.
 */
export function NotAuthorized() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
        <ShieldAlert className="h-6 w-6" aria-hidden />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-950">
        Not authorized
      </h1>
      <p className="text-sm text-neutral-500">
        You don&apos;t have permission to view this page. If you think this is
        a mistake, contact your administrator.
      </p>
      <Link
        href="/employee/home"
        className="mt-2 inline-flex items-center rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2"
      >
        Go to Home
      </Link>
    </div>
  );
}
