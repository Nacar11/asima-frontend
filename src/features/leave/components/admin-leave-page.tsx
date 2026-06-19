'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CalendarRange } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { Pagination } from '@/components/pagination';
import { Select } from '@/components/select';
import { cn } from '@/lib/cn';
import { usePagination } from '@/lib/use-pagination';
import { ApiError } from '@/lib/api-client';
import { formatDateTimeInTz } from '@/lib/format';
import { useAuth } from '@/features/auth/use-auth';
import { usePermissions } from '@/features/auth/use-permissions';
import { hasPermission } from '@/features/auth/permission-utils';
import { adminUsersApi } from '@/features/admin-users/api';
import { adminUserKeys } from '@/features/admin-users/keys';
import { leaveApi } from '@/features/leave/api';
import { leaveKeys } from '@/features/leave/keys';
import { LEAVE_STATUSES, type LeaveRequest, type LeaveStatus } from '@/features/leave/schemas';
import {
  LEAVE_PORTION_LABELS,
  LEAVE_STATUS_META,
  LEAVE_TYPE_LABELS,
} from '@/features/leave/format';
import { LeaveStatusBadge } from '@/features/leave/components/leave-status-badge';
import { LeaveDetailDrawer } from '@/features/leave/components/leave-detail-drawer';
import { GrantLeaveDrawer } from '@/features/leave/components/grant-leave-drawer';

const PAGE_LIMIT = 20;

function describeError(err: unknown): string {
  if (err instanceof ApiError) return `Request failed (HTTP ${err.status}).`;
  if (err instanceof Error) return err.message;
  return 'Something went wrong.';
}

/** /admin/leave-requests — HR view across the whole org. */
export function AdminLeavePage() {
  const { user } = useAuth();
  const { permissions } = usePermissions();
  const sysAdmin = user?.system_admin ?? false;
  const canApproveAny = hasPermission(permissions, 'LEAVE:ApproveAny', sysAdmin);
  const canUpdate = hasPermission(permissions, 'LEAVE:Update', sysAdmin);
  const canDelete = hasPermission(permissions, 'LEAVE:Delete', sysAdmin);
  const canGrant = hasPermission(permissions, 'LEAVE_ALLOCATION:Create', sysAdmin);
  const [grantOpen, setGrantOpen] = useState(false);

  const { page, toPrev, toNext, reset: resetPage } = usePagination();
  const [status, setStatus] = useState<LeaveStatus | ''>('');
  const [employeeId, setEmployeeId] = useState<number | ''>('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [selected, setSelected] = useState<LeaveRequest | null>(null);

  useEffect(() => {
    resetPage();
  }, [status, employeeId, from, to, resetPage]);

  // Row display names come joined from the backend list (employee_name).
  // The users directory is fetched only to populate the employee filter.
  const usersQuery = useQuery({
    queryKey: adminUserKeys.filterOptions(),
    queryFn: () => adminUsersApi.list({ limit: 100 }),
    staleTime: 5 * 60 * 1000,
  });
  const displayName = (row: LeaveRequest) => row.employee_name ?? `#${row.employee_id}`;

  const listQuery = useQuery({
    queryKey: leaveKeys.adminList({ page, status, employeeId, from, to }),
    queryFn: () =>
      leaveApi.admin.list({
        page,
        limit: PAGE_LIMIT,
        status: status === '' ? undefined : [status],
        employee_id: employeeId === '' ? undefined : employeeId,
        from: from || undefined,
        to: to || undefined,
      }),
    placeholderData: (prev) => prev,
  });

  const employeeOptions = [
    { value: '', label: 'All employees' },
    ...(usersQuery.data?.data ?? []).map((u) => ({
      value: String(u.id),
      label: `${u.first_name} ${u.last_name}`,
    })),
  ];
  const statusOptions = [
    { value: '', label: 'All statuses' },
    ...LEAVE_STATUSES.map((s) => ({ value: s, label: LEAVE_STATUS_META[s].label })),
  ];

  return (
    <div className="space-y-6">
      {canGrant && (
        <header className="flex flex-wrap items-start justify-end gap-3">
          <button type="button" onClick={() => setGrantOpen(true)} className={grantBtnCls}>
            Grant leave
          </button>
        </header>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Select<string>
          value={employeeId === '' ? '' : String(employeeId)}
          onValueChange={(v) => setEmployeeId(v === '' ? '' : Number(v))}
          options={employeeOptions}
          ariaLabel="Filter by employee"
          className="w-48"
        />
        <Select<string>
          value={status}
          onValueChange={(v) => setStatus(v as LeaveStatus | '')}
          options={statusOptions}
          ariaLabel="Filter by status"
          className="w-44"
        />
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          aria-label="From date"
          className={dateCls}
        />
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          aria-label="To date"
          className={dateCls}
        />
      </div>

      {listQuery.isLoading && <p className="text-sm text-neutral-500">Loading…</p>}

      {listQuery.error && (
        <EmptyState
          tone="error"
          icon={AlertTriangle}
          title="Couldn't load leave requests"
          description={describeError(listQuery.error)}
        />
      )}

      {listQuery.data &&
        (listQuery.data.data.length === 0 ? (
          <EmptyState
            icon={CalendarRange}
            title="No leave requests"
            description="Nothing matches the current filters."
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
            <table className="min-w-full divide-y divide-neutral-200 text-sm">
              <thead className="bg-neutral-50 text-xs uppercase tracking-wider text-neutral-500">
                <tr>
                  <Th>Employee</Th>
                  <Th>Type</Th>
                  <Th>Dates</Th>
                  <Th>Status</Th>
                  <Th>Decision</Th>
                  <Th>Submitted</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {listQuery.data.data.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => setSelected(row)}
                    className="cursor-pointer hover:bg-neutral-50"
                  >
                    <Td className="font-medium text-neutral-900">{displayName(row)}</Td>
                    <Td>{LEAVE_TYPE_LABELS[row.leave_type]}</Td>
                    <Td>
                      {row.start_date} → {row.end_date}
                      {row.day_portion !== 'full' && (
                        <span className="ml-1 text-xs text-neutral-500">
                          · {LEAVE_PORTION_LABELS[row.day_portion]}
                        </span>
                      )}
                    </Td>
                    <Td>
                      <LeaveStatusBadge status={row.status} />
                    </Td>
                    <Td className="text-neutral-500">{row.decision_path ?? '—'}</Td>
                    <Td className="text-neutral-500">{formatDateTimeInTz(row.submitted_at)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

      {listQuery.data && listQuery.data.total > PAGE_LIMIT && (
        <Pagination
          page={page}
          hasMore={listQuery.data.has_more}
          onPrev={toPrev}
          onNext={toNext}
        />
      )}

      <LeaveDetailDrawer
        request={selected}
        employeeName={selected ? displayName(selected) : ''}
        open={selected !== null}
        onClose={() => setSelected(null)}
        canApproveAny={canApproveAny}
        canUpdate={canUpdate}
        canDelete={canDelete}
      />

      {canGrant && (
        <GrantLeaveDrawer
          employees={(usersQuery.data?.data ?? []).map((u) => ({
            id: u.id,
            name: `${u.first_name} ${u.last_name}`,
          }))}
          open={grantOpen}
          onClose={() => setGrantOpen(false)}
        />
      )}
    </div>
  );
}

const grantBtnCls = cn(
  'rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white shadow-sm',
  'hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2',
);

const dateCls = cn(
  'h-9 rounded-md border border-neutral-300 bg-white px-3 text-sm text-neutral-900 shadow-sm',
  'focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-1',
);

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th scope="col" className="px-4 py-2 text-left font-medium">
      {children}
    </th>
  );
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn('px-4 py-2.5 text-neutral-900', className)}>{children}</td>;
}
