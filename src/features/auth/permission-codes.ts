/**
 * Typed mirror of the permission codes seeded by the backend at
 * `asima-backend/src/database/seeds/data/permissions.json`. Kept in sync
 * by convention, not codegen — when a new code is added to the seed,
 * add it here too, then `npm run typecheck` flags any consumer that
 * passes a stale code.
 *
 * Source of truth is the seed JSON, NOT the resource × action
 * cross-product — e.g. PERMISSION has only View/Update seeded, no
 * Create/Delete.
 */
export const PERMISSION_CODES = [
  'USER:Create',
  'USER:View',
  'USER:Update',
  'USER:Delete',

  'ROLE:Create',
  'ROLE:View',
  'ROLE:Update',
  'ROLE:Delete',

  'PERMISSION:View',
  'PERMISSION:Update',

  'TIME:Create',
  'TIME:View',
  'TIME:Update',
  'TIME:Delete',

  'SCHEDULE:Create',
  'SCHEDULE:View',
  'SCHEDULE:Update',
  'SCHEDULE:Delete',
] as const;

export type PermissionCode = (typeof PERMISSION_CODES)[number];
