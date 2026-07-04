// Public API for the `auth` slice. Other slices import ONLY from here —
// reaching into internals (`@/features/auth/use-auth`, etc.) fails lint.
export { useAuth } from './use-auth';
export { usePermissions } from './use-permissions';
export { hasPermission } from './permission-utils';
export { AuthUserSchema } from './schemas';
