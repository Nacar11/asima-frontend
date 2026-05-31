'use client';

import { cn } from '@/lib/cn';
import { formatDateInTz } from '@/lib/format';
import { APPROVAL_ACTIONS } from '@/features/approvals/actions';
import type { PendingApproval } from '@/features/approvals/schemas';

const KIND_LABEL: Record<PendingApproval['kind'], string> = {
  leave: 'Leave',
  time_correction: 'Time correction',
};

/**
 * Approvals inbox table. When `onApprove`/`onReject` are provided and the
 * row's kind has registered action handlers, each row gets Approve /
 * Reject buttons. The buttons disappear after a successful action because
 * the row leaves the inbox on refetch (it advances to the next step or to
 * a terminal state).
 */
export function ApprovalsTable({
  rows,
  onApprove,
  onReject,
  pendingId,
}: {
  rows: PendingApproval[];
  onApprove?: (row: PendingApproval) => void;
  onReject?: (row: PendingApproval) => void;
  pendingId?: number | null;
}) {
  const actionable = Boolean(onApprove && onReject);

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
            {actionable && <Th className="text-right">Actions</Th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200 bg-white">
          {rows.map((row) => {
            const canAct = actionable && Boolean(APPROVAL_ACTIONS[row.kind]);
            const busy = pendingId === row.id;
            return (
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
                {actionable && (
                  <Td className="text-right">
                    {canAct ? (
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onReject!(row)}
                          disabled={busy}
                          className={btnGhostDanger}
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => onApprove!(row)}
                          disabled={busy}
                          className={btnPrimary}
                        >
                          {busy ? 'Working…' : 'Approve'}
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-neutral-400">—</span>
                    )}
                  </Td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const btnPrimary = cn(
  'rounded-md bg-neutral-950 px-3 py-1.5 text-xs font-medium text-white shadow-sm',
  'hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2',
  'disabled:cursor-not-allowed disabled:opacity-60',
);

const btnGhostDanger = cn(
  'rounded-md px-3 py-1.5 text-xs font-medium text-red-600',
  'hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50',
);

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
  return <td className={cn('whitespace-nowrap px-4 py-2.5 text-sm text-neutral-900', className)}>{children}</td>;
}
