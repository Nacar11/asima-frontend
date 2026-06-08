import type { DayPortion, LeaveStatus, LeaveType } from './schemas';

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  vacation: 'Vacation',
  sick: 'Sick',
  bereavement: 'Bereavement',
  birthday: 'Birthday',
  emergency: 'Emergency',
};

export const LEAVE_PORTION_LABELS: Record<DayPortion, string> = {
  full: 'Full day',
  first_half: 'First half',
  second_half: 'Second half',
};

/** `'09:00:00'` → `'9:00 AM'`; empty for null/undefined. */
export function formatTime12h(time: string | null | undefined): string {
  if (!time) return '';
  const [hStr, mStr] = time.split(':');
  const h = Number(hStr);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${(mStr ?? '00').padStart(2, '0')} ${period}`;
}

/** `'09:00:00','14:00:00'` → `'9:00 AM – 2:00 PM'`; empty if either side is null. */
export function formatWindow(start: string | null, end: string | null): string {
  if (!start || !end) return '';
  return `${formatTime12h(start)} – ${formatTime12h(end)}`;
}

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
