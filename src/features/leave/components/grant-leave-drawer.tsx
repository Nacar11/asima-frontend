'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/cn';
import { ApiError } from '@/lib/api-client';
import { formatDateTimeInTz } from '@/lib/format';
import { leaveApi } from '@/features/leave/api';
import { leaveKeys } from '@/features/leave/keys';
import {
  GrantAllocationSchema,
  LEAVE_TYPES,
  type GrantAllocationInput,
} from '@/features/leave/schemas';
import { LEAVE_TYPE_LABELS } from '@/features/leave/format';
import { LeaveBalanceSummary } from '@/features/leave/components/leave-balance-summary';

const DEFAULTS: GrantAllocationInput = { leave_type: 'vacation', amount: 1, reason: '' };

/**
 * Admin drawer to grant leave days to an employee. Shows the chosen employee's
 * live balances + grant history; granting is append-only and reflects
 * immediately (balances + history invalidated). Gated by LEAVE_ALLOCATION:Create
 * at the call site.
 */
export function GrantLeaveDrawer({
  employees,
  open,
  onClose,
}: {
  employees: { id: number; name: string }[];
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [employeeId, setEmployeeId] = useState<number | ''>('');

  const form = useForm<GrantAllocationInput>({
    resolver: zodResolver(GrantAllocationSchema),
    defaultValues: DEFAULTS,
  });

  useEffect(() => {
    if (open) {
      setEmployeeId('');
      form.reset(DEFAULTS);
    }
  }, [open, form]);

  const selected = employeeId !== '';

  const balancesQuery = useQuery({
    queryKey: leaveKeys.adminBalances(employeeId),
    queryFn: () => leaveApi.admin.balances(employeeId as number),
    enabled: open && selected,
  });

  const historyQuery = useQuery({
    queryKey: leaveKeys.adminAllocations(employeeId),
    queryFn: () => leaveApi.admin.allocations(employeeId as number),
    enabled: open && selected,
  });

  const grantMutation = useMutation({
    mutationFn: (input: GrantAllocationInput) => leaveApi.admin.grant(employeeId as number, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: leaveKeys.adminBalances(employeeId) });
      void queryClient.invalidateQueries({ queryKey: leaveKeys.adminAllocations(employeeId) });
      toast.success('Leave granted.');
      form.reset({ leave_type: form.getValues('leave_type'), amount: 1, reason: '' });
    },
    onError: (err) => toast.error(grantErrorMessage(err)),
  });

  const onSubmit = form.handleSubmit((input) => grantMutation.mutate(input));

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Grant leave</SheetTitle>
          <SheetDescription>
            Add leave days to an employee&apos;s balance (append-only).
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="space-y-5">
          <Field label="Employee">
            <select
              aria-label="Employee"
              className={inputCls}
              value={employeeId === '' ? '' : String(employeeId)}
              onChange={(e) => setEmployeeId(e.target.value === '' ? '' : Number(e.target.value))}
            >
              <option value="">Select an employee…</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </Field>

          {selected && (
            <>
              {balancesQuery.data && (
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                    Current balances
                  </p>
                  <LeaveBalanceSummary balances={balancesQuery.data} />
                </div>
              )}

              <form onSubmit={onSubmit} className="space-y-4 border-t border-neutral-200 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Leave type" error={form.formState.errors.leave_type?.message}>
                    <select className={inputCls} {...form.register('leave_type')}>
                      {LEAVE_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {LEAVE_TYPE_LABELS[t]}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Days" error={form.formState.errors.amount?.message}>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      className={inputCls}
                      {...form.register('amount')}
                    />
                  </Field>
                </div>
                <Field label="Reason (optional)" error={form.formState.errors.reason?.message}>
                  <input className={inputCls} {...form.register('reason')} />
                </Field>
                <button type="submit" disabled={grantMutation.isPending} className={btnPrimary}>
                  {grantMutation.isPending ? 'Granting…' : 'Grant days'}
                </button>
              </form>

              {historyQuery.data && historyQuery.data.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                    Grant history
                  </p>
                  <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200">
                    {historyQuery.data.map((a) => (
                      <li
                        key={a.id}
                        className="flex items-center justify-between px-3 py-2 text-sm"
                      >
                        <span>
                          <span className="font-medium tabular-nums">+{a.amount}</span>{' '}
                          {LEAVE_TYPE_LABELS[a.leave_type]}
                          <span className="ml-2 text-xs text-neutral-400">{a.source}</span>
                        </span>
                        <span className="text-xs text-neutral-500">
                          {formatDateTimeInTz(a.created_at)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </SheetBody>

        <SheetFooter>
          <button type="button" onClick={onClose} className={btnGhost}>
            Close
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function grantErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    const body = err.body as { errors?: Record<string, string>; message?: string } | null;
    const firstFieldErr = body?.errors ? Object.values(body.errors)[0] : undefined;
    if (firstFieldErr) return firstFieldErr;
    if (typeof body?.message === 'string') return body.message;
  }
  return 'Could not grant leave.';
}

const inputCls =
  'block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950 disabled:bg-neutral-50';

const btnPrimary = cn(
  'rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white shadow-sm',
  'hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2',
  'disabled:cursor-not-allowed disabled:opacity-60',
);

const btnGhost = cn(
  'rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700',
  'hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-300',
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
