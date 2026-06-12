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
import { toast } from 'sonner';
import { adminApproversApi } from '@/features/admin-approvers/api';
import { adminUsersApi } from '@/features/admin-users/api';
import { ApproversTable, type ApproverCandidate } from './approvers-table';
import { BulkReassignDialog } from './bulk-reassign-dialog';
import { BulkAssignDialog } from './bulk-assign-dialog';

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
  const [unassignedOnly, setUnassignedOnly] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, unassignedOnly]);

  const listQueryKey = [
    'admin-approvers',
    'list',
    page,
    debouncedSearch,
    unassignedOnly,
  ] as const;

  const listQuery = useQuery({
    queryKey: listQueryKey,
    queryFn: () =>
      adminApproversApi.list({
        page,
        limit: PAGE_LIMIT,
        search: debouncedSearch || undefined,
        unassigned: unassignedOnly || undefined,
      }),
    placeholderData: (prev) => prev,
  });

  // Selection is a Set of employee ids owned here, so it survives paging and
  // filter changes (we hold ids, not row snapshots).
  const toggleOne = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const togglePage = (ids: number[], select: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (select) next.add(id);
        else next.delete(id);
      }
      return next;
    });

  const selectAllUnassigned = async () => {
    try {
      const ids = await adminApproversApi.allMatchingIds({
        unassigned: true,
        search: debouncedSearch || undefined,
      });
      setSelected((prev) => new Set([...prev, ...ids]));
    } catch {
      toast.error('Could not load the unassigned employees.');
    }
  };

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
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setUnassignedOnly((v) => !v)}
              aria-pressed={unassignedOnly}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium shadow-sm',
                'focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2',
                unassignedOnly
                  ? 'border-neutral-900 bg-neutral-900 text-white hover:bg-neutral-800'
                  : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50',
              )}
            >
              Only unassigned
            </button>
            <button
              type="button"
              onClick={() => setBulkOpen(true)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 shadow-sm',
                'hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2',
              )}
            >
              Bulk reassign…
            </button>
          </div>
        )}
      </div>

      {canUpdate && (selected.size > 0 || unassignedOnly) && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-neutral-200 bg-neutral-50 px-4 py-2.5">
          <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-700">
            <span className="font-medium">
              {selected.size} selected
            </span>
            {unassignedOnly && listQuery.data && listQuery.data.total > 0 && (
              <button
                type="button"
                onClick={selectAllUnassigned}
                className="text-sm font-medium text-neutral-900 underline underline-offset-2 hover:text-neutral-600"
              >
                Select all {listQuery.data.total} unassigned
              </button>
            )}
          </div>
          {selected.size > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className={cn(
                  'rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700',
                  'hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-900',
                )}
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setAssignOpen(true)}
                className={cn(
                  'rounded-md bg-neutral-950 px-3 py-1.5 text-sm font-medium text-white shadow-sm',
                  'hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2',
                )}
              >
                Assign approver…
              </button>
            </div>
          )}
        </div>
      )}

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
            selectedIds={selected}
            onToggleOne={toggleOne}
            onTogglePage={togglePage}
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

      {canUpdate && (
        <BulkAssignDialog
          open={assignOpen}
          onClose={() => setAssignOpen(false)}
          candidates={candidates}
          employeeIds={[...selected]}
          onAssigned={() => setSelected(new Set())}
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
