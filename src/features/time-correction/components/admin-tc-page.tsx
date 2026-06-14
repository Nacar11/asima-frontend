'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Clock } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { Select } from '@/components/select';
import { cn } from '@/lib/cn';
import { ApiError } from '@/lib/api-client';
import { formatDateTimeInTz, formatTimeInTz } from '@/lib/format';
import { useAuth } from '@/features/auth/use-auth';
import { usePermissions } from '@/features/auth/use-permissions';
import { hasPermission } from '@/features/auth/permission-utils';
import { adminUsersApi } from '@/features/admin-users/api';
import { adminUserKeys } from '@/features/admin-users/keys';
import { timeCorrectionApi } from '@/features/time-correction/api';
import { timeCorrectionKeys } from '@/features/time-correction/keys';
import {
  TC_STATUSES,
  type TcStatus,
  type TimeCorrectionRequest,
} from '@/features/time-correction/schemas';
import { TC_STATUS_META } from '@/features/time-correction/format';
import { TcStatusBadge } from '@/features/time-correction/components/tc-status-badge';
import { TcDetailDrawer } from '@/features/time-correction/components/tc-detail-drawer';

const PAGE_LIMIT = 20;

function describeError(err: unknown): string {
  if (err instanceof ApiError) return `Request failed (HTTP ${err.status}).`;
  if (err instanceof Error) return err.message;
  return 'Something went wrong.';
}

/** /admin/time-corrections — HR view across the whole org. */
export function AdminTimeCorrectionsPage() {
  const { user } = useAuth();
  const { permissions } = usePermissions();
  const sysAdmin = user?.system_admin ?? false;
  const canApproveAny = hasPermission(permissions, 'TIME_CORRECTION:ApproveAny', sysAdmin);
  const canUpdate = hasPermission(permissions, 'TIME_CORRECTION:Update', sysAdmin);
  const canDelete = hasPermission(permissions, 'TIME_CORRECTION:Delete', sysAdmin);

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<TcStatus | ''>('');
  const [employeeId, setEmployeeId] = useState<number | ''>('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [selected, setSelected] = useState<TimeCorrectionRequest | null>(null);

  useEffect(() => {
    setPage(1);
  }, [status, employeeId, from, to]);

  // Row display names come joined from the backend list (employee_name).
  // The users directory is fetched only to populate the employee filter.
  const usersQuery = useQuery({
    queryKey: adminUserKeys.filterOptions(),
    queryFn: () => adminUsersApi.list({ limit: 100 }),
    staleTime: 5 * 60 * 1000,
  });
  const displayName = (row: TimeCorrectionRequest) => row.employee_name ?? `#${row.employee_id}`;

  const listQuery = useQuery({
    queryKey: timeCorrectionKeys.adminList({ page, status, employeeId, from, to }),
    queryFn: () =>
      timeCorrectionApi.admin.list({
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
    ...TC_STATUSES.map((s) => ({ value: s, label: TC_STATUS_META[s].label })),
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight text-neutral-900">Time corrections</h1>
        <p className="text-sm text-neutral-500">
          Every time-correction request across the organization.
        </p>
      </header>

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
          onValueChange={(v) => setStatus(v as TcStatus | '')}
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
          title="Couldn't load time corrections"
          description={describeError(listQuery.error)}
        />
      )}

      {listQuery.data &&
        (listQuery.data.data.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No time-correction requests"
            description="Nothing matches the current filters."
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
            <table className="min-w-full divide-y divide-neutral-200 text-sm">
              <thead className="bg-neutral-50 text-xs uppercase tracking-wider text-neutral-500">
                <tr>
                  <Th>Employee</Th>
                  <Th>Work date</Th>
                  <Th>Proposed</Th>
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
                    <Td>{row.work_date}</Td>
                    <Td className="font-mono text-xs">
                      {formatTimeInTz(row.proposed_time_in)} →{' '}
                      {row.proposed_time_out ? formatTimeInTz(row.proposed_time_out) : '—'}
                    </Td>
                    <Td>
                      <TcStatusBadge status={row.status} />
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
        <div className="flex items-center justify-end gap-2 text-xs text-neutral-500">
          <PagerButton onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            Previous
          </PagerButton>
          <PagerButton onClick={() => setPage((p) => p + 1)} disabled={!listQuery.data.has_more}>
            Next
          </PagerButton>
        </div>
      )}

      <TcDetailDrawer
        request={selected}
        employeeName={selected ? displayName(selected) : ''}
        open={selected !== null}
        onClose={() => setSelected(null)}
        canApproveAny={canApproveAny}
        canUpdate={canUpdate}
        canDelete={canDelete}
      />
    </div>
  );
}

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
