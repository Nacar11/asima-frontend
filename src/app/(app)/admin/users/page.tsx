'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { RequirePermission } from '@/components/require-permission';
import { useAuth } from '@/features/auth/use-auth';
import { usePermissions } from '@/features/auth/use-permissions';
import { hasPermission } from '@/features/auth/permission-utils';
import { adminUsersApi } from '@/features/admin-users/api';
import { AdminUsersTable } from '@/features/admin-users/components/admin-users-table';
import { CreateUserDialog } from '@/features/admin-users/components/create-user-dialog';
import { EditUserDialog } from '@/features/admin-users/components/edit-user-dialog';
import { ResetPasswordDialog } from '@/features/admin-users/components/reset-password-dialog';
import { DeleteUserConfirm } from '@/features/admin-users/components/delete-user-confirm';
import { cn } from '@/lib/cn';
import type { AdminUser } from '@/features/admin-users/schemas';

const PAGE_LIMIT = 20;

export default function AdminUsersPage() {
  return (
    <RequirePermission code="USER:View">
      <AdminUsersPageBody />
    </RequirePermission>
  );
}

function AdminUsersPageBody() {
  const { user } = useAuth();
  const { permissions } = usePermissions();
  const canCreate = hasPermission(permissions, 'USER:Create', user?.system_admin ?? false);

  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [resetting, setResetting] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState<AdminUser | null>(null);

  const listQuery = useQuery({
    queryKey: ['admin-users', 'list', page],
    queryFn: () => adminUsersApi.list({ page, limit: PAGE_LIMIT }),
    placeholderData: (prev) => prev,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-950">Employees</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Create, edit, and manage employee accounts.
          </p>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md bg-neutral-950 px-3 py-2 text-sm font-medium text-white shadow-sm',
              'hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2',
            )}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add employee
          </button>
        )}
      </div>

      {listQuery.isLoading && <p className="text-sm text-neutral-500">Loading employees…</p>}
      {listQuery.error && <p className="text-sm text-red-700">Could not load employees.</p>}
      {listQuery.data && (
        <AdminUsersTable
          rows={listQuery.data.data}
          onEdit={setEditing}
          onResetPassword={setResetting}
          onDelete={setDeleting}
        />
      )}

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

      <CreateUserDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      <EditUserDialog user={editing} open={editing !== null} onClose={() => setEditing(null)} />
      <ResetPasswordDialog
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
