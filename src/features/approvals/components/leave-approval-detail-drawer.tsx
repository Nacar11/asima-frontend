'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/cn';
import { formatDateTimeInTz } from '@/lib/format';
import { leaveApi } from '@/features/leave/api';
import { leaveKeys } from '@/features/leave/keys';
import {
  LEAVE_PORTION_LABELS,
  LEAVE_TYPE_LABELS,
  formatWindow,
  isPending,
} from '@/features/leave/format';
import { LeaveStatusBadge } from '@/features/leave/components/leave-status-badge';
import { LeaveAttachment } from '@/features/leave/components/leave-attachment';
import type { PendingApproval } from '@/features/approvals/schemas';

/**
 * Approver-facing detail drawer for a single leave request in the pending-
 * approvals inbox. Read-only by design — it does NOT own the approve/reject
 * mutations (the inbox does, so the table row and this drawer share one code
 * path). It fetches the full request by id (the inbox row is a thin
 * `PendingApproval`) via the top-level approver route, then surfaces every
 * field plus the attachment when present.
 *
 * Distinct from the HR `LeaveDetailDrawer`, which is admin-coupled (Edit /
 * Cancel via `admin.*` and an "Approve override" path). Reusing that here
 * would force a caller-role branch, which the admin/self-service contract
 * forbids.
 */
export function LeaveApprovalDetailDrawer({
  row,
  open,
  onClose,
  onApprove,
  onReject,
  busy = false,
}: {
  row: PendingApproval | null;
  open: boolean;
  onClose: () => void;
  onApprove?: (row: PendingApproval) => void;
  onReject?: (row: PendingApproval) => void;
  busy?: boolean;
}) {
  const query = useQuery({
    queryKey: leaveKeys.request(row?.id),
    queryFn: () => leaveApi.getOne(row!.id),
    enabled: open && row != null,
  });
  const request = query.data ?? null;
  const pending = request != null && isPending(request.status);

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Leave request{row ? ` #${row.id}` : ''}</SheetTitle>
          <SheetDescription>{row?.employee_name}</SheetDescription>
        </SheetHeader>

        <SheetBody className="space-y-4">
          {query.isLoading && <p className="text-sm text-neutral-500">Loading details…</p>}
          {query.isError && (
            <p className="text-sm text-red-600">
              Couldn&apos;t load this request. It may have already been decided.
            </p>
          )}

          {request && (
            <>
              <Detail label="Status">
                <LeaveStatusBadge status={request.status} />
              </Detail>
              <Detail label="Type">{LEAVE_TYPE_LABELS[request.leave_type]}</Detail>
              <Detail label="Dates">
                {request.start_date} → {request.end_date}
              </Detail>
              <Detail label="Duration">
                {request.day_portion === 'full'
                  ? `${request.working_days} working day${request.working_days === 1 ? '' : 's'}`
                  : `${LEAVE_PORTION_LABELS[request.day_portion]} · ${request.working_days} day` +
                    (formatWindow(request.start_time, request.end_time)
                      ? ` · ${formatWindow(request.start_time, request.end_time)}`
                      : '')}
              </Detail>
              <Detail label="Reason">{request.reason ?? '—'}</Detail>
              {request.attachment_id != null && (
                <Detail label="Attachment">
                  <LeaveAttachment requestId={request.id} />
                </Detail>
              )}
              <Detail label="Submitted">{formatDateTimeInTz(request.submitted_at)}</Detail>
              {request.decided_at && (
                <Detail label="Decided">
                  {formatDateTimeInTz(request.decided_at)}
                  {request.decision_path ? ` (${request.decision_path})` : ''}
                </Detail>
              )}
              {request.decision_note && <Detail label="Note">{request.decision_note}</Detail>}
            </>
          )}
        </SheetBody>

        {pending && row && onApprove && onReject && (
          <SheetFooter className="flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onReject(row)}
              disabled={busy}
              className={btnDanger}
            >
              Reject
            </button>
            <button
              type="button"
              onClick={() => onApprove(row)}
              disabled={busy}
              className={btnPrimary}
            >
              {busy ? 'Working…' : 'Approve'}
            </button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</span>
      <span className="text-sm text-neutral-900">{children}</span>
    </div>
  );
}

const btnPrimary = cn(
  'rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white shadow-sm',
  'hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2',
  'disabled:cursor-not-allowed disabled:opacity-60',
);

const btnDanger = cn(
  'rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm',
  'hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2',
  'disabled:cursor-not-allowed disabled:opacity-60',
);
