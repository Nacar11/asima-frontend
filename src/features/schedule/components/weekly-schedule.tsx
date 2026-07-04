'use client';

import { DAY_NAMES, formatBreak, trimSeconds, type WorkSchedule } from '../schemas';

/*
 * Weekly schedule grid. Backend returns 0..7 active rows (one per active
 * weekday). We render Mon..Sun explicitly so the user sees rest days too
 * — empty cells communicate "no scheduled work" rather than hiding the
 * absence.
 *
 * Week starts Monday because that matches Asima's payroll cycle. The
 * backend uses 0 = Sunday … 6 = Saturday, so we re-order for display.
 */
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

export function WeeklySchedule({ rows }: { rows: WorkSchedule[] }) {
  const byDay = new Map<number, WorkSchedule>();
  for (const row of rows) byDay.set(row.day_of_week, row);

  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200">
      <table className="min-w-full divide-y divide-neutral-200">
        <thead className="bg-neutral-50">
          <tr>
            <Th>Day</Th>
            <Th>Start</Th>
            <Th>End</Th>
            <Th>Break</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100 bg-white">
          {DISPLAY_ORDER.map((dow) => {
            const row = byDay.get(dow);
            return (
              <tr key={dow} className={row ? '' : 'bg-neutral-50/50'}>
                <Td className="font-medium">{DAY_NAMES[dow]}</Td>
                {row ? (
                  <>
                    <Td className="font-mono text-xs">{trimSeconds(row.expected_in)}</Td>
                    <Td className="font-mono text-xs">{trimSeconds(row.expected_out)}</Td>
                    <Td className="font-mono text-xs">
                      {formatBreak(row.break_start, row.break_minutes)}
                    </Td>
                  </>
                ) : (
                  <>
                    <Td className="text-neutral-400">—</Td>
                    <Td className="text-neutral-400">—</Td>
                    <Td className="text-neutral-400">—</Td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const Th = ({ children }: { children: React.ReactNode }) => (
  <th
    scope="col"
    className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-neutral-600"
  >
    {children}
  </th>
);

const Td = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <td className={`px-4 py-2.5 text-sm text-neutral-800 ${className ?? ''}`}>{children}</td>
);
