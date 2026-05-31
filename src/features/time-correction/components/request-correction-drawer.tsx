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
import { isoToLocalInput, localInputToIso } from '@/features/time-correction/datetime';
import type { TimeEntry } from '@/features/time-entries/schemas';

const FormSchema = z
  .object({
    proposed_time_in: z.string().min(1, 'Required'),
    proposed_time_out: z.string().optional(),
    reason: z.string().min(1, 'A reason is required').max(500),
  })
  .refine(
    (v) => !v.proposed_time_out || v.proposed_time_out > v.proposed_time_in,
    { message: 'Time out must be after time in', path: ['proposed_time_out'] },
  );
type FormValues = z.infer<typeof FormSchema>;

/**
 * "Request correction" drawer launched from a timesheet row. Pre-fills
 * the entry's current in/out; the employee adjusts them and adds a
 * reason. Submits a TIME_CORRECTION request pointing at the entry
 * (`target_entry_id`) — on final approval the backend rewrites that
 * time_entries row with source='correction'.
 */
export function RequestCorrectionDrawer({
  entry,
  open,
  onClose,
}: {
  entry: TimeEntry | null;
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { proposed_time_in: '', proposed_time_out: '', reason: '' },
  });

  useEffect(() => {
    if (entry) {
      form.reset({
        proposed_time_in: isoToLocalInput(entry.time_in),
        proposed_time_out: entry.time_out ? isoToLocalInput(entry.time_out) : '',
        reason: '',
      });
    }
  }, [entry, form]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      if (!entry) throw new Error('No entry selected');
      return timeCorrectionApi.me.submit({
        target_entry_id: entry.id,
        work_date: entry.work_date,
        proposed_time_in: localInputToIso(values.proposed_time_in),
        proposed_time_out: values.proposed_time_out
          ? localInputToIso(values.proposed_time_out)
          : null,
        reason: values.reason.trim(),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['time-correction'] });
      void queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      toast.success('Correction request submitted.');
      onClose();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const onSubmit = form.handleSubmit((values) => mutation.mutate(values));

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Request correction</SheetTitle>
          <SheetDescription>
            {entry ? `Work date ${entry.work_date}` : ''} — adjust the times and tell us why.
          </SheetDescription>
        </SheetHeader>

        <SheetBody>
          <form id="correction-form" onSubmit={onSubmit} className="space-y-4" noValidate>
            <Field label="Time in" error={form.formState.errors.proposed_time_in?.message}>
              <input type="datetime-local" className={inputCls} {...form.register('proposed_time_in')} />
            </Field>
            <Field label="Time out (optional)" error={form.formState.errors.proposed_time_out?.message}>
              <input type="datetime-local" className={inputCls} {...form.register('proposed_time_out')} />
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
            form="correction-form"
            disabled={mutation.isPending}
            className={btnPrimary}
          >
            {mutation.isPending ? 'Submitting…' : 'Submit correction'}
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
  return 'Could not submit the correction.';
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
