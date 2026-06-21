'use client';

import { useState } from 'react';
import { FormDrawer } from '@/components/form-drawer';
import { cn } from '@/lib/cn';
import type { CreateCompensationInput } from '@/features/admin-compensation/schemas';

function todayStr(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const fieldCls = cn(
  'h-9 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm text-neutral-900 shadow-sm',
  'focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-1',
);
const labelCls = 'text-sm font-medium text-neutral-700';

/**
 * Set / change pay. Submitting builds a create input and hands it to
 * `onSubmit` — the parent owns the mutation. effective_from defaults to today
 * and cannot be in the future (the backend rejects it). Leave the hourly
 * override off to derive the rate from the monthly salary.
 */
export function SetPayDrawer({
  employeeId,
  employeeName,
  open,
  submitting,
  onClose,
  onSubmit,
}: {
  employeeId: number;
  employeeName: string;
  open: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (input: CreateCompensationInput) => void;
}) {
  const [monthly, setMonthly] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState(todayStr());
  const [override, setOverride] = useState(false);
  const [hourly, setHourly] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const input: CreateCompensationInput = {
      employee_id: employeeId,
      monthly_salary: Number(monthly),
      effective_from: effectiveFrom,
    };
    if (override && hourly !== '') input.hourly_rate = Number(hourly);
    onSubmit(input);
  };

  return (
    <FormDrawer
      open={open}
      onClose={onClose}
      title="Set / change pay"
      description={`Effective-dated for ${employeeName}. The prior rate is ended automatically.`}
      formId="set-pay-form"
      onSubmit={handleSubmit}
      submitLabel="Save"
      pendingLabel="Saving…"
      submitting={submitting}
      submitDisabled={submitting || monthly === '' || effectiveFrom === ''}
    >
      <div className="space-y-1.5">
        <label htmlFor="monthly_salary" className={labelCls}>
          Monthly salary
        </label>
        <input
          id="monthly_salary"
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          value={monthly}
          onChange={(e) => setMonthly(e.target.value)}
          className={fieldCls}
          placeholder="50000"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="effective_from" className={labelCls}>
          Effective from
        </label>
        <input
          id="effective_from"
          type="date"
          max={todayStr()}
          value={effectiveFrom}
          onChange={(e) => setEffectiveFrom(e.target.value)}
          className={fieldCls}
        />
        <p className="text-xs text-neutral-500">Cannot be in the future.</p>
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
            placeholder="239.6128"
            aria-label="Hourly rate override"
          />
        ) : (
          <p className="text-xs text-neutral-500">
            Left off, the hourly rate is derived from the monthly salary.
          </p>
        )}
      </div>
    </FormDrawer>
  );
}
