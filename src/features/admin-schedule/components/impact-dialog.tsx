'use client';

import { CalendarX2, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/cn';
import type { AffectedRequest, ScheduleChangeImpact } from '../schemas';

const KIND_LABEL: Record<AffectedRequest['kind'], string> = {
  leave: 'Leave',
  time_correction: 'Time correction',
};

function AffectedRow({ a }: { a: AffectedRequest }) {
  return (
    <li className="flex items-start justify-between gap-3 px-3 py-2">
      <div className="min-w-0">
        <p className="text-sm font-medium text-neutral-900">
          {KIND_LABEL[a.kind]} #{a.id}
          {a.leave_type ? ` · ${a.leave_type}` : ''}
        </p>
        <p className="truncate text-xs text-neutral-500">
          {a.dates.length > 1 ? `${a.dates[0]} → ${a.dates[a.dates.length - 1]}` : a.dates[0]}
          {a.trigger_dates.length > 0 && (
            <span className="text-neutral-400"> · triggered by {a.trigger_dates.join(', ')}</span>
          )}
        </p>
      </div>
      <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
        {a.status}
      </span>
    </li>
  );
}

/**
 * Confirmation dialog for a schedule change. Lists every leave / correction the
 * cascade will auto-cancel (with the governed trigger dates, so a multi-day
 * leave's presence is explained) and the leave-days that will be freed. Confirm
 * commits via the parent's apply mutation.
 */
export function ImpactDialog({
  impact,
  open,
  submitting,
  onConfirm,
  onCancel,
}: {
  impact: ScheduleChangeImpact | null;
  open: boolean;
  submitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const affected = impact ? [...impact.affected_leaves, ...impact.affected_corrections] : [];
  const nothing = affected.length === 0;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review the schedule change</DialogTitle>
          <DialogDescription>
            {nothing
              ? 'No pending or approved requests are affected — this change is safe to apply.'
              : `${affected.length} request(s) will be auto-cancelled. Requests already in progress are kept.`}
          </DialogDescription>
        </DialogHeader>

        {!nothing && (
          <div className="space-y-3">
            <ul className="max-h-64 divide-y divide-neutral-100 overflow-y-auto rounded-md border border-neutral-200">
              {affected.map((a) => (
                <AffectedRow key={`${a.kind}-${a.id}`} a={a} />
              ))}
            </ul>
            {impact && impact.freed_leave_days > 0 && (
              <p className="text-xs text-neutral-500">
                {impact.freed_leave_days} leave day(s) will be returned to the employee&apos;s
                balance.
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2',
              nothing
                ? 'bg-neutral-950 hover:bg-neutral-800 focus:ring-neutral-950'
                : 'bg-red-600 hover:bg-red-700 focus:ring-red-600',
              'disabled:cursor-not-allowed disabled:opacity-60',
            )}
          >
            {nothing ? (
              <Check className="h-4 w-4" aria-hidden />
            ) : (
              <CalendarX2 className="h-4 w-4" aria-hidden />
            )}
            {submitting ? 'Applying…' : nothing ? 'Apply change' : 'Apply & cancel requests'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
