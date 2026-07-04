'use client';

import { Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  DAY_NAMES,
  dayName,
  formatBreak,
  trimSeconds,
  type WorkSchedule,
} from '@/features/schedule';

type WeeklyGridProps = {
  rows: WorkSchedule[];
  canEdit: boolean;
  canRemove: boolean;
  onEdit: (row: WorkSchedule) => void;
  onRemove: (row: WorkSchedule) => void;
};

/**
 * Read view of an employee's active weekly schedule — one card per weekday
 * (Sun..Sat). Days with an active row show the window + break and Edit/Remove;
 * empty days are rendered muted so the admin sees the whole week at a glance.
 */
export function WeeklyGrid({ rows, canEdit, canRemove, onEdit, onRemove }: WeeklyGridProps) {
  const byDay = new Map(rows.map((r) => [r.day_of_week, r]));

  return (
    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {DAY_NAMES.map((_, dow) => {
        const row = byDay.get(dow);
        return (
          <li
            key={dow}
            className={cn(
              'rounded-lg border p-3',
              row
                ? 'border-neutral-200 bg-white'
                : 'border-dashed border-neutral-200 bg-neutral-50',
            )}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-neutral-900">{dayName(dow)}</p>
              {row && (
                <div className="flex items-center gap-1">
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => onEdit(row)}
                      aria-label={`Edit ${dayName(dow)} schedule`}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-1"
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                    </button>
                  )}
                  {canRemove && (
                    <button
                      type="button"
                      onClick={() => onRemove(row)}
                      aria-label={`Remove ${dayName(dow)} schedule`}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-red-500 hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-1"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  )}
                </div>
              )}
            </div>

            {row ? (
              <dl className="mt-2 space-y-0.5 text-sm text-neutral-600">
                <div className="flex justify-between">
                  <dt>Hours</dt>
                  <dd className="font-medium text-neutral-900">
                    {trimSeconds(row.expected_in)}–{trimSeconds(row.expected_out)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt>Break</dt>
                  <dd>{formatBreak(row.break_start, row.break_minutes)}</dd>
                </div>
              </dl>
            ) : (
              <p className="mt-2 text-sm text-neutral-400">No schedule</p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
