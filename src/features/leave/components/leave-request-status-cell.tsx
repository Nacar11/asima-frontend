import { cn } from '@/lib/cn';
import { formatRelative } from '@/lib/format';
import { approverLabel } from '@/lib/approver-label';
import { LeaveStatusBadge } from './leave-status-badge';
import type { LeaveRequest } from '../schemas';

/**
 * The `STATUS` cell for the My-requests table: the status badge plus the
 * approval context — who the L1/L2 approvers are while pending, and who
 * decided (with a relative time) once approved / rejected / cancelled.
 *
 * Approver/decider names ride on the joined list read-model; any missing
 * one renders as an em dash (no L2, not yet decided, or a deactivated user).
 * `viewerId` marks the *pending* approver "(you)" when it's the signed-in user.
 */
export function LeaveRequestStatusCell({
  request,
  viewerId,
}: {
  request: LeaveRequest;
  viewerId?: number;
}) {
  return (
    <div className="flex flex-col gap-1">
      <LeaveStatusBadge status={request.status} />
      <div className="space-y-0.5 text-xs leading-snug">{supportingLines(request, viewerId)}</div>
    </div>
  );
}

function supportingLines(r: LeaveRequest, viewerId?: number): React.ReactNode {
  const hasL2 = r.l2_approver_id !== null;
  const isSelf = (approverId: number | null) => approverId != null && approverId === viewerId;

  switch (r.status) {
    case 'pending_l1':
      return (
        <>
          <Line label="Awaiting L1" name={r.l1_approver_name} isSelf={isSelf(r.l1_approver_id)} />
          {hasL2 && <Line label="then L2" name={r.l2_approver_name} muted />}
        </>
      );
    case 'pending_l2':
      return (
        <>
          <Line label="L1 ✓" name={r.l1_approver_name} muted />
          <Line label="Awaiting L2" name={r.l2_approver_name} isSelf={isSelf(r.l2_approver_id)} />
        </>
      );
    case 'approved':
    case 'rejected':
      return <Decided name={r.decided_by_name} at={r.decided_at} />;
    case 'cancelled':
      return <Muted>{r.cancelled_at ? formatRelative(r.cancelled_at) : '—'}</Muted>;
    default:
      return null;
  }
}

/** "Awaiting L1 · Grace Hopper (you)" — an approver row in the chain. */
function Line({
  label,
  name,
  muted,
  isSelf,
}: {
  label: string;
  name?: string | null;
  muted?: boolean;
  isSelf?: boolean;
}) {
  return (
    <p className={cn(muted ? 'text-neutral-400' : 'text-neutral-600')}>
      {label} · <span className="text-neutral-900">{approverLabel(name, isSelf ?? false)}</span>
    </p>
  );
}

/** "by Edsger Dijkstra · 2 minutes ago" — the decision summary. */
function Decided({ name, at }: { name?: string | null; at: string | null }) {
  return (
    <p className="text-neutral-600">
      by <span className="text-neutral-900">{name ?? '—'}</span>
      {at ? <span className="text-neutral-400"> · {formatRelative(at)}</span> : null}
    </p>
  );
}

function Muted({ children }: { children: React.ReactNode }) {
  return <p className="text-neutral-400">{children}</p>;
}
