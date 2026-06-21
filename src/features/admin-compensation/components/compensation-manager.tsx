'use client';

import { useState } from 'react';
import { Pencil, Plus, SlidersHorizontal, Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useCompensationMutations } from '@/features/admin-compensation/hooks/use-compensation-mutations';
import { SetPayDrawer } from '@/features/admin-compensation/components/set-pay-drawer';
import { CorrectRateDrawer } from '@/features/admin-compensation/components/correct-rate-drawer';
import { effectiveRange, formatHourly, formatSalary } from '@/features/admin-compensation/format';
import type {
  Compensation,
  CreateCompensationInput,
  UpdateCompensationInput,
} from '@/features/admin-compensation/schemas';

const btnPrimary = cn(
  'inline-flex items-center gap-1.5 rounded-md bg-neutral-950 px-3 py-1.5 text-sm font-medium text-white shadow-sm',
  'hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-1',
);
const btnSecondary = cn(
  'inline-flex items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700',
  'hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-900',
);
const btnDanger = cn(
  'inline-flex items-center gap-1.5 rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700',
  'hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-600 disabled:opacity-60',
);

/**
 * Current rate + history for one employee, with set/change pay and remove.
 * Removing the active rate reactivates the prior one (server-side), so the
 * action is gated behind an inline confirm.
 */
export function CompensationManager({
  employeeId,
  employeeName,
  rows,
}: {
  employeeId: number;
  employeeName: string;
  rows: Compensation[];
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [correctOpen, setCorrectOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const { setPay, correctRate, removeRate } = useCompensationMutations(employeeId);

  const active = rows.find((r) => r.effective_to === null) ?? null;
  const history = rows.filter((r) => r.effective_to !== null);

  const submitSetPay = (input: CreateCompensationInput) =>
    setPay.mutate(input, { onSuccess: () => setDrawerOpen(false) });

  const submitCorrect = (patch: UpdateCompensationInput) => {
    if (!active) return;
    correctRate.mutate({ id: active.id, patch }, { onSuccess: () => setCorrectOpen(false) });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-medium text-neutral-700">Current rate</h3>
            {active ? (
              <div className="mt-2 space-y-1">
                <p className="text-2xl font-semibold text-neutral-950">
                  {formatSalary(active.monthly_salary, active.currency)}
                  <span className="text-sm font-normal text-neutral-500"> / month</span>
                </p>
                <p className="flex items-center text-sm text-neutral-600">
                  {formatHourly(active.hourly_rate, active.currency)}
                  {active.hourly_rate_is_overridden && (
                    <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800">
                      overridden
                    </span>
                  )}
                </p>
                <p className="text-xs text-neutral-400">Effective {active.effective_from}</p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-neutral-500">No compensation set yet.</p>
            )}
          </div>

          <div className="flex shrink-0 gap-2">
            <button type="button" onClick={() => setDrawerOpen(true)} className={btnPrimary}>
              {active ? (
                <Pencil className="h-4 w-4" aria-hidden />
              ) : (
                <Plus className="h-4 w-4" aria-hidden />
              )}
              {active ? 'Change pay' : 'Set pay'}
            </button>
            {active && (
              <button type="button" onClick={() => setCorrectOpen(true)} className={btnSecondary}>
                <SlidersHorizontal className="h-4 w-4" aria-hidden />
                Correct
              </button>
            )}
            {active && (
              <button
                type="button"
                onClick={() => setConfirmingDelete((v) => !v)}
                className={btnDanger}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                Remove
              </button>
            )}
          </div>
        </div>

        {confirmingDelete && active && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm">
            <p className="text-red-800">
              Remove the current rate? The previous rate (if any) becomes active again.
            </p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                disabled={removeRate.isPending}
                onClick={() =>
                  removeRate.mutate(active.id, { onSuccess: () => setConfirmingDelete(false) })
                }
                className={btnDanger}
              >
                {removeRate.isPending ? 'Removing…' : 'Remove rate'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className={btnSecondary}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-medium text-neutral-700">History</h3>
          <ul className="mt-3 divide-y divide-neutral-100">
            {history.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
              >
                <span className="text-neutral-500">
                  {effectiveRange(r.effective_from, r.effective_to)}
                </span>
                <span className="text-neutral-800">
                  {formatSalary(r.monthly_salary, r.currency)} ·{' '}
                  {formatHourly(r.hourly_rate, r.currency)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <SetPayDrawer
        employeeId={employeeId}
        employeeName={employeeName}
        open={drawerOpen}
        submitting={setPay.isPending}
        onClose={() => setDrawerOpen(false)}
        onSubmit={submitSetPay}
      />

      {active && (
        <CorrectRateDrawer
          active={active}
          employeeName={employeeName}
          open={correctOpen}
          submitting={correctRate.isPending}
          onClose={() => setCorrectOpen(false)}
          onSubmit={submitCorrect}
        />
      )}
    </div>
  );
}
