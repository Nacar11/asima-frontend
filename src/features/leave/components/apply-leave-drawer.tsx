'use client';

import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { ApiError } from '@/lib/api-client';
import { leaveApi } from '@/features/leave/api';
import { Select } from '@/components/select';
import {
  DAY_PORTIONS,
  LEAVE_TYPES,
  SubmitLeaveSchema,
  canHalfDay,
  type DayPortion,
  type LeaveType,
  type SubmitLeaveInput,
} from '@/features/leave/schemas';
import { LEAVE_PORTION_LABELS, LEAVE_TYPE_LABELS, formatWindow } from '@/features/leave/format';

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
  const queryClient = useQueryClient();
  const form = useForm<SubmitLeaveInput>({
    resolver: zodResolver(SubmitLeaveSchema),
    defaultValues: DEFAULTS,
  });

  useEffect(() => {
    if (open) form.reset(DEFAULTS);
  }, [open, form]);

  const start = form.watch('start_date');
  const end = form.watch('end_date');
  const leaveType = form.watch('leave_type');
  const dayPortion = form.watch('day_portion');
  const datesReady = DATE_RE.test(start) && DATE_RE.test(end) && end >= start;

  const isHalfDay = dayPortion === 'first_half' || dayPortion === 'second_half';

  // Birthday is whole-day only — offer just "Full day" for it.
  const portionOptions = canHalfDay(leaveType)
    ? DAY_PORTION_OPTIONS
    : DAY_PORTION_OPTIONS.filter((option) => option.value === 'full');

  // Switching to a whole-day-only type clears any half-day selection.
  useEffect(() => {
    if (!canHalfDay(leaveType) && dayPortion !== 'full') {
      form.setValue('day_portion', 'full');
    }
  }, [leaveType, dayPortion, form]);

  // A half day is a single date: pin the end date to the start date (both stay
  // empty until a start is picked). The end input is disabled while this holds.
  useEffect(() => {
    if (isHalfDay && end !== start) {
      form.setValue('end_date', start, { shouldValidate: true });
    }
  }, [isHalfDay, start, end, form]);

  const preview = useQuery({
    queryKey: ['leave', 'day-count', start, end, dayPortion, leaveType],
    queryFn: () =>
      leaveApi.me.dayCountPreview(start, end, {
        day_portion: dayPortion,
        leave_type: leaveType,
      }),
    enabled: open && datesReady,
    retry: false,
  });

  const dayCountError = preview.error instanceof ApiError ? firstFieldError(preview.error) : null;
  const workingDays = preview.data?.working_days ?? null;
  const windowLabel = formatWindow(preview.data?.start_time ?? null, preview.data?.end_time ?? null);

  const submitMutation = useMutation({
    mutationFn: (input: SubmitLeaveInput) => leaveApi.me.submit(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['leave', 'me'] });
      void queryClient.invalidateQueries({ queryKey: ['leave', 'balances'] });
      toast.success('Leave request submitted.');
      onClose();
    },
    onError: (err) => toast.error(submitErrorMessage(err)),
  });

  const onSubmit = form.handleSubmit((input) =>
    submitMutation.mutate({
      ...input,
      reason: input.reason?.trim() ? input.reason.trim() : undefined,
    }),
  );

  const blocked = submitMutation.isPending || !datesReady || !!dayCountError;

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Apply for leave</SheetTitle>
          <SheetDescription>Request time off against your balance and work schedule.</SheetDescription>
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

            <Field label="Day portion" error={form.formState.errors.day_portion?.message}>
              <Controller
                control={form.control}
                name="day_portion"
                render={({ field }) => (
                  <Select<DayPortion>
                    value={field.value}
                    onValueChange={field.onChange}
                    options={portionOptions}
                    ariaLabel="Day portion"
                    className="w-full"
                  />
                )}
              />
            </Field>

            <DayCountBanner
              ready={datesReady}
              loading={preview.isFetching}
              workingDays={workingDays}
              window={windowLabel}
              error={dayCountError}
            />

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
    return <p className="text-sm text-neutral-500">Pick start and end dates to see the day count.</p>;
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
      <span className="font-semibold tabular-nums text-neutral-900">{workingDays}</span>{' '}
      working day{workingDays === 1 ? '' : 's'}
      {window && <span className="text-neutral-500"> · {window}</span>}.
    </p>
  );
}

function firstFieldError(err: ApiError): string | null {
  const body = err.body as { errors?: Record<string, string>; message?: string } | null;
  if (body?.errors) return Object.values(body.errors)[0] ?? null;
  return typeof body?.message === 'string' ? body.message : 'Those dates are not allowed.';
}

function submitErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    const body = err.body as { errors?: Record<string, string>; message?: string } | null;
    const firstFieldErr = body?.errors ? Object.values(body.errors)[0] : undefined;
    if (firstFieldErr) return firstFieldErr;
    if (typeof body?.message === 'string') return body.message;
  }
  return 'Could not submit the request.';
}

const inputCls =
  'block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950 disabled:bg-neutral-50';

const btnPrimary = cn(
  'rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white shadow-sm',
  'hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2',
  'disabled:cursor-not-allowed disabled:opacity-60',
);

const btnGhost = cn(
  'rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700',
  'hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-300',
);

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-sm font-medium text-neutral-800">{label}</span>
      {children}
      {error && <span className="block text-xs text-red-600">{error}</span>}
    </label>
  );
}
