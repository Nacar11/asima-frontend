'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormDrawer } from '@/components/form-drawer';
import { Field } from '@/components/form/field';
import { useSubmitCorrection } from '../hooks/use-submit-correction-mutation';
import { isoToTimeInput, replaceTimeOnIso } from '../datetime';
import type { TimeEntry } from '@/features/time-entries';

const FormSchema = z
  .object({
    proposed_time_in: z.string().min(1, 'Required'),
    proposed_time_out: z.string().optional(),
    reason: z.string().min(1, 'A reason is required').max(500),
  })
  .refine((v) => !v.proposed_time_out || v.proposed_time_out > v.proposed_time_in, {
    message: 'Time out must be after time in',
    path: ['proposed_time_out'],
  });
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
  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { proposed_time_in: '', proposed_time_out: '', reason: '' },
  });

  useEffect(() => {
    if (entry) {
      form.reset({
        proposed_time_in: isoToTimeInput(entry.time_in),
        proposed_time_out: entry.time_out ? isoToTimeInput(entry.time_out) : '',
        reason: '',
      });
    }
  }, [entry, form]);

  const mutation = useSubmitCorrection({
    successMessage: 'Correction request submitted.',
    errorFallback: 'Could not submit the correction.',
  });

  const onSubmit = form.handleSubmit((values) => {
    if (!entry) return;
    // The date is locked to the entry: only the time-of-day changes. Recombine
    // against the original instant's date so an unchanged field round-trips.
    // time_out uses the in-instant's date when the entry had no prior out, so
    // out stays on the same day (same-day rule).
    mutation.mutate(
      {
        target_entry_id: entry.id,
        work_date: entry.work_date,
        proposed_time_in: replaceTimeOnIso(entry.time_in, values.proposed_time_in),
        proposed_time_out: values.proposed_time_out
          ? replaceTimeOnIso(entry.time_out ?? entry.time_in, values.proposed_time_out)
          : null,
        reason: values.reason.trim(),
      },
      { onSuccess: () => onClose() },
    );
  });

  return (
    <FormDrawer
      open={open}
      onClose={onClose}
      title="Request correction"
      description={`${entry ? `Work date ${entry.work_date}` : ''} — adjust the times and tell us why.`}
      formId="correction-form"
      onSubmit={onSubmit}
      submitLabel="Submit correction"
      pendingLabel="Submitting…"
      submitting={mutation.isPending}
    >
      <Field label="Time in" error={form.formState.errors.proposed_time_in?.message}>
        <input type="time" className={inputCls} {...form.register('proposed_time_in')} />
      </Field>
      <Field label="Time out (optional)" error={form.formState.errors.proposed_time_out?.message}>
        <input type="time" className={inputCls} {...form.register('proposed_time_out')} />
      </Field>
      <Field label="Reason" error={form.formState.errors.reason?.message}>
        <textarea rows={3} className={inputCls} {...form.register('reason')} />
      </Field>
    </FormDrawer>
  );
}

const inputCls =
  'block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950';
