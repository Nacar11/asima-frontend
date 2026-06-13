'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { z } from 'zod';
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
import { timeCorrectionApi } from '@/features/time-correction/api';
import { localDateTimeToIso } from '@/features/time-correction/datetime';

/** Browser-local YYYY-MM-DD for "today" (the latest date a log may be added for). */
function localToday(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const FormSchema = z
  .object({
    work_date: z.string().min(1, 'Required'),
    proposed_time_in: z.string().min(1, 'Required'),
    proposed_time_out: z.string().min(1, 'Time out is required'),
    reason: z.string().min(1, 'A reason is required').max(500),
  })
  .refine((v) => v.proposed_time_out > v.proposed_time_in, {
    message: 'Time out must be after time in',
    path: ['proposed_time_out'],
  })
  .refine((v) => v.work_date <= localToday(), {
    message: 'Cannot add a log for a future date',
    path: ['work_date'],
  });
type FormValues = z.infer<typeof FormSchema>;

/**
 * "Add Logs" drawer (timesheet header). Manually adds a timelog for a past/
 * today date that has no existing entry. Submitted as a correction request
 * with `target_entry_id = null` — it goes through the normal approval chain,
 * and on approval the backend creates a new confirmed time_entries row.
 * Future dates and days that already have an entry are rejected server-side;
 * the checks here are UX.
 */
export function AddLogDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { work_date: '', proposed_time_in: '', proposed_time_out: '', reason: '' },
  });

  useEffect(() => {
    if (open)
      form.reset({ work_date: '', proposed_time_in: '', proposed_time_out: '', reason: '' });
  }, [open, form]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      timeCorrectionApi.me.submit({
        target_entry_id: null,
        work_date: values.work_date,
        proposed_time_in: localDateTimeToIso(values.work_date, values.proposed_time_in),
        proposed_time_out: localDateTimeToIso(values.work_date, values.proposed_time_out),
        reason: values.reason.trim(),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['time-correction'] });
      void queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      toast.success('Log submitted for approval.');
      onClose();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const onSubmit = form.handleSubmit((values) => mutation.mutate(values));

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Add log</SheetTitle>
          <SheetDescription>
            Manually add a timelog for a past day. It needs your approver&apos;s sign-off before it
            appears on your timesheet.
          </SheetDescription>
        </SheetHeader>

        <SheetBody>
          <form id="add-log-form" onSubmit={onSubmit} className="space-y-4" noValidate>
            <Field label="Date" error={form.formState.errors.work_date?.message}>
              <input
                type="date"
                max={localToday()}
                className={inputCls}
                {...form.register('work_date')}
              />
            </Field>
            <Field label="Time in" error={form.formState.errors.proposed_time_in?.message}>
              <input type="time" className={inputCls} {...form.register('proposed_time_in')} />
            </Field>
            <Field label="Time out" error={form.formState.errors.proposed_time_out?.message}>
              <input type="time" className={inputCls} {...form.register('proposed_time_out')} />
            </Field>
            <Field label="Reason" error={form.formState.errors.reason?.message}>
              <textarea rows={3} className={inputCls} {...form.register('reason')} />
            </Field>
          </form>
        </SheetBody>

        <SheetFooter>
          <button type="button" onClick={onClose} className={btnSecondary}>
            Cancel
          </button>
          <button
            type="submit"
            form="add-log-form"
            disabled={mutation.isPending}
            className={btnPrimary}
          >
            {mutation.isPending ? 'Submitting…' : 'Add log'}
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    const body = err.body as { errors?: Record<string, string>; message?: string } | null;
    const first = body?.errors ? Object.values(body.errors)[0] : undefined;
    if (first) return first;
    if (typeof body?.message === 'string') return body.message;
  }
  return 'Could not add the log.';
}

const inputCls =
  'block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950';

const btnPrimary = cn(
  'rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white shadow-sm',
  'hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2',
  'disabled:cursor-not-allowed disabled:opacity-60',
);

const btnSecondary = cn(
  'rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700',
  'hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-900',
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
