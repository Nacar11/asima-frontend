import { cn } from '@/lib/cn';
import { LEAVE_STATUS_META } from '../format';
import type { LeaveStatus } from '../schemas';

export function LeaveStatusBadge({ status }: { status: LeaveStatus }) {
  const meta = LEAVE_STATUS_META[status];
  return (
    <span className={cn('inline-flex rounded-md px-2 py-0.5 text-xs font-medium', meta.className)}>
      {meta.label}
    </span>
  );
}
