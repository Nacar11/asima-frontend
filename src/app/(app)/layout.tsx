import { AppShell } from '@/components/layout/app-shell';
import { AuthGate } from '@/features/auth/components/auth-gate';

/*
 * Layout for the authenticated surface. AuthGate handles loading +
 * unauthenticated redirect; AppShell owns the sidebar, top navbar, and
 * the user menu (which holds Profile + Sign out).
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <AppShell>{children}</AppShell>
    </AuthGate>
  );
}
