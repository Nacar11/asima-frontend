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
import { timeCorrectionApi } from '@/features/time-correction/api';
import { isTcPending } from '@/features/time-correction/format';
import { TcStatusBadge } from '@/features/time-correction/components/tc-status-badge';
import type { PendingApproval } from '@/features/approvals/schemas';

/**
 * Approver-facing detail drawer for a single time-correction request in the
 * pending-approvals inbox. Read-only by design — it does NOT own the
 * approve/reject mutations (the inbox does, so the table row and this drawer
 * share one code path). It fetches the full correction by id (the inbox row
 * is a thin `PendingApproval`) via the top-level approver route.
 *
 * Distinct from the HR `TcDetailDrawer`, which is admin-coupled (Edit /
 * Cancel via `admin.*` and an "Approve override" path).
 */
export function TimeCorrectionApprovalDetailDrawer({
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
    queryKey: ['time-correction', 'request', row?.id],
    queryFn: () => timeCorrectionApi.getOne(row!.id),
    enabled: open && row != null,
  });
  const request = query.data ?? null;
  const pending = request != null && isTcPending(request.status);

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Correction{row ? ` #${row.id}` : ''}</SheetTitle>
          <SheetDescription>{row?.employee_name}</SheetDescription>
        </SheetHeader>

        <SheetBody className="space-y-4">
          {query.isLoading && <p className="text-sm text-neutral-500">Loading details…</p>}
          {query.isError && (
            <p className="text-sm text-red-600">Couldn&apos;t load this correction. It may have already been decided.</p>
          )}

          {request && (
            <>
              <Detail label="Status">
                <TcStatusBadge status={request.status} />
              </Detail>
              <Detail label="Work date">{request.work_date}</Detail>
              <Detail label="Proposed in">{formatDateTimeInTz(request.proposed_time_in)}</Detail>
              <Detail label="Proposed out">
                {request.proposed_time_out ? formatDateTimeInTz(request.proposed_time_out) : '—'}
              </Detail>
              <Detail label="Reason">{request.reason}</Detail>
              <Detail label="Target entry">
                {request.target_entry_id ? `#${request.target_entry_id}` : 'Missed punch (new entry)'}
              </Detail>
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
            <button type="button" onClick={() => onReject(row)} disabled={busy} className={btnDanger}>
              Reject
            </button>
            <button type="button" onClick={() => onApprove(row)} disabled={busy} className={btnPrimary}>
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
