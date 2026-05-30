'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Plus, Search, Users } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { RequirePermission } from '@/components/require-permission';
import { Select } from '@/components/select';
import { useAuth } from '@/features/auth/use-auth';
import { usePermissions } from '@/features/auth/use-permissions';
import { hasPermission } from '@/features/auth/permission-utils';
import { adminUsersApi } from '@/features/admin-users/api';
import { ApiError } from '@/lib/api-client';
import { adminRolesApi } from '@/features/admin-roles/api';
import { formatRoleName } from '@/features/admin-roles/format';
import { AdminUsersTable } from '@/features/admin-users/components/admin-users-table';
import { CreateUserDrawer } from '@/features/admin-users/components/create-user-drawer';
import { EditUserDrawer } from '@/features/admin-users/components/edit-user-drawer';
import { ResetPasswordDrawer } from '@/features/admin-users/components/reset-password-drawer';
import { DeleteUserConfirm } from '@/features/admin-users/components/delete-user-confirm';
import { cn } from '@/lib/cn';
import type { AdminUser } from '@/features/admin-users/schemas';
import type { AdminRole } from '@/features/admin-roles/api';

const PAGE_LIMIT = 20;

function describeError(err: unknown): string {
  if (err instanceof ApiError) {
    const body = err.body as { message?: string | string[] } | null;
    const msg = Array.isArray(body?.message)
      ? body!.message.join(', ')
      : body?.message;
    return msg
      ? `${err.status}: ${msg}`
      : `Request failed (HTTP ${err.status}). Please try again.`;
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong while fetching the list.';
}

const filterInputCls = cn(
  'h-9 rounded-md border border-neutral-300 bg-white px-3 text-sm text-neutral-900 shadow-sm',
  'focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-1',
);

export default function AdminEmployeesPage() {
  return (
    <RequirePermission code="USER:View">
      <AdminEmployeesPageBody />
    </RequirePermission>
  );
}

function AdminEmployeesPageBody() {
  const { user } = useAuth();
  const { permissions } = usePermissions();
  const canCreate = hasPermission(permissions, 'USER:Create', user?.system_admin ?? false);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleId, setRoleId] = useState<number | ''>('');
  const [isActive, setIsActive] = useState<'' | 'true' | 'false'>('');

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [resetting, setResetting] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState<AdminUser | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, roleId, isActive]);

  const rolesQuery = useQuery({
    queryKey: ['admin-roles', 'list'],
    queryFn: () => adminRolesApi.list(),
    staleTime: 5 * 60 * 1000,
  });

  const hasFilters =
    debouncedSearch.length > 0 || roleId !== '' || isActive !== '';

  const listQuery = useQuery({
    queryKey: ['admin-users', 'list', page, debouncedSearch, roleId, isActive],
    queryFn: () =>
      adminUsersApi.list({
        page,
        limit: PAGE_LIMIT,
        search: debouncedSearch || undefined,
        role_id: roleId === '' ? undefined : roleId,
        is_active: isActive === '' ? undefined : isActive === 'true',
      }),
    placeholderData: (prev) => prev,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Toolbar
          search={search}
          onSearchChange={setSearch}
          roleId={roleId}
          onRoleChange={setRoleId}
          roles={rolesQuery.data?.data ?? []}
          isActive={isActive}
          onStatusChange={setIsActive}
        />
        {canCreate && (
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-md bg-neutral-950 px-3 py-2 text-sm font-medium text-white shadow-sm',
              'hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2',
            )}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add employee
          </button>
        )}
      </div>

      {listQuery.isLoading && <p className="text-sm text-neutral-500">Loading employees…</p>}
      {listQuery.error && (
        <EmptyState
          tone="error"
          icon={AlertTriangle}
          title="Couldn't load employees"
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
            title={hasFilters ? 'No employees match these filters' : 'No employees yet'}
            description={
              hasFilters
                ? 'Try adjusting your search or filters.'
                : 'Get started by adding your first employee.'
            }
          />
        ) : (
          <AdminUsersTable
            rows={listQuery.data.data}
            onEdit={setEditing}
            onResetPassword={setResetting}
            onDelete={setDeleting}
          />
        ))}

      {listQuery.data && listQuery.data.total > PAGE_LIMIT && (
        <Paginator
          page={listQuery.data.page}
          hasMore={listQuery.data.has_more}
          total={listQuery.data.total}
          limit={listQuery.data.limit}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => p + 1)}
        />
      )}

      <CreateUserDrawer open={createOpen} onClose={() => setCreateOpen(false)} />
      <EditUserDrawer user={editing} open={editing !== null} onClose={() => setEditing(null)} />
      <ResetPasswordDrawer
        user={resetting}
        open={resetting !== null}
        onClose={() => setResetting(null)}
      />
      <DeleteUserConfirm
        user={deleting}
        open={deleting !== null}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}

function Toolbar({
  search,
  onSearchChange,
  roleId,
  onRoleChange,
  roles,
  isActive,
  onStatusChange,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  roleId: number | '';
  onRoleChange: (v: number | '') => void;
  roles: AdminRole[];
  isActive: '' | 'true' | 'false';
  onStatusChange: (v: '' | 'true' | 'false') => void;
}) {
  return (
    <div className="flex flex-1 flex-wrap items-center gap-2">
      <div className="relative min-w-0 flex-1 sm:max-w-sm">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
          aria-hidden
        />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search name, email, or title…"
          aria-label="Search employees"
          className={cn(filterInputCls, 'w-full pl-8')}
        />
      </div>
      <Select<string>
        value={roleId === '' ? '' : String(roleId)}
        onValueChange={(v) => onRoleChange(v === '' ? '' : Number(v))}
        options={[
          { value: '', label: 'All roles' },
          ...roles.map((r) => ({ value: String(r.id), label: formatRoleName(r.name) })),
        ]}
        ariaLabel="Filter by role"
        className="w-44"
      />
      <Select<string>
        value={isActive}
        onValueChange={(v) => onStatusChange(v as '' | 'true' | 'false')}
        options={[
          { value: '', label: 'All statuses' },
          { value: 'true', label: 'Active' },
          { value: 'false', label: 'Inactive' },
        ]}
        ariaLabel="Filter by status"
        className="w-40"
      />
    </div>
  );
}

function Paginator({
  page,
  hasMore,
  total,
  limit,
  onPrev,
  onNext,
}: {
  page: number;
  hasMore: boolean;
  total: number;
  limit: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const start = (page - 1) * limit + 1;
  const end = Math.min(total, page * limit);
  return (
    <div className="flex items-center justify-between text-xs text-neutral-500">
      <span>
        Showing {start}–{end} of {total}
      </span>
      <div className="flex gap-2">
        <PagerButton onClick={onPrev} disabled={page === 1}>
          Previous
        </PagerButton>
        <PagerButton onClick={onNext} disabled={!hasMore}>
          Next
        </PagerButton>
      </div>
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
