import { leaveApi } from '@/features/leave/api';
import { timeCorrectionApi } from '@/features/time-correction/api';
import type { PendingApprovalKind } from '@/features/approvals/schemas';

/**
 * Per-kind approve/reject handlers for the cross-resource inbox. The
 * inbox row carries the request `id` and its `kind`; the actual
 * approve/reject lives on each resource's own top-level route
 * (`/leave-requests/:id/approve`, etc.), so we dispatch by kind here.
 *
 * Both leave and time_correction are registered. Kinds absent from this
 * map render no action buttons.
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
  time_correction: {
    approve: (id) => timeCorrectionApi.approve(id),
    reject: (id, note) => timeCorrectionApi.reject(id, note),
  },
};
