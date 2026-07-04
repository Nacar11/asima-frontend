'use client';

import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Field } from '@/components/form/field';
import { cn } from '@/lib/cn';
import { ApiError } from '@/lib/api-client';
import { errorMessage } from '@/lib/api-error';
import { leaveApi } from '../api';
import { leaveKeys } from '../keys';
import { useSubmitLeave } from '../hooks/use-submit-leave-mutation';
import { Select } from '@/components/select';
import {
  ACCEPTED_ATTACHMENT_ACCEPT,
  DAY_PORTIONS,
  LEAVE_TYPES,
  SubmitLeaveSchema,
  canHalfDay,
  requiresAttachment,
  type DayPortion,
  type LeaveType,
  type SubmitLeaveInput,
} from '../schemas';
import { LEAVE_PORTION_LABELS, LEAVE_TYPE_LABELS, formatWindow } from '../format';

const LEAVE_TYPE_OPTIONS = LEAVE_TYPES.map((t) => ({
  value: t,
  label: LEAVE_TYPE_LABELS[t],
}));

const DAY_PORTION_OPTIONS = DAY_PORTIONS.map((p) => ({
  value: p,
  label: LEAVE_PORTION_LABELS[p],
}));

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DEFAULTS: SubmitLeaveInput = {
  leave_type: 'vacation',
  start_date: '',
  end_date: '',
  day_portion: 'full',
  reason: '',
};

/**
 * Right-side drawer to submit a leave request. As the dates change it previews
 * the chargeable working days against the same backend rule submit enforces
 * (D8) — so a past date or non-workday boundary surfaces inline and disables
 * submit before the round-trip.
 */
export function ApplyLeaveDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const form = useForm<SubmitLeaveInput>({
    resolver: zodResolver(SubmitLeaveSchema),
    defaultValues: DEFAULTS,
  });

  useEffect(() => {
    if (open) {
      form.reset(DEFAULTS);
      setFile(null);
    }
  }, [open, form]);

  const start = form.watch('start_date');
  const end = form.watch('end_date');
  const leaveType = form.watch('leave_type');
  const dayPortion = form.watch('day_portion');

  // sick / bereavement require exactly one supporting file (mirrors the
  // backend rule). Clear a stale file when switching to a type that rejects one.
  const needsAttachment = requiresAttachment(leaveType);
  useEffect(() => {
    if (!needsAttachment && file) setFile(null);
  }, [needsAttachment, file]);
  const attachmentMissing = needsAttachment && !file;
  const datesReady = DATE_RE.test(start) && DATE_RE.test(end) && end >= start;

  // The portion control is shown for every half-day-eligible type (birthday is
  // whole-day only). It no longer waits on the dates: choosing a half day is how
  // you make the request single-day. When the type isn't eligible, force 'full'.
  const showPortion = canHalfDay(leaveType);
  useEffect(() => {
    if (!showPortion && dayPortion !== 'full') form.setValue('day_portion', 'full');
  }, [showPortion, dayPortion, form]);

  // A half day is single-day only, so once one is selected the end date is
  // pinned to the start date (and its picker is disabled).
  const isHalfDay = showPortion && dayPortion !== 'full';
  useEffect(() => {
    if (isHalfDay && end !== start) {
      form.setValue('end_date', start, { shouldValidate: true });
    }
  }, [isHalfDay, start, end, form]);

  const effectivePortion: DayPortion = showPortion ? dayPortion : 'full';

  const preview = useQuery({
    queryKey: leaveKeys.dayCount(start, end, effectivePortion, leaveType),
    queryFn: () =>
      leaveApi.me.dayCountPreview(start, end, {
        day_portion: effectivePortion,
        leave_type: leaveType,
      }),
    enabled: open && datesReady,
    retry: false,
  });

  const dayCountError =
    preview.error instanceof ApiError
      ? errorMessage(preview.error, 'Those dates are not allowed.')
      : null;
  const workingDays = preview.data?.working_days ?? null;
  const windowLabel = formatWindow(
    preview.data?.start_time ?? null,
    preview.data?.end_time ?? null,
  );

  const submitMutation = useSubmitLeave();

  const onSubmit = form.handleSubmit((input) => {
    if (requiresAttachment(input.leave_type) && !file) return; // guarded by the disabled button too
    submitMutation.mutate(
      {
        input: { ...input, reason: input.reason?.trim() ? input.reason.trim() : undefined },
        file: requiresAttachment(input.leave_type) ? file : null,
      },
      { onSuccess: () => onClose() },
    );
  });

  const blocked = submitMutation.isPending || !datesReady || !!dayCountError || attachmentMissing;

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Apply for leave</SheetTitle>
          <SheetDescription>
            Request time off against your balance and work schedule.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
          <SheetBody className="space-y-4">
            <Field label="Leave type" error={form.formState.errors.leave_type?.message}>
              <Controller
                control={form.control}
                name="leave_type"
                render={({ field }) => (
                  <Select<LeaveType>
                    value={field.value}
                    onValueChange={field.onChange}
                    options={LEAVE_TYPE_OPTIONS}
                    ariaLabel="Leave type"
                    className="w-full"
                  />
                )}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Start date" error={form.formState.errors.start_date?.message}>
                <input type="date" className={inputCls} {...form.register('start_date')} />
              </Field>
              <Field label="End date" error={form.formState.errors.end_date?.message}>
                <input
                  type="date"
                  className={inputCls}
                  disabled={isHalfDay}
                  {...form.register('end_date')}
                />
              </Field>
            </div>

            {showPortion && (
              <Field label="Day portion" error={form.formState.errors.day_portion?.message}>
                <Controller
                  control={form.control}
                  name="day_portion"
                  render={({ field }) => (
                    <Select<DayPortion>
                      value={field.value}
                      onValueChange={field.onChange}
                      options={DAY_PORTION_OPTIONS}
                      ariaLabel="Day portion"
                      className="w-full"
                    />
                  )}
                />
              </Field>
            )}

            <DayCountBanner
              ready={datesReady}
              loading={preview.isFetching}
              workingDays={workingDays}
              window={windowLabel}
              error={dayCountError}
            />

            {needsAttachment && (
              <Field
                label="Attachment (required)"
                error={
                  attachmentMissing
                    ? 'A supporting file is required for this leave type.'
                    : undefined
                }
              >
                <input
                  type="file"
                  accept={ACCEPTED_ATTACHMENT_ACCEPT}
                  aria-label="Attachment"
                  className={fileInputCls}
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                <span className="mt-1 block text-xs text-neutral-500">
                  Image (JPEG, PNG, WebP) or PDF. {file ? file.name : 'No file selected.'}
                </span>
              </Field>
            )}

            <Field label="Reason (optional)" error={form.formState.errors.reason?.message}>
              <textarea rows={3} className={inputCls} {...form.register('reason')} />
            </Field>
          </SheetBody>

          <SheetFooter>
            <button type="button" onClick={onClose} className={btnGhost}>
              Cancel
            </button>
            <button type="submit" disabled={blocked} className={btnPrimary}>
              {submitMutation.isPending ? 'Submitting…' : 'Submit request'}
            </button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

/** Live "this request = N working day(s)" banner (+ the half-day window), or the D8 error. */
function DayCountBanner({
  ready,
  loading,
  workingDays,
  window,
  error,
}: {
  ready: boolean;
  loading: boolean;
  workingDays: number | null;
  window: string;
  error: string | null;
}) {
  if (!ready) {
    return (
      <p className="text-sm text-neutral-500">Pick start and end dates to see the day count.</p>
    );
  }
  if (error) {
    return <p className="text-sm font-medium text-red-600">{error}</p>;
  }
  if (loading || workingDays === null) {
    return <p className="text-sm text-neutral-500">Checking your schedule…</p>;
  }
  return (
    <p className="text-sm text-neutral-700">
      This request is{' '}
      <span className="font-semibold tabular-nums text-neutral-900">{workingDays}</span> working day
      {workingDays === 1 ? '' : 's'}
      {window && <span className="text-neutral-500"> · {window}</span>}.
    </p>
  );
}

const inputCls =
  'block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950 disabled:bg-neutral-50';

const fileInputCls =
  'block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm file:mr-3 file:rounded file:border-0 file:bg-neutral-100 file:px-3 file:py-1 file:text-sm file:font-medium hover:file:bg-neutral-200 focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950';

const btnPrimary = cn(
  'rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white shadow-sm',
  'hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2',
  'disabled:cursor-not-allowed disabled:opacity-60',
);

const btnGhost = cn(
  'rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700',
  'hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-300',
);
