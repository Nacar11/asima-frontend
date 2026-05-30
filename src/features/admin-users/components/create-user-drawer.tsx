'use client';

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
import { ApiError } from '@/lib/api-client';
import { cn } from '@/lib/cn';
import { adminUsersApi } from '@/features/admin-users/api';
import { adminRolesApi } from '@/features/admin-roles/api';
import { formatRoleName } from '@/features/admin-roles/format';
import {
  CreateAdminUserSchema,
  type CreateAdminUserInput,
} from '@/features/admin-users/schemas';

export function CreateUserDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();

  const rolesQuery = useQuery({
    queryKey: ['admin-roles', 'list'],
    queryFn: () => adminRolesApi.list(),
    enabled: open,
  });

  const form = useForm<CreateAdminUserInput>({
    resolver: zodResolver(CreateAdminUserSchema),
    defaultValues: {
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      title: '',
      role_id: 0,
      is_active: true,
    },
  });

  const mutation = useMutation({
    mutationFn: (input: CreateAdminUserInput) => adminUsersApi.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Employee created.');
      form.reset();
      onClose();
    },
    onError: (err) => {
      if (err instanceof ApiError && err.status === 409) {
        toast.error('Email already in use.');
        return;
      }
      toast.error('Could not create employee.');
    },
  });

  const onSubmit = form.handleSubmit((input) => {
    // Drop empty optional title so backend treats it as omitted.
    const payload: CreateAdminUserInput = {
      ...input,
      title: input.title?.length ? input.title : null,
    };
    mutation.mutate(payload);
  });

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Add employee</SheetTitle>
          <SheetDescription>
            They&apos;ll be able to sign in with this email + password.
          </SheetDescription>
        </SheetHeader>

        <SheetBody>
          <form id="create-user-form" onSubmit={onSubmit} className="space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First name" error={form.formState.errors.first_name?.message}>
                <input type="text" className={inputCls} {...form.register('first_name')} />
              </Field>
              <Field label="Last name" error={form.formState.errors.last_name?.message}>
                <input type="text" className={inputCls} {...form.register('last_name')} />
              </Field>
            </div>

            <Field label="Email" error={form.formState.errors.email?.message}>
              <input type="email" autoComplete="off" className={inputCls} {...form.register('email')} />
            </Field>

            <Field label="Initial password" error={form.formState.errors.password?.message}>
              <input type="text" autoComplete="off" className={inputCls} {...form.register('password')} />
            </Field>

            <Field label="Title (optional)" error={form.formState.errors.title?.message}>
              <input type="text" className={inputCls} {...form.register('title')} />
            </Field>

            <Field label="Role" error={form.formState.errors.role_id?.message}>
              <select
                className={inputCls}
                {...form.register('role_id', { valueAsNumber: true })}
                disabled={rolesQuery.isLoading}
              >
                <option value={0}>{rolesQuery.isLoading ? 'Loading…' : 'Select a role'}</option>
                {rolesQuery.data?.data.map((role) => (
                  <option key={role.id} value={role.id}>
                    {formatRoleName(role.name)}
                  </option>
                ))}
              </select>
            </Field>
          </form>
        </SheetBody>

        <SheetFooter>
          <button type="button" onClick={onClose} className={btnSecondary}>
            Cancel
          </button>
          <button
            type="submit"
            form="create-user-form"
            disabled={mutation.isPending}
            className={btnPrimary}
          >
            {mutation.isPending ? 'Creating…' : 'Create employee'}
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
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
