'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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
import { approvalKeys } from '@/features/approvals/keys';
import {
  LEAVE_PORTION_LABELS,
  LEAVE_TYPE_LABELS,
  canCancel,
  formatWindow,
  isPending,
} from '@/features/leave/format';
import { LeaveStatusBadge } from '@/features/leave/components/leave-status-badge';
import { LeaveAttachment } from '@/features/leave/components/leave-attachment';
import { LEAVE_TYPES, type LeaveRequest, type LeaveType } from '@/features/leave/schemas';

/**
 * HR detail + action drawer for a single leave request.
 *
 * Approve here is the *override* path (HR holds LEAVE:ApproveAny, not the
 * chain placement) — the backend records decision_path='override'. Edit
 * and cancel are pending-only (Q3): terminal requests are immutable.
 */
export function LeaveDetailDrawer({
  request,
  employeeName,
  open,
  onClose,
  canApproveAny,
  canUpdate,
  canDelete,
}: {
  request: LeaveRequest | null;
  employeeName: string;
  open: boolean;
  onClose: () => void;
  canApproveAny: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}) {
  const queryClient = useQueryClient();
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState('');
  const [editing, setEditing] = useState(false);
  const [edit, setEdit] = useState<{
    leave_type: LeaveType;
    start_date: string;
    end_date: string;
    reason: string;
  }>({ leave_type: 'vacation', start_date: '', end_date: '', reason: '' });

  useEffect(() => {
    setRejecting(false);
    setNote('');
    setEditing(false);
    if (request) {
      setEdit({
        leave_type: request.leave_type,
        start_date: request.start_date,
        end_date: request.end_date,
        reason: request.reason ?? '',
      });
    }
  }, [request]);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: leaveKeys.all });
    void queryClient.invalidateQueries({ queryKey: approvalKeys.all });
  };

  const approveMutation = useMutation({
    mutationFn: () => leaveApi.approve(request!.id),
    onSuccess: () => {
      invalidate();
      toast.success('Request approved.');
      onClose();
    },
    onError: () => toast.error('Could not approve the request.'),
  });

  const rejectMutation = useMutation({
    mutationFn: () => leaveApi.reject(request!.id, note.trim()),
    onSuccess: () => {
      invalidate();
      toast.success('Request rejected.');
      onClose();
    },
    onError: () => toast.error('Could not reject the request.'),
  });

  const cancelMutation = useMutation({
    mutationFn: () => leaveApi.admin.cancel(request!.id),
    onSuccess: () => {
      invalidate();
      toast.success('Request cancelled.');
      onClose();
    },
    onError: () => toast.error('Could not cancel the request.'),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      leaveApi.admin.update(request!.id, {
        leave_type: edit.leave_type,
        start_date: edit.start_date,
        end_date: edit.end_date,
        reason: edit.reason.trim() ? edit.reason.trim() : null,
      }),
    onSuccess: () => {
      invalidate();
      toast.success('Request updated.');
      setEditing(false);
    },
    onError: () => toast.error('Could not update the request.'),
  });

  if (!request) return null;
  const pending = isPending(request.status);
  // Edit / approve / reject stay pending-only; cancel follows the broader rule
  // (active + not fully elapsed), matching the backend cancel guard.
  const cancellable = canCancel(request);
  const busy =
    approveMutation.isPending ||
    rejectMutation.isPending ||
    cancelMutation.isPending ||
    updateMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Leave request #{request.id}</SheetTitle>
          <SheetDescription>{employeeName}</SheetDescription>
        </SheetHeader>

        <SheetBody className="space-y-4">
          <Detail label="Status">
            <LeaveStatusBadge status={request.status} />
          </Detail>

          {editing ? (
            <div className="space-y-3 rounded-md border border-neutral-200 p-3">
              <label className="block space-y-1 text-sm">
                <span className="font-medium text-neutral-800">Leave type</span>
                <select
                  className={inputCls}
                  value={edit.leave_type}
                  onChange={(e) =>
                    setEdit((s) => ({ ...s, leave_type: e.target.value as LeaveType }))
                  }
                >
                  {LEAVE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {LEAVE_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1 text-sm">
                  <span className="font-medium text-neutral-800">Start date</span>
                  <input
                    type="date"
                    className={inputCls}
                    value={edit.start_date}
                    onChange={(e) => setEdit((s) => ({ ...s, start_date: e.target.value }))}
                  />
                </label>
                <label className="block space-y-1 text-sm">
                  <span className="font-medium text-neutral-800">End date</span>
                  <input
                    type="date"
                    className={inputCls}
                    value={edit.end_date}
                    onChange={(e) => setEdit((s) => ({ ...s, end_date: e.target.value }))}
                  />
                </label>
              </div>
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
                  onClick={() => updateMutation.mutate()}
                  disabled={busy || edit.end_date < edit.start_date}
                  className={btnPrimary}
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <>
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
                  onClick={() => rejectMutation.mutate()}
                  disabled={busy || note.trim().length === 0}
                  className={btnDanger}
                >
                  Confirm reject
                </button>
              </div>
            </div>
          )}
        </SheetBody>

        {(pending || cancellable) && !rejecting && !editing && (
          <SheetFooter className="flex-wrap gap-2">
            {pending && canUpdate && (
              <button type="button" onClick={() => setEditing(true)} className={btnSecondary}>
                Edit
              </button>
            )}
            {cancellable && canDelete && (
              <button
                type="button"
                onClick={() => cancelMutation.mutate()}
                disabled={busy}
                className={btnSecondary}
              >
                Cancel request
              </button>
            )}
            {pending && canApproveAny && (
              <button type="button" onClick={() => setRejecting(true)} className={btnDanger}>
                Reject
              </button>
            )}
            {pending && canApproveAny && (
              <button
                type="button"
                onClick={() => approveMutation.mutate()}
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
