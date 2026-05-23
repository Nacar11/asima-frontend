'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CalendarDays,
  Clock,
  Home,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { UserMenu } from '@/features/auth/components/user-menu';

/**
 * Top-level layout wrapper for authenticated pages (SPEC §5b).
 *
 * Composition:
 *   - Sidebar (z-50): fixed full-height, w-64; persistent on md+, drawer on
 *     mobile. Stays in front of the topbar so its top-left corner is the
 *     visual anchor.
 *   - Top navbar (z-30): fixed, offset to `md:left-64` so it sits to the
 *     right of the sidebar with no overlap. Holds the user menu (right) and
 *     the mobile hamburger (left).
 *   - Content: padded for both — `md:pl-64` for the sidebar, `pt-14` for
 *     the topbar.
 */
const NAV_LINKS = [
  { href: '/employee/home', label: 'Home', icon: Home },
  { href: '/employee/timesheet', label: 'Time sheet', icon: Clock },
  { href: '/employee/schedule', label: 'Schedule', icon: CalendarDays },
] as const;

function isActive(pathname: string | null, href: string) {
  return pathname?.startsWith(href) ?? false;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Sidebar — z-50 keeps it in front of the topbar at the top-left corner. */}
      <aside
        id="app-sidebar"
        aria-label="Primary navigation"
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-neutral-900 bg-neutral-950 text-neutral-100 transition-transform duration-200 ease-out',
          'md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-neutral-900 px-4">
          <Link
            href="/employee/home"
            className="text-base font-semibold tracking-tight transition-opacity hover:opacity-80"
          >
            asima
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
            className="inline-flex h-11 w-11 items-center justify-center rounded-md text-neutral-300 hover:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-white md:hidden"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {NAV_LINKS.map((link) => {
              const Icon = link.icon;
              const active = isActive(pathname, link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      active
                        ? 'bg-neutral-800 text-white'
                        : 'text-neutral-300 hover:bg-neutral-900 hover:text-white',
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                    <span>{link.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Mobile drawer backdrop. */}
      <button
        type="button"
        aria-label="Close navigation"
        tabIndex={open ? 0 : -1}
        onClick={() => setOpen(false)}
        className={cn(
          'fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 md:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      {/* Top navbar — starts to the right of the sidebar on md+. */}
      <header className="fixed inset-x-0 top-0 z-30 h-14 border-b border-neutral-200 bg-white md:left-64">
        <div className="flex h-full items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open navigation"
              aria-expanded={open}
              aria-controls="app-sidebar"
              className="inline-flex h-11 w-11 items-center justify-center rounded-md text-neutral-700 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-900 md:hidden"
            >
              <Menu className="h-5 w-5" aria-hidden />
            </button>
            <Link
              href="/employee/home"
              className="text-sm font-semibold tracking-tight text-neutral-900 md:hidden"
            >
              asima
            </Link>
          </div>
          <UserMenu />
        </div>
      </header>

      {/* Content offset for both sidebar (md:pl-64) and topbar (pt-14). */}
      <div className="md:pl-64">
        <main className="mx-auto w-full max-w-7xl px-6 pb-10 pt-20 md:px-10 md:pt-24">
          {children}
        </main>
      </div>
    </div>
  );
}

/**
 * Card primitive used across self-service screens. Pre-shadcn — once F4
 * lands we may regenerate via `npx shadcn add card`, at which point this
 * file becomes a thin re-export.
 */
export function Card({
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-lg border border-neutral-200 bg-white p-6 shadow-sm', className)}
      {...rest}
    />
  );
}
