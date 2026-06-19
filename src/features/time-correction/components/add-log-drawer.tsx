'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormDrawer } from '@/components/form-drawer';
import { Field } from '@/components/form/field';
import { useSubmitCorrection } from '@/features/time-correction/hooks/use-submit-correction-mutation';
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
  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { work_date: '', proposed_time_in: '', proposed_time_out: '', reason: '' },
  });

  useEffect(() => {
    if (open)
      form.reset({ work_date: '', proposed_time_in: '', proposed_time_out: '', reason: '' });
  }, [open, form]);

  const mutation = useSubmitCorrection({
    successMessage: 'Log submitted for approval.',
    errorFallback: 'Could not add the log.',
  });

  const onSubmit = form.handleSubmit((values) =>
    mutation.mutate(
      {
        target_entry_id: null,
        work_date: values.work_date,
        proposed_time_in: localDateTimeToIso(values.work_date, values.proposed_time_in),
        proposed_time_out: localDateTimeToIso(values.work_date, values.proposed_time_out),
        reason: values.reason.trim(),
      },
      { onSuccess: () => onClose() },
    ),
  );

  return (
    <FormDrawer
      open={open}
      onClose={onClose}
      title="Add log"
      description="Manually add a timelog for a past day. It needs your approver's sign-off before it appears on your timesheet."
      formId="add-log-form"
      onSubmit={onSubmit}
      submitLabel="Add log"
      pendingLabel="Submitting…"
      submitting={mutation.isPending}
    >
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
    </FormDrawer>
  );
}

const inputCls =
  'block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950';
