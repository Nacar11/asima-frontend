'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { FormDrawer } from '@/components/form-drawer';
import { Field } from '@/components/form/field';
import { adminRolesApi } from '@/features/admin-roles';
import { adminRoleKeys } from '@/features/admin-roles';
import { formatRoleName } from '@/features/admin-roles';
import { useCreateAdminUser } from '../hooks/use-create-user-mutation';
import { CreateAdminUserSchema, type CreateAdminUserInput } from '../schemas';

export function CreateUserDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const rolesQuery = useQuery({
    queryKey: adminRoleKeys.list(),
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

  const mutation = useCreateAdminUser();

  const onSubmit = form.handleSubmit((input) => {
    // Drop empty optional title so backend treats it as omitted.
    const payload: CreateAdminUserInput = {
      ...input,
      title: input.title?.length ? input.title : null,
    };
    mutation.mutate(payload, {
      onSuccess: () => {
        form.reset();
        onClose();
      },
    });
  });

  return (
    <FormDrawer
      open={open}
      onClose={onClose}
      title="Add employee"
      description="They'll be able to sign in with this email + password."
      formId="create-user-form"
      onSubmit={onSubmit}
      submitLabel="Create employee"
      pendingLabel="Creating…"
      submitting={mutation.isPending}
    >
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
    </FormDrawer>
  );
}

const inputCls =
  'block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950 disabled:bg-neutral-50';
