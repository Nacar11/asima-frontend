'use client';

import { cn } from '@/lib/cn';
import { formatDateInTz } from '@/lib/format';
import { APPROVAL_ACTIONS } from '@/features/approvals/actions';
import { TimeInOutDiff } from '@/features/time-correction/components/time-in-out-diff';
import type { PendingApproval } from '@/features/approvals/schemas';

/**
 * Single-kind approvals inbox table (one table per resource page; the kind
 * is implied by the page, so there's no Kind column). Each row can carry up
 * to three actions:
 *   - `onDetails` → a Details button that opens the per-row drawer.
 *   - `onApprove`/`onReject` → Approve / Reject, shown only when the row's
 *     kind has registered handlers in `APPROVAL_ACTIONS`.
 * Action buttons disappear after a successful action because the row leaves
 * the inbox on refetch (it advances a step or reaches a terminal state).
 */
export function ApprovalsTable({
  rows,
  onDetails,
  onApprove,
  onReject,
  pendingId,
}: {
  rows: PendingApproval[];
  onDetails?: (row: PendingApproval) => void;
  onApprove?: (row: PendingApproval) => void;
  onReject?: (row: PendingApproval) => void;
  pendingId?: number | null;
}) {
  const actionable = Boolean(onApprove && onReject);
  const hasActionsColumn = actionable || Boolean(onDetails);

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200">
      <table className="min-w-full divide-y divide-neutral-200">
        <thead className="bg-neutral-50">
          <tr>
            <Th>Employee</Th>
            <Th>Summary</Th>
            <Th>Requested</Th>
            <Th>Step</Th>
            {hasActionsColumn && <Th className="text-right">Actions</Th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200 bg-white">
          {rows.map((row) => {
            const canAct = actionable && Boolean(APPROVAL_ACTIONS[row.kind]);
            const busy = pendingId === row.id;
            return (
              <tr key={`${row.kind}-${row.id}`}>
                <Td>{row.employee_name}</Td>
                <Td className="max-w-md">
                  {row.time_correction ? (
                    <TimeInOutDiff
                      inOriginal={row.time_correction.original_time_in}
                      inProposed={row.time_correction.proposed_time_in}
                      outOriginal={row.time_correction.original_time_out}
                      outProposed={row.time_correction.proposed_time_out}
                    />
                  ) : (
                    <span className="truncate">{row.summary}</span>
                  )}
                </Td>
                <Td>{formatDateInTz(row.requested_at)}</Td>
                <Td>{row.current_step}</Td>
                {hasActionsColumn && (
                  <Td className="text-right">
                    <div className="flex justify-end gap-2">
                      {onDetails && (
                        <button
                          type="button"
                          onClick={() => onDetails(row)}
                          className={btnSecondary}
                        >
                          Details
                        </button>
                      )}
                      {canAct && (
                        <>
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
                        </>
                      )}
                    </div>
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

const btnSecondary = cn(
  'rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 shadow-sm',
  'hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2',
  'disabled:cursor-not-allowed disabled:opacity-60',
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
  return (
    <td className={cn('whitespace-nowrap px-4 py-2.5 text-sm text-neutral-900', className)}>
      {children}
    </td>
  );
}
