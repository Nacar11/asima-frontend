'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertTriangle, CalendarPlus, Plus } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { cn } from '@/lib/cn';
import { ApiError } from '@/lib/api-client';
import { formatDateTimeInTz } from '@/lib/format';
import { leaveApi } from '@/features/leave/api';
import { LEAVE_TYPE_LABELS, isPending } from '@/features/leave/format';
import { LeaveStatusBadge } from '@/features/leave/components/leave-status-badge';
import { LeaveBalanceSummary } from '@/features/leave/components/leave-balance-summary';
import { ApplyLeaveDrawer } from '@/features/leave/components/apply-leave-drawer';

const PAGE_LIMIT = 20;

/** /employee/leaves — my balances, my request history, and the apply drawer. */
export function EmployeeLeavesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [applyOpen, setApplyOpen] = useState(false);

  const balancesQuery = useQuery({
    queryKey: ['leave', 'balances'],
    queryFn: () => leaveApi.me.balances(),
  });

  const listQuery = useQuery({
    queryKey: ['leave', 'me', 'list', page],
    queryFn: () => leaveApi.me.list({ page, limit: PAGE_LIMIT }),
    placeholderData: (prev) => prev,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => leaveApi.me.cancel(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['leave', 'me'] });
      void queryClient.invalidateQueries({ queryKey: ['leave', 'balances'] });
      toast.success('Leave request cancelled.');
    },
    onError: () => toast.error('Could not cancel the request.'),
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight text-neutral-900">Leave</h1>
          <p className="text-sm text-neutral-500">
            Track your balances and where each request is in the approval chain.
          </p>
        </div>
        <button type="button" onClick={() => setApplyOpen(true)} className={btnPrimary}>
          <Plus className="h-4 w-4" aria-hidden />
          Apply for leave
        </button>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-900">My balances</h2>
        {balancesQuery.isLoading && <p className="text-sm text-neutral-500">Loading…</p>}
        {balancesQuery.error && (
          <EmptyState
            tone="error"
            icon={AlertTriangle}
            title="Couldn't load your balances"
            description={describeError(balancesQuery.error)}
          />
        )}
        {balancesQuery.data && <LeaveBalanceSummary balances={balancesQuery.data} />}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-900">My requests</h2>

        {listQuery.isLoading && <p className="text-sm text-neutral-500">Loading…</p>}

        {listQuery.error && (
          <EmptyState
            tone="error"
            icon={AlertTriangle}
            title="Couldn't load your requests"
            description={describeError(listQuery.error)}
          />
        )}

        {listQuery.data &&
          (listQuery.data.data.length === 0 ? (
            <EmptyState
              icon={CalendarPlus}
              title="No leave requests yet"
              description="Use “Apply for leave” to submit your first request."
            />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
              <table className="min-w-full divide-y divide-neutral-200 text-sm">
                <thead className="bg-neutral-50 text-xs uppercase tracking-wider text-neutral-500">
                  <tr>
                    <Th>Type</Th>
                    <Th>Dates</Th>
                    <Th className="text-right">Days</Th>
                    <Th>Status</Th>
                    <Th>Submitted</Th>
                    <Th className="text-right">Action</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {listQuery.data.data.map((row) => (
                    <tr key={row.id}>
                      <Td>{LEAVE_TYPE_LABELS[row.leave_type]}</Td>
                      <Td>
                        {row.start_date} → {row.end_date}
                      </Td>
                      <Td className="text-right tabular-nums">{row.working_days}</Td>
                      <Td>
                        <LeaveStatusBadge status={row.status} />
                      </Td>
                      <Td className="text-neutral-500">{formatDateTimeInTz(row.submitted_at)}</Td>
                      <Td className="text-right">
                        {isPending(row.status) ? (
                          <button
                            type="button"
                            onClick={() => cancelMutation.mutate(row.id)}
                            disabled={cancelMutation.isPending}
                            className={btnGhostDanger}
                          >
                            Cancel
                          </button>
                        ) : (
                          <span className="text-xs text-neutral-400">—</span>
                        )}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

        {listQuery.data && listQuery.data.total > PAGE_LIMIT && (
          <div className="flex items-center justify-end gap-2 text-xs text-neutral-500">
            <PagerButton onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              Previous
            </PagerButton>
            <PagerButton
              onClick={() => setPage((p) => p + 1)}
              disabled={!listQuery.data.has_more}
            >
              Next
            </PagerButton>
          </div>
        )}
      </section>

      <ApplyLeaveDrawer open={applyOpen} onClose={() => setApplyOpen(false)} />
    </div>
  );
}

function describeError(err: unknown): string {
  if (err instanceof ApiError) return `Request failed (HTTP ${err.status}).`;
  if (err instanceof Error) return err.message;
  return 'Something went wrong.';
}

const btnPrimary = cn(
  'inline-flex items-center gap-2 rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white shadow-sm',
  'hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2',
  'disabled:cursor-not-allowed disabled:opacity-60',
);

const btnGhostDanger = cn(
  'rounded-md px-2.5 py-1 text-xs font-medium text-red-600',
  'hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50',
);

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th scope="col" className={cn('px-4 py-2 text-left font-medium', className)}>{children}</th>;
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn('px-4 py-2.5 text-neutral-900', className)}>{children}</td>;
}

const PagerButton = ({ children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    type="button"
    className={cn(
      'rounded-md border border-neutral-300 px-2.5 py-1 text-xs font-medium text-neutral-700',
      'hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50',
    )}
    {...rest}
  >
    {children}
  </button>
);
