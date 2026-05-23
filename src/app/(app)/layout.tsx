import { AppShell } from '@/components/layout/app-shell';
import { AuthGate } from '@/features/auth/components/auth-gate';
import { LogoutButton } from '@/features/auth/components/logout-button';

/*
 * Layout for the authenticated surface. AuthGate handles loading +
 * unauthenticated redirect; AppShell renders the navbar with the
 * LogoutButton in the action slot.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <AppShell actions={<LogoutButton />}>{children}</AppShell>
    </AuthGate>
  );
}
