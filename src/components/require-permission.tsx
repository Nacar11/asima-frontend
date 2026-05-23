'use client';

import { useAuth } from '@/features/auth/use-auth';
import { usePermissions } from '@/features/auth/use-permissions';
import { hasPermission } from '@/features/auth/permission-utils';
import type { PermissionCode } from '@/features/auth/permission-codes';
import { NotAuthorized } from '@/components/not-authorized';

/**
 * Page-level permission gate. Wrap an admin page's body:
 *
 *   <RequirePermission code="USER:View">
 *     <AdminUsersPage />
 *   </RequirePermission>
 *
 * Renders nothing while the permissions query is loading (sidebar
 * already shows the chrome — the page area going briefly blank is less
 * jarring than flashing a 403 that then disappears). Otherwise either
 * renders children or <NotAuthorized />.
 *
 * Defense-in-depth note: this is UX only. Backend PermissionsGuard is
 * the actual security boundary — an attacker who skips this wrapper
 * still hits 403 on the underlying API calls.
 */
export function RequirePermission({
  code,
  children,
}: {
  code: PermissionCode | readonly PermissionCode[];
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const { permissions, isLoading } = usePermissions();

  if (isLoading) return null;

  const allowed = hasPermission(permissions, code, user?.system_admin ?? false);
  if (!allowed) return <NotAuthorized />;

  return <>{children}</>;
}
