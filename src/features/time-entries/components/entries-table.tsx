'use client';

import { formatDateInTz, formatTimeInTz } from '@/lib/format';
import { durationMinutes, formatDuration, type TimeEntry } from '@/features/time-entries/schemas';
import {
  findScheduleForDate,
  scheduledRegularHours,
  tardinessMinutes,
  undertimeMinutes,
} from '@/features/time-entries/metrics';
import type { WorkSchedule } from '@/features/schedule/schemas';
import { cn } from '@/lib/cn';

/**
 * Daily attendance log. One row per time entry, with derived metrics
 * (tardiness / undertime / regular hours) computed against the matching
 * WorkSchedule row when one is in effect for the entry's date. Days
 * without a schedule row show "—" for derived columns rather than
 * fabricating a baseline.
 */
export function EntriesTable({
  rows,
  schedules,
  onRequestCorrection,
}: {
  rows: TimeEntry[];
  schedules: WorkSchedule[];
  onRequestCorrection?: (entry: TimeEntry) => void;
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-neutral-200 p-8 text-center text-sm text-neutral-500">
        No entries yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200">
      <table className="min-w-full divide-y divide-neutral-200">
        <thead className="bg-neutral-50">
          <tr>
            <Th>Date</Th>
            <Th>In</Th>
            <Th>Out</Th>
            <Th className="text-right">Tardiness</Th>
            <Th className="text-right">Undertime</Th>
            <Th className="text-right">Work hours</Th>
            <Th className="text-right">Action</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100 bg-white">
          {rows.map((row) => {
            const schedule = findScheduleForDate(schedules, row.work_date);
            const late = tardinessMinutes(row, schedule);
            const under = undertimeMinutes(row, schedule);
            const worked = durationMinutes(row);
            const regular = scheduledRegularHours(schedule);

            return (
              <tr key={row.id}>
                <Td className="font-medium">{formatDateInTz(row.time_in)}</Td>
                <Td className="font-mono text-xs">{formatTimeInTz(row.time_in)}</Td>
                <Td className="font-mono text-xs">
                  {row.time_out ? formatTimeInTz(row.time_out) : '—'}
                </Td>
                <Td className="text-right tabular-nums">
                  <MinutesCell minutes={late} kind="late" />
                </Td>
                <Td className="text-right tabular-nums">
                  <MinutesCell minutes={under} kind="under" />
                </Td>
                <Td className="text-right">
                  <div className="tabular-nums">{formatDuration(worked)}</div>
                  <div className="text-xs text-neutral-500">
                    {regular === null ? '—' : `${regular.toFixed(2)}h regular`}
                  </div>
                </Td>
                <Td className="text-right">
                  <button
                    type="button"
                    onClick={() => onRequestCorrection?.(row)}
                    className="rounded-md border border-neutral-300 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  >
                    Request correction
                  </button>
                </Td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function MinutesCell({ minutes, kind }: { minutes: number | null; kind: 'late' | 'under' }) {
  if (minutes === null) return <span className="text-neutral-400">—</span>;
  if (minutes === 0) return <span className="text-neutral-500">0</span>;
  return (
    <span className={kind === 'late' ? 'text-amber-700' : 'text-rose-700'}>{minutes} min</span>
  );
}

const Th = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <th
    scope="col"
    className={cn(
      'px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-neutral-600',
      className,
    )}
  >
    {children}
  </th>
);

const Td = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <td className={cn('px-4 py-2.5 text-sm text-neutral-800', className)}>{children}</td>
);
