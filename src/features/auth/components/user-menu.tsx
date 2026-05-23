'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, LogOut, UserCircle } from 'lucide-react';
import { useAuth } from '@/features/auth/use-auth';
import { cn } from '@/lib/cn';

/**
 * Account menu rendered in the top navbar's right slot. Trigger shows the
 * user's initials and full name; menu offers Profile + Sign out, with Sign
 * out visually separated as a destructive action.
 *
 * Closes on outside click, Escape, or route change (Profile link triggers
 * the latter implicitly).
 */
export function UserMenu() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const firstItemRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) firstItemRef.current?.focus();
  }, [open]);

  if (!user) return null;

  const initials =
    `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase() || '?';
  const fullName = `${user.first_name} ${user.last_name}`.trim();

  async function handleLogout() {
    setPending(true);
    try {
      await logout();
      router.replace('/login');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          'inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-neutral-800 transition-colors',
          'hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-1',
        )}
      >
        <span
          aria-hidden
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-xs font-semibold text-white"
        >
          {initials}
        </span>
        <span className="hidden max-w-[10rem] truncate font-medium sm:inline">
          {fullName}
        </span>
        <ChevronDown
          aria-hidden
          className={cn(
            'h-4 w-4 text-neutral-500 transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account menu"
          className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg ring-1 ring-black/5"
        >
          <div className="border-b border-neutral-100 px-3 py-2.5">
            <p className="text-xs text-neutral-500">Signed in as</p>
            <p className="truncate text-sm font-medium text-neutral-900">
              {fullName}
            </p>
          </div>
          <Link
            ref={firstItemRef}
            role="menuitem"
            href="/employee/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 focus:bg-neutral-100 focus:outline-none"
          >
            <UserCircle className="h-4 w-4 text-neutral-500" aria-hidden />
            Profile
          </Link>
          <div className="border-t border-neutral-100" />
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            disabled={pending}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 focus:bg-red-50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            {pending ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      )}
    </div>
  );
}
