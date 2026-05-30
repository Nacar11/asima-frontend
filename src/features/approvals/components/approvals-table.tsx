'use client';

import { cn } from '@/lib/cn';
import { formatDateInTz } from '@/lib/format';
import type { PendingApproval } from '@/features/approvals/schemas';

const KIND_LABEL: Record<PendingApproval['kind'], string> = {
  leave: 'Leave',
  time_correction: 'Time correction',
};

export function ApprovalsTable({ rows }: { rows: PendingApproval[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200">
      <table className="min-w-full divide-y divide-neutral-200">
        <thead className="bg-neutral-50">
          <tr>
            <Th>Kind</Th>
            <Th>Employee</Th>
            <Th>Summary</Th>
            <Th>Requested</Th>
            <Th>Step</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200 bg-white">
          {rows.map((row) => (
            <tr key={`${row.kind}-${row.id}`}>
              <Td>
                <span className="inline-flex rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700">
                  {KIND_LABEL[row.kind]}
                </span>
              </Td>
              <Td>{row.employee_name}</Td>
              <Td className="max-w-md truncate">{row.summary}</Td>
              <Td>{formatDateInTz(row.requested_at)}</Td>
              <Td>{row.current_step}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      className={cn(
        'px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500',
        className,
      )}
    >
      {children}
    </th>
  );
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={cn('whitespace-nowrap px-4 py-2.5 text-sm text-neutral-900', className)}>
      {children}
    </td>
  );
}
