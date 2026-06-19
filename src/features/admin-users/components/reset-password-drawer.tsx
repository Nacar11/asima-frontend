'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormDrawer } from '@/components/form-drawer';
import { Field } from '@/components/form/field';
import { useResetUserPassword } from '@/features/admin-users/hooks/use-reset-password-mutation';
import {
  ResetUserPasswordSchema,
  type AdminUser,
  type ResetUserPasswordInput,
} from '@/features/admin-users/schemas';

export function ResetPasswordDrawer({
  user,
  open,
  onClose,
}: {
  user: AdminUser | null;
  open: boolean;
  onClose: () => void;
}) {
  const form = useForm<ResetUserPasswordInput>({
    resolver: zodResolver(ResetUserPasswordSchema),
    defaultValues: { new_password: '' },
  });

  const mutation = useResetUserPassword(user?.id);

  const onSubmit = form.handleSubmit((input) =>
    mutation.mutate(input, {
      onSuccess: () => {
        form.reset();
        onClose();
      },
    }),
  );

  const title = `Reset password — ${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim();

  return (
    <FormDrawer
      open={open}
      onClose={onClose}
      contentClassName="sm:max-w-sm"
      title={title || 'Reset password'}
      description="Admin override — no current password required. Communicate the new password to the user out-of-band."
      formId="reset-password-form"
      onSubmit={onSubmit}
      submitLabel="Reset password"
      pendingLabel="Resetting…"
      submitting={mutation.isPending}
    >
      <Field label="New password" error={form.formState.errors.new_password?.message}>
        <input
          type="text"
          autoComplete="off"
          className={inputCls}
          {...form.register('new_password')}
        />
      </Field>
    </FormDrawer>
  );
}

const inputCls =
  'block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950';
