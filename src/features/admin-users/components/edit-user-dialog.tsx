'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Dialog } from '@/components/dialog';
import { cn } from '@/lib/cn';
import { adminUsersApi } from '@/features/admin-users/api';
import { adminRolesApi } from '@/features/admin-roles/api';
import { formatRoleName } from '@/features/admin-roles/format';
import {
  UpdateAdminUserSchema,
  type AdminUser,
  type UpdateAdminUserInput,
} from '@/features/admin-users/schemas';

export function EditUserDialog({
  user,
  open,
  onClose,
}: {
  user: AdminUser | null;
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();

  const rolesQuery = useQuery({
    queryKey: ['admin-roles', 'list'],
    queryFn: () => adminRolesApi.list(),
    enabled: open,
  });

  const form = useForm<UpdateAdminUserInput>({
    resolver: zodResolver(UpdateAdminUserSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      title: '',
      role_id: 0,
      is_active: true,
    },
  });

  // Re-seed form whenever the selected user changes.
  useEffect(() => {
    if (user) {
      form.reset({
        first_name: user.first_name,
        last_name: user.last_name,
        title: user.title ?? '',
        role_id: user.role_id,
        is_active: user.is_active,
      });
    }
  }, [user, form]);

  const mutation = useMutation({
    mutationFn: (input: UpdateAdminUserInput) => {
      if (!user) throw new Error('No user selected');
      return adminUsersApi.update(user.id, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Employee updated.');
      onClose();
    },
    onError: () => toast.error('Could not update employee.'),
  });

  const onSubmit = form.handleSubmit((input) => {
    const payload: UpdateAdminUserInput = {
      ...input,
      title: input.title?.length ? input.title : null,
    };
    mutation.mutate(payload);
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Edit ${user?.first_name ?? ''} ${user?.last_name ?? ''}`}
      description="Email changes need a verification flow — not editable here. Use Reset password to set a new password."
      widthClass="max-w-lg"
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" error={form.formState.errors.first_name?.message}>
            <input type="text" className={inputCls} {...form.register('first_name')} />
          </Field>
          <Field label="Last name" error={form.formState.errors.last_name?.message}>
            <input type="text" className={inputCls} {...form.register('last_name')} />
          </Field>
        </div>

        <Field label="Title" error={form.formState.errors.title?.message}>
          <input type="text" className={inputCls} {...form.register('title')} />
        </Field>

        <Field label="Role" error={form.formState.errors.role_id?.message}>
          <select
            className={inputCls}
            {...form.register('role_id', { valueAsNumber: true })}
            disabled={rolesQuery.isLoading}
          >
            {rolesQuery.data?.data.map((role) => (
              <option key={role.id} value={role.id}>
                {formatRoleName(role.name)}
              </option>
            ))}
          </select>
        </Field>

        <label className="flex items-center gap-2 text-sm text-neutral-800">
          <input type="checkbox" className="h-4 w-4 rounded border-neutral-300" {...form.register('is_active')} />
          Active
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className={btnSecondary}>
            Cancel
          </button>
          <button type="submit" disabled={mutation.isPending} className={btnPrimary}>
            {mutation.isPending ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

const inputCls =
  'block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950 disabled:bg-neutral-50';

const btnPrimary = cn(
  'rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white shadow-sm',
  'hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2',
  'disabled:cursor-not-allowed disabled:opacity-60',
);

const btnSecondary = cn(
  'rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700',
  'hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-900',
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
