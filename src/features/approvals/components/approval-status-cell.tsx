import { cn } from '@/lib/cn';
import { approverLabel } from '@/lib/approver-label';
import type { PendingApproval } from '../schemas';

/**
 * The `STATUS` cell for the approvals inbox: a "Pending L{n}" badge plus a line
 * naming the current-step approver, with a "(you)" marker when the viewer is
 * that approver (`current_approver_id === viewerId`). Replaces the bare step
 * number so HR's org-wide view shows *who* a request is waiting on.
 *
 * Badge classes are defined locally (the approvals slice doesn't reach into
 * leave's `LEAVE_STATUS_META`) while matching the app's amber/pending language.
 */
export function ApprovalStatusCell({ row, viewerId }: { row: PendingApproval; viewerId?: number }) {
  // Inbox rows are always pending; guard so an unexpected step can't render "L0".
  const level = row.current_step === 2 ? 'L2' : 'L1';
  const isSelf = viewerId != null && row.current_approver_id === viewerId;

  return (
    <div className="flex flex-col gap-1">
      <span
        className={cn(
          'inline-flex w-fit rounded-md px-2 py-0.5 text-xs font-medium tabular-nums',
          'bg-amber-100 text-amber-800',
        )}
      >
        Pending {level}
      </span>
      <p className="text-xs leading-snug text-neutral-600">
        Awaiting {level} ·{' '}
        <span className="text-neutral-900">{approverLabel(row.current_approver_name, isSelf)}</span>
      </p>
    </div>
  );
}
