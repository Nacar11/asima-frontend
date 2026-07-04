'use client';

import { KeyRound, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '@/features/auth';
import { usePermissions } from '@/features/auth';
import { hasPermission } from '@/features/auth';
import { formatDateInTz } from '@/lib/format';
import { formatRoleName } from '@/features/admin-roles';
import { cn } from '@/lib/cn';
import type { AdminUser } from '../schemas';

export function AdminUsersTable({
  rows,
  onEdit,
  onResetPassword,
  onDelete,
}: {
  rows: AdminUser[];
  onEdit: (user: AdminUser) => void;
  onResetPassword: (user: AdminUser) => void;
  onDelete: (user: AdminUser) => void;
}) {
  const { user } = useAuth();
  const { permissions } = usePermissions();
  const isSysAdmin = user?.system_admin ?? false;
  const canUpdate = hasPermission(permissions, 'USER:Update', isSysAdmin);
  const canDelete = hasPermission(permissions, 'USER:Delete', isSysAdmin);

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200">
      <table className="min-w-full divide-y divide-neutral-200">
        <thead className="bg-neutral-50">
          <tr>
            <Th>Name</Th>
            <Th>Email</Th>
            <Th>Title</Th>
            <Th>Role</Th>
            <Th>Status</Th>
            <Th>Created</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100 bg-white">
          {rows.map((row) => (
            <tr key={row.id}>
              <Td className="font-medium">
                {row.first_name} {row.last_name}
              </Td>
              <Td className="text-neutral-600">{row.email}</Td>
              <Td className="text-neutral-600">{row.title ?? '—'}</Td>
              <Td>
                <span className="rounded-md bg-neutral-100 px-2 py-0.5 font-mono text-xs text-neutral-700">
                  {formatRoleName(row.role.name)}
                </span>
              </Td>
              <Td>
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 text-xs font-medium',
                    row.is_active ? 'text-emerald-700' : 'text-neutral-500',
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      row.is_active ? 'bg-emerald-500' : 'bg-neutral-400',
                    )}
                  />
                  {row.is_active ? 'Active' : 'Inactive'}
                </span>
              </Td>
              <Td className="text-xs text-neutral-500">{formatDateInTz(row.created_at)}</Td>
              <Td className="text-right">
                <div className="flex justify-end gap-1">
                  {canUpdate && (
                    <RowButton onClick={() => onEdit(row)} aria-label={`Edit ${row.first_name}`}>
                      <Pencil className="h-3.5 w-3.5" aria-hidden /> Edit
                    </RowButton>
                  )}
                  {canUpdate && (
                    <RowButton
                      onClick={() => onResetPassword(row)}
                      aria-label={`Reset password for ${row.first_name}`}
                    >
                      <KeyRound className="h-3.5 w-3.5" aria-hidden /> Reset
                    </RowButton>
                  )}
                  {canDelete && (
                    <RowButton
                      onClick={() => onDelete(row)}
                      aria-label={`Delete ${row.first_name}`}
                      destructive
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden /> Delete
                    </RowButton>
                  )}
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const Th = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <th
    scope="col"
    className={cn(
      'px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-neutral-600',
      className,
    )}
  >
    {children}
  </th>
);

const Td = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <td className={cn('px-4 py-2.5 text-sm text-neutral-800', className)}>{children}</td>
);

function RowButton({
  children,
  destructive,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { destructive?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors',
        destructive
          ? 'border-red-200 text-red-700 hover:bg-red-50'
          : 'border-neutral-300 text-neutral-700 hover:bg-neutral-50',
        'focus:outline-none focus:ring-2 focus:ring-neutral-900',
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
