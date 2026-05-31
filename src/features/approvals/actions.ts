import { leaveApi } from '@/features/leave/api';
import type { PendingApprovalKind } from '@/features/approvals/schemas';

/**
 * Per-kind approve/reject handlers for the cross-resource inbox. The
 * inbox row carries the request `id` and its `kind`; the actual
 * approve/reject lives on each resource's own top-level route
 * (`/leave-requests/:id/approve`, etc.), so we dispatch by kind here.
 *
 * Leave lands in Phase 4; `time_correction` is registered in Phase 6.
 * Kinds absent from this map render no action buttons.
 */
export type ApprovalActionHandlers = {
  approve: (id: number) => Promise<unknown>;
  reject: (id: number, note: string) => Promise<unknown>;
};

export const APPROVAL_ACTIONS: Partial<Record<PendingApprovalKind, ApprovalActionHandlers>> = {
  leave: {
    approve: (id) => leaveApi.approve(id),
    reject: (id, note) => leaveApi.reject(id, note),
  },
};
