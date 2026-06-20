'use client';

import { useState } from 'react';
import { FormDrawer } from '@/components/form-drawer';
import { cn } from '@/lib/cn';
import { dayName, trimSeconds, type WorkSchedule } from '@/features/schedule/schemas';
import type { ScheduleChangeIntent } from '@/features/admin-schedule/schemas';

export function todayStr(): string {
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
 * Modify editor for one weekday. Submitting builds a `modify` intent and hands
 * it to `onPreview` — the parent runs the cascade preview, so this drawer never
 * writes directly. effective_from defaults to today and cannot be in the past
 * (the change is forward-only).
 */
export function EditScheduleDrawer({
  employeeId,
  row,
  open,
  submitting,
  onClose,
  onPreview,
}: {
  employeeId: number;
  row: WorkSchedule | null;
  open: boolean;
  submitting: boolean;
  onClose: () => void;
  onPreview: (intent: ScheduleChangeIntent) => void;
}) {
  const [effectiveFrom, setEffectiveFrom] = useState(todayStr());
  const [expectedIn, setExpectedIn] = useState('09:00');
  const [expectedOut, setExpectedOut] = useState('18:00');
  const [breakMinutes, setBreakMinutes] = useState(60);
  const [breakStart, setBreakStart] = useState('12:00');

  // Re-seed the form whenever a different row opens the drawer.
  const [seededFor, setSeededFor] = useState<number | null>(null);
  if (row && seededFor !== row.id) {
    setSeededFor(row.id);
    setEffectiveFrom(todayStr());
    setExpectedIn(trimSeconds(row.expected_in));
    setExpectedOut(trimSeconds(row.expected_out));
    setBreakMinutes(row.break_minutes);
    setBreakStart(row.break_start ? trimSeconds(row.break_start) : '12:00');
  }

  if (!row) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onPreview({
      employee_id: employeeId,
      day_of_week: row.day_of_week,
      effective_from: effectiveFrom,
      mode: 'modify',
      expected_in: expectedIn,
      expected_out: expectedOut,
      break_minutes: breakMinutes,
      break_start: breakMinutes > 0 ? breakStart : null,
    });
  };

  return (
    <FormDrawer
      open={open}
      onClose={onClose}
      title={`Edit ${dayName(row.day_of_week)} schedule`}
      description="The new hours apply from the effective date forward. Existing requests that conflict will be reviewed before anything is saved."
      formId="edit-schedule-form"
      onSubmit={handleSubmit}
      submitLabel="Preview changes"
      pendingLabel="Checking…"
      submitting={submitting}
    >
      <div className="space-y-1">
        <label htmlFor="effective_from" className={labelCls}>
          Effective from
        </label>
        <input
          id="effective_from"
          type="date"
          required
          min={todayStr()}
          value={effectiveFrom}
          onChange={(e) => setEffectiveFrom(e.target.value)}
          className={fieldCls}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label htmlFor="expected_in" className={labelCls}>
            Start
          </label>
          <input
            id="expected_in"
            type="time"
            required
            value={expectedIn}
            onChange={(e) => setExpectedIn(e.target.value)}
            className={fieldCls}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="expected_out" className={labelCls}>
            End
          </label>
          <input
            id="expected_out"
            type="time"
            required
            value={expectedOut}
            onChange={(e) => setExpectedOut(e.target.value)}
            className={fieldCls}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label htmlFor="break_minutes" className={labelCls}>
            Break (min)
          </label>
          <input
            id="break_minutes"
            type="number"
            min={0}
            value={breakMinutes}
            onChange={(e) => setBreakMinutes(Number(e.target.value))}
            className={fieldCls}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="break_start" className={labelCls}>
            Break start
          </label>
          <input
            id="break_start"
            type="time"
            disabled={breakMinutes <= 0}
            value={breakStart}
            onChange={(e) => setBreakStart(e.target.value)}
            className={cn(fieldCls, breakMinutes <= 0 && 'opacity-50')}
          />
        </div>
      </div>
    </FormDrawer>
  );
}
