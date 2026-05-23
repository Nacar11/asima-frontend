import type { PermissionCode } from './permission-codes';

/**
 * AND-semantics permission check. Returns true iff:
 *   - the user is a system admin (backend's PermissionsGuard bypass), OR
 *   - no permission is required (undefined / empty array), OR
 *   - every code in `required` appears in `userPermissions`.
 *
 * Used by both the sidebar filter (predicate per item) and the
 * <RequirePermission> route gate (predicate per page). The single
 * shared helper keeps "what counts as authorized" defined in exactly
 * one place.
 */
export function hasPermission(
  userPermissions: readonly string[],
  required: PermissionCode | readonly PermissionCode[] | undefined,
  isSystemAdmin: boolean,
): boolean {
  if (isSystemAdmin) return true;
  if (required === undefined) return true;

  const needed = Array.isArray(required) ? required : [required as PermissionCode];
  if (needed.length === 0) return true;

  return needed.every((code) => userPermissions.includes(code));
}
