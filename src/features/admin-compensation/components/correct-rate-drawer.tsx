'use client';

import { useState } from 'react';
import { FormDrawer } from '@/components/form-drawer';
import { cn } from '@/lib/cn';
import type { Compensation, UpdateCompensationInput } from '../schemas';

const fieldCls = cn(
  'h-9 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm text-neutral-900 shadow-sm',
  'focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-1',
);
const labelCls = 'text-sm font-medium text-neutral-700';

/**
 * Correct the ACTIVE rate IN PLACE (PATCH) — for fixing a value that was
 * entered wrong, NOT for recording a real pay change (use Set/change pay for
 * that). No new history row is created. Fields are prefilled from the current
 * row. Changing the monthly salary re-derives the hourly rate server-side
 * unless an override is supplied.
 */
export function CorrectRateDrawer({
  active,
  employeeName,
  open,
  submitting,
  onClose,
  onSubmit,
}: {
  active: Compensation;
  employeeName: string;
  open: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (patch: UpdateCompensationInput) => void;
}) {
  const [monthly, setMonthly] = useState(String(active.monthly_salary));
  const [override, setOverride] = useState(active.hourly_rate_is_overridden);
  const [hourly, setHourly] = useState(String(active.hourly_rate));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const patch: UpdateCompensationInput = { monthly_salary: Number(monthly) };
    if (override && hourly !== '') patch.hourly_rate = Number(hourly);
    onSubmit(patch);
  };

  return (
    <FormDrawer
      open={open}
      onClose={onClose}
      title="Correct current rate"
      description={`Fixes ${employeeName}'s active rate in place — no new history row.`}
      formId="correct-rate-form"
      onSubmit={handleSubmit}
      submitLabel="Save correction"
      pendingLabel="Saving…"
      submitting={submitting}
      submitDisabled={submitting || monthly === ''}
    >
      <div className="space-y-1.5">
        <label htmlFor="correct_monthly_salary" className={labelCls}>
          Monthly salary
        </label>
        <input
          id="correct_monthly_salary"
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          value={monthly}
          onChange={(e) => setMonthly(e.target.value)}
          className={fieldCls}
        />
      </div>

      <div className="space-y-2 rounded-md border border-neutral-200 p-3">
        <label className="flex items-center gap-2 text-sm font-medium text-neutral-700">
          <input
            type="checkbox"
            checked={override}
            onChange={(e) => setOverride(e.target.checked)}
            className="h-4 w-4 rounded border-neutral-300"
          />
          Override the hourly rate
        </label>
        {override ? (
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.0001"
            value={hourly}
            onChange={(e) => setHourly(e.target.value)}
            className={fieldCls}
            aria-label="Hourly rate override"
          />
        ) : (
          <p className="text-xs text-neutral-500">
            Left off, the hourly rate is re-derived from the monthly salary.
          </p>
        )}
      </div>
    </FormDrawer>
  );
}
