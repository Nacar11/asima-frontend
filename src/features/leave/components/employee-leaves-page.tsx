'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertTriangle, CalendarPlus } from 'lucide-react';
import { Card } from '@/components/layout/app-shell';
import { EmptyState } from '@/components/empty-state';
import { cn } from '@/lib/cn';
import { ApiError } from '@/lib/api-client';
import { formatDateTimeInTz } from '@/lib/format';
import { leaveApi } from '@/features/leave/api';
import { LEAVE_TYPES, SubmitLeaveSchema, type SubmitLeaveInput } from '@/features/leave/schemas';
import { LEAVE_TYPE_LABELS, isPending } from '@/features/leave/format';
import { LeaveStatusBadge } from '@/features/leave/components/leave-status-badge';

const PAGE_LIMIT = 20;

/** /employee/leaves — submit a leave request + see my own history. */
export function EmployeeLeavesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const listQuery = useQuery({
    queryKey: ['leave', 'me', 'list', page],
    queryFn: () => leaveApi.me.list({ page, limit: PAGE_LIMIT }),
    placeholderData: (prev) => prev,
  });

  const form = useForm<SubmitLeaveInput>({
    resolver: zodResolver(SubmitLeaveSchema),
    defaultValues: { leave_type: 'vacation', start_date: '', end_date: '', reason: '' },
  });

  const submitMutation = useMutation({
    mutationFn: (input: SubmitLeaveInput) => leaveApi.me.submit(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['leave', 'me'] });
      toast.success('Leave request submitted.');
      form.reset({ leave_type: 'vacation', start_date: '', end_date: '', reason: '' });
    },
    onError: (err) => toast.error(submitErrorMessage(err)),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => leaveApi.me.cancel(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['leave', 'me'] });
      toast.success('Leave request cancelled.');
    },
    onError: () => toast.error('Could not cancel the request.'),
  });

  const onSubmit = form.handleSubmit((input) => {
    submitMutation.mutate({
      ...input,
      reason: input.reason?.trim() ? input.reason.trim() : undefined,
    });
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight text-neutral-900">Leave</h1>
        <p className="text-sm text-neutral-500">
          Request time off and track where each request is in the approval chain.
        </p>
      </header>

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-neutral-900">New request</h2>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Leave type" error={form.formState.errors.leave_type?.message}>
              <select className={inputCls} {...form.register('leave_type')}>
                {LEAVE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {LEAVE_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Start date" error={form.formState.errors.start_date?.message}>
              <input type="date" className={inputCls} {...form.register('start_date')} />
            </Field>
            <Field label="End date" error={form.formState.errors.end_date?.message}>
              <input type="date" className={inputCls} {...form.register('end_date')} />
            </Field>
          </div>
          <Field label="Reason (optional)" error={form.formState.errors.reason?.message}>
            <textarea rows={2} className={inputCls} {...form.register('reason')} />
          </Field>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitMutation.isPending}
              className={btnPrimary}
            >
              {submitMutation.isPending ? 'Submitting…' : 'Submit request'}
            </button>
          </div>
        </form>
      </Card>

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
              description="Submit your first request using the form above."
            />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
              <table className="min-w-full divide-y divide-neutral-200 text-sm">
                <thead className="bg-neutral-50 text-xs uppercase tracking-wider text-neutral-500">
                  <tr>
                    <Th>Type</Th>
                    <Th>Dates</Th>
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
    </div>
  );
}

function submitErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    const body = err.body as { errors?: Record<string, string>; message?: string } | null;
    const firstFieldError = body?.errors ? Object.values(body.errors)[0] : undefined;
    if (firstFieldError) return firstFieldError;
    if (typeof body?.message === 'string') return body.message;
  }
  return 'Could not submit the request.';
}

function describeError(err: unknown): string {
  if (err instanceof ApiError) return `Request failed (HTTP ${err.status}).`;
  if (err instanceof Error) return err.message;
  return 'Something went wrong.';
}

const inputCls =
  'block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950 disabled:bg-neutral-50';

const btnPrimary = cn(
  'rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white shadow-sm',
  'hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2',
  'disabled:cursor-not-allowed disabled:opacity-60',
);

const btnGhostDanger = cn(
  'rounded-md px-2.5 py-1 text-xs font-medium text-red-600',
  'hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50',
);

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-sm font-medium text-neutral-800">{label}</span>
      {children}
      {error && <span className="block text-xs text-red-600">{error}</span>}
    </label>
  );
}

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
