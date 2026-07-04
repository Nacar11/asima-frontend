'use client';

import { useRef, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { FormDrawer } from '@/components/form-drawer';
import { cn } from '@/lib/cn';
import { EmployeePicker, employeeName } from './employee-picker';
import { useBulkSetPay } from '../hooks/use-bulk-set-pay';
import type { AdminUser } from '@/features/admin-users';
import type { CreateCompensationInput } from '../schemas';

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

type Row = { key: number; employee: AdminUser | null; salary: string };

/**
 * Bulk set-pay onboarding/import drawer. A shared effective-from date plus a
 * list of {employee, monthly salary} rows submitted in one all-or-nothing
 * request. Duplicate employees are flagged client-side before submit; the
 * backend still rejects them (422) as the source of truth.
 */
export function BulkSetPayDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const nextKey = useRef(1);
  const [effectiveFrom, setEffectiveFrom] = useState(todayStr());
  const [rows, setRows] = useState<Row[]>([{ key: 0, employee: null, salary: '' }]);
  const bulk = useBulkSetPay();

  const addRow = () =>
    setRows((rs) => [...rs, { key: nextKey.current++, employee: null, salary: '' }]);
  const removeRow = (key: number) =>
    setRows((rs) => (rs.length > 1 ? rs.filter((r) => r.key !== key) : rs));
  const setEmployee = (key: number, u: AdminUser) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, employee: u } : r)));
  const setSalary = (key: number, salary: string) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, salary } : r)));

  const complete = rows.filter((r) => r.employee && r.salary !== '');
  const pickedIds = rows.filter((r) => r.employee).map((r) => r.employee!.id);
  const hasDuplicate = new Set(pickedIds).size !== pickedIds.length;
  const canSubmit =
    complete.length >= 1 && !hasDuplicate && effectiveFrom !== '' && !bulk.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const items: CreateCompensationInput[] = complete.map((r) => ({
      employee_id: r.employee!.id,
      monthly_salary: Number(r.salary),
      effective_from: effectiveFrom,
    }));
    bulk.mutate(items, {
      onSuccess: () => {
        setRows([{ key: nextKey.current++, employee: null, salary: '' }]);
        onClose();
      },
    });
  };

  return (
    <FormDrawer
      open={open}
      onClose={onClose}
      title="Bulk set pay"
      description="Set pay for several employees at once. Saved together — if one row fails, none are saved."
      formId="bulk-set-pay-form"
      onSubmit={handleSubmit}
      submitLabel="Set pay"
      pendingLabel="Saving…"
      submitting={bulk.isPending}
      submitDisabled={!canSubmit}
    >
      <div className="space-y-1.5">
        <label htmlFor="bulk_effective_from" className={labelCls}>
          Effective from
        </label>
        <input
          id="bulk_effective_from"
          type="date"
          max={todayStr()}
          value={effectiveFrom}
          onChange={(e) => setEffectiveFrom(e.target.value)}
          className={fieldCls}
        />
        <p className="text-xs text-neutral-500">Applies to every row. Cannot be in the future.</p>
      </div>

      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.key} className="space-y-2 rounded-md border border-neutral-200 p-3">
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-medium text-neutral-500">
                {row.employee ? employeeName(row.employee) : 'Employee'}
              </span>
              {rows.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRow(row.key)}
                  className="text-neutral-400 hover:text-red-600"
                  aria-label="Remove row"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              )}
            </div>
            <EmployeePicker selected={row.employee} onSelect={(u) => setEmployee(row.key, u)} />
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={row.salary}
              onChange={(e) => setSalary(row.key, e.target.value)}
              className={fieldCls}
              placeholder="Monthly salary"
              aria-label="Monthly salary"
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addRow}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-700 hover:text-neutral-950"
      >
        <Plus className="h-4 w-4" aria-hidden />
        Add employee
      </button>

      {hasDuplicate && (
        <p className="text-sm text-red-700">
          The same employee is selected more than once — each employee can appear only once.
        </p>
      )}
    </FormDrawer>
  );
}
