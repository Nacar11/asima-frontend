import type { LeaveStatus, LeaveType } from './schemas';

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  annual: 'Annual',
  sick: 'Sick',
  bereavement: 'Bereavement',
  unpaid: 'Unpaid',
  other: 'Other',
};

/** Badge label + Tailwind classes per status. */
export const LEAVE_STATUS_META: Record<LeaveStatus, { label: string; className: string }> = {
  pending_l1: { label: 'Pending L1', className: 'bg-amber-100 text-amber-800' },
  pending_l2: { label: 'Pending L2', className: 'bg-amber-100 text-amber-800' },
  approved: { label: 'Approved', className: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-800' },
  cancelled: { label: 'Cancelled', className: 'bg-neutral-100 text-neutral-600' },
};

/** The states a request can still be cancelled / acted on from. */
export function isPending(status: LeaveStatus): boolean {
  return status === 'pending_l1' || status === 'pending_l2';
}
