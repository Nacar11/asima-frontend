import type { TcStatus } from './schemas';

/** Badge label + Tailwind classes per status (mirrors leave's). */
export const TC_STATUS_META: Record<TcStatus, { label: string; className: string }> = {
  pending_l1: { label: 'Pending L1', className: 'bg-amber-100 text-amber-800' },
  pending_l2: { label: 'Pending L2', className: 'bg-amber-100 text-amber-800' },
  approved: { label: 'Approved', className: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-800' },
  cancelled: { label: 'Cancelled', className: 'bg-neutral-100 text-neutral-600' },
};

export function isTcPending(status: TcStatus): boolean {
  return status === 'pending_l1' || status === 'pending_l2';
}
