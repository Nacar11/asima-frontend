'use client';

import { formatDateInTz, formatTimeInTz } from '@/lib/format';
import {
  durationMinutes,
  formatDuration,
  type TimeEntry,
} from '@/features/time-entries/schemas';
import { cn } from '@/lib/cn';

export function EntriesTable({ rows }: { rows: TimeEntry[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-neutral-200 p-8 text-center text-sm text-neutral-500">
        No time entries yet. Use the punch button to record one.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200">
      <table className="min-w-full divide-y divide-neutral-200">
        <thead className="bg-neutral-50">
          <tr>
            <Th>Date</Th>
            <Th>In</Th>
            <Th>Out</Th>
            <Th>Duration</Th>
            <Th>Status</Th>
            <Th>Source</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100 bg-white">
          {rows.map((row) => (
            <tr key={row.id}>
              <Td className="font-medium">{formatDateInTz(row.time_in)}</Td>
              <Td className="font-mono text-xs">{formatTimeInTz(row.time_in)}</Td>
              <Td className="font-mono text-xs">
                {row.time_out ? formatTimeInTz(row.time_out) : '—'}
              </Td>
              <Td>{formatDuration(durationMinutes(row))}</Td>
              <Td>
                <StatusPill status={row.status} />
              </Td>
              <Td className="text-xs text-neutral-500">{row.source}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const StatusPill = ({ status }: { status: TimeEntry['status'] }) => (
  <span
    className={cn(
      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
      status === 'open'
        ? 'bg-emerald-100 text-emerald-800'
        : 'bg-neutral-100 text-neutral-700',
    )}
  >
    {status}
  </span>
);

const Th = ({ children }: { children: React.ReactNode }) => (
  <th
    scope="col"
    className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-neutral-600"
  >
    {children}
  </th>
);

const Td = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => <td className={`px-4 py-2.5 text-sm text-neutral-800 ${className ?? ''}`}>{children}</td>;
