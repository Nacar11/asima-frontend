'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/features/auth/use-auth';
import { cn } from '@/lib/cn';

/*
 * Logout control rendered in the AppShell's action slot. Logout is
 * stateless on the backend (SPEC §6), so the only failure modes are
 * network-level — and even those don't matter for client state, since
 * AuthProvider.logout drops tokens regardless. We push to /login here
 * (not /login?reason=expired) because this is an intentional sign-out,
 * not a session expiry.
 */
export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const { logout, user } = useAuth();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    try {
      await logout();
      router.replace('/login');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {user && (
        <span className="hidden text-xs text-neutral-300 sm:inline">
          {user.first_name} {user.last_name}
        </span>
      )}
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md border border-neutral-700 px-2.5 py-1.5 text-xs font-medium text-neutral-100 transition-colors',
          'hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-neutral-950',
          'disabled:cursor-not-allowed disabled:opacity-60',
          className,
        )}
      >
        <LogOut className="h-3.5 w-3.5" aria-hidden />
        {pending ? 'Signing out…' : 'Sign out'}
      </button>
    </div>
  );
}
