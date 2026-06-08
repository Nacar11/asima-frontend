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

  'APPROVAL:View',
  'APPROVAL:ApproveAny',

  // Leave + Time-Correction + Approval-Chain — landed 2026-05-30, Phase 0
  // of the leave plan (docs/plans/2026-05-30-leave-correction-and-approval-chains.md).
  // ViewOwn / ViewAll are split so the code itself encodes scope (Q2).
  'LEAVE:Create',
  'LEAVE:ViewOwn',
  'LEAVE:ViewAll',
  'LEAVE:Update',
  'LEAVE:Delete',
  'LEAVE:Approve',
  'LEAVE:ApproveAny',

  'TIME_CORRECTION:Create',
  'TIME_CORRECTION:ViewOwn',
  'TIME_CORRECTION:ViewAll',
  'TIME_CORRECTION:Update',
  'TIME_CORRECTION:Delete',
  'TIME_CORRECTION:Approve',
  'TIME_CORRECTION:ApproveAny',

  'APPROVAL_CHAIN:View',
  'APPROVAL_CHAIN:Update',

  'LEAVE_ALLOCATION:Create',
  'LEAVE_ALLOCATION:View',
] as const;

export type PermissionCode = (typeof PERMISSION_CODES)[number];
