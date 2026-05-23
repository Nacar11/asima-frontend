import Link from 'next/link';
import { cn } from '@/lib/cn';

/**
 * Top-level layout wrapper for authenticated pages (SPEC §5b):
 *   - Black navbar (`bg-neutral-950`) fixed at the top, full-width.
 *   - White content area, max-width 1280px, centered, generous padding.
 *
 * Page-scoped widgets (user menu, breadcrumbs) compose into the right
 * slot via the `actions` prop. The `(app)/layout.tsx` route group passes
 * the current user once F4 lands.
 */
export function AppShell({
  children,
  actions,
}: {
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-neutral-900 bg-neutral-950 text-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <Link
            href="/dashboard"
            className="text-base font-semibold tracking-tight transition-opacity hover:opacity-80"
          >
            asima
          </Link>
          <nav className="flex items-center gap-2">{actions}</nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 p-6 md:p-10">{children}</main>
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
