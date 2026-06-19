'use client';

import { useEffect, useState } from 'react';
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
import { useTimeCorrectionActions } from '@/features/time-correction/hooks/use-time-correction-actions';
import { isoToLocalInput, localInputToIso } from '@/features/time-correction/datetime';
import { isTcPending } from '@/features/time-correction/format';
import { TcStatusBadge } from '@/features/time-correction/components/tc-status-badge';
import type { TimeCorrectionRequest } from '@/features/time-correction/schemas';

/**
 * HR detail + action drawer for a single time-correction request.
 * Approve here is the override path (LEAVE/TIME_CORRECTION:ApproveAny).
 * On final approval the backend rewrites the time_entries row
 * (source='correction'); this drawer only drives the request lifecycle.
 */
export function TcDetailDrawer({
  request,
  employeeName,
  open,
  onClose,
  canApproveAny,
  canUpdate = false,
  canDelete,
}: {
  request: TimeCorrectionRequest | null;
  employeeName: string;
  open: boolean;
  onClose: () => void;
  canApproveAny: boolean;
  canUpdate?: boolean;
  canDelete: boolean;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState('');
  const [editing, setEditing] = useState(false);
  const [edit, setEdit] = useState({ work_date: '', time_in: '', time_out: '', reason: '' });

  useEffect(() => {
    setRejecting(false);
    setNote('');
    setEditing(false);
    if (request) {
      setEdit({
        work_date: request.work_date,
        time_in: isoToLocalInput(request.proposed_time_in),
        time_out: request.proposed_time_out ? isoToLocalInput(request.proposed_time_out) : '',
        reason: request.reason,
      });
    }
  }, [request]);

  const { approve, reject, cancel, update } = useTimeCorrectionActions(request?.id);

  if (!request) return null;
  const pending = isTcPending(request.status);
  const busy = approve.isPending || reject.isPending || cancel.isPending || update.isPending;

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Correction #{request.id}</SheetTitle>
          <SheetDescription>{employeeName}</SheetDescription>
        </SheetHeader>

        <SheetBody className="space-y-4">
          <Detail label="Status">
            <TcStatusBadge status={request.status} />
          </Detail>
          <Detail label="Work date">{request.work_date}</Detail>

          {editing ? (
            <div className="space-y-3 rounded-md border border-neutral-200 p-3">
              <LabeledInput
                label="Work date"
                type="date"
                value={edit.work_date}
                onChange={(v) => setEdit((s) => ({ ...s, work_date: v }))}
              />
              <LabeledInput
                label="Time in"
                type="datetime-local"
                value={edit.time_in}
                onChange={(v) => setEdit((s) => ({ ...s, time_in: v }))}
              />
              <LabeledInput
                label="Time out"
                type="datetime-local"
                value={edit.time_out}
                onChange={(v) => setEdit((s) => ({ ...s, time_out: v }))}
              />
              <label className="block space-y-1 text-sm">
                <span className="font-medium text-neutral-800">Reason</span>
                <textarea
                  rows={2}
                  className={inputCls}
                  value={edit.reason}
                  onChange={(e) => setEdit((s) => ({ ...s, reason: e.target.value }))}
                />
              </label>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setEditing(false)} className={btnSecondary}>
                  Cancel edit
                </button>
                <button
                  type="button"
                  onClick={() =>
                    update.mutate(
                      {
                        work_date: edit.work_date,
                        proposed_time_in: localInputToIso(edit.time_in),
                        proposed_time_out: edit.time_out ? localInputToIso(edit.time_out) : null,
                        reason: edit.reason.trim(),
                      },
                      { onSuccess: () => setEditing(false) },
                    )
                  }
                  disabled={busy}
                  className={btnPrimary}
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <>
              <Detail label="Proposed in">{formatDateTimeInTz(request.proposed_time_in)}</Detail>
              <Detail label="Proposed out">
                {request.proposed_time_out ? formatDateTimeInTz(request.proposed_time_out) : '—'}
              </Detail>
              <Detail label="Reason">{request.reason}</Detail>
              <Detail label="Target entry">
                {request.target_entry_id
                  ? `#${request.target_entry_id}`
                  : 'Missed punch (new entry)'}
              </Detail>
            </>
          )}

          <Detail label="Submitted">{formatDateTimeInTz(request.submitted_at)}</Detail>
          {request.decided_at && (
            <Detail label="Decided">
              {formatDateTimeInTz(request.decided_at)}
              {request.decision_path ? ` (${request.decision_path})` : ''}
            </Detail>
          )}
          {request.decision_note && <Detail label="Note">{request.decision_note}</Detail>}

          {rejecting && (
            <div className="space-y-2 rounded-md border border-red-200 bg-red-50/40 p-3">
              <label className="block space-y-1 text-sm">
                <span className="font-medium text-neutral-800">Rejection note</span>
                <textarea
                  rows={2}
                  className={inputCls}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </label>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setRejecting(false)} className={btnSecondary}>
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => reject.mutate(note.trim(), { onSuccess: () => onClose() })}
                  disabled={busy || note.trim().length === 0}
                  className={btnDanger}
                >
                  Confirm reject
                </button>
              </div>
            </div>
          )}
        </SheetBody>

        {pending && !rejecting && !editing && (
          <SheetFooter className="flex-wrap gap-2">
            {canUpdate && (
              <button type="button" onClick={() => setEditing(true)} className={btnSecondary}>
                Edit
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={() => cancel.mutate(undefined, { onSuccess: () => onClose() })}
                disabled={busy}
                className={btnSecondary}
              >
                Cancel request
              </button>
            )}
            {canApproveAny && (
              <button type="button" onClick={() => setRejecting(true)} className={btnDanger}>
                Reject
              </button>
            )}
            {canApproveAny && (
              <button
                type="button"
                onClick={() => approve.mutate(undefined, { onSuccess: () => onClose() })}
                disabled={busy}
                className={btnPrimary}
              >
                Approve (override)
              </button>
            )}
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

function LabeledInput({
  label,
  type,
  value,
  onChange,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="font-medium text-neutral-800">{label}</span>
      <input
        type={type}
        className={inputCls}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

const inputCls =
  'block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950';

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

const btnSecondary = cn(
  'rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700',
  'hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-900',
);
