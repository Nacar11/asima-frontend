'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Search, Users } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { cn } from '@/lib/cn';
import { ApiError } from '@/lib/api-client';
import { useAuth } from '@/features/auth/use-auth';
import { usePermissions } from '@/features/auth/use-permissions';
import { hasPermission } from '@/features/auth/permission-utils';
import { adminApproversApi } from '@/features/admin-approvers/api';
import { adminUsersApi } from '@/features/admin-users/api';
import { ApproversTable, type ApproverCandidate } from './approvers-table';
import { BulkReassignDialog } from './bulk-reassign-dialog';

const PAGE_LIMIT = 20;

function describeError(err: unknown): string {
  if (err instanceof ApiError) {
    return `Request failed (HTTP ${err.status}). Please try again.`;
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong while fetching the list.';
}

/**
 * /admin/approvers — the bulk approver-chain management surface.
 *
 * Read access gated by APPROVAL_CHAIN:View (route wrapper); inline edits
 * and the bulk-reassign action additionally require APPROVAL_CHAIN:Update
 * (computed here and threaded down). See ADR 0001 for the role-vs-chain
 * split this page operates on.
 */
export function ApproversPage() {
  const { user } = useAuth();
  const { permissions } = usePermissions();
  const canUpdate = hasPermission(
    permissions,
    'APPROVAL_CHAIN:Update',
    user?.system_admin ?? false,
  );

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [bulkOpen, setBulkOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const listQueryKey = ['admin-approvers', 'list', page, debouncedSearch] as const;

  const listQuery = useQuery({
    queryKey: listQueryKey,
    queryFn: () =>
      adminApproversApi.list({
        page,
        limit: PAGE_LIMIT,
        search: debouncedSearch || undefined,
      }),
    placeholderData: (prev) => prev,
  });

  // Candidate approvers for the inline selects + bulk dialog. Only
  // fetched when the caller can actually edit.
  const candidatesQuery = useQuery({
    queryKey: ['admin-users', 'approver-candidates'],
    queryFn: () => adminUsersApi.list({ is_active: true, limit: 100 }),
    enabled: canUpdate,
    staleTime: 60 * 1000,
  });

  const candidates: ApproverCandidate[] = useMemo(
    () =>
      (candidatesQuery.data?.data ?? []).map((u) => ({
        id: u.id,
        name: `${u.first_name} ${u.last_name}`,
      })),
    [candidatesQuery.data],
  );

  const hasSearch = debouncedSearch.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email…"
            aria-label="Search employees"
            className={cn(
              'h-9 w-full rounded-md border border-neutral-300 bg-white pl-8 pr-3 text-sm text-neutral-900 shadow-sm',
              'focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-1',
            )}
          />
        </div>
        {canUpdate && (
          <button
            type="button"
            onClick={() => setBulkOpen(true)}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 shadow-sm',
              'hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2',
            )}
          >
            Bulk reassign…
          </button>
        )}
      </div>

      {listQuery.isLoading && (
        <div className="space-y-2" aria-hidden>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-md bg-neutral-100" />
          ))}
        </div>
      )}

      {listQuery.error && (
        <EmptyState
          tone="error"
          icon={AlertTriangle}
          title="Couldn't load approvers"
          description={describeError(listQuery.error)}
          action={
            <button
              type="button"
              onClick={() => listQuery.refetch()}
              className={cn(
                'rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 shadow-sm',
                'hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2',
              )}
            >
              Try again
            </button>
          }
        />
      )}

      {listQuery.data &&
        (listQuery.data.data.length === 0 ? (
          <EmptyState
            icon={Users}
            title={hasSearch ? 'No employees match your search' : 'No employees yet'}
            description={
              hasSearch
                ? 'Try a different name or email.'
                : 'No employees yet — add one via Employees.'
            }
          />
        ) : (
          <ApproversTable
            rows={listQuery.data.data}
            candidates={candidates}
            listQueryKey={listQueryKey}
            canUpdate={canUpdate}
          />
        ))}

      {listQuery.data && listQuery.data.total > PAGE_LIMIT && (
        <div className="flex items-center justify-between text-xs text-neutral-500">
          <span>
            Showing {(page - 1) * PAGE_LIMIT + 1}–
            {Math.min(listQuery.data.total, page * PAGE_LIMIT)} of {listQuery.data.total}
          </span>
          <div className="flex gap-2">
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
        </div>
      )}

      {canUpdate && (
        <BulkReassignDialog
          open={bulkOpen}
          onClose={() => setBulkOpen(false)}
          candidates={candidates}
        />
      )}
    </div>
  );
}

const PagerButton = ({
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
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
